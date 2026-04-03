/**
 * Monad n8n Community Node
 * High-performance blockchain integration for n8n workflows
 * 
 * Copyright (c) 2025 Monad Foundation
 * Licensed under the Business Source License 1.1
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeApiError,
} from 'n8n-workflow';

import {
	resourceOptions,
	resourceModules,
	ResourceType,
	account,
	transaction,
	token,
	nft,
	contract,
	block,
	event,
	parallelExecution,
	monadDb,
	consensus,
	gas,
	staking,
	governance,
	defi,
	multicall,
	accountAbstraction,
	mempool,
	debugging,
	performance,
	analytics,
	subgraph,
	utility,
} from './actions';

export class Monad implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Monad',
		name: 'monad',
		icon: 'file:monad.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Monad blockchain - high-performance EVM with parallel execution',
		defaults: {
			name: 'Monad',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'monadNetwork',
				required: true,
			},
			{
				name: 'monadApi',
				required: false,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					...resourceOptions,
					{
						name: 'Network',
						value: 'network',
					},
					{
						name: 'SmartContract',
						value: 'smartContract',
					},
				],
				default: 'account',
			},
			// Account operations and fields
			...account.operations,
			...account.fields,
			// Transaction operations and fields
			...transaction.operations,
			...transaction.fields,
			// Token operations and fields
			...token.operations,
			...token.fields,
			// NFT operations and fields
			...nft.operations,
			...nft.fields,
			// Contract operations and fields
			...contract.operations,
			...contract.fields,
			// Block operations and fields
			...block.operations,
			...block.fields,
			// Event operations and fields
			...event.operations,
			...event.fields,
			// Parallel Execution operations and fields
			...parallelExecution.operations,
			...parallelExecution.fields,
			// MonadDB operations and fields
			...monadDb.operations,
			...monadDb.fields,
			// Consensus operations and fields
			...consensus.operations,
			...consensus.fields,
			// Gas operations and fields
			...gas.operations,
			...gas.fields,
			// Staking operations and fields
			...staking.operations,
			...staking.fields,
			// Governance operations and fields
			...governance.operations,
			...governance.fields,
			// DeFi operations and fields
			...defi.operations,
			...defi.fields,
			// Multicall operations and fields
			...multicall.operations,
			...multicall.fields,
			// Account Abstraction operations and fields
			...accountAbstraction.operations,
			...accountAbstraction.fields,
			// Mempool operations and fields
			...mempool.operations,
			...mempool.fields,
			// Debugging operations and fields
			...debugging.operations,
			...debugging.fields,
			// Performance operations and fields
			...performance.operations,
			...performance.fields,
			// Analytics operations and fields
			...analytics.operations,
			...analytics.fields,
			// Subgraph operations and fields
			...subgraph.operations,
			...subgraph.fields,
			// Utility operations and fields
			...utility.operations,
			...utility.fields,
			// New Network operations and fields
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['network'] } },
				options: [
					{ name: 'Get Chain ID', value: 'getChainId', description: 'Get chain ID', action: 'Get chain ID' },
					{ name: 'Get Network ID', value: 'getNetworkId', description: 'Get network ID', action: 'Get network ID' },
					{ name: 'Get Peer Count', value: 'getPeerCount', description: 'Get connected peer count', action: 'Get peer count' },
					{ name: 'Is Syncing', value: 'isSyncing', description: 'Check if node is syncing', action: 'Check sync status' },
					{ name: 'Get Gas Price', value: 'getGasPrice', description: 'Get current gas price', action: 'Get gas price' },
					{ name: 'Get Fee History', value: 'getFeeHistory', description: 'Get fee history', action: 'Get fee history' }
				],
				default: 'getChainId',
			},
			{
				displayName: 'Block Count',
				name: 'blockCount',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						resource: ['network'],
						operation: ['getFeeHistory']
					}
				},
				default: 4,
				description: 'Number of blocks for which fee data is requested'
			},
			{
				displayName: 'Newest Block',
				name: 'newestBlock',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['network'],
						operation: ['getFeeHistory']
					}
				},
				default: 'latest',
				description: 'The newest block number, block hash, or tag'
			},
			{
				displayName: 'Reward Percentiles',
				name: 'rewardPercentiles',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['network'],
						operation: ['getFeeHistory']
					}
				},
				default: '[25, 50, 75]',
				description: 'Array of percentiles for calculating reward values (JSON format)'
			},
			// New SmartContract operations and fields
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['smartContract'],
					},
				},
				options: [
					{
						name: 'Call',
						value: 'call',
						description: 'Execute contract call',
						action: 'Execute contract call',
					},
					{
						name: 'Estimate Gas',
						value: 'estimateGas',
						description: 'Estimate gas for contract interaction',
						action: 'Estimate gas for contract interaction',
					},
					{
						name: 'Get Code',
						value: 'getCode',
						description: 'Get contract bytecode',
						action: 'Get contract bytecode',
					},
					{
						name: 'Get Storage At',
						value: 'getStorageAt',
						description: 'Get contract storage',
						action: 'Get contract storage',
					},
					{
						name: 'Get Logs',
						value: 'getLogs',
						description: 'Get contract event logs',
						action: 'Get contract event logs',
					},
				],
				default: 'call',
			},
			{
				displayName: 'Transaction',
				name: 'transaction',
				type: 'json',
				default: '{}',
				displayOptions: {
					show: {
						resource: ['smartContract'],
						operation: ['call', 'estimateGas'],
					},
				},
				description: 'Transaction object with to, data, gas, gasPrice, value, etc.',
				placeholder: '{"to": "0x...", "data": "0x..."}',
			},
			{
				displayName: 'Block Tag',
				name: 'blockTag',
				type: 'string',
				default: 'latest',
				displayOptions: {
					show: {
						resource: ['smartContract'],
						operation: ['call', 'getCode', 'getStorageAt'],
					},
				},
				description: 'Block tag (latest, earliest, pending) or block number',
				placeholder: 'latest',
			},
			{
				displayName: 'Address',
				name: 'address',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['smartContract'],
						operation: ['getCode', 'getStorageAt'],
					},
				},
				description: 'Contract address',
				placeholder: '0x...',
			},
			{
				displayName: 'Position',
				name: 'position',
				type: 'string',
				default: '0x0',
				required: true,
				displayOptions: {
					show: {
						resource: ['smartContract'],
						operation: ['getStorageAt'],
					},
				},
				description: 'Storage position (hex string)',
				placeholder: '0x0',
			},
			{
				displayName: 'Filter',
				name: 'filter',
				type: 'json',
				default: '{}',
				displayOptions: {
					show: {
						resource: ['smartContract'],
						operation: ['getLogs'],
					},
				},
				description: 'Log filter object with address, topics, fromBlock, toBlock',
				placeholder: '{"address": "0x...", "topics": []}',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as ResourceType;

		// Handle new resources with inline handlers
		if (resource === 'network') {
			return [await executeNetworkOperations.call(this, items)];
		}
		
		if (resource === 'smartContract') {
			return [await executeSmartContractOperations.call(this, items)];
		}

		const resourceModule = resourceModules[resource];

		if (!resourceModule) {
			throw new NodeOperationError(
				this.getNode(),
				`Unknown resource: ${resource}`,
			);
		}

		for (let i = 0; i < items.length; i++) {
			try {
				const executionResult = await resourceModule.execute.call(this, i);
				returnData.push(...executionResult);
			} catch (error: any) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

// New Network operations handler
async function executeNetworkOperations(
	this: IExecuteFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const operation = this.getNodeParameter('operation', 0) as string;
	const credentials = await this.getCredentials('monadApi') as any;

	for (let i = 0; i < items.length; i++) {
		try {
			let result: any;
			let requestBody: any;
			
			const baseOptions: any = {
				method: 'POST',
				url: credentials.baseUrl || 'https://rpc.monad.xyz',
				headers: {
					'Content-Type': 'application/json',
					...(credentials.apiKey && { 'Authorization': `Bearer ${credentials.apiKey}` })
				},
				json: true
			};

			switch (operation) {
				case 'getChainId': {
					requestBody = {
						jsonrpc: '2.0',
						method: 'eth_chainId',
						params: [],
						id: 1
					};
					const options = { ...baseOptions, body: requestBody };
					result = await this.helpers.httpRequest(options) as any;
					break;
				}
				case 'getNetworkId': {
					requestBody = {
						jsonrpc: '2.0',
						method: 'net_version',
						params: [],
						id: 1
					};
					const options = { ...baseOptions, body: requestBody };
					result = await this.helpers.httpRequest(options) as any;
					break;
				}
				case 'getPeerCount': {
					requestBody = {
						jsonrpc: '2.0',
						method: 'net_peerCount',
						params: [],
						id: 1
					};
					const options = { ...baseOptions, body: requestBody };
					result = await this.helpers.httpRequest(options) as any;
					break;
				}
				case 'isSyncing': {
					requestBody = {
						jsonrpc: '2.0',
						method: 'eth_syncing',
						params: [],
						id: 1
					};
					const options = { ...baseOptions, body: requestBody };
					result = await this.helpers.httpRequest(options) as any;
					break;
				}
				case 'getGasPrice': {
					requestBody = {
						jsonrpc: '2.0',
						method: 'eth_gasPrice',
						params: [],
						id: 1
					};
					const options = { ...baseOptions, body: requestBody };
					result = await this.helpers.httpRequest(options) as any;
					break;
				}
				case 'getFeeHistory': {
					const blockCount = this.getNodeParameter('blockCount', i) as number;
					const newestBlock = this.getNodeParameter('newestBlock', i) as string;
					const rewardPercentilesStr = this.getNodeParameter('rewardPercentiles', i) as string;
					
					let rewardPercentiles: number[];
					try {
						rewardPercentiles = JSON.parse(rewardPercentilesStr);
					} catch (error: any) {
						throw new NodeOperationError(this.getNode(), 'Invalid JSON format for reward percentiles');
					}
					
					requestBody = {
						jsonrpc: '2.0',
						method: 'eth_feeHistory',
						params: [`0x${blockCount.toString(16)}`, newestBlock, rewardPercentiles],
						id: 1
					};
					const options = { ...baseOptions, body: requestBody };
					result = await this.helpers.httpRequest(options) as any;
					break;
				}
				default:
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
			}

			returnData.push({
				json: result,
				pairedItem: { item: i }
			});
		} catch (error: any) {
			if (this.continueOnFail()) {
				returnData.push({
					json: { error: error.message },
					pairedItem: { item: i }
				});
			} else {
				throw error;
			}
		}
	}

	return returnData;
}

// New SmartContract operations handler
async function executeSmartContractOperations(
	this: IExecuteFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const operation = this.getNodeParameter('operation', 0) as string;
	const credentials = await this.getCredentials('monadApi') as any;

	for (let i = 0; i < items.length; i++) {
		try {
			let result: any;

			switch (operation) {
				case 'call': {
					const transaction = this.getNodeParameter('transaction', i) as any;
					const blockTag = this.getNodeParameter('blockTag', i) as string;

					const rpcPayload = {
						jsonrpc: '2.0',
						method: 'eth_call',
						params: [transaction, blockTag],
						id: 1,
					};

					const options: any = {
						method: 'POST',
						url: credentials.baseUrl || 'https://rpc.monad.xyz',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(rpcPayload),
						json: true,
					};

					if (credentials.apiKey) {
						options.headers['Authorization'] = `Bearer ${credentials.apiKey}`;
					}

					result = await this.helpers.httpRequest(options) as any;
					break;
				}

				case 'estimateGas': {
					const transaction = this.getNodeParameter('transaction', i) as any;

					const rpcPayload = {
						jsonrpc: '2.0',
						method: 'eth_estimateGas',
						params: [transaction],
						id: 1,
					};

					const options: any = {
						method: 'POST',
						url: credentials.baseUrl || 'https://rpc.monad.xyz',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(rpcPayload),
						json: true,
					};

					if (credentials.apiKey) {
						options.headers['Authorization'] = `Bearer ${credentials.apiKey}`;
					}

					result = await this.helpers.httpRequest(options) as any;
					break;
				}

				case 'getCode': {
					const address = this.getNodeParameter('address', i) as string;
					const blockTag = this.getNodeParameter('blockTag', i) as string;

					const rpcPayload = {
						jsonrpc: '2.0',
						method: 'eth_getCode',
						params: [address, blockTag],
						id: 1,
					};

					const options: any = {
						method: 'POST',
						url: credentials.baseUrl || 'https://rpc.monad.xyz',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(rpcPayload),
						json: true,
					};

					if (credentials.apiKey) {
						options.headers['Authorization'] = `Bearer ${credentials.apiKey}`;
					}

					result = await this.helpers.httpRequest(options) as any;
					break;
				}

				case 'getStorageAt': {
					const address = this.getNodeParameter('address', i) as string;
					const position = this.getNodeParameter('position', i) as string;
					const blockTag = this.getNodeParameter('blockTag', i) as string;

					const rpcPayload = {
						jsonrpc: '2.0',
						method: 'eth_getStorageAt',
						params: [address, position, blockTag],
						id: 1,
					};

					const options: any = {
						method: 'POST',
						url: credentials.baseUrl || 'https://rpc.monad.xyz',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(rpcPayload),
						json: true,
					};

					if (credentials.apiKey) {
						options.headers['Authorization'] = `Bearer ${credentials.apiKey}`;
					}

					result = await this.helpers.httpRequest(options) as any;
					break;
				}

				case 'getLogs': {
					const filter = this.getNodeParameter('filter', i) as any;

					const rpcPayload = {
						jsonrpc: '2.0',
						method: 'eth_getLogs',
						params: [filter],
						id: 1,
					};

					const options: any = {
						method: 'POST',
						url: credentials.baseUrl || 'https://rpc.monad.xyz',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(rpcPayload),
						json: true,
					};

					if (credentials.apiKey) {
						options.headers['Authorization'] = `Bearer ${credentials.apiKey}`;
					}

					result = await this.helpers.httpRequest(options) as any;
					break;
				}

				default:
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
			}

			returnData.push({
				json: result,
				pairedItem: { item: i },
			});
		} catch (error: any) {
			if (this.continueOnFail()) {
				returnData.push({
					json: { error: error.message },
					pairedItem: { item: i },
				});
			} else {
				throw error;
			}
		}
	}

	return returnData;
}