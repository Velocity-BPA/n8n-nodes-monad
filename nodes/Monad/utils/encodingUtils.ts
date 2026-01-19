/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';

/**
 * ABI Encoding and Decoding Utilities
 */

/**
 * Encodes function call data
 */
export function encodeFunctionData(
  abi: ethers.InterfaceAbi,
  functionName: string,
  args: unknown[]
): string {
  const iface = new ethers.Interface(abi);
  return iface.encodeFunctionData(functionName, args);
}

/**
 * Decodes function call data
 */
export function decodeFunctionData(
  abi: ethers.InterfaceAbi,
  data: string
): { name: string; args: ethers.Result } | null {
  try {
    const iface = new ethers.Interface(abi);
    const decoded = iface.parseTransaction({ data });
    
    if (!decoded) return null;
    
    return {
      name: decoded.name,
      args: decoded.args,
    };
  } catch {
    return null;
  }
}

/**
 * Decodes function result data
 */
export function decodeFunctionResult(
  abi: ethers.InterfaceAbi,
  functionName: string,
  data: string
): ethers.Result {
  const iface = new ethers.Interface(abi);
  return iface.decodeFunctionResult(functionName, data);
}

/**
 * Encodes constructor arguments
 */
export function encodeConstructorArgs(
  abi: ethers.InterfaceAbi,
  args: unknown[]
): string {
  const iface = new ethers.Interface(abi);
  const constructor = iface.deploy;
  
  if (!constructor) {
    throw new Error('No constructor found in ABI');
  }
  
  return iface.encodeDeploy(args);
}

/**
 * Encodes event topic
 */
export function encodeEventTopic(
  abi: ethers.InterfaceAbi,
  eventName: string
): string {
  const iface = new ethers.Interface(abi);
  const event = iface.getEvent(eventName);
  
  if (!event) {
    throw new Error(`Event ${eventName} not found in ABI`);
  }
  
  return event.topicHash;
}

/**
 * Decodes event log
 */
export function decodeEventLog(
  abi: ethers.InterfaceAbi,
  topics: string[],
  data: string
): { name: string; args: ethers.Result } | null {
  try {
    const iface = new ethers.Interface(abi);
    const decoded = iface.parseLog({ topics, data });
    
    if (!decoded) return null;
    
    return {
      name: decoded.name,
      args: decoded.args,
    };
  } catch {
    return null;
  }
}

/**
 * Encodes packed data (non-standard ABI encoding)
 */
export function encodePacked(types: string[], values: unknown[]): string {
  return ethers.solidityPacked(types, values);
}

/**
 * Computes keccak256 hash
 */
export function keccak256(data: string | Uint8Array): string {
  return ethers.keccak256(data);
}

/**
 * Computes function selector (first 4 bytes of keccak256 of signature)
 */
export function getFunctionSelector(signature: string): string {
  return ethers.id(signature).slice(0, 10);
}

/**
 * Parses and validates ABI
 */
export function parseAbi(abiString: string): ethers.InterfaceAbi {
  try {
    // Try parsing as JSON array
    const parsed = JSON.parse(abiString);
    return parsed;
  } catch {
    // Try parsing as human-readable ABI
    return abiString.split('\n').filter(line => line.trim());
  }
}

/**
 * Validates ABI format
 */
export function isValidAbi(abi: unknown): boolean {
  try {
    if (typeof abi === 'string') {
      new ethers.Interface(parseAbi(abi));
    } else if (Array.isArray(abi)) {
      new ethers.Interface(abi);
    } else {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts function signatures from ABI
 */
export function extractFunctionSignatures(abi: ethers.InterfaceAbi): string[] {
  const iface = new ethers.Interface(abi);
  const signatures: string[] = [];
  
  iface.forEachFunction((func) => {
    signatures.push(func.format('full'));
  });
  
  return signatures;
}

/**
 * Extracts event signatures from ABI
 */
export function extractEventSignatures(abi: ethers.InterfaceAbi): string[] {
  const iface = new ethers.Interface(abi);
  const signatures: string[] = [];
  
  iface.forEachEvent((event) => {
    signatures.push(event.format('full'));
  });
  
  return signatures;
}

/**
 * Encodes value for a specific type
 */
export function encodeValue(type: string, value: unknown): string {
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  return abiCoder.encode([type], [value]);
}

/**
 * Decodes value for a specific type
 */
export function decodeValue(type: string, data: string): unknown {
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const [result] = abiCoder.decode([type], data);
  return result;
}

/**
 * Converts units (e.g., ether to wei)
 */
export function parseUnits(value: string, decimals: number | string = 18): bigint {
  return ethers.parseUnits(value, decimals);
}

/**
 * Formats units (e.g., wei to ether)
 */
export function formatUnits(value: bigint, decimals: number | string = 18): string {
  return ethers.formatUnits(value, decimals);
}

/**
 * Converts hex string to number
 */
export function hexToNumber(hex: string): number {
  return parseInt(hex, 16);
}

/**
 * Converts number to hex string
 */
export function numberToHex(num: number | bigint): string {
  return '0x' + num.toString(16);
}

/**
 * Converts value to hex string
 */
export function toHex(value: string | number | bigint | Uint8Array): string {
  if (typeof value === 'string') {
    // Check if already hex
    if (value.startsWith('0x')) {
      return value;
    }
    // Convert string to hex
    return '0x' + Buffer.from(value, 'utf8').toString('hex');
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return '0x' + value.toString(16);
  }
  if (value instanceof Uint8Array) {
    return '0x' + Buffer.from(value).toString('hex');
  }
  throw new Error('Unsupported value type');
}

/**
 * Converts hex to specified type
 */
export function fromHex(hex: string, type: 'string' | 'bigint' | 'number'): string | bigint | number {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  
  switch (type) {
    case 'string':
      return Buffer.from(cleanHex, 'hex').toString('utf8');
    case 'bigint':
      return BigInt('0x' + cleanHex);
    case 'number':
      return parseInt(cleanHex, 16);
    default:
      throw new Error(`Unsupported type: ${type}`);
  }
}

/**
 * Encodes ABI parameters
 */
export function encodeAbiParameters(types: string[], values: unknown[]): string {
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  return abiCoder.encode(types, values);
}

/**
 * Decodes ABI parameters
 */
export function decodeAbiParameters(types: string[], data: string): unknown[] {
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const result = abiCoder.decode(types, data);
  return Array.from(result);
}

/**
 * Pads hex string to specified byte length
 */
export function padHex(hex: string, bytes: number): string {
  return ethers.zeroPadValue(hex, bytes);
}

/**
 * Converts bytes32 to string
 */
export function bytes32ToString(bytes32: string): string {
  return ethers.decodeBytes32String(bytes32);
}

/**
 * Converts string to bytes32
 */
export function stringToBytes32(str: string): string {
  return ethers.encodeBytes32String(str);
}
