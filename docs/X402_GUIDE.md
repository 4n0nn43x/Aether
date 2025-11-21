# x402 Protocol Integration Guide

Learn how Aether implements the x402 payment protocol on Solana.

---

## What is x402?

The x402 protocol activates the HTTP 402 (Payment Required) status code, enabling APIs and services to require payment before delivering content. It's a universal standard for monetizing digital resources autonomously.

### Key Benefits

- **Sub-second settlements** on Solana (400ms finality)
- **Micropayments** at $0.00025 per transaction
- **Autonomous agents** can pay for services without human intervention
- **Stable pricing** with USDC

---

## How x402 Works in Aether

### 1. Payment Flow

```
Client Request
     ↓
Service Returns 402 + Payment Requirements
     ↓
Client Creates Payment Authorization
     ↓
Client Verifies Payment (/verify endpoint)
     ↓
Client Settles Payment (/settle endpoint)
     ↓
Service Confirms Transaction
     ↓
Service Returns Requested Resource
```

### 2. x402 Endpoints

Aether implements three required x402 endpoints:

#### `/verify` - Payment Verification

Validates payment structure without executing the transaction.

**Request:**
```json
{
  "paymentHeader": "base64_encoded_payload",
  "paymentRequirements": {
    "scheme": "exact",
    "network": "solana-devnet",
    "asset": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    "payTo": "merchant_wallet",
    "maxAmountRequired": "1000000"
  }
}
```

**Response:**
```json
{
  "isValid": true,
  "invalidReason": null
}
```

#### `/settle` - Payment Settlement

Executes the USDC transfer on Solana.

**Request:**
```json
{
  "paymentHeader": "base64_encoded_payload",
  "paymentRequirements": { /* same as verify */ }
}
```

**Response:**
```json
{
  "success": true,
  "error": null,
  "txHash": "5j7K8m3N9pQ2rS4tU6vW8xY1zA3bC5dE7fG9hJ2kL4mN",
  "networkId": "solana-devnet"
}
```

#### `/supported` - Capability Discovery

Returns supported payment schemes.

**Response:**
```json
{
  "kinds": [
    { "scheme": "exact", "network": "solana-devnet" }
  ]
}
```

---

## Payment Payload Structure

### x402 Version 1 Format

```typescript
{
  x402Version: 1,
  scheme: "exact",
  network: "solana-devnet",
  payload: {
    authorization: {
      from: "sender_wallet_base58",
      to: "recipient_wallet_base58",
      value: "1000000",  // Amount in micro-USDC
      asset: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      validBefore: 1730560000  // Unix timestamp
    }
  }
}
```

### Field Descriptions

- **x402Version**: Protocol version (currently 1)
- **scheme**: Payment scheme ("exact" for exact amount)
- **network**: Blockchain network identifier
- **authorization**:
  - `from`: Payer's Solana wallet address
  - `to`: Recipient's Solana wallet address
  - `value`: Payment amount in smallest unit (micro-USDC)
  - `asset`: Token mint address (USDC)
  - `validBefore`: Payment expiration timestamp

---

## Implementation Example

### Creating a Payment

```typescript
import { SettlementAgent } from 'aether-agent-sdk'
import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'

// Initialize agent
const agent = new SettlementAgent()
await agent.init()

// Create payment requirements
const requirements = {
  scheme: 'exact' as const,
  network: 'solana-devnet',
  asset: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  payTo: 'merchant_wallet_address',
  maxAmountRequired: '1000000',
  resource: '/api/protected-resource',
  description: 'Access to premium API',
  mimeType: 'application/json',
  maxTimeoutSeconds: 120
}

const paymentHeader = await agent.createSignedPayment(
  requirements.payTo,
  1.0
)

console.log('Payment created:', paymentHeader)
```

### Verifying Before Settlement

