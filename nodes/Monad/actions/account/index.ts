/**
 * @file Account Resource Operations
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
import { getStateClient } from '../../transport/stateClient';
import {
	isValidAddress,
	normalizeAddress,
	shortenAddress,
} from '../../utils/addressUtils';
import { estimateGas } from '../../utils/gasUtils';

export const accountOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['account'],
			},
		},
		options: [
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get MONAD balance of an address',
				action: 'Get balance of an address',
			},
			{
				name: 'Get Token Balances',
				value: 'getTokenBalances',
				description: 'Get all token balances for an address',
				action: 'Get token balances of an address',
			},
			{
				name: 'Get Transaction Count',
				value: 'getTransactionCount',
				description: 'Get the number of transactions sent from an address (nonce)',
				action: 'Get transaction count of an address',
			},
			{
				name: 'Get Transaction History',
				value: 'getTransactionHistory',
				description: 'Get transaction history for an address',
				action: 'Get transaction history of an address',
			},
			{
				name: 'Get Internal Transactions',
				value: 'getInternalTransactions',
				description: 'Get internal transactions for an address',
				action: 'Get internal transactions of an address',
			},
			{
				name: 'Get Token Transfers',
				value: 'getTokenTransfers',
				description: 'Get token transfer history for an address',
				action: 'Get token transfers of an address',
			},
			{
				name: 'Get NFT Holdings',
				value: 'getNftHoldings',
				description: 'Get NFTs owned by an address',
				action: 'Get NFT holdings of an address',
			},
			{
				name: 'Get Account Info',
				value: 'getAccountInfo',
				description: 'Get comprehensive account information',
				action: 'Get account info',
			},
			{
				name: 'Get Account State',
				value: 'getAccountState',
				description: 'Get MonadDB account state (nonce, balance, storage root, code hash)',
				action: 'Get account state',
			},
			{
				name: 'Estimate Gas',
				value: 'estimateGas',
				description: 'Estimate gas for a transaction from this account',
				action: 'Estimate gas for a transaction',
			},
		],
		default: 'getBalance',
	},
];

export const accountFields: INodeProperties[] = [
	// Address field for most operations
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['account'],
				operation: [
					'getBalance',
					'getTokenBalances',
					'getTransactionCount',
					'getTransactionHistory',
					'getInternalTransactions',
					'getTokenTransfers',
					'getNftHoldings',
					'getAccountInfo',
					'getAccountState',
				],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The Monad address to query',
	},
	// Block parameter for balance queries
	{
		displayName: 'Block',
		name: 'block',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['getBalance', 'getTransactionCount', 'getAccountState'],
			},
		},
		default: 'latest',
		description: 'Block number or tag (latest, pending, earliest)',
	},
	// Pagination for history queries
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['getTransactionHistory', 'getInternalTransactions', 'getTokenTransfers'],
			},
		},
		options: [
			{
				displayName: 'Start Block',
				name: 'startBlock',
				type: 'number',
				default: 0,
				description: 'Starting block number',
			},
			{
				displayName: 'End Block',
				name: 'endBlock',
				type: 'string',
				default: 'latest',
				description: 'Ending block number or "latest"',
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				description: 'Page number for pagination',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 100,
				description: 'Number of results per page',
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				options: [
					{ name: 'Ascending', value: 'asc' },
					{ name: 'Descending', value: 'desc' },
				],
				default: 'desc',
				description: 'Sort order by block number',
			},
		],
	},
	// Token filter for token transfers
	{
		displayName: 'Token Address',
		name: 'tokenAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['getTokenTransfers'],
			},
		},
		default: '',
		placeholder: '0x... (optional)',
		description: 'Filter by specific token contract address',
	},
	// Estimate gas fields
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['estimateGas'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Destination address for the transaction',
	},
	{
		displayName: 'From Address',
		name: 'fromAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['estimateGas'],
			},
		},
		default: '',
		placeholder: '0x... (optional, uses connected wallet)',
		description: 'Source address for the transaction',
	},
	{
		displayName: 'Value (MONAD)',
		name: 'value',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['estimateGas'],
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
				resource: ['account'],
				operation: ['estimateGas'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Transaction data (for contract calls)',
	},
];

export async function executeAccountOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('monadNetwork');
	const client = getMonadClient(credentials);

	let result: any;

	switch (operation) {
		case 'getBalance': {
			const address = this.getNodeParameter('address', index) as string;
			const block = this.getNodeParameter('block', index, 'latest') as string;

			if (!isValidAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`);
			}

			const balance = await client.getBalance(normalizeAddress(address), block);
			result = {
				address: normalizeAddress(address),
				balance: balance.toString(),
				balanceFormatted: client.formatEther(balance),
				unit: 'MONAD',
				block,
			};
			break;
		}

		case 'getTokenBalances': {
			const address = this.getNodeParameter('address', index) as string;

			if (!isValidAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`);
			}

			// Query common tokens - in production would use indexer
			const { COMMON_TOKENS } = await import('../../constants/tokens');
			const tokenBalances: any[] = [];

			for (const token of COMMON_TOKENS) {
				try {
					const balance = await client.callContract(
						token.address,
						'balanceOf(address)',
						[normalizeAddress(address)],
					);
					if (BigInt(balance) > 0n) {
						tokenBalances.push({
							token: token.symbol,
							name: token.name,
							address: token.address,
							balance: balance.toString(),
							decimals: token.decimals,
						});
					}
				} catch {
					// Token may not exist or not be ERC20
				}
			}

			result = {
				address: normalizeAddress(address),
				tokens: tokenBalances,
				count: tokenBalances.length,
			};
			break;
		}

		case 'getTransactionCount': {
			const address = this.getNodeParameter('address', index) as string;
			const block = this.getNodeParameter('block', index, 'latest') as string;

			if (!isValidAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`);
			}

			const count = await client.getTransactionCount(normalizeAddress(address), block);
			result = {
				address: normalizeAddress(address),
				transactionCount: count,
				nonce: count,
				block,
			};
			break;
		}

		case 'getTransactionHistory': {
			const address = this.getNodeParameter('address', index) as string;
			const options = this.getNodeParameter('options', index, {}) as any;

			if (!isValidAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`);
			}

			// Use explorer API for transaction history
			const apiCredentials = await this.getCredentials('monadApi').catch(() => null);
			if (!apiCredentials) {
				throw new NodeOperationError(
					this.getNode(),
					'Monad API credentials required for transaction history',
				);
			}

			const params = new URLSearchParams({
				module: 'account',
				action: 'txlist',
				address: normalizeAddress(address),
				startblock: String(options.startBlock || 0),
				endblock: String(options.endBlock || 'latest'),
				page: String(options.page || 1),
				offset: String(options.limit || 100),
				sort: options.sort || 'desc',
			});

			const response = await fetch(
				`${apiCredentials.explorerApiUrl}?${params.toString()}`,
				{
					headers: {
						'X-API-Key': apiCredentials.apiKey as string,
					},
				},
			);
			const data = await response.json();

			result = {
				address: normalizeAddress(address),
				transactions: data.result || [],
				count: (data.result || []).length,
			};
			break;
		}

		case 'getInternalTransactions': {
			const address = this.getNodeParameter('address', index) as string;
			const options = this.getNodeParameter('options', index, {}) as any;

			if (!isValidAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`);
			}

			const apiCredentials = await this.getCredentials('monadApi').catch(() => null);
			if (!apiCredentials) {
				throw new NodeOperationError(
					this.getNode(),
					'Monad API credentials required for internal transactions',
				);
			}

			const params = new URLSearchParams({
				module: 'account',
				action: 'txlistinternal',
				address: normalizeAddress(address),
				startblock: String(options.startBlock || 0),
				endblock: String(options.endBlock || 'latest'),
				page: String(options.page || 1),
				offset: String(options.limit || 100),
				sort: options.sort || 'desc',
			});

			const response = await fetch(
				`${apiCredentials.explorerApiUrl}?${params.toString()}`,
				{
					headers: {
						'X-API-Key': apiCredentials.apiKey as string,
					},
				},
			);
			const data = await response.json();

			result = {
				address: normalizeAddress(address),
				internalTransactions: data.result || [],
				count: (data.result || []).length,
			};
			break;
		}

		case 'getTokenTransfers': {
			const address = this.getNodeParameter('address', index) as string;
			const tokenAddress = this.getNodeParameter('tokenAddress', index, '') as string;
			const options = this.getNodeParameter('options', index, {}) as any;

			if (!isValidAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`);
			}

			const apiCredentials = await this.getCredentials('monadApi').catch(() => null);
			if (!apiCredentials) {
				throw new NodeOperationError(
					this.getNode(),
					'Monad API credentials required for token transfers',
				);
			}

			const params = new URLSearchParams({
				module: 'account',
				action: 'tokentx',
				address: normalizeAddress(address),
				startblock: String(options.startBlock || 0),
				endblock: String(options.endBlock || 'latest'),
				page: String(options.page || 1),
				offset: String(options.limit || 100),
				sort: options.sort || 'desc',
			});

			if (tokenAddress && isValidAddress(tokenAddress)) {
				params.append('contractaddress', normalizeAddress(tokenAddress));
			}

			const response = await fetch(
				`${apiCredentials.explorerApiUrl}?${params.toString()}`,
				{
					headers: {
						'X-API-Key': apiCredentials.apiKey as string,
					},
				},
			);
			const data = await response.json();

			result = {
				address: normalizeAddress(address),
				tokenTransfers: data.result || [],
				count: (data.result || []).length,
			};
			break;
		}

		case 'getNftHoldings': {
			const address = this.getNodeParameter('address', index) as string;

			if (!isValidAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`);
			}

			const apiCredentials = await this.getCredentials('monadApi').catch(() => null);
			if (!apiCredentials) {
				throw new NodeOperationError(
					this.getNode(),
					'Monad API credentials required for NFT holdings',
				);
			}

			// Query ERC-721 tokens
			const params721 = new URLSearchParams({
				module: 'account',
				action: 'tokennfttx',
				address: normalizeAddress(address),
				page: '1',
				offset: '1000',
				sort: 'desc',
			});

			const response721 = await fetch(
				`${apiCredentials.explorerApiUrl}?${params721.toString()}`,
				{
					headers: {
						'X-API-Key': apiCredentials.apiKey as string,
					},
				},
			);
			const data721 = await response721.json();

			// Query ERC-1155 tokens
			const params1155 = new URLSearchParams({
				module: 'account',
				action: 'token1155tx',
				address: normalizeAddress(address),
				page: '1',
				offset: '1000',
				sort: 'desc',
			});

			const response1155 = await fetch(
				`${apiCredentials.explorerApiUrl}?${params1155.toString()}`,
				{
					headers: {
						'X-API-Key': apiCredentials.apiKey as string,
					},
				},
			);
			const data1155 = await response1155.json();

			result = {
				address: normalizeAddress(address),
				erc721: data721.result || [],
				erc1155: data1155.result || [],
				totalCount: (data721.result?.length || 0) + (data1155.result?.length || 0),
			};
			break;
		}

		case 'getAccountInfo': {
			const address = this.getNodeParameter('address', index) as string;

			if (!isValidAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`);
			}

			const normalizedAddress = normalizeAddress(address);
			
			// Get balance, nonce, and code
			const [balance, nonce, code] = await Promise.all([
				client.getBalance(normalizedAddress),
				client.getTransactionCount(normalizedAddress),
				client.getCode(normalizedAddress),
			]);

			const isContract = code !== '0x' && code.length > 2;

			result = {
				address: normalizedAddress,
				shortAddress: shortenAddress(normalizedAddress),
				balance: balance.toString(),
				balanceFormatted: client.formatEther(balance),
				nonce,
				isContract,
				codeSize: isContract ? (code.length - 2) / 2 : 0,
			};
			break;
		}

		case 'getAccountState': {
			const address = this.getNodeParameter('address', index) as string;
			const block = this.getNodeParameter('block', index, 'latest') as string;

			if (!isValidAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`);
			}

			const stateClient = getStateClient(credentials);
			const state = await stateClient.getAccountState(normalizeAddress(address), block);

			result = {
				address: normalizeAddress(address),
				...state,
				block,
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

			const gasEstimate = await estimateGas(client, tx);

			result = {
				...gasEstimate,
				transaction: {
					to: tx.to,
					from: tx.from,
					value,
					data: data || null,
				},
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result }];
}
export { accountOperations as operations, accountFields as fields, executeAccountOperation as execute };
