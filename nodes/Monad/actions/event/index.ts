/**
 * @file Event Resource Operations
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
import { decodeEventLog } from '../../utils/encodingUtils';

export const eventOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['event'],
			},
		},
		options: [
			{
				name: 'Get Logs',
				value: 'getLogs',
				description: 'Query event logs with filters',
				action: 'Get event logs',
			},
			{
				name: 'Decode Log',
				value: 'decodeLog',
				description: 'Decode a log entry with ABI',
				action: 'Decode a log',
			},
			{
				name: 'Get Contract Events',
				value: 'getContractEvents',
				description: 'Get all events emitted by a contract',
				action: 'Get contract events',
			},
			{
				name: 'Get Transaction Logs',
				value: 'getTransactionLogs',
				description: 'Get all logs from a transaction',
				action: 'Get transaction logs',
			},
			{
				name: 'Get Transfer Events',
				value: 'getTransferEvents',
				description: 'Get ERC20 Transfer events',
				action: 'Get transfer events',
			},
			{
				name: 'Get Approval Events',
				value: 'getApprovalEvents',
				description: 'Get ERC20 Approval events',
				action: 'Get approval events',
			},
		],
		default: 'getLogs',
	},
];

export const eventFields: INodeProperties[] = [
	{
		displayName: 'Contract Address',
		name: 'contractAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getLogs', 'getContractEvents', 'getTransferEvents', 'getApprovalEvents'],
			},
		},
		default: '',
		placeholder: '0x... (optional)',
		description: 'Contract address to filter events',
	},
	{
		displayName: 'Topics',
		name: 'topics',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getLogs'],
			},
		},
		default: '[]',
		description: 'Event topics array (first topic is event signature)',
	},
	{
		displayName: 'From Block',
		name: 'fromBlock',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getLogs', 'getContractEvents', 'getTransferEvents', 'getApprovalEvents'],
			},
		},
		default: 'latest',
		description: 'Starting block number or tag',
	},
	{
		displayName: 'To Block',
		name: 'toBlock',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getLogs', 'getContractEvents', 'getTransferEvents', 'getApprovalEvents'],
			},
		},
		default: 'latest',
		description: 'Ending block number or tag',
	},
	{
		displayName: 'Transaction Hash',
		name: 'transactionHash',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getTransactionLogs'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Transaction hash to get logs from',
	},
	{
		displayName: 'ABI',
		name: 'abi',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['decodeLog', 'getContractEvents'],
			},
		},
		default: '[]',
		description: 'Contract ABI for decoding events',
	},
	{
		displayName: 'Log Data',
		name: 'logData',
		type: 'json',
		required: true,
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['decodeLog'],
			},
		},
		default: '{}',
		description: 'Log object to decode (topics, data)',
	},
	{
		displayName: 'Filter Address',
		name: 'filterAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['event'],
				operation: ['getTransferEvents', 'getApprovalEvents'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Filter by from/to address',
	},
];

// Standard event signatures
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const APPROVAL_TOPIC = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925';

export async function executeEventOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('monadNetwork');
	const client = getMonadClient(credentials);

	let result: any;

	switch (operation) {
		case 'getLogs': {
			const contractAddress = this.getNodeParameter('contractAddress', index, '') as string;
			const topicsJson = this.getNodeParameter('topics', index, '[]') as string;
			const fromBlock = this.getNodeParameter('fromBlock', index, 'latest') as string;
			const toBlock = this.getNodeParameter('toBlock', index, 'latest') as string;

			const filter: any = {
				fromBlock,
				toBlock,
			};

			if (contractAddress && isValidAddress(contractAddress)) {
				filter.address = normalizeAddress(contractAddress);
			}

			const topics = JSON.parse(topicsJson);
			if (topics.length > 0) {
				filter.topics = topics;
			}

			const logs = await client.getLogs(filter);

			result = {
				filter,
				logs: logs.map((log: any) => ({
					address: log.address,
					topics: log.topics,
					data: log.data,
					blockNumber: log.blockNumber,
					blockHash: log.blockHash,
					transactionHash: log.transactionHash,
					transactionIndex: log.transactionIndex,
					logIndex: log.logIndex,
					removed: log.removed,
				})),
				count: logs.length,
			};
			break;
		}

		case 'decodeLog': {
			const abiJson = this.getNodeParameter('abi', index) as string;
			const logDataJson = this.getNodeParameter('logData', index) as string;

			const abi = JSON.parse(abiJson);
			const logData = JSON.parse(logDataJson);

			const decoded = decodeEventLog(abi, logData.topics, logData.data);

			result = {
				rawLog: logData,
				decoded,
			};
			break;
		}

		case 'getContractEvents': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const abiJson = this.getNodeParameter('abi', index, '[]') as string;
			const fromBlock = this.getNodeParameter('fromBlock', index, 'latest') as string;
			const toBlock = this.getNodeParameter('toBlock', index, 'latest') as string;

			if (!contractAddress || !isValidAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), 'Valid contract address required');
			}

			const logs = await client.getLogs({
				address: normalizeAddress(contractAddress),
				fromBlock,
				toBlock,
			});

			const abi = JSON.parse(abiJson);
			const decodedLogs = logs.map((log: any) => {
				let decoded = null;
				if (abi.length > 0) {
					try {
						decoded = decodeEventLog(abi, log.topics, log.data);
					} catch {
						// Could not decode with provided ABI
					}
				}
				return {
					address: log.address,
					topics: log.topics,
					data: log.data,
					blockNumber: log.blockNumber,
					transactionHash: log.transactionHash,
					logIndex: log.logIndex,
					decoded,
				};
			});

			result = {
				contractAddress: normalizeAddress(contractAddress),
				fromBlock,
				toBlock,
				events: decodedLogs,
				count: decodedLogs.length,
			};
			break;
		}

		case 'getTransactionLogs': {
			const transactionHash = this.getNodeParameter('transactionHash', index) as string;

			const receipt = await client.getTransactionReceipt(transactionHash);
			if (!receipt) {
				throw new NodeOperationError(this.getNode(), `Transaction not found: ${transactionHash}`);
			}

			const logs = receipt.logs || [];

			result = {
				transactionHash,
				blockNumber: receipt.blockNumber,
				logs: logs.map((log: any) => ({
					address: log.address,
					topics: log.topics,
					data: log.data,
					logIndex: log.logIndex,
				})),
				count: logs.length,
			};
			break;
		}

		case 'getTransferEvents': {
			const contractAddress = this.getNodeParameter('contractAddress', index, '') as string;
			const filterAddress = this.getNodeParameter('filterAddress', index, '') as string;
			const fromBlock = this.getNodeParameter('fromBlock', index, 'latest') as string;
			const toBlock = this.getNodeParameter('toBlock', index, 'latest') as string;

			const topics: (string | null)[] = [TRANSFER_TOPIC];

			if (filterAddress && isValidAddress(filterAddress)) {
				const paddedAddress = '0x' + normalizeAddress(filterAddress).slice(2).padStart(64, '0');
				topics.push(paddedAddress); // from
				topics.push(null); // any to
			}

			const filter: any = {
				fromBlock,
				toBlock,
				topics,
			};

			if (contractAddress && isValidAddress(contractAddress)) {
				filter.address = normalizeAddress(contractAddress);
			}

			const logs = await client.getLogs(filter);

			const transfers = logs.map((log: any) => {
				const from = '0x' + log.topics[1].slice(26);
				const to = '0x' + log.topics[2].slice(26);
				const value = BigInt(log.data).toString();

				return {
					token: log.address,
					from,
					to,
					value,
					blockNumber: log.blockNumber,
					transactionHash: log.transactionHash,
					logIndex: log.logIndex,
				};
			});

			result = {
				transfers,
				count: transfers.length,
			};
			break;
		}

		case 'getApprovalEvents': {
			const contractAddress = this.getNodeParameter('contractAddress', index, '') as string;
			const filterAddress = this.getNodeParameter('filterAddress', index, '') as string;
			const fromBlock = this.getNodeParameter('fromBlock', index, 'latest') as string;
			const toBlock = this.getNodeParameter('toBlock', index, 'latest') as string;

			const topics: (string | null)[] = [APPROVAL_TOPIC];

			if (filterAddress && isValidAddress(filterAddress)) {
				const paddedAddress = '0x' + normalizeAddress(filterAddress).slice(2).padStart(64, '0');
				topics.push(paddedAddress); // owner
			}

			const filter: any = {
				fromBlock,
				toBlock,
				topics,
			};

			if (contractAddress && isValidAddress(contractAddress)) {
				filter.address = normalizeAddress(contractAddress);
			}

			const logs = await client.getLogs(filter);

			const approvals = logs.map((log: any) => {
				const owner = '0x' + log.topics[1].slice(26);
				const spender = '0x' + log.topics[2].slice(26);
				const value = BigInt(log.data).toString();

				return {
					token: log.address,
					owner,
					spender,
					value,
					blockNumber: log.blockNumber,
					transactionHash: log.transactionHash,
					logIndex: log.logIndex,
				};
			});

			result = {
				approvals,
				count: approvals.length,
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result }];
}
export { eventOperations as operations, eventFields as fields, executeEventOperation as execute };
