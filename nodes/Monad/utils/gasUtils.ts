/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';
import { GAS_MULTIPLIERS } from '../constants/performance';

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  estimatedCost: bigint;
  estimatedCostEther: string;
}

export interface GasOracleResult {
  slow: {
    gasPrice: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  };
  standard: {
    gasPrice: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  };
  fast: {
    gasPrice: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  };
  instant: {
    gasPrice: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  };
  baseFee: bigint;
  blockNumber: number;
}

/**
 * Estimates gas for a transaction with safety buffer
 */
export async function estimateGasWithBuffer(
  provider: ethers.Provider,
  transaction: ethers.TransactionRequest,
  multiplier: keyof typeof GAS_MULTIPLIERS = 'simple'
): Promise<bigint> {
  const estimate = await provider.estimateGas(transaction);
  const buffer = GAS_MULTIPLIERS[multiplier];
  return BigInt(Math.ceil(Number(estimate) * buffer));
}

/**
 * Gets comprehensive gas information for a transaction
 */
export async function getGasEstimate(
  provider: ethers.Provider,
  transaction: ethers.TransactionRequest,
  multiplier: keyof typeof GAS_MULTIPLIERS = 'simple'
): Promise<GasEstimate> {
  const [gasLimit, feeData] = await Promise.all([
    estimateGasWithBuffer(provider, transaction, multiplier),
    provider.getFeeData(),
  ]);

  const maxFeePerGas = feeData.maxFeePerGas || feeData.gasPrice || 0n;
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || 0n;
  const gasPrice = feeData.gasPrice || maxFeePerGas;

  const estimatedCost = gasLimit * maxFeePerGas;

  return {
    gasLimit,
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
    estimatedCost,
    estimatedCostEther: ethers.formatEther(estimatedCost),
  };
}

/**
 * Gets gas oracle data with multiple speed options
 */
export async function getGasOracle(provider: ethers.Provider): Promise<GasOracleResult> {
  const [feeData, block] = await Promise.all([
    provider.getFeeData(),
    provider.getBlock('latest'),
  ]);

  const baseFee = block?.baseFeePerGas || 0n;
  const gasPrice = feeData.gasPrice || baseFee;
  const priorityFee = feeData.maxPriorityFeePerGas || 1000000000n; // 1 gwei default

  // Calculate different speed tiers
  const slow = {
    gasPrice: gasPrice * 90n / 100n,
    maxFeePerGas: baseFee + priorityFee * 80n / 100n,
    maxPriorityFeePerGas: priorityFee * 80n / 100n,
  };

  const standard = {
    gasPrice,
    maxFeePerGas: baseFee + priorityFee,
    maxPriorityFeePerGas: priorityFee,
  };

  const fast = {
    gasPrice: gasPrice * 120n / 100n,
    maxFeePerGas: baseFee + priorityFee * 150n / 100n,
    maxPriorityFeePerGas: priorityFee * 150n / 100n,
  };

  const instant = {
    gasPrice: gasPrice * 150n / 100n,
    maxFeePerGas: baseFee + priorityFee * 200n / 100n,
    maxPriorityFeePerGas: priorityFee * 200n / 100n,
  };

  return {
    slow,
    standard,
    fast,
    instant,
    baseFee,
    blockNumber: block?.number || 0,
  };
}

/**
 * Formats gas values to human-readable format
 */
export function formatGas(wei: bigint): string {
  const gwei = Number(wei) / 1e9;
  if (gwei >= 1) {
    return `${gwei.toFixed(2)} Gwei`;
  }
  return `${Number(wei)} Wei`;
}

/**
 * Converts Gwei to Wei
 */
export function gweiToWei(gwei: number | string): bigint {
  return ethers.parseUnits(gwei.toString(), 'gwei');
}

/**
 * Converts Wei to Gwei
 */
export function weiToGwei(wei: bigint): string {
  return ethers.formatUnits(wei, 'gwei');
}

/**
 * Calculates transaction cost from gas limit and gas price
 */
export function calculateTxCost(gasLimit: bigint, gasPrice: bigint): {
  wei: bigint;
  ether: string;
  gwei: string;
} {
  const wei = gasLimit * gasPrice;
  return {
    wei,
    ether: ethers.formatEther(wei),
    gwei: ethers.formatUnits(wei, 'gwei'),
  };
}

/**
 * Checks if gas price is reasonable (not too high)
 */
export function isGasPriceReasonable(
  gasPrice: bigint,
  maxAcceptableGwei: number = 1000
): boolean {
  const gasPriceGwei = Number(ethers.formatUnits(gasPrice, 'gwei'));
  return gasPriceGwei <= maxAcceptableGwei;
}

/**
 * Gets historical gas prices for analysis
 */
export async function getGasHistory(
  provider: ethers.Provider,
  blockCount: number = 10
): Promise<Array<{ blockNumber: number; baseFee: bigint; gasUsed: bigint; gasLimit: bigint }>> {
  const latestBlock = await provider.getBlockNumber();
  const history: Array<{ blockNumber: number; baseFee: bigint; gasUsed: bigint; gasLimit: bigint }> = [];

  const startBlock = Math.max(0, latestBlock - blockCount + 1);
  
  for (let i = startBlock; i <= latestBlock; i++) {
    const block = await provider.getBlock(i);
    if (block) {
      history.push({
        blockNumber: block.number,
        baseFee: block.baseFeePerGas || 0n,
        gasUsed: block.gasUsed,
        gasLimit: block.gasLimit,
      });
    }
  }

  return history;
}

// Alias for backward compatibility
export const estimateGas = estimateGasWithBuffer;
