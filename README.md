# n8n-nodes-monad

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for interacting with the **Monad blockchain** - the high-performance EVM-compatible Layer 1 blockchain with parallel execution capabilities supporting 10,000+ TPS.

[![License: BSL 1.1](https://img.shields.io/badge/license-BSL--1.1-blue)](LICENSE)
[![n8n Community Node](https://img.shields.io/badge/n8n-Community%20Node-orange)](https://n8n.io)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

## Features

### Core Blockchain Operations
- **Account Management**: Balance queries, nonce tracking, transaction history
- **Transactions**: Send, track, and manage blockchain transactions with gas optimization
- **Smart Contracts**: Deploy, read, and write to smart contracts with full ABI support
- **Block Data**: Query blocks, finality status, and blockchain state

### Token Operations
- **ERC-20 Tokens**: Transfer, approve, balance checks, allowances, metadata
- **NFTs (ERC-721/1155)**: Mint, transfer, metadata, ownership queries, batch operations
- **DeFi Integration**: DEX interactions, liquidity pools, token swaps, yield farming

### Monad-Specific Features
- **Parallel Execution Analysis**: Analyze transaction parallelizability, conflict detection
- **MonadBFT Consensus**: Validator info, finality tracking, consensus state
- **MonadDB State**: Direct state access, storage proofs, state diffs
- **High-Performance Metrics**: TPS analysis, network performance monitoring

### Advanced Capabilities
- **Account Abstraction (ERC-4337)**: User operations, bundler integration
- **Multicall3**: Batched contract calls for efficiency
- **Mempool Monitoring**: Pending transaction analysis
- **The Graph Integration**: Subgraph queries for indexed data

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** → **Community Nodes**
3. Click **Install**
4. Enter `n8n-nodes-monad`
5. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n installation directory
cd ~/.n8n

# Install the package
npm install n8n-nodes-monad

# Restart n8n
```

### Development Installation

```bash
# Extract the zip file
unzip n8n-nodes-monad.zip
cd n8n-nodes-monad

# Install dependencies
npm install

# Build the project
npm run build

# Create symlink to n8n custom nodes directory
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-monad

# Restart n8n
n8n start
```

## Credentials Setup

### Monad Network (Required)

Configure your connection to the Monad network:

| Field | Description | Example |
|-------|-------------|---------|
| Network | Network selection | Mainnet, Testnet, Devnet, Custom |
| RPC URL | JSON-RPC endpoint | `https://testnet-rpc.monad.xyz` |
| WebSocket URL | WebSocket endpoint for subscriptions | `wss://testnet-rpc.monad.xyz/ws` |
| Private Key | Wallet private key for signing | `0x...` (keep secure!) |
| Chain ID | Network chain ID | Auto-detected or custom |

### Monad API (Optional)

Additional API services for enhanced features:

| Field | Description |
|-------|-------------|
| API Key | API key for premium services |
| Explorer API Key | Block explorer API access |

## Resources & Operations

### Account
- `getBalance` - Get native MONAD balance
- `getTransactionCount` - Get account nonce
- `getCode` - Check if address is contract
- `getTransactionHistory` - List account transactions

### Transaction
- `sendTransaction` - Send native MONAD transfer
- `getTransaction` - Get transaction details
- `getTransactionReceipt` - Get transaction receipt
- `waitForTransaction` - Wait for confirmation
- `estimateGas` - Estimate gas for transaction
- `speedUp` - Speed up pending transaction
- `cancel` - Cancel pending transaction

### Token (ERC-20)
- `getBalance` - Get token balance
- `transfer` - Transfer tokens
- `approve` - Approve spender
- `getAllowance` - Check allowance
- `getTokenInfo` - Get token metadata
- `transferFrom` - Transfer on behalf

### NFT (ERC-721/1155)
- `getOwner` - Get NFT owner
- `getBalance` - Get NFT balance
- `transfer` - Transfer NFT
- `getTokenUri` - Get metadata URI
- `getApproved` - Check approvals
- `approve` - Approve operator

### Contract
- `readContract` - Call view function
- `writeContract` - Execute state-changing function
- `deployContract` - Deploy new contract
- `getCode` - Get contract bytecode
- `getStorageAt` - Read storage slot
- `verifyContract` - Verify on explorer

### Block
- `getBlock` - Get block by number/hash
- `getBlockNumber` - Get latest block
- `getBlockWithTransactions` - Block with full tx data
- `getFinalizedBlock` - Get finalized block
- `checkFinality` - Check if block is final

### Event
- `getLogs` - Query event logs
- `decodeLog` - Decode log data
- `getContractEvents` - Get contract's events
- `getTransferEvents` - ERC-20 transfers
- `getApprovalEvents` - ERC-20 approvals

### Parallel Execution
- `analyzeTransactions` - Analyze parallelizability
- `createBatches` - Create optimal batches
- `getStats` - Execution statistics
- `analyzeConflicts` - Detect conflicts
- `estimateTps` - Estimate throughput

### MonadDB
- `getAccountState` - Get full account state
- `getStorage` - Read storage
- `getStorageRange` - Bulk storage read
- `getStateProof` - Generate Merkle proof
- `getStateDiff` - State changes between blocks
- `verifyProof` - Verify state proof

### Consensus
- `getValidatorSet` - Current validators
- `getValidatorInfo` - Validator details
- `getCurrentProposer` - Current block proposer
- `getConsensusState` - BFT state
- `getFinalityStatus` - Finality info

### Gas
- `getGasPrice` - Current gas price
- `getFeeData` - EIP-1559 fee data
- `getGasOracle` - Gas price tiers
- `estimateGas` - Estimate for transaction
- `getHistoricalGas` - Historical prices

### Staking
- `stake` - Stake MONAD tokens
- `unstake` - Unstake tokens
- `claimRewards` - Claim staking rewards
- `getStakingInfo` - Get staking position
- `delegate` - Delegate to validator
- `redelegate` - Move delegation

### Governance
- `getProposal` - Get proposal details
- `getProposals` - List proposals
- `createProposal` - Create new proposal
- `castVote` - Vote on proposal
- `getVotingPower` - Check voting power
- `executeProposal` - Execute passed proposal

### DeFi
- `getTokenPrice` - Get token price
- `getPoolInfo` - Liquidity pool info
- `getReserves` - Pool reserves
- `approveToken` - Approve for DEX
- `wrapMonad` - Wrap to WMONAD
- `unwrapWmonad` - Unwrap to MONAD

### Multicall
- `aggregate` - Batch calls (revert all on fail)
- `tryAggregate` - Batch with failure tolerance
- `aggregate3` - Advanced batching
- `batchBalanceQuery` - Batch balance checks
- `batchTokenQuery` - Batch token queries

### Account Abstraction
- `getUserOperation` - Get user operation
- `sendUserOperation` - Submit to bundler
- `estimateUserOpGas` - Estimate gas
- `getNonce` - Get AA nonce
- `getDeposit` - Get paymaster deposit
- `getSupportedEntryPoints` - List entry points

### Mempool
- `getPendingTransactions` - Pending txs
- `getPoolStatus` - Mempool stats
- `watchPending` - Monitor mempool
- `getTransactionByHash` - Get pending tx
- `analyzeMempoolGas` - Gas analysis

### Debugging
- `traceTransaction` - Full execution trace
- `traceCall` - Trace call without sending
- `debugBlock` - Debug entire block
- `getStorageProof` - Storage with proof
- `replayTransaction` - Replay historical tx

### Performance
- `getNetworkStats` - Network metrics
- `getBlockStats` - Block statistics
- `getTpsHistory` - TPS over time
- `getLatencyStats` - RPC latency
- `benchmarkRpc` - Benchmark endpoint

### Analytics
- `getAddressAnalytics` - Address metrics
- `getTokenAnalytics` - Token metrics
- `getContractAnalytics` - Contract usage
- `getNetworkAnalytics` - Network health
- `getGasAnalytics` - Gas trends

### Subgraph
- `querySubgraph` - GraphQL query
- `getStatus` - Indexing status
- `getEntity` - Get by ID
- `listEntities` - List with filters
- `getTokenData` - DEX token data
- `getPoolData` - Pool analytics
- `getSwapHistory` - Swap history
- `getUserPositions` - DeFi positions

### Utility
- `convertUnits` - Wei/Gwei/Ether conversion
- `validateAddress` - Address validation
- `hashData` - Keccak256 hashing
- `encodeData` - ABI encoding
- `decodeData` - ABI decoding
- `hexToNumber` - Hex conversion
- `functionSelector` - Compute selector
- `eventTopic` - Compute topic

## Trigger Node

The **Monad Trigger** node enables real-time event subscriptions:

- **New Block** - Trigger on each new block
- **New Transaction** - Monitor pending transactions
- **Contract Event** - Subscribe to specific contract events
- **Address Activity** - Monitor address activity
- **Token Transfer** - ERC-20 transfer events
- **NFT Transfer** - ERC-721/1155 transfers
- **Block Finality** - Trigger on block finalization

## Usage Examples

### Get Account Balance
```json
{
  "resource": "account",
  "operation": "getBalance",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f5bB0b"
}
```

### Send Token Transfer
```json
{
  "resource": "token",
  "operation": "transfer",
  "tokenAddress": "0xTokenContractAddress",
  "to": "0xRecipientAddress",
  "amount": "100"
}
```

### Analyze Parallel Execution
```json
{
  "resource": "parallelExecution",
  "operation": "analyzeTransactions",
  "blockNumber": 12345678
}
```

### Query Subgraph
```json
{
  "resource": "subgraph",
  "operation": "querySubgraph",
  "subgraphUrl": "https://api.thegraph.com/subgraphs/name/...",
  "query": "{ tokens(first: 10) { id symbol name } }"
}
```

## Monad Blockchain Concepts

### Parallel Execution
Monad's architecture enables parallel transaction execution by detecting non-conflicting transactions and processing them simultaneously. This node provides tools to analyze parallelizability and optimize transaction batching.

### MonadBFT Consensus
Monad uses a Byzantine Fault Tolerant consensus mechanism with fast finality. The consensus operations allow monitoring validator sets and finality status.

### MonadDB
Monad's custom state database enables efficient state access and proof generation. State operations provide direct access to account and storage data with Merkle proofs.

## Networks

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Mainnet | TBA | `https://rpc.monad.xyz` |
| Testnet | 10143 | `https://testnet-rpc.monad.xyz` |
| Devnet | 41454 | `https://devnet-rpc.monad.xyz` |

## Error Handling

The node provides detailed error messages for common issues:

- **Connection Errors**: RPC endpoint unreachable
- **Authentication Errors**: Invalid credentials or API keys
- **Transaction Errors**: Insufficient funds, nonce issues, gas estimation failures
- **Contract Errors**: Revert reasons, invalid function calls

## Security Best Practices

1. **Private Keys**: Never expose private keys in workflows. Use n8n credentials.
2. **RPC Endpoints**: Use authenticated endpoints for production.
3. **Transaction Signing**: All signing happens locally; keys never leave n8n.
4. **Input Validation**: Addresses and amounts are validated before transactions.

## Development

```bash
# Build the project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Watch mode for development
npm run dev
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Support

- **Documentation**: [Monad Docs](https://docs.monad.xyz)
- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-monad/issues)
- **Licensing**: licensing@velobpa.com

## Acknowledgments

- [Monad Labs](https://monad.xyz) for the high-performance EVM blockchain
- [n8n](https://n8n.io) for the workflow automation platform
- [ethers.js](https://docs.ethers.org) for Ethereum interaction library
