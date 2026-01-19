/**
 * Utility Actions for Monad Blockchain
 * General purpose utilities for data conversion and validation
 * 
 * Copyright (c) 2025 Monad Foundation
 * Licensed under the Business Source License 1.1
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';

import { isValidAddress, normalizeAddress, toChecksumAddress } from '../../utils/addressUtils';
import { keccak256, encodeValue, decodeValue, hexToNumber, numberToHex, parseUnits, formatUnits } from '../../utils/encodingUtils';

export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['utility'],
			},
		},
		options: [
			{
				name: 'Convert Units',
				value: 'convertUnits',
				description: 'Convert between Wei, Gwei, and Ether units',
				action: 'Convert between blockchain units',
			},
			{
				name: 'Validate Address',
				value: 'validateAddress',
				description: 'Validate and checksum an Ethereum address',
				action: 'Validate an address',
			},
			{
				name: 'Hash Data',
				value: 'hashData',
				description: 'Compute keccak256 hash of data',
				action: 'Hash data with keccak256',
			},
			{
				name: 'Encode Data',
				value: 'encodeData',
				description: 'ABI encode data with specified types',
				action: 'ABI encode data',
			},
			{
				name: 'Decode Data',
				value: 'decodeData',
				description: 'ABI decode hex data with specified types',
				action: 'ABI decode data',
			},
			{
				name: 'Hex to Number',
				value: 'hexToNumber',
				description: 'Convert hex string to decimal number',
				action: 'Convert hex to number',
			},
			{
				name: 'Number to Hex',
				value: 'numberToHex',
				description: 'Convert decimal number to hex string',
				action: 'Convert number to hex',
			},
			{
				name: 'Hex to String',
				value: 'hexToString',
				description: 'Convert hex string to UTF-8 string',
				action: 'Convert hex to string',
			},
			{
				name: 'String to Hex',
				value: 'stringToHex',
				description: 'Convert UTF-8 string to hex',
				action: 'Convert string to hex',
			},
			{
				name: 'Compute Function Selector',
				value: 'functionSelector',
				description: 'Compute 4-byte function selector from signature',
				action: 'Compute function selector',
			},
			{
				name: 'Compute Event Topic',
				value: 'eventTopic',
				description: 'Compute event topic hash from signature',
				action: 'Compute event topic',
			},
			{
				name: 'Parse Transaction Input',
				value: 'parseTransactionInput',
				description: 'Parse and decode transaction input data',
				action: 'Parse transaction input',
			},
			{
				name: 'Format Number',
				value: 'formatNumber',
				description: 'Format a large number with decimals',
				action: 'Format number with decimals',
			},
		],
		default: 'convertUnits',
	},
];

export const fields: INodeProperties[] = [
	// Convert Units fields
	{
		displayName: 'Value',
		name: 'value',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['convertUnits'],
			},
		},
		default: '',
		placeholder: '1000000000000000000',
		description: 'The value to convert',
	},
	{
		displayName: 'From Unit',
		name: 'fromUnit',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['convertUnits'],
			},
		},
		options: [
			{ name: 'Wei', value: 'wei' },
			{ name: 'Kwei', value: 'kwei' },
			{ name: 'Mwei', value: 'mwei' },
			{ name: 'Gwei', value: 'gwei' },
			{ name: 'Szabo', value: 'szabo' },
			{ name: 'Finney', value: 'finney' },
			{ name: 'Ether', value: 'ether' },
		],
		default: 'wei',
		description: 'The source unit',
	},
	{
		displayName: 'To Unit',
		name: 'toUnit',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['convertUnits'],
			},
		},
		options: [
			{ name: 'Wei', value: 'wei' },
			{ name: 'Kwei', value: 'kwei' },
			{ name: 'Mwei', value: 'mwei' },
			{ name: 'Gwei', value: 'gwei' },
			{ name: 'Szabo', value: 'szabo' },
			{ name: 'Finney', value: 'finney' },
			{ name: 'Ether', value: 'ether' },
		],
		default: 'ether',
		description: 'The target unit',
	},
	// Validate Address fields
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateAddress'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The address to validate',
	},
	// Hash Data fields
	{
		displayName: 'Data',
		name: 'hashInput',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['hashData'],
			},
		},
		default: '',
		description: 'Data to hash (hex string or plain text)',
	},
	{
		displayName: 'Input Type',
		name: 'hashInputType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['hashData'],
			},
		},
		options: [
			{ name: 'Text', value: 'text' },
			{ name: 'Hex', value: 'hex' },
		],
		default: 'text',
		description: 'Input data type',
	},
	// Encode Data fields
	{
		displayName: 'Types',
		name: 'abiTypes',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['encodeData', 'decodeData'],
			},
		},
		default: '',
		placeholder: 'address,uint256,bool',
		description: 'Comma-separated list of ABI types',
	},
	{
		displayName: 'Values',
		name: 'abiValues',
		type: 'json',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['encodeData'],
			},
		},
		default: '[]',
		placeholder: '["0x...", "1000", true]',
		description: 'Array of values matching the types',
	},
	// Decode Data fields
	{
		displayName: 'Hex Data',
		name: 'hexData',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['decodeData', 'hexToNumber', 'hexToString', 'parseTransactionInput'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Hex string to decode',
	},
	// Number to Hex fields
	{
		displayName: 'Number',
		name: 'numberValue',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['numberToHex'],
			},
		},
		default: '',
		placeholder: '12345',
		description: 'Decimal number to convert',
	},
	// String to Hex fields
	{
		displayName: 'Text',
		name: 'textValue',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['stringToHex'],
			},
		},
		default: '',
		description: 'Text to convert to hex',
	},
	// Function Selector fields
	{
		displayName: 'Function Signature',
		name: 'functionSignature',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['functionSelector'],
			},
		},
		default: '',
		placeholder: 'transfer(address,uint256)',
		description: 'Function signature without spaces',
	},
	// Event Topic fields
	{
		displayName: 'Event Signature',
		name: 'eventSignature',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['eventTopic'],
			},
		},
		default: '',
		placeholder: 'Transfer(address,address,uint256)',
		description: 'Event signature without spaces',
	},
	// Parse Transaction Input fields
	{
		displayName: 'ABI',
		name: 'contractAbi',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['parseTransactionInput'],
			},
		},
		default: '[]',
		description: 'Contract ABI for decoding (optional)',
	},
	// Format Number fields
	{
		displayName: 'Raw Value',
		name: 'rawValue',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['formatNumber'],
			},
		},
		default: '',
		placeholder: '1000000000000000000',
		description: 'Raw token value (integer)',
	},
	{
		displayName: 'Decimals',
		name: 'decimals',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['formatNumber'],
			},
		},
		default: 18,
		description: 'Number of decimal places',
	},
	{
		displayName: 'Display Precision',
		name: 'precision',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['formatNumber'],
			},
		},
		default: 4,
		description: 'Number of decimal places to display',
	},
];

// Unit conversion factors (to wei)
const UNIT_FACTORS: Record<string, bigint> = {
	wei: 1n,
	kwei: 1000n,
	mwei: 1000000n,
	gwei: 1000000000n,
	szabo: 1000000000000n,
	finney: 1000000000000000n,
	ether: 1000000000000000000n,
};

function convertUnits(value: string, fromUnit: string, toUnit: string): string {
	const fromFactor = UNIT_FACTORS[fromUnit];
	const toFactor = UNIT_FACTORS[toUnit];

	if (!fromFactor || !toFactor) {
		throw new Error(`Invalid unit: ${fromUnit} or ${toUnit}`);
	}

	// Parse value, handling decimals
	let weiValue: bigint;
	if (value.includes('.')) {
		const [whole, decimal] = value.split('.');
		const paddedDecimal = decimal.padEnd(18, '0').slice(0, 18);
		const combined = whole + paddedDecimal;
		weiValue = BigInt(combined) * fromFactor / UNIT_FACTORS.ether;
	} else {
		weiValue = BigInt(value) * fromFactor;
	}

	// Convert to target unit
	if (toFactor === 1n) {
		return weiValue.toString();
	}

	const wholePart = weiValue / toFactor;
	const remainder = weiValue % toFactor;

	if (remainder === 0n) {
		return wholePart.toString();
	}

	// Handle decimal part
	const decimalStr = remainder.toString().padStart(String(toFactor).length - 1, '0');
	const trimmedDecimal = decimalStr.replace(/0+$/, '');
	
	return trimmedDecimal ? `${wholePart}.${trimmedDecimal}` : wholePart.toString();
}

function formatTokenAmount(rawValue: string, decimals: number, precision: number): string {
	const value = BigInt(rawValue);
	const divisor = 10n ** BigInt(decimals);
	const wholePart = value / divisor;
	const remainder = value % divisor;

	if (remainder === 0n || precision === 0) {
		return wholePart.toString();
	}

	let decimalStr = remainder.toString().padStart(decimals, '0');
	decimalStr = decimalStr.slice(0, precision);
	decimalStr = decimalStr.replace(/0+$/, '');

	return decimalStr ? `${wholePart}.${decimalStr}` : wholePart.toString();
}

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;

	let result: unknown;

	switch (operation) {
		case 'convertUnits': {
			const value = this.getNodeParameter('value', index) as string;
			const fromUnit = this.getNodeParameter('fromUnit', index) as string;
			const toUnit = this.getNodeParameter('toUnit', index) as string;

			const converted = convertUnits(value, fromUnit, toUnit);

			result = {
				original: value,
				fromUnit,
				toUnit,
				converted,
			};
			break;
		}

		case 'validateAddress': {
			const address = this.getNodeParameter('address', index) as string;
			const isValid = isValidAddress(address);

			result = {
				address,
				isValid,
				normalized: isValid ? normalizeAddress(address) : null,
				checksummed: isValid ? toChecksumAddress(address) : null,
			};
			break;
		}

		case 'hashData': {
			const input = this.getNodeParameter('hashInput', index) as string;
			const inputType = this.getNodeParameter('hashInputType', index) as string;

			const hash = inputType === 'hex' ? keccak256(input) : keccak256(toHex(input));

			result = {
				input,
				inputType,
				hash,
			};
			break;
		}

		case 'encodeData': {
			const typesStr = this.getNodeParameter('abiTypes', index) as string;
			const valuesJson = this.getNodeParameter('abiValues', index) as string;

			const types = typesStr.split(',').map(t => t.trim());
			let values: unknown[];
			try {
				values = JSON.parse(valuesJson);
			} catch {
				throw new NodeOperationError(this.getNode(), 'Invalid JSON in values');
			}

			const encoded = encodeAbiParameters(types, values);

			result = {
				types,
				values,
				encoded,
			};
			break;
		}

		case 'decodeData': {
			const typesStr = this.getNodeParameter('abiTypes', index) as string;
			const hexData = this.getNodeParameter('hexData', index) as string;

			const types = typesStr.split(',').map(t => t.trim());
			const decoded = decodeAbiParameters(types, hexData);

			result = {
				types,
				data: hexData,
				decoded,
			};
			break;
		}

		case 'hexToNumber': {
			const hexData = this.getNodeParameter('hexData', index) as string;
			const number = fromHex(hexData, 'bigint');

			result = {
				hex: hexData,
				number: number.toString(),
				numberInt: Number(number),
			};
			break;
		}

		case 'numberToHex': {
			const numberStr = this.getNodeParameter('numberValue', index) as string;
			const hex = toHex(BigInt(numberStr));

			result = {
				number: numberStr,
				hex,
			};
			break;
		}

		case 'hexToString': {
			const hexData = this.getNodeParameter('hexData', index) as string;
			const text = fromHex(hexData, 'string');

			result = {
				hex: hexData,
				text,
			};
			break;
		}

		case 'stringToHex': {
			const text = this.getNodeParameter('textValue', index) as string;
			const hex = toHex(text);

			result = {
				text,
				hex,
			};
			break;
		}

		case 'functionSelector': {
			const signature = this.getNodeParameter('functionSignature', index) as string;
			const hash = keccak256(toHex(signature));
			const selector = hash.slice(0, 10); // First 4 bytes (8 hex chars + 0x)

			result = {
				signature,
				fullHash: hash,
				selector,
			};
			break;
		}

		case 'eventTopic': {
			const signature = this.getNodeParameter('eventSignature', index) as string;
			const topic = keccak256(toHex(signature));

			result = {
				signature,
				topic,
			};
			break;
		}

		case 'parseTransactionInput': {
			const hexData = this.getNodeParameter('hexData', index) as string;
			const abiJson = this.getNodeParameter('contractAbi', index, '[]') as string;

			const selector = hexData.slice(0, 10);
			const params = hexData.slice(10);

			let abi: Array<{ type: string; name: string; inputs?: Array<{ type: string; name: string }> }> = [];
			try {
				abi = JSON.parse(abiJson);
			} catch {
				// Continue without ABI
			}

			// Try to find matching function in ABI
			let matchedFunction: { name: string; inputs: Array<{ type: string; name: string }> } | null = null;
			for (const item of abi) {
				if (item.type === 'function' && item.inputs) {
					const sig = `${item.name}(${item.inputs.map(i => i.type).join(',')})`;
					const itemSelector = keccak256(toHex(sig)).slice(0, 10);
					if (itemSelector === selector) {
						matchedFunction = { name: item.name, inputs: item.inputs };
						break;
					}
				}
			}

			result = {
				selector,
				params: params ? `0x${params}` : null,
				paramsLength: params.length / 64, // Number of 32-byte words
				matchedFunction: matchedFunction ? {
					name: matchedFunction.name,
					inputs: matchedFunction.inputs,
				} : null,
			};
			break;
		}

		case 'formatNumber': {
			const rawValue = this.getNodeParameter('rawValue', index) as string;
			const decimals = this.getNodeParameter('decimals', index) as number;
			const precision = this.getNodeParameter('precision', index, 4) as number;

			const formatted = formatTokenAmount(rawValue, decimals, precision);

			result = {
				raw: rawValue,
				decimals,
				precision,
				formatted,
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result as Record<string, unknown> }];
}
