/**
 * @file Multicall Resource Operations
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
import { isValidAddress, normalizeAddress } from '../../utils/addressUtils';
import { encodeFunctionCall, decodeAbiResult } from '../../utils/encodingUtils';
import { CONTRACT_ADDRESSES, MULTICALL3_ABI } from '../../constants/contracts';

export const multicallOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['multicall'],
			},
		},
		options: [
			{
				name: 'Aggregate',
				value: 'aggregate',
				description: 'Execute multiple calls in a single transaction',
				action: 'Aggregate calls',
			},
			{
				name: 'Try Aggregate',
				value: 'tryAggregate',
				description: 'Execute calls with failure tolerance',
				action: 'Try aggregate calls',
			},
			{
				name: 'Aggregate3',
				value: 'aggregate3',
				description: 'Execute Multicall3 with per-call failure tolerance',
				action: 'Aggregate3 calls',
			},
			{
				name: 'Get Block Data',
				value: 'getBlockData',
				description: 'Get current block data via Multicall3',
				action: 'Get block data',
			},
			{
				name: 'Batch Balance Query',
				value: 'batchBalanceQuery',
				description: 'Get balances for multiple addresses',
				action: 'Batch balance query',
			},
			{
				name: 'Batch Token Query',
				value: 'batchTokenQuery',
				description: 'Get token balances for multiple addresses',
				action: 'Batch token query',
			},
		],
		default: 'aggregate',
	},
];

export const multicallFields: INodeProperties[] = [
	{
		displayName: 'Calls',
		name: 'calls',
		type: 'json',
		required: true,
		displayOptions: {
			show: {
				resource: ['multicall'],
				operation: ['aggregate', 'tryAggregate', 'aggregate3'],
			},
		},
		default: '[]',
		description: 'Array of call objects: [{ target, callData, allowFailure? }]',
	},
	{
		displayName: 'Require Success',
		name: 'requireSuccess',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['multicall'],
				operation: ['tryAggregate'],
			},
		},
		default: false,
		description: 'Whether to require all calls to succeed',
	},
	{
		displayName: 'Addresses',
		name: 'addresses',
		type: 'json',
		required: true,
		displayOptions: {
			show: {
				resource: ['multicall'],
				operation: ['batchBalanceQuery'],
			},
		},
		default: '[]',
		description: 'Array of addresses to query',
	},
	{
		displayName: 'Token Address',
		name: 'tokenAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['multicall'],
				operation: ['batchTokenQuery'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Token contract address',
	},
	{
		displayName: 'Holder Addresses',
		name: 'holderAddresses',
		type: 'json',
		required: true,
		displayOptions: {
			show: {
				resource: ['multicall'],
				operation: ['batchTokenQuery'],
			},
		},
		default: '[]',
		description: 'Array of holder addresses to query',
	},
	{
		displayName: 'ABI',
		name: 'abi',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['multicall'],
				operation: ['aggregate', 'tryAggregate', 'aggregate3'],
			},
		},
		default: '[]',
		description: 'ABI for decoding results (optional)',
	},
];

export async function executeMulticallOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('monadNetwork');
	const client = getMonadClient(credentials);

	let result: any;

	switch (operation) {
		case 'aggregate': {
			const callsJson = this.getNodeParameter('calls', index) as string;
			const calls = JSON.parse(callsJson);

			// Format calls for Multicall3
			const formattedCalls = calls.map((call: any) => ({
				target: normalizeAddress(call.target),
				callData: call.callData,
			}));

			const data = client.encodeFunctionData(MULTICALL3_ABI, 'aggregate', [formattedCalls]);
			const response = await client.callContract(CONTRACT_ADDRESSES.multicall3, data);

			result = {
				multicallAddress: CONTRACT_ADDRESSES.multicall3,
				callCount: calls.length,
				rawResponse: response,
			};
			break;
		}

		case 'tryAggregate': {
			const callsJson = this.getNodeParameter('calls', index) as string;
			const requireSuccess = this.getNodeParameter('requireSuccess', index, false) as boolean;
			const calls = JSON.parse(callsJson);

			const formattedCalls = calls.map((call: any) => ({
				target: normalizeAddress(call.target),
				callData: call.callData,
			}));

			const data = client.encodeFunctionData(MULTICALL3_ABI, 'tryAggregate', [
				requireSuccess,
				formattedCalls,
			]);
			const response = await client.callContract(CONTRACT_ADDRESSES.multicall3, data);

			result = {
				multicallAddress: CONTRACT_ADDRESSES.multicall3,
				callCount: calls.length,
				requireSuccess,
				rawResponse: response,
			};
			break;
		}

		case 'aggregate3': {
			const callsJson = this.getNodeParameter('calls', index) as string;
			const calls = JSON.parse(callsJson);

			const formattedCalls = calls.map((call: any) => ({
				target: normalizeAddress(call.target),
				allowFailure: call.allowFailure ?? true,
				callData: call.callData,
			}));

			const data = client.encodeFunctionData(MULTICALL3_ABI, 'aggregate3', [formattedCalls]);
			const response = await client.callContract(CONTRACT_ADDRESSES.multicall3, data);

			result = {
				multicallAddress: CONTRACT_ADDRESSES.multicall3,
				callCount: calls.length,
				rawResponse: response,
			};
			break;
		}

		case 'getBlockData': {
			const calls = [
				{
					target: CONTRACT_ADDRESSES.multicall3,
					callData: client.encodeFunctionData(MULTICALL3_ABI, 'getBlockNumber', []),
				},
				{
					target: CONTRACT_ADDRESSES.multicall3,
					callData: client.encodeFunctionData(MULTICALL3_ABI, 'getCurrentBlockTimestamp', []),
				},
				{
					target: CONTRACT_ADDRESSES.multicall3,
					callData: client.encodeFunctionData(MULTICALL3_ABI, 'getCurrentBlockGasLimit', []),
				},
				{
					target: CONTRACT_ADDRESSES.multicall3,
					callData: client.encodeFunctionData(MULTICALL3_ABI, 'getCurrentBlockCoinbase', []),
				},
				{
					target: CONTRACT_ADDRESSES.multicall3,
					callData: client.encodeFunctionData(MULTICALL3_ABI, 'getBasefee', []),
				},
			];

			const data = client.encodeFunctionData(MULTICALL3_ABI, 'aggregate3', [
				calls.map(c => ({ ...c, allowFailure: true })),
			]);
			const response = await client.callContract(CONTRACT_ADDRESSES.multicall3, data);

			result = {
				multicallAddress: CONTRACT_ADDRESSES.multicall3,
				rawResponse: response,
			};
			break;
		}

		case 'batchBalanceQuery': {
			const addressesJson = this.getNodeParameter('addresses', index) as string;
			const addresses = JSON.parse(addressesJson);

			const calls = addresses.map((addr: string) => ({
				target: CONTRACT_ADDRESSES.multicall3,
				allowFailure: true,
				callData: client.encodeFunctionData(MULTICALL3_ABI, 'getEthBalance', [
					normalizeAddress(addr),
				]),
			}));

			const data = client.encodeFunctionData(MULTICALL3_ABI, 'aggregate3', [calls]);
			const response = await client.callContract(CONTRACT_ADDRESSES.multicall3, data);

			// Parse response to extract balances
			const balances = addresses.map((addr: string, i: number) => ({
				address: normalizeAddress(addr),
				index: i,
			}));

			result = {
				multicallAddress: CONTRACT_ADDRESSES.multicall3,
				addressCount: addresses.length,
				balances,
				rawResponse: response,
			};
			break;
		}

		case 'batchTokenQuery': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const holderAddressesJson = this.getNodeParameter('holderAddresses', index) as string;
			const holderAddresses = JSON.parse(holderAddressesJson);

			if (!isValidAddress(tokenAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`);
			}

			// ERC20 balanceOf function selector
			const balanceOfSelector = '0x70a08231';

			const calls = holderAddresses.map((addr: string) => ({
				target: normalizeAddress(tokenAddress),
				allowFailure: true,
				callData: balanceOfSelector + normalizeAddress(addr).slice(2).padStart(64, '0'),
			}));

			const data = client.encodeFunctionData(MULTICALL3_ABI, 'aggregate3', [calls]);
			const response = await client.callContract(CONTRACT_ADDRESSES.multicall3, data);

			const balances = holderAddresses.map((addr: string, i: number) => ({
				holder: normalizeAddress(addr),
				index: i,
			}));

			result = {
				tokenAddress: normalizeAddress(tokenAddress),
				multicallAddress: CONTRACT_ADDRESSES.multicall3,
				holderCount: holderAddresses.length,
				balances,
				rawResponse: response,
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result }];
}
export { multicallOperations as operations, multicallFields as fields, executeMulticallOperation as execute };
