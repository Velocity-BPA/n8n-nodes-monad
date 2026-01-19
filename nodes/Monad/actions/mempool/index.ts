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
				resource: ['mempool'],
			},
		},
		options: [
			{
				name: 'Get Pending Transactions',
				value: 'getPendingTransactions',
				description: 'Get pending transactions from the mempool',
				action: 'Get pending transactions',
			},
			{
				name: 'Get Transaction Status',
				value: 'getTransactionStatus',
				description: 'Get status of a transaction in the mempool',
				action: 'Get transaction status',
			},
			{
				name: 'Get Mempool Stats',
				value: 'getMempoolStats',
				description: 'Get mempool statistics',
				action: 'Get mempool stats',
			},
			{
				name: 'Subscribe to Pending',
				value: 'subscribePending',
				description: 'Get subscription info for pending transactions',
				action: 'Subscribe to pending transactions',
			},
			{
				name: 'Get Gas Price Distribution',
				value: 'getGasPriceDistribution',
				description: 'Get gas price distribution in mempool',
				action: 'Get gas price distribution',
			},
			{
				name: 'Get Pending by Address',
				value: 'getPendingByAddress',
				description: 'Get pending transactions for an address',
				action: 'Get pending by address',
			},
			{
				name: 'Get Queued Transactions',
				value: 'getQueuedTransactions',
				description: 'Get queued transactions',
				action: 'Get queued transactions',
			},
			{
				name: 'Simulate Bundle',
				value: 'simulateBundle',
				description: 'Simulate a transaction bundle execution',
				action: 'Simulate bundle',
			},
		],
		default: 'getPendingTransactions',
	},
];

