/**
 * @file Parallel Execution Resource Operations
 * @copyright 2025 Velocity BPA
 * @license BSL-1.1
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getMonadClient } from '../../transport/monadClient';
import {
	analyzeParallelizability,
	createParallelBatches,
	calculateParallelStats,
	generateParallelReport,
} from '../../utils/parallelUtils';
import { parseCallTrace, extractAddressesFromTrace } from '../../utils/traceUtils';

export const parallelExecutionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['parallelExecution'],
			},
		},
		options: [
			{
				name: 'Analyze Transactions',
				value: 'analyzeTransactions',
				description: 'Analyze transactions for parallel execution potential',
				action: 'Analyze transactions for parallelization',
			},
			{
				name: 'Create Parallel Batches',
				value: 'createBatches',
				description: 'Group transactions into parallel-safe batches',
				action: 'Create parallel batches',
			},
			{
				name: 'Get Parallelization Stats',
				value: 'getStats',
				description: 'Get block-level parallelization statistics',
				action: 'Get parallelization stats',
			},
			{
				name: 'Analyze Conflicts',
				value: 'analyzeConflicts',
				description: 'Analyze state access conflicts between transactions',
				action: 'Analyze transaction conflicts',
			},
			{
				name: 'Estimate Parallel TPS',
				value: 'estimateTps',
				description: 'Estimate theoretical TPS for transaction set',
				action: 'Estimate parallel TPS',
			},
			{
				name: 'Get Execution Report',
				value: 'getExecutionReport',
				description: 'Get detailed parallel execution report',
				action: 'Get execution report',
			},
		],
		default: 'analyzeTransactions',
	},
];

export const parallelExecutionFields: INodeProperties[] = [
	{
		displayName: 'Transaction Hashes',
		name: 'transactionHashes',
		type: 'json',
		required: true,
		displayOptions: {
			show: {
				resource: ['parallelExecution'],
				operation: ['analyzeTransactions', 'createBatches', 'analyzeConflicts', 'estimateTps'],
			},
		},
		default: '[]',
		description: 'Array of transaction hashes to analyze',
	},
	{
		displayName: 'Block Number',
		name: 'blockNumber',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['parallelExecution'],
				operation: ['getStats', 'getExecutionReport'],
			},
		},
		default: 0,
		description: 'Block number to analyze',
	},
	{
		displayName: 'Include Traces',
		name: 'includeTraces',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['parallelExecution'],
				operation: ['analyzeTransactions', 'analyzeConflicts'],
			},
		},
		default: true,
		description: 'Whether to include execution traces for deeper analysis',
	},
	{
		displayName: 'Max Batch Size',
		name: 'maxBatchSize',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['parallelExecution'],
				operation: ['createBatches'],
			},
		},
		default: 100,
		description: 'Maximum number of transactions per batch',
	},
];

export async function executeParallelExecutionOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('monadNetwork');
	const client = getMonadClient(credentials);

	let result: any;

	switch (operation) {
		case 'analyzeTransactions': {
			const txHashesJson = this.getNodeParameter('transactionHashes', index) as string;
			const includeTraces = this.getNodeParameter('includeTraces', index, true) as boolean;

			const txHashes = JSON.parse(txHashesJson);
			const transactions: any[] = [];

			for (const hash of txHashes) {
				const tx = await client.getTransaction(hash);
				if (tx) {
					const txData: any = {
						hash,
						from: tx.from,
						to: tx.to,
						data: tx.data,
						value: tx.value?.toString(),
					};

					if (includeTraces) {
						try {
							const trace = await client.rawRpcCall('debug_traceTransaction', [
								hash,
								{ tracer: 'callTracer' },
							]);
							const parsedTrace = parseCallTrace(trace);
							txData.addressesAccessed = extractAddressesFromTrace(parsedTrace);
							txData.trace = parsedTrace;
						} catch {
							// Trace not available
						}
					}

					transactions.push(txData);
				}
			}

			const analysis = analyzeParallelizability(transactions);

			result = {
				transactionCount: transactions.length,
				transactions,
				analysis,
			};
			break;
		}

		case 'createBatches': {
			const txHashesJson = this.getNodeParameter('transactionHashes', index) as string;
			const maxBatchSize = this.getNodeParameter('maxBatchSize', index, 100) as number;

			const txHashes = JSON.parse(txHashesJson);
			const transactions: any[] = [];

			for (const hash of txHashes) {
				const tx = await client.getTransaction(hash);
				if (tx) {
					transactions.push({
						hash,
						from: tx.from,
						to: tx.to,
						data: tx.data,
					});
				}
			}

			const batches = createParallelBatches(transactions, maxBatchSize);

			result = {
				transactionCount: transactions.length,
				batchCount: batches.length,
				batches: batches.map((batch, i) => ({
					batchIndex: i,
					transactionCount: batch.length,
					transactions: batch.map((tx: any) => tx.hash),
				})),
				parallelizationRatio: batches.length > 0
					? transactions.length / batches.length
					: 0,
			};
			break;
		}

		case 'getStats': {
			const blockNumber = this.getNodeParameter('blockNumber', index) as number;

			const block = await client.getBlock(blockNumber, true);
			if (!block) {
				throw new NodeOperationError(this.getNode(), `Block not found: ${blockNumber}`);
			}

			const transactions = (block.transactions || []).map((tx: any) =>
				typeof tx === 'string' ? { hash: tx } : { hash: tx.hash, from: tx.from, to: tx.to }
			);

			const stats = calculateParallelStats(transactions);

			result = {
				blockNumber,
				transactionCount: transactions.length,
				...stats,
			};
			break;
		}

		case 'analyzeConflicts': {
			const txHashesJson = this.getNodeParameter('transactionHashes', index) as string;
			const includeTraces = this.getNodeParameter('includeTraces', index, true) as boolean;

			const txHashes = JSON.parse(txHashesJson);
			const conflicts: any[] = [];

			// Build state access map
			const stateAccess: Map<string, { reads: Set<string>; writes: Set<string> }> = new Map();

			for (const hash of txHashes) {
				const tx = await client.getTransaction(hash);
				if (!tx) continue;

				const reads = new Set<string>();
				const writes = new Set<string>();

				// Base state access from tx
				if (tx.from) reads.add(tx.from.toLowerCase());
				if (tx.to) {
					reads.add(tx.to.toLowerCase());
					writes.add(tx.to.toLowerCase());
				}

				if (includeTraces) {
					try {
						const trace = await client.rawRpcCall('debug_traceTransaction', [
							hash,
							{ tracer: 'callTracer' },
						]);
						const addresses = extractAddressesFromTrace(parseCallTrace(trace));
						addresses.forEach((addr: string) => {
							reads.add(addr.toLowerCase());
							writes.add(addr.toLowerCase());
						});
					} catch {
						// Trace not available
					}
				}

				stateAccess.set(hash, { reads, writes });
			}

			// Find conflicts
			const hashList = Array.from(stateAccess.keys());
			for (let i = 0; i < hashList.length; i++) {
				for (let j = i + 1; j < hashList.length; j++) {
					const tx1 = stateAccess.get(hashList[i])!;
					const tx2 = stateAccess.get(hashList[j])!;

					// Write-Write conflict
					const writeWriteConflicts: string[] = [];
					tx1.writes.forEach(addr => {
						if (tx2.writes.has(addr)) {
							writeWriteConflicts.push(addr);
						}
					});

					// Read-Write conflict
					const readWriteConflicts: string[] = [];
					tx1.reads.forEach(addr => {
						if (tx2.writes.has(addr)) {
							readWriteConflicts.push(addr);
						}
					});
					tx2.reads.forEach(addr => {
						if (tx1.writes.has(addr)) {
							if (!readWriteConflicts.includes(addr)) {
								readWriteConflicts.push(addr);
							}
						}
					});

					if (writeWriteConflicts.length > 0 || readWriteConflicts.length > 0) {
						conflicts.push({
							transaction1: hashList[i],
							transaction2: hashList[j],
							writeWriteConflicts,
							readWriteConflicts,
							canRunParallel: false,
						});
					}
				}
			}

			const nonConflictingPairs = (hashList.length * (hashList.length - 1)) / 2 - conflicts.length;

			result = {
				transactionCount: hashList.length,
				totalPairs: (hashList.length * (hashList.length - 1)) / 2,
				conflictingPairs: conflicts.length,
				nonConflictingPairs,
				parallelizationPotential: nonConflictingPairs / ((hashList.length * (hashList.length - 1)) / 2) || 0,
				conflicts,
			};
			break;
		}

		case 'estimateTps': {
			const txHashesJson = this.getNodeParameter('transactionHashes', index) as string;
			const txHashes = JSON.parse(txHashesJson);

			const transactions: any[] = [];
			for (const hash of txHashes) {
				const tx = await client.getTransaction(hash);
				if (tx) {
					transactions.push({
						hash,
						from: tx.from,
						to: tx.to,
					});
				}
			}

			const batches = createParallelBatches(transactions, 1000);
			const stats = calculateParallelStats(transactions);

			// Monad targets 1 second blocks with 10,000 TPS
			const blockTimeMs = 1000;
			const parallelThreads = 10000;

			// Theoretical TPS = (transactions / batches) * parallelThreads / blockTime
			const theoreticalTps = batches.length > 0
				? (transactions.length / batches.length) * Math.min(parallelThreads, transactions.length)
				: 0;

			result = {
				transactionCount: transactions.length,
				batchCount: batches.length,
				parallelizationRatio: stats.parallelizationRatio,
				theoreticalTps: Math.min(theoreticalTps, 10000),
				monadTargetTps: 10000,
				blockTimeMs,
				efficiency: theoreticalTps / 10000,
			};
			break;
		}

		case 'getExecutionReport': {
			const blockNumber = this.getNodeParameter('blockNumber', index) as number;

			const block = await client.getBlock(blockNumber, true);
			if (!block) {
				throw new NodeOperationError(this.getNode(), `Block not found: ${blockNumber}`);
			}

			const transactions = (block.transactions || []).map((tx: any) =>
				typeof tx === 'string'
					? { hash: tx }
					: { hash: tx.hash, from: tx.from, to: tx.to, gasUsed: tx.gas }
			);

			const report = generateParallelReport(transactions);

			result = {
				blockNumber,
				blockHash: block.hash,
				timestamp: block.timestamp,
				...report,
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result }];
}
export { parallelExecutionOperations as operations, parallelExecutionFields as fields, executeParallelExecutionOperation as execute };
