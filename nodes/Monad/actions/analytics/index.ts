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
				resource: ['analytics'],
			},
		},
		options: [
			{
				name: 'Get Address Analytics',
				value: 'getAddressAnalytics',
				description: 'Get comprehensive analytics for an address',
				action: 'Get address analytics',
			},
			{
				name: 'Get Contract Analytics',
				value: 'getContractAnalytics',
				description: 'Get analytics for a smart contract',
				action: 'Get contract analytics',
			},
			{
				name: 'Get Token Analytics',
				value: 'getTokenAnalytics',
				description: 'Get analytics for a token',
				action: 'Get token analytics',
			},
			{
				name: 'Get Network Analytics',
				value: 'getNetworkAnalytics',
				description: 'Get network-wide analytics',
				action: 'Get network analytics',
			},
			{
				name: 'Get Gas Analytics',
				value: 'getGasAnalytics',
				description: 'Get detailed gas analytics',
				action: 'Get gas analytics',
			},
			{
				name: 'Get Transaction Patterns',
				value: 'getTransactionPatterns',
				description: 'Analyze transaction patterns',
				action: 'Get transaction patterns',
			},
			{
				name: 'Get Whale Activity',
				value: 'getWhaleActivity',
				description: 'Track large holder activity',
				action: 'Get whale activity',
			},
			{
				name: 'Get Hot Contracts',
				value: 'getHotContracts',
				description: 'Get most active contracts',
				action: 'Get hot contracts',
			},
		],
		default: 'getAddressAnalytics',
	},
];

