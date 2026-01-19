/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';

/**
 * Monad Parallel Execution Utilities
 * 
 * Monad achieves high throughput through parallel transaction execution.
 * These utilities help analyze and work with parallel execution patterns.
 */

export interface StateAccess {
  address: string;
  slots: string[];
  type: 'read' | 'write';
}

export interface TransactionDependency {
  txHash: string;
  dependsOn: string[];
  stateAccesses: StateAccess[];
  canParallelize: boolean;
}

export interface ParallelExecutionStats {
  totalTransactions: number;
  parallelizedCount: number;
  serializedCount: number;
  conflictCount: number;
  parallelizationRatio: number;
  averageBatchSize: number;
}

export interface ConflictAnalysis {
  hasConflict: boolean;
  conflictingSlots: string[];
  conflictingAddresses: string[];
  resolutionStrategy: 'reexecute' | 'none';
}

/**
 * Analyzes potential state conflicts between two transactions
 */
export function analyzeConflicts(
  tx1Accesses: StateAccess[],
  tx2Accesses: StateAccess[]
): ConflictAnalysis {
  const conflictingSlots: Set<string> = new Set();
  const conflictingAddresses: Set<string> = new Set();

  // Check for write-write or read-write conflicts on same state
  for (const access1 of tx1Accesses) {
    for (const access2 of tx2Accesses) {
      // Same address
      if (access1.address.toLowerCase() === access2.address.toLowerCase()) {
        // Check for overlapping slots
        const slots1 = new Set(access1.slots);
        for (const slot of access2.slots) {
          if (slots1.has(slot)) {
            // Conflict exists if at least one is a write
            if (access1.type === 'write' || access2.type === 'write') {
              conflictingSlots.add(slot);
              conflictingAddresses.add(access1.address);
            }
          }
        }
      }
    }
  }

  const hasConflict = conflictingSlots.size > 0;

  return {
    hasConflict,
    conflictingSlots: Array.from(conflictingSlots),
    conflictingAddresses: Array.from(conflictingAddresses),
    resolutionStrategy: hasConflict ? 'reexecute' : 'none',
  };
}

/**
 * Groups transactions into parallel batches based on dependencies
 */
export function groupForParallelExecution(
  transactions: TransactionDependency[]
): string[][] {
  const batches: string[][] = [];
  const executed: Set<string> = new Set();
  const remaining = [...transactions];

  while (remaining.length > 0) {
    const batch: string[] = [];
    const batchStateAccesses: StateAccess[] = [];

    // Find all transactions that can execute in this batch
    const stillRemaining: TransactionDependency[] = [];

    for (const tx of remaining) {
      // Check if all dependencies are satisfied
      const dependenciesMet = tx.dependsOn.every(dep => executed.has(dep));
      
      if (!dependenciesMet) {
        stillRemaining.push(tx);
        continue;
      }

      // Check for conflicts with current batch
      const conflicts = analyzeConflicts(tx.stateAccesses, batchStateAccesses);
      
      if (!conflicts.hasConflict) {
        batch.push(tx.txHash);
        batchStateAccesses.push(...tx.stateAccesses);
      } else {
        stillRemaining.push(tx);
      }
    }

    if (batch.length > 0) {
      batches.push(batch);
      batch.forEach(hash => executed.add(hash));
    }

    // Update remaining
    remaining.length = 0;
    remaining.push(...stillRemaining);

    // Prevent infinite loop
    if (stillRemaining.length === remaining.length && batch.length === 0) {
      // Force execute remaining in serial
      for (const tx of stillRemaining) {
        batches.push([tx.txHash]);
        executed.add(tx.txHash);
      }
      break;
    }
  }

  return batches;
}

/**
 * Calculates parallel execution statistics for a block
 */
export function calculateParallelStats(
  batches: string[][],
  totalTxCount: number
): ParallelExecutionStats {
  let parallelizedCount = 0;
  let serializedCount = 0;

  for (const batch of batches) {
    if (batch.length > 1) {
      parallelizedCount += batch.length;
    } else {
      serializedCount += batch.length;
    }
  }

  const conflictCount = totalTxCount - parallelizedCount - serializedCount;
  const parallelizationRatio = totalTxCount > 0 
    ? parallelizedCount / totalTxCount 
    : 0;
  const averageBatchSize = batches.length > 0 
    ? totalTxCount / batches.length 
    : 0;

  return {
    totalTransactions: totalTxCount,
    parallelizedCount,
    serializedCount,
    conflictCount: Math.max(0, conflictCount),
    parallelizationRatio,
    averageBatchSize,
  };
}

/**
 * Estimates the parallelization potential for a set of transactions
 */
export function estimateParallelizationPotential(
  transactions: StateAccess[][]
): number {
  if (transactions.length <= 1) {
    return 1;
  }

  let conflictPairs = 0;
  const totalPairs = (transactions.length * (transactions.length - 1)) / 2;

  for (let i = 0; i < transactions.length; i++) {
    for (let j = i + 1; j < transactions.length; j++) {
      const conflict = analyzeConflicts(transactions[i], transactions[j]);
      if (conflict.hasConflict) {
        conflictPairs++;
      }
    }
  }

  // Higher ratio means more parallelizable
  return totalPairs > 0 ? 1 - (conflictPairs / totalPairs) : 1;
}

/**
 * Extracts storage slot from a state diff
 */
export function extractStorageSlot(key: string): string {
  // Ensure proper formatting of storage slot
  return ethers.zeroPadValue(key, 32);
}

/**
 * Calculates the theoretical max TPS for a parallelization ratio
 */
export function calculateTheoreticalTps(
  parallelizationRatio: number,
  baseSerialTps: number = 100,
  maxParallelFactor: number = 100
): number {
  // Linear scaling based on parallelization potential
  const parallelBoost = parallelizationRatio * maxParallelFactor;
  return baseSerialTps * (1 + parallelBoost);
}

/**
 * Formats parallel execution report
 */
export function formatParallelReport(stats: ParallelExecutionStats): string {
  return `
Parallel Execution Report
=========================
Total Transactions: ${stats.totalTransactions}
Parallelized: ${stats.parallelizedCount} (${(stats.parallelizationRatio * 100).toFixed(2)}%)
Serialized: ${stats.serializedCount}
Conflicts: ${stats.conflictCount}
Average Batch Size: ${stats.averageBatchSize.toFixed(2)}
`.trim();
}
