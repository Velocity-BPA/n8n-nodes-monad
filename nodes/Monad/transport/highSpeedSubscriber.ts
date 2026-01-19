/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';
import WebSocket from 'ws';
import { WS_RECONNECT_INTERVAL } from '../constants/networks';

/**
 * High-Speed Subscriber for Monad Events
 * 
 * Optimized for Monad's 10,000+ TPS capability with WebSocket subscriptions
 * and efficient event processing.
 */

export type SubscriptionType = 
  | 'newHeads'
  | 'newPendingTransactions'
  | 'logs'
  | 'syncing';

export interface SubscriptionFilter {
  address?: string | string[];
  topics?: (string | string[] | null)[];
}

export interface SubscriptionMessage {
  type: SubscriptionType;
  data: unknown;
  timestamp: number;
}

export type MessageHandler = (message: SubscriptionMessage) => void | Promise<void>;

export interface SubscriptionOptions {
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  bufferSize?: number;
}

export class HighSpeedSubscriber {
  private wsUrl: string;
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, { type: SubscriptionType; handler: MessageHandler }> = new Map();
  private options: Required<SubscriptionOptions>;
  private reconnectAttempts: number = 0;
  private isConnecting: boolean = false;
  private messageBuffer: SubscriptionMessage[] = [];
  private subscriptionIdCounter: number = 1;

  constructor(wsUrl: string, options: SubscriptionOptions = {}) {
    this.wsUrl = wsUrl;
    this.options = {
      reconnect: options.reconnect ?? true,
      reconnectInterval: options.reconnectInterval ?? WS_RECONNECT_INTERVAL,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 10,
      bufferSize: options.bufferSize ?? 1000,
    };
  }

  /**
   * Connects to the WebSocket endpoint
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.on('open', () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Re-establish subscriptions
          this.resubscribeAll();
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.handleMessage(data.toString());
        });

        this.ws.on('close', () => {
          this.isConnecting = false;
          this.handleDisconnect();
        });

        this.ws.on('error', (error: Error) => {
          this.isConnecting = false;
          if (this.reconnectAttempts === 0) {
            reject(error);
          }
          this.handleDisconnect();
        });
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnects from the WebSocket endpoint
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
  }

  /**
   * Subscribes to new block headers
   */
  async subscribeToBlocks(handler: MessageHandler): Promise<string> {
    return this.subscribe('newHeads', {}, handler);
  }

  /**
   * Subscribes to pending transactions
   */
  async subscribeToPendingTransactions(handler: MessageHandler): Promise<string> {
    return this.subscribe('newPendingTransactions', {}, handler);
  }

  /**
   * Subscribes to contract events/logs
   */
  async subscribeToLogs(
    filter: SubscriptionFilter,
    handler: MessageHandler
  ): Promise<string> {
    return this.subscribe('logs', filter, handler);
  }

  /**
   * Subscribes to sync status changes
   */
  async subscribeToSyncing(handler: MessageHandler): Promise<string> {
    return this.subscribe('syncing', {}, handler);
  }

  /**
   * Generic subscription method
   */
  async subscribe(
    type: SubscriptionType,
    params: SubscriptionFilter | Record<string, never>,
    handler: MessageHandler
  ): Promise<string> {
    await this.connect();

    const subscriptionId = `sub_${this.subscriptionIdCounter++}`;
    
    // Send subscription request
    const request = {
      jsonrpc: '2.0',
      id: subscriptionId,
      method: 'eth_subscribe',
      params: type === 'logs' ? [type, params] : [type],
    };

    this.ws?.send(JSON.stringify(request));

    // Store subscription
    this.subscriptions.set(subscriptionId, { type, handler });

    return subscriptionId;
  }

  /**
   * Unsubscribes from a specific subscription
   */
  async unsubscribe(subscriptionId: string): Promise<boolean> {
    if (!this.subscriptions.has(subscriptionId)) {
      return false;
    }

    const request = {
      jsonrpc: '2.0',
      id: `unsub_${subscriptionId}`,
      method: 'eth_unsubscribe',
      params: [subscriptionId],
    };

    this.ws?.send(JSON.stringify(request));
    this.subscriptions.delete(subscriptionId);

    return true;
  }

