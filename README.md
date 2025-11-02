# Aether

**Autonomous Agent Ecosystem SDK for Solana**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-Compatible-green.svg)](https://solana.com)
[![x402](https://img.shields.io/badge/x402-Enabled-purple.svg)](https://solana.com/x402/what-is-x402)

Aether is a production-ready SDK for building autonomous agent-to-agent systems on Solana. It integrates the x402 Payment Protocol to enable intelligent agent communication and micropayment settlement.

---

## 🌟 Vision

**Aether** enables autonomous AI agents to orchestrate complex workflows on Solana—negotiating contracts, processing micropayments, and making intelligent decisions—all without human intervention.

### Core Capabilities

- **x402 Protocol** - HTTP 402 payment standard for autonomous API payments
- **Solana Integration** - High-speed, low-cost blockchain infrastructure
- **A2A Protocol** - Standardized agent-to-agent communication
- **USDC Payments** - Stable, predictable pricing for agent services

---

## 🎯 Features

### Autonomous Workflows

- **Agent Negotiation**: Autonomous term negotiation between agents
- **Intelligent Verification**: LLM-powered decision making
- **Automated Settlement**: x402-based micropayments in milliseconds
- **Zero Human Intervention**: Fully autonomous agent transactions

### Solana Performance

- **400ms Finality**: Lightning-fast transaction confirmation
- **$0.00025 Transaction Costs**: Economical micropayments
- **Native USDC**: Stable pricing without volatility
- **SPL Token Support**: Extensible payment infrastructure

### Agent Framework

- **SettlementAgent**: Executes x402 payments and settlement on-chain
- **x402 Facilitator**: Payment verification and USDC transfers
- **Protocol Support**: A2A and AP2 protocol implementations

---

## 📦 Installation

```bash
npm install aether-agent-sdk
```

---

## 🚀 Quick Start

```typescript
import { SettlementAgent } from 'aether-agent-sdk'

const agent = new SettlementAgent()
await agent.init()

const txHash = await agent.executeSolanaTransfer(
  'merchant_wallet_address',
  1.0 // USDC amount
)

console.log(`Payment sent: ${txHash}`)
```

---

## 📚 Documentation

- **[Setup Guide](./docs/SETUP_GUIDE.md)** - Installation and configuration
- **[API Reference](./docs/API_REFERENCE.md)** - Complete API documentation
- **[Usage Guide](./docs/USAGE_GUIDE.md)** - Integration examples
- **[x402 Integration](./docs/X402_GUIDE.md)** - x402 payment protocol guide

---

## 🎬 Demo

Run the included demo to see Aether in action:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run demo
npm run demo:payment
```

---

## ⚙️ Configuration

Create a `.env` file:

```env
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
AGENT_PRIVATE_KEY=your_base58_private_key
MERCHANT_WALLET_ADDRESS=merchant_wallet
USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
DEFAULT_PAYMENT_AMOUNT_USDC=1.0
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│   SDK Entry Point (src/index.ts)        │
├─────────────────────────────────────────┤
│   Agents Layer                           │
│   └─ SettlementAgent                    │
├─────────────────────────────────────────┤
│   x402 Facilitator                       │
│   └─ X402FacilitatorServer              │
├─────────────────────────────────────────┤
│   Protocols Layer                        │
│   ├─ A2AProtocol                        │
│   └─ AP2Protocol                        │
├─────────────────────────────────────────┤
│   Solana Integration                    │
│   ├─ @solana/web3.js                    │
│   └─ @solana/spl-token                  │
└─────────────────────────────────────────┘
```

---

## 🔑 Key Features

### x402 Payment Protocol

- HTTP 402 (Payment Required) implementation
- Autonomous payment authorization and verification
- Sub-second settlement on Solana
- USDC micropayments with stable pricing

### Agent-to-Agent Communication

- JSON-RPC based A2A protocol
- Standardized message formats
- Async communication patterns
- Task management and tracking

### Production Ready

- TypeScript with full type safety
- Modular exports for tree-shaking
- Comprehensive error handling
- Extensive logging and debugging

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🔗 Links

- **GitHub**: [github.com/4n0nn43x/Aether](https://github.com/4n0nn43x/Aether)
- **Documentation**: [docs/](./docs/)
- **x402 Protocol**: [solana.com/x402](https://solana.com/x402/what-is-x402)
- **Solana Docs**: [solana.com/developers](https://solana.com/developers)

---

## 👥 Author

**4n0nn43x**

---

**Aether** - Autonomous agent payments on Solana.
