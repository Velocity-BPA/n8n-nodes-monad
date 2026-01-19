/**
 * @file Account Abstraction Resource Operations (ERC-4337)
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
import { CONTRACT_ADDRESSES, ENTRYPOINT_ABI } from '../../constants/contracts';

export const accountAbstractionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['accountAbstraction'],
			},
		},
		options: [
			{
				name: 'Get User Operation',
				value: 'getUserOperation',
				description: 'Get user operation by hash',
				action: 'Get user operation',
			},
			{
				name: 'Send User Operation',
				value: 'sendUserOperation',
				description: 'Send a user operation',
				action: 'Send user operation',
			},
			{
				name: 'Estimate User Op Gas',
				value: 'estimateUserOpGas',
				description: 'Estimate gas for user operation',
				action: 'Estimate user op gas',
			},
			{
				name: 'Get Nonce',
				value: 'getNonce',
				description: 'Get account nonce for ERC-4337',
				action: 'Get nonce',
			},
			{
				name: 'Get Deposit',
				value: 'getDeposit',
				description: 'Get account deposit in EntryPoint',
				action: 'Get deposit',
			},
			{
				name: 'Add Deposit',
				value: 'addDeposit',
				description: 'Add deposit to EntryPoint',
				action: 'Add deposit',
			},
			{
				name: 'Get Supported EntryPoints',
				value: 'getSupportedEntryPoints',
				description: 'Get supported entry points',
				action: 'Get supported entry points',
			},
		],
		default: 'getUserOperation',
	},
];

export const accountAbstractionFields: INodeProperties[] = [
	{
		displayName: 'User Op Hash',
		name: 'userOpHash',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['accountAbstraction'],
				operation: ['getUserOperation'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'User operation hash',
	},
	{
		displayName: 'User Operation',
		name: 'userOperation',
		type: 'json',
		required: true,
		displayOptions: {
			show: {
				resource: ['accountAbstraction'],
				operation: ['sendUserOperation', 'estimateUserOpGas'],
			},
		},
		default: '{}',
		description: 'User operation object',
	},
	{
		displayName: 'Account Address',
		name: 'accountAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['accountAbstraction'],
				operation: ['getNonce', 'getDeposit', 'addDeposit'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Smart account address',
	},
	{
		displayName: 'Key',
		name: 'key',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['accountAbstraction'],
				operation: ['getNonce'],
			},
		},
		default: 0,
		description: 'Nonce key (for parallel nonces)',
	},
	{
		displayName: 'Amount (MONAD)',
		name: 'amount',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['accountAbstraction'],
				operation: ['addDeposit'],
			},
		},
		default: '0',
		description: 'Amount to deposit',
	},
	{
		displayName: 'EntryPoint Address',
		name: 'entryPointAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['accountAbstraction'],
				operation: [
					'sendUserOperation',
					'estimateUserOpGas',
					'getNonce',
					'getDeposit',
					'addDeposit',
				],
			},
		},
		default: '',
		placeholder: '0x... (optional, uses default)',
		description: 'EntryPoint contract address',
	},
];

export async function executeAccountAbstractionOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('monadNetwork');
	const client = getMonadClient(credentials);

	let result: any;

	switch (operation) {
		case 'getUserOperation': {
			const userOpHash = this.getNodeParameter('userOpHash', index) as string;

			// Call bundler RPC
			const userOp = await client.rawRpcCall('eth_getUserOperationByHash', [userOpHash]);

			if (!userOp) {
				throw new NodeOperationError(this.getNode(), `User operation not found: ${userOpHash}`);
			}

			result = {
				userOpHash,
				userOperation: userOp,
			};
			break;
		}

		case 'sendUserOperation': {
			const userOperationJson = this.getNodeParameter('userOperation', index) as string;
			const entryPointAddress = this.getNodeParameter('entryPointAddress', index, '') as string;

			const userOperation = JSON.parse(userOperationJson);
			const entryPoint = entryPointAddress && isValidAddress(entryPointAddress)
				? normalizeAddress(entryPointAddress)
				: CONTRACT_ADDRESSES.entryPoint;

			const userOpHash = await client.rawRpcCall('eth_sendUserOperation', [
				userOperation,
				entryPoint,
			]);

			result = {
				userOpHash,
				entryPoint,
				userOperation,
			};
			break;
		}

		case 'estimateUserOpGas': {
			const userOperationJson = this.getNodeParameter('userOperation', index) as string;
			const entryPointAddress = this.getNodeParameter('entryPointAddress', index, '') as string;

			const userOperation = JSON.parse(userOperationJson);
			const entryPoint = entryPointAddress && isValidAddress(entryPointAddress)
				? normalizeAddress(entryPointAddress)
				: CONTRACT_ADDRESSES.entryPoint;

			const gasEstimate = await client.rawRpcCall('eth_estimateUserOperationGas', [
				userOperation,
				entryPoint,
			]);

			result = {
				entryPoint,
				...gasEstimate,
			};
			break;
		}

		case 'getNonce': {
			const accountAddress = this.getNodeParameter('accountAddress', index) as string;
			const key = this.getNodeParameter('key', index, 0) as number;
			const entryPointAddress = this.getNodeParameter('entryPointAddress', index, '') as string;

			if (!isValidAddress(accountAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid account address: ${accountAddress}`);
			}

			const entryPoint = entryPointAddress && isValidAddress(entryPointAddress)
				? normalizeAddress(entryPointAddress)
				: CONTRACT_ADDRESSES.entryPoint;

			const data = client.encodeFunctionData(ENTRYPOINT_ABI, 'getNonce', [
				normalizeAddress(accountAddress),
				key,
			]);

			const response = await client.callContract(entryPoint, data);
			const nonce = BigInt(response);

			result = {
				accountAddress: normalizeAddress(accountAddress),
				key,
				nonce: nonce.toString(),
				entryPoint,
			};
			break;
		}

		case 'getDeposit': {
			const accountAddress = this.getNodeParameter('accountAddress', index) as string;
			const entryPointAddress = this.getNodeParameter('entryPointAddress', index, '') as string;

			if (!isValidAddress(accountAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid account address: ${accountAddress}`);
			}

			const entryPoint = entryPointAddress && isValidAddress(entryPointAddress)
				? normalizeAddress(entryPointAddress)
				: CONTRACT_ADDRESSES.entryPoint;

			const data = client.encodeFunctionData(ENTRYPOINT_ABI, 'balanceOf', [
				normalizeAddress(accountAddress),
			]);

			const response = await client.callContract(entryPoint, data);
			const deposit = BigInt(response);

			result = {
				accountAddress: normalizeAddress(accountAddress),
				deposit: deposit.toString(),
				depositMONAD: client.formatEther(deposit),
				entryPoint,
			};
			break;
		}

		case 'addDeposit': {
			const accountAddress = this.getNodeParameter('accountAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const entryPointAddress = this.getNodeParameter('entryPointAddress', index, '') as string;

			if (!isValidAddress(accountAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid account address: ${accountAddress}`);
			}

			const entryPoint = entryPointAddress && isValidAddress(entryPointAddress)
				? normalizeAddress(entryPointAddress)
				: CONTRACT_ADDRESSES.entryPoint;

			const amountWei = client.parseEther(amount);

			const data = client.encodeFunctionData(ENTRYPOINT_ABI, 'depositTo', [
				normalizeAddress(accountAddress),
			]);

			const tx = await client.sendSignedTransaction({
				to: entryPoint,
				data,
				value: amountWei,
			});

			const receipt = await client.waitForTransaction(tx.hash);

			result = {
				transactionHash: tx.hash,
				accountAddress: normalizeAddress(accountAddress),
				amount,
				amountWei: amountWei.toString(),
				entryPoint,
				receipt: client.formatReceipt(receipt),
			};
			break;
		}

		case 'getSupportedEntryPoints': {
			const entryPoints = await client.rawRpcCall('eth_supportedEntryPoints', []);

			result = {
				entryPoints: entryPoints || [CONTRACT_ADDRESSES.entryPoint],
				defaultEntryPoint: CONTRACT_ADDRESSES.entryPoint,
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result }];
}
export { accountAbstractionOperations as operations, accountAbstractionFields as fields, executeAccountAbstractionOperation as execute };
