/**
 * @file Block Resource Operations
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
import { getConsensusClient } from '../../transport/consensusClient';

export const blockOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['block'],
			},
		},
		options: [
			{
				name: 'Get Block',
				value: 'getBlock',
				description: 'Get block by number or hash',
				action: 'Get a block',
			},
			{
				name: 'Get Block Number',
				value: 'getBlockNumber',
				description: 'Get the latest block number',
				action: 'Get latest block number',
			},
			{
				name: 'Get Block Transactions',
				value: 'getBlockTransactions',
				description: 'Get all transactions in a block',
				action: 'Get block transactions',
			},
			{
				name: 'Get Block With Transactions',
				value: 'getBlockWithTransactions',
				description: 'Get block with full transaction objects',
				action: 'Get block with transactions',
			},
			{
				name: 'Get Finalized Block',
				value: 'getFinalizedBlock',
				description: 'Get the latest finalized block (MonadBFT)',
				action: 'Get finalized block',
			},
			{
				name: 'Check Finality',
				value: 'checkFinality',
				description: 'Check if a block is finalized',
				action: 'Check block finality',
			},
			{
				name: 'Get Block Range',
				value: 'getBlockRange',
				description: 'Get multiple blocks in a range',
				action: 'Get block range',
			},
			{
				name: 'Get Uncle Block',
				value: 'getUncleBlock',
				description: 'Get uncle block by index',
				action: 'Get uncle block',
			},
		],
		default: 'getBlock',
	},
];

export const blockFields: INodeProperties[] = [
	{
		displayName: 'Block Identifier',
		name: 'blockIdentifier',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['block'],
				operation: ['getBlock', 'getBlockTransactions', 'getBlockWithTransactions', 'checkFinality'],
			},
		},
		default: 'latest',
		description: 'Block number, hash, or tag (latest, pending, earliest, finalized, safe)',
	},
	{
		displayName: 'Start Block',
		name: 'startBlock',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['block'],
				operation: ['getBlockRange'],
			},
		},
		default: 0,
		description: 'Starting block number',
	},
	{
		displayName: 'End Block',
		name: 'endBlock',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['block'],
				operation: ['getBlockRange'],
			},
		},
		default: 10,
		description: 'Ending block number',
	},
	{
		displayName: 'Include Transactions',
		name: 'includeTransactions',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['block'],
				operation: ['getBlock', 'getBlockRange'],
			},
		},
		default: false,
		description: 'Whether to include full transaction objects',
	},
	{
		displayName: 'Uncle Index',
		name: 'uncleIndex',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['block'],
				operation: ['getUncleBlock'],
			},
		},
		default: 0,
		description: 'Index of the uncle block',
	},
	{
		displayName: 'Block Number',
		name: 'blockNumber',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['block'],
				operation: ['getUncleBlock'],
			},
		},
		default: 0,
		description: 'Block number containing the uncle',
	},
];

export async function executeBlockOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('monadNetwork');
	const client = getMonadClient(credentials);

	let result: any;

	switch (operation) {
		case 'getBlock': {
			const blockIdentifier = this.getNodeParameter('blockIdentifier', index) as string;
			const includeTransactions = this.getNodeParameter('includeTransactions', index, false) as boolean;

			const block = await client.getBlock(blockIdentifier, includeTransactions);
			if (!block) {
				throw new NodeOperationError(this.getNode(), `Block not found: ${blockIdentifier}`);
			}

			result = client.formatBlock(block);
			break;
		}

		case 'getBlockNumber': {
			const blockNumber = await client.getBlockNumber();

			result = {
				blockNumber,
				timestamp: Date.now(),
			};
			break;
		}

		case 'getBlockTransactions': {
			const blockIdentifier = this.getNodeParameter('blockIdentifier', index) as string;

			const block = await client.getBlock(blockIdentifier, true);
			if (!block) {
				throw new NodeOperationError(this.getNode(), `Block not found: ${blockIdentifier}`);
			}

			const transactions = block.transactions || [];

			result = {
				blockNumber: block.number,
				blockHash: block.hash,
				transactionCount: transactions.length,
				transactions: transactions.map((tx: any) =>
					typeof tx === 'string' ? { hash: tx } : client.formatTransaction(tx)
				),
			};
			break;
		}

		case 'getBlockWithTransactions': {
			const blockIdentifier = this.getNodeParameter('blockIdentifier', index) as string;

			const block = await client.getBlock(blockIdentifier, true);
			if (!block) {
				throw new NodeOperationError(this.getNode(), `Block not found: ${blockIdentifier}`);
			}

			result = {
				...client.formatBlock(block),
				transactions: (block.transactions || []).map((tx: any) =>
					typeof tx === 'string' ? { hash: tx } : client.formatTransaction(tx)
				),
			};
			break;
		}

		case 'getFinalizedBlock': {
			const consensusClient = getConsensusClient(credentials);
			const finality = await consensusClient.getFinalityStatus();

			const block = await client.getBlock(finality.latestFinalizedBlock);

			result = {
				...finality,
				block: block ? client.formatBlock(block) : null,
			};
			break;
		}

		case 'checkFinality': {
			const blockIdentifier = this.getNodeParameter('blockIdentifier', index) as string;

			const consensusClient = getConsensusClient(credentials);
			const block = await client.getBlock(blockIdentifier);

			if (!block) {
				throw new NodeOperationError(this.getNode(), `Block not found: ${blockIdentifier}`);
			}

			const isFinalized = await consensusClient.isBlockFinalized(block.number);
			const finality = await consensusClient.getFinalityStatus();

			result = {
				blockNumber: block.number,
				blockHash: block.hash,
				isFinalized,
				latestFinalizedBlock: finality.latestFinalizedBlock,
				confirmationsToFinality: isFinalized ? 0 : finality.latestBlock - block.number,
			};
			break;
		}

		case 'getBlockRange': {
			const startBlock = this.getNodeParameter('startBlock', index) as number;
			const endBlock = this.getNodeParameter('endBlock', index) as number;
			const includeTransactions = this.getNodeParameter('includeTransactions', index, false) as boolean;

			if (endBlock - startBlock > 100) {
				throw new NodeOperationError(this.getNode(), 'Block range cannot exceed 100 blocks');
			}

			const blocks: any[] = [];
			for (let i = startBlock; i <= endBlock; i++) {
				const block = await client.getBlock(i, includeTransactions);
				if (block) {
					blocks.push(client.formatBlock(block));
				}
			}

			result = {
				startBlock,
				endBlock,
				blockCount: blocks.length,
				blocks,
			};
			break;
		}

		case 'getUncleBlock': {
			const blockNumber = this.getNodeParameter('blockNumber', index) as number;
			const uncleIndex = this.getNodeParameter('uncleIndex', index) as number;

			const uncle = await client.rawRpcCall('eth_getUncleByBlockNumberAndIndex', [
				'0x' + blockNumber.toString(16),
				'0x' + uncleIndex.toString(16),
			]);

			if (!uncle) {
				throw new NodeOperationError(this.getNode(), `Uncle not found at block ${blockNumber}, index ${uncleIndex}`);
			}

			result = {
				blockNumber,
				uncleIndex,
				uncle,
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result }];
}
export { blockOperations as operations, blockFields as fields, executeBlockOperation as execute };
