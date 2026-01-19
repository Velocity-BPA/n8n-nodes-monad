/**
 * @file Consensus Resource Operations (MonadBFT)
 * @copyright 2025 Velocity BPA
 * @license BSL-1.1
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getConsensusClient } from '../../transport/consensusClient';
import { getMonadClient } from '../../transport/monadClient';
import { isValidAddress, normalizeAddress } from '../../utils/addressUtils';

export const consensusOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['consensus'],
			},
		},
		options: [
			{
				name: 'Get Validator Set',
				value: 'getValidatorSet',
				description: 'Get the current validator set',
				action: 'Get validator set',
			},
			{
				name: 'Get Validator Info',
				value: 'getValidatorInfo',
				description: 'Get information about a specific validator',
				action: 'Get validator info',
			},
			{
				name: 'Get Current Proposer',
				value: 'getCurrentProposer',
				description: 'Get the current block proposer',
				action: 'Get current proposer',
			},
			{
				name: 'Get Consensus State',
				value: 'getConsensusState',
				description: 'Get current consensus state',
				action: 'Get consensus state',
			},
			{
				name: 'Get Finality Status',
				value: 'getFinalityStatus',
				description: 'Get block finality information',
				action: 'Get finality status',
			},
			{
				name: 'Check Block Finalized',
				value: 'checkBlockFinalized',
				description: 'Check if a specific block is finalized',
				action: 'Check if block is finalized',
			},
			{
				name: 'Get Consensus Stats',
				value: 'getConsensusStats',
				description: 'Get consensus statistics',
				action: 'Get consensus stats',
			},
			{
				name: 'Get Expected Leader',
				value: 'getExpectedLeader',
				description: 'Get expected leader for future block',
				action: 'Get expected leader',
			},
		],
		default: 'getValidatorSet',
	},
];

export const consensusFields: INodeProperties[] = [
	{
		displayName: 'Validator Address',
		name: 'validatorAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['consensus'],
				operation: ['getValidatorInfo'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Validator address',
	},
	{
		displayName: 'Block Number',
		name: 'blockNumber',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['consensus'],
				operation: ['checkBlockFinalized', 'getExpectedLeader'],
			},
		},
		default: 0,
		description: 'Block number',
	},
	{
		displayName: 'Include Inactive',
		name: 'includeInactive',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['consensus'],
				operation: ['getValidatorSet'],
			},
		},
		default: false,
		description: 'Whether to include inactive validators',
	},
];

export async function executeConsensusOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('monadNetwork');
	const consensusClient = getConsensusClient(credentials);
	const client = getMonadClient(credentials);

	let result: any;

	switch (operation) {
		case 'getValidatorSet': {
			const includeInactive = this.getNodeParameter('includeInactive', index, false) as boolean;

			const validators = await consensusClient.getValidatorSet();

			const filteredValidators = includeInactive
				? validators
				: validators.filter((v: any) => v.active);

			result = {
				validatorCount: filteredValidators.length,
				activeCount: validators.filter((v: any) => v.active).length,
				totalStake: validators.reduce(
					(sum: bigint, v: any) => sum + BigInt(v.stake || 0),
					0n,
				).toString(),
				validators: filteredValidators.map((v: any) =>
					consensusClient.formatValidatorInfo(v)
				),
			};
			break;
		}

		case 'getValidatorInfo': {
			const validatorAddress = this.getNodeParameter('validatorAddress', index) as string;

			if (!isValidAddress(validatorAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid validator address: ${validatorAddress}`);
			}

			const validator = await consensusClient.getValidatorInfo(normalizeAddress(validatorAddress));

			if (!validator) {
				throw new NodeOperationError(this.getNode(), `Validator not found: ${validatorAddress}`);
			}

			result = consensusClient.formatValidatorInfo(validator);
			break;
		}

		case 'getCurrentProposer': {
			const proposer = await consensusClient.getCurrentProposer();
			const blockNumber = await client.getBlockNumber();

			result = {
				proposer,
				blockNumber,
				timestamp: Date.now(),
			};
			break;
		}

		case 'getConsensusState': {
			const state = await consensusClient.getConsensusState();

			result = {
				...state,
				timestamp: Date.now(),
			};
			break;
		}

		case 'getFinalityStatus': {
			const finality = await consensusClient.getFinalityStatus();

			result = {
				...finality,
				timestamp: Date.now(),
			};
			break;
		}

		case 'checkBlockFinalized': {
			const blockNumber = this.getNodeParameter('blockNumber', index) as number;

			const isFinalized = await consensusClient.isBlockFinalized(blockNumber);
			const finality = await consensusClient.getFinalityStatus();

			result = {
				blockNumber,
				isFinalized,
				latestFinalizedBlock: finality.latestFinalizedBlock,
				blocksUntilFinalized: isFinalized ? 0 : blockNumber - finality.latestFinalizedBlock,
			};
			break;
		}

		case 'getConsensusStats': {
			const stats = await consensusClient.getConsensusStats();
			const validators = await consensusClient.getValidatorSet();

			const activeValidators = validators.filter((v: any) => v.active);
			const totalStake = validators.reduce(
				(sum: bigint, v: any) => sum + BigInt(v.stake || 0),
				0n,
			);

			result = {
				...stats,
				validatorCount: validators.length,
				activeValidatorCount: activeValidators.length,
				totalStake: totalStake.toString(),
				averageStake: validators.length > 0
					? (totalStake / BigInt(validators.length)).toString()
					: '0',
				timestamp: Date.now(),
			};
			break;
		}

		case 'getExpectedLeader': {
			const blockNumber = this.getNodeParameter('blockNumber', index) as number;

			const leader = await consensusClient.getExpectedLeader(blockNumber);

			result = {
				blockNumber,
				expectedLeader: leader,
				timestamp: Date.now(),
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result }];
}
export { consensusOperations as operations, consensusFields as fields, executeConsensusOperation as execute };
