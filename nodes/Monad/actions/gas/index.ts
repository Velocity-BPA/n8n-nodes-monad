/**
 * @file Gas Resource Operations
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
import { getMempoolClient } from '../../transport/mempoolClient';
import {
	getComprehensiveGasEstimate,
	getGasOracle,
	calculateTransactionCost,
} from '../../utils/gasUtils';
import { isValidAddress, normalizeAddress } from '../../utils/addressUtils';

export const gasOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['gas'],
			},
		},
		options: [
			{
				name: 'Get Gas Price',
				value: 'getGasPrice',
				description: 'Get current gas price',
				action: 'Get gas price',
			},
			{
				name: 'Get Fee Data',
				value: 'getFeeData',
				description: 'Get EIP-1559 fee data',
				action: 'Get fee data',
			},
			{
				name: 'Get Gas Oracle',
				value: 'getGasOracle',
				description: 'Get gas price recommendations',
				action: 'Get gas oracle',
			},
			{
				name: 'Estimate Gas',
				value: 'estimateGas',
				description: 'Estimate gas for a transaction',
				action: 'Estimate gas',
			},
			{
				name: 'Calculate Transaction Cost',
				value: 'calculateCost',
				description: 'Calculate total transaction cost',
				action: 'Calculate transaction cost',
			},
			{
				name: 'Get Mempool Gas Stats',
				value: 'getMempoolGasStats',
				description: 'Get gas price distribution in mempool',
				action: 'Get mempool gas stats',
			},
			{
				name: 'Get Historical Gas',
				value: 'getHistoricalGas',
				description: 'Get historical gas prices',
				action: 'Get historical gas prices',
			},
		],
		default: 'getGasPrice',
	},
];

export const gasFields: INodeProperties[] = [
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['gas'],
				operation: ['estimateGas', 'calculateCost'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Destination address',
	},
	{
		displayName: 'From Address',
		name: 'fromAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['gas'],
				operation: ['estimateGas'],
			},
		},
		default: '',
		placeholder: '0x... (optional)',
		description: 'Source address',
	},
	{
		displayName: 'Value (MONAD)',
		name: 'value',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['gas'],
				operation: ['estimateGas', 'calculateCost'],
			},
		},
		default: '0',
		description: 'Amount of MONAD to send',
	},
	{
		displayName: 'Data',
		name: 'data',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['gas'],
				operation: ['estimateGas', 'calculateCost'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Transaction data',
	},
	{
		displayName: 'Gas Limit',
		name: 'gasLimit',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['gas'],
				operation: ['calculateCost'],
			},
		},
		default: 21000,
		description: 'Gas limit for calculation',
	},
	{
		displayName: 'Block Count',
		name: 'blockCount',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['gas'],
				operation: ['getHistoricalGas'],
			},
		},
		default: 10,
		description: 'Number of blocks to analyze',
	},
	{
		displayName: 'Newest Block',
		name: 'newestBlock',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['gas'],
				operation: ['getHistoricalGas'],
			},
		},
		default: 'latest',
		description: 'Newest block to include',
	},
];

export async function executeGasOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('monadNetwork');
	const client = getMonadClient(credentials);

	let result: any;

	switch (operation) {
		case 'getGasPrice': {
			const gasPrice = await client.getGasPrice();

			result = {
				gasPrice: gasPrice.toString(),
				gasPriceGwei: client.formatGwei(gasPrice),
				timestamp: Date.now(),
			};
			break;
		}

		case 'getFeeData': {
			const feeData = await client.getFeeData();

			result = {
				gasPrice: feeData.gasPrice?.toString(),
				gasPriceGwei: feeData.gasPrice ? client.formatGwei(feeData.gasPrice) : null,
				maxFeePerGas: feeData.maxFeePerGas?.toString(),
				maxFeePerGasGwei: feeData.maxFeePerGas ? client.formatGwei(feeData.maxFeePerGas) : null,
				maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
				maxPriorityFeePerGasGwei: feeData.maxPriorityFeePerGas
					? client.formatGwei(feeData.maxPriorityFeePerGas)
					: null,
				timestamp: Date.now(),
			};
			break;
		}

		case 'getGasOracle': {
			const oracle = await getGasOracle(client);

			result = {
				...oracle,
				timestamp: Date.now(),
			};
			break;
		}

		case 'estimateGas': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const fromAddress = this.getNodeParameter('fromAddress', index, '') as string;
			const value = this.getNodeParameter('value', index, '0') as string;
			const data = this.getNodeParameter('data', index, '') as string;

			if (!isValidAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid to address: ${toAddress}`);
			}

			const tx: any = {
				to: normalizeAddress(toAddress),
				value: client.parseEther(value),
			};

			if (fromAddress && isValidAddress(fromAddress)) {
				tx.from = normalizeAddress(fromAddress);
			}

			if (data) {
				tx.data = data;
			}

			const estimate = await getComprehensiveGasEstimate(client, tx);

			result = {
				...estimate,
				transaction: {
					to: tx.to,
					from: tx.from,
					value,
					data: data || null,
				},
			};
			break;
		}

		case 'calculateCost': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const value = this.getNodeParameter('value', index, '0') as string;
			const data = this.getNodeParameter('data', index, '') as string;
			const gasLimit = this.getNodeParameter('gasLimit', index) as number;

			if (!isValidAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid to address: ${toAddress}`);
			}

			const feeData = await client.getFeeData();
			const cost = calculateTransactionCost(BigInt(gasLimit), feeData.gasPrice || 0n);

			result = {
				gasLimit,
				gasPrice: feeData.gasPrice?.toString(),
				gasPriceGwei: feeData.gasPrice ? client.formatGwei(feeData.gasPrice) : null,
				gasCost: cost.toString(),
				gasCostMONAD: client.formatEther(cost),
				value,
				totalCost: (cost + client.parseEther(value)).toString(),
				totalCostMONAD: client.formatEther(cost + client.parseEther(value)),
			};
			break;
		}

		case 'getMempoolGasStats': {
			const mempoolClient = getMempoolClient(credentials);
			const gasDistribution = await mempoolClient.getGasPriceDistribution();

			result = {
				...gasDistribution,
				timestamp: Date.now(),
			};
			break;
		}

		case 'getHistoricalGas': {
			const blockCount = this.getNodeParameter('blockCount', index, 10) as number;
			const newestBlock = this.getNodeParameter('newestBlock', index, 'latest') as string;

			// Use eth_feeHistory for historical data
			const feeHistory = await client.rawRpcCall('eth_feeHistory', [
				'0x' + blockCount.toString(16),
				newestBlock,
				[25, 50, 75],
			]);

			const baseFeeHistory = (feeHistory.baseFeePerGas || []).map((fee: string) => ({
				wei: BigInt(fee).toString(),
				gwei: client.formatGwei(BigInt(fee)),
			}));

			const rewardHistory = (feeHistory.reward || []).map((rewards: string[]) => ({
				percentile25: {
					wei: BigInt(rewards[0]).toString(),
					gwei: client.formatGwei(BigInt(rewards[0])),
				},
				percentile50: {
					wei: BigInt(rewards[1]).toString(),
					gwei: client.formatGwei(BigInt(rewards[1])),
				},
				percentile75: {
					wei: BigInt(rewards[2]).toString(),
					gwei: client.formatGwei(BigInt(rewards[2])),
				},
			}));

			result = {
				oldestBlock: parseInt(feeHistory.oldestBlock, 16),
				blockCount,
				baseFeeHistory,
				rewardHistory,
				gasUsedRatio: feeHistory.gasUsedRatio,
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result }];
}
export { gasOperations as operations, gasFields as fields, executeGasOperation as execute };
