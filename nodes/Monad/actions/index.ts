/**
 * Monad Node Actions Index
 * Exports all resource actions for the Monad n8n node
 * 
 * Copyright (c) 2025 Monad Foundation
 * Licensed under the Business Source License 1.1
 */

import * as account from './account';
import * as transaction from './transaction';
import * as token from './token';
import * as nft from './nft';
import * as contract from './contract';
import * as block from './block';
import * as event from './event';
import * as parallelExecution from './parallelExecution';
import * as monadDb from './monadDb';
import * as consensus from './consensus';
import * as gas from './gas';
import * as staking from './staking';
import * as governance from './governance';
import * as defi from './defi';
import * as multicall from './multicall';
import * as accountAbstraction from './accountAbstraction';
import * as mempool from './mempool';
import * as debugging from './debugging';
import * as performance from './performance';
import * as analytics from './analytics';
import * as subgraph from './subgraph';
import * as utility from './utility';

export {
	account,
	transaction,
	token,
	nft,
	contract,
	block,
	event,
	parallelExecution,
	monadDb,
	consensus,
	gas,
	staking,
	governance,
	defi,
	multicall,
	accountAbstraction,
	mempool,
	debugging,
	performance,
	analytics,
	subgraph,
	utility,
};

// Resource definitions for node configuration
export const resourceOptions = [
	{
		name: 'Account',
		value: 'account',
		description: 'Manage accounts and balances',
	},
	{
		name: 'Transaction',
		value: 'transaction',
		description: 'Send and query transactions',
	},
	{
		name: 'Token',
		value: 'token',
		description: 'ERC-20 token operations',
	},
	{
		name: 'NFT',
		value: 'nft',
		description: 'ERC-721/1155 NFT operations',
	},
	{
		name: 'Contract',
		value: 'contract',
		description: 'Smart contract interactions',
	},
	{
		name: 'Block',
		value: 'block',
		description: 'Block data and finality',
	},
	{
		name: 'Event',
		value: 'event',
		description: 'Event logs and decoding',
	},
	{
		name: 'Parallel Execution',
		value: 'parallelExecution',
		description: 'Monad parallel execution analysis',
	},
	{
		name: 'MonadDB',
		value: 'monadDb',
		description: 'MonadDB state operations',
	},
	{
		name: 'Consensus',
		value: 'consensus',
		description: 'MonadBFT consensus info',
	},
	{
		name: 'Gas',
		value: 'gas',
		description: 'Gas prices and estimation',
	},
	{
		name: 'Staking',
		value: 'staking',
		description: 'Staking and delegation',
	},
	{
		name: 'Governance',
		value: 'governance',
		description: 'On-chain governance',
	},
	{
		name: 'DeFi',
		value: 'defi',
		description: 'DeFi protocol interactions',
	},
	{
		name: 'Multicall',
		value: 'multicall',
		description: 'Batched contract calls',
	},
	{
		name: 'Account Abstraction',
		value: 'accountAbstraction',
		description: 'ERC-4337 operations',
	},
	{
		name: 'Mempool',
		value: 'mempool',
		description: 'Mempool monitoring',
	},
	{
		name: 'Debugging',
		value: 'debugging',
		description: 'Transaction debugging tools',
	},
	{
		name: 'Performance',
		value: 'performance',
		description: 'Network performance metrics',
	},
	{
		name: 'Analytics',
		value: 'analytics',
		description: 'Blockchain analytics',
	},
	{
		name: 'Subgraph',
		value: 'subgraph',
		description: 'The Graph subgraph queries',
	},
	{
		name: 'Utility',
		value: 'utility',
		description: 'Data conversion utilities',
	},
];

// Map resource names to their modules
export const resourceModules = {
	account,
	transaction,
	token,
	nft,
	contract,
	block,
	event,
	parallelExecution,
	monadDb,
	consensus,
	gas,
	staking,
	governance,
	defi,
	multicall,
	accountAbstraction,
	mempool,
	debugging,
	performance,
	analytics,
	subgraph,
	utility,
};

export type ResourceType = keyof typeof resourceModules;
