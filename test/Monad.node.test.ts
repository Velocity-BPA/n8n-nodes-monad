/**
 * Copyright (c) 2026 Velocity BPA
 * Licensed under the Business Source License 1.1
 */

import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { Monad } from '../nodes/Monad/Monad.node';

// Mock n8n-workflow
jest.mock('n8n-workflow', () => ({
  ...jest.requireActual('n8n-workflow'),
  NodeApiError: class NodeApiError extends Error {
    constructor(node: any, error: any) { super(error.message || 'API Error'); }
  },
  NodeOperationError: class NodeOperationError extends Error {
    constructor(node: any, message: string) { super(message); }
  },
}));

describe('Monad Node', () => {
  let node: Monad;

  beforeAll(() => {
    node = new Monad();
  });

  describe('Node Definition', () => {
    it('should have correct basic properties', () => {
      expect(node.description.displayName).toBe('Monad');
      expect(node.description.name).toBe('monad');
      expect(node.description.version).toBe(1);
      expect(node.description.inputs).toContain('main');
      expect(node.description.outputs).toContain('main');
    });

    it('should define 6 resources', () => {
      const resourceProp = node.description.properties.find(
        (p: any) => p.name === 'resource'
      );
      expect(resourceProp).toBeDefined();
      expect(resourceProp!.type).toBe('options');
      expect(resourceProp!.options).toHaveLength(6);
    });

    it('should have operation dropdowns for each resource', () => {
      const operations = node.description.properties.filter(
        (p: any) => p.name === 'operation'
      );
      expect(operations.length).toBe(6);
    });

    it('should require credentials', () => {
      expect(node.description.credentials).toBeDefined();
      expect(node.description.credentials!.length).toBeGreaterThan(0);
      expect(node.description.credentials![0].required).toBe(true);
    });

    it('should have parameters with proper displayOptions', () => {
      const params = node.description.properties.filter(
        (p: any) => p.displayOptions?.show?.resource
      );
      for (const param of params) {
        expect(param.displayOptions.show.resource).toBeDefined();
        expect(Array.isArray(param.displayOptions.show.resource)).toBe(true);
      }
    });
  });

  // Resource-specific tests
describe('Account Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({ 
        apiKey: 'test-key', 
        baseUrl: 'https://rpc.monad.xyz' 
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: { 
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn() 
      },
    };
  });

  describe('getBalance operation', () => {
    it('should successfully get account balance', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getBalance')
        .mockReturnValueOnce('0x742d35Cc4Bf9C44F73D5e7C6EC9e4a77d2b9b93E')
        .mockReturnValueOnce('latest');

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        result: '0x1bc16d674ec80000',
      });

      const result = await executeAccountOperations.call(
        mockExecuteFunctions,
        [{ json: {} }]
      );

      expect(result).toEqual([{
        json: '0x1bc16d674ec80000',
        pairedItem: { item: 0 },
      }]);
    });

    it('should handle getBalance errors', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getBalance')
        .mockReturnValueOnce('invalid-address')
        .mockReturnValueOnce('latest');

      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(
        new Error('Invalid address format')
      );
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);

      const result = await executeAccountOperations.call(
        mockExecuteFunctions,
        [{ json: {} }]
      );

      expect(result).toEqual([{
        json: { error: 'Invalid address format' },
        pairedItem: { item: 0 },
      }]);
    });
  });

  describe('getTransactionCount operation', () => {
    it('should successfully get transaction count', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getTransactionCount')
        .mockReturnValueOnce('0x742d35Cc4Bf9C44F73D5e7C6EC9e4a77d2b9b93E')
        .mockReturnValueOnce('latest');

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        result: '0x42',
      });

      const result = await executeAccountOperations.call(
        mockExecuteFunctions,
        [{ json: {} }]
      );

      expect(result).toEqual([{
        json: '0x42',
        pairedItem: { item: 0 },
      }]);
    });
  });

  describe('getCode operation', () => {
    it('should successfully get contract code', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getCode')
        .mockReturnValueOnce('0x742d35Cc4Bf9C44F73D5e7C6EC9e4a77d2b9b93E')
        .mockReturnValueOnce('latest');

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        result: '0x608060405234801561001057600080fd5b50',
      });

      const result = await executeAccountOperations.call(
        mockExecuteFunctions,
        [{ json: {} }]
      );

      expect(result).toEqual([{
        json: '0x608060405234801561001057600080fd5b50',
        pairedItem: { item: 0 },
      }]);
    });
  });

  describe('getStorageAt operation', () => {
    it('should successfully get storage value', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getStorageAt')
        .mockReturnValueOnce('0x742d35Cc4Bf9C44F73D5e7C6EC9e4a77d2b9b93E')
        .mockReturnValueOnce('latest')
        .mockReturnValueOnce('0x0');

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        result: '0x000000000000000000000000742d35cc4bf9c44f73d5e7c6ec9e4a77d2b9b93e',
      });

      const result = await executeAccountOperations.call(
        mockExecuteFunctions,
        [{ json: {} }]
      );

      expect(result).toEqual([{
        json: '0x000000000000000000000000742d35cc4bf9c44f73d5e7c6ec9e4a77d2b9b93e',
        pairedItem: { item: 0 },
      }]);
    });
  });
});

