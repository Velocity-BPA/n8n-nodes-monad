/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';
import type { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { getNetworkConfig, RPC_TIMEOUT, MAX_RETRY_ATTEMPTS } from '../constants/networks';

// Emit licensing notice once per load
let licenseNoticeEmitted = false;
function emitLicenseNotice(): void {
  if (!licenseNoticeEmitted) {
    console.warn(
      '[Velocity BPA Licensing Notice] ' +
      'This n8n node is licensed under the Business Source License 1.1 (BSL 1.1). ' +
      'Use of this node by for-profit organizations in production environments requires ' +
      'a commercial license from Velocity BPA. For licensing information, visit ' +
      'https://velobpa.com/licensing or contact licensing@velobpa.com.'
    );
    licenseNoticeEmitted = true;
  }
}

export interface MonadClientConfig {
  network: string;
  rpcUrl?: string;
  wsUrl?: string;
  privateKey?: string;
  chainId?: number;
  explorerApiKey?: string;
}

export interface TransactionConfig {
  to: string;
  value?: bigint;
  data?: string;
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
}

export class MonadClient {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet | null = null;
  private config: MonadClientConfig;
  private networkConfig: ReturnType<typeof getNetworkConfig>;

  constructor(config: MonadClientConfig) {
    emitLicenseNotice();
    
    this.config = config;
    this.networkConfig = getNetworkConfig(config.network, {
      rpcUrl: config.rpcUrl,
      wsUrl: config.wsUrl,
      chainId: config.chainId,
    });

    // Initialize provider
    const rpcUrl = config.rpcUrl || this.networkConfig.rpcUrl;
    this.provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
      staticNetwork: true,
      polling: true,
      pollingInterval: 1000, // 1 second for high-speed Monad
    });

    // Initialize signer if private key is provided
    if (config.privateKey) {
      const key = config.privateKey.startsWith('0x') 
        ? config.privateKey 
        : `0x${config.privateKey}`;
      this.signer = new ethers.Wallet(key, this.provider);
    }
  }

  /**
   * Creates a MonadClient from n8n credentials
   */
  static async fromCredentials(
    context: IExecuteFunctions | ILoadOptionsFunctions,
    credentialName: string = 'monadNetwork'
  ): Promise<MonadClient> {
    const credentials = await context.getCredentials(credentialName);
    
    return new MonadClient({
      network: credentials.network as string,
      rpcUrl: credentials.rpcUrl as string | undefined,
      wsUrl: credentials.wsUrl as string | undefined,
      privateKey: credentials.privateKey as string | undefined,
      chainId: credentials.chainId as number | undefined,
      explorerApiKey: credentials.explorerApiKey as string | undefined,
    });
  }

  /**
   * Gets the provider instance
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  /**
   * Gets the signer instance (throws if not available)
   */
  getSigner(): ethers.Wallet {
    if (!this.signer) {
      throw new Error('No private key configured. Signer not available.');
    }
    return this.signer;
  }

  /**
   * Checks if a signer is available
   */
  hasSigner(): boolean {
    return this.signer !== null;
  }

  /**
   * Gets the network configuration
   */
  getNetworkConfig(): ReturnType<typeof getNetworkConfig> {
    return this.networkConfig;
  }

  /**
   * Gets the address of the configured signer
   */
  getAddress(): string {
    return this.getSigner().address;
  }

  /**
   * Gets the current chain ID
   */
  async getChainId(): Promise<number> {
    const network = await this.provider.getNetwork();
    return Number(network.chainId);
  }

  /**
   * Gets the balance of an address
   */
  async getBalance(address: string): Promise<bigint> {
    return this.provider.getBalance(address);
  }

  /**
   * Gets the transaction count (nonce) for an address
   */
  async getTransactionCount(address: string): Promise<number> {
    return this.provider.getTransactionCount(address);
  }

  /**
   * Gets the current block number
   */
  async getBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  /**
   * Gets a block by number or hash
   */
  async getBlock(blockHashOrNumber: string | number): Promise<ethers.Block | null> {
    return this.provider.getBlock(blockHashOrNumber);
  }

  /**
   * Gets a transaction by hash
   */
  async getTransaction(txHash: string): Promise<ethers.TransactionResponse | null> {
    return this.provider.getTransaction(txHash);
  }

  /**
   * Gets a transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
    return this.provider.getTransactionReceipt(txHash);
  }

  /**
   * Sends a transaction
   */
  async sendTransaction(config: TransactionConfig): Promise<ethers.TransactionResponse> {
    const signer = this.getSigner();
    
    const tx: ethers.TransactionRequest = {
      to: config.to,
      value: config.value,
      data: config.data,
      gasLimit: config.gasLimit,
      nonce: config.nonce,
    };

    // Use EIP-1559 if available
    if (config.maxFeePerGas !== undefined) {
      tx.maxFeePerGas = config.maxFeePerGas;
      tx.maxPriorityFeePerGas = config.maxPriorityFeePerGas;
    } else if (config.gasPrice !== undefined) {
      tx.gasPrice = config.gasPrice;
    }

    return signer.sendTransaction(tx);
  }

  /**
   * Sends native token (MONAD)
   */
  async sendNative(to: string, amount: bigint): Promise<ethers.TransactionResponse> {
    return this.sendTransaction({ to, value: amount });
  }

  /**
   * Signs a transaction without broadcasting
   */
  async signTransaction(config: TransactionConfig): Promise<string> {
    const signer = this.getSigner();
    
    const tx: ethers.TransactionRequest = {
      to: config.to,
      value: config.value,
      data: config.data,
      gasLimit: config.gasLimit,
      nonce: config.nonce ?? await this.getTransactionCount(signer.address),
      chainId: await this.getChainId(),
    };

    if (config.maxFeePerGas !== undefined) {
      tx.maxFeePerGas = config.maxFeePerGas;
      tx.maxPriorityFeePerGas = config.maxPriorityFeePerGas;
    } else if (config.gasPrice !== undefined) {
      tx.gasPrice = config.gasPrice;
    } else {
      const feeData = await this.provider.getFeeData();
      tx.maxFeePerGas = feeData.maxFeePerGas;
      tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    }

    return signer.signTransaction(tx);
  }

  /**
   * Estimates gas for a transaction
   */
  async estimateGas(config: TransactionConfig): Promise<bigint> {
    return this.provider.estimateGas({
      to: config.to,
      value: config.value,
      data: config.data,
      from: this.hasSigner() ? this.getAddress() : undefined,
    });
  }

  /**
   * Gets current gas price information
   */
  async getFeeData(): Promise<ethers.FeeData> {
    return this.provider.getFeeData();
  }

  /**
   * Calls a contract function (read-only)
   */
  async call(to: string, data: string): Promise<string> {
    return this.provider.call({ to, data });
  }

  /**
   * Gets contract code
   */
  async getCode(address: string): Promise<string> {
    return this.provider.getCode(address);
  }

  /**
   * Gets storage at a specific slot
   */
  async getStorageAt(address: string, slot: string | number): Promise<string> {
    return this.provider.getStorage(address, slot);
  }

  /**
   * Gets logs matching a filter
   */
  async getLogs(filter: ethers.Filter): Promise<ethers.Log[]> {
    return this.provider.getLogs(filter);
  }

  /**
   * Waits for a transaction to be confirmed
   */
  async waitForTransaction(
    txHash: string, 
    confirmations: number = 1,
    timeout: number = RPC_TIMEOUT
  ): Promise<ethers.TransactionReceipt | null> {
    return this.provider.waitForTransaction(txHash, confirmations, timeout);
  }

  /**
   * Creates a contract instance
   */
  getContract(address: string, abi: ethers.InterfaceAbi): ethers.Contract {
    const signerOrProvider = this.hasSigner() ? this.getSigner() : this.provider;
    return new ethers.Contract(address, abi, signerOrProvider);
  }

  /**
   * Deploys a contract
   */
  async deployContract(
    abi: ethers.InterfaceAbi,
    bytecode: string,
    constructorArgs: unknown[] = []
  ): Promise<ethers.Contract> {
    const signer = this.getSigner();
    const factory = new ethers.ContractFactory(abi, bytecode, signer);
    const contract = await factory.deploy(...constructorArgs);
    await contract.waitForDeployment();
    return contract;
  }

  /**
   * Makes a raw JSON-RPC call
   */
  async rpcCall(method: string, params: unknown[]): Promise<unknown> {
    return this.provider.send(method, params);
  }

  /**
   * Retries an operation with exponential backoff
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = MAX_RETRY_ATTEMPTS
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Tests the connection to the RPC endpoint
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getBlockNumber();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the client version
   */
  async getClientVersion(): Promise<string> {
    try {
      const version = await this.rpcCall('web3_clientVersion', []);
      return version as string;
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Gets sync status
   */
  async getSyncStatus(): Promise<boolean | { startingBlock: number; currentBlock: number; highestBlock: number }> {
    const result = await this.rpcCall('eth_syncing', []);
    if (result === false) return false;
    return result as { startingBlock: number; currentBlock: number; highestBlock: number };
  }
}

/**
 * Helper function to format transaction response for n8n output
 */
export function formatTransactionResponse(tx: ethers.TransactionResponse): Record<string, unknown> {
  return {
    hash: tx.hash,
    blockNumber: tx.blockNumber,
    blockHash: tx.blockHash,
    from: tx.from,
    to: tx.to,
    value: tx.value.toString(),
    valueEther: ethers.formatEther(tx.value),
    gasLimit: tx.gasLimit.toString(),
    gasPrice: tx.gasPrice?.toString(),
    maxFeePerGas: tx.maxFeePerGas?.toString(),
    maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
    nonce: tx.nonce,
    data: tx.data,
    chainId: tx.chainId.toString(),
    type: tx.type,
    index: tx.index,
  };
}

/**
 * Helper function to format transaction receipt for n8n output
 */
export function formatTransactionReceipt(receipt: ethers.TransactionReceipt): Record<string, unknown> {
  return {
    hash: receipt.hash,
    blockNumber: receipt.blockNumber,
    blockHash: receipt.blockHash,
    from: receipt.from,
    to: receipt.to,
    contractAddress: receipt.contractAddress,
    status: receipt.status,
    success: receipt.status === 1,
    gasUsed: receipt.gasUsed.toString(),
    cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
    effectiveGasPrice: receipt.gasPrice?.toString(),
    logsCount: receipt.logs.length,
    type: receipt.type,
    index: receipt.index,
  };
}

/**
 * Helper function to format block for n8n output
 */
export function formatBlock(block: ethers.Block): Record<string, unknown> {
  return {
    number: block.number,
    hash: block.hash,
    parentHash: block.parentHash,
    timestamp: block.timestamp,
    timestampDate: new Date(block.timestamp * 1000).toISOString(),
    nonce: block.nonce,
    difficulty: block.difficulty.toString(),
    gasLimit: block.gasLimit.toString(),
    gasUsed: block.gasUsed.toString(),
    miner: block.miner,
    extraData: block.extraData,
    baseFeePerGas: block.baseFeePerGas?.toString(),
    transactionCount: block.transactions.length,
  };
}

/**
 * Helper function to get MonadClient from execution context
 */
export async function getMonadClient(
  context: IExecuteFunctions | ILoadOptionsFunctions,
): Promise<MonadClient> {
  const credentials = await context.getCredentials('monadNetwork');
  const network = credentials.network as string || 'mainnet';
  const rpcUrl = credentials.rpcUrl as string | undefined;
  const wsUrl = credentials.wsUrl as string | undefined;
  const privateKey = credentials.privateKey as string | undefined;

  const client = new MonadClient({
    network,
    rpcUrl,
    wsUrl,
    privateKey,
  });

  await client.connect();
  return client;
}
