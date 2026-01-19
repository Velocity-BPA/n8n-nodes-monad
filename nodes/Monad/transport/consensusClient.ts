/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';
import { MonadClient } from './monadClient';

/**
 * MonadBFT Consensus Client
 * 
 * Provides access to Monad's BFT consensus mechanism information,
 * including validator sets, block proposers, and finality status.
 */

export interface ValidatorInfo {
  address: string;
  stake: bigint;
  commission: number;
  active: boolean;
  jailed: boolean;
  uptime: number;
  blocksProposed: number;
  blocksValidated: number;
}

export interface ConsensusState {
  height: number;
  round: number;
  step: 'propose' | 'prevote' | 'precommit' | 'commit';
  proposer: string;
  validatorSetHash: string;
}

export interface FinalityStatus {
  latestBlock: number;
  finalizedBlock: number;
  safeBlock: number;
  pendingBlocks: number;
  isFinalized: boolean;
}

export interface VoteInfo {
  blockNumber: number;
  round: number;
  type: 'prevote' | 'precommit';
  validator: string;
  signature: string;
  timestamp: number;
}

export class ConsensusClient {
  private monadClient: MonadClient;
  private provider: ethers.JsonRpcProvider;

  constructor(monadClient: MonadClient) {
    this.monadClient = monadClient;
    this.provider = monadClient.getProvider();
  }

  /**
   * Gets the current validator set
   * Note: This uses standard EVM RPC methods where available,
   * or Monad-specific methods when they become available
   */
  async getValidatorSet(): Promise<ValidatorInfo[]> {
    try {
      // Try Monad-specific method first
      const result = await this.monadClient.rpcCall('monad_getValidators', []);
      
      if (Array.isArray(result)) {
        return result.map(this.parseValidatorInfo);
      }
    } catch {
      // Fall back to staking contract query if available
    }
    
    // Return empty array if validators not queryable
    return [];
  }

  /**
   * Gets information about a specific validator
   */
  async getValidatorInfo(address: string): Promise<ValidatorInfo | null> {
    try {
      const result = await this.monadClient.rpcCall('monad_getValidator', [address]);
      return this.parseValidatorInfo(result as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  /**
   * Gets the current block proposer
   */
  async getCurrentProposer(): Promise<string | null> {
    try {
      const result = await this.monadClient.rpcCall('monad_getCurrentProposer', []);
      return result as string;
    } catch {
      // Fall back to getting miner from latest block
      const block = await this.provider.getBlock('latest');
      return block?.miner || null;
    }
  }

  /**
   * Gets the proposer for a specific block
   */
  async getBlockProposer(blockNumber: number): Promise<string | null> {
    const block = await this.provider.getBlock(blockNumber);
    return block?.miner || null;
  }

  /**
   * Gets the current consensus state
   */
  async getConsensusState(): Promise<ConsensusState | null> {
    try {
      const result = await this.monadClient.rpcCall('monad_consensusState', []);
      const state = result as Record<string, unknown>;
      
      return {
        height: Number(state.height),
        round: Number(state.round),
        step: state.step as ConsensusState['step'],
        proposer: state.proposer as string,
        validatorSetHash: state.validatorSetHash as string,
      };
    } catch {
      return null;
    }
  }

  /**
   * Gets finality status for the chain
   */
  async getFinalityStatus(): Promise<FinalityStatus> {
    const latestBlock = await this.provider.getBlockNumber();
    
    try {
      // Try to get finalized block tag
      const finalizedBlock = await this.provider.getBlock('finalized');
      const safeBlock = await this.provider.getBlock('safe');
      
      return {
        latestBlock,
        finalizedBlock: finalizedBlock?.number || latestBlock,
        safeBlock: safeBlock?.number || latestBlock,
        pendingBlocks: latestBlock - (finalizedBlock?.number || latestBlock),
        isFinalized: latestBlock === (finalizedBlock?.number || latestBlock),
      };
    } catch {
      // If finalized tag not supported, assume single-slot finality
      return {
        latestBlock,
        finalizedBlock: latestBlock,
        safeBlock: latestBlock,
        pendingBlocks: 0,
        isFinalized: true,
      };
    }
  }

  /**
   * Checks if a specific block is finalized
   */
  async isBlockFinalized(blockNumber: number): Promise<boolean> {
    const status = await this.getFinalityStatus();
    return blockNumber <= status.finalizedBlock;
  }

  /**
   * Gets consensus statistics
   */
  async getConsensusStats(): Promise<Record<string, unknown>> {
    try {
      const result = await this.monadClient.rpcCall('monad_consensusStats', []);
      return result as Record<string, unknown>;
    } catch {
      // Return basic stats from available data
      const [block, validators] = await Promise.all([
        this.provider.getBlock('latest'),
        this.getValidatorSet(),
      ]);
      
      return {
        latestBlock: block?.number || 0,
        blockTime: this.monadClient.getNetworkConfig().blockTime,
        activeValidators: validators.filter(v => v.active).length,
        totalValidators: validators.length,
        targetTps: this.monadClient.getNetworkConfig().targetTps,
      };
    }
  }

  /**
   * Gets vote information for a block
   */
  async getVoteInfo(blockNumber: number): Promise<VoteInfo[]> {
    try {
      const result = await this.monadClient.rpcCall('monad_getVotes', [blockNumber]);
      
      if (Array.isArray(result)) {
        return result.map((vote: Record<string, unknown>) => ({
          blockNumber: Number(vote.blockNumber),
          round: Number(vote.round),
          type: vote.type as VoteInfo['type'],
          validator: vote.validator as string,
          signature: vote.signature as string,
          timestamp: Number(vote.timestamp),
        }));
      }
    } catch {
      // Votes not available
    }
    
    return [];
  }

  /**
   * Gets the expected leader for a future block
   */
  async getExpectedLeader(blockNumber: number): Promise<string | null> {
    try {
      const result = await this.monadClient.rpcCall('monad_getExpectedLeader', [blockNumber]);
      return result as string;
    } catch {
      return null;
    }
  }

  /**
   * Helper to parse validator info from raw response
   */
  private parseValidatorInfo(raw: Record<string, unknown>): ValidatorInfo {
    return {
      address: raw.address as string || '',
      stake: BigInt(raw.stake as string || '0'),
      commission: Number(raw.commission || 0),
      active: Boolean(raw.active),
      jailed: Boolean(raw.jailed),
      uptime: Number(raw.uptime || 100),
      blocksProposed: Number(raw.blocksProposed || 0),
      blocksValidated: Number(raw.blocksValidated || 0),
    };
  }
}

/**
 * Helper to format validator info for n8n output
 */
export function formatValidatorInfo(validator: ValidatorInfo): Record<string, unknown> {
  return {
    address: validator.address,
    stake: validator.stake.toString(),
    stakeEther: ethers.formatEther(validator.stake),
    commission: validator.commission,
    commissionPercent: `${validator.commission}%`,
    active: validator.active,
    jailed: validator.jailed,
    uptime: validator.uptime,
    uptimePercent: `${validator.uptime}%`,
    blocksProposed: validator.blocksProposed,
    blocksValidated: validator.blocksValidated,
  };
}
