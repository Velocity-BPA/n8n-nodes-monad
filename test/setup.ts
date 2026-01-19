// Test setup file for Jest
// This file runs before each test suite

// Set test timeout
jest.setTimeout(30000);

// Mock n8n-workflow module
jest.mock('n8n-workflow', () => ({
  INodeType: {},
  INodeTypeDescription: {},
  ITriggerFunctions: {},
  IExecuteFunctions: {},
  ILoadOptionsFunctions: {},
  ICredentialType: {},
  ICredentialTestFunctions: {},
  IDataObject: {},
  INodeExecutionData: {},
  NodeConnectionType: {
    Main: 'main',
  },
  NodeOperationError: class NodeOperationError extends Error {
    constructor(node: any, message: string) {
      super(message);
      this.name = 'NodeOperationError';
    }
  },
}), { virtual: true });

// Global test utilities
export {};
