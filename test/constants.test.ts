/**
 * Tests for Monad Node Constants
 * 
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 */

import { 
	MONAD_NETWORKS, 
	MonadNetworkConfig,
	DEFAULT_GAS_LIMIT,
	BLOCK_CONFIRMATIONS 
} from '../nodes/Monad/constants/networks';
import { 
	CONTRACT_ADDRESSES, 
	ERC20_ABI, 
	ERC721_ABI, 
	MULTICALL3_ABI 
} from '../nodes/Monad/constants/contracts';
import { 
	COMMON_TOKENS, 
	NATIVE_TOKEN, 
	TokenInfo 
} from '../nodes/Monad/constants/tokens';
import { 
	KNOWN_VALIDATORS, 
	STAKING_PARAMS 
} from '../nodes/Monad/constants/validators';
import { 
	PERFORMANCE_TARGETS, 
	EXECUTION_CONCEPTS 
} from '../nodes/Monad/constants/performance';

describe('Network Constants', () => {
	describe('MONAD_NETWORKS', () => {
		it('should have mainnet configuration', () => {
			expect(MONAD_NETWORKS.mainnet).toBeDefined();
			expect(MONAD_NETWORKS.mainnet.name).toBe('Monad Mainnet');
			expect(MONAD_NETWORKS.mainnet.chainId).toBeDefined();
		});

		it('should have testnet configuration', () => {
			expect(MONAD_NETWORKS.testnet).toBeDefined();
			expect(MONAD_NETWORKS.testnet.name).toBe('Monad Testnet');
			expect(MONAD_NETWORKS.testnet.chainId).toBeDefined();
		});

		it('should have devnet configuration', () => {
			expect(MONAD_NETWORKS.devnet).toBeDefined();
			expect(MONAD_NETWORKS.devnet.name).toBe('Monad Devnet');
		});

		it('should have valid RPC URLs', () => {
			Object.values(MONAD_NETWORKS).forEach((network: MonadNetworkConfig) => {
				expect(network.rpcUrl).toMatch(/^https?:\/\//);
			});
		});

		it('should have valid explorer URLs', () => {
			Object.values(MONAD_NETWORKS).forEach((network: MonadNetworkConfig) => {
				if (network.explorerUrl) {
					expect(network.explorerUrl).toMatch(/^https?:\/\//);
				}
			});
		});

		it('should have valid WebSocket URLs', () => {
			Object.values(MONAD_NETWORKS).forEach((network: MonadNetworkConfig) => {
				expect(network.wsUrl).toMatch(/^wss?:\/\//);
			});
		});
	});

	describe('Network utilities', () => {
		it('should have default gas limit', () => {
			expect(DEFAULT_GAS_LIMIT).toBeDefined();
			expect(DEFAULT_GAS_LIMIT).toBeGreaterThan(0n);
		});

		it('should have block confirmation levels', () => {
			expect(BLOCK_CONFIRMATIONS.fast).toBeDefined();
			expect(BLOCK_CONFIRMATIONS.standard).toBeDefined();
			expect(BLOCK_CONFIRMATIONS.safe).toBeDefined();
			expect(BLOCK_CONFIRMATIONS.finalized).toBeDefined();
		});
	});
});

describe('Contract Constants', () => {
	describe('CONTRACT_ADDRESSES', () => {
		it('should have addresses for each network', () => {
			expect(CONTRACT_ADDRESSES.mainnet).toBeDefined();
			expect(CONTRACT_ADDRESSES.testnet).toBeDefined();
			expect(CONTRACT_ADDRESSES.devnet).toBeDefined();
		});

		it('should have multicall3 address', () => {
			expect(CONTRACT_ADDRESSES.testnet.multicall3).toBeDefined();
			expect(CONTRACT_ADDRESSES.testnet.multicall3).toMatch(/^0x[a-fA-F0-9]{40}$/);
		});

		it('should have WMONAD address', () => {
			expect(CONTRACT_ADDRESSES.testnet.wmonad).toBeDefined();
			expect(CONTRACT_ADDRESSES.testnet.wmonad).toMatch(/^0x[a-fA-F0-9]{40}$/);
		});

		it('should have entry point address', () => {
			expect(CONTRACT_ADDRESSES.testnet.entryPoint).toBeDefined();
			expect(CONTRACT_ADDRESSES.testnet.entryPoint).toMatch(/^0x[a-fA-F0-9]{40}$/);
		});

		it('should have staking address', () => {
			expect(CONTRACT_ADDRESSES.testnet.staking).toBeDefined();
		});

		it('should have governance address', () => {
			expect(CONTRACT_ADDRESSES.testnet.governance).toBeDefined();
		});
	});

	describe('ABIs', () => {
		it('should have ERC20 ABI', () => {
			expect(ERC20_ABI).toBeDefined();
			expect(Array.isArray(ERC20_ABI)).toBe(true);
			expect(ERC20_ABI.length).toBeGreaterThan(0);
			
			// Should have standard ERC20 functions
			const hasTransfer = ERC20_ABI.some(item => item.includes('transfer'));
			const hasBalanceOf = ERC20_ABI.some(item => item.includes('balanceOf'));
			
			expect(hasTransfer).toBe(true);
			expect(hasBalanceOf).toBe(true);
		});

		it('should have ERC721 ABI', () => {
			expect(ERC721_ABI).toBeDefined();
			expect(Array.isArray(ERC721_ABI)).toBe(true);
			expect(ERC721_ABI.length).toBeGreaterThan(0);
		});

		it('should have Multicall3 ABI', () => {
			expect(MULTICALL3_ABI).toBeDefined();
			expect(Array.isArray(MULTICALL3_ABI)).toBe(true);
			expect(MULTICALL3_ABI.length).toBeGreaterThan(0);
		});
	});
});

describe('Token Constants', () => {
	describe('NATIVE_TOKEN', () => {
		it('should have native MONAD token', () => {
			expect(NATIVE_TOKEN).toBeDefined();
			expect(NATIVE_TOKEN.symbol).toBe('MONAD');
			expect(NATIVE_TOKEN.decimals).toBe(18);
		});
	});

	describe('COMMON_TOKENS', () => {
		it('should have tokens for each network', () => {
			expect(COMMON_TOKENS.mainnet).toBeDefined();
			expect(COMMON_TOKENS.testnet).toBeDefined();
			expect(COMMON_TOKENS.devnet).toBeDefined();
		});

		it('should have WMONAD token', () => {
			expect(COMMON_TOKENS.testnet.WMONAD).toBeDefined();
			expect(COMMON_TOKENS.testnet.WMONAD.symbol).toBe('WMONAD');
			expect(COMMON_TOKENS.testnet.WMONAD.decimals).toBe(18);
		});

		it('should have correct token structure', () => {
			const tokens = COMMON_TOKENS.testnet;
			Object.values(tokens).forEach((token: TokenInfo) => {
				expect(token.symbol).toBeDefined();
				expect(typeof token.symbol).toBe('string');
				expect(token.decimals).toBeDefined();
				expect(typeof token.decimals).toBe('number');
				expect(token.decimals).toBeGreaterThanOrEqual(0);
				expect(token.decimals).toBeLessThanOrEqual(18);
			});
		});
	});
});

describe('Validator Constants', () => {
	describe('STAKING_PARAMS', () => {
		it('should have minimum stake amount', () => {
			expect(STAKING_PARAMS.minStakeAmount).toBeDefined();
			expect(BigInt(STAKING_PARAMS.minStakeAmount)).toBeGreaterThan(0n);
		});

		it('should have unbonding period', () => {
			expect(STAKING_PARAMS.unbondingPeriod).toBeDefined();
			expect(STAKING_PARAMS.unbondingPeriod).toBeGreaterThan(0);
		});

		it('should have max validators', () => {
			expect(STAKING_PARAMS.maxValidators).toBeDefined();
			expect(STAKING_PARAMS.maxValidators).toBeGreaterThan(0);
		});
	});

	describe('KNOWN_VALIDATORS', () => {
		it('should have validators for networks', () => {
			expect(KNOWN_VALIDATORS).toBeDefined();
			expect(KNOWN_VALIDATORS.testnet).toBeDefined();
			expect(Array.isArray(KNOWN_VALIDATORS.testnet)).toBe(true);
		});

		it('should have valid validator entries', () => {
			KNOWN_VALIDATORS.testnet.forEach(validator => {
				expect(validator.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
				expect(validator.name).toBeDefined();
			});
		});
	});
});

describe('Performance Constants', () => {
	describe('PERFORMANCE_TARGETS', () => {
		it('should have target TPS', () => {
			expect(PERFORMANCE_TARGETS.targetTps).toBeDefined();
			expect(PERFORMANCE_TARGETS.targetTps).toBeGreaterThanOrEqual(10000);
		});

		it('should have block time', () => {
			expect(PERFORMANCE_TARGETS.targetBlockTime).toBeDefined();
			expect(PERFORMANCE_TARGETS.targetBlockTime).toBeGreaterThan(0);
		});

		it('should have finality time', () => {
			expect(PERFORMANCE_TARGETS.targetFinality).toBeDefined();
			expect(PERFORMANCE_TARGETS.targetFinality).toBeGreaterThan(0);
		});

		it('should have parallel execution parameters', () => {
			expect(PERFORMANCE_TARGETS.parallelThreads).toBeDefined();
			expect(PERFORMANCE_TARGETS.parallelThreads).toBeGreaterThan(0);
		});
	});

	describe('EXECUTION_CONCEPTS', () => {
		it('should have parallel execution concept', () => {
			expect(EXECUTION_CONCEPTS.parallelExecution).toBeDefined();
			expect(EXECUTION_CONCEPTS.parallelExecution.description).toBeDefined();
		});

		it('should have deferred execution concept', () => {
			expect(EXECUTION_CONCEPTS.deferredExecution).toBeDefined();
			expect(EXECUTION_CONCEPTS.deferredExecution.description).toBeDefined();
		});

		it('should have MonadDB concept', () => {
			expect(EXECUTION_CONCEPTS.monadDb).toBeDefined();
			expect(EXECUTION_CONCEPTS.monadDb.description).toBeDefined();
		});

		it('should have MonadBFT concept', () => {
			expect(EXECUTION_CONCEPTS.monadBft).toBeDefined();
			expect(EXECUTION_CONCEPTS.monadBft.description).toBeDefined();
		});
	});
});
