/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class MonadNetwork implements ICredentialType {
  name = 'monadNetwork';
  displayName = 'Monad Network';
  documentationUrl = 'https://docs.monad.xyz';
  properties: INodeProperties[] = [
    {
      displayName: 'Network',
      name: 'network',
      type: 'options',
      default: 'testnet',
      options: [
        {
          name: 'Monad Mainnet',
          value: 'mainnet',
        },
        {
          name: 'Monad Testnet',
          value: 'testnet',
        },
        {
          name: 'Monad Devnet',
          value: 'devnet',
        },
        {
          name: 'Custom',
          value: 'custom',
        },
      ],
      description: 'The Monad network to connect to',
    },
    {
      displayName: 'RPC Endpoint URL',
      name: 'rpcUrl',
      type: 'string',
      default: '',
      placeholder: 'https://rpc.monad.xyz',
      description: 'The RPC endpoint URL for the Monad network',
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
    },
    {
      displayName: 'WebSocket Endpoint URL',
      name: 'wsUrl',
      type: 'string',
      default: '',
      placeholder: 'wss://ws.monad.xyz',
      description: 'Optional WebSocket endpoint for real-time subscriptions',
    },
    {
      displayName: 'Private Key',
      name: 'privateKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'Private key for signing transactions (optional for read-only operations)',
    },
    {
      displayName: 'Chain ID',
      name: 'chainId',
      type: 'number',
      default: 0,
      description: 'Chain ID (auto-populated for known networks, required for custom)',
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
    },
    {
      displayName: 'Explorer API Key',
      name: 'explorerApiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'Optional API key for Monad Explorer enhanced features',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {},
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.network === "custom" ? $credentials.rpcUrl : ($credentials.network === "mainnet" ? "https://rpc.monad.xyz" : ($credentials.network === "testnet" ? "https://testnet-rpc.monad.xyz" : "https://devnet-rpc.monad.xyz"))}}',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1,
      }),
    },
  };
}
