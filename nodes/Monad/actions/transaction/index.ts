/**
 * @file Transaction Resource Operations
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
import { isValidAddress, normalizeAddress } from '../../utils/addressUtils';
import { estimateGas, getComprehensiveGasEstimate } from '../../utils/gasUtils';
import { parseCallTrace, formatCallTrace } from '../../utils/traceUtils';
import { decodeTransactionData } from '../../utils/encodingUtils';

export const transactionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['transaction'],
			},
		},
		options: [
			{
				name: 'Send MONAD',
				value: 'sendMonad',
				description: 'Send native MONAD to an address',
				action: 'Send MONAD to an address',
			},
			{
				name: 'Send Transaction',
				value: 'sendTransaction',
				description: 'Send a raw transaction',
				action: 'Send a transaction',
			},
			{
				name: 'Sign Transaction',
				value: 'signTransaction',
				description: 'Sign a transaction without broadcasting',
				action: 'Sign a transaction',
			},
			{
				name: 'Get Transaction',
				value: 'getTransaction',
				description: 'Get transaction details by hash',
				action: 'Get a transaction',
			},
			{
				name: 'Get Transaction Receipt',
				value: 'getTransactionReceipt',
				description: 'Get transaction receipt by hash',
				action: 'Get a transaction receipt',
			},
			{
				name: 'Get Transaction Status',
				value: 'getTransactionStatus',
				description: 'Check if a transaction is confirmed',
				action: 'Get transaction status',
			},
			{
				name: 'Wait for Transaction',
				value: 'waitForTransaction',
				description: 'Wait for a transaction to be confirmed',
				action: 'Wait for a transaction',
			},
			{
				name: 'Get Pending Transactions',
				value: 'getPendingTransactions',
				description: 'Get pending transactions from mempool',
				action: 'Get pending transactions',
			},
			{
				name: 'Cancel Transaction',
				value: 'cancelTransaction',
				description: 'Cancel a pending transaction by sending a 0-value tx with same nonce',
				action: 'Cancel a transaction',
			},
			{
				name: 'Speed Up Transaction',
				value: 'speedUpTransaction',
				description: 'Speed up a pending transaction by increasing gas price',
				action: 'Speed up a transaction',
			},
			{
				name: 'Estimate Gas',
				value: 'estimateGas',
				description: 'Estimate gas for a transaction',
				action: 'Estimate gas',
			},
			{
				name: 'Get Gas Price',
				value: 'getGasPrice',
				description: 'Get current gas price',
				action: 'Get gas price',
			},
			{
				name: 'Get Max Priority Fee',
				value: 'getMaxPriorityFee',
				description: 'Get max priority fee per gas',
				action: 'Get max priority fee',
			},
			{
				name: 'Decode Transaction',
				value: 'decodeTransaction',
				description: 'Decode transaction input data',
				action: 'Decode a transaction',
			},
			{
				name: 'Get Transaction Trace',
				value: 'getTransactionTrace',
				description: 'Get execution trace for a transaction',
				action: 'Get transaction trace',
			},
		],
		default: 'sendMonad',
	},
];

export const transactionFields: INodeProperties[] = [
	// Send MONAD fields
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['sendMonad', 'sendTransaction', 'signTransaction', 'estimateGas'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Recipient address',
	},
	{
		displayName: 'Amount (MONAD)',
		name: 'amount',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['sendMonad'],
			},
		},
		default: '0',
		description: 'Amount of MONAD to send',
	},
	// Transaction hash field
	{
		displayName: 'Transaction Hash',
		name: 'transactionHash',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: [
					'getTransaction',
					'getTransactionReceipt',
					'getTransactionStatus',
					'waitForTransaction',
					'cancelTransaction',
					'speedUpTransaction',
					'decodeTransaction',
					'getTransactionTrace',
				],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Transaction hash',
	},
	// Raw transaction data
	{
		displayName: 'Data',
		name: 'data',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['sendTransaction', 'signTransaction', 'estimateGas'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Transaction data (hex encoded)',
	},
	{
		displayName: 'Value (MONAD)',
		name: 'value',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['sendTransaction', 'signTransaction', 'estimateGas'],
			},
		},
		default: '0',
		description: 'Value to send with transaction',
	},
	// Gas options
	{
		displayName: 'Gas Options',
		name: 'gasOptions',
		type: 'collection',
		placeholder: 'Add Gas Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['sendMonad', 'sendTransaction', 'signTransaction', 'speedUpTransaction'],
			},
		},
		options: [
			{
				displayName: 'Gas Limit',
				name: 'gasLimit',
				type: 'number',
				default: 21000,
				description: 'Gas limit for the transaction',
			},
			{
				displayName: 'Max Fee Per Gas (Gwei)',
				name: 'maxFeePerGas',
				type: 'string',
				default: '',
				description: 'Maximum fee per gas (EIP-1559)',
			},
			{
				displayName: 'Max Priority Fee Per Gas (Gwei)',
				name: 'maxPriorityFeePerGas',
				type: 'string',
				default: '',
				description: 'Maximum priority fee per gas (EIP-1559)',
			},
			{
				displayName: 'Gas Price (Gwei)',
				name: 'gasPrice',
				type: 'string',
				default: '',
				description: 'Gas price (legacy transactions)',
			},
			{
				displayName: 'Nonce',
				name: 'nonce',
				type: 'number',
				default: -1,
				description: 'Transaction nonce (-1 for auto)',
			},
		],
	},
	// Wait options
	{
		displayName: 'Wait Options',
		name: 'waitOptions',
		type: 'collection',
		placeholder: 'Add Wait Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['waitForTransaction', 'sendMonad', 'sendTransaction'],
			},
		},
		options: [
			{
				displayName: 'Confirmations',
				name: 'confirmations',
				type: 'number',
				default: 1,
				description: 'Number of confirmations to wait for',
			},
			{
				displayName: 'Timeout (ms)',
				name: 'timeout',
				type: 'number',
				default: 60000,
				description: 'Maximum time to wait in milliseconds',
			},
		],
	},
	// ABI for decoding
	{
		displayName: 'ABI',
		name: 'abi',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['decodeTransaction'],
			},
		},
		default: '[]',
		description: 'Contract ABI for decoding (optional)',
	},
	// Address filter for pending transactions
	{
		displayName: 'Filter Address',
		name: 'filterAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['getPendingTransactions'],
			},
		},
		default: '',
		placeholder: '0x... (optional)',
		description: 'Filter pending transactions by address',
	},
];

export async function executeTransactionOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('monadNetwork');
	const client = getMonadClient(credentials);

	let result: any;

	switch (operation) {
		case 'sendMonad': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const gasOptions = this.getNodeParameter('gasOptions', index, {}) as any;
			const waitOptions = this.getNodeParameter('waitOptions', index, {}) as any;

			if (!isValidAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid to address: ${toAddress}`);
			}

			const tx = await client.sendNativeToken(
				normalizeAddress(toAddress),
				amount,
				gasOptions,
			);

			let receipt = null;
			if (waitOptions.confirmations) {
				receipt = await client.waitForTransaction(
					tx.hash,
					waitOptions.confirmations,
					waitOptions.timeout,
				);
			}

			result = {
				transactionHash: tx.hash,
				from: tx.from,
				to: tx.to,
				value: amount,
				gasLimit: tx.gasLimit?.toString(),
				...tx,
				receipt,
			};
			break;
		}

		case 'sendTransaction': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const data = this.getNodeParameter('data', index, '') as string;
			const value = this.getNodeParameter('value', index, '0') as string;
			const gasOptions = this.getNodeParameter('gasOptions', index, {}) as any;
			const waitOptions = this.getNodeParameter('waitOptions', index, {}) as any;

			if (!isValidAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid to address: ${toAddress}`);
			}

			const txData: any = {
				to: normalizeAddress(toAddress),
				data: data || '0x',
				value: client.parseEther(value),
			};

			if (gasOptions.gasLimit) txData.gasLimit = gasOptions.gasLimit;
			if (gasOptions.maxFeePerGas) txData.maxFeePerGas = client.parseGwei(gasOptions.maxFeePerGas);
			if (gasOptions.maxPriorityFeePerGas) txData.maxPriorityFeePerGas = client.parseGwei(gasOptions.maxPriorityFeePerGas);
			if (gasOptions.gasPrice) txData.gasPrice = client.parseGwei(gasOptions.gasPrice);
			if (gasOptions.nonce >= 0) txData.nonce = gasOptions.nonce;

			const tx = await client.sendSignedTransaction(txData);

			let receipt = null;
			if (waitOptions.confirmations) {
				receipt = await client.waitForTransaction(
					tx.hash,
					waitOptions.confirmations,
					waitOptions.timeout,
				);
			}

			result = {
				transactionHash: tx.hash,
				...tx,
				receipt,
			};
			break;
		}

		case 'signTransaction': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const data = this.getNodeParameter('data', index, '') as string;
			const value = this.getNodeParameter('value', index, '0') as string;
			const gasOptions = this.getNodeParameter('gasOptions', index, {}) as any;

			if (!isValidAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid to address: ${toAddress}`);
			}

			const txData: any = {
				to: normalizeAddress(toAddress),
				data: data || '0x',
				value: client.parseEther(value),
			};

			if (gasOptions.gasLimit) txData.gasLimit = gasOptions.gasLimit;
			if (gasOptions.maxFeePerGas) txData.maxFeePerGas = client.parseGwei(gasOptions.maxFeePerGas);
			if (gasOptions.maxPriorityFeePerGas) txData.maxPriorityFeePerGas = client.parseGwei(gasOptions.maxPriorityFeePerGas);
			if (gasOptions.nonce >= 0) txData.nonce = gasOptions.nonce;

			const signedTx = await client.signTransaction(txData);

			result = {
				signedTransaction: signedTx,
				transaction: txData,
			};
			break;
		}

		case 'getTransaction': {
			const transactionHash = this.getNodeParameter('transactionHash', index) as string;
			const tx = await client.getTransaction(transactionHash);

			if (!tx) {
				throw new NodeOperationError(this.getNode(), `Transaction not found: ${transactionHash}`);
			}

			result = client.formatTransaction(tx);
			break;
		}

		case 'getTransactionReceipt': {
			const transactionHash = this.getNodeParameter('transactionHash', index) as string;
			const receipt = await client.getTransactionReceipt(transactionHash);

			if (!receipt) {
				throw new NodeOperationError(this.getNode(), `Receipt not found: ${transactionHash}`);
			}

			result = client.formatReceipt(receipt);
			break;
		}

		case 'getTransactionStatus': {
			const transactionHash = this.getNodeParameter('transactionHash', index) as string;
			const receipt = await client.getTransactionReceipt(transactionHash);

			if (!receipt) {
				result = {
					transactionHash,
					status: 'pending',
					confirmed: false,
				};
			} else {
				const currentBlock = await client.getBlockNumber();
				const confirmations = currentBlock - receipt.blockNumber;

				result = {
					transactionHash,
					status: receipt.status === 1 ? 'success' : 'failed',
					confirmed: true,
					blockNumber: receipt.blockNumber,
					confirmations,
					gasUsed: receipt.gasUsed.toString(),
				};
			}
			break;
		}

		case 'waitForTransaction': {
			const transactionHash = this.getNodeParameter('transactionHash', index) as string;
			const waitOptions = this.getNodeParameter('waitOptions', index, {}) as any;

			const receipt = await client.waitForTransaction(
				transactionHash,
				waitOptions.confirmations || 1,
				waitOptions.timeout || 60000,
			);

			result = client.formatReceipt(receipt);
			break;
		}

		case 'getPendingTransactions': {
			const filterAddress = this.getNodeParameter('filterAddress', index, '') as string;
			const mempoolClient = getMempoolClient(credentials);

			let pendingTxs;
			if (filterAddress && isValidAddress(filterAddress)) {
				pendingTxs = await mempoolClient.getPendingTransactionsByAddress(
					normalizeAddress(filterAddress),
				);
			} else {
				pendingTxs = await mempoolClient.getPendingTransactions();
			}

			result = {
				pendingTransactions: pendingTxs,
				count: pendingTxs.length,
			};
			break;
		}

		case 'cancelTransaction': {
			const transactionHash = this.getNodeParameter('transactionHash', index) as string;
			const gasOptions = this.getNodeParameter('gasOptions', index, {}) as any;

			// Get the original transaction to find the nonce
			const originalTx = await client.getTransaction(transactionHash);
			if (!originalTx) {
				throw new NodeOperationError(this.getNode(), `Transaction not found: ${transactionHash}`);
			}

			// Send a 0-value transaction to self with same nonce but higher gas
			const signer = await client.getSigner();
			const address = await signer.getAddress();

			const cancelTx: any = {
				to: address,
				value: 0n,
				nonce: originalTx.nonce,
				data: '0x',
			};

			// Increase gas price by 10% minimum
			const originalGasPrice = originalTx.gasPrice || originalTx.maxFeePerGas;
			if (originalGasPrice) {
				const increasedGasPrice = (BigInt(originalGasPrice.toString()) * 110n) / 100n;
				cancelTx.gasPrice = gasOptions.gasPrice
					? client.parseGwei(gasOptions.gasPrice)
					: increasedGasPrice;
			}

			const tx = await client.sendSignedTransaction(cancelTx);

			result = {
				cancelTransactionHash: tx.hash,
				originalTransactionHash: transactionHash,
				nonce: originalTx.nonce,
			};
			break;
		}

		case 'speedUpTransaction': {
			const transactionHash = this.getNodeParameter('transactionHash', index) as string;
			const gasOptions = this.getNodeParameter('gasOptions', index, {}) as any;

			const originalTx = await client.getTransaction(transactionHash);
			if (!originalTx) {
				throw new NodeOperationError(this.getNode(), `Transaction not found: ${transactionHash}`);
			}

			// Resend with same data but higher gas
			const speedUpTx: any = {
				to: originalTx.to,
				value: originalTx.value,
				nonce: originalTx.nonce,
				data: originalTx.data,
			};

			// Increase gas price by 10% minimum
			const originalGasPrice = originalTx.gasPrice || originalTx.maxFeePerGas;
			if (originalGasPrice) {
				const increasedGasPrice = (BigInt(originalGasPrice.toString()) * 110n) / 100n;
				speedUpTx.gasPrice = gasOptions.gasPrice
					? client.parseGwei(gasOptions.gasPrice)
					: increasedGasPrice;
			}

			const tx = await client.sendSignedTransaction(speedUpTx);

			result = {
				speedUpTransactionHash: tx.hash,
				originalTransactionHash: transactionHash,
				nonce: originalTx.nonce,
			};
			break;
		}

		case 'estimateGas': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const data = this.getNodeParameter('data', index, '') as string;
			const value = this.getNodeParameter('value', index, '0') as string;

			if (!isValidAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid to address: ${toAddress}`);
			}

			const tx = {
				to: normalizeAddress(toAddress),
				data: data || '0x',
				value: client.parseEther(value),
			};

			result = await getComprehensiveGasEstimate(client, tx);
			break;
		}

		case 'getGasPrice': {
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
			};
			break;
		}

		case 'getMaxPriorityFee': {
			const feeData = await client.getFeeData();

			result = {
				maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
				maxPriorityFeePerGasGwei: feeData.maxPriorityFeePerGas
					? client.formatGwei(feeData.maxPriorityFeePerGas)
					: null,
			};
			break;
		}

		case 'decodeTransaction': {
			const transactionHash = this.getNodeParameter('transactionHash', index) as string;
			const abiJson = this.getNodeParameter('abi', index, '[]') as string;

			const tx = await client.getTransaction(transactionHash);
			if (!tx) {
				throw new NodeOperationError(this.getNode(), `Transaction not found: ${transactionHash}`);
			}

			let decoded = null;
			if (tx.data && tx.data !== '0x') {
				const abi = JSON.parse(abiJson);
				if (abi.length > 0) {
					decoded = decodeTransactionData(tx.data, abi);
				} else {
					// Try to decode without ABI (just function selector)
					decoded = {
						functionSelector: tx.data.slice(0, 10),
						rawData: tx.data,
					};
				}
			}

			result = {
				transactionHash,
				to: tx.to,
				from: tx.from,
				value: tx.value?.toString(),
				data: tx.data,
				decoded,
			};
			break;
		}

		case 'getTransactionTrace': {
			const transactionHash = this.getNodeParameter('transactionHash', index) as string;

			// Call debug_traceTransaction
			const trace = await client.rawRpcCall('debug_traceTransaction', [
				transactionHash,
				{ tracer: 'callTracer' },
			]);

			const parsedTrace = parseCallTrace(trace);
			const formattedTrace = formatCallTrace(parsedTrace);

			result = {
				transactionHash,
				trace: parsedTrace,
				formatted: formattedTrace,
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result }];
}
export { transactionOperations as operations, transactionFields as fields, executeTransactionOperation as execute };
