# Aether API Reference

Complete API documentation for the Aether SDK.

---

## Installation

```bash
npm install aether-agent-sdk
```

---

## Core Modules

### X402FacilitatorServer

Handles x402 payment verification and settlement on Solana.

#### Constructor

```typescript
new X402FacilitatorServer()
```

Initializes the facilitator with environment configuration.

**Environment Variables:**
- `SOLANA_RPC_URL` - Solana RPC endpoint
- `AGENT_PRIVATE_KEY` - Agent wallet private key (base58)
- `USDC_MINT` - USDC token mint address

#### Methods

##### `verify(paymentHeader: string, paymentRequirements: any): Promise<any>`

Verifies a payment without executing it.

**Parameters:**
- `paymentHeader` - Base64 encoded payment payload
- `paymentRequirements` - Payment requirements object

**Returns:**
```typescript
{
  isValid: boolean
  invalidReason: string | null
}
```

**Example:**
```typescript
const facilitator = new X402FacilitatorServer()
const result = await facilitator.verify(paymentHeader, requirements)

if (result.isValid) {
  console.log('Payment is valid')
}
```

##### `settle(paymentHeader: string, paymentRequirements: any): Promise<any>`

Settles a payment by executing the USDC transfer.

**Parameters:**
- `paymentHeader` - Base64 encoded payment payload
- `paymentRequirements` - Payment requirements object

**Returns:**
```typescript
{
  success: boolean
  error: string | null
  txHash: string | null
  networkId: string | null
}
```

**Example:**
```typescript
const result = await facilitator.settle(paymentHeader, requirements)

if (result.success) {
  console.log('Transaction:', result.txHash)
}
```

##### `getSupportedSchemes(): { kinds: Array<{ scheme: string; network: string }> }`

Returns supported payment schemes.

**Returns:**
```typescript
{
  kinds: [
    { scheme: 'exact', network: 'solana-devnet' }
  ]
}
```

---

### SettlementAgent

Manages autonomous agent payments on Solana.

#### Constructor

```typescript
new SettlementAgent()
```

**Environment Variables:**
- `SOLANA_RPC_URL` - Solana RPC endpoint
- `AGENT_PRIVATE_KEY` - Agent wallet private key
- `MERCHANT_WALLET_ADDRESS` - Default merchant address
- `DEFAULT_PAYMENT_AMOUNT_USDC` - Default payment amount

#### Methods

##### `init(): Promise<void>`

Initializes the settlement agent.

**Example:**
```typescript
const agent = new SettlementAgent()
await agent.init()
```

##### `triggerSettlement(verification: any): Promise<void>`

Triggers a payment settlement.

**Parameters:**
- `verification` - Verification result object

**Example:**
```typescript
await agent.triggerSettlement({ approved: true, amount: 1.0 })
```

##### `createSignedPayment(recipientAddress: string, amountUsdc: number): Promise<string>`

Creates a signed x402 payment transaction.

**Parameters:**
- `recipientAddress` - Recipient's Solana wallet address
- `amountUsdc` - Amount in USDC (e.g., 1.0 for 1 USDC)

**Returns:**
- Base64-encoded x402 payment header containing the signed transaction

**Example:**
```typescript
const paymentHeader = await agent.createSignedPayment(
  'merchant_wallet_address',
  1.0
)

// Send paymentHeader to server via X-Payment-Header
```

---

## Data Types

### Payment Requirements

```typescript
interface PaymentRequirements {
  scheme: 'exact'
  network: 'solana-devnet' | 'solana-mainnet'
  asset: string              // USDC mint address
  payTo: string              // Recipient wallet address
  maxAmountRequired: string  // Amount in micro-USDC (1 USDC = 1,000,000)
  resource: string           // Payment description
  description: string        // Human-readable description
  mimeType: string          // Response content type
  maxTimeoutSeconds: number  // Payment validity period
}
```

### Payment Payload

