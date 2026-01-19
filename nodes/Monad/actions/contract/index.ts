/**
 * @file Contract Resource Operations
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
import { isValidAddress, normalizeAddress, isContractAddress } from '../../utils/addressUtils';
import { encodeAbiData, decodeAbiResult, encodeFunctionCall } from '../../utils/encodingUtils';

export const contractOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['contract'],
			},
		},
		options: [
			{
				name: 'Read Contract',
				value: 'readContract',
				description: 'Call a read-only contract function',
				action: 'Read from a contract',
			},
			{
				name: 'Write Contract',
				value: 'writeContract',
				description: 'Execute a state-changing contract function',
				action: 'Write to a contract',
			},
			{
				name: 'Deploy Contract',
				value: 'deployContract',
				description: 'Deploy a new contract',
				action: 'Deploy a contract',
			},
			{
				name: 'Get Contract Code',
				value: 'getCode',
				description: 'Get contract bytecode',
				action: 'Get contract code',
			},
			{
				name: 'Get Storage At',
				value: 'getStorageAt',
				description: 'Get storage value at a specific slot',
				action: 'Get storage at slot',
			},
			{
				name: 'Verify Contract',
				value: 'verifyContract',
				description: 'Check if an address is a contract',
				action: 'Verify if address is contract',
			},
			{
				name: 'Estimate Contract Call',
				value: 'estimateContractCall',
				description: 'Estimate gas for a contract call',
				action: 'Estimate gas for contract call',
			},
			{
				name: 'Encode Function Call',
				value: 'encodeFunctionCall',
				description: 'Encode function call data',
				action: 'Encode function call',
			},
			{
				name: 'Decode Function Result',
				value: 'decodeFunctionResult',
				description: 'Decode function return data',
				action: 'Decode function result',
			},
		],
		default: 'readContract',
	},
];

export const contractFields: INodeProperties[] = [
	{
		displayName: 'Contract Address',
		name: 'contractAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: [
					'readContract',
					'writeContract',
					'getCode',
					'getStorageAt',
					'verifyContract',
					'estimateContractCall',
				],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The contract address',
	},
	{
		displayName: 'ABI',
		name: 'abi',
		type: 'json',
		required: true,
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: [
					'readContract',
					'writeContract',
					'estimateContractCall',
					'encodeFunctionCall',
					'decodeFunctionResult',
				],
			},
		},
		default: '[]',
		description: 'Contract ABI (JSON array)',
	},
	{
		displayName: 'Function Name',
		name: 'functionName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: [
					'readContract',
					'writeContract',
					'estimateContractCall',
					'encodeFunctionCall',
					'decodeFunctionResult',
				],
			},
		},
		default: '',
		placeholder: 'transfer',
		description: 'Name of the function to call',
	},
	{
		displayName: 'Function Arguments',
		name: 'functionArgs',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: [
					'readContract',
					'writeContract',
					'estimateContractCall',
					'encodeFunctionCall',
				],
			},
		},
		default: '[]',
		description: 'Function arguments as JSON array',
	},
	{
		displayName: 'Value (MONAD)',
		name: 'value',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['writeContract', 'estimateContractCall'],
			},
		},
		default: '0',
		description: 'MONAD to send with the transaction',
	},
	{
		displayName: 'Storage Slot',
		name: 'storageSlot',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['getStorageAt'],
			},
		},
		default: '0x0',
		description: 'Storage slot to query (hex)',
	},
	{
		displayName: 'Bytecode',
		name: 'bytecode',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['deployContract'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Contract bytecode to deploy',
	},
	{
		displayName: 'Constructor Arguments',
		name: 'constructorArgs',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['deployContract'],
			},
		},
		default: '[]',
		description: 'Constructor arguments as JSON array',
	},
	{
		displayName: 'Constructor ABI',
		name: 'constructorAbi',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['deployContract'],
			},
		},
		default: '[]',
		description: 'Constructor ABI for encoding arguments',
	},
	{
		displayName: 'Encoded Data',
		name: 'encodedData',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['decodeFunctionResult'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Encoded data to decode',
	},
	{
		displayName: 'Block',
		name: 'block',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['readContract', 'getCode', 'getStorageAt'],
			},
		},
		default: 'latest',
		description: 'Block number or tag',
	},
	{
		displayName: 'Gas Options',
		name: 'gasOptions',
		type: 'collection',
		placeholder: 'Add Gas Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['writeContract', 'deployContract'],
			},
		},
		options: [
			{
				displayName: 'Gas Limit',
				name: 'gasLimit',
				type: 'number',
				default: 0,
				description: 'Gas limit (0 for auto)',
			},
			{
				displayName: 'Max Fee Per Gas (Gwei)',
				name: 'maxFeePerGas',
				type: 'string',
				default: '',
				description: 'Maximum fee per gas',
			},
			{
				displayName: 'Max Priority Fee (Gwei)',
				name: 'maxPriorityFeePerGas',
				type: 'string',
				default: '',
				description: 'Maximum priority fee per gas',
			},
		],
	},
];

export async function executeContractOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('monadNetwork');
	const client = getMonadClient(credentials);

	let result: any;

	switch (operation) {
		case 'readContract': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const abiJson = this.getNodeParameter('abi', index) as string;
			const functionName = this.getNodeParameter('functionName', index) as string;
			const functionArgsJson = this.getNodeParameter('functionArgs', index, '[]') as string;
			const block = this.getNodeParameter('block', index, 'latest') as string;

			if (!isValidAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`);
			}

			const abi = JSON.parse(abiJson);
			const functionArgs = JSON.parse(functionArgsJson);

			const data = encodeFunctionCall(abi, functionName, functionArgs);
			const response = await client.callContract(
				normalizeAddress(contractAddress),
				data,
				block,
			);

			const decoded = decodeAbiResult(abi, functionName, response);

			result = {
				contractAddress: normalizeAddress(contractAddress),
				functionName,
				args: functionArgs,
				rawResult: response,
				decoded,
				block,
			};
			break;
		}

		case 'writeContract': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const abiJson = this.getNodeParameter('abi', index) as string;
			const functionName = this.getNodeParameter('functionName', index) as string;
			const functionArgsJson = this.getNodeParameter('functionArgs', index, '[]') as string;
			const value = this.getNodeParameter('value', index, '0') as string;
			const gasOptions = this.getNodeParameter('gasOptions', index, {}) as any;

			if (!isValidAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`);
			}

			const abi = JSON.parse(abiJson);
			const functionArgs = JSON.parse(functionArgsJson);
			const data = encodeFunctionCall(abi, functionName, functionArgs);

			const txData: any = {
				to: normalizeAddress(contractAddress),
				data,
				value: client.parseEther(value),
			};

			if (gasOptions.gasLimit) txData.gasLimit = gasOptions.gasLimit;
			if (gasOptions.maxFeePerGas) txData.maxFeePerGas = client.parseGwei(gasOptions.maxFeePerGas);
			if (gasOptions.maxPriorityFeePerGas) {
				txData.maxPriorityFeePerGas = client.parseGwei(gasOptions.maxPriorityFeePerGas);
			}

			const tx = await client.sendSignedTransaction(txData);
			const receipt = await client.waitForTransaction(tx.hash);

			result = {
				transactionHash: tx.hash,
				contractAddress: normalizeAddress(contractAddress),
				functionName,
				args: functionArgs,
				receipt: client.formatReceipt(receipt),
			};
			break;
		}

		case 'deployContract': {
			const bytecode = this.getNodeParameter('bytecode', index) as string;
			const constructorArgsJson = this.getNodeParameter('constructorArgs', index, '[]') as string;
			const constructorAbiJson = this.getNodeParameter('constructorAbi', index, '[]') as string;
			const gasOptions = this.getNodeParameter('gasOptions', index, {}) as any;

			const constructorArgs = JSON.parse(constructorArgsJson);
			const constructorAbi = JSON.parse(constructorAbiJson);

			let deployData = bytecode;
			if (constructorArgs.length > 0 && constructorAbi.length > 0) {
				const encodedArgs = encodeAbiData(constructorAbi, constructorArgs);
				deployData = bytecode + encodedArgs.slice(2);
			}

			const txData: any = {
				data: deployData,
			};

			if (gasOptions.gasLimit) txData.gasLimit = gasOptions.gasLimit;
			if (gasOptions.maxFeePerGas) txData.maxFeePerGas = client.parseGwei(gasOptions.maxFeePerGas);
			if (gasOptions.maxPriorityFeePerGas) {
				txData.maxPriorityFeePerGas = client.parseGwei(gasOptions.maxPriorityFeePerGas);
			}

			const tx = await client.deployContract(deployData, txData);
			const receipt = await client.waitForTransaction(tx.hash);

			result = {
				transactionHash: tx.hash,
				contractAddress: receipt.contractAddress,
				deployedBy: receipt.from,
				gasUsed: receipt.gasUsed?.toString(),
				blockNumber: receipt.blockNumber,
			};
			break;
		}

		case 'getCode': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const block = this.getNodeParameter('block', index, 'latest') as string;

			if (!isValidAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`);
			}

			const code = await client.getCode(normalizeAddress(contractAddress), block);

			result = {
				contractAddress: normalizeAddress(contractAddress),
				code,
				codeSize: code === '0x' ? 0 : (code.length - 2) / 2,
				isContract: code !== '0x' && code.length > 2,
				block,
			};
			break;
		}

		case 'getStorageAt': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const storageSlot = this.getNodeParameter('storageSlot', index) as string;
			const block = this.getNodeParameter('block', index, 'latest') as string;

			if (!isValidAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`);
			}

			const storage = await client.getStorageAt(
				normalizeAddress(contractAddress),
				storageSlot,
				block,
			);

			result = {
				contractAddress: normalizeAddress(contractAddress),
				slot: storageSlot,
				value: storage,
				block,
			};
			break;
		}

		case 'verifyContract': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;

			if (!isValidAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${contractAddress}`);
			}

			const isContract = await isContractAddress(client, normalizeAddress(contractAddress));
			const code = await client.getCode(normalizeAddress(contractAddress));

			result = {
				address: normalizeAddress(contractAddress),
				isContract,
				codeSize: code === '0x' ? 0 : (code.length - 2) / 2,
			};
			break;
		}

		case 'estimateContractCall': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const abiJson = this.getNodeParameter('abi', index) as string;
			const functionName = this.getNodeParameter('functionName', index) as string;
			const functionArgsJson = this.getNodeParameter('functionArgs', index, '[]') as string;
			const value = this.getNodeParameter('value', index, '0') as string;

			if (!isValidAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`);
			}

			const abi = JSON.parse(abiJson);
			const functionArgs = JSON.parse(functionArgsJson);
			const data = encodeFunctionCall(abi, functionName, functionArgs);

			const gasEstimate = await client.estimateGas({
				to: normalizeAddress(contractAddress),
				data,
				value: client.parseEther(value),
			});

			const feeData = await client.getFeeData();

			result = {
				contractAddress: normalizeAddress(contractAddress),
				functionName,
				estimatedGas: gasEstimate.toString(),
				gasPrice: feeData.gasPrice?.toString(),
				maxFeePerGas: feeData.maxFeePerGas?.toString(),
				estimatedCost: feeData.gasPrice
					? client.formatEther(BigInt(gasEstimate.toString()) * feeData.gasPrice)
					: null,
			};
			break;
		}

		case 'encodeFunctionCall': {
			const abiJson = this.getNodeParameter('abi', index) as string;
			const functionName = this.getNodeParameter('functionName', index) as string;
			const functionArgsJson = this.getNodeParameter('functionArgs', index, '[]') as string;

			const abi = JSON.parse(abiJson);
			const functionArgs = JSON.parse(functionArgsJson);
			const encoded = encodeFunctionCall(abi, functionName, functionArgs);

			result = {
				functionName,
				args: functionArgs,
				encodedData: encoded,
				selector: encoded.slice(0, 10),
			};
			break;
		}

		case 'decodeFunctionResult': {
			const abiJson = this.getNodeParameter('abi', index) as string;
			const functionName = this.getNodeParameter('functionName', index) as string;
			const encodedData = this.getNodeParameter('encodedData', index) as string;

			const abi = JSON.parse(abiJson);
			const decoded = decodeAbiResult(abi, functionName, encodedData);

			result = {
				functionName,
				encodedData,
				decoded,
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result }];
}
export { contractOperations as operations, contractFields as fields, executeContractOperation as execute };
