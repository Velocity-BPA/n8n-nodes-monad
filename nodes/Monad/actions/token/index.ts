/**
 * @file Token Resource Operations (ERC-20)
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
import { ERC20_ABI } from '../../constants/contracts';

export const tokenOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['token'],
			},
		},
		options: [
			{
				name: 'Get Token Info',
				value: 'getTokenInfo',
				description: 'Get ERC-20 token information',
				action: 'Get token info',
			},
			{
				name: 'Get Token Balance',
				value: 'getTokenBalance',
				description: 'Get token balance for an address',
				action: 'Get token balance',
			},
			{
				name: 'Get Token Allowance',
				value: 'getTokenAllowance',
				description: 'Get token allowance for spender',
				action: 'Get token allowance',
			},
			{
				name: 'Transfer Token',
				value: 'transferToken',
				description: 'Transfer tokens to an address',
				action: 'Transfer tokens',
			},
			{
				name: 'Approve Token',
				value: 'approveToken',
				description: 'Approve spender to use tokens',
				action: 'Approve token spending',
			},
			{
				name: 'Transfer From',
				value: 'transferFrom',
				description: 'Transfer tokens from another address (requires allowance)',
				action: 'Transfer tokens from address',
			},
			{
				name: 'Get Token Holders',
				value: 'getTokenHolders',
				description: 'Get list of token holders',
				action: 'Get token holders',
			},
			{
				name: 'Get Token Transfers',
				value: 'getTokenTransfers',
				description: 'Get token transfer history',
				action: 'Get token transfers',
			},
			{
				name: 'Get Total Supply',
				value: 'getTotalSupply',
				description: 'Get token total supply',
				action: 'Get total supply',
			},
			{
				name: 'Get Token Metadata',
				value: 'getTokenMetadata',
				description: 'Get comprehensive token metadata',
				action: 'Get token metadata',
			},
			{
				name: 'Deploy Token',
				value: 'deployToken',
				description: 'Deploy a new ERC-20 token',
				action: 'Deploy token',
			},
		],
		default: 'getTokenInfo',
	},
];

export const tokenFields: INodeProperties[] = [
	// Token address
	{
		displayName: 'Token Address',
		name: 'tokenAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['token'],
				operation: [
					'getTokenInfo',
					'getTokenBalance',
					'getTokenAllowance',
					'transferToken',
					'approveToken',
					'transferFrom',
					'getTokenHolders',
					'getTokenTransfers',
					'getTotalSupply',
					'getTokenMetadata',
				],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'ERC-20 token contract address',
	},
	// Account address
	{
		displayName: 'Account Address',
		name: 'accountAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['getTokenBalance'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Address to check balance for',
	},
	// Owner and spender for allowance
	{
		displayName: 'Owner Address',
		name: 'ownerAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['getTokenAllowance'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Token owner address',
	},
	{
		displayName: 'Spender Address',
		name: 'spenderAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['getTokenAllowance', 'approveToken'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Spender address',
	},
	// Transfer fields
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['transferToken', 'transferFrom'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Recipient address',
	},
	{
		displayName: 'From Address',
		name: 'fromAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['transferFrom'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Source address (must have allowance)',
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['transferToken', 'approveToken', 'transferFrom'],
			},
		},
		default: '',
		description: 'Token amount (in token units, not wei)',
	},
	// Deploy token fields
	{
		displayName: 'Token Name',
		name: 'tokenName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['deployToken'],
			},
		},
		default: '',
		placeholder: 'My Token',
		description: 'Name of the token',
	},
	{
		displayName: 'Token Symbol',
		name: 'tokenSymbol',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['deployToken'],
			},
		},
		default: '',
		placeholder: 'MTK',
		description: 'Symbol of the token',
	},
	{
		displayName: 'Decimals',
		name: 'decimals',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['deployToken'],
			},
		},
		default: 18,
		description: 'Number of decimals',
	},
	{
		displayName: 'Initial Supply',
		name: 'initialSupply',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['deployToken'],
			},
		},
		default: '1000000',
		description: 'Initial token supply (in token units)',
	},
	// Pagination options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['getTokenHolders', 'getTokenTransfers'],
			},
		},
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				description: 'Page number',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 100,
				description: 'Results per page',
			},
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
				description: 'Ending block number',
			},
		],
	},
];

export async function executeTokenOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('monadNetwork');
	const client = getMonadClient(credentials);

	let result: any;

	switch (operation) {
		case 'getTokenInfo': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;

			if (!isValidAddress(tokenAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`);
			}

			const normalizedToken = normalizeAddress(tokenAddress);

			const [name, symbol, decimals, totalSupply] = await Promise.all([
				client.callContract(normalizedToken, 'name()', []),
				client.callContract(normalizedToken, 'symbol()', []),
				client.callContract(normalizedToken, 'decimals()', []),
				client.callContract(normalizedToken, 'totalSupply()', []),
			]);

			result = {
				address: normalizedToken,
				name,
				symbol,
				decimals: Number(decimals),
				totalSupply: totalSupply.toString(),
			};
			break;
		}

		case 'getTokenBalance': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const accountAddress = this.getNodeParameter('accountAddress', index) as string;

			if (!isValidAddress(tokenAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`);
			}
			if (!isValidAddress(accountAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid account address: ${accountAddress}`);
			}

			const normalizedToken = normalizeAddress(tokenAddress);
			const normalizedAccount = normalizeAddress(accountAddress);

			const [balance, decimals, symbol] = await Promise.all([
				client.callContract(normalizedToken, 'balanceOf(address)', [normalizedAccount]),
				client.callContract(normalizedToken, 'decimals()', []),
				client.callContract(normalizedToken, 'symbol()', []),
			]);

			const dec = Number(decimals);
			const balanceFormatted = Number(balance) / Math.pow(10, dec);

			result = {
				tokenAddress: normalizedToken,
				accountAddress: normalizedAccount,
				balance: balance.toString(),
				balanceFormatted: balanceFormatted.toString(),
				symbol,
				decimals: dec,
			};
			break;
		}

		case 'getTokenAllowance': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const ownerAddress = this.getNodeParameter('ownerAddress', index) as string;
			const spenderAddress = this.getNodeParameter('spenderAddress', index) as string;

			if (!isValidAddress(tokenAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`);
			}
			if (!isValidAddress(ownerAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid owner address: ${ownerAddress}`);
			}
			if (!isValidAddress(spenderAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid spender address: ${spenderAddress}`);
			}

			const normalizedToken = normalizeAddress(tokenAddress);

			const [allowance, decimals, symbol] = await Promise.all([
				client.callContract(normalizedToken, 'allowance(address,address)', [
					normalizeAddress(ownerAddress),
					normalizeAddress(spenderAddress),
				]),
				client.callContract(normalizedToken, 'decimals()', []),
				client.callContract(normalizedToken, 'symbol()', []),
			]);

			const dec = Number(decimals);
			const allowanceFormatted = Number(allowance) / Math.pow(10, dec);

			result = {
				tokenAddress: normalizedToken,
				owner: normalizeAddress(ownerAddress),
				spender: normalizeAddress(spenderAddress),
				allowance: allowance.toString(),
				allowanceFormatted: allowanceFormatted.toString(),
				symbol,
				decimals: dec,
			};
			break;
		}

		case 'transferToken': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			if (!isValidAddress(tokenAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`);
			}
			if (!isValidAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid to address: ${toAddress}`);
			}

			const normalizedToken = normalizeAddress(tokenAddress);
			const decimals = await client.callContract(normalizedToken, 'decimals()', []);
			const amountWei = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, Number(decimals))));

			const tx = await client.executeContract(
				normalizedToken,
				'transfer(address,uint256)',
				[normalizeAddress(toAddress), amountWei],
				ERC20_ABI,
			);

			result = {
				transactionHash: tx.hash,
				tokenAddress: normalizedToken,
				to: normalizeAddress(toAddress),
				amount,
				amountWei: amountWei.toString(),
			};
			break;
		}

		case 'approveToken': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const spenderAddress = this.getNodeParameter('spenderAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			if (!isValidAddress(tokenAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`);
			}
			if (!isValidAddress(spenderAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid spender address: ${spenderAddress}`);
			}

			const normalizedToken = normalizeAddress(tokenAddress);
			const decimals = await client.callContract(normalizedToken, 'decimals()', []);
			const amountWei = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, Number(decimals))));

			const tx = await client.executeContract(
				normalizedToken,
				'approve(address,uint256)',
				[normalizeAddress(spenderAddress), amountWei],
				ERC20_ABI,
			);

			result = {
				transactionHash: tx.hash,
				tokenAddress: normalizedToken,
				spender: normalizeAddress(spenderAddress),
				amount,
				amountWei: amountWei.toString(),
			};
			break;
		}

		case 'transferFrom': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			if (!isValidAddress(tokenAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`);
			}
			if (!isValidAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid from address: ${fromAddress}`);
			}
			if (!isValidAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid to address: ${toAddress}`);
			}

			const normalizedToken = normalizeAddress(tokenAddress);
			const decimals = await client.callContract(normalizedToken, 'decimals()', []);
			const amountWei = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, Number(decimals))));

			const tx = await client.executeContract(
				normalizedToken,
				'transferFrom(address,address,uint256)',
				[normalizeAddress(fromAddress), normalizeAddress(toAddress), amountWei],
				ERC20_ABI,
			);

			result = {
				transactionHash: tx.hash,
				tokenAddress: normalizedToken,
				from: normalizeAddress(fromAddress),
				to: normalizeAddress(toAddress),
				amount,
				amountWei: amountWei.toString(),
			};
			break;
		}

		case 'getTokenHolders': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const options = this.getNodeParameter('options', index, {}) as any;

			if (!isValidAddress(tokenAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`);
			}

			const apiCredentials = await this.getCredentials('monadApi').catch(() => null);
			if (!apiCredentials) {
				throw new NodeOperationError(
					this.getNode(),
					'Monad API credentials required for token holders',
				);
			}

			const params = new URLSearchParams({
				module: 'token',
				action: 'tokenholderlist',
				contractaddress: normalizeAddress(tokenAddress),
				page: String(options.page || 1),
				offset: String(options.limit || 100),
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
				tokenAddress: normalizeAddress(tokenAddress),
				holders: data.result || [],
				count: (data.result || []).length,
			};
			break;
		}

		case 'getTokenTransfers': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const options = this.getNodeParameter('options', index, {}) as any;

			if (!isValidAddress(tokenAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`);
			}

			const apiCredentials = await this.getCredentials('monadApi').catch(() => null);
			if (!apiCredentials) {
				throw new NodeOperationError(
					this.getNode(),
					'Monad API credentials required for token transfers',
				);
			}

			const params = new URLSearchParams({
				module: 'token',
				action: 'tokentx',
				contractaddress: normalizeAddress(tokenAddress),
				page: String(options.page || 1),
				offset: String(options.limit || 100),
				startblock: String(options.startBlock || 0),
				endblock: String(options.endBlock || 'latest'),
				sort: 'desc',
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
				tokenAddress: normalizeAddress(tokenAddress),
				transfers: data.result || [],
				count: (data.result || []).length,
			};
			break;
		}

		case 'getTotalSupply': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;

			if (!isValidAddress(tokenAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`);
			}

			const normalizedToken = normalizeAddress(tokenAddress);

			const [totalSupply, decimals, symbol] = await Promise.all([
				client.callContract(normalizedToken, 'totalSupply()', []),
				client.callContract(normalizedToken, 'decimals()', []),
				client.callContract(normalizedToken, 'symbol()', []),
			]);

			const dec = Number(decimals);
			const supplyFormatted = Number(totalSupply) / Math.pow(10, dec);

			result = {
				tokenAddress: normalizedToken,
				totalSupply: totalSupply.toString(),
				totalSupplyFormatted: supplyFormatted.toString(),
				symbol,
				decimals: dec,
			};
			break;
		}

		case 'getTokenMetadata': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;

			if (!isValidAddress(tokenAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`);
			}

			const normalizedToken = normalizeAddress(tokenAddress);

			const [name, symbol, decimals, totalSupply] = await Promise.all([
				client.callContract(normalizedToken, 'name()', []).catch(() => null),
				client.callContract(normalizedToken, 'symbol()', []).catch(() => null),
				client.callContract(normalizedToken, 'decimals()', []).catch(() => 18),
				client.callContract(normalizedToken, 'totalSupply()', []).catch(() => null),
			]);

			// Try to get additional metadata if available
			let owner = null;
			try {
				owner = await client.callContract(normalizedToken, 'owner()', []);
			} catch {
				// owner() not implemented
			}

			result = {
				address: normalizedToken,
				name,
				symbol,
				decimals: Number(decimals),
				totalSupply: totalSupply?.toString() || null,
				owner,
			};
			break;
		}

		case 'deployToken': {
			const tokenName = this.getNodeParameter('tokenName', index) as string;
			const tokenSymbol = this.getNodeParameter('tokenSymbol', index) as string;
			const decimals = this.getNodeParameter('decimals', index, 18) as number;
			const initialSupply = this.getNodeParameter('initialSupply', index) as string;

			// Simple ERC-20 bytecode (OpenZeppelin ERC20)
			const erc20Bytecode = '0x60806040523480156200001157600080fd5b50604051620011f1380380620011f1833981016040819052620000349162000227565b8351849084906200004d90600390602085019062000092565b5080516200006390600490602084019062000092565b5050600580546001600160a01b0319163317905550620000846012600a620003df565b6200009090826200045b565b5050505062000494565b828054620000a090620003a2565b90600052602060002090601f016020900481019282620000c4576000855562000110565b82601f10620000df57805160ff191683800117855562000110565b8280016001018555821562000110579182015b828111156200011057825182559160200191906001019162000011565b506200011e92915062000122565b5090565b5b808211156200011e576000815560010162000123565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126200016157600080fd5b81516001600160401b03808211156200017e576200017e62000139565b604051601f8301601f19908116603f01168101908282118183101715620001a957620001a962000139565b81604052838152602092508683858801011115620001c657600080fd5b600091505b83821015620001ea5785820183015181830184015290820190620001cb565b83821115620001fc5760008385830101525b9695505050505050565b80516001600160a01b03811681146200021e57600080fd5b919050565b600080600080608085870312156200023a57600080fd5b84516001600160401b03808211156200025257600080fd5b62000260888389016200014f565b955060208701519150808211156200027757600080fd5b5062000286878288016200014f565b9350506200029760408601620002006565b9150606085015190509295919450925056fe';

			// Encode constructor arguments
			const supplyWei = BigInt(Math.floor(parseFloat(initialSupply) * Math.pow(10, decimals)));

			const deployment = await client.deployContract(
				erc20Bytecode,
				[tokenName, tokenSymbol, decimals, supplyWei],
				[
					'constructor(string,string,uint8,uint256)',
				],
			);

			result = {
				transactionHash: deployment.hash,
				contractAddress: deployment.contractAddress,
				name: tokenName,
				symbol: tokenSymbol,
				decimals,
				initialSupply,
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result }];
}
export { tokenOperations as operations, tokenFields as fields, executeTokenOperation as execute };
