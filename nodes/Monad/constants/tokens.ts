/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUrl?: string;
}

/**
 * Common tokens on Monad networks
 * Note: These are placeholder addresses - update with actual deployed tokens
 */
export const COMMON_TOKENS: Record<string, Record<string, TokenInfo>> = {
  mainnet: {
    WMONAD: {
      address: '0x0000000000000000000000000000000000000000', // Placeholder
      name: 'Wrapped Monad',
      symbol: 'WMONAD',
      decimals: 18,
    },
    USDC: {
      address: '0x0000000000000000000000000000000000000000', // Placeholder
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
    },
    USDT: {
      address: '0x0000000000000000000000000000000000000000', // Placeholder
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
    },
    WETH: {
      address: '0x0000000000000000000000000000000000000000', // Placeholder
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
    },
    WBTC: {
      address: '0x0000000000000000000000000000000000000000', // Placeholder
      name: 'Wrapped Bitcoin',
      symbol: 'WBTC',
      decimals: 8,
    },
  },
  testnet: {
    WMONAD: {
      address: '0x0000000000000000000000000000000000000000', // Placeholder
      name: 'Wrapped Monad',
      symbol: 'WMONAD',
      decimals: 18,
    },
    USDC: {
      address: '0x0000000000000000000000000000000000000000', // Placeholder
      name: 'Test USD Coin',
      symbol: 'USDC',
      decimals: 6,
    },
    USDT: {
      address: '0x0000000000000000000000000000000000000000', // Placeholder
      name: 'Test Tether USD',
      symbol: 'USDT',
      decimals: 6,
    },
  },
  devnet: {
    WMONAD: {
      address: '0x0000000000000000000000000000000000000000', // Placeholder
      name: 'Wrapped Monad',
      symbol: 'WMONAD',
      decimals: 18,
    },
  },
};

export function getCommonTokens(network: string): Record<string, TokenInfo> {
  return COMMON_TOKENS[network] || COMMON_TOKENS.testnet;
}

export function getTokenBySymbol(network: string, symbol: string): TokenInfo | undefined {
  const tokens = getCommonTokens(network);
  return tokens[symbol.toUpperCase()];
}

export const NATIVE_TOKEN: TokenInfo = {
  address: '0x0000000000000000000000000000000000000000',
  name: 'Monad',
  symbol: 'MONAD',
  decimals: 18,
};

// Token standard identifiers
export const TOKEN_STANDARDS = {
  ERC20: 'ERC-20',
  ERC721: 'ERC-721',
  ERC1155: 'ERC-1155',
} as const;

// Interface IDs for token standard detection
export const INTERFACE_IDS = {
  ERC165: '0x01ffc9a7',
  ERC721: '0x80ac58cd',
  ERC721Metadata: '0x5b5e139f',
  ERC721Enumerable: '0x780e9d63',
  ERC1155: '0xd9b67a26',
  ERC1155MetadataURI: '0x0e89341c',
} as const;
