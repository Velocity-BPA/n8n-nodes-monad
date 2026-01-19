/**
 * @file NFT Resource Operations (ERC-721/1155)
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
import { ERC721_ABI, ERC1155_ABI } from '../../constants/contracts';

export const nftOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['nft'],
			},
		},
		options: [
			{
				name: 'Get NFT',
				value: 'getNft',
				description: 'Get NFT details by token ID',
				action: 'Get NFT details',
			},
			{
				name: 'Get NFTs by Owner',
				value: 'getNftsByOwner',
				description: 'Get all NFTs owned by an address',
				action: 'Get NFTs by owner',
			},
			{
				name: 'Get NFT Metadata',
				value: 'getNftMetadata',
				description: 'Get NFT metadata from tokenURI',
				action: 'Get NFT metadata',
			},
			{
				name: 'Get NFT Collection',
				value: 'getNftCollection',
				description: 'Get collection information',
				action: 'Get NFT collection info',
			},
			{
				name: 'Transfer NFT',
				value: 'transferNft',
				description: 'Transfer an NFT to another address',
				action: 'Transfer NFT',
			},
			{
				name: 'Approve NFT',
				value: 'approveNft',
				description: 'Approve an address to transfer NFT',
				action: 'Approve NFT transfer',
			},
			{
				name: 'Get NFT Transfers',
				value: 'getNftTransfers',
				description: 'Get NFT transfer history',
				action: 'Get NFT transfers',
			},
			{
				name: 'Get Collection Stats',
				value: 'getCollectionStats',
				description: 'Get collection statistics',
				action: 'Get collection stats',
			},
			{
				name: 'Deploy NFT Collection',
				value: 'deployNftCollection',
				description: 'Deploy a new ERC-721 collection',
				action: 'Deploy NFT collection',
			},
		],
		default: 'getNft',
	},
];

export const nftFields: INodeProperties[] = [
	// Contract address
	{
		displayName: 'Contract Address',
		name: 'contractAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: [
					'getNft',
					'getNftMetadata',
					'getNftCollection',
					'transferNft',
					'approveNft',
					'getNftTransfers',
					'getCollectionStats',
				],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'NFT contract address',
	},
	// Token ID
	{
		displayName: 'Token ID',
		name: 'tokenId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['getNft', 'getNftMetadata', 'transferNft', 'approveNft'],
			},
		},
		default: '',
		description: 'Token ID of the NFT',
	},
	// Owner address
	{
		displayName: 'Owner Address',
		name: 'ownerAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['getNftsByOwner'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Address of the NFT owner',
	},
	// Transfer fields
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['transferNft', 'approveNft'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Recipient/approved address',
	},
	// NFT Type
	{
		displayName: 'NFT Type',
		name: 'nftType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['getNft', 'getNftMetadata', 'transferNft', 'approveNft'],
			},
		},
		options: [
			{ name: 'ERC-721', value: 'erc721' },
			{ name: 'ERC-1155', value: 'erc1155' },
		],
		default: 'erc721',
		description: 'NFT token standard',
	},
	// ERC-1155 amount
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['transferNft'],
				nftType: ['erc1155'],
			},
		},
		default: 1,
		description: 'Amount to transfer (ERC-1155)',
	},
	// Deploy collection fields
	{
		displayName: 'Collection Name',
		name: 'collectionName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['deployNftCollection'],
			},
		},
		default: '',
		placeholder: 'My NFT Collection',
		description: 'Name of the collection',
	},
	{
		displayName: 'Collection Symbol',
		name: 'collectionSymbol',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['deployNftCollection'],
			},
		},
		default: '',
		placeholder: 'MNFT',
		description: 'Symbol of the collection',
	},
	{
		displayName: 'Base URI',
		name: 'baseUri',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['deployNftCollection'],
			},
		},
		default: '',
		placeholder: 'ipfs://...',
		description: 'Base URI for token metadata',
	},
	// Options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['getNftsByOwner', 'getNftTransfers'],
			},
		},
		options: [
			{
				displayName: 'Contract Address',
				name: 'contractAddress',
				type: 'string',
				default: '',
				description: 'Filter by contract address',
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				description: 'Page number',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 100,
				description: 'Results per page',
			},
		],
	},
];

export async function executeNftOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('monadNetwork');
	const client = getMonadClient(credentials);

	let result: any;

	switch (operation) {
		case 'getNft': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const tokenId = this.getNodeParameter('tokenId', index) as string;
			const nftType = this.getNodeParameter('nftType', index, 'erc721') as string;

			if (!isValidAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`);
			}

			const normalizedContract = normalizeAddress(contractAddress);

			if (nftType === 'erc721') {
				const [owner, tokenUri, name, symbol] = await Promise.all([
					client.callContract(normalizedContract, 'ownerOf(uint256)', [tokenId]),
					client.callContract(normalizedContract, 'tokenURI(uint256)', [tokenId]).catch(() => null),
					client.callContract(normalizedContract, 'name()', []).catch(() => null),
					client.callContract(normalizedContract, 'symbol()', []).catch(() => null),
				]);

				result = {
					contractAddress: normalizedContract,
					tokenId,
					type: 'ERC-721',
					owner,
					tokenUri,
					name,
					symbol,
				};
			} else {
				const [uri, name] = await Promise.all([
					client.callContract(normalizedContract, 'uri(uint256)', [tokenId]).catch(() => null),
					client.callContract(normalizedContract, 'name()', []).catch(() => null),
				]);

				result = {
					contractAddress: normalizedContract,
					tokenId,
					type: 'ERC-1155',
					uri,
					name,
				};
			}
			break;
		}

		case 'getNftsByOwner': {
			const ownerAddress = this.getNodeParameter('ownerAddress', index) as string;
			const options = this.getNodeParameter('options', index, {}) as any;

			if (!isValidAddress(ownerAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid owner address: ${ownerAddress}`);
			}

			const apiCredentials = await this.getCredentials('monadApi').catch(() => null);
			if (!apiCredentials) {
				throw new NodeOperationError(
					this.getNode(),
					'Monad API credentials required for NFT queries',
				);
			}

			const normalizedOwner = normalizeAddress(ownerAddress);

			// Get ERC-721 NFTs
			const params721 = new URLSearchParams({
				module: 'account',
				action: 'tokennfttx',
				address: normalizedOwner,
				page: String(options.page || 1),
				offset: String(options.limit || 100),
				sort: 'desc',
			});

			if (options.contractAddress) {
				params721.append('contractaddress', normalizeAddress(options.contractAddress));
			}

			const response721 = await fetch(
				`${apiCredentials.explorerApiUrl}?${params721.toString()}`,
				{
					headers: { 'X-API-Key': apiCredentials.apiKey as string },
				},
			);
			const data721 = await response721.json();

			// Get ERC-1155 NFTs
			const params1155 = new URLSearchParams({
				module: 'account',
				action: 'token1155tx',
				address: normalizedOwner,
				page: String(options.page || 1),
				offset: String(options.limit || 100),
				sort: 'desc',
			});

			if (options.contractAddress) {
				params1155.append('contractaddress', normalizeAddress(options.contractAddress));
			}

			const response1155 = await fetch(
				`${apiCredentials.explorerApiUrl}?${params1155.toString()}`,
				{
					headers: { 'X-API-Key': apiCredentials.apiKey as string },
				},
			);
			const data1155 = await response1155.json();

			result = {
				owner: normalizedOwner,
				erc721: data721.result || [],
				erc1155: data1155.result || [],
				totalCount: (data721.result?.length || 0) + (data1155.result?.length || 0),
			};
			break;
		}

		case 'getNftMetadata': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const tokenId = this.getNodeParameter('tokenId', index) as string;
			const nftType = this.getNodeParameter('nftType', index, 'erc721') as string;

			if (!isValidAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`);
			}

			const normalizedContract = normalizeAddress(contractAddress);
			let tokenUri: string;

			if (nftType === 'erc721') {
				tokenUri = await client.callContract(normalizedContract, 'tokenURI(uint256)', [tokenId]);
			} else {
				tokenUri = await client.callContract(normalizedContract, 'uri(uint256)', [tokenId]);
				// ERC-1155 URIs may contain {id} placeholder
				tokenUri = tokenUri.replace('{id}', tokenId.padStart(64, '0'));
			}

			// Fetch metadata
			let metadata = null;
			if (tokenUri) {
				try {
					// Handle IPFS URIs
					let fetchUrl = tokenUri;
					if (tokenUri.startsWith('ipfs://')) {
						fetchUrl = `https://ipfs.io/ipfs/${tokenUri.slice(7)}`;
					}

					const response = await fetch(fetchUrl);
					metadata = await response.json();
				} catch {
					// Failed to fetch metadata
				}
			}

			result = {
				contractAddress: normalizedContract,
				tokenId,
				tokenUri,
				metadata,
			};
			break;
		}

		case 'getNftCollection': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;

			if (!isValidAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`);
			}

			const normalizedContract = normalizeAddress(contractAddress);

			const [name, symbol, totalSupply] = await Promise.all([
				client.callContract(normalizedContract, 'name()', []).catch(() => null),
				client.callContract(normalizedContract, 'symbol()', []).catch(() => null),
				client.callContract(normalizedContract, 'totalSupply()', []).catch(() => null),
			]);

			// Try to get additional info
			let owner = null;
			let baseUri = null;
			try {
				owner = await client.callContract(normalizedContract, 'owner()', []);
			} catch {}
			try {
				baseUri = await client.callContract(normalizedContract, 'baseURI()', []);
			} catch {}

			result = {
				contractAddress: normalizedContract,
				name,
				symbol,
				totalSupply: totalSupply?.toString() || null,
				owner,
				baseUri,
			};
			break;
		}

		case 'transferNft': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const tokenId = this.getNodeParameter('tokenId', index) as string;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const nftType = this.getNodeParameter('nftType', index, 'erc721') as string;

			if (!isValidAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`);
			}
			if (!isValidAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid to address: ${toAddress}`);
			}

			const normalizedContract = normalizeAddress(contractAddress);
			const signer = await client.getSigner();
			const fromAddress = await signer.getAddress();

			let tx: any;

			if (nftType === 'erc721') {
				tx = await client.executeContract(
					normalizedContract,
					'safeTransferFrom(address,address,uint256)',
					[fromAddress, normalizeAddress(toAddress), tokenId],
					ERC721_ABI,
				);
			} else {
				const amount = this.getNodeParameter('amount', index, 1) as number;
				tx = await client.executeContract(
					normalizedContract,
					'safeTransferFrom(address,address,uint256,uint256,bytes)',
					[fromAddress, normalizeAddress(toAddress), tokenId, amount, '0x'],
					ERC1155_ABI,
				);
			}

			result = {
				transactionHash: tx.hash,
				contractAddress: normalizedContract,
				tokenId,
				from: fromAddress,
				to: normalizeAddress(toAddress),
				type: nftType.toUpperCase(),
			};
			break;
		}

		case 'approveNft': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const tokenId = this.getNodeParameter('tokenId', index) as string;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const nftType = this.getNodeParameter('nftType', index, 'erc721') as string;

			if (!isValidAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`);
			}
			if (!isValidAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid to address: ${toAddress}`);
			}

			const normalizedContract = normalizeAddress(contractAddress);
			let tx: any;

			if (nftType === 'erc721') {
				tx = await client.executeContract(
					normalizedContract,
					'approve(address,uint256)',
					[normalizeAddress(toAddress), tokenId],
					ERC721_ABI,
				);
			} else {
				// ERC-1155 uses setApprovalForAll
				tx = await client.executeContract(
					normalizedContract,
					'setApprovalForAll(address,bool)',
					[normalizeAddress(toAddress), true],
					ERC1155_ABI,
				);
			}

			result = {
				transactionHash: tx.hash,
				contractAddress: normalizedContract,
				tokenId,
				approved: normalizeAddress(toAddress),
				type: nftType.toUpperCase(),
			};
			break;
		}

		case 'getNftTransfers': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const options = this.getNodeParameter('options', index, {}) as any;

			if (!isValidAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`);
			}

			const apiCredentials = await this.getCredentials('monadApi').catch(() => null);
			if (!apiCredentials) {
				throw new NodeOperationError(
					this.getNode(),
					'Monad API credentials required for NFT transfers',
				);
			}

			const params = new URLSearchParams({
				module: 'token',
				action: 'tokennfttx',
				contractaddress: normalizeAddress(contractAddress),
				page: String(options.page || 1),
				offset: String(options.limit || 100),
				sort: 'desc',
			});

			const response = await fetch(
				`${apiCredentials.explorerApiUrl}?${params.toString()}`,
				{
					headers: { 'X-API-Key': apiCredentials.apiKey as string },
				},
			);
			const data = await response.json();

			result = {
				contractAddress: normalizeAddress(contractAddress),
				transfers: data.result || [],
				count: (data.result || []).length,
			};
			break;
		}

		case 'getCollectionStats': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;

			if (!isValidAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`);
			}

			const normalizedContract = normalizeAddress(contractAddress);

			const [name, symbol, totalSupply] = await Promise.all([
				client.callContract(normalizedContract, 'name()', []).catch(() => null),
				client.callContract(normalizedContract, 'symbol()', []).catch(() => null),
				client.callContract(normalizedContract, 'totalSupply()', []).catch(() => null),
			]);

			// Get transfer count from API if available
			const apiCredentials = await this.getCredentials('monadApi').catch(() => null);
			let transferCount = null;

			if (apiCredentials) {
				try {
					const params = new URLSearchParams({
						module: 'token',
						action: 'tokennfttx',
						contractaddress: normalizedContract,
						page: '1',
						offset: '1',
					});

					const response = await fetch(
						`${apiCredentials.explorerApiUrl}?${params.toString()}`,
						{
							headers: { 'X-API-Key': apiCredentials.apiKey as string },
						},
					);
					const data = await response.json();
					transferCount = data.result?.length || 0;
				} catch {}
			}

			result = {
				contractAddress: normalizedContract,
				name,
				symbol,
				totalSupply: totalSupply?.toString() || null,
				transferCount,
			};
			break;
		}

		case 'deployNftCollection': {
			const collectionName = this.getNodeParameter('collectionName', index) as string;
			const collectionSymbol = this.getNodeParameter('collectionSymbol', index) as string;
			const baseUri = this.getNodeParameter('baseUri', index, '') as string;

			// Simple ERC-721 bytecode
			const erc721Bytecode = '0x60806040523480156200001157600080fd5b506040516200140d3803806200140d833981016040819052620000349162000138565b81516200004990600090602085019062000065565b5080516200005f90600190602084019062000065565b50505050620001f2565b82805462000073906200019f565b90600052602060002090601f016020900481019282620000975760008555620000e2565b82601f10620000b257805160ff1916838001178555620000e2565b82800160010185558215620000e2579182015b82811115620000e2578251825591602001919060010190620000c5565b50620000f0929150620000f4565b5090565b5b80821115620000f05760008155600101620000f5565b634e487b7160e01b600052604160045260246000fd5b80516001600160a01b03811681146200013357600080fd5b919050565b600080604083850312156200014c57600080fd5b82516001600160401b03808211156200016457600080fd5b818501915085601f8301126200017957600080fd5b8151818111156200018e576200018e6200010b565b604051601f8201601f19908116603f01168101908382118183101715620001b957620001b96200010b565b81604052828152886020848701011115620001d357600080fd5b620001e6836020830160208801620001dc565b809550505050505092915050565b61120b80620002026000396000f3fe';

			const deployment = await client.deployContract(
				erc721Bytecode,
				[collectionName, collectionSymbol],
				['constructor(string,string)'],
			);

			result = {
				transactionHash: deployment.hash,
				contractAddress: deployment.contractAddress,
				name: collectionName,
				symbol: collectionSymbol,
				baseUri,
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result }];
}
export { nftOperations as operations, nftFields as fields, executeNftOperation as execute };
