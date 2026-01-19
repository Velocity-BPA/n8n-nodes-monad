/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';

/**
 * Validates if a string is a valid Ethereum/Monad address
 */
export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Converts an address to checksum format
 */
export function toChecksumAddress(address: string): string {
  if (!isValidAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  return ethers.getAddress(address);
}

/**
 * Compares two addresses (case-insensitive)
 */
export function addressesEqual(address1: string, address2: string): boolean {
  if (!isValidAddress(address1) || !isValidAddress(address2)) {
    return false;
  }
  return address1.toLowerCase() === address2.toLowerCase();
}

/**
 * Checks if an address is the zero address
 */
export function isZeroAddress(address: string): boolean {
  return addressesEqual(address, ethers.ZeroAddress);
}

/**
 * Shortens an address for display (e.g., 0x1234...5678)
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!isValidAddress(address)) {
    return address;
  }
  const checksummed = toChecksumAddress(address);
  return `${checksummed.slice(0, chars + 2)}...${checksummed.slice(-chars)}`;
}

/**
 * Validates and normalizes an address, returning null if invalid
 */
export function normalizeAddress(address: string): string | null {
  try {
    return toChecksumAddress(address);
  } catch {
    return null;
  }
}

/**
 * Checks if an address is a contract (has code deployed)
 */
export async function isContract(provider: ethers.Provider, address: string): Promise<boolean> {
  try {
    const code = await provider.getCode(address);
    return code !== '0x' && code !== '0x0';
  } catch {
    return false;
  }
}

/**
 * Generates a random address (for testing)
 */
export function generateRandomAddress(): string {
  return ethers.Wallet.createRandom().address;
}

/**
 * Validates a private key format
 */
export function isValidPrivateKey(privateKey: string): boolean {
  try {
    // Ensure it has 0x prefix if not present
    const key = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    // A valid private key should be 32 bytes (64 hex chars + 2 for 0x)
    if (key.length !== 66) {
      return false;
    }
    // Try to create a wallet with it
    new ethers.Wallet(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Derives an address from a private key
 */
export function privateKeyToAddress(privateKey: string): string {
  const key = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const wallet = new ethers.Wallet(key);
  return wallet.address;
}
