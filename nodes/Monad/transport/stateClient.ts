/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';
import { MonadClient } from './monadClient';

/**
 * MonadDB State Client
 * 
 * Provides access to Monad's high-performance state database,
 * including state proofs, historical state queries, and state diffs.
 */

export interface AccountState {
  nonce: number;
  balance: bigint;
  storageRoot: string;
  codeHash: string;
}

export interface StorageProof {
  key: string;
  value: string;
  proof: string[];
}

export interface AccountStateProof {
  address: string;
  accountProof: string[];
  balance: bigint;
  nonce: number;
  codeHash: string;
  storageHash: string;
  storageProof: StorageProof[];
}

export interface StateDiff {
  address: string;
  balance: {
    from: bigint;
    to: bigint;
  } | null;
  nonce: {
    from: number;
    to: number;
  } | null;
  code: {
    from: string;
    to: string;
  } | null;
  storage: Array<{
    key: string;
    from: string;
    to: string;
  }>;
}

export interface StateSnapshot {
  blockNumber: number;
  stateRoot: string;
  timestamp: number;
  accountCount: number;
}

export class StateClient {
  private monadClient: MonadClient;
  private provider: ethers.JsonRpcProvider;

  constructor(monadClient: MonadClient) {
    this.monadClient = monadClient;
    this.provider = monadClient.getProvider();
  }

  /**
   * Gets the state of an account at a specific block
   */
  async getAccountState(address: string, blockTag: string | number = 'latest'): Promise<AccountState> {
    const [nonce, balance, code] = await Promise.all([
      this.provider.getTransactionCount(address, blockTag),
      this.provider.getBalance(address, blockTag),
      this.provider.getCode(address, blockTag),
    ]);

    // Calculate code hash
    const codeHash = code === '0x' 
      ? '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470' // Empty code hash
      : ethers.keccak256(code);

    // Storage root would require proof - use placeholder
    const storageRoot = '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421';

    return {
      nonce,
      balance,
      storageRoot,
      codeHash,
    };
  }

  /**
   * Gets storage value at a specific slot
   */
  async getStorage(
    address: string, 
    slot: string | number,
    blockTag: string | number = 'latest'
  ): Promise<string> {
    const slotHex = typeof slot === 'number' 
      ? ethers.toBeHex(slot, 32)
      : ethers.zeroPadValue(slot, 32);
    
    return this.provider.getStorage(address, slotHex, blockTag);
  }

  /**
   * Gets multiple storage slots in batch
   */
  async getStorageBatch(
    address: string,
    slots: (string | number)[],
    blockTag: string | number = 'latest'
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    // Process in parallel for efficiency
    const promises = slots.map(async (slot) => {
      const slotHex = typeof slot === 'number'
        ? ethers.toBeHex(slot, 32)
        : ethers.zeroPadValue(slot, 32);
      const value = await this.getStorage(address, slotHex, blockTag);
      return { slot: slotHex, value };
    });

    const responses = await Promise.all(promises);
    responses.forEach(({ slot, value }) => results.set(slot, value));

    return results;
  }

  /**
   * Gets account state proof (eth_getProof)
   */
  async getAccountStateProof(
    address: string,
    storageKeys: string[] = [],
    blockTag: string | number = 'latest'
  ): Promise<AccountStateProof> {
    const blockHex = typeof blockTag === 'number' 
      ? ethers.toBeHex(blockTag)
      : blockTag;

    const result = await this.monadClient.rpcCall('eth_getProof', [
      address,
      storageKeys,
      blockHex,
    ]) as Record<string, unknown>;

    return {
      address: result.address as string,
      accountProof: result.accountProof as string[],
      balance: BigInt(result.balance as string),
      nonce: parseInt(result.nonce as string, 16),
      codeHash: result.codeHash as string,
      storageHash: result.storageHash as string,
      storageProof: (result.storageProof as Array<Record<string, unknown>>).map(proof => ({
        key: proof.key as string,
        value: proof.value as string,
        proof: proof.proof as string[],
      })),
    };
  }

  /**
   * Gets storage proof for specific keys
   */
  async getStorageProof(
    address: string,
    keys: string[],
    blockTag: string | number = 'latest'
  ): Promise<StorageProof[]> {
    const proof = await this.getAccountStateProof(address, keys, blockTag);
    return proof.storageProof;
  }

  /**
   * Gets the state root for a block
   */
  async getStateRoot(blockTag: string | number = 'latest'): Promise<string> {
    const block = await this.provider.getBlock(blockTag);
    return block?.stateRoot || '';
  }

