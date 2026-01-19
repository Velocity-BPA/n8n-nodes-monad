/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';

/**
 * Transaction Tracing and Debugging Utilities
 * 
 * These utilities help analyze transaction execution for debugging
 * and understanding state changes.
 */

export interface CallTrace {
  type: 'CALL' | 'STATICCALL' | 'DELEGATECALL' | 'CREATE' | 'CREATE2' | 'SELFDESTRUCT';
  from: string;
  to: string;
  value: string;
  gas: string;
  gasUsed: string;
  input: string;
  output: string;
  error?: string;
  calls?: CallTrace[];
}

export interface StorageChange {
  address: string;
  slot: string;
  previousValue: string;
  newValue: string;
}

export interface StateDiff {
  address: string;
  balanceDiff?: {
    before: string;
    after: string;
  };
  nonceDiff?: {
    before: number;
    after: number;
  };
  codeDiff?: {
    before: string;
    after: string;
  };
  storageDiff: StorageChange[];
}

export interface ExecutionTrace {
  txHash: string;
  blockNumber: number;
  success: boolean;
  gasUsed: string;
  returnValue: string;
  error?: string;
  callTrace: CallTrace;
  stateDiff: StateDiff[];
  logs: LogEntry[];
}

export interface LogEntry {
  address: string;
  topics: string[];
  data: string;
  logIndex: number;
  decoded?: {
    name: string;
    args: Record<string, unknown>;
  };
}

/**
 * Parses a raw trace response into structured format
 */
export function parseCallTrace(rawTrace: Record<string, unknown>): CallTrace {
  return {
    type: (rawTrace.type as string || 'CALL') as CallTrace['type'],
    from: rawTrace.from as string || '',
    to: rawTrace.to as string || '',
    value: rawTrace.value as string || '0x0',
    gas: rawTrace.gas as string || '0x0',
    gasUsed: rawTrace.gasUsed as string || '0x0',
    input: rawTrace.input as string || '0x',
    output: rawTrace.output as string || '0x',
    error: rawTrace.error as string | undefined,
    calls: Array.isArray(rawTrace.calls) 
      ? rawTrace.calls.map((c: Record<string, unknown>) => parseCallTrace(c))
      : undefined,
  };
}

/**
 * Flattens a call trace tree into a list of calls
 */
export function flattenCallTrace(trace: CallTrace): CallTrace[] {
  const result: CallTrace[] = [trace];
  
  if (trace.calls) {
    for (const child of trace.calls) {
      result.push(...flattenCallTrace(child));
    }
  }
  
  return result;
}

/**
 * Calculates total gas used across all calls in a trace
 */
export function calculateTotalGas(trace: CallTrace): bigint {
  let total = BigInt(trace.gasUsed || '0');
  
  if (trace.calls) {
    for (const child of trace.calls) {
      total += calculateTotalGas(child);
    }
  }
  
  return total;
}

/**
 * Extracts all unique addresses involved in a trace
 */
export function extractAddresses(trace: CallTrace): Set<string> {
  const addresses = new Set<string>();
  
  if (trace.from) addresses.add(trace.from.toLowerCase());
  if (trace.to) addresses.add(trace.to.toLowerCase());
  
  if (trace.calls) {
    for (const child of trace.calls) {
      const childAddresses = extractAddresses(child);
      childAddresses.forEach(addr => addresses.add(addr));
    }
  }
  
  return addresses;
}

/**
 * Formats a call trace for display
 */
export function formatCallTrace(trace: CallTrace, indent: number = 0): string {
  const prefix = '  '.repeat(indent);
  const valueEth = ethers.formatEther(BigInt(trace.value || '0'));
  
  let result = `${prefix}${trace.type} ${trace.from.slice(0, 10)}... -> ${trace.to.slice(0, 10)}...`;
  
  if (valueEth !== '0.0') {
    result += ` (${valueEth} MONAD)`;
  }
  
  if (trace.error) {
    result += ` [ERROR: ${trace.error}]`;
  }
  
  result += '\n';
  
  if (trace.calls) {
    for (const child of trace.calls) {
      result += formatCallTrace(child, indent + 1);
    }
  }
  
  return result;
}

