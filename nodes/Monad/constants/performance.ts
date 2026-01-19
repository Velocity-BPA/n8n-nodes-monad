/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Monad performance benchmarks and targets
 * These constants reflect Monad's high-performance design goals
 */

export const PERFORMANCE_TARGETS = {
  // Transaction throughput
  targetTps: 10000, // 10,000 TPS target
  maxTps: 50000, // Maximum theoretical TPS
  
  // Block parameters
  targetBlockTime: 1000, // 1 second block time (ms)
  maxBlockSize: 30000000, // 30M gas limit
  
  // Finality
  targetFinality: 1000, // 1 second finality (ms)
  singleSlotFinality: true,
  
  // Parallel execution
  parallelThreads: 10000, // Concurrent transaction processing
  optimisticExecution: true,
  
  // Network latency
  maxPropagationTime: 500, // 500ms max block propagation
  maxValidatorLatency: 100, // 100ms max validator response
} as const;

// EVM chain comparisons (approximate)
export const CHAIN_COMPARISONS = {
  ethereum: {
    name: 'Ethereum',
    tps: 15,
    blockTime: 12000, // 12 seconds
    finality: 15 * 60 * 1000, // ~15 minutes
  },
  polygon: {
    name: 'Polygon',
    tps: 65,
    blockTime: 2000, // 2 seconds
    finality: 2 * 60 * 1000, // ~2 minutes
  },
  arbitrum: {
    name: 'Arbitrum',
    tps: 40,
    blockTime: 250, // 250ms
    finality: 7 * 24 * 60 * 60 * 1000, // 7 days (challenge period)
  },
  optimism: {
    name: 'Optimism',
    tps: 200,
    blockTime: 2000, // 2 seconds
    finality: 7 * 24 * 60 * 60 * 1000, // 7 days (challenge period)
  },
  avalanche: {
    name: 'Avalanche',
    tps: 4500,
    blockTime: 2000, // 2 seconds
    finality: 1000, // ~1 second
  },
  solana: {
    name: 'Solana',
    tps: 65000,
    blockTime: 400, // 400ms
    finality: 400, // ~400ms
  },
  monad: {
    name: 'Monad',
    tps: 10000,
    blockTime: 1000, // 1 second
    finality: 1000, // 1 second
  },
} as const;

// Monad-specific execution concepts
export const EXECUTION_CONCEPTS = {
  // Parallel Execution
  parallelExecution: {
    description: 'Concurrent processing of independent transactions',
    benefit: 'Dramatically increased throughput',
  },
  
  // Deferred Execution
  deferredExecution: {
    description: 'Execution happens after consensus is reached',
    benefit: 'Faster block finality, pipelined processing',
  },
  
  // Optimistic Parallelism
  optimisticParallelism: {
    description: 'Speculatively execute transactions in parallel',
    benefit: 'Maximum throughput with conflict detection',
  },
  
  // MonadDB
  monadDb: {
    description: 'Custom high-performance state database',
    benefit: 'Optimized for parallel state access',
  },
  
  // MonadBFT
  monadBft: {
    description: 'Byzantine Fault Tolerant consensus mechanism',
    benefit: 'Single-slot finality with high throughput',
  },
  
  // State Conflict
  stateConflict: {
    description: 'When parallel transactions access same state',
    handling: 'Automatic re-execution in serial order',
  },
} as const;

// Gas estimation multipliers for different operation types
export const GAS_MULTIPLIERS = {
  simple: 1.1, // Simple transfers
  contract: 1.2, // Contract interactions
  complex: 1.5, // Complex multi-step operations
  parallel: 1.0, // Parallel-optimized operations
} as const;

// Rate limiting thresholds
export const RATE_LIMITS = {
  rpcRequestsPerSecond: 100,
  wsSubscriptionsMax: 100,
  eventLogsMax: 10000,
  batchRequestMax: 100,
} as const;