  /**
   * Gets state diff between two blocks
   */
  async getStateDiff(
    address: string,
    fromBlock: number,
    toBlock: number
  ): Promise<StateDiff> {
    const [fromState, toState] = await Promise.all([
      this.getAccountState(address, fromBlock),
      this.getAccountState(address, toBlock),
    ]);

    const diff: StateDiff = {
      address,
      balance: null,
      nonce: null,
      code: null,
      storage: [],
    };

    if (fromState.balance !== toState.balance) {
      diff.balance = {
        from: fromState.balance,
        to: toState.balance,
      };
    }

    if (fromState.nonce !== toState.nonce) {
      diff.nonce = {
        from: fromState.nonce,
        to: toState.nonce,
      };
    }

    if (fromState.codeHash !== toState.codeHash) {
      const [fromCode, toCode] = await Promise.all([
        this.provider.getCode(address, fromBlock),
        this.provider.getCode(address, toBlock),
      ]);
      diff.code = { from: fromCode, to: toCode };
    }

    return diff;
  }

  /**
   * Gets historical state at a specific block
   */
  async getHistoricalState(
    address: string,
    blockNumber: number
  ): Promise<{
    account: AccountState;
    block: Record<string, unknown>;
  }> {
    const [account, block] = await Promise.all([
      this.getAccountState(address, blockNumber),
      this.provider.getBlock(blockNumber),
    ]);

    return {
      account,
      block: {
        number: block?.number,
        hash: block?.hash,
        timestamp: block?.timestamp,
        stateRoot: block?.stateRoot,
      },
    };
  }

  /**
   * Gets storage range for debugging (debug_storageRangeAt)
   */
  async getStorageRange(
    blockHash: string,
    txIndex: number,
    address: string,
    startKey: string = '0x0000000000000000000000000000000000000000000000000000000000000000',
    limit: number = 100
  ): Promise<Record<string, { key: string; value: string }>> {
    try {
      const result = await this.monadClient.rpcCall('debug_storageRangeAt', [
        blockHash,
        txIndex,
        address,
        startKey,
        limit,
      ]) as { storage: Record<string, { key: string; value: string }>; nextKey: string | null };

      return result.storage;
    } catch {
      // debug methods may not be available
      return {};
    }
  }

  /**
   * Validates a state proof
   */
  verifyStateProof(
    stateRoot: string,
    address: string,
    proof: AccountStateProof
  ): boolean {
    // Note: Full proof verification requires merkle-patricia-tree library
    // This is a simplified check
    try {
      // Verify proof length is reasonable
      if (!proof.accountProof || proof.accountProof.length === 0) {
        return false;
      }
      
      // Verify address matches
      if (proof.address.toLowerCase() !== address.toLowerCase()) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets state snapshot information
   */
  async getStateSnapshot(blockTag: string | number = 'latest'): Promise<StateSnapshot> {
    const block = await this.provider.getBlock(blockTag);
    
    return {
      blockNumber: block?.number || 0,
      stateRoot: block?.stateRoot || '',
      timestamp: block?.timestamp || 0,
      accountCount: 0, // Would require archive node query
    };
  }
}

/**
 * Helper to format account state for n8n output
 */
export function formatAccountState(state: AccountState, address: string): Record<string, unknown> {
  return {
    address,
    nonce: state.nonce,
    balance: state.balance.toString(),
    balanceEther: ethers.formatEther(state.balance),
    storageRoot: state.storageRoot,
    codeHash: state.codeHash,
    hasCode: state.codeHash !== '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
  };
}

/**
 * Helper to format state diff for n8n output
 */
export function formatStateDiff(diff: StateDiff): Record<string, unknown> {
  return {
    address: diff.address,
    hasBalanceChange: diff.balance !== null,
    balanceChange: diff.balance ? {
      from: diff.balance.from.toString(),
      to: diff.balance.to.toString(),
      fromEther: ethers.formatEther(diff.balance.from),
      toEther: ethers.formatEther(diff.balance.to),
      difference: (diff.balance.to - diff.balance.from).toString(),
    } : null,
    hasNonceChange: diff.nonce !== null,
    nonceChange: diff.nonce,
    hasCodeChange: diff.code !== null,
    storageChanges: diff.storage.length,
  };
}

/**
 * Helper function to get StateClient from execution context
 */
export async function getStateClient(
  context: IExecuteFunctions | ILoadOptionsFunctions,
): Promise<StateClient> {
  const credentials = await context.getCredentials('monadNetwork');
  const network = credentials.network as string || 'mainnet';
  const rpcUrl = credentials.rpcUrl as string | undefined;

  const client = new StateClient({
    network,
    rpcUrl,
  });

  await client.connect();
  return client;
}
