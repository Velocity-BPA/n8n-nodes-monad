/**
 * n8n-nodes-monad
 * Copyright (c) 2025
 * Licensed under BSL 1.1
 * See LICENSE file for details
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';

export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['debugging'],
			},
		},
		options: [
			{
				name: 'Trace Transaction',
				value: 'traceTransaction',
				description: 'Get detailed execution trace of a transaction',
				action: 'Trace transaction',
			},
			{
				name: 'Trace Block',
				value: 'traceBlock',
				description: 'Get execution traces for all transactions in a block',
				action: 'Trace block',
			},
			{
				name: 'Trace Call',
				value: 'traceCall',
				description: 'Trace a call without executing it',
				action: 'Trace call',
			},
			{
				name: 'Debug Storage Range',
				value: 'debugStorageRange',
				description: 'Get contract storage range at specific point',
				action: 'Debug storage range',
			},
			{
				name: 'Get State Diff',
				value: 'getStateDiff',
				description: 'Get state differences from transaction',
				action: 'Get state diff',
			},
			{
				name: 'Get VM Trace',
				value: 'getVmTrace',
				description: 'Get detailed VM execution trace',
				action: 'Get VM trace',
			},
			{
				name: 'Replay Transaction',
				value: 'replayTransaction',
				description: 'Replay transaction execution',
				action: 'Replay transaction',
			},
			{
				name: 'Debug Call',
				value: 'debugCall',
				description: 'Debug a contract call',
				action: 'Debug call',
			},
		],
		default: 'traceTransaction',
	},
];

export const fields: INodeProperties[] = [
	// traceTransaction
	{
		displayName: 'Transaction Hash',
		name: 'txHash',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['debugging'],
				operation: ['traceTransaction', 'getStateDiff', 'getVmTrace', 'replayTransaction'],
			},
		},
		default: '',
		required: true,
		description: 'Transaction hash to trace',
	},

	// Trace options
	{
		displayName: 'Tracer Type',
		name: 'tracerType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['debugging'],
				operation: ['traceTransaction', 'traceCall'],
			},
		},
		options: [
			{ name: 'Call Tracer', value: 'callTracer' },
			{ name: 'Prestate Tracer', value: 'prestateTracer' },
			{ name: 'Four Byte Tracer', value: '4byteTracer' },
			{ name: 'No Op Tracer', value: 'noopTracer' },
			{ name: 'Opcode Logger', value: 'opcodeLogger' },
		],
		default: 'callTracer',
		description: 'Type of tracer to use',
	},
	{
		displayName: 'Only Top Call',
		name: 'onlyTopCall',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['debugging'],
				operation: ['traceTransaction', 'traceCall'],
				tracerType: ['callTracer'],
			},
		},
		default: false,
		description: 'Whether to only trace the top-level call',
	},

	// traceBlock
	{
		displayName: 'Block Number',
		name: 'blockNumber',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['debugging'],
				operation: ['traceBlock'],
			},
		},
		default: 0,
		required: true,
		description: 'Block number to trace',
	},
	{
		displayName: 'Block Tracer Type',
		name: 'blockTracerType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['debugging'],
				operation: ['traceBlock'],
			},
		},
		options: [
			{ name: 'Call Tracer', value: 'callTracer' },
			{ name: 'Prestate Tracer', value: 'prestateTracer' },
		],
		default: 'callTracer',
		description: 'Type of tracer for block tracing',
	},

	// traceCall
	{
		displayName: 'From Address',
		name: 'from',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['debugging'],
				operation: ['traceCall', 'debugCall'],
			},
		},
		default: '',
		description: 'Address making the call',
	},
	{
		displayName: 'To Address',
		name: 'to',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['debugging'],
				operation: ['traceCall', 'debugCall'],
			},
		},
		default: '',
		required: true,
		description: 'Contract address to call',
	},
	{
		displayName: 'Call Data',
		name: 'data',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['debugging'],
				operation: ['traceCall', 'debugCall'],
			},
		},
		default: '',
		description: 'Encoded function call data',
	},
	{
		displayName: 'Value (Wei)',
		name: 'value',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['debugging'],
				operation: ['traceCall', 'debugCall'],
			},
		},
		default: '0',
		description: 'Value to send with the call',
	},
	{
		displayName: 'Gas Limit',
		name: 'gas',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['debugging'],
				operation: ['traceCall', 'debugCall'],
			},
		},
		default: 1000000,
		description: 'Gas limit for the call',
	},
	{
		displayName: 'Block Tag',
		name: 'blockTag',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['debugging'],
				operation: ['traceCall', 'debugCall'],
			},
		},
		default: 'latest',
		description: 'Block number or tag (latest, pending)',
	},

	// debugStorageRange
	{
		displayName: 'Block Hash',
		name: 'blockHash',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['debugging'],
				operation: ['debugStorageRange'],
			},
		},
		default: '',
		required: true,
		description: 'Block hash to query storage at',
	},
	{
		displayName: 'Transaction Index',
		name: 'txIndex',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['debugging'],
				operation: ['debugStorageRange'],
			},
		},
		default: 0,
		description: 'Transaction index in the block',
	},
	{
		displayName: 'Contract Address',
		name: 'contractAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['debugging'],
				operation: ['debugStorageRange'],
			},
		},
		default: '',
		required: true,
		description: 'Contract address to get storage for',
	},
	{
		displayName: 'Start Key',
		name: 'startKey',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['debugging'],
				operation: ['debugStorageRange'],
			},
		},
		default: '0x0000000000000000000000000000000000000000000000000000000000000000',
		description: 'Starting key for storage range',
	},
	{
		displayName: 'Max Results',
		name: 'maxResults',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['debugging'],
				operation: ['debugStorageRange'],
			},
		},
		default: 100,
		description: 'Maximum number of storage slots to return',
	},

	// replayTransaction options
	{
		displayName: 'Include Memory',
		name: 'includeMemory',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['debugging'],
				operation: ['replayTransaction', 'getVmTrace'],
			},
		},
		default: false,
		description: 'Whether to include memory data in trace',
	},
	{
		displayName: 'Include Stack',
		name: 'includeStack',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['debugging'],
				operation: ['replayTransaction', 'getVmTrace'],
			},
		},
		default: true,
		description: 'Whether to include stack data in trace',
	},
	{
		displayName: 'Include Storage',
		name: 'includeStorage',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['debugging'],
				operation: ['replayTransaction', 'getVmTrace'],
			},
		},
		default: true,
		description: 'Whether to include storage changes in trace',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	credentials: { rpcUrl: string; apiKey?: string },
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const results: INodeExecutionData[] = [];

	const rpcCall = async (method: string, params: unknown[] = []) => {
		const response = await this.helpers.httpRequest({
			method: 'POST',
			url: credentials.rpcUrl,
			headers: {
				'Content-Type': 'application/json',
				...(credentials.apiKey && { 'X-API-Key': credentials.apiKey }),
			},
			body: {
				jsonrpc: '2.0',
				id: Date.now(),
				method,
				params,
			},
		});
		if (response.error) {
			throw new NodeOperationError(this.getNode(), `RPC Error: ${response.error.message}`);
		}
		return response.result;
	};

	switch (operation) {
		case 'traceTransaction': {
			const txHash = this.getNodeParameter('txHash', index) as string;
			const tracerType = this.getNodeParameter('tracerType', index) as string;
			const onlyTopCall = this.getNodeParameter('onlyTopCall', index, false) as boolean;

			const tracerConfig: Record<string, unknown> = {
				tracer: tracerType,
			};

			if (tracerType === 'callTracer') {
				tracerConfig.tracerConfig = { onlyTopCall };
			}

			const trace = await rpcCall('debug_traceTransaction', [txHash, tracerConfig]);

			// Process callTracer results
			if (tracerType === 'callTracer' && trace) {
				const processCall = (call: Record<string, unknown>, depth: number = 0): Record<string, unknown> => {
					const processed: Record<string, unknown> = {
						type: call.type,
						from: call.from,
						to: call.to,
						value: call.value,
						gas: call.gas ? parseInt(call.gas as string, 16) : 0,
						gasUsed: call.gasUsed ? parseInt(call.gasUsed as string, 16) : 0,
						input: call.input,
						output: call.output,
						error: call.error,
						depth,
					};

					if (call.calls && Array.isArray(call.calls)) {
						processed.calls = (call.calls as Array<Record<string, unknown>>).map((c) =>
							processCall(c, depth + 1),
						);
						processed.callCount = (call.calls as unknown[]).length;
					}

					return processed;
				};

				results.push({
					json: {
						success: true,
						txHash,
						tracerType,
						trace: processCall(trace),
					},
				});
			} else {
				results.push({
					json: {
						success: true,
						txHash,
						tracerType,
						trace,
					},
				});
			}
			break;
		}

		case 'traceBlock': {
			const blockNumber = this.getNodeParameter('blockNumber', index) as number;
			const blockTracerType = this.getNodeParameter('blockTracerType', index) as string;

			const blockHex = `0x${blockNumber.toString(16)}`;

			const traces = await rpcCall('debug_traceBlockByNumber', [
				blockHex,
				{ tracer: blockTracerType },
			]);

			results.push({
				json: {
					success: true,
					blockNumber,
					tracerType: blockTracerType,
					transactionCount: Array.isArray(traces) ? traces.length : 0,
					traces,
				},
			});
			break;
		}

		case 'traceCall': {
			const from = this.getNodeParameter('from', index, '') as string;
			const to = this.getNodeParameter('to', index) as string;
			const data = this.getNodeParameter('data', index, '') as string;
			const value = this.getNodeParameter('value', index, '0') as string;
			const gas = this.getNodeParameter('gas', index) as number;
			const blockTag = this.getNodeParameter('blockTag', index) as string;
			const tracerType = this.getNodeParameter('tracerType', index) as string;
			const onlyTopCall = this.getNodeParameter('onlyTopCall', index, false) as boolean;

			const callObject: Record<string, unknown> = {
				to,
				gas: `0x${gas.toString(16)}`,
			};

			if (from) callObject.from = from;
			if (data) callObject.data = data;
			if (value && value !== '0') callObject.value = `0x${BigInt(value).toString(16)}`;

			const tracerConfig: Record<string, unknown> = {
				tracer: tracerType,
			};

			if (tracerType === 'callTracer') {
				tracerConfig.tracerConfig = { onlyTopCall };
			}

			const blockParam = blockTag.startsWith('0x') ? blockTag : 
				blockTag === 'latest' || blockTag === 'pending' ? blockTag :
				`0x${parseInt(blockTag).toString(16)}`;

			const trace = await rpcCall('debug_traceCall', [callObject, blockParam, tracerConfig]);

			results.push({
				json: {
					success: true,
					callObject,
					blockTag: blockParam,
					tracerType,
					trace,
				},
			});
			break;
		}

		case 'debugStorageRange': {
			const blockHash = this.getNodeParameter('blockHash', index) as string;
			const txIndex = this.getNodeParameter('txIndex', index) as number;
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const startKey = this.getNodeParameter('startKey', index) as string;
			const maxResults = this.getNodeParameter('maxResults', index) as number;

			const storage = await rpcCall('debug_storageRangeAt', [
				blockHash,
				txIndex,
				contractAddress,
				startKey,
				maxResults,
			]);

			// Process storage results
			const storageSlots: Array<Record<string, unknown>> = [];
			if (storage?.storage) {
				for (const [hash, data] of Object.entries(storage.storage)) {
					const storageData = data as { key: string; value: string };
					storageSlots.push({
						hash,
						key: storageData.key,
						value: storageData.value,
					});
				}
			}

			results.push({
				json: {
					success: true,
					blockHash,
					txIndex,
					contractAddress,
					storage: storageSlots,
					nextKey: storage?.nextKey || null,
					hasMore: !!storage?.nextKey,
				},
			});
			break;
		}

		case 'getStateDiff': {
			const txHash = this.getNodeParameter('txHash', index) as string;

			const trace = await rpcCall('debug_traceTransaction', [
				txHash,
				{ tracer: 'prestateTracer', tracerConfig: { diffMode: true } },
			]);

			// Process state diff
			const pre: Record<string, unknown> = trace?.pre || {};
			const post: Record<string, unknown> = trace?.post || {};

			const changes: Array<Record<string, unknown>> = [];
			const allAddresses = new Set([...Object.keys(pre), ...Object.keys(post)]);

			for (const address of allAddresses) {
				const preState = pre[address] as Record<string, unknown> | undefined;
				const postState = post[address] as Record<string, unknown> | undefined;

				changes.push({
					address,
					balanceChange: {
						pre: preState?.balance || '0x0',
						post: postState?.balance || '0x0',
					},
					nonceChange: {
						pre: preState?.nonce || 0,
						post: postState?.nonce || 0,
					},
					codeChange: preState?.code !== postState?.code,
					storageChanges: {
						pre: preState?.storage || {},
						post: postState?.storage || {},
					},
				});
			}

			results.push({
				json: {
					success: true,
					txHash,
					addressesAffected: allAddresses.size,
					changes,
				},
			});
			break;
		}

		case 'getVmTrace': {
			const txHash = this.getNodeParameter('txHash', index) as string;
			const includeMemory = this.getNodeParameter('includeMemory', index) as boolean;
			const includeStack = this.getNodeParameter('includeStack', index) as boolean;
			const includeStorage = this.getNodeParameter('includeStorage', index) as boolean;

			const trace = await rpcCall('debug_traceTransaction', [
				txHash,
				{
					disableMemory: !includeMemory,
					disableStack: !includeStack,
					disableStorage: !includeStorage,
				},
			]);

			// Summarize VM trace
			const summary = {
				gas: trace?.gas,
				returnValue: trace?.returnValue,
				structLogsCount: trace?.structLogs?.length || 0,
				failed: trace?.failed,
			};

			// Get opcode frequency
			const opcodeFrequency: Record<string, number> = {};
			if (trace?.structLogs) {
				for (const log of trace.structLogs) {
					const op = log.op as string;
					opcodeFrequency[op] = (opcodeFrequency[op] || 0) + 1;
				}
			}

			results.push({
				json: {
					success: true,
					txHash,
					summary,
					opcodeFrequency,
					structLogs: trace?.structLogs?.slice(0, 100), // Limit to first 100 for output
					truncated: (trace?.structLogs?.length || 0) > 100,
				},
			});
			break;
		}

		case 'replayTransaction': {
			const txHash = this.getNodeParameter('txHash', index) as string;
			const includeMemory = this.getNodeParameter('includeMemory', index) as boolean;
			const includeStack = this.getNodeParameter('includeStack', index) as boolean;
			const includeStorage = this.getNodeParameter('includeStorage', index) as boolean;

			// Get original transaction
			const tx = await rpcCall('eth_getTransactionByHash', [txHash]);
			if (!tx) {
				throw new NodeOperationError(this.getNode(), `Transaction not found: ${txHash}`);
			}

			// Trace the transaction
			const trace = await rpcCall('debug_traceTransaction', [
				txHash,
				{
					disableMemory: !includeMemory,
					disableStack: !includeStack,
					disableStorage: !includeStorage,
				},
			]);

			// Get receipt for additional info
			const receipt = await rpcCall('eth_getTransactionReceipt', [txHash]);

			results.push({
				json: {
					success: true,
					txHash,
					transaction: {
						from: tx.from,
						to: tx.to,
						value: tx.value,
						input: tx.input,
						gas: tx.gas ? parseInt(tx.gas, 16) : 0,
						gasPrice: tx.gasPrice,
						nonce: tx.nonce ? parseInt(tx.nonce, 16) : 0,
					},
					execution: {
						gasUsed: trace?.gas,
						returnValue: trace?.returnValue,
						failed: trace?.failed,
						revertReason: receipt?.status === '0x0' ? 'Transaction reverted' : null,
					},
					receipt: receipt ? {
						status: receipt.status === '0x1' ? 'success' : 'failed',
						gasUsed: parseInt(receipt.gasUsed, 16),
						logs: receipt.logs?.length || 0,
						blockNumber: parseInt(receipt.blockNumber, 16),
					} : null,
					traceStepsCount: trace?.structLogs?.length || 0,
				},
			});
			break;
		}

		case 'debugCall': {
			const from = this.getNodeParameter('from', index, '') as string;
			const to = this.getNodeParameter('to', index) as string;
			const data = this.getNodeParameter('data', index, '') as string;
			const value = this.getNodeParameter('value', index, '0') as string;
			const gas = this.getNodeParameter('gas', index) as number;
			const blockTag = this.getNodeParameter('blockTag', index) as string;

			const callObject: Record<string, unknown> = {
				to,
				gas: `0x${gas.toString(16)}`,
			};

			if (from) callObject.from = from;
			if (data) callObject.data = data;
			if (value && value !== '0') callObject.value = `0x${BigInt(value).toString(16)}`;

			const blockParam = blockTag.startsWith('0x') ? blockTag : 
				blockTag === 'latest' || blockTag === 'pending' ? blockTag :
				`0x${parseInt(blockTag).toString(16)}`;

			// Try eth_call first
			let callResult;
			let callError;
			try {
				callResult = await rpcCall('eth_call', [callObject, blockParam]);
			} catch (error) {
				callError = (error as Error).message;
			}

			// Get trace for more details
			let trace;
			try {
				trace = await rpcCall('debug_traceCall', [
					callObject,
					blockParam,
					{ tracer: 'callTracer' },
				]);
			} catch {
				// Trace might not be available
			}

			// Estimate gas
			let gasEstimate;
			try {
				gasEstimate = await rpcCall('eth_estimateGas', [callObject, blockParam]);
			} catch {
				// Estimate might fail
			}

			results.push({
				json: {
					success: !callError,
					callObject,
					blockTag: blockParam,
					result: callResult,
					error: callError,
					gasEstimate: gasEstimate ? parseInt(gasEstimate, 16) : null,
					trace: trace || null,
				},
			});
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return results;
}