```typescript
import { X402FacilitatorServer } from 'aether-agent-sdk'

const facilitator = new X402FacilitatorServer()

// Create payment payload
const paymentPayload = {
  x402Version: 1,
  scheme: 'exact',
  network: 'solana-devnet',
  payload: {
    authorization: {
      from: agentWallet.publicKey.toBase58(),
      to: merchantWallet,
      value: '1000000',
      asset: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
      validBefore: Math.floor(Date.now() / 1000) + 120
    }
  }
}

const paymentHeader = Buffer.from(
  JSON.stringify(paymentPayload)
).toString('base64')

// Verify first
const verification = await facilitator.verify(paymentHeader, requirements)

if (!verification.isValid) {
  console.error('Payment invalid:', verification.invalidReason)
  return
}

// Then settle
const settlement = await facilitator.settle(paymentHeader, requirements)

if (settlement.success) {
  console.log('Transaction:', settlement.txHash)
  console.log(`Explorer: https://explorer.solana.com/tx/${settlement.txHash}?cluster=devnet`)
}
```

---

## Validation Rules

The facilitator validates:

1. **x402 Version**: Must be 1
2. **Scheme**: Must match requirements
3. **Network**: Must be 'solana-devnet' or 'solana-mainnet'
4. **Amount**: Must match `maxAmountRequired`
5. **Recipient**: Must match `payTo`
6. **Expiration**: `validBefore` must be in the future
7. **Authorization**: Must contain all required fields

---

## Error Handling

### Common Errors

```typescript
try {
  const result = await facilitator.settle(paymentHeader, requirements)

  if (!result.success) {
    switch (result.error) {
      case 'Insufficient USDC balance':
        // Fund wallet with USDC
        break
      case 'Payment expired':
        // Create new payment with later validBefore
        break
      case 'Amount mismatch':
        // Check payment amount matches requirements
        break
      default:
        console.error('Unknown error:', result.error)
    }
  }
} catch (error) {
  console.error('Settlement failed:', error.message)
}
```

### Retry Logic

```typescript
async function settleWithRetry(
  facilitator: X402FacilitatorServer,
  paymentHeader: string,
  requirements: any,
  maxRetries = 3
): Promise<SettlementResult> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await facilitator.settle(paymentHeader, requirements)
      if (result.success) return result

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    } catch (error) {
      if (i === maxRetries - 1) throw error
    }
  }

  throw new Error('Max retries exceeded')
}
```

---

## Best Practices

### 1. Set Appropriate Timeouts

```typescript
const requirements = {
  // ...
  maxTimeoutSeconds: 120, // 2 minutes
  // Don't set too short - network delays happen
}

const validBefore = Math.floor(Date.now() / 1000) + 120
```

### 2. Verify Before Settling

Always call `/verify` before `/settle` to catch errors early.

```typescript
// GOOD
const verification = await facilitator.verify(header, reqs)
if (verification.isValid) {
  await facilitator.settle(header, reqs)
}

// BAD - skip verification
await facilitator.settle(header, reqs) // May fail expensively
```

### 3. Handle Transaction Failures

```typescript
const result = await facilitator.settle(header, reqs)

if (result.success) {
  // Store transaction hash
  await db.saveTransaction({
    txHash: result.txHash,
    network: result.networkId,
    timestamp: Date.now()
  })
} else {
  // Log error and notify user
  logger.error('Payment failed:', result.error)
}
```

### 4. Use Environment-Specific Configuration

```typescript
const network = process.env.SOLANA_NETWORK === 'mainnet-beta'
  ? 'solana-mainnet'
  : 'solana-devnet'

const usdcMint = process.env.SOLANA_NETWORK === 'mainnet-beta'
  ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
  : '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
```

---

## Performance Metrics

On Solana Devnet:

- **Verification**: ~100ms
- **Settlement**: ~600ms (including confirmation)
- **Total Flow**: <1 second
- **Cost**: ~$0.00025 per transaction

---

## Advanced Topics

### Gasless Transactions

Configure a fee payer to sponsor agent transactions:

```typescript
// In facilitator implementation
const transaction = new Transaction().add(transferInstruction)

// Set fee payer (different from sender)
transaction.feePayer = feePayer.publicKey

// Sign with both wallets
transaction.sign(feePayer, agentWallet)
```

### Batch Payments

Process multiple payments efficiently:

```typescript
const payments = [
  { to: 'wallet1', amount: 1.0 },
  { to: 'wallet2', amount: 2.5 },
  { to: 'wallet3', amount: 0.5 }
]

for (const payment of payments) {
  const paymentHeader = await agent.createSignedPayment(
    payment.to,
    payment.amount
  )
  console.log(`Created payment: ${payment.amount} USDC to ${payment.to}`)

  await new Promise(resolve => setTimeout(resolve, 500))
}
```

---

## Resources

- **x402 Specification**: https://solana.com/x402/what-is-x402
- **Solana Docs**: https://solana.com/developers
- **USDC on Solana**: https://www.circle.com/en/usdc-multichain/solana

---

**Build autonomous payment systems with x402 on Solana** 🚀