/**
 * Parses state diff from trace response
 */
export function parseStateDiff(rawDiff: Record<string, unknown>): StateDiff[] {
  const diffs: StateDiff[] = [];
  
  for (const [address, changes] of Object.entries(rawDiff)) {
    const changeObj = changes as Record<string, unknown>;
    const diff: StateDiff = {
      address,
      storageDiff: [],
    };
    
    if (changeObj.balance) {
      const bal = changeObj.balance as Record<string, string>;
      diff.balanceDiff = {
        before: bal.from || bal['*']?.from || '0',
        after: bal.to || bal['*']?.to || '0',
      };
    }
    
    if (changeObj.nonce) {
      const nonce = changeObj.nonce as Record<string, number>;
      diff.nonceDiff = {
        before: nonce.from || nonce['*']?.from || 0,
        after: nonce.to || nonce['*']?.to || 0,
      };
    }
    
    if (changeObj.storage) {
      const storage = changeObj.storage as Record<string, Record<string, string>>;
      for (const [slot, value] of Object.entries(storage)) {
        diff.storageDiff.push({
          address,
          slot,
          previousValue: value.from || value['*']?.from || '0x0',
          newValue: value.to || value['*']?.to || '0x0',
        });
      }
    }
    
    diffs.push(diff);
  }
  
  return diffs;
}

/**
 * Decodes function input data
 */
export function decodeFunctionInput(
  input: string,
  abi: ethers.InterfaceAbi
): { name: string; args: Record<string, unknown> } | null {
  try {
    const iface = new ethers.Interface(abi);
    const decoded = iface.parseTransaction({ data: input });
    
    if (!decoded) return null;
    
    const args: Record<string, unknown> = {};
    decoded.fragment.inputs.forEach((param, index) => {
      args[param.name || `arg${index}`] = decoded.args[index];
    });
    
    return {
      name: decoded.name,
      args,
    };
  } catch {
    return null;
  }
}

/**
 * Decodes event log
 */
export function decodeEventLog(
  log: { topics: string[]; data: string },
  abi: ethers.InterfaceAbi
): { name: string; args: Record<string, unknown> } | null {
  try {
    const iface = new ethers.Interface(abi);
    const decoded = iface.parseLog(log);
    
    if (!decoded) return null;
    
    const args: Record<string, unknown> = {};
    decoded.fragment.inputs.forEach((param, index) => {
      args[param.name || `arg${index}`] = decoded.args[index];
    });
    
    return {
      name: decoded.name,
      args,
    };
  } catch {
    return null;
  }
}

/**
 * Identifies the type of error from a trace
 */
export function identifyErrorType(error: string): {
  type: string;
  description: string;
  suggestion: string;
} {
  const errorLower = error.toLowerCase();
  
  if (errorLower.includes('revert')) {
    return {
      type: 'Revert',
      description: 'Transaction was reverted by the contract',
      suggestion: 'Check require/revert conditions in the contract',
    };
  }
  
  if (errorLower.includes('out of gas')) {
    return {
      type: 'OutOfGas',
      description: 'Transaction ran out of gas',
      suggestion: 'Increase gas limit for the transaction',
    };
  }
  
  if (errorLower.includes('invalid opcode')) {
    return {
      type: 'InvalidOpcode',
      description: 'Invalid EVM opcode encountered',
      suggestion: 'Check for assert failures or invalid memory access',
    };
  }
  
  if (errorLower.includes('stack')) {
    return {
      type: 'StackError',
      description: 'EVM stack error (overflow/underflow)',
      suggestion: 'Contract may be too complex, consider refactoring',
    };
  }
  
  return {
    type: 'Unknown',
    description: error,
    suggestion: 'Review the contract logic and transaction parameters',
  };
}
