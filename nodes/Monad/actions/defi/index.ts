/**
 * @file DeFi Resource Operations
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

export const defiOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['defi'],
			},
		},
		options: [
			{
				name: 'Get Token Price',
				value: 'getTokenPrice',
				description: 'Get token price from DEX',
				action: 'Get token price',
			},
			{
				name: 'Get Pool Info',
				value: 'getPoolInfo',
				description: 'Get DEX pool information',
				action: 'Get pool info',
			},
			{
				name: 'Get Reserves',
				value: 'getReserves',
				description: 'Get pool reserves',
				action: 'Get reserves',
			},
			{
				name: 'Approve Token',
				value: 'approveToken',
				description: 'Approve token spending',
				action: 'Approve token',
			},
			{
				name: 'Get Allowance',
				value: 'getAllowance',
				description: 'Get token allowance',
				action: 'Get allowance',
			},
			{
				name: 'Wrap MONAD',
				value: 'wrapMonad',
				description: 'Wrap MONAD to WMONAD',
				action: 'Wrap MONAD',
			},
			{
				name: 'Unwrap WMONAD',
				value: 'unwrapWmonad',
				description: 'Unwrap WMONAD to MONAD',
				action: 'Unwrap WMONAD',
			},
		],
		default: 'getTokenPrice',
	},
];

export const defiFields: INodeProperties[] = [
	{
		displayName: 'Token Address',
		name: 'tokenAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['getTokenPrice', 'approveToken', 'getAllowance'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Token contract address',
	},
	{
		displayName: 'Pool Address',
		name: 'poolAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['getPoolInfo', 'getReserves'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'DEX pool address',
	},
	{
		displayName: 'Spender Address',
		name: 'spenderAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['approveToken', 'getAllowance'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Spender address to approve',
	},
	{
		displayName: 'Owner Address',
		name: 'ownerAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['getAllowance'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Token owner address',
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['approveToken', 'wrapMonad', 'unwrapWmonad'],
			},
		},
		default: '0',
		description: 'Amount (use "max" for maximum approval)',
	},
];

// WMONAD ABI
const WMONAD_ABI = [
	'function deposit() payable',
	'function withdraw(uint256 amount)',
	'function balanceOf(address account) view returns (uint256)',
];

// Uniswap V2 Pair ABI
const PAIR_ABI = [
	'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
	'function token0() view returns (address)',
	'function token1() view returns (address)',
	'function totalSupply() view returns (uint256)',
];

export async function executeDefiOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('monadNetwork');
	const client = getMonadClient(credentials);

	let result: any;

	switch (operation) {
		case 'getTokenPrice': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;

			if (!isValidAddress(tokenAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`);
			}

			// Query token info
			const [nameData, symbolData, decimalsData] = await Promise.all([
				client.callContract(normalizeAddress(tokenAddress), client.encodeFunctionData(ERC20_ABI, 'name', [])),
				client.callContract(normalizeAddress(tokenAddress), client.encodeFunctionData(ERC20_ABI, 'symbol', [])),
				client.callContract(normalizeAddress(tokenAddress), client.encodeFunctionData(ERC20_ABI, 'decimals', [])),
			]);

			result = {
				tokenAddress: normalizeAddress(tokenAddress),
				name: nameData,
				symbol: symbolData,
				decimals: parseInt(decimalsData, 16),
				note: 'Price data requires DEX integration or oracle',
			};
			break;
		}

		case 'getPoolInfo': {
			const poolAddress = this.getNodeParameter('poolAddress', index) as string;

			if (!isValidAddress(poolAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid pool address: ${poolAddress}`);
			}

			const [token0Data, token1Data, totalSupplyData] = await Promise.all([
				client.callContract(normalizeAddress(poolAddress), client.encodeFunctionData(PAIR_ABI, 'token0', [])),
				client.callContract(normalizeAddress(poolAddress), client.encodeFunctionData(PAIR_ABI, 'token1', [])),
				client.callContract(normalizeAddress(poolAddress), client.encodeFunctionData(PAIR_ABI, 'totalSupply', [])),
			]);

			result = {
				poolAddress: normalizeAddress(poolAddress),
				token0: '0x' + token0Data.slice(26),
				token1: '0x' + token1Data.slice(26),
				totalSupply: BigInt(totalSupplyData).toString(),
			};
			break;
		}

		case 'getReserves': {
			const poolAddress = this.getNodeParameter('poolAddress', index) as string;

			if (!isValidAddress(poolAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid pool address: ${poolAddress}`);
			}

			const reservesData = await client.callContract(
				normalizeAddress(poolAddress),
				client.encodeFunctionData(PAIR_ABI, 'getReserves', []),
			);

			// Parse reserves from response
			const reserve0 = BigInt('0x' + reservesData.slice(2, 66));
			const reserve1 = BigInt('0x' + reservesData.slice(66, 130));
			const timestamp = parseInt(reservesData.slice(130), 16);

			result = {
				poolAddress: normalizeAddress(poolAddress),
				reserve0: reserve0.toString(),
				reserve1: reserve1.toString(),
				blockTimestampLast: timestamp,
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

			const approveAmount = amount.toLowerCase() === 'max'
				? BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
				: client.parseEther(amount);

			const data = client.encodeFunctionData(ERC20_ABI, 'approve', [
				normalizeAddress(spenderAddress),
				approveAmount,
			]);

			const tx = await client.sendSignedTransaction({
				to: normalizeAddress(tokenAddress),
				data,
			});

			const receipt = await client.waitForTransaction(tx.hash);

			result = {
				transactionHash: tx.hash,
				tokenAddress: normalizeAddress(tokenAddress),
				spenderAddress: normalizeAddress(spenderAddress),
				amount: approveAmount.toString(),
				receipt: client.formatReceipt(receipt),
			};
			break;
		}

		case 'getAllowance': {
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

			const data = client.encodeFunctionData(ERC20_ABI, 'allowance', [
				normalizeAddress(ownerAddress),
				normalizeAddress(spenderAddress),
			]);

			const response = await client.callContract(normalizeAddress(tokenAddress), data);
			const allowance = BigInt(response);

			result = {
				tokenAddress: normalizeAddress(tokenAddress),
				ownerAddress: normalizeAddress(ownerAddress),
				spenderAddress: normalizeAddress(spenderAddress),
				allowance: allowance.toString(),
				allowanceFormatted: client.formatEther(allowance),
			};
			break;
		}

		case 'wrapMonad': {
			const amount = this.getNodeParameter('amount', index) as string;
			const { COMMON_TOKENS } = await import('../../constants/tokens');
			const wmonad = COMMON_TOKENS.find(t => t.symbol === 'WMONAD');

			if (!wmonad) {
				throw new NodeOperationError(this.getNode(), 'WMONAD address not configured');
			}

			const amountWei = client.parseEther(amount);

			const tx = await client.sendSignedTransaction({
				to: wmonad.address,
				data: client.encodeFunctionData(WMONAD_ABI, 'deposit', []),
				value: amountWei,
			});

			const receipt = await client.waitForTransaction(tx.hash);

			result = {
				transactionHash: tx.hash,
				amount,
				amountWei: amountWei.toString(),
				wmonadAddress: wmonad.address,
				receipt: client.formatReceipt(receipt),
			};
			break;
		}

		case 'unwrapWmonad': {
			const amount = this.getNodeParameter('amount', index) as string;
			const { COMMON_TOKENS } = await import('../../constants/tokens');
			const wmonad = COMMON_TOKENS.find(t => t.symbol === 'WMONAD');

			if (!wmonad) {
				throw new NodeOperationError(this.getNode(), 'WMONAD address not configured');
			}

			const amountWei = client.parseEther(amount);

			const tx = await client.sendSignedTransaction({
				to: wmonad.address,
				data: client.encodeFunctionData(WMONAD_ABI, 'withdraw', [amountWei]),
			});

			const receipt = await client.waitForTransaction(tx.hash);

			result = {
				transactionHash: tx.hash,
				amount,
				amountWei: amountWei.toString(),
				wmonadAddress: wmonad.address,
				receipt: client.formatReceipt(receipt),
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result }];
}
export { defiOperations as operations, defiFields as fields, executeDefiOperation as execute };
