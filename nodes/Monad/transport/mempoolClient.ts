/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';
import { MonadClient } from './monadClient';

/**
 * Mempool Client for Monad
 * 
 * Provides access to pending transaction pool for monitoring
 * and analysis. Useful for MEV research, gas price analysis,
 * and transaction monitoring.
 */

export interface PendingTransaction {
  hash: string;
  from: string;
  to: string | null;
  value: bigint;
  gasPrice: bigint;
  maxFeePerGas: bigint | null;
  maxPriorityFeePerGas: bigint | null;
  gas: bigint;
  nonce: number;
  data: string;
  type: number;
  chainId: number;
}

export interface MempoolStats {
  pending: number;
  queued: number;
  total: number;
  timestamp: number;
}

export interface GasPriceDistribution {
  min: bigint;
  max: bigint;
  median: bigint;
  mean: bigint;
  percentile25: bigint;
  percentile75: bigint;
  percentile90: bigint;
}

export interface MempoolAnalysis {
  stats: MempoolStats;
  gasPriceDistribution: GasPriceDistribution;
  topGasPayers: PendingTransaction[];
  transactionTypes: Record<string, number>;
}

export class MempoolClient {
  private monadClient: MonadClient;
  private provider: ethers.JsonRpcProvider;

  constructor(monadClient: MonadClient) {
    this.monadClient = monadClient;
    this.provider = monadClient.getProvider();
  }

  /**
   * Gets all pending transactions from the mempool
   */
  async getPendingTransactions(): Promise<PendingTransaction[]> {
    try {
      const result = await this.monadClient.rpcCall('txpool_content', []);
      const content = result as { pending: Record<string, Record<string, unknown>>; queued: Record<string, Record<string, unknown>> };
      
      const transactions: PendingTransaction[] = [];

      // Process pending transactions
      for (const address of Object.keys(content.pending || {})) {
        const nonces = content.pending[address];
        for (const nonce of Object.keys(nonces)) {
          const tx = nonces[nonce] as Record<string, unknown>;
          transactions.push(this.parsePendingTransaction(tx));
        }
      }

      // Process queued transactions
      for (const address of Object.keys(content.queued || {})) {
        const nonces = content.queued[address];
        for (const nonce of Object.keys(nonces)) {
          const tx = nonces[nonce] as Record<string, unknown>;
          transactions.push(this.parsePendingTransaction(tx));
        }
      }

      return transactions;
    } catch {
      // txpool methods may not be available
      return [];
    }
  }

  /**
   * Gets mempool statistics
   */
  async getMempoolStats(): Promise<MempoolStats> {
    try {
      const result = await this.monadClient.rpcCall('txpool_status', []);
      const status = result as { pending: string; queued: string };
      
      const pending = parseInt(status.pending, 16);
      const queued = parseInt(status.queued, 16);

      return {
        pending,
        queued,
        total: pending + queued,
        timestamp: Date.now(),
      };
    } catch {
      return {
        pending: 0,
        queued: 0,
        total: 0,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Gets a specific pending transaction by hash
   */
  async getPendingTransaction(txHash: string): Promise<PendingTransaction | null> {
    try {
      const tx = await this.provider.getTransaction(txHash);
      
      if (!tx || tx.blockNumber !== null) {
        return null; // Not pending or not found
      }

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        gasPrice: tx.gasPrice || 0n,
        maxFeePerGas: tx.maxFeePerGas,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
        gas: tx.gasLimit,
        nonce: tx.nonce,
        data: tx.data,
        type: tx.type || 0,
        chainId: Number(tx.chainId),
      };
    } catch {
      return null;
    }
  }

  /**
   * Gets the mempool size
   */
  async getMempoolSize(): Promise<number> {
    const stats = await this.getMempoolStats();
    return stats.total;
  }

  /**
   * Gets gas price distribution in the mempool
   */
  async getGasPriceDistribution(): Promise<GasPriceDistribution> {
    const transactions = await this.getPendingTransactions();
    
    if (transactions.length === 0) {
      const zero = 0n;
      return {
        min: zero,
        max: zero,
        median: zero,
        mean: zero,
        percentile25: zero,
        percentile75: zero,
        percentile90: zero,
      };
    }

    // Extract effective gas prices
    const gasPrices = transactions.map(tx => {
      if (tx.maxFeePerGas) {
        return tx.maxFeePerGas;
      }
      return tx.gasPrice;
    }).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    const len = gasPrices.length;
    const sum = gasPrices.reduce((acc, price) => acc + price, 0n);

    return {
      min: gasPrices[0],
      max: gasPrices[len - 1],
      median: gasPrices[Math.floor(len / 2)],
      mean: sum / BigInt(len),
      percentile25: gasPrices[Math.floor(len * 0.25)],
      percentile75: gasPrices[Math.floor(len * 0.75)],
      percentile90: gasPrices[Math.floor(len * 0.90)],
    };
  }

  /**
   * Gets comprehensive mempool analysis
   */
  async analyzemempool(): Promise<MempoolAnalysis> {
    const [transactions, stats] = await Promise.all([
      this.getPendingTransactions(),
      this.getMempoolStats(),
    ]);

    // Gas price distribution
    const gasPrices = transactions
      .map(tx => tx.maxFeePerGas || tx.gasPrice)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    const len = gasPrices.length;
    const sum = gasPrices.reduce((acc, price) => acc + price, 0n);

    const gasPriceDistribution: GasPriceDistribution = len > 0 ? {
      min: gasPrices[0],
      max: gasPrices[len - 1],
      median: gasPrices[Math.floor(len / 2)],
      mean: sum / BigInt(len),
      percentile25: gasPrices[Math.floor(len * 0.25)] || 0n,
      percentile75: gasPrices[Math.floor(len * 0.75)] || 0n,
      percentile90: gasPrices[Math.floor(len * 0.90)] || 0n,
    } : {
      min: 0n,
      max: 0n,
      median: 0n,
      mean: 0n,
      percentile25: 0n,
      percentile75: 0n,
      percentile90: 0n,
    };

    // Top gas payers
    const topGasPayers = [...transactions]
      .sort((a, b) => {
        const aPrice = a.maxFeePerGas || a.gasPrice;
        const bPrice = b.maxFeePerGas || b.gasPrice;
        return bPrice < aPrice ? -1 : bPrice > aPrice ? 1 : 0;
      })
      .slice(0, 10);

    // Transaction types distribution
    const transactionTypes: Record<string, number> = {};
    for (const tx of transactions) {
      const type = this.getTransactionType(tx);
      transactionTypes[type] = (transactionTypes[type] || 0) + 1;
    }

    return {
      stats,
      gasPriceDistribution,
      topGasPayers,
      transactionTypes,
    };
  }

  /**
   * Watches for a specific transaction in the mempool
   */
  async watchTransaction(
    txHash: string,
    timeoutMs: number = 60000
  ): Promise<{ found: boolean; mined: boolean; receipt: ethers.TransactionReceipt | null }> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      // Check if transaction is still pending
      const tx = await this.provider.getTransaction(txHash);
      
      if (!tx) {
        // Not found in mempool yet
        await this.sleep(1000);
        continue;
      }

      if (tx.blockNumber !== null) {
        // Transaction has been mined
        const receipt = await this.provider.getTransactionReceipt(txHash);
        return { found: true, mined: true, receipt };
      }

      // Still pending
      await this.sleep(1000);
    }

    return { found: false, mined: false, receipt: null };
  }

