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

export class MonadApi implements ICredentialType {
  name = 'monadApi';
  displayName = 'Monad API';
  documentationUrl = 'https://docs.monad.xyz';
  properties: INodeProperties[] = [
    {
      displayName: 'Explorer API Endpoint',
      name: 'explorerApiEndpoint',
      type: 'string',
      default: 'https://explorer-api.monad.xyz',
      placeholder: 'https://explorer-api.monad.xyz',
      description: 'The Monad Explorer API endpoint',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'API key for authenticated requests',
    },
    {
      displayName: 'Subgraph URL',
      name: 'subgraphUrl',
      type: 'string',
      default: '',
      placeholder: 'https://subgraph.monad.xyz/subgraphs/name/...',
      description: 'Optional subgraph URL for GraphQL queries',
    },
    {
      displayName: 'Rate Limit (Requests per Second)',
      name: 'rateLimit',
      type: 'number',
      default: 10,
      description: 'Maximum requests per second to avoid rate limiting',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'X-API-Key': '={{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.explorerApiEndpoint}}',
      url: '/api/v1/status',
      method: 'GET',
      headers: {
        'X-API-Key': '={{$credentials.apiKey}}',
      },
    },
  };
}