  /**
   * Unsubscribes from all subscriptions
   */
  async unsubscribeAll(): Promise<void> {
    const promises = Array.from(this.subscriptions.keys()).map(id => 
      this.unsubscribe(id)
    );
    await Promise.all(promises);
  }

  /**
   * Checks if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Gets active subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Handles incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      // Handle subscription notification
      if (message.method === 'eth_subscription') {
        const subscriptionId = message.params?.subscription;
        const subscription = this.subscriptions.get(subscriptionId);

        if (subscription) {
          const subscriptionMessage: SubscriptionMessage = {
            type: subscription.type,
            data: message.params?.result,
            timestamp: Date.now(),
          };

          // Buffer message if buffer is enabled
          if (this.options.bufferSize > 0) {
            this.messageBuffer.push(subscriptionMessage);
            if (this.messageBuffer.length > this.options.bufferSize) {
              this.messageBuffer.shift();
            }
          }

          // Call handler
          subscription.handler(subscriptionMessage);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  /**
   * Handles WebSocket disconnection
   */
  private handleDisconnect(): void {
    if (!this.options.reconnect) {
      return;
    }

    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    
    setTimeout(() => {
      this.connect().catch(() => {
        // Reconnection will be retried
      });
    }, this.options.reconnectInterval);
  }

  /**
   * Re-establishes subscriptions after reconnect
   */
  private resubscribeAll(): void {
    const subscriptionsCopy = new Map(this.subscriptions);
    this.subscriptions.clear();

    subscriptionsCopy.forEach((sub, _id) => {
      this.subscribe(sub.type, {}, sub.handler).catch(() => {
        // Subscription failed, will be retried on next reconnect
      });
    });
  }

  /**
   * Gets buffered messages
   */
  getBufferedMessages(): SubscriptionMessage[] {
    return [...this.messageBuffer];
  }

  /**
   * Clears the message buffer
   */
  clearBuffer(): void {
    this.messageBuffer = [];
  }
}

/**
 * Creates event filter for common patterns
 */
export function createEventFilter(params: {
  contract?: string;
  eventSignature?: string;
  topics?: (string | null)[];
}): SubscriptionFilter {
  const filter: SubscriptionFilter = {};

  if (params.contract) {
    filter.address = params.contract;
  }

  if (params.eventSignature || params.topics) {
    filter.topics = [];
    
    if (params.eventSignature) {
      filter.topics.push(ethers.id(params.eventSignature));
    }
    
    if (params.topics) {
      filter.topics.push(...params.topics);
    }
  }

  return filter;
}

/**
 * Creates a transfer event filter
 */
export function createTransferFilter(tokenAddress?: string): SubscriptionFilter {
  return createEventFilter({
    contract: tokenAddress,
    eventSignature: 'Transfer(address,address,uint256)',
  });
}

/**
 * Creates an approval event filter
 */
export function createApprovalFilter(tokenAddress?: string): SubscriptionFilter {
  return createEventFilter({
    contract: tokenAddress,
    eventSignature: 'Approval(address,address,uint256)',
  });
}

/**
 * Batch processor for high-throughput events
 */
export class EventBatchProcessor {
  private batch: SubscriptionMessage[] = [];
  private batchSize: number;
  private flushInterval: number;
  private processor: (batch: SubscriptionMessage[]) => Promise<void>;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    processor: (batch: SubscriptionMessage[]) => Promise<void>,
    batchSize: number = 100,
    flushInterval: number = 1000
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.startTimer();
  }

  add(message: SubscriptionMessage): void {
    this.batch.push(message);
    
    if (this.batch.length >= this.batchSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.batch.length === 0) {
      return;
    }

    const batchToProcess = [...this.batch];
    this.batch = [];
    
    await this.processor(batchToProcess);
  }

  private startTimer(): void {
    this.timer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.flushInterval);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