  /**
   * Gets pending transactions from a specific address
   */
  async getPendingFromAddress(address: string): Promise<PendingTransaction[]> {
    const allPending = await this.getPendingTransactions();
    return allPending.filter(
      tx => tx.from.toLowerCase() === address.toLowerCase()
    );
  }

  /**
   * Gets pending transactions to a specific address
   */
  async getPendingToAddress(address: string): Promise<PendingTransaction[]> {
    const allPending = await this.getPendingTransactions();
    return allPending.filter(
      tx => tx.to?.toLowerCase() === address.toLowerCase()
    );
  }

  /**
   * Parses a raw pending transaction
   */
  private parsePendingTransaction(tx: Record<string, unknown>): PendingTransaction {
    return {
      hash: tx.hash as string,
      from: tx.from as string,
      to: (tx.to as string) || null,
      value: BigInt(tx.value as string || '0'),
      gasPrice: BigInt(tx.gasPrice as string || '0'),
      maxFeePerGas: tx.maxFeePerGas ? BigInt(tx.maxFeePerGas as string) : null,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas ? BigInt(tx.maxPriorityFeePerGas as string) : null,
      gas: BigInt(tx.gas as string || '21000'),
      nonce: parseInt(tx.nonce as string, 16),
      data: tx.input as string || '0x',
      type: parseInt(tx.type as string || '0', 16),
      chainId: parseInt(tx.chainId as string || '1', 16),
    };
  }

  /**
   * Determines transaction type from data
   */
  private getTransactionType(tx: PendingTransaction): string {
    if (!tx.to) {
      return 'Contract Deployment';
    }
    
    if (tx.data === '0x' || tx.data === '') {
      return 'Native Transfer';
    }
    
    const selector = tx.data.slice(0, 10);
    
    // Common function selectors
    const knownSelectors: Record<string, string> = {
      '0xa9059cbb': 'ERC20 Transfer',
      '0x23b872dd': 'ERC20 TransferFrom',
      '0x095ea7b3': 'ERC20 Approve',
      '0x42842e0e': 'ERC721 SafeTransferFrom',
      '0xf242432a': 'ERC1155 SafeTransferFrom',
      '0x38ed1739': 'DEX Swap',
      '0x7ff36ab5': 'DEX Swap ETH',
      '0x18cbafe5': 'DEX Swap Tokens for ETH',
    };

    return knownSelectors[selector] || 'Contract Call';
  }

  /**
   * Helper sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Helper to format pending transaction for n8n output
 */
export function formatPendingTransaction(tx: PendingTransaction): Record<string, unknown> {
  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: tx.value.toString(),
    valueEther: ethers.formatEther(tx.value),
    gasPrice: tx.gasPrice.toString(),
    gasPriceGwei: ethers.formatUnits(tx.gasPrice, 'gwei'),
    maxFeePerGas: tx.maxFeePerGas?.toString(),
    maxFeePerGasGwei: tx.maxFeePerGas ? ethers.formatUnits(tx.maxFeePerGas, 'gwei') : null,
    maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
    maxPriorityFeePerGasGwei: tx.maxPriorityFeePerGas ? ethers.formatUnits(tx.maxPriorityFeePerGas, 'gwei') : null,
    gasLimit: tx.gas.toString(),
    nonce: tx.nonce,
    dataLength: tx.data.length,
    type: tx.type,
    chainId: tx.chainId,
  };
}

/**
 * Helper to format mempool stats for n8n output
 */
export function formatMempoolStats(stats: MempoolStats): Record<string, unknown> {
  return {
    pending: stats.pending,
    queued: stats.queued,
    total: stats.total,
    timestamp: stats.timestamp,
    timestampDate: new Date(stats.timestamp).toISOString(),
  };
}
