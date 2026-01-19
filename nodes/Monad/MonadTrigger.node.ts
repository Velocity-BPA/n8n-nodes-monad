/**
 * Monad Trigger Node for n8n
 * WebSocket-based event subscriptions for real-time blockchain monitoring
 * 
 * Copyright (c) 2025 Monad Foundation
 * Licensed under the Business Source License 1.1
 */

import {
	ITriggerFunctions,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

import { HighSpeedSubscriber } from './transport/highSpeedSubscriber';
import { normalizeAddress } from './utils/addressUtils';

export class MonadTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Monad Trigger',
		name: 'monadTrigger',
		icon: 'file:monad.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Subscribe to Monad blockchain events in real-time',
		defaults: {
			name: 'Monad Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'monadNetwork',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'New Block',
						value: 'newBlock',
						description: 'Trigger on new blocks',
					},
					{
						name: 'New Transaction',
						value: 'newTransaction',
						description: 'Trigger on new pending transactions',
					},
					{
						name: 'Contract Event',
						value: 'contractEvent',
						description: 'Trigger on specific contract events',
					},
					{
						name: 'Address Activity',
						value: 'addressActivity',
						description: 'Trigger on any activity for an address',
					},
					{
						name: 'Token Transfer',
						value: 'tokenTransfer',
						description: 'Trigger on ERC-20 token transfers',
					},
					{
						name: 'NFT Transfer',
						value: 'nftTransfer',
						description: 'Trigger on ERC-721/1155 NFT transfers',
					},
					{
						name: 'Block Finality',
						value: 'blockFinality',
						description: 'Trigger when a block is finalized',
					},
				],
				default: 'newBlock',
			},
			// Contract Event fields
			{
				displayName: 'Contract Address',
				name: 'contractAddress',
				type: 'string',
				displayOptions: {
					show: {
						event: ['contractEvent'],
					},
				},
				default: '',
				placeholder: '0x...',
				description: 'Contract address to monitor',
				required: true,
			},
			{
				displayName: 'Event Signature',
				name: 'eventSignature',
				type: 'string',
				displayOptions: {
					show: {
						event: ['contractEvent'],
					},
				},
				default: '',
				placeholder: 'Transfer(address,address,uint256)',
				description: 'Event signature to filter (optional)',
			},
			{
				displayName: 'Event Topics',
				name: 'eventTopics',
				type: 'json',
				displayOptions: {
					show: {
						event: ['contractEvent'],
					},
				},
				default: '[]',
				description: 'Additional topic filters as JSON array',
			},
			// Address Activity fields
			{
				displayName: 'Watch Address',
				name: 'watchAddress',
				type: 'string',
				displayOptions: {
					show: {
						event: ['addressActivity'],
					},
				},
				default: '',
				placeholder: '0x...',
				description: 'Address to monitor for activity',
				required: true,
			},
			{
				displayName: 'Activity Types',
				name: 'activityTypes',
				type: 'multiOptions',
				displayOptions: {
					show: {
						event: ['addressActivity'],
					},
				},
				options: [
					{ name: 'Incoming Transactions', value: 'incoming' },
					{ name: 'Outgoing Transactions', value: 'outgoing' },
					{ name: 'Contract Interactions', value: 'contract' },
					{ name: 'Token Transfers', value: 'token' },
				],
				default: ['incoming', 'outgoing'],
			},
			// Token Transfer fields
			{
				displayName: 'Token Address',
				name: 'tokenAddress',
				type: 'string',
				displayOptions: {
					show: {
						event: ['tokenTransfer'],
					},
				},
				default: '',
				placeholder: '0x... (leave empty for all tokens)',
				description: 'Specific token address to monitor (optional)',
			},
			{
				displayName: 'From Address',
				name: 'tokenFromAddress',
				type: 'string',
				displayOptions: {
					show: {
						event: ['tokenTransfer'],
					},
				},
				default: '',
				placeholder: '0x... (leave empty for any)',
				description: 'Filter by sender address (optional)',
			},
			{
				displayName: 'To Address',
				name: 'tokenToAddress',
				type: 'string',
				displayOptions: {
					show: {
						event: ['tokenTransfer'],
					},
				},
				default: '',
				placeholder: '0x... (leave empty for any)',
				description: 'Filter by recipient address (optional)',
			},
			// NFT Transfer fields
			{
				displayName: 'NFT Contract',
				name: 'nftContract',
				type: 'string',
				displayOptions: {
					show: {
						event: ['nftTransfer'],
					},
				},
				default: '',
				placeholder: '0x... (leave empty for all NFTs)',
				description: 'Specific NFT contract to monitor (optional)',
			},
			{
				displayName: 'Token ID',
				name: 'nftTokenId',
				type: 'string',
				displayOptions: {
					show: {
						event: ['nftTransfer'],
					},
				},
				default: '',
				placeholder: 'Token ID (leave empty for all)',
				description: 'Specific token ID to monitor (optional)',
			},
			// New Transaction fields
			{
				displayName: 'Filter',
				name: 'txFilter',
				type: 'options',
				displayOptions: {
					show: {
						event: ['newTransaction'],
					},
				},
				options: [
					{ name: 'All Transactions', value: 'all' },
					{ name: 'Only Value Transfers', value: 'value' },
					{ name: 'Only Contract Calls', value: 'contract' },
					{ name: 'Only Contract Creations', value: 'creation' },
				],
				default: 'all',
			},
			{
				displayName: 'Min Value (MONAD)',
				name: 'minValue',
				type: 'number',
				displayOptions: {
					show: {
						event: ['newTransaction'],
					},
				},
				default: 0,
				description: 'Minimum transaction value in MONAD',
			},
			// Additional options
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Include Full Data',
						name: 'includeFullData',
						type: 'boolean',
						default: true,
						description: 'Whether to include full transaction/block data',
					},
					{
						displayName: 'Confirmations',
						name: 'confirmations',
						type: 'number',
						default: 0,
						description: 'Number of confirmations to wait before triggering',
					},
					{
						displayName: 'Retry on Disconnect',
						name: 'retryOnDisconnect',
						type: 'boolean',
						default: true,
						description: 'Whether to automatically reconnect on disconnect',
					},
				],
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const event = this.getNodeParameter('event') as string;
		const options = this.getNodeParameter('options', {}) as {
			includeFullData?: boolean;
			confirmations?: number;
			retryOnDisconnect?: boolean;
		};

		const credentials = await this.getCredentials('monadNetwork');
		const wsUrl = (credentials.wsUrl as string) || 'wss://testnet-rpc.monad.xyz/ws';

		const subscriber = new HighSpeedSubscriber(wsUrl);

		const emit = (data: unknown) => {
			this.emit([this.helpers.returnJsonArray([data as Record<string, unknown>])]);
		};

		// Event topic signatures
		const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
		const ERC721_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
		const ERC1155_SINGLE_TOPIC = '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62';
		const ERC1155_BATCH_TOPIC = '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb';

		switch (event) {
			case 'newBlock': {
				await subscriber.subscribeToBlocks(async (blockNumber: string) => {
					const blockData: Record<string, unknown> = {
						blockNumber: parseInt(blockNumber, 16),
						blockNumberHex: blockNumber,
						timestamp: Date.now(),
					};

					if (options.includeFullData) {
						// Fetch full block data
						try {
							const block = await subscriber.getBlock(blockNumber);
							Object.assign(blockData, block);
						} catch {
							// Continue with basic data
						}
					}

					emit(blockData);
				});
				break;
			}

			case 'newTransaction': {
				const txFilter = this.getNodeParameter('txFilter', 'all') as string;
				const minValue = this.getNodeParameter('minValue', 0) as number;
				const minValueWei = BigInt(Math.floor(minValue * 1e18));

				await subscriber.subscribeToPendingTransactions(async (txHash: string) => {
					try {
						const tx = await subscriber.getTransaction(txHash);
						if (!tx) return;

						// Apply filters
						if (txFilter === 'value' && tx.input !== '0x') return;
						if (txFilter === 'contract' && tx.input === '0x') return;
						if (txFilter === 'creation' && tx.to !== null) return;

						if (minValueWei > 0n) {
							const txValue = BigInt(tx.value || '0');
							if (txValue < minValueWei) return;
						}

						emit({
							type: 'pending_transaction',
							...tx,
						});
					} catch {
						// Transaction might not be available yet
					}
				});
				break;
			}

			case 'contractEvent': {
				const contractAddress = normalizeAddress(
					this.getNodeParameter('contractAddress') as string
				);
				const eventSignature = this.getNodeParameter('eventSignature', '') as string;
				const topicsJson = this.getNodeParameter('eventTopics', '[]') as string;

				let topics: (string | null)[] = [];
				try {
					topics = JSON.parse(topicsJson);
				} catch {
					throw new NodeOperationError(this.getNode(), 'Invalid JSON in event topics');
				}

				// Add event signature topic if provided
				if (eventSignature) {
					const sigBytes = new TextEncoder().encode(eventSignature);
					// Simple keccak placeholder - in production use proper keccak256
					const sigTopic = '0x' + Array.from(sigBytes).map(b => b.toString(16).padStart(2, '0')).join('').padEnd(64, '0');
					topics = [sigTopic, ...topics];
				}

				await subscriber.subscribeToLogs(
					contractAddress,
					topics.length > 0 ? topics : undefined,
					(log) => {
						emit({
							type: 'contract_event',
							...log,
						});
					}
				);
				break;
			}

			case 'addressActivity': {
				const watchAddress = normalizeAddress(
					this.getNodeParameter('watchAddress') as string
				);
				const activityTypes = this.getNodeParameter('activityTypes', ['incoming', 'outgoing']) as string[];

				await subscriber.subscribeToPendingTransactions(async (txHash: string) => {
					try {
						const tx = await subscriber.getTransaction(txHash);
						if (!tx) return;

						const isIncoming = tx.to?.toLowerCase() === watchAddress;
						const isOutgoing = tx.from?.toLowerCase() === watchAddress;

						if (isIncoming && activityTypes.includes('incoming')) {
							emit({ type: 'incoming', ...tx });
						} else if (isOutgoing && activityTypes.includes('outgoing')) {
							emit({ type: 'outgoing', ...tx });
						}
					} catch {
						// Continue
					}
				});

				// Also subscribe to logs for token transfers
				if (activityTypes.includes('token')) {
					const paddedAddress = '0x000000000000000000000000' + watchAddress.slice(2);
					
					// Monitor as recipient
					await subscriber.subscribeToLogs(
						undefined,
						[TRANSFER_TOPIC, null, paddedAddress],
						(log) => {
							emit({ type: 'token_received', ...log });
						}
					);

					// Monitor as sender
					await subscriber.subscribeToLogs(
						undefined,
						[TRANSFER_TOPIC, paddedAddress, null],
						(log) => {
							emit({ type: 'token_sent', ...log });
						}
					);
				}
				break;
			}

			case 'tokenTransfer': {
				const tokenAddress = this.getNodeParameter('tokenAddress', '') as string;
				const fromAddress = this.getNodeParameter('tokenFromAddress', '') as string;
				const toAddress = this.getNodeParameter('tokenToAddress', '') as string;

				const topics: (string | null)[] = [TRANSFER_TOPIC];

				if (fromAddress) {
					const paddedFrom = '0x000000000000000000000000' + normalizeAddress(fromAddress).slice(2);
					topics.push(paddedFrom);
				} else {
					topics.push(null);
				}

				if (toAddress) {
					const paddedTo = '0x000000000000000000000000' + normalizeAddress(toAddress).slice(2);
					topics.push(paddedTo);
				}

				const contractFilter = tokenAddress ? normalizeAddress(tokenAddress) : undefined;

				await subscriber.subscribeToLogs(
					contractFilter,
					topics,
					(log) => {
						// Parse transfer data
						const from = '0x' + log.topics[1]?.slice(26);
						const to = '0x' + log.topics[2]?.slice(26);
						const value = log.data !== '0x' ? BigInt(log.data).toString() : '0';

						emit({
							type: 'token_transfer',
							contract: log.address,
							from,
							to,
							value,
							...log,
						});
					}
				);
				break;
			}

			case 'nftTransfer': {
				const nftContract = this.getNodeParameter('nftContract', '') as string;
				const tokenId = this.getNodeParameter('nftTokenId', '') as string;

				const contractFilter = nftContract ? normalizeAddress(nftContract) : undefined;

				// ERC-721 Transfer
				await subscriber.subscribeToLogs(
					contractFilter,
					[ERC721_TRANSFER_TOPIC],
					(log) => {
						if (log.topics.length !== 4) return; // ERC-721 has 4 topics
						
						const from = '0x' + log.topics[1]?.slice(26);
						const to = '0x' + log.topics[2]?.slice(26);
						const nftTokenId = BigInt(log.topics[3] || '0').toString();

						if (tokenId && nftTokenId !== tokenId) return;

						emit({
							type: 'nft_transfer',
							standard: 'ERC-721',
							contract: log.address,
							from,
							to,
							tokenId: nftTokenId,
							...log,
						});
					}
				);

				// ERC-1155 Single Transfer
				await subscriber.subscribeToLogs(
					contractFilter,
					[ERC1155_SINGLE_TOPIC],
					(log) => {
						const operator = '0x' + log.topics[1]?.slice(26);
						const from = '0x' + log.topics[2]?.slice(26);
						const to = '0x' + log.topics[3]?.slice(26);
						
						// Decode data for tokenId and amount
						const data = log.data.slice(2);
						const nftTokenId = BigInt('0x' + data.slice(0, 64)).toString();
						const amount = BigInt('0x' + data.slice(64, 128)).toString();

						if (tokenId && nftTokenId !== tokenId) return;

						emit({
							type: 'nft_transfer',
							standard: 'ERC-1155',
							contract: log.address,
							operator,
							from,
							to,
							tokenId: nftTokenId,
							amount,
							...log,
						});
					}
				);

				// ERC-1155 Batch Transfer
				await subscriber.subscribeToLogs(
					contractFilter,
					[ERC1155_BATCH_TOPIC],
					(log) => {
						emit({
							type: 'nft_batch_transfer',
							standard: 'ERC-1155',
							contract: log.address,
							rawData: log.data,
							...log,
						});
					}
				);
				break;
			}

			case 'blockFinality': {
				// Subscribe to blocks and check finality
				await subscriber.subscribeToBlocks(async (blockNumber: string) => {
					const blockNum = parseInt(blockNumber, 16);
					
					// Wait for confirmations
					const confirmations = options.confirmations || 1;
					
					setTimeout(async () => {
						try {
							const currentBlock = await subscriber.getBlockNumber();
							const currentBlockNum = parseInt(currentBlock, 16);
							
							if (currentBlockNum >= blockNum + confirmations) {
								const block = await subscriber.getBlock(blockNumber);
								emit({
									type: 'block_finalized',
									blockNumber: blockNum,
									confirmations,
									...block,
								});
							}
						} catch {
							// Continue
						}
					}, confirmations * 500); // Estimate ~500ms per block on Monad
				});
				break;
			}

			default:
				throw new NodeOperationError(this.getNode(), `Unknown event type: ${event}`);
		}

		// Connect and start listening
		await subscriber.connect();

		// Return cleanup function
		const closeFunction = async () => {
			await subscriber.disconnect();
		};

		return {
			closeFunction,
		};
	}
}
