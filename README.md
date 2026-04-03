# n8n-nodes-monad

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for Monad blockchain integration with 6 resources covering accounts, transactions, blocks, network operations, smart contracts, and staking functionality.

![n8n Community Node](https://img.shields.io/badge/n8n-Community%20Node-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Blockchain](https://img.shields.io/badge/Blockchain-Monad-purple)
![EVM](https://img.shields.io/badge/EVM-Compatible-green)
![Web3](https://img.shields.io/badge/Web3-Integration-orange)

## Features

- **Account Management** - Retrieve account balances, transaction history, and account details
- **Transaction Operations** - Send transactions, query transaction status, and estimate gas fees
- **Block Explorer** - Access block data, block headers, and blockchain statistics
- **Network Monitoring** - Check network status, node health, and consensus information
- **Smart Contract Integration** - Deploy, interact with, and monitor smart contracts
- **Staking Operations** - Manage staking positions, rewards, and validator information
- **Real-time Updates** - Subscribe to blockchain events and transaction confirmations
- **Gas Optimization** - Automatic gas estimation and transaction fee optimization

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** → **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-monad`
5. Click **Install**

### Manual Installation

```bash
cd ~/.n8n
npm install n8n-nodes-monad
```

### Development Installation

```bash
git clone https://github.com/Velocity-BPA/n8n-nodes-monad.git
cd n8n-nodes-monad
npm install
npm run build
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-monad
n8n start
```

## Credentials Setup

| Field | Description | Required |
|-------|-------------|----------|
| API Key | Your Monad API access key | Yes |
| Network | Target network (mainnet/testnet) | Yes |
| Endpoint URL | Custom RPC endpoint (optional) | No |

## Resources & Operations

### 1. Account

| Operation | Description |
|-----------|-------------|
| Get Balance | Retrieve account balance and token holdings |
| Get Transaction History | Fetch transaction history for an account |
| Get Account Info | Get detailed account information and metadata |
| Create Account | Generate new account addresses and keys |

### 2. Transaction

| Operation | Description |
|-----------|-------------|
| Send Transaction | Submit transactions to the Monad network |
| Get Transaction | Retrieve transaction details by hash |
| Get Transaction Receipt | Fetch transaction receipt and status |
| Estimate Gas | Calculate gas costs for transactions |
| Get Transaction Count | Get nonce for account transactions |

### 3. Block

| Operation | Description |
|-----------|-------------|
| Get Block | Retrieve block data by number or hash |
| Get Latest Block | Fetch the most recent block information |
| Get Block Range | Get multiple blocks within a specified range |
| Get Block Transactions | List all transactions in a specific block |

### 4. Network

| Operation | Description |
|-----------|-------------|
| Get Network Info | Retrieve network status and chain information |
| Get Peer Count | Get number of connected peers |
| Get Gas Price | Fetch current network gas prices |
| Get Chain ID | Retrieve the network chain identifier |
| Check Sync Status | Monitor node synchronization status |

### 5. SmartContract

| Operation | Description |
|-----------|-------------|
| Deploy Contract | Deploy smart contracts to the network |
| Call Method | Execute read-only contract methods |
| Send Transaction | Execute state-changing contract methods |
| Get Contract Code | Retrieve deployed contract bytecode |
| Get Events | Query contract event logs |

### 6. Staking

| Operation | Description |
|-----------|-------------|
| Stake Tokens | Delegate tokens to validators |
| Unstake Tokens | Withdraw staked tokens |
| Get Staking Info | Retrieve staking position details |
| Claim Rewards | Collect staking rewards |
| Get Validators | List active validators and their information |

## Usage Examples

```javascript
// Get account balance
{
  "resource": "Account",
  "operation": "Get Balance",
  "address": "0x742d35Cc6636C0532925a3b8D4b9EE0dbA9B3476"
}
```

```javascript
// Send a transaction
{
  "resource": "Transaction", 
  "operation": "Send Transaction",
  "to": "0x742d35Cc6636C0532925a3b8D4b9EE0dbA9B3476",
  "value": "1000000000000000000",
  "gasLimit": "21000"
}
```

```javascript
// Get latest block information
{
  "resource": "Block",
  "operation": "Get Latest Block",
  "includeTransactions": true
}
```

```javascript
// Stake tokens to validator
{
  "resource": "Staking",
  "operation": "Stake Tokens",
  "validator": "0xvalidator123...",
  "amount": "10000000000000000000"
}
```

## Error Handling

| Error | Description | Solution |
|-------|-------------|----------|
| Invalid API Key | Authentication failed with provided credentials | Verify API key is correct and active |
| Insufficient Balance | Account lacks funds for transaction | Check account balance and add funds |
| Gas Limit Exceeded | Transaction requires more gas than specified | Increase gas limit or optimize transaction |
| Network Timeout | Request timed out waiting for response | Retry request or check network connectivity |
| Invalid Address | Provided address format is incorrect | Verify address follows Monad format standards |
| Contract Not Found | Smart contract does not exist at address | Confirm contract address and deployment status |

## Development

```bash
npm install
npm run build
npm test
npm run lint
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
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please ensure:

1. Code follows existing style conventions
2. All tests pass (`npm test`)
3. Linting passes (`npm run lint`)
4. Documentation is updated for new features
5. Commit messages are descriptive

## Support

- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-monad/issues)
- **Monad Documentation**: [Monad Developer Docs](https://docs.monad.xyz)
- **Community**: [Monad Discord](https://discord.gg/monad)