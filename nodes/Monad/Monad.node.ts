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
				options: resourceOptions,
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
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as ResourceType;
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
			} catch (error) {
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
