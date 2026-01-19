/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export interface MonadNetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  wsUrl: string;
  explorerUrl: string;
  explorerApiUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockTime: number; // in milliseconds
  targetTps: number;
  finalityTime: number; // in milliseconds
}

export const MONAD_NETWORKS: Record<string, MonadNetworkConfig> = {
  mainnet: {
    name: 'Monad Mainnet',
    chainId: 1, // Placeholder - update when mainnet launches
    rpcUrl: 'https://rpc.monad.xyz',
    wsUrl: 'wss://ws.monad.xyz',
    explorerUrl: 'https://explorer.monad.xyz',
    explorerApiUrl: 'https://explorer-api.monad.xyz',
    nativeCurrency: {
      name: 'Monad',
      symbol: 'MONAD',
      decimals: 18,
    },
    blockTime: 1000, // 1 second target
    targetTps: 10000,
    finalityTime: 1000, // 1 second finality
  },
  testnet: {
    name: 'Monad Testnet',
    chainId: 10143, // Placeholder - update with actual testnet chain ID
    rpcUrl: 'https://testnet-rpc.monad.xyz',
    wsUrl: 'wss://testnet-ws.monad.xyz',
    explorerUrl: 'https://testnet.explorer.monad.xyz',
    explorerApiUrl: 'https://testnet-explorer-api.monad.xyz',
    nativeCurrency: {
      name: 'Monad',
      symbol: 'MONAD',
      decimals: 18,
    },
    blockTime: 1000,
    targetTps: 10000,
    finalityTime: 1000,
  },
  devnet: {
    name: 'Monad Devnet',
    chainId: 10142, // Placeholder - update with actual devnet chain ID
    rpcUrl: 'https://devnet-rpc.monad.xyz',
    wsUrl: 'wss://devnet-ws.monad.xyz',
    explorerUrl: 'https://devnet.explorer.monad.xyz',
    explorerApiUrl: 'https://devnet-explorer-api.monad.xyz',
    nativeCurrency: {
      name: 'Monad',
      symbol: 'MONAD',
      decimals: 18,
    },
    blockTime: 1000,
    targetTps: 10000,
    finalityTime: 1000,
  },
};

export function getNetworkConfig(network: string, customConfig?: Partial<MonadNetworkConfig>): MonadNetworkConfig {
  if (network === 'custom' && customConfig) {
    return {
      name: 'Custom Network',
      chainId: customConfig.chainId || 0,
      rpcUrl: customConfig.rpcUrl || '',
      wsUrl: customConfig.wsUrl || '',
      explorerUrl: customConfig.explorerUrl || '',
      explorerApiUrl: customConfig.explorerApiUrl || '',
      nativeCurrency: customConfig.nativeCurrency || {
        name: 'Monad',
        symbol: 'MONAD',
        decimals: 18,
      },
      blockTime: customConfig.blockTime || 1000,
      targetTps: customConfig.targetTps || 10000,
      finalityTime: customConfig.finalityTime || 1000,
    };
  }
  
  return MONAD_NETWORKS[network] || MONAD_NETWORKS.testnet;
}

export const DEFAULT_GAS_LIMIT = 21000n;
export const DEFAULT_CONTRACT_GAS_LIMIT = 500000n;
export const MAX_GAS_LIMIT = 30000000n;

export const BLOCK_CONFIRMATIONS = {
  fast: 1,
  standard: 3,
  safe: 6,
  finalized: 12,
};

export const RPC_TIMEOUT = 30000; // 30 seconds
export const WS_RECONNECT_INTERVAL = 5000; // 5 seconds
export const MAX_RETRY_ATTEMPTS = 3;
