/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export interface ValidatorInfo {
  address: string;
  name: string;
  website?: string;
  commission: number; // Percentage (0-100)
  active: boolean;
}

/**
 * Known validators on Monad networks
 * Note: These are placeholder entries - update with actual validator information
 */
export const KNOWN_VALIDATORS: Record<string, ValidatorInfo[]> = {
  mainnet: [
    // Placeholder validators - update when mainnet launches
  ],
  testnet: [
    // Placeholder validators - update when testnet validators are known
    {
      address: '0x0000000000000000000000000000000000000001',
      name: 'Monad Foundation',
      website: 'https://monad.xyz',
      commission: 5,
      active: true,
    },
  ],
  devnet: [
    // Devnet validators
    {
      address: '0x0000000000000000000000000000000000000001',
      name: 'Devnet Validator 1',
      commission: 0,
      active: true,
    },
  ],
};

export function getKnownValidators(network: string): ValidatorInfo[] {
  return KNOWN_VALIDATORS[network] || [];
}

export function getValidatorByAddress(network: string, address: string): ValidatorInfo | undefined {
  const validators = getKnownValidators(network);
  return validators.find(v => v.address.toLowerCase() === address.toLowerCase());
}

// Validator status constants
export const VALIDATOR_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  JAILED: 'jailed',
  UNBONDING: 'unbonding',
} as const;

// Staking parameters (these may vary by network)
export const STAKING_PARAMS = {
  minStakeAmount: '1000000000000000000', // 1 MONAD in wei
  unbondingPeriod: 7 * 24 * 60 * 60, // 7 days in seconds
  maxValidators: 100,
  minSelfDelegation: '100000000000000000000', // 100 MONAD in wei
  slashFractionDoubleSign: 0.05, // 5%
  slashFractionDowntime: 0.01, // 1%
} as const;

// MonadBFT consensus parameters
export const CONSENSUS_PARAMS = {
  blockTime: 1000, // 1 second target block time
  finalityTime: 1000, // 1 second finality
  validatorSetSize: 100, // Max validators
  roundDuration: 1000, // Round duration in ms
  proposerRotation: 'weighted-random', // Proposer selection method
} as const;
