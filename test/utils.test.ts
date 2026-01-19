/**
 * Tests for Monad Node Utility Functions
 * 
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 */

import {
	isValidAddress,
	toChecksumAddress,
	normalizeAddress,
	shortenAddress,
	addressesEqual,
	isZeroAddress,
} from '../nodes/Monad/utils/addressUtils';

import {
	formatGas,
	GasEstimate,
} from '../nodes/Monad/utils/gasUtils';

import {
	analyzeConflicts,
	groupForParallelExecution,
	calculateParallelStats,
	calculateTheoreticalTps,
	StateAccess,
	TransactionDependency,
} from '../nodes/Monad/utils/parallelUtils';

import {
	numberToHex,
	hexToNumber,
} from '../nodes/Monad/utils/encodingUtils';

// Test data
const VALID_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
const VALID_ADDRESS_LOWER = '0x742d35cc6634c0532925a3b844bc454e4438f44e';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const INVALID_ADDRESS = '0xinvalid';
const SHORT_ADDRESS = '0x1234';

describe('Address Utilities', () => {
	describe('isValidAddress', () => {
		it('should validate correct addresses', () => {
			expect(isValidAddress(VALID_ADDRESS)).toBe(true);
			expect(isValidAddress(VALID_ADDRESS_LOWER)).toBe(true);
			expect(isValidAddress(ZERO_ADDRESS)).toBe(true);
		});

		it('should reject invalid addresses', () => {
			expect(isValidAddress(INVALID_ADDRESS)).toBe(false);
			expect(isValidAddress(SHORT_ADDRESS)).toBe(false);
			expect(isValidAddress('')).toBe(false);
			expect(isValidAddress('random string')).toBe(false);
		});
	});

	describe('toChecksumAddress', () => {
		it('should return properly checksummed addresses', () => {
			const checksummed = toChecksumAddress(VALID_ADDRESS_LOWER);
			expect(checksummed).toMatch(/^0x[0-9a-fA-F]{40}$/);
		});

		it('should throw on invalid addresses', () => {
			expect(() => toChecksumAddress(INVALID_ADDRESS)).toThrow();
			expect(() => toChecksumAddress('')).toThrow();
		});
	});

	describe('normalizeAddress', () => {
		it('should return checksummed address for valid input', () => {
			const result = normalizeAddress(VALID_ADDRESS_LOWER);
			expect(result).not.toBeNull();
			expect(result).toMatch(/^0x[0-9a-fA-F]{40}$/);
		});

		it('should return null for invalid input', () => {
			expect(normalizeAddress(INVALID_ADDRESS)).toBeNull();
			expect(normalizeAddress('')).toBeNull();
		});
	});

	describe('shortenAddress', () => {
		it('should shorten addresses correctly', () => {
			const shortened = shortenAddress(VALID_ADDRESS, 4);
			expect(shortened).toMatch(/^0x.{4}\.\.\..{4}$/);
			expect(shortened.length).toBe(13); // 0x + 4 + ... + 4
		});

		it('should return original string for invalid addresses', () => {
			expect(shortenAddress(INVALID_ADDRESS, 4)).toBe(INVALID_ADDRESS);
		});
	});

	describe('addressesEqual', () => {
		it('should compare addresses case-insensitively', () => {
			expect(addressesEqual(VALID_ADDRESS, VALID_ADDRESS_LOWER)).toBe(true);
			expect(addressesEqual(VALID_ADDRESS_LOWER, VALID_ADDRESS)).toBe(true);
		});

		it('should return false for different addresses', () => {
			expect(addressesEqual(VALID_ADDRESS, ZERO_ADDRESS)).toBe(false);
		});

		it('should return false for invalid addresses', () => {
			expect(addressesEqual(VALID_ADDRESS, INVALID_ADDRESS)).toBe(false);
			expect(addressesEqual(INVALID_ADDRESS, VALID_ADDRESS)).toBe(false);
		});
	});

	describe('isZeroAddress', () => {
		it('should identify zero address', () => {
			expect(isZeroAddress(ZERO_ADDRESS)).toBe(true);
		});

		it('should return false for non-zero addresses', () => {
			expect(isZeroAddress(VALID_ADDRESS)).toBe(false);
		});
	});
});

describe('Gas Utilities', () => {
	describe('formatGas', () => {
		it('should format gas values in Wei', () => {
			const formatted = formatGas(21000n);
			expect(formatted).toContain('21000');
		});

		it('should format gas values in Gwei for larger amounts', () => {
			const formatted = formatGas(1000000000n); // 1 Gwei
			expect(formatted).toContain('Gwei');
		});

		it('should handle zero', () => {
			const formatted = formatGas(0n);
			expect(formatted).toContain('0');
		});
	});
});

