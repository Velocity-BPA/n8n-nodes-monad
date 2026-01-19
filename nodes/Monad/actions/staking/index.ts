/**
 * @file Staking Resource Operations
 * @copyright 2025 Velocity BPA
 * @license BSL-1.1
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getMonadClient } from '../../transport/monadClient';
import { getConsensusClient } from '../../transport/consensusClient';
import { isValidAddress, normalizeAddress } from '../../utils/addressUtils';
import { STAKING_PARAMS } from '../../constants/validators';
import { CONTRACT_ADDRESSES, STAKING_ABI } from '../../constants/contracts';

export const stakingOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['staking'],
			},
		},
		options: [
			{
				name: 'Stake MONAD',
				value: 'stake',
				description: 'Stake MONAD with a validator',
				action: 'Stake MONAD',
			},
			{
				name: 'Unstake MONAD',
				value: 'unstake',
				description: 'Unstake MONAD from a validator',
				action: 'Unstake MONAD',
			},
			{
				name: 'Claim Rewards',
				value: 'claimRewards',
				description: 'Claim staking rewards',
				action: 'Claim rewards',
			},
			{
				name: 'Get Staking Info',
				value: 'getStakingInfo',
				description: 'Get staking information for an address',
				action: 'Get staking info',
			},
			{
				name: 'Get Pending Rewards',
				value: 'getPendingRewards',
				description: 'Get pending staking rewards',
				action: 'Get pending rewards',
			},
			{
				name: 'Get Validators',
				value: 'getValidators',
				description: 'Get list of validators',
				action: 'Get validators',
			},
			{
				name: 'Get Staking Parameters',
				value: 'getStakingParams',
				description: 'Get staking parameters',
				action: 'Get staking parameters',
			},
			{
				name: 'Delegate',
				value: 'delegate',
				description: 'Delegate stake to a validator',
				action: 'Delegate stake',
			},
			{
				name: 'Redelegate',
				value: 'redelegate',
				description: 'Move stake between validators',
				action: 'Redelegate stake',
			},
		],
		default: 'getStakingInfo',
	},
];

export const stakingFields: INodeProperties[] = [
	{
		displayName: 'Validator Address',
		name: 'validatorAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['staking'],
				operation: ['stake', 'unstake', 'delegate', 'redelegate'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Validator address to stake with',
	},
	{
		displayName: 'Amount (MONAD)',
		name: 'amount',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['staking'],
				operation: ['stake', 'unstake', 'delegate', 'redelegate'],
			},
		},
		default: '0',
		description: 'Amount of MONAD to stake/unstake',
	},
	{
		displayName: 'Staker Address',
		name: 'stakerAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['staking'],
				operation: ['getStakingInfo', 'getPendingRewards', 'claimRewards'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Address to check staking info for',
	},
	{
		displayName: 'New Validator Address',
		name: 'newValidatorAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['staking'],
				operation: ['redelegate'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'New validator to redelegate to',
	},
	{
		displayName: 'Include Inactive',
		name: 'includeInactive',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['staking'],
				operation: ['getValidators'],
			},
		},
		default: false,
		description: 'Whether to include inactive validators',
	},
];

export async function executeStakingOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('monadNetwork');
	const client = getMonadClient(credentials);
	const consensusClient = getConsensusClient(credentials);

	let result: any;

	switch (operation) {
		case 'stake': {
			const validatorAddress = this.getNodeParameter('validatorAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			if (!isValidAddress(validatorAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid validator address: ${validatorAddress}`);
			}

			const amountWei = client.parseEther(amount);
			if (amountWei < client.parseEther(STAKING_PARAMS.minStakeAmount)) {
				throw new NodeOperationError(
					this.getNode(),
					`Minimum stake is ${STAKING_PARAMS.minStakeAmount} MONAD`,
				);
			}

			// Encode stake function call
			const data = client.encodeFunctionData(STAKING_ABI, 'stake', [
				normalizeAddress(validatorAddress),
			]);

			const tx = await client.sendSignedTransaction({
				to: CONTRACT_ADDRESSES.staking,
				data,
				value: amountWei,
			});

			const receipt = await client.waitForTransaction(tx.hash);

			result = {
				transactionHash: tx.hash,
				validator: normalizeAddress(validatorAddress),
				amount,
				amountWei: amountWei.toString(),
				receipt: client.formatReceipt(receipt),
			};
			break;
		}

		case 'unstake': {
			const validatorAddress = this.getNodeParameter('validatorAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			if (!isValidAddress(validatorAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid validator address: ${validatorAddress}`);
			}

			const amountWei = client.parseEther(amount);

			const data = client.encodeFunctionData(STAKING_ABI, 'unstake', [
				normalizeAddress(validatorAddress),
				amountWei,
			]);

			const tx = await client.sendSignedTransaction({
				to: CONTRACT_ADDRESSES.staking,
				data,
			});

			const receipt = await client.waitForTransaction(tx.hash);

			result = {
				transactionHash: tx.hash,
				validator: normalizeAddress(validatorAddress),
				amount,
				amountWei: amountWei.toString(),
				unbondingPeriodDays: STAKING_PARAMS.unbondingPeriodDays,
				receipt: client.formatReceipt(receipt),
			};
			break;
		}

		case 'claimRewards': {
			const stakerAddress = this.getNodeParameter('stakerAddress', index) as string;

			if (!isValidAddress(stakerAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid staker address: ${stakerAddress}`);
			}

			const data = client.encodeFunctionData(STAKING_ABI, 'claimRewards', []);

			const tx = await client.sendSignedTransaction({
				to: CONTRACT_ADDRESSES.staking,
				data,
			});

			const receipt = await client.waitForTransaction(tx.hash);

			result = {
				transactionHash: tx.hash,
				staker: normalizeAddress(stakerAddress),
				receipt: client.formatReceipt(receipt),
			};
			break;
		}

		case 'getStakingInfo': {
			const stakerAddress = this.getNodeParameter('stakerAddress', index) as string;

			if (!isValidAddress(stakerAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid staker address: ${stakerAddress}`);
			}

			// Query staking contract for delegations
			const data = client.encodeFunctionData(STAKING_ABI, 'getStakerInfo', [
				normalizeAddress(stakerAddress),
			]);

			const response = await client.callContract(CONTRACT_ADDRESSES.staking, data);

			result = {
				staker: normalizeAddress(stakerAddress),
				stakingContract: CONTRACT_ADDRESSES.staking,
				rawResponse: response,
				// Actual decoding would depend on contract ABI
			};
			break;
		}

		case 'getPendingRewards': {
			const stakerAddress = this.getNodeParameter('stakerAddress', index) as string;

			if (!isValidAddress(stakerAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid staker address: ${stakerAddress}`);
			}

			const data = client.encodeFunctionData(STAKING_ABI, 'pendingRewards', [
				normalizeAddress(stakerAddress),
			]);

			const response = await client.callContract(CONTRACT_ADDRESSES.staking, data);
			const pendingRewards = BigInt(response);

			result = {
				staker: normalizeAddress(stakerAddress),
				pendingRewards: pendingRewards.toString(),
				pendingRewardsMONAD: client.formatEther(pendingRewards),
			};
			break;
		}

		case 'getValidators': {
			const includeInactive = this.getNodeParameter('includeInactive', index, false) as boolean;

			const validators = await consensusClient.getValidatorSet();
			const filteredValidators = includeInactive
				? validators
				: validators.filter((v: any) => v.active);

			result = {
				validatorCount: filteredValidators.length,
				validators: filteredValidators.map((v: any) =>
					consensusClient.formatValidatorInfo(v)
				),
			};
			break;
		}

		case 'getStakingParams': {
			result = {
				minStakeAmount: STAKING_PARAMS.minStakeAmount,
				unbondingPeriodDays: STAKING_PARAMS.unbondingPeriodDays,
				maxValidators: STAKING_PARAMS.maxValidators,
				stakingContract: CONTRACT_ADDRESSES.staking,
			};
			break;
		}

		case 'delegate': {
			const validatorAddress = this.getNodeParameter('validatorAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			if (!isValidAddress(validatorAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid validator address: ${validatorAddress}`);
			}

			const amountWei = client.parseEther(amount);

			const data = client.encodeFunctionData(STAKING_ABI, 'delegate', [
				normalizeAddress(validatorAddress),
			]);

			const tx = await client.sendSignedTransaction({
				to: CONTRACT_ADDRESSES.staking,
				data,
				value: amountWei,
			});

			const receipt = await client.waitForTransaction(tx.hash);

			result = {
				transactionHash: tx.hash,
				validator: normalizeAddress(validatorAddress),
				amount,
				receipt: client.formatReceipt(receipt),
			};
			break;
		}

		case 'redelegate': {
			const validatorAddress = this.getNodeParameter('validatorAddress', index) as string;
			const newValidatorAddress = this.getNodeParameter('newValidatorAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			if (!isValidAddress(validatorAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid validator address: ${validatorAddress}`);
			}
			if (!isValidAddress(newValidatorAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid new validator address: ${newValidatorAddress}`);
			}

			const amountWei = client.parseEther(amount);

			const data = client.encodeFunctionData(STAKING_ABI, 'redelegate', [
				normalizeAddress(validatorAddress),
				normalizeAddress(newValidatorAddress),
				amountWei,
			]);

			const tx = await client.sendSignedTransaction({
				to: CONTRACT_ADDRESSES.staking,
				data,
			});

			const receipt = await client.waitForTransaction(tx.hash);

			result = {
				transactionHash: tx.hash,
				fromValidator: normalizeAddress(validatorAddress),
				toValidator: normalizeAddress(newValidatorAddress),
				amount,
				receipt: client.formatReceipt(receipt),
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result }];
}
export { stakingOperations as operations, stakingFields as fields, executeStakingOperation as execute };
