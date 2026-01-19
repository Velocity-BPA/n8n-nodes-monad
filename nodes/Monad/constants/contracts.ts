/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Common contract addresses on Monad networks
 * Note: These are placeholder addresses - update with actual deployed addresses
 */

export interface ContractAddresses {
  multicall3: string;
  wmonad: string;
  staking: string;
  governance: string;
  governanceTimelock: string;
  entryPoint: string;
  accountFactory: string;
}

export const CONTRACT_ADDRESSES: Record<string, ContractAddresses> = {
  mainnet: {
    multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
    wmonad: '0x0000000000000000000000000000000000000000', // Placeholder
    staking: '0x0000000000000000000000000000000000000000', // Placeholder
    governance: '0x0000000000000000000000000000000000000000', // Placeholder
    governanceTimelock: '0x0000000000000000000000000000000000000000', // Placeholder
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', // ERC-4337 EntryPoint
    accountFactory: '0x0000000000000000000000000000000000000000', // Placeholder
  },
  testnet: {
    multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
    wmonad: '0x0000000000000000000000000000000000000000', // Placeholder
    staking: '0x0000000000000000000000000000000000000000', // Placeholder
    governance: '0x0000000000000000000000000000000000000000', // Placeholder
    governanceTimelock: '0x0000000000000000000000000000000000000000', // Placeholder
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    accountFactory: '0x0000000000000000000000000000000000000000', // Placeholder
  },
  devnet: {
    multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
    wmonad: '0x0000000000000000000000000000000000000000', // Placeholder
    staking: '0x0000000000000000000000000000000000000000', // Placeholder
    governance: '0x0000000000000000000000000000000000000000', // Placeholder
    governanceTimelock: '0x0000000000000000000000000000000000000000', // Placeholder
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    accountFactory: '0x0000000000000000000000000000000000000000', // Placeholder
  },
};

export function getContractAddresses(network: string): ContractAddresses {
  return CONTRACT_ADDRESSES[network] || CONTRACT_ADDRESSES.testnet;
}

// Standard ABIs for common operations
export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

export const ERC721_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function approve(address to, uint256 tokenId)',
  'function setApprovalForAll(address operator, bool approved)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
];

export const ERC1155_ABI = [
  'function uri(uint256 id) view returns (string)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address account, address operator) view returns (bool)',
  'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
  'function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)',
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
  'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
  'event ApprovalForAll(address indexed account, address indexed operator, bool approved)',
  'event URI(string value, uint256 indexed id)',
];

export const MULTICALL3_ABI = [
  'function aggregate(tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes[] returnData)',
  'function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)',
  'function aggregate3Value(tuple(address target, bool allowFailure, uint256 value, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)',
  'function blockAndAggregate(tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes32 blockHash, tuple(bool success, bytes returnData)[] returnData)',
  'function getBasefee() view returns (uint256 basefee)',
  'function getBlockHash(uint256 blockNumber) view returns (bytes32 blockHash)',
  'function getBlockNumber() view returns (uint256 blockNumber)',
  'function getChainId() view returns (uint256 chainid)',
  'function getCurrentBlockCoinbase() view returns (address coinbase)',
  'function getCurrentBlockDifficulty() view returns (uint256 difficulty)',
  'function getCurrentBlockGasLimit() view returns (uint256 gaslimit)',
  'function getCurrentBlockTimestamp() view returns (uint256 timestamp)',
  'function getEthBalance(address addr) view returns (uint256 balance)',
  'function getLastBlockHash() view returns (bytes32 blockHash)',
  'function tryAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)',
  'function tryBlockAndAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes32 blockHash, tuple(bool success, bytes returnData)[] returnData)',
];

export const STAKING_ABI = [
  'function stake() payable',
  'function stake(uint256 amount)',
  'function unstake(uint256 amount)',
  'function withdraw()',
  'function claimRewards()',
  'function delegate(address validator)',
  'function undelegate(address validator, uint256 amount)',
  'function redelegate(address fromValidator, address toValidator, uint256 amount)',
  'function getStakedBalance(address account) view returns (uint256)',
  'function getPendingRewards(address account) view returns (uint256)',
  'function getDelegation(address delegator, address validator) view returns (uint256)',
  'function getValidators() view returns (address[])',
  'function getValidatorInfo(address validator) view returns (tuple(uint256 stake, uint256 commission, bool active))',
  'function getAPY() view returns (uint256)',
  'function getUnbondingInfo(address account) view returns (tuple(uint256 amount, uint256 unlockTime)[])',
  'event Staked(address indexed user, uint256 amount)',
  'event Unstaked(address indexed user, uint256 amount)',
  'event RewardsClaimed(address indexed user, uint256 amount)',
  'event Delegated(address indexed delegator, address indexed validator, uint256 amount)',
];

export const GOVERNANCE_ABI = [
  'function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256 proposalId)',
  'function castVote(uint256 proposalId, uint8 support) returns (uint256 balance)',
  'function castVoteWithReason(uint256 proposalId, uint8 support, string reason) returns (uint256 balance)',
  'function queue(uint256 proposalId)',
  'function execute(uint256 proposalId)',
  'function cancel(uint256 proposalId)',
  'function getVotes(address account, uint256 blockNumber) view returns (uint256)',
  'function delegate(address delegatee)',
  'function delegates(address account) view returns (address)',
  'function proposalCount() view returns (uint256)',
  'function proposals(uint256 proposalId) view returns (tuple(uint256 id, address proposer, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed))',
  'function state(uint256 proposalId) view returns (uint8)',
  'function hasVoted(uint256 proposalId, address account) view returns (bool)',
  'function getReceipt(uint256 proposalId, address voter) view returns (tuple(bool hasVoted, uint8 support, uint256 votes))',
  'event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)',
  'event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)',
  'event ProposalExecuted(uint256 proposalId)',
  'event ProposalCanceled(uint256 proposalId)',
];

export const ENTRY_POINT_ABI = [
  'function handleOps(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)[] ops, address beneficiary) payable',
  'function getUserOpHash(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature) userOp) view returns (bytes32)',
  'function getNonce(address sender, uint192 key) view returns (uint256 nonce)',
  'function depositTo(address account) payable',
  'function balanceOf(address account) view returns (uint256)',
  'function getDepositInfo(address account) view returns (tuple(uint112 deposit, bool staked, uint112 stake, uint32 unstakeDelaySec, uint48 withdrawTime))',
  'event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)',
  'event UserOperationRevertReason(bytes32 indexed userOpHash, address indexed sender, uint256 nonce, bytes revertReason)',
];