describe('Parallel Execution Utilities', () => {
	// StateAccess test data
	const access1: StateAccess = {
		address: '0x1111111111111111111111111111111111111111',
		slots: ['0x01'],
		type: 'write',
	};

	const access2: StateAccess = {
		address: '0x1111111111111111111111111111111111111111',
		slots: ['0x01'],
		type: 'write',
	};

	const access3: StateAccess = {
		address: '0x2222222222222222222222222222222222222222',
		slots: ['0x02'],
		type: 'read',
	};

	const access4: StateAccess = {
		address: '0x1111111111111111111111111111111111111111',
		slots: ['0x01'],
		type: 'read',
	};

	describe('analyzeConflicts', () => {
		it('should detect write-write conflicts', () => {
			const analysis = analyzeConflicts([access1], [access2]);
			expect(analysis.hasConflict).toBe(true);
			expect(analysis.conflictingSlots.length).toBeGreaterThan(0);
		});

		it('should detect read-write conflicts', () => {
			const analysis = analyzeConflicts([access1], [access4]);
			expect(analysis.hasConflict).toBe(true);
		});

		it('should return no conflicts for independent transactions', () => {
			const analysis = analyzeConflicts([access1], [access3]);
			expect(analysis.hasConflict).toBe(false);
			expect(analysis.conflictingSlots.length).toBe(0);
		});

		it('should handle empty arrays', () => {
			const analysis = analyzeConflicts([], []);
			expect(analysis.hasConflict).toBe(false);
		});
	});

	describe('groupForParallelExecution', () => {
		it('should group non-conflicting transactions', () => {
			const tx1: TransactionDependency = {
				txHash: '0xaaa',
				dependsOn: [],
				stateAccesses: [access1],
				canParallelize: true,
			};
			const tx2: TransactionDependency = {
				txHash: '0xbbb',
				dependsOn: [],
				stateAccesses: [access3],
				canParallelize: true,
			};

			const groups = groupForParallelExecution([tx1, tx2]);
			expect(groups.length).toBeGreaterThan(0);
			// Non-conflicting transactions can be in the same batch
			expect(groups[0].length).toBe(2);
		});

		it('should separate conflicting transactions into different groups', () => {
			const tx1: TransactionDependency = {
				txHash: '0xaaa',
				dependsOn: [],
				stateAccesses: [access1],
				canParallelize: true,
			};
			const tx2: TransactionDependency = {
				txHash: '0xbbb',
				dependsOn: [],
				stateAccesses: [access2],
				canParallelize: true,
			};

			const groups = groupForParallelExecution([tx1, tx2]);
			expect(groups.length).toBeGreaterThanOrEqual(2);
		});

		it('should handle dependencies', () => {
			const tx1: TransactionDependency = {
				txHash: '0xaaa',
				dependsOn: [],
				stateAccesses: [],
				canParallelize: true,
			};
			const tx2: TransactionDependency = {
				txHash: '0xbbb',
				dependsOn: ['0xaaa'],
				stateAccesses: [],
				canParallelize: true,
			};

			const groups = groupForParallelExecution([tx1, tx2]);
			// tx2 depends on tx1, so they should be in different batches
			expect(groups.length).toBe(2);
		});
	});

	describe('calculateParallelStats', () => {
		it('should calculate statistics correctly', () => {
			const batches = [['tx1', 'tx2'], ['tx3']];
			const stats = calculateParallelStats(batches, 3);
			expect(stats.totalTransactions).toBe(3);
			expect(stats.parallelizedCount).toBe(2);
			expect(stats.serializedCount).toBe(1);
		});

		it('should handle empty batches', () => {
			const stats = calculateParallelStats([], 0);
			expect(stats.totalTransactions).toBe(0);
			expect(stats.parallelizationRatio).toBe(0);
		});
	});

	describe('calculateTheoreticalTps', () => {
		it('should estimate TPS correctly', () => {
			const tps = calculateTheoreticalTps(0.5, 100, 100);
			expect(typeof tps).toBe('number');
			expect(tps).toBeGreaterThan(100); // Should be boosted by parallelization
		});

		it('should handle zero parallelization', () => {
			const tps = calculateTheoreticalTps(0, 100);
			expect(tps).toBe(100); // Just base serial TPS
		});

		it('should handle full parallelization', () => {
			const tps = calculateTheoreticalTps(1.0, 100, 100);
			expect(tps).toBe(10100); // 100 * (1 + 100)
		});
	});
});

describe('Encoding Utilities', () => {
	describe('numberToHex', () => {
		it('should convert number to hex', () => {
			expect(numberToHex(255)).toBe('0xff');
			expect(numberToHex(0)).toBe('0x0');
			expect(numberToHex(16)).toBe('0x10');
		});

		it('should convert bigint to hex', () => {
			expect(numberToHex(BigInt(255))).toBe('0xff');
			expect(numberToHex(BigInt('1000000000000000000'))).toBe('0xde0b6b3a7640000');
		});
	});

	describe('hexToNumber', () => {
		it('should convert hex to number', () => {
			expect(hexToNumber('0xff')).toBe(255);
			expect(hexToNumber('0x0')).toBe(0);
			expect(hexToNumber('0x10')).toBe(16);
		});

		it('should handle uppercase hex', () => {
			expect(hexToNumber('0xFF')).toBe(255);
			expect(hexToNumber('0xABCD')).toBe(43981);
		});
	});
});
