/**
 * @file Governance Resource Operations
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
import { isValidAddress, normalizeAddress } from '../../utils/addressUtils';
import { CONTRACT_ADDRESSES, GOVERNANCE_ABI } from '../../constants/contracts';

export const governanceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['governance'],
			},
		},
		options: [
			{
				name: 'Get Proposal',
				value: 'getProposal',
				description: 'Get proposal details',
				action: 'Get proposal',
			},
			{
				name: 'Get Proposals',
				value: 'getProposals',
				description: 'List all proposals',
				action: 'Get proposals',
			},
			{
				name: 'Create Proposal',
				value: 'createProposal',
				description: 'Create a new proposal',
				action: 'Create proposal',
			},
			{
				name: 'Cast Vote',
				value: 'castVote',
				description: 'Vote on a proposal',
				action: 'Cast vote',
			},
			{
				name: 'Get Vote',
				value: 'getVote',
				description: 'Get vote for an address',
				action: 'Get vote',
			},
			{
				name: 'Get Voting Power',
				value: 'getVotingPower',
				description: 'Get voting power of an address',
				action: 'Get voting power',
			},
			{
				name: 'Execute Proposal',
				value: 'executeProposal',
				description: 'Execute a passed proposal',
				action: 'Execute proposal',
			},
			{
				name: 'Queue Proposal',
				value: 'queueProposal',
				description: 'Queue a passed proposal for execution',
				action: 'Queue proposal',
			},
		],
		default: 'getProposals',
	},
];

export const governanceFields: INodeProperties[] = [
	{
		displayName: 'Proposal ID',
		name: 'proposalId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['governance'],
				operation: ['getProposal', 'castVote', 'getVote', 'executeProposal', 'queueProposal'],
			},
		},
		default: '',
		description: 'Proposal ID',
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['governance'],
				operation: ['getVote', 'getVotingPower'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Address to check',
	},
	{
		displayName: 'Vote',
		name: 'vote',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['governance'],
				operation: ['castVote'],
			},
		},
		options: [
			{ name: 'For', value: 1 },
			{ name: 'Against', value: 0 },
			{ name: 'Abstain', value: 2 },
		],
		default: 1,
		description: 'Vote choice',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['governance'],
				operation: ['createProposal'],
			},
		},
		default: '',
		description: 'Proposal description',
	},
	{
		displayName: 'Targets',
		name: 'targets',
		type: 'json',
		required: true,
		displayOptions: {
			show: {
				resource: ['governance'],
				operation: ['createProposal'],
			},
		},
		default: '[]',
		description: 'Array of target contract addresses',
	},
	{
		displayName: 'Values',
		name: 'values',
		type: 'json',
		required: true,
		displayOptions: {
			show: {
				resource: ['governance'],
				operation: ['createProposal'],
			},
		},
		default: '[]',
		description: 'Array of MONAD values to send',
	},
	{
		displayName: 'Calldatas',
		name: 'calldatas',
		type: 'json',
		required: true,
		displayOptions: {
			show: {
				resource: ['governance'],
				operation: ['createProposal'],
			},
		},
		default: '[]',
		description: 'Array of encoded function calls',
	},
];

export async function executeGovernanceOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('monadNetwork');
	const client = getMonadClient(credentials);

	let result: any;

	switch (operation) {
		case 'getProposal': {
			const proposalId = this.getNodeParameter('proposalId', index) as string;

			const data = client.encodeFunctionData(GOVERNANCE_ABI, 'proposals', [proposalId]);
			const response = await client.callContract(CONTRACT_ADDRESSES.governance, data);

			const stateData = client.encodeFunctionData(GOVERNANCE_ABI, 'state', [proposalId]);
			const stateResponse = await client.callContract(CONTRACT_ADDRESSES.governance, stateData);

			result = {
				proposalId,
				rawData: response,
				state: parseInt(stateResponse, 16),
				governanceContract: CONTRACT_ADDRESSES.governance,
			};
			break;
		}

		case 'getProposals': {
			// Query proposal count
			const countData = client.encodeFunctionData(GOVERNANCE_ABI, 'proposalCount', []);
			const countResponse = await client.callContract(CONTRACT_ADDRESSES.governance, countData);
			const proposalCount = parseInt(countResponse, 16);

			result = {
				proposalCount,
				governanceContract: CONTRACT_ADDRESSES.governance,
			};
			break;
		}

		case 'createProposal': {
			const description = this.getNodeParameter('description', index) as string;
			const targetsJson = this.getNodeParameter('targets', index) as string;
			const valuesJson = this.getNodeParameter('values', index) as string;
			const calldatasJson = this.getNodeParameter('calldatas', index) as string;

			const targets = JSON.parse(targetsJson);
			const values = JSON.parse(valuesJson).map((v: string) => client.parseEther(v));
			const calldatas = JSON.parse(calldatasJson);

			const data = client.encodeFunctionData(GOVERNANCE_ABI, 'propose', [
				targets,
				values,
				calldatas,
				description,
			]);

			const tx = await client.sendSignedTransaction({
				to: CONTRACT_ADDRESSES.governance,
				data,
			});

			const receipt = await client.waitForTransaction(tx.hash);

			result = {
				transactionHash: tx.hash,
				receipt: client.formatReceipt(receipt),
			};
			break;
		}

		case 'castVote': {
			const proposalId = this.getNodeParameter('proposalId', index) as string;
			const vote = this.getNodeParameter('vote', index) as number;

			const data = client.encodeFunctionData(GOVERNANCE_ABI, 'castVote', [proposalId, vote]);

			const tx = await client.sendSignedTransaction({
				to: CONTRACT_ADDRESSES.governance,
				data,
			});

			const receipt = await client.waitForTransaction(tx.hash);

			result = {
				transactionHash: tx.hash,
				proposalId,
				vote,
				voteLabel: vote === 1 ? 'For' : vote === 0 ? 'Against' : 'Abstain',
				receipt: client.formatReceipt(receipt),
			};
			break;
		}

		case 'getVote': {
			const proposalId = this.getNodeParameter('proposalId', index) as string;
			const address = this.getNodeParameter('address', index) as string;

			if (!isValidAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`);
			}

			const data = client.encodeFunctionData(GOVERNANCE_ABI, 'getReceipt', [
				proposalId,
				normalizeAddress(address),
			]);
			const response = await client.callContract(CONTRACT_ADDRESSES.governance, data);

			result = {
				proposalId,
				voter: normalizeAddress(address),
				rawData: response,
			};
			break;
		}

		case 'getVotingPower': {
			const address = this.getNodeParameter('address', index) as string;

			if (!isValidAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`);
			}

			const data = client.encodeFunctionData(GOVERNANCE_ABI, 'getVotes', [
				normalizeAddress(address),
			]);
			const response = await client.callContract(CONTRACT_ADDRESSES.governance, data);
			const votingPower = BigInt(response);

			result = {
				address: normalizeAddress(address),
				votingPower: votingPower.toString(),
				votingPowerFormatted: client.formatEther(votingPower),
			};
			break;
		}

		case 'executeProposal': {
			const proposalId = this.getNodeParameter('proposalId', index) as string;

			const data = client.encodeFunctionData(GOVERNANCE_ABI, 'execute', [proposalId]);

			const tx = await client.sendSignedTransaction({
				to: CONTRACT_ADDRESSES.governance,
				data,
			});

			const receipt = await client.waitForTransaction(tx.hash);

			result = {
				transactionHash: tx.hash,
				proposalId,
				receipt: client.formatReceipt(receipt),
			};
			break;
		}

		case 'queueProposal': {
			const proposalId = this.getNodeParameter('proposalId', index) as string;

			const data = client.encodeFunctionData(GOVERNANCE_ABI, 'queue', [proposalId]);

			const tx = await client.sendSignedTransaction({
				to: CONTRACT_ADDRESSES.governance,
				data,
			});

			const receipt = await client.waitForTransaction(tx.hash);

			result = {
				transactionHash: tx.hash,
				proposalId,
				receipt: client.formatReceipt(receipt),
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result }];
}
export { governanceOperations as operations, governanceFields as fields, executeGovernanceOperation as execute };