describe('Transaction Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({ apiKey: 'test-key', baseUrl: 'https://rpc.monad.xyz' }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: { httpRequest: jest.fn(), requestWithAuthentication: jest.fn() },
    };
  });

  describe('sendTransaction', () => {
    it('should send a transaction successfully', async () => {
      const mockTransaction = { from: '0x123', to: '0x456', value: '0x1', gas: '0x5208', gasPrice: '0x3b9aca00' };
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'sendTransaction';
        if (param === 'transaction') return mockTransaction;
      });
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({ result: '0xabc123' });

      const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);
      expect(result).toHaveLength(1);
      expect(result[0].json).toEqual({ result: '0xabc123' });
    });

    it('should handle sendTransaction error', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'sendTransaction';
        if (param === 'transaction') return {};
      });
      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Transaction failed'));
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);

      const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);
      expect(result[0].json.error).toBe('Transaction failed');
    });
  });

  describe('getTransaction', () => {
    it('should get transaction details successfully', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'getTransaction';
        if (param === 'hash') return '0xabc123';
      });
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({ result: { hash: '0xabc123', value: '0x1' } });

      const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);
      expect(result[0].json.result).toEqual({ hash: '0xabc123', value: '0x1' });
    });
  });

  describe('estimateGas', () => {
    it('should estimate gas successfully', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'estimateGas';
        if (param === 'transaction') return { to: '0x456', data: '0x' };
      });
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({ result: '0x5208' });

      const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);
      expect(result[0].json.result).toBe('0x5208');
    });
  });
});

describe('Block Resource', () => {
	let mockExecuteFunctions: any;

	beforeEach(() => {
		mockExecuteFunctions = {
			getNodeParameter: jest.fn(),
			getCredentials: jest.fn().mockResolvedValue({
				apiKey: 'test-key',
				baseUrl: 'https://rpc.monad.xyz'
			}),
			getInputData: jest.fn().mockReturnValue([{ json: {} }]),
			getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
			continueOnFail: jest.fn().mockReturnValue(false),
			helpers: {
				httpRequest: jest.fn(),
			},
		};
	});

	it('should get latest block number successfully', async () => {
		mockExecuteFunctions.getNodeParameter.mockReturnValue('getBlockNumber');
		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
			result: '0x1b4'
		});

		const result = await executeBlockOperations.call(mockExecuteFunctions, [{ json: {} }]);
		
		expect(result).toEqual([{ json: '0x1b4', pairedItem: { item: 0 } }]);
		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
			method: 'POST',
			url: 'https://rpc.monad.xyz',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer test-key'
			},
			body: JSON.stringify({
				jsonrpc: '2.0',
				method: 'eth_blockNumber',
				params: [],
				id: 1
			})
		});
	});

	it('should get block by number successfully', async () => {
		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('getBlockByNumber')
			.mockReturnValueOnce('latest')
			.mockReturnValueOnce(false);
		
		const blockData = { number: '0x1b4', hash: '0x...' };
		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
			result: blockData
		});

		const result = await executeBlockOperations.call(mockExecuteFunctions, [{ json: {} }]);
		
		expect(result).toEqual([{ json: blockData, pairedItem: { item: 0 } }]);
	});

	it('should handle RPC errors', async () => {
		mockExecuteFunctions.getNodeParameter.mockReturnValue('getBlockNumber');
		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
			error: { code: -32602, message: 'Invalid params' }
		});

		await expect(executeBlockOperations.call(mockExecuteFunctions, [{ json: {} }]))
			.rejects.toThrow('RPC Error: Invalid params (Code: -32602)');
	});

	it('should continue on fail when enabled', async () => {
		mockExecuteFunctions.getNodeParameter.mockReturnValue('getBlockNumber');
		mockExecuteFunctions.continueOnFail.mockReturnValue(true);
		mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Network error'));

		const result = await executeBlockOperations.call(mockExecuteFunctions, [{ json: {} }]);
		
		expect(result).toEqual([{ json: { error: 'Network error' }, pairedItem: { item: 0 } }]);
	});
});