```typescript
interface PaymentPayload {
  x402Version: 1
  scheme: 'exact'
  network: 'solana-devnet' | 'solana-mainnet'
  payload: {
    authorization: {
      from: string      // Sender wallet (base58)
      to: string        // Recipient wallet (base58)
      value: string     // Amount in micro-USDC
      asset: string     // USDC mint address
      validBefore: number // Unix timestamp
    }
  }
}
```

### Verification Result

```typescript
interface VerificationResult {
  isValid: boolean
  invalidReason: string | null
}
```

### Settlement Result

```typescript
interface SettlementResult {
  success: boolean
  error: string | null
  txHash: string | null      // Solana transaction signature
  networkId: string | null   // 'solana-devnet' or 'solana-mainnet'
}
```

---

## Usage Examples

### Basic Payment Flow

```typescript
import { SettlementAgent } from 'aether-agent-sdk'

const agent = new SettlementAgent()
await agent.init()

const merchantAddress = 'merchant_wallet_here'
const amount = 1.0

const paymentHeader = await agent.createSignedPayment(merchantAddress, amount)
console.log('Payment created:', paymentHeader)
```

### Custom Payment Requirements

```typescript
import { X402FacilitatorServer } from 'aether-agent-sdk'

const facilitator = new X402FacilitatorServer()

const requirements = {
  scheme: 'exact' as const,
  network: 'solana-devnet',
  asset: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  payTo: 'merchant_wallet',
  maxAmountRequired: '1000000', // 1 USDC
  resource: '/api/data',
  description: 'Payment for API access',
  mimeType: 'application/json',
  maxTimeoutSeconds: 120
}

const paymentPayload = {
  x402Version: 1,
  scheme: 'exact',
  network: 'solana-devnet',
  payload: {
    authorization: {
      from: 'agent_wallet',
      to: 'merchant_wallet',
      value: '1000000',
      asset: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
      validBefore: Math.floor(Date.now() / 1000) + 120
    }
  }
}

const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64')

const verification = await facilitator.verify(paymentHeader, requirements)
if (verification.isValid) {
  const settlement = await facilitator.settle(paymentHeader, requirements)
  console.log('Transaction:', settlement.txHash)
}
```

### Error Handling

```typescript
try {
  const agent = new SettlementAgent()
  await agent.init()

  const paymentHeader = await agent.createSignedPayment(
    recipientAddress,
    amount
  )

  console.log('Payment created:', paymentHeader)
} catch (error) {
  console.error('Payment error:', error.message)
  // Handle error appropriately
}
```

---

## Constants

### USDC Mint Addresses

```typescript
const USDC_DEVNET = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
const USDC_MAINNET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
```

### Network Identifiers

```typescript
const SOLANA_DEVNET = 'solana-devnet'
const SOLANA_MAINNET = 'solana-mainnet'
```

### Amount Conversion

```typescript
// USDC has 6 decimals
const usdcToMicroUsdc = (usdc: number) => Math.floor(usdc * 1_000_000)
const microUsdcToUsdc = (micro: number) => micro / 1_000_000

// Example
const amount = 1.5 // USDC
const microAmount = usdcToMicroUsdc(amount) // 1500000
```

---

## TypeScript Support

Aether is written in TypeScript and provides full type definitions.

```typescript
import type {
  PaymentRequirements,
  PaymentPayload,
  VerificationResult,
  SettlementResult
} from 'aether-agent-sdk'
```

---

## Error Messages

Common error messages and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "Agent wallet not initialized" | Missing private key | Set `AGENT_PRIVATE_KEY` in .env |
| "Insufficient USDC balance" | Not enough tokens | Get USDC from faucet |
| "Payment verification failed" | Invalid payload | Check payment structure |
| "Invalid base58 string" | Wrong key format | Convert key to base58 |

---

## Next Steps

- Read [Usage Guide](./USAGE_GUIDE.md) for practical examples
- Learn about [x402 Integration](./X402_GUIDE.md)
- Check [Setup Guide](./SETUP_GUIDE.md) for configuration

---

**Complete API reference for building autonomous agents on Solana** 🚀