export const fields: INodeProperties[] = [
	// getAddressAnalytics
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getAddressAnalytics'],
			},
		},
		default: '',
		required: true,
		description: 'Address to analyze',
	},
	{
		displayName: 'Include Transaction History',
		name: 'includeHistory',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getAddressAnalytics'],
			},
		},
		default: true,
		description: 'Whether to include transaction history',
	},

	// getContractAnalytics
	{
		displayName: 'Contract Address',
		name: 'contractAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getContractAnalytics'],
			},
		},
		default: '',
		required: true,
		description: 'Contract address to analyze',
	},
	{
		displayName: 'Block Range',
		name: 'blockRange',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getContractAnalytics', 'getNetworkAnalytics', 'getGasAnalytics', 'getTransactionPatterns', 'getHotContracts'],
			},
		},
		default: 1000,
		description: 'Number of blocks to analyze',
	},

	// getTokenAnalytics
	{
		displayName: 'Token Address',
		name: 'tokenAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getTokenAnalytics'],
			},
		},
		default: '',
		required: true,
		description: 'Token contract address',
	},

	// getWhaleActivity
	{
		displayName: 'Minimum Value (MONAD)',
		name: 'minValue',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getWhaleActivity'],
			},
		},
		default: 1000,
		description: 'Minimum transaction value to consider as whale activity',
	},
	{
		displayName: 'Whale Block Range',
		name: 'whaleBlockRange',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getWhaleActivity'],
			},
		},
		default: 500,
		description: 'Number of blocks to scan for whale activity',
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
		case 'getAddressAnalytics': {
			const address = this.getNodeParameter('address', index) as string;
			const includeHistory = this.getNodeParameter('includeHistory', index) as boolean;

			// Get balance
			const balance = await rpcCall('eth_getBalance', [address, 'latest']);
			const balanceWei = BigInt(balance);

			// Get transaction count
			const txCount = await rpcCall('eth_getTransactionCount', [address, 'latest']);

			// Check if contract
			const code = await rpcCall('eth_getCode', [address, 'latest']);
			const isContract = code !== '0x' && code !== '0x0';

			// Get recent transactions if requested
			let recentTxs: Array<Record<string, unknown>> = [];
			if (includeHistory) {
				const latestBlock = await rpcCall('eth_blockNumber');
				const latestBlockNum = parseInt(latestBlock, 16);

				// Scan recent blocks for transactions involving this address
				for (let i = latestBlockNum; i > Math.max(0, latestBlockNum - 100) && recentTxs.length < 20; i--) {
					const block = await rpcCall('eth_getBlockByNumber', [`0x${i.toString(16)}`, true]);
					if (block.transactions) {
						for (const tx of block.transactions) {
							if (typeof tx === 'object' &&
								(tx.from?.toLowerCase() === address.toLowerCase() ||
								 tx.to?.toLowerCase() === address.toLowerCase())) {
								recentTxs.push({
									hash: tx.hash,
									blockNumber: parseInt(block.number, 16),
									from: tx.from,
									to: tx.to,
									value: tx.value,
									direction: tx.from?.toLowerCase() === address.toLowerCase() ? 'out' : 'in',
								});
							}
						}
					}
				}
			}

			// Calculate analytics
			let totalIn = BigInt(0);
			let totalOut = BigInt(0);
			for (const tx of recentTxs) {
				const value = BigInt(tx.value as string || '0');
				if (tx.direction === 'in') {
					totalIn += value;
				} else {
					totalOut += value;
				}
			}

			results.push({
				json: {
					success: true,
					address,
					type: isContract ? 'contract' : 'eoa',
					balance: {
						wei: balanceWei.toString(),
						monad: Number(balanceWei) / 1e18,
					},
					transactionCount: parseInt(txCount, 16),
					recentActivity: {
						transactionsFound: recentTxs.length,
						totalIn: { wei: totalIn.toString(), monad: Number(totalIn) / 1e18 },
						totalOut: { wei: totalOut.toString(), monad: Number(totalOut) / 1e18 },
						netFlow: { wei: (totalIn - totalOut).toString(), monad: Number(totalIn - totalOut) / 1e18 },
					},
					transactions: includeHistory ? recentTxs : undefined,
				},
			});
			break;
		}

		case 'getContractAnalytics': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const blockRange = this.getNodeParameter('blockRange', index) as number;

			// Get contract code
			const code = await rpcCall('eth_getCode', [contractAddress, 'latest']);
			if (code === '0x' || code === '0x0') {
				throw new NodeOperationError(this.getNode(), 'Address is not a contract');
			}

			const latestBlock = await rpcCall('eth_blockNumber');
			const latestBlockNum = parseInt(latestBlock, 16);
			const startBlock = Math.max(0, latestBlockNum - blockRange);

			// Get logs for the contract
			const logs = await rpcCall('eth_getLogs', [{
				address: contractAddress,
				fromBlock: `0x${startBlock.toString(16)}`,
				toBlock: 'latest',
			}]);

			// Analyze interactions
			const uniqueCallers = new Set<string>();
			const eventCounts: Record<string, number> = {};
			let totalGasUsed = BigInt(0);

			for (const log of logs || []) {
				// Track event topics
				if (log.topics && log.topics[0]) {
					eventCounts[log.topics[0]] = (eventCounts[log.topics[0]] || 0) + 1;
				}
			}

			// Scan for transactions to this contract
			let txCount = 0;
			const sampleInterval = Math.max(1, Math.floor(blockRange / 50));

			for (let i = startBlock; i <= latestBlockNum; i += sampleInterval) {
				const block = await rpcCall('eth_getBlockByNumber', [`0x${i.toString(16)}`, true]);
				if (block.transactions) {
					for (const tx of block.transactions) {
						if (typeof tx === 'object' && tx.to?.toLowerCase() === contractAddress.toLowerCase()) {
							txCount++;
							uniqueCallers.add(tx.from.toLowerCase());
						}
					}
				}
			}

			results.push({
				json: {
					success: true,
					contractAddress,
					codeSize: (code.length - 2) / 2, // bytes
					blockRange: { start: startBlock, end: latestBlockNum },
					activity: {
						totalLogs: logs?.length || 0,
						estimatedTransactions: txCount * sampleInterval, // Extrapolated
						uniqueCallers: uniqueCallers.size,
					},
					topEvents: Object.entries(eventCounts)
						.sort((a, b) => b[1] - a[1])
						.slice(0, 5)
						.map(([topic, count]) => ({ topic, count })),
				},
			});
			break;
		}

		case 'getTokenAnalytics': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;

			// ERC20 function signatures
			const totalSupplySig = '0x18160ddd';
			const nameSig = '0x06fdde03';
			const symbolSig = '0x95d89b41';
			const decimalsSig = '0x313ce567';

			// Get token info
			let name = 'Unknown';
			let symbol = 'Unknown';
			let decimals = 18;
			let totalSupply = BigInt(0);

			try {
				const nameResult = await rpcCall('eth_call', [{ to: tokenAddress, data: nameSig }, 'latest']);
				if (nameResult && nameResult !== '0x') {
					// Decode string (skip offset and length)
					const hex = nameResult.slice(130);
					name = Buffer.from(hex, 'hex').toString('utf8').replace(/\0/g, '');
				}
			} catch { /* ignore */ }

			try {
				const symbolResult = await rpcCall('eth_call', [{ to: tokenAddress, data: symbolSig }, 'latest']);
				if (symbolResult && symbolResult !== '0x') {
					const hex = symbolResult.slice(130);
					symbol = Buffer.from(hex, 'hex').toString('utf8').replace(/\0/g, '');
				}
			} catch { /* ignore */ }

			try {
				const decimalsResult = await rpcCall('eth_call', [{ to: tokenAddress, data: decimalsSig }, 'latest']);
				if (decimalsResult && decimalsResult !== '0x') {
					decimals = parseInt(decimalsResult, 16);
				}
			} catch { /* ignore */ }

			try {
				const supplyResult = await rpcCall('eth_call', [{ to: tokenAddress, data: totalSupplySig }, 'latest']);
				if (supplyResult && supplyResult !== '0x') {
					totalSupply = BigInt(supplyResult);
				}
			} catch { /* ignore */ }

			// Get transfer events
			const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
			const latestBlock = await rpcCall('eth_blockNumber');
			const latestBlockNum = parseInt(latestBlock, 16);

			const logs = await rpcCall('eth_getLogs', [{
				address: tokenAddress,
				topics: [transferTopic],
				fromBlock: `0x${Math.max(0, latestBlockNum - 1000).toString(16)}`,
				toBlock: 'latest',
			}]);

			// Analyze transfers
			const holders = new Set<string>();
			let transferCount = 0;
			let totalVolume = BigInt(0);

			for (const log of logs || []) {
				transferCount++;
				if (log.topics?.[1]) holders.add('0x' + log.topics[1].slice(26));
				if (log.topics?.[2]) holders.add('0x' + log.topics[2].slice(26));
				if (log.data) totalVolume += BigInt(log.data);
			}

			results.push({
				json: {
					success: true,
					tokenAddress,
					tokenInfo: {
						name,
						symbol,
						decimals,
						totalSupply: totalSupply.toString(),
						totalSupplyFormatted: Number(totalSupply) / Math.pow(10, decimals),
					},
					activity: {
						recentTransfers: transferCount,
						uniqueHolders: holders.size,
						totalVolume: totalVolume.toString(),
						volumeFormatted: Number(totalVolume) / Math.pow(10, decimals),
					},
				},
			});
			break;
		}

		case 'getNetworkAnalytics': {
			const blockRange = this.getNodeParameter('blockRange', index) as number;

			const latestBlock = await rpcCall('eth_blockNumber');
			const latestBlockNum = parseInt(latestBlock, 16);

			let totalTxs = 0;
			let totalGas = BigInt(0);
			let totalValue = BigInt(0);
			const contractCreations: string[] = [];
			const activeAddresses = new Set<string>();

			const sampleInterval = Math.max(1, Math.floor(blockRange / 100));

			for (let i = Math.max(0, latestBlockNum - blockRange); i <= latestBlockNum; i += sampleInterval) {
				const block = await rpcCall('eth_getBlockByNumber', [`0x${i.toString(16)}`, true]);

				totalGas += BigInt(block.gasUsed);

				if (block.transactions) {
					for (const tx of block.transactions) {
						if (typeof tx === 'object') {
							totalTxs++;
							totalValue += BigInt(tx.value || '0');
							activeAddresses.add(tx.from.toLowerCase());
							if (tx.to) {
								activeAddresses.add(tx.to.toLowerCase());
							} else {
								// Contract creation
								contractCreations.push(tx.hash);
							}
						}
					}
				}
			}

			// Get gas price
			const gasPrice = await rpcCall('eth_gasPrice');

			// Get pending transactions
			let pendingCount = 0;
			try {
				const txpoolStatus = await rpcCall('txpool_status');
				pendingCount = parseInt(txpoolStatus?.pending || '0x0', 16);
			} catch { /* ignore */ }

			results.push({
				json: {
					success: true,
					blockRange: {
						start: latestBlockNum - blockRange,
						end: latestBlockNum,
						analyzed: Math.ceil(blockRange / sampleInterval),
					},
					transactions: {
						total: totalTxs * sampleInterval, // Extrapolated
						avgPerBlock: totalTxs / Math.ceil(blockRange / sampleInterval),
						contractCreations: contractCreations.length * sampleInterval,
					},
					volume: {
						totalWei: totalValue.toString(),
						totalMonad: Number(totalValue) / 1e18,
					},
					gas: {
						totalUsed: totalGas.toString(),
						avgPerBlock: (totalGas / BigInt(Math.ceil(blockRange / sampleInterval))).toString(),
						currentPrice: parseInt(gasPrice, 16),
						currentPriceGwei: parseInt(gasPrice, 16) / 1e9,
					},
					addresses: {
						activeUnique: activeAddresses.size * sampleInterval, // Extrapolated
					},
					mempool: {
						pendingTransactions: pendingCount,
					},
				},
			});
			break;
		}

		case 'getGasAnalytics': {
			const blockRange = this.getNodeParameter('blockRange', index) as number;

			const latestBlock = await rpcCall('eth_blockNumber');
			const latestBlockNum = parseInt(latestBlock, 16);

			const gasData: Array<{ block: number; gasUsed: bigint; gasLimit: bigint; baseFee: bigint }> = [];
			const sampleInterval = Math.max(1, Math.floor(blockRange / 50));

			for (let i = Math.max(0, latestBlockNum - blockRange); i <= latestBlockNum; i += sampleInterval) {
				const block = await rpcCall('eth_getBlockByNumber', [`0x${i.toString(16)}`, false]);
				gasData.push({
					block: i,
					gasUsed: BigInt(block.gasUsed),
					gasLimit: BigInt(block.gasLimit),
					baseFee: BigInt(block.baseFeePerGas || '0'),
				});
			}

			// Calculate statistics
			const totalGasUsed = gasData.reduce((sum, d) => sum + d.gasUsed, BigInt(0));
			const totalGasLimit = gasData.reduce((sum, d) => sum + d.gasLimit, BigInt(0));
			const avgBaseFee = gasData.reduce((sum, d) => sum + d.baseFee, BigInt(0)) / BigInt(gasData.length);

			const utilizationPercent = Number((totalGasUsed * BigInt(10000)) / totalGasLimit) / 100;

			// Get fee history
			let feeHistory;
			try {
				feeHistory = await rpcCall('eth_feeHistory', [20, 'latest', [25, 50, 75]]);
			} catch { /* ignore */ }

			results.push({
				json: {
					success: true,
					blockRange: {
						start: latestBlockNum - blockRange,
						end: latestBlockNum,
						samples: gasData.length,
					},
					gasUsage: {
						totalUsed: totalGasUsed.toString(),
						totalLimit: totalGasLimit.toString(),
						utilizationPercent: utilizationPercent.toFixed(2) + '%',
						avgPerBlock: (totalGasUsed / BigInt(gasData.length)).toString(),
					},
					baseFee: {
						average: avgBaseFee.toString(),
						averageGwei: Number(avgBaseFee) / 1e9,
						current: gasData[gasData.length - 1]?.baseFee.toString(),
						currentGwei: Number(gasData[gasData.length - 1]?.baseFee || 0) / 1e9,
					},
					feeHistory: feeHistory ? {
						baseFees: feeHistory.baseFeePerGas?.slice(-10),
						rewards: feeHistory.reward?.slice(-10),
					} : null,
					trend: gasData.slice(-10).map(d => ({
						block: d.block,
						utilization: Number((d.gasUsed * BigInt(100)) / d.gasLimit).toFixed(2) + '%',
						baseFeeGwei: Number(d.baseFee) / 1e9,
					})),
				},
			});
			break;
		}

		case 'getTransactionPatterns': {
			const blockRange = this.getNodeParameter('blockRange', index) as number;

			const latestBlock = await rpcCall('eth_blockNumber');
			const latestBlockNum = parseInt(latestBlock, 16);

			const patterns: Record<string, number> = {
				simpleTransfer: 0,
				contractCall: 0,
				contractCreation: 0,
				tokenTransfer: 0,
			};

			const valueBuckets: Record<string, number> = {
				'0': 0,
				'0-1': 0,
				'1-10': 0,
				'10-100': 0,
				'100-1000': 0,
				'1000+': 0,
			};

			const hourlyActivity: Record<number, number> = {};

			const sampleInterval = Math.max(1, Math.floor(blockRange / 50));

			for (let i = Math.max(0, latestBlockNum - blockRange); i <= latestBlockNum; i += sampleInterval) {
				const block = await rpcCall('eth_getBlockByNumber', [`0x${i.toString(16)}`, true]);

				// Track hourly activity
				const timestamp = parseInt(block.timestamp, 16);
				const hour = new Date(timestamp * 1000).getHours();
				hourlyActivity[hour] = (hourlyActivity[hour] || 0) + (block.transactions?.length || 0);

				if (block.transactions) {
					for (const tx of block.transactions) {
						if (typeof tx === 'object') {
							// Classify transaction type
							if (!tx.to) {
								patterns.contractCreation++;
							} else if (!tx.input || tx.input === '0x') {
								patterns.simpleTransfer++;
							} else if (tx.input.startsWith('0xa9059cbb')) {
								patterns.tokenTransfer++;
							} else {
								patterns.contractCall++;
							}

							// Classify by value
							const valueMonad = Number(BigInt(tx.value || '0')) / 1e18;
							if (valueMonad === 0) valueBuckets['0']++;
							else if (valueMonad < 1) valueBuckets['0-1']++;
							else if (valueMonad < 10) valueBuckets['1-10']++;
							else if (valueMonad < 100) valueBuckets['10-100']++;
							else if (valueMonad < 1000) valueBuckets['100-1000']++;
							else valueBuckets['1000+']++;
						}
					}
				}
			}

			const total = Object.values(patterns).reduce((a, b) => a + b, 0);

			results.push({
				json: {
					success: true,
					blockRange: {
						start: latestBlockNum - blockRange,
						end: latestBlockNum,
					},
					transactionTypes: {
						...patterns,
						percentages: {
							simpleTransfer: ((patterns.simpleTransfer / total) * 100).toFixed(2) + '%',
							contractCall: ((patterns.contractCall / total) * 100).toFixed(2) + '%',
							contractCreation: ((patterns.contractCreation / total) * 100).toFixed(2) + '%',
							tokenTransfer: ((patterns.tokenTransfer / total) * 100).toFixed(2) + '%',
						},
					},
					valueDistribution: valueBuckets,
					hourlyActivity: Object.entries(hourlyActivity)
						.sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
						.map(([hour, count]) => ({ hour: parseInt(hour), transactions: count })),
				},
			});
			break;
		}

		case 'getWhaleActivity': {
			const minValue = this.getNodeParameter('minValue', index) as number;
			const whaleBlockRange = this.getNodeParameter('whaleBlockRange', index) as number;

			const latestBlock = await rpcCall('eth_blockNumber');
			const latestBlockNum = parseInt(latestBlock, 16);

			const whaleTransactions: Array<Record<string, unknown>> = [];
			const minValueWei = BigInt(Math.floor(minValue * 1e18));

			for (let i = latestBlockNum; i > Math.max(0, latestBlockNum - whaleBlockRange) && whaleTransactions.length < 100; i--) {
				const block = await rpcCall('eth_getBlockByNumber', [`0x${i.toString(16)}`, true]);

				if (block.transactions) {
					for (const tx of block.transactions) {
						if (typeof tx === 'object') {
							const value = BigInt(tx.value || '0');
							if (value >= minValueWei) {
								whaleTransactions.push({
									hash: tx.hash,
									blockNumber: parseInt(block.number, 16),
									timestamp: parseInt(block.timestamp, 16),
									from: tx.from,
									to: tx.to,
									valueWei: value.toString(),
									valueMonad: Number(value) / 1e18,
								});
							}
						}
					}
				}
			}

			// Analyze whale addresses
			const whaleAddresses: Record<string, { sent: number; received: number; volume: number }> = {};

			for (const tx of whaleTransactions) {
				const value = tx.valueMonad as number;

				if (!whaleAddresses[tx.from as string]) {
					whaleAddresses[tx.from as string] = { sent: 0, received: 0, volume: 0 };
				}
				whaleAddresses[tx.from as string].sent += value;
				whaleAddresses[tx.from as string].volume += value;

				if (tx.to && !whaleAddresses[tx.to as string]) {
					whaleAddresses[tx.to as string] = { sent: 0, received: 0, volume: 0 };
				}
				if (tx.to) {
					whaleAddresses[tx.to as string].received += value;
					whaleAddresses[tx.to as string].volume += value;
				}
			}

			const topWhales = Object.entries(whaleAddresses)
				.sort((a, b) => b[1].volume - a[1].volume)
				.slice(0, 20)
				.map(([address, stats]) => ({ address, ...stats }));

			results.push({
				json: {
					success: true,
					criteria: {
						minValue: minValue + ' MONAD',
						blockRange: whaleBlockRange,
					},
					summary: {
						whaleTransactionsFound: whaleTransactions.length,
						totalVolume: whaleTransactions.reduce((sum, tx) => sum + (tx.valueMonad as number), 0),
						uniqueWhales: Object.keys(whaleAddresses).length,
					},
					topWhales,
					recentWhaleTransactions: whaleTransactions.slice(0, 20),
				},
			});
			break;
		}

		case 'getHotContracts': {
			const blockRange = this.getNodeParameter('blockRange', index) as number;

			const latestBlock = await rpcCall('eth_blockNumber');
			const latestBlockNum = parseInt(latestBlock, 16);

			const contractActivity: Record<string, { calls: number; gasUsed: bigint; uniqueCallers: Set<string> }> = {};

			const sampleInterval = Math.max(1, Math.floor(blockRange / 50));

			for (let i = Math.max(0, latestBlockNum - blockRange); i <= latestBlockNum; i += sampleInterval) {
				const block = await rpcCall('eth_getBlockByNumber', [`0x${i.toString(16)}`, true]);

				if (block.transactions) {
					for (const tx of block.transactions) {
						if (typeof tx === 'object' && tx.to && tx.input && tx.input !== '0x') {
							const contract = tx.to.toLowerCase();

							if (!contractActivity[contract]) {
								contractActivity[contract] = { calls: 0, gasUsed: BigInt(0), uniqueCallers: new Set() };
							}

							contractActivity[contract].calls++;
							contractActivity[contract].gasUsed += BigInt(tx.gas || '0');
							contractActivity[contract].uniqueCallers.add(tx.from.toLowerCase());
						}
					}
				}
			}

			// Sort by activity
			const hotContracts = Object.entries(contractActivity)
				.map(([address, stats]) => ({
					address,
					calls: stats.calls * sampleInterval, // Extrapolated
					gasUsed: stats.gasUsed.toString(),
					uniqueCallers: stats.uniqueCallers.size,
				}))
				.sort((a, b) => b.calls - a.calls)
				.slice(0, 20);

			results.push({
				json: {
					success: true,
					blockRange: {
						start: latestBlockNum - blockRange,
						end: latestBlockNum,
					},
					totalContractsAnalyzed: Object.keys(contractActivity).length,
					hotContracts,
				},
			});
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return results;
}