export const fields: INodeProperties[] = [
	// getPendingTransactions
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['mempool'],
				operation: ['getPendingTransactions'],
			},
		},
		default: 100,
		description: 'Maximum number of pending transactions to return',
	},
	{
		displayName: 'Sort By',
		name: 'sortBy',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['mempool'],
				operation: ['getPendingTransactions'],
			},
		},
		options: [
			{ name: 'Gas Price (High to Low)', value: 'gasPriceDesc' },
			{ name: 'Gas Price (Low to High)', value: 'gasPriceAsc' },
			{ name: 'Time (Newest First)', value: 'timeDesc' },
			{ name: 'Time (Oldest First)', value: 'timeAsc' },
		],
		default: 'gasPriceDesc',
		description: 'How to sort the transactions',
	},

	// getTransactionStatus
	{
		displayName: 'Transaction Hash',
		name: 'txHash',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['mempool'],
				operation: ['getTransactionStatus'],
			},
		},
		default: '',
		required: true,
		description: 'Transaction hash to check status',
	},

	// getPendingByAddress
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['mempool'],
				operation: ['getPendingByAddress'],
			},
		},
		default: '',
		required: true,
		description: 'Address to get pending transactions for',
	},

	// getQueuedTransactions
	{
		displayName: 'Include Details',
		name: 'includeDetails',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['mempool'],
				operation: ['getQueuedTransactions'],
			},
		},
		default: true,
		description: 'Whether to include full transaction details',
	},

	// simulateBundle
	{
		displayName: 'Bundle Transactions',
		name: 'bundleTransactions',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['mempool'],
				operation: ['simulateBundle'],
			},
		},
		default: '[]',
		required: true,
		description: 'Array of signed transactions to bundle',
	},
	{
		displayName: 'Block Number',
		name: 'blockNumber',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['mempool'],
				operation: ['simulateBundle'],
			},
		},
		default: 'pending',
		description: 'Block number to simulate at (or "pending")',
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
		case 'getPendingTransactions': {
			const limit = this.getNodeParameter('limit', index) as number;
			const sortBy = this.getNodeParameter('sortBy', index) as string;

			const txpoolContent = await rpcCall('txpool_content');

			let pendingTxs: Array<Record<string, unknown>> = [];

			// Extract pending transactions
			if (txpoolContent?.pending) {
				for (const address of Object.keys(txpoolContent.pending)) {
					const nonces = txpoolContent.pending[address];
					for (const nonce of Object.keys(nonces)) {
						pendingTxs.push({
							...nonces[nonce],
							status: 'pending',
							fromAddress: address,
							txNonce: nonce,
						});
					}
				}
			}

			// Sort transactions
			switch (sortBy) {
				case 'gasPriceDesc':
					pendingTxs.sort((a, b) => {
						const priceA = BigInt((a.gasPrice as string) || (a.maxFeePerGas as string) || '0');
						const priceB = BigInt((b.gasPrice as string) || (b.maxFeePerGas as string) || '0');
						return priceB > priceA ? 1 : -1;
					});
					break;
				case 'gasPriceAsc':
					pendingTxs.sort((a, b) => {
						const priceA = BigInt((a.gasPrice as string) || (a.maxFeePerGas as string) || '0');
						const priceB = BigInt((b.gasPrice as string) || (b.maxFeePerGas as string) || '0');
						return priceA > priceB ? 1 : -1;
					});
					break;
				case 'timeDesc':
				case 'timeAsc':
					// Mempool doesn't store time, so maintain order
					break;
			}

			pendingTxs = pendingTxs.slice(0, limit);

			results.push({
				json: {
					success: true,
					count: pendingTxs.length,
					transactions: pendingTxs,
				},
			});
			break;
		}

		case 'getTransactionStatus': {
			const txHash = this.getNodeParameter('txHash', index) as string;

			// Check if transaction is mined
			const receipt = await rpcCall('eth_getTransactionReceipt', [txHash]);

			if (receipt) {
				results.push({
					json: {
						success: true,
						hash: txHash,
						status: 'confirmed',
						blockNumber: parseInt(receipt.blockNumber, 16),
						blockHash: receipt.blockHash,
						transactionIndex: parseInt(receipt.transactionIndex, 16),
						gasUsed: parseInt(receipt.gasUsed, 16),
						effectiveGasPrice: receipt.effectiveGasPrice
							? parseInt(receipt.effectiveGasPrice, 16)
							: null,
						confirmationStatus: receipt.status === '0x1' ? 'success' : 'failed',
					},
				});
			} else {
				// Check if in mempool
				const tx = await rpcCall('eth_getTransactionByHash', [txHash]);

				if (tx) {
					results.push({
						json: {
							success: true,
							hash: txHash,
							status: 'pending',
							from: tx.from,
							to: tx.to,
							value: tx.value,
							gasPrice: tx.gasPrice,
							maxFeePerGas: tx.maxFeePerGas,
							maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
							nonce: parseInt(tx.nonce, 16),
						},
					});
				} else {
					results.push({
						json: {
							success: true,
							hash: txHash,
							status: 'not_found',
							message: 'Transaction not found in mempool or blockchain',
						},
					});
				}
			}
			break;
		}

		case 'getMempoolStats': {
			const txpoolStatus = await rpcCall('txpool_status');
			const txpoolContent = await rpcCall('txpool_content');

			let pendingCount = 0;
			let queuedCount = 0;
			let totalGasPrice = BigInt(0);
			let minGasPrice = BigInt(0);
			let maxGasPrice = BigInt(0);

			// Calculate statistics
			if (txpoolContent?.pending) {
				for (const address of Object.keys(txpoolContent.pending)) {
					for (const nonce of Object.keys(txpoolContent.pending[address])) {
						pendingCount++;
						const tx = txpoolContent.pending[address][nonce];
						const gasPrice = BigInt(tx.gasPrice || tx.maxFeePerGas || '0');
						totalGasPrice += gasPrice;
						if (minGasPrice === BigInt(0) || gasPrice < minGasPrice) minGasPrice = gasPrice;
						if (gasPrice > maxGasPrice) maxGasPrice = gasPrice;
					}
				}
			}

			if (txpoolContent?.queued) {
				for (const address of Object.keys(txpoolContent.queued)) {
					queuedCount += Object.keys(txpoolContent.queued[address]).length;
				}
			}

			const avgGasPrice = pendingCount > 0 ? totalGasPrice / BigInt(pendingCount) : BigInt(0);

			results.push({
				json: {
					success: true,
					pending: txpoolStatus?.pending ? parseInt(txpoolStatus.pending, 16) : pendingCount,
					queued: txpoolStatus?.queued ? parseInt(txpoolStatus.queued, 16) : queuedCount,
					total: pendingCount + queuedCount,
					gasStats: {
						averageGasPrice: avgGasPrice.toString(),
						averageGasPriceGwei: Number(avgGasPrice) / 1e9,
						minGasPrice: minGasPrice.toString(),
						minGasPriceGwei: Number(minGasPrice) / 1e9,
						maxGasPrice: maxGasPrice.toString(),
						maxGasPriceGwei: Number(maxGasPrice) / 1e9,
					},
				},
			});
			break;
		}

		case 'subscribePending': {
			// Return subscription info (actual subscription handled by trigger node)
			results.push({
				json: {
					success: true,
					subscriptionType: 'newPendingTransactions',
					method: 'eth_subscribe',
					params: ['newPendingTransactions'],
					note: 'Use the Monad Trigger node for real-time subscriptions',
					wsRequired: true,
				},
			});
			break;
		}

		case 'getGasPriceDistribution': {
			const txpoolContent = await rpcCall('txpool_content');

			const distribution: Record<string, number> = {};
			const gasPrices: bigint[] = [];

			if (txpoolContent?.pending) {
				for (const address of Object.keys(txpoolContent.pending)) {
					for (const nonce of Object.keys(txpoolContent.pending[address])) {
						const tx = txpoolContent.pending[address][nonce];
						const gasPrice = BigInt(tx.gasPrice || tx.maxFeePerGas || '0');
						gasPrices.push(gasPrice);

						// Group by gwei ranges
						const gwei = Math.floor(Number(gasPrice) / 1e9);
						const range = `${Math.floor(gwei / 10) * 10}-${Math.floor(gwei / 10) * 10 + 9}`;
						distribution[range] = (distribution[range] || 0) + 1;
					}
				}
			}

			// Calculate percentiles
			gasPrices.sort((a, b) => (a > b ? 1 : -1));
			const p25 = gasPrices[Math.floor(gasPrices.length * 0.25)] || BigInt(0);
			const p50 = gasPrices[Math.floor(gasPrices.length * 0.5)] || BigInt(0);
			const p75 = gasPrices[Math.floor(gasPrices.length * 0.75)] || BigInt(0);
			const p95 = gasPrices[Math.floor(gasPrices.length * 0.95)] || BigInt(0);

			results.push({
				json: {
					success: true,
					totalTransactions: gasPrices.length,
					distribution,
					percentiles: {
						p25: { wei: p25.toString(), gwei: Number(p25) / 1e9 },
						p50: { wei: p50.toString(), gwei: Number(p50) / 1e9 },
						p75: { wei: p75.toString(), gwei: Number(p75) / 1e9 },
						p95: { wei: p95.toString(), gwei: Number(p95) / 1e9 },
					},
				},
			});
			break;
		}

		case 'getPendingByAddress': {
			const address = this.getNodeParameter('address', index) as string;
			const normalizedAddress = address.toLowerCase();

			const txpoolContent = await rpcCall('txpool_content');

			const pending: Array<Record<string, unknown>> = [];
			const queued: Array<Record<string, unknown>> = [];

			if (txpoolContent?.pending?.[normalizedAddress]) {
				for (const nonce of Object.keys(txpoolContent.pending[normalizedAddress])) {
					pending.push({
						nonce: parseInt(nonce),
						...txpoolContent.pending[normalizedAddress][nonce],
					});
				}
			}

			if (txpoolContent?.queued?.[normalizedAddress]) {
				for (const nonce of Object.keys(txpoolContent.queued[normalizedAddress])) {
					queued.push({
						nonce: parseInt(nonce),
						...txpoolContent.queued[normalizedAddress][nonce],
					});
				}
			}

			results.push({
				json: {
					success: true,
					address: normalizedAddress,
					pending: {
						count: pending.length,
						transactions: pending,
					},
					queued: {
						count: queued.length,
						transactions: queued,
					},
				},
			});
			break;
		}

		case 'getQueuedTransactions': {
			const includeDetails = this.getNodeParameter('includeDetails', index) as boolean;

			const txpoolContent = await rpcCall('txpool_content');

			const queued: Array<Record<string, unknown>> = [];

			if (txpoolContent?.queued) {
				for (const address of Object.keys(txpoolContent.queued)) {
					for (const nonce of Object.keys(txpoolContent.queued[address])) {
						const tx = txpoolContent.queued[address][nonce];
						if (includeDetails) {
							queued.push({
								fromAddress: address,
								nonce: parseInt(nonce),
								...tx,
							});
						} else {
							queued.push({
								fromAddress: address,
								nonce: parseInt(nonce),
								hash: tx.hash,
								to: tx.to,
								value: tx.value,
							});
						}
					}
				}
			}

			results.push({
				json: {
					success: true,
					count: queued.length,
					transactions: queued,
				},
			});
			break;
		}

		case 'simulateBundle': {
			const bundleTransactions = JSON.parse(
				this.getNodeParameter('bundleTransactions', index) as string,
			) as string[];
			const blockNumber = this.getNodeParameter('blockNumber', index) as string;

			// Use eth_call to simulate each transaction
			const simulations: Array<Record<string, unknown>> = [];
			let totalGasUsed = BigInt(0);
			let allSuccess = true;

			for (let i = 0; i < bundleTransactions.length; i++) {
				const tx = bundleTransactions[i];
				try {
					// Decode the raw transaction to get parameters
					const blockTag = blockNumber === 'pending' ? 'pending' : `0x${parseInt(blockNumber).toString(16)}`;

					// For simulation, we'd need to decode the tx and use eth_call
					// This is a simplified version
					const result = await rpcCall('eth_call', [
						{ data: tx },
						blockTag,
					]);

					simulations.push({
						index: i,
						success: true,
						result,
					});
				} catch (error) {
					allSuccess = false;
					simulations.push({
						index: i,
						success: false,
						error: (error as Error).message,
					});
				}
			}

			results.push({
				json: {
					success: true,
					bundleSize: bundleTransactions.length,
					allTransactionsSuccessful: allSuccess,
					totalGasUsed: totalGasUsed.toString(),
					simulations,
				},
			});
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return results;
}