describe('Network Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({ 
        apiKey: 'test-key', 
        baseUrl: 'https://rpc.monad.xyz' 
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: { 
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn() 
      },
    };
  });

  it('should get chain ID successfully', async () => {
    const mockResponse = { jsonrpc: '2.0', result: '0x1', id: 1 };
    mockExecuteFunctions.getNodeParameter.mockReturnValue('getChainId');
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeNetworkOperations.call(
      mockExecuteFunctions, 
      [{ json: {} }]
    );

    expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://rpc.monad.xyz',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-key'
      },
      json: true,
      body: {
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1
      }
    });
  });

  it('should get network ID successfully', async () => {
    const mockResponse = { jsonrpc: '2.0', result: '1', id: 1 };
    mockExecuteFunctions.getNodeParameter.mockReturnValue('getNetworkId');
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeNetworkOperations.call(
      mockExecuteFunctions, 
      [{ json: {} }]
    );

    expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
  });

  it('should get peer count successfully', async () => {
    const mockResponse = { jsonrpc: '2.0', result: '0xa', id: 1 };
    mockExecuteFunctions.getNodeParameter.mockReturnValue('getPeerCount');
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeNetworkOperations.call(
      mockExecuteFunctions, 
      [{ json: {} }]
    );

    expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
  });

  it('should check sync status successfully', async () => {
    const mockResponse = { jsonrpc: '2.0', result: false, id: 1 };
    mockExecuteFunctions.getNodeParameter.mockReturnValue('isSyncing');
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeNetworkOperations.call(
      mockExecuteFunctions, 
      [{ json: {} }]
    );

    expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
  });

  it('should get gas price successfully', async () => {
    const mockResponse = { jsonrpc: '2.0', result: '0x4a817c800', id: 1 };
    mockExecuteFunctions.getNodeParameter.mockReturnValue('getGasPrice');
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeNetworkOperations.call(
      mockExecuteFunctions, 
      [{ json: {} }]
    );

    expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
  });

  it('should get fee history successfully', async () => {
    const mockResponse = { 
      jsonrpc: '2.0', 
      result: {
        oldestBlock: '0x1',
        baseFeePerGas: ['0x1', '0x2'],
        gasUsedRatio: [0.5, 0.6],
        reward: [['0x1', '0x2', '0x3'], ['0x1', '0x2', '0x3']]
      }, 
      id: 1 
    };
    
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getFeeHistory')
      .mockReturnValueOnce(4)
      .mockReturnValueOnce('latest')
      .mockReturnValueOnce('[25, 50, 75]');
    
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeNetworkOperations.call(
      mockExecuteFunctions, 
      [{ json: {} }]
    );

    expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://rpc.monad.xyz',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-key'
      },
      json: true,
      body: {
        jsonrpc: '2.0',
        method: 'eth_feeHistory',
        params: ['0x4', 'latest', [25, 50, 75]],
        id: 1
      }
    });
  });

  it('should handle errors and continue on fail', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValue('getChainId');
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Network error'));
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);

    const result = await executeNetworkOperations.call(
      mockExecuteFunctions, 
      [{ json: {} }]
    );

    expect(result).toEqual([{ 
      json: { error: 'Network error' }, 
      pairedItem: { item: 0 } 
    }]);
  });

  it('should throw error when continue on fail is false', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValue('getChainId');
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Network error'));
    mockExecuteFunctions.continueOnFail.mockReturnValue(false);

    await expect(
      executeNetworkOperations.call(mockExecuteFunctions, [{ json: {} }])
    ).rejects.toThrow('Network error');
  });

  it('should throw error for unknown operation', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValue('unknownOperation');

    await expect(
      executeNetworkOperations.call(mockExecuteFunctions, [{ json: {} }])
    ).rejects.toThrow('Unknown operation: unknownOperation');
  });

  it('should handle invalid JSON in reward percentiles', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getFeeHistory')
      .mockReturnValueOnce(4)
      .mockReturnValueOnce('latest')
      .mockReturnValueOnce('invalid json');

    await expect(
      executeNetworkOperations.call(mockExecuteFunctions, [{ json: {} }])
    ).rejects.toThrow('Invalid JSON format for reward percentiles');
  });
});

