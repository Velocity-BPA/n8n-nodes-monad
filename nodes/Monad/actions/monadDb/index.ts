/**
 * @file MonadDB Resource Operations
 * @copyright 2025 Velocity BPA
 * @license BSL-1.1
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getStateClient } from '../../transport/stateClient';
import { isValidAddress, normalizeAddress } from '../../utils/addressUtils';

export const monadDbOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['monadDb'],
			},
		},
		options: [
			{
				name: 'Get Account State',
				value: 'getAccountState',
				description: 'Get account state from MonadDB',
				action: 'Get account state',
			},
			{
				name: 'Get Storage',
				value: 'getStorage',
				description: 'Get storage slot value',
				action: 'Get storage value',
			},
			{
				name: 'Get Storage Range',
				value: 'getStorageRange',
				description: 'Get range of storage slots',
				action: 'Get storage range',
			},
			{
				name: 'Get State Proof',
				value: 'getStateProof',
				description: 'Get Merkle proof for account state',
				action: 'Get state proof',
			},
			{
				name: 'Get State Diff',
				value: 'getStateDiff',
				description: 'Get state changes between blocks',
				action: 'Get state diff',
			},
			{
				name: 'Get State Root',
				value: 'getStateRoot',
				description: 'Get state root at block',
				action: 'Get state root',
			},
			{
				name: 'Verify Proof',
				value: 'verifyProof',
				description: 'Verify a state proof',
				action: 'Verify state proof',
			},
			{
				name: 'Get Historical State',
				value: 'getHistoricalState',
				description: 'Get account state at historical block',
				action: 'Get historical state',
			},
		],
		default: 'getAccountState',
	},
];

export const monadDbFields: INodeProperties[] = [
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['monadDb'],
				operation: [
					'getAccountState',
					'getStorage',
					'getStorageRange',
					'getStateProof',
					'getHistoricalState',
				],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Account or contract address',
	},
	{
		displayName: 'Storage Slot',
		name: 'storageSlot',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['monadDb'],
				operation: ['getStorage'],
			},
		},
		default: '0x0',
		description: 'Storage slot (hex)',
	},
	{
		displayName: 'Storage Keys',
		name: 'storageKeys',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['monadDb'],
				operation: ['getStateProof'],
			},
		},
		default: '[]',
		description: 'Array of storage keys to include in proof',
	},
	{
		displayName: 'Start Key',
		name: 'startKey',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['monadDb'],
				operation: ['getStorageRange'],
			},
		},
		default: '0x0',
		description: 'Starting storage key',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['monadDb'],
				operation: ['getStorageRange'],
			},
		},
		default: 100,
		description: 'Maximum number of slots to return',
	},
	{
		displayName: 'Block',
		name: 'block',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['monadDb'],
				operation: [
					'getAccountState',
					'getStorage',
					'getStorageRange',
					'getStateProof',
					'getStateRoot',
					'getHistoricalState',
				],
			},
		},
		default: 'latest',
		description: 'Block number or tag',
	},
	{
		displayName: 'From Block',
		name: 'fromBlock',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['monadDb'],
				operation: ['getStateDiff'],
			},
		},
		default: 0,
		description: 'Starting block number',
	},
	{
		displayName: 'To Block',
		name: 'toBlock',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['monadDb'],
				operation: ['getStateDiff'],
			},
		},
		default: 0,
		description: 'Ending block number',
	},
	{
		displayName: 'Proof Data',
		name: 'proofData',
		type: 'json',
		required: true,
		displayOptions: {
			show: {
				resource: ['monadDb'],
				operation: ['verifyProof'],
			},
		},
		default: '{}',
		description: 'Proof object to verify',
	},
	{
		displayName: 'Expected State Root',
		name: 'expectedStateRoot',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['monadDb'],
				operation: ['verifyProof'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Expected state root for verification',
	},
];

export async function executeMonadDbOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('monadNetwork');
	const stateClient = getStateClient(credentials);

	let result: any;

	switch (operation) {
		case 'getAccountState': {
			const address = this.getNodeParameter('address', index) as string;
			const block = this.getNodeParameter('block', index, 'latest') as string;

			if (!isValidAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`);
			}

			const state = await stateClient.getAccountState(normalizeAddress(address), block);

			result = {
				address: normalizeAddress(address),
				block,
				...stateClient.formatAccountState(state),
			};
			break;
		}

		case 'getStorage': {
			const address = this.getNodeParameter('address', index) as string;
			const storageSlot = this.getNodeParameter('storageSlot', index) as string;
			const block = this.getNodeParameter('block', index, 'latest') as string;

			if (!isValidAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`);
			}

			const value = await stateClient.getStorageAt(
				normalizeAddress(address),
				storageSlot,
				block,
			);

			result = {
				address: normalizeAddress(address),
				slot: storageSlot,
				value,
				valueDecimal: BigInt(value).toString(),
				block,
			};
			break;
		}

		case 'getStorageRange': {
			const address = this.getNodeParameter('address', index) as string;
			const startKey = this.getNodeParameter('startKey', index, '0x0') as string;
			const limit = this.getNodeParameter('limit', index, 100) as number;
			const block = this.getNodeParameter('block', index, 'latest') as string;

			if (!isValidAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`);
			}

			const range = await stateClient.getStorageRange(
				normalizeAddress(address),
				startKey,
				limit,
				block,
			);

			result = {
				address: normalizeAddress(address),
				startKey,
				limit,
				block,
				storage: range.storage || [],
				nextKey: range.nextKey,
				complete: !range.nextKey,
			};
			break;
		}

		case 'getStateProof': {
			const address = this.getNodeParameter('address', index) as string;
			const storageKeysJson = this.getNodeParameter('storageKeys', index, '[]') as string;
			const block = this.getNodeParameter('block', index, 'latest') as string;

			if (!isValidAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`);
			}

			const storageKeys = JSON.parse(storageKeysJson);
			const proof = await stateClient.getStateProof(
				normalizeAddress(address),
				storageKeys,
				block,
			);

			result = {
				address: normalizeAddress(address),
				storageKeys,
				block,
				...proof,
			};
			break;
		}

		case 'getStateDiff': {
			const fromBlock = this.getNodeParameter('fromBlock', index) as number;
			const toBlock = this.getNodeParameter('toBlock', index) as number;

			if (toBlock - fromBlock > 100) {
				throw new NodeOperationError(this.getNode(), 'Block range cannot exceed 100 blocks');
			}

			const diff = await stateClient.getStateDiff(fromBlock, toBlock);

			result = {
				fromBlock,
				toBlock,
				...stateClient.formatStateDiff(diff),
			};
			break;
		}

		case 'getStateRoot': {
			const block = this.getNodeParameter('block', index, 'latest') as string;

			const stateRoot = await stateClient.getStateRoot(block);

			result = {
				block,
				stateRoot,
			};
			break;
		}

		case 'verifyProof': {
			const proofDataJson = this.getNodeParameter('proofData', index) as string;
			const expectedStateRoot = this.getNodeParameter('expectedStateRoot', index) as string;

			const proofData = JSON.parse(proofDataJson);
			const isValid = await stateClient.verifyProof(proofData, expectedStateRoot);

			result = {
				expectedStateRoot,
				proofData,
				isValid,
			};
			break;
		}

		case 'getHistoricalState': {
			const address = this.getNodeParameter('address', index) as string;
			const block = this.getNodeParameter('block', index) as string;

			if (!isValidAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`);
			}

			const state = await stateClient.getHistoricalState(normalizeAddress(address), block);

			result = {
				address: normalizeAddress(address),
				block,
				...stateClient.formatAccountState(state),
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result }];
}
export { monadDbOperations as operations, monadDbFields as fields, executeMonadDbOperation as execute };
