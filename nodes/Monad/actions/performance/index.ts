/**
 * n8n-nodes-monad
 * Copyright (c) 2025
 * Licensed under BSL 1.1
 * See LICENSE file for details
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';

export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['performance'],
			},
		},
		options: [
			{
				name: 'Get Network Stats',
				value: 'getNetworkStats',
				description: 'Get current network performance statistics',
				action: 'Get network stats',
			},
			{
				name: 'Get TPS',
				value: 'getTps',
				description: 'Calculate transactions per second',
				action: 'Get TPS',
			},
			{
				name: 'Get Block Times',
				value: 'getBlockTimes',
				description: 'Get block time statistics',
				action: 'Get block times',
			},
			{
				name: 'Get Finality Stats',
				value: 'getFinalityStats',
				description: 'Get finality timing statistics',
				action: 'Get finality stats',
			},
			{
				name: 'Benchmark RPC',
				value: 'benchmarkRpc',
				description: 'Benchmark RPC endpoint performance',
				action: 'Benchmark RPC',
			},
			{
				name: 'Get Gas Efficiency',
				value: 'getGasEfficiency',
				description: 'Analyze gas efficiency metrics',
				action: 'Get gas efficiency',
			},
			{
				name: 'Get Parallel Efficiency',
				value: 'getParallelEfficiency',
				description: 'Get parallel execution efficiency',
				action: 'Get parallel efficiency',
			},
			{
				name: 'Compare Performance',
				value: 'comparePerformance',
				description: 'Compare performance over time periods',
				action: 'Compare performance',
			},
		],
		default: 'getNetworkStats',
	},
];

export const fields: INodeProperties[] = [
	// getTps
	{
		displayName: 'Block Range',
		name: 'blockRange',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['performance'],
				operation: ['getTps', 'getBlockTimes', 'getGasEfficiency', 'getParallelEfficiency'],
			},
		},
		default: 100,
		description: 'Number of recent blocks to analyze',
	},

	// benchmarkRpc
	{
		displayName: 'Test Iterations',
		name: 'iterations',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['performance'],
				operation: ['benchmarkRpc'],
			},
		},
		default: 10,
		description: 'Number of test iterations',
	},
	{
		displayName: 'Test Methods',
		name: 'testMethods',
		type: 'multiOptions',
		displayOptions: {
			show: {
				resource: ['performance'],
				operation: ['benchmarkRpc'],
			},
		},
		options: [
			{ name: 'eth_blockNumber', value: 'eth_blockNumber' },
			{ name: 'eth_getBalance', value: 'eth_getBalance' },
			{ name: 'eth_getBlockByNumber', value: 'eth_getBlockByNumber' },
			{ name: 'eth_call', value: 'eth_call' },
			{ name: 'eth_chainId', value: 'eth_chainId' },
		],
		default: ['eth_blockNumber', 'eth_chainId'],
		description: 'RPC methods to benchmark',
	},

	// comparePerformance
	{
		displayName: 'Period 1 Start Block',
		name: 'period1Start',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['performance'],
				operation: ['comparePerformance'],
			},
		},
		default: 0,
		description: 'Starting block for first period',
	},
	{
		displayName: 'Period 1 End Block',
		name: 'period1End',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['performance'],
				operation: ['comparePerformance'],
			},
		},
		default: 0,
		description: 'Ending block for first period',
	},
	{
		displayName: 'Period 2 Start Block',
		name: 'period2Start',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['performance'],
				operation: ['comparePerformance'],
			},
		},
		default: 0,
		description: 'Starting block for second period',
	},
	{
		displayName: 'Period 2 End Block',
		name: 'period2End',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['performance'],
				operation: ['comparePerformance'],
			},
		},
		default: 0,
		description: 'Ending block for second period',
	},

	// getFinalityStats
	{
		displayName: 'Sample Size',
		name: 'sampleSize',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['performance'],
				operation: ['getFinalityStats'],
			},
		},
		default: 50,
		description: 'Number of blocks to sample for finality stats',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	credentials: { rpcUrl: string; apiKey?: string },
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const results: INodeExecutionData[] = [];

	const rpcCall = async (method: string, params: unknown[] = []) => {
		const response = await this.helpers.httpRequest({
			method: 'POST',
			url: credentials.rpcUrl,
			headers: {
				'Content-Type': 'application/json',
				...(credentials.apiKey && { 'X-API-Key': credentials.apiKey }),
			},
			body: {
				jsonrpc: '2.0',
				id: Date.now(),
				method,
				params,
			},
		});
		if (response.error) {
			throw new NodeOperationError(this.getNode(), `RPC Error: ${response.error.message}`);
		}
		return response.result;
	};

	switch (operation) {
		case 'getNetworkStats': {
			const latestBlockHex = await rpcCall('eth_blockNumber');
			const latestBlockNum = parseInt(latestBlockHex, 16);

			// Get latest block details
			const latestBlock = await rpcCall('eth_getBlockByNumber', [latestBlockHex, false]);

			// Get block from 100 blocks ago for TPS calculation
			const oldBlockNum = Math.max(0, latestBlockNum - 100);
			const oldBlock = await rpcCall('eth_getBlockByNumber', [`0x${oldBlockNum.toString(16)}`, false]);

			// Calculate stats
			const timeDiff = parseInt(latestBlock.timestamp, 16) - parseInt(oldBlock.timestamp, 16);
			const blocksDiff = latestBlockNum - oldBlockNum;
			const avgBlockTime = timeDiff / blocksDiff;

			// Get gas stats
			const gasPrice = await rpcCall('eth_gasPrice');
			const baseFee = latestBlock.baseFeePerGas ? parseInt(latestBlock.baseFeePerGas, 16) : 0;

			// Get pending tx count
			let pendingCount = 0;
			try {
				const txpoolStatus = await rpcCall('txpool_status');
				pendingCount = parseInt(txpoolStatus?.pending || '0x0', 16);
			} catch {
				// txpool might not be available
			}

			// Get chain ID
			const chainId = await rpcCall('eth_chainId');

			results.push({
				json: {
					success: true,
					network: {
						chainId: parseInt(chainId, 16),
						latestBlock: latestBlockNum,
						avgBlockTime: avgBlockTime.toFixed(2),
						targetBlockTime: 1, // Monad target
					},
					gas: {
						gasPrice: parseInt(gasPrice, 16),
						gasPriceGwei: parseInt(gasPrice, 16) / 1e9,
						baseFee,
						baseFeeGwei: baseFee / 1e9,
					},
					mempool: {
						pendingTransactions: pendingCount,
					},
					latestBlockInfo: {
						number: latestBlockNum,
						timestamp: parseInt(latestBlock.timestamp, 16),
						gasUsed: parseInt(latestBlock.gasUsed, 16),
						gasLimit: parseInt(latestBlock.gasLimit, 16),
						transactionCount: latestBlock.transactions?.length || 0,
					},
				},
			});
			break;
		}

		case 'getTps': {
			const blockRange = this.getNodeParameter('blockRange', index) as number;

			const latestBlockHex = await rpcCall('eth_blockNumber');
			const latestBlockNum = parseInt(latestBlockHex, 16);

			// Fetch blocks to calculate TPS
			const startBlock = Math.max(0, latestBlockNum - blockRange);
			const endBlock = latestBlockNum;

			const startBlockData = await rpcCall('eth_getBlockByNumber', [`0x${startBlock.toString(16)}`, false]);
			const endBlockData = await rpcCall('eth_getBlockByNumber', [`0x${endBlock.toString(16)}`, false]);

			// Count transactions in sample blocks
			let totalTxs = 0;
			const sampleInterval = Math.max(1, Math.floor(blockRange / 10));
			const samples: Array<{ block: number; txCount: number }> = [];

			for (let i = startBlock; i <= endBlock; i += sampleInterval) {
				const block = await rpcCall('eth_getBlockByNumber', [`0x${i.toString(16)}`, false]);
				const txCount = block.transactions?.length || 0;
				totalTxs += txCount;
				samples.push({ block: i, txCount });
			}

			const timeDiff = parseInt(endBlockData.timestamp, 16) - parseInt(startBlockData.timestamp, 16);
			const avgTxPerBlock = totalTxs / samples.length;
			const blocksPerSecond = blockRange / timeDiff;
			const estimatedTps = avgTxPerBlock * blocksPerSecond;

			results.push({
				json: {
					success: true,
					analysis: {
						blockRange: { start: startBlock, end: endBlock },
						timeSpan: timeDiff,
						blocksAnalyzed: samples.length,
					},
					tps: {
						current: estimatedTps.toFixed(2),
						avgTxPerBlock: avgTxPerBlock.toFixed(2),
						blocksPerSecond: blocksPerSecond.toFixed(4),
						theoretical: 10000, // Monad target
						utilization: ((estimatedTps / 10000) * 100).toFixed(2) + '%',
					},
					samples: samples.slice(0, 20), // Limit output
				},
			});
			break;
		}

		case 'getBlockTimes': {
			const blockRange = this.getNodeParameter('blockRange', index) as number;

			const latestBlockHex = await rpcCall('eth_blockNumber');
			const latestBlockNum = parseInt(latestBlockHex, 16);

			const blockTimes: number[] = [];
			let prevTimestamp = 0;

			for (let i = Math.max(0, latestBlockNum - blockRange); i <= latestBlockNum; i++) {
				const block = await rpcCall('eth_getBlockByNumber', [`0x${i.toString(16)}`, false]);
				const timestamp = parseInt(block.timestamp, 16);

				if (prevTimestamp > 0) {
					blockTimes.push(timestamp - prevTimestamp);
				}
				prevTimestamp = timestamp;
			}

			// Calculate statistics
			const sum = blockTimes.reduce((a, b) => a + b, 0);
			const avg = sum / blockTimes.length;
			const sorted = [...blockTimes].sort((a, b) => a - b);
			const min = sorted[0];
			const max = sorted[sorted.length - 1];
			const median = sorted[Math.floor(sorted.length / 2)];
			const p95 = sorted[Math.floor(sorted.length * 0.95)];
			const p99 = sorted[Math.floor(sorted.length * 0.99)];

			// Calculate variance and std dev
			const variance = blockTimes.reduce((acc, time) => acc + Math.pow(time - avg, 2), 0) / blockTimes.length;
			const stdDev = Math.sqrt(variance);

			results.push({
				json: {
					success: true,
					blocksAnalyzed: blockTimes.length,
					blockRange: {
						start: latestBlockNum - blockRange,
						end: latestBlockNum,
					},
					statistics: {
						average: avg.toFixed(4),
						median,
						min,
						max,
						p95,
						p99,
						standardDeviation: stdDev.toFixed(4),
						targetBlockTime: 1, // Monad target: 1 second
					},
					consistency: {
						withinTarget: blockTimes.filter(t => t <= 1).length,
						percentWithinTarget: ((blockTimes.filter(t => t <= 1).length / blockTimes.length) * 100).toFixed(2) + '%',
					},
					distribution: {
						under1s: blockTimes.filter(t => t < 1).length,
						'1to2s': blockTimes.filter(t => t >= 1 && t < 2).length,
						'2to5s': blockTimes.filter(t => t >= 2 && t < 5).length,
						over5s: blockTimes.filter(t => t >= 5).length,
					},
				},
			});
			break;
		}

		case 'getFinalityStats': {
			const sampleSize = this.getNodeParameter('sampleSize', index) as number;

			const latestBlockHex = await rpcCall('eth_blockNumber');
			const latestBlockNum = parseInt(latestBlockHex, 16);

			// For Monad with MonadBFT, finality is single-slot
			// We simulate finality timing analysis
			const finalityTimes: number[] = [];

			for (let i = 0; i < Math.min(sampleSize, latestBlockNum); i++) {
				const blockNum = latestBlockNum - i;
				const block = await rpcCall('eth_getBlockByNumber', [`0x${blockNum.toString(16)}`, false]);

				// In MonadBFT, blocks are finalized immediately
				// Simulate by using block time as finality time
				if (i > 0) {
					const prevBlock = await rpcCall('eth_getBlockByNumber', [`0x${(blockNum + 1).toString(16)}`, false]);
					const finalityTime = parseInt(prevBlock.timestamp, 16) - parseInt(block.timestamp, 16);
					finalityTimes.push(Math.abs(finalityTime));
				}
			}

			const avgFinality = finalityTimes.reduce((a, b) => a + b, 0) / finalityTimes.length;

			results.push({
				json: {
					success: true,
					consensusMechanism: 'MonadBFT',
					sampleSize: finalityTimes.length,
					finalityStats: {
						averageFinalityTime: avgFinality.toFixed(4),
						singleSlotFinality: true,
						guaranteedFinality: '1 block',
						reorgProbability: '0%',
					},
					comparison: {
						monad: '~1 second',
						ethereum: '~12-15 minutes',
						solana: '~400ms',
					},
				},
			});
			break;
		}

		case 'benchmarkRpc': {
			const iterations = this.getNodeParameter('iterations', index) as number;
			const testMethods = this.getNodeParameter('testMethods', index) as string[];

			const benchmarks: Record<string, { times: number[]; errors: number }> = {};

			// Initialize benchmark data
			for (const method of testMethods) {
				benchmarks[method] = { times: [], errors: 0 };
			}

			// Get a test address for eth_getBalance
			const testAddress = '0x0000000000000000000000000000000000000001';

			// Run benchmarks
			for (let i = 0; i < iterations; i++) {
				for (const method of testMethods) {
					const start = Date.now();
					try {
						let params: unknown[] = [];
						switch (method) {
							case 'eth_getBalance':
								params = [testAddress, 'latest'];
								break;
							case 'eth_getBlockByNumber':
								params = ['latest', false];
								break;
							case 'eth_call':
								params = [{ to: testAddress, data: '0x' }, 'latest'];
								break;
						}
						await rpcCall(method, params);
						benchmarks[method].times.push(Date.now() - start);
					} catch {
						benchmarks[method].errors++;
					}
				}
			}

			// Calculate statistics
			const results_data: Record<string, unknown> = {};
			for (const method of testMethods) {
				const times = benchmarks[method].times;
				if (times.length > 0) {
					const sorted = [...times].sort((a, b) => a - b);
					results_data[method] = {
						iterations: times.length,
						errors: benchmarks[method].errors,
						avgLatency: (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2) + 'ms',
						minLatency: sorted[0] + 'ms',
						maxLatency: sorted[sorted.length - 1] + 'ms',
						p50: sorted[Math.floor(sorted.length * 0.5)] + 'ms',
						p95: sorted[Math.floor(sorted.length * 0.95)] + 'ms',
						p99: sorted[Math.floor(sorted.length * 0.99)] + 'ms',
					};
				}
			}

			results.push({
				json: {
					success: true,
					rpcEndpoint: credentials.rpcUrl,
					iterations,
					methodsBenchmarked: testMethods.length,
					results: results_data,
				},
			});
			break;
		}

		case 'getGasEfficiency': {
			const blockRange = this.getNodeParameter('blockRange', index) as number;

			const latestBlockHex = await rpcCall('eth_blockNumber');
			const latestBlockNum = parseInt(latestBlockHex, 16);

			let totalGasUsed = BigInt(0);
			let totalGasLimit = BigInt(0);
			let totalTxs = 0;
			const gasPerTx: bigint[] = [];

			for (let i = Math.max(0, latestBlockNum - blockRange); i <= latestBlockNum; i++) {
				const block = await rpcCall('eth_getBlockByNumber', [`0x${i.toString(16)}`, true]);

				const gasUsed = BigInt(block.gasUsed);
				const gasLimit = BigInt(block.gasLimit);

				totalGasUsed += gasUsed;
				totalGasLimit += gasLimit;

				if (block.transactions) {
					for (const tx of block.transactions) {
						if (typeof tx === 'object' && tx.gas) {
							totalTxs++;
							gasPerTx.push(BigInt(tx.gas));
						}
					}
				}
			}

			const utilizationPercent = Number((totalGasUsed * BigInt(10000)) / totalGasLimit) / 100;
			const avgGasPerTx = totalTxs > 0 ? totalGasUsed / BigInt(totalTxs) : BigInt(0);

			results.push({
				json: {
					success: true,
					blockRange: {
						start: latestBlockNum - blockRange,
						end: latestBlockNum,
					},
					gasMetrics: {
						totalGasUsed: totalGasUsed.toString(),
						totalGasLimit: totalGasLimit.toString(),
						utilizationPercent: utilizationPercent.toFixed(2) + '%',
						avgGasPerBlock: (totalGasUsed / BigInt(blockRange + 1)).toString(),
						avgGasPerTx: avgGasPerTx.toString(),
						totalTransactions: totalTxs,
					},
					efficiency: {
						isEfficient: utilizationPercent > 50,
						headroom: (100 - utilizationPercent).toFixed(2) + '%',
					},
				},
			});
			break;
		}

		case 'getParallelEfficiency': {
			const blockRange = this.getNodeParameter('blockRange', index) as number;

			const latestBlockHex = await rpcCall('eth_blockNumber');
			const latestBlockNum = parseInt(latestBlockHex, 16);

			// Analyze potential parallelization in recent blocks
			let totalTxs = 0;
			let potentiallyParallel = 0;
			const blockAnalysis: Array<{ block: number; txCount: number; uniqueAddresses: number }> = [];

			for (let i = Math.max(0, latestBlockNum - blockRange); i <= latestBlockNum; i += Math.max(1, Math.floor(blockRange / 10))) {
				const block = await rpcCall('eth_getBlockByNumber', [`0x${i.toString(16)}`, true]);

				if (block.transactions && Array.isArray(block.transactions)) {
					const addressSet = new Set<string>();
					let blockTxs = 0;

					for (const tx of block.transactions) {
						if (typeof tx === 'object') {
							blockTxs++;
							totalTxs++;
							if (tx.from) addressSet.add(tx.from.toLowerCase());
							if (tx.to) addressSet.add(tx.to.toLowerCase());
						}
					}

					// Heuristic: if unique addresses > tx count, more parallelization potential
					const uniqueAddresses = addressSet.size;
					if (uniqueAddresses >= blockTxs) {
						potentiallyParallel += blockTxs;
					} else {
						potentiallyParallel += Math.floor(blockTxs * (uniqueAddresses / (blockTxs * 2)));
					}

					blockAnalysis.push({
						block: i,
						txCount: blockTxs,
						uniqueAddresses,
					});
				}
			}

			const parallelizationRatio = totalTxs > 0 ? potentiallyParallel / totalTxs : 0;

			results.push({
				json: {
					success: true,
					blocksAnalyzed: blockAnalysis.length,
					totalTransactions: totalTxs,
					parallelExecution: {
						estimatedParallelizable: potentiallyParallel,
						parallelizationRatio: (parallelizationRatio * 100).toFixed(2) + '%',
						monadAdvantage: 'Optimistic parallel execution with conflict detection',
					},
					blockSamples: blockAnalysis.slice(0, 10),
				},
			});
			break;
		}

		case 'comparePerformance': {
			const period1Start = this.getNodeParameter('period1Start', index) as number;
			const period1End = this.getNodeParameter('period1End', index) as number;
			const period2Start = this.getNodeParameter('period2Start', index) as number;
			const period2End = this.getNodeParameter('period2End', index) as number;

			const analyzePeriod = async (start: number, end: number) => {
				const startBlock = await rpcCall('eth_getBlockByNumber', [`0x${start.toString(16)}`, false]);
				const endBlock = await rpcCall('eth_getBlockByNumber', [`0x${end.toString(16)}`, false]);

				const timeDiff = parseInt(endBlock.timestamp, 16) - parseInt(startBlock.timestamp, 16);
				const blockCount = end - start;

				let totalTxs = 0;
				let totalGas = BigInt(0);

				// Sample blocks
				const sampleInterval = Math.max(1, Math.floor(blockCount / 10));
				for (let i = start; i <= end; i += sampleInterval) {
					const block = await rpcCall('eth_getBlockByNumber', [`0x${i.toString(16)}`, false]);
					totalTxs += block.transactions?.length || 0;
					totalGas += BigInt(block.gasUsed);
				}

				return {
					blocks: blockCount,
					timeSpan: timeDiff,
					avgBlockTime: (timeDiff / blockCount).toFixed(4),
					estimatedTps: (totalTxs / (timeDiff || 1)).toFixed(2),
					avgGasPerBlock: (totalGas / BigInt(Math.ceil(blockCount / sampleInterval))).toString(),
				};
			};

			const period1Stats = await analyzePeriod(period1Start, period1End);
			const period2Stats = await analyzePeriod(period2Start, period2End);

			// Calculate changes
			const blockTimeChange = ((parseFloat(period2Stats.avgBlockTime) - parseFloat(period1Stats.avgBlockTime)) / parseFloat(period1Stats.avgBlockTime) * 100).toFixed(2);
			const tpsChange = ((parseFloat(period2Stats.estimatedTps) - parseFloat(period1Stats.estimatedTps)) / parseFloat(period1Stats.estimatedTps) * 100).toFixed(2);

			results.push({
				json: {
					success: true,
					period1: {
						range: `${period1Start} - ${period1End}`,
						...period1Stats,
					},
					period2: {
						range: `${period2Start} - ${period2End}`,
						...period2Stats,
					},
					comparison: {
						blockTimeChange: blockTimeChange + '%',
						tpsChange: tpsChange + '%',
						improved: parseFloat(tpsChange) > 0,
					},
				},
			});
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return results;
}