describe('SmartContract Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-key',
        baseUrl: 'https://rpc.monad.xyz',
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn(),
      },
    };
  });

  describe('call operation', () => {
    it('should execute contract call successfully', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        result: '0x0000000000000000000000000000000000000000000000000000000000000001',
        id: 1,
      };

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('call')
        .mockReturnValueOnce({ to: '0x123', data: '0x456' })
        .mockReturnValueOnce('latest');
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeSmartContractOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://rpc.monad.xyz',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-key',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{ to: '0x123', data: '0x456' }, 'latest'],
          id: 1,
        }),
        json: true,
      });
    });

    it('should handle call operation error', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('call')
        .mockReturnValueOnce({ to: '0x123' })
        .mockReturnValueOnce('latest');
      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);

      const result = await executeSmartContractOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toEqual([{ json: { error: 'API Error' }, pairedItem: { item: 0 } }]);
    });
  });

  describe('estimateGas operation', () => {
    it('should estimate gas successfully', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        result: '0x5208',
        id: 1,
      };

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('estimateGas')
        .mockReturnValueOnce({ to: '0x123', value: '0x1' });
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeSmartContractOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
    });
  });

  describe('getCode operation', () => {
    it('should get contract code successfully', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        result: '0x608060405234801561001057600080fd5b50',
        id: 1,
      };

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getCode')
        .mockReturnValueOnce('0x123456789abcdef')
        .mockReturnValueOnce('latest');
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeSmartContractOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
    });
  });

  describe('getStorageAt operation', () => {
    it('should get storage successfully', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        result: '0x0000000000000000000000000000000000000000000000000000000000000001',
        id: 1,
      };

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getStorageAt')
        .mockReturnValueOnce('0x123456789abcdef')
        .mockReturnValueOnce('0x0')
        .mockReturnValueOnce('latest');
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeSmartContractOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
    });
  });

  describe('getLogs operation', () => {
    it('should get logs successfully', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        result: [
          {
            address: '0x123',
            topics: ['0x456'],
            data: '0x789',
            blockNumber: '0x1b4',
            transactionHash: '0xabc',
            logIndex: '0x0',
          },
        ],
        id: 1,
      };

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getLogs')
        .mockReturnValueOnce({ address: '0x123', fromBlock: 'latest' });
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeSmartContractOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toEqual([{ json: mockResponse, pairedItem: { item: 0 } }]);
    });
  });
});

describe('Staking Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({ 
        apiKey: 'test-key', 
        baseUrl: 'https://rpc.monad.xyz' 
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: { 
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn() 
      },
    };
  });

  it('should get validators successfully', async () => {
    const mockValidators = { 
      jsonrpc: '2.0', 
      id: 1, 
      result: [
        { address: '0x123...', stake: '1000000000000000000' }
      ] 
    };
    
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getValidators')
      .mockReturnValueOnce('latest');
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockValidators);

    const items = [{ json: {} }];
    const result = await executeStakingOperations.call(mockExecuteFunctions, items);

    expect(result).toEqual([{ json: mockValidators, pairedItem: { item: 0 } }]);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://rpc.monad.xyz',
      body: {
        jsonrpc: '2.0',
        method: 'eth_getValidators',
        params: ['latest'],
        id: 1,
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-key',
      },
      json: true,
    });
  });

  it('should get validator info successfully', async () => {
    const mockValidatorInfo = { 
      jsonrpc: '2.0', 
      id: 1, 
      result: { 
        address: '0x123...',
        stake: '1000000000000000000',
        commission: '0.05'
      } 
    };
    
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getValidatorInfo')
      .mockReturnValueOnce('0x123...')
      .mockReturnValueOnce('latest');
    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockValidatorInfo);

    const items = [{ json: {} }];
    const result = await executeStakingOperations.call(mockExecuteFunctions, items);

    expect(result).toEqual([{ json: mockValidatorInfo, pairedItem: { item: 0 } }]);
  });

  it('should handle errors when continueOnFail is true', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('getValidators');
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Network error'));
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);

    const items = [{ json: {} }];
    const result = await executeStakingOperations.call(mockExecuteFunctions, items);

    expect(result).toEqual([{ json: { error: 'Network error' }, pairedItem: { item: 0 } }]);
  });

  it('should throw errors when continueOnFail is false', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('getValidators');
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Network error'));
    mockExecuteFunctions.continueOnFail.mockReturnValue(false);

    const items = [{ json: {} }];
    
    await expect(executeStakingOperations.call(mockExecuteFunctions, items))
      .rejects.toThrow('Network error');
  });
});
});
