/**
 * Subgraph Actions for Monad Blockchain
 * The Graph protocol integration for indexed blockchain data
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

export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['subgraph'],
			},
		},
		options: [
			{
				name: 'Query Subgraph',
				value: 'querySubgraph',
				description: 'Execute a GraphQL query against a subgraph',
				action: 'Query a subgraph',
			},
			{
				name: 'Get Subgraph Status',
				value: 'getStatus',
				description: 'Get the indexing status of a subgraph',
				action: 'Get subgraph status',
			},
			{
				name: 'Get Entity',
				value: 'getEntity',
				description: 'Get a specific entity by ID from a subgraph',
				action: 'Get entity from subgraph',
			},
			{
				name: 'List Entities',
				value: 'listEntities',
				description: 'List entities with filtering and pagination',
				action: 'List entities from subgraph',
			},
			{
				name: 'Get Token Data',
				value: 'getTokenData',
				description: 'Get token information from DEX subgraph',
				action: 'Get token data',
			},
			{
				name: 'Get Pool Data',
				value: 'getPoolData',
				description: 'Get liquidity pool data from DEX subgraph',
				action: 'Get pool data',
			},
			{
				name: 'Get Swap History',
				value: 'getSwapHistory',
				description: 'Get swap transaction history',
				action: 'Get swap history',
			},
			{
				name: 'Get User Positions',
				value: 'getUserPositions',
				description: 'Get DeFi positions for an address',
				action: 'Get user positions',
			},
		],
		default: 'querySubgraph',
	},
];

export const fields: INodeProperties[] = [
	// Subgraph endpoint
	{
		displayName: 'Subgraph URL',
		name: 'subgraphUrl',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['subgraph'],
			},
		},
		default: '',
		placeholder: 'https://api.thegraph.com/subgraphs/name/...',
		description: 'The Graph subgraph endpoint URL',
	},
	// Query Subgraph fields
	{
		displayName: 'GraphQL Query',
		name: 'query',
		type: 'string',
		typeOptions: {
			rows: 10,
		},
		required: true,
		displayOptions: {
			show: {
				resource: ['subgraph'],
				operation: ['querySubgraph'],
			},
		},
		default: '',
		placeholder: '{ tokens(first: 10) { id symbol name } }',
		description: 'GraphQL query to execute',
	},
	{
		displayName: 'Variables',
		name: 'variables',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['subgraph'],
				operation: ['querySubgraph'],
			},
		},
		default: '{}',
		description: 'GraphQL query variables as JSON',
	},
	// Get Entity fields
	{
		displayName: 'Entity Type',
		name: 'entityType',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['subgraph'],
				operation: ['getEntity', 'listEntities'],
			},
		},
		default: '',
		placeholder: 'token',
		description: 'The type of entity to query (e.g., token, pool, swap)',
	},
	{
		displayName: 'Entity ID',
		name: 'entityId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['subgraph'],
				operation: ['getEntity'],
			},
		},
		default: '',
		description: 'The ID of the entity to retrieve',
	},
	{
		displayName: 'Fields to Return',
		name: 'entityFields',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['subgraph'],
				operation: ['getEntity', 'listEntities'],
			},
		},
		default: 'id',
		placeholder: 'id symbol name decimals',
		description: 'Space-separated list of fields to return',
	},
	// List Entities options
	{
		displayName: 'First',
		name: 'first',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['subgraph'],
				operation: ['listEntities', 'getSwapHistory'],
			},
		},
		default: 100,
		description: 'Number of entities to return',
	},
	{
		displayName: 'Skip',
		name: 'skip',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['subgraph'],
				operation: ['listEntities', 'getSwapHistory'],
			},
		},
		default: 0,
		description: 'Number of entities to skip (for pagination)',
	},
	{
		displayName: 'Order By',
		name: 'orderBy',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['subgraph'],
				operation: ['listEntities', 'getSwapHistory'],
			},
		},
		default: '',
		placeholder: 'createdAt',
		description: 'Field to order results by',
	},
	{
		displayName: 'Order Direction',
		name: 'orderDirection',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['subgraph'],
				operation: ['listEntities', 'getSwapHistory'],
			},
		},
		options: [
			{ name: 'Ascending', value: 'asc' },
			{ name: 'Descending', value: 'desc' },
		],
		default: 'desc',
		description: 'Order direction',
	},
	{
		displayName: 'Where Filter',
		name: 'whereFilter',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['subgraph'],
				operation: ['listEntities'],
			},
		},
		default: '{}',
		placeholder: '{ "symbol": "WETH" }',
		description: 'Filter conditions as JSON',
	},
	// Token Data fields
	{
		displayName: 'Token Address',
		name: 'tokenAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['subgraph'],
				operation: ['getTokenData'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Token contract address',
	},
	// Pool Data fields
	{
		displayName: 'Pool Address',
		name: 'poolAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['subgraph'],
				operation: ['getPoolData'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Liquidity pool contract address',
	},
	// Swap History fields
	{
		displayName: 'Pool Address',
		name: 'swapPoolAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['subgraph'],
				operation: ['getSwapHistory'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Filter swaps by pool address (optional)',
	},
	{
		displayName: 'User Address',
		name: 'swapUserAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['subgraph'],
				operation: ['getSwapHistory'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Filter swaps by user address (optional)',
	},
	// User Positions fields
	{
		displayName: 'User Address',
		name: 'userAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['subgraph'],
				operation: ['getUserPositions'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'User wallet address',
	},
	{
		displayName: 'Position Types',
		name: 'positionTypes',
		type: 'multiOptions',
		displayOptions: {
			show: {
				resource: ['subgraph'],
				operation: ['getUserPositions'],
			},
		},
		options: [
			{ name: 'Liquidity Positions', value: 'liquidity' },
			{ name: 'Staking Positions', value: 'staking' },
			{ name: 'Lending Positions', value: 'lending' },
			{ name: 'Borrowing Positions', value: 'borrowing' },
		],
		default: ['liquidity'],
		description: 'Types of positions to retrieve',
	},
];

async function executeGraphQL(
	subgraphUrl: string,
	query: string,
	variables: Record<string, unknown> = {},
): Promise<unknown> {
	const response = await fetch(subgraphUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ query, variables }),
	});

	if (!response.ok) {
		throw new Error(`GraphQL request failed: ${response.statusText}`);
	}

	const result = await response.json() as { data?: unknown; errors?: Array<{ message: string }> };
	
	if (result.errors && result.errors.length > 0) {
		throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
	}

	return result.data;
}

function normalizeAddress(address: string): string {
	return address.toLowerCase();
}

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const subgraphUrl = this.getNodeParameter('subgraphUrl', index) as string;

	let result: unknown;

	switch (operation) {
		case 'querySubgraph': {
			const query = this.getNodeParameter('query', index) as string;
			const variablesJson = this.getNodeParameter('variables', index, '{}') as string;
			
			let variables: Record<string, unknown> = {};
			try {
				variables = JSON.parse(variablesJson);
			} catch {
				throw new NodeOperationError(this.getNode(), 'Invalid JSON in variables');
			}

			result = await executeGraphQL(subgraphUrl, query, variables);
			break;
		}

		case 'getStatus': {
			const statusQuery = `
				{
					_meta {
						block {
							number
							hash
							timestamp
						}
						deployment
						hasIndexingErrors
					}
				}
			`;

			const data = await executeGraphQL(subgraphUrl, statusQuery) as { _meta?: unknown };
			result = {
				status: 'active',
				meta: data._meta || null,
				url: subgraphUrl,
			};
			break;
		}

		case 'getEntity': {
			const entityType = this.getNodeParameter('entityType', index) as string;
			const entityId = this.getNodeParameter('entityId', index) as string;
			const entityFields = this.getNodeParameter('entityFields', index, 'id') as string;

			const query = `
				query GetEntity($id: ID!) {
					${entityType}(id: $id) {
						${entityFields}
					}
				}
			`;

			const data = await executeGraphQL(subgraphUrl, query, { id: entityId }) as Record<string, unknown>;
			result = data[entityType] || null;
			break;
		}

		case 'listEntities': {
			const entityType = this.getNodeParameter('entityType', index) as string;
			const entityFields = this.getNodeParameter('entityFields', index, 'id') as string;
			const first = this.getNodeParameter('first', index, 100) as number;
			const skip = this.getNodeParameter('skip', index, 0) as number;
			const orderBy = this.getNodeParameter('orderBy', index, '') as string;
			const orderDirection = this.getNodeParameter('orderDirection', index, 'desc') as string;
			const whereFilterJson = this.getNodeParameter('whereFilter', index, '{}') as string;

			let whereFilter: Record<string, unknown> = {};
			try {
				whereFilter = JSON.parse(whereFilterJson);
			} catch {
				throw new NodeOperationError(this.getNode(), 'Invalid JSON in where filter');
			}

			// Build where clause
			const whereClause = Object.keys(whereFilter).length > 0
				? `, where: ${JSON.stringify(whereFilter).replace(/"([^"]+)":/g, '$1:')}`
				: '';

			// Build order clause
			const orderClause = orderBy ? `, orderBy: ${orderBy}, orderDirection: ${orderDirection}` : '';

			// Pluralize entity type (simple version)
			const pluralEntity = entityType.endsWith('s') ? entityType : `${entityType}s`;

			const query = `
				{
					${pluralEntity}(first: ${first}, skip: ${skip}${orderClause}${whereClause}) {
						${entityFields}
					}
				}
			`;

			const data = await executeGraphQL(subgraphUrl, query) as Record<string, unknown[]>;
			result = {
				entities: data[pluralEntity] || [],
				pagination: { first, skip, hasMore: (data[pluralEntity]?.length || 0) === first },
			};
			break;
		}

		case 'getTokenData': {
			const tokenAddress = normalizeAddress(this.getNodeParameter('tokenAddress', index) as string);

			const query = `
				query GetToken($id: ID!) {
					token(id: $id) {
						id
						symbol
						name
						decimals
						totalSupply
						tradeVolume
						tradeVolumeUSD
						txCount
						totalLiquidity
						derivedETH
					}
				}
			`;

			const data = await executeGraphQL(subgraphUrl, query, { id: tokenAddress }) as { token?: unknown };
			result = data.token || null;
			break;
		}

		case 'getPoolData': {
			const poolAddress = normalizeAddress(this.getNodeParameter('poolAddress', index) as string);

			const query = `
				query GetPool($id: ID!) {
					pair(id: $id) {
						id
						token0 {
							id
							symbol
							name
							decimals
						}
						token1 {
							id
							symbol
							name
							decimals
						}
						reserve0
						reserve1
						totalSupply
						reserveETH
						reserveUSD
						trackedReserveETH
						token0Price
						token1Price
						volumeToken0
						volumeToken1
						volumeUSD
						txCount
						createdAtTimestamp
						createdAtBlockNumber
					}
				}
			`;

			const data = await executeGraphQL(subgraphUrl, query, { id: poolAddress }) as { pair?: unknown };
			result = data.pair || null;
			break;
		}

		case 'getSwapHistory': {
			const first = this.getNodeParameter('first', index, 100) as number;
			const skip = this.getNodeParameter('skip', index, 0) as number;
			const orderBy = this.getNodeParameter('orderBy', index, 'timestamp') as string;
			const orderDirection = this.getNodeParameter('orderDirection', index, 'desc') as string;
			const poolAddress = this.getNodeParameter('swapPoolAddress', index, '') as string;
			const userAddress = this.getNodeParameter('swapUserAddress', index, '') as string;

			// Build where conditions
			const whereConditions: string[] = [];
			if (poolAddress) {
				whereConditions.push(`pair: "${normalizeAddress(poolAddress)}"`);
			}
			if (userAddress) {
				whereConditions.push(`to: "${normalizeAddress(userAddress)}"`);
			}
			const whereClause = whereConditions.length > 0 
				? `, where: { ${whereConditions.join(', ')} }` 
				: '';

			const query = `
				{
					swaps(first: ${first}, skip: ${skip}, orderBy: ${orderBy}, orderDirection: ${orderDirection}${whereClause}) {
						id
						transaction {
							id
							blockNumber
							timestamp
						}
						pair {
							id
							token0 { symbol }
							token1 { symbol }
						}
						sender
						to
						amount0In
						amount1In
						amount0Out
						amount1Out
						amountUSD
						timestamp
					}
				}
			`;

			const data = await executeGraphQL(subgraphUrl, query) as { swaps?: unknown[] };
			result = {
				swaps: data.swaps || [],
				pagination: { first, skip, hasMore: (data.swaps?.length || 0) === first },
			};
			break;
		}

		case 'getUserPositions': {
			const userAddress = normalizeAddress(this.getNodeParameter('userAddress', index) as string);
			const positionTypes = this.getNodeParameter('positionTypes', index, ['liquidity']) as string[];

			const positions: Record<string, unknown> = { address: userAddress };

			if (positionTypes.includes('liquidity')) {
				const lpQuery = `
					query GetLPPositions($user: Bytes!) {
						liquidityPositions(where: { user: $user, liquidityTokenBalance_gt: "0" }) {
							id
							liquidityTokenBalance
							pair {
								id
								token0 { id symbol }
								token1 { id symbol }
								reserve0
								reserve1
								totalSupply
							}
						}
					}
				`;
				try {
					const data = await executeGraphQL(subgraphUrl, lpQuery, { user: userAddress }) as { liquidityPositions?: unknown[] };
					positions.liquidity = data.liquidityPositions || [];
				} catch {
					positions.liquidity = [];
				}
			}

			if (positionTypes.includes('staking')) {
				const stakingQuery = `
					query GetStakingPositions($user: Bytes!) {
						stakes(where: { user: $user, amount_gt: "0" }) {
							id
							amount
							rewardDebt
							pool {
								id
								stakingToken { symbol }
								rewardToken { symbol }
							}
						}
					}
				`;
				try {
					const data = await executeGraphQL(subgraphUrl, stakingQuery, { user: userAddress }) as { stakes?: unknown[] };
					positions.staking = data.stakes || [];
				} catch {
					positions.staking = [];
				}
			}

			if (positionTypes.includes('lending')) {
				const lendingQuery = `
					query GetLendingPositions($user: Bytes!) {
						deposits(where: { user: $user, amount_gt: "0" }) {
							id
							amount
							market {
								id
								underlyingToken { symbol }
							}
						}
					}
				`;
				try {
					const data = await executeGraphQL(subgraphUrl, lendingQuery, { user: userAddress }) as { deposits?: unknown[] };
					positions.lending = data.deposits || [];
				} catch {
					positions.lending = [];
				}
			}

			if (positionTypes.includes('borrowing')) {
				const borrowingQuery = `
					query GetBorrowingPositions($user: Bytes!) {
						borrows(where: { user: $user, amount_gt: "0" }) {
							id
							amount
							market {
								id
								underlyingToken { symbol }
							}
						}
					}
				`;
				try {
					const data = await executeGraphQL(subgraphUrl, borrowingQuery, { user: userAddress }) as { borrows?: unknown[] };
					positions.borrowing = data.borrows || [];
				} catch {
					positions.borrowing = [];
				}
			}

			result = positions;
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result as Record<string, unknown> }];
}
