# Aether Usage Guide

Practical examples and patterns for building with Aether.

---

## Basic Usage

### Simple Payment

```typescript
import { SettlementAgent } from 'aether-agent-sdk'

const agent = new SettlementAgent()
await agent.init()

const paymentHeader = await agent.createSignedPayment(
  'merchant_wallet_address',
  1.0 // USDC
)

console.log('Payment sent:', txHash)
```

### With Error Handling

```typescript
import { SettlementAgent } from 'aether-agent-sdk'
import chalk from 'chalk'

async function makePayment(recipient: string, amount: number) {
  try {
    const agent = new SettlementAgent()
    await agent.init()

    console.log(chalk.blue(`Sending ${amount} USDC to ${recipient}...`))

    const paymentHeader = await agent.createSignedPayment(recipient, amount)

    if (txHash) {
      console.log(chalk.green('✅ Payment successful!'))
      console.log(chalk.blue(`🔗 https://explorer.solana.com/tx/${txHash}?cluster=devnet`))
      return txHash
    } else {
      console.log(chalk.red('❌ Payment failed'))
      return null
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error.message)
    throw error
  }
}

// Usage
await makePayment('merchant_address', 5.0)
```

---

## Use Cases

### 1. API Monetization

Autonomous agents paying for API access:

```typescript
import { SettlementAgent } from 'aether-agent-sdk'
import axios from 'axios'

class PaidAPIClient {
  private agent: SettlementAgent
  private apiUrl: string
  private merchantWallet: string

  constructor(apiUrl: string, merchantWallet: string) {
    this.agent = new SettlementAgent()
    this.apiUrl = apiUrl
    this.merchantWallet = merchantWallet
  }

  async init() {
    await this.agent.init()
  }

  async callPaidEndpoint(endpoint: string, costUSDC: number) {
    // Pay first
    const paymentHeader = await this.agent.createSignedPayment(
      this.merchantWallet,
      costUSDC
    )

    if (!txHash) {
      throw new Error('Payment failed')
    }

    // Then access the resource
    const response = await axios.get(`${this.apiUrl}${endpoint}`, {
      headers: {
        'X-Payment-Tx': txHash
      }
    })

    return response.data
  }
}

// Usage
const client = new PaidAPIClient(
  'https://api.example.com',
  'merchant_wallet'
)
await client.init()

const data = await client.callPaidEndpoint('/premium-data', 0.10)
console.log('Received data:', data)
```

### 2. Agent Marketplace

Agents buying services from other agents:

```typescript
interface Service {
  name: string
  description: string
  price: number // USDC
  provider: string // wallet address
}

class AgentMarketplace {
  private agent: SettlementAgent

  constructor() {
    this.agent = new SettlementAgent()
  }

  async init() {
    await this.agent.init()
  }

  async purchaseService(service: Service): Promise<string> {
    console.log(`Purchasing: ${service.name}`)
    console.log(`Price: ${service.price} USDC`)
    console.log(`Provider: ${service.provider}`)

    const paymentHeader = await this.agent.createSignedPayment(
      service.provider,
      service.price
    )

    if (!txHash) {
      throw new Error('Payment failed')
    }

    console.log(`✅ Purchased ${service.name}`)
    return txHash
  }
}

// Usage
const marketplace = new AgentMarketplace()
await marketplace.init()

const service = {
  name: 'Data Analysis',
  description: 'AI-powered data analysis',
  price: 2.50,
  provider: 'provider_wallet_address'
}

const tx = await marketplace.purchaseService(service)
```

### 3. Subscription Payments

Recurring payments for services:

```typescript
class SubscriptionManager {
  private agent: SettlementAgent
  private subscriptions: Map<string, NodeJS.Timeout>

  constructor() {
    this.agent = new SettlementAgent()
    this.subscriptions = new Map()
  }

  async init() {
    await this.agent.init()
  }

  async subscribe(
    serviceId: string,
    providerWallet: string,
    pricePerMonth: number
  ) {
    await this.agent.createSignedPayment(providerWallet, pricePerMonth)

    // Schedule monthly payments
    const interval = setInterval(async () => {
      try {
        const paymentHeader = await this.agent.createSignedPayment(
          providerWallet,
          pricePerMonth
        )
        console.log(`Monthly payment for ${serviceId}: ${txHash}`)
      } catch (error) {
        console.error(`Failed to pay for ${serviceId}:`, error)
        this.unsubscribe(serviceId)
      }
    }, 30 * 24 * 60 * 60 * 1000) // 30 days

    this.subscriptions.set(serviceId, interval)
    console.log(`Subscribed to ${serviceId}`)
  }

  unsubscribe(serviceId: string) {
    const interval = this.subscriptions.get(serviceId)
    if (interval) {
      clearInterval(interval)
      this.subscriptions.delete(serviceId)
      console.log(`Unsubscribed from ${serviceId}`)
    }
  }
}

// Usage
const subscriptions = new SubscriptionManager()
await subscriptions.init()

await subscriptions.subscribe(
  'premium-api',
  'provider_wallet',
  10.0 // $10/month
)
```

### 4. Micropayments for Content

Pay per use for digital content:

```typescript
class ContentPaymentGateway {
  private agent: SettlementAgent

  constructor() {
    this.agent = new SettlementAgent()
  }

  async init() {
    await this.agent.init()
  }

  async accessContent(
    contentId: string,
    creator: string,
    price: number
  ): Promise<any> {
    // Pay for content
    const paymentHeader = await this.agent.createSignedPayment(creator, price)

    if (!txHash) {
      throw new Error('Payment required to access content')
    }

    // Fetch content with proof of payment
    const response = await fetch(`/api/content/${contentId}`, {
      headers: {
        'X-Payment-Proof': txHash
      }
    })

    return await response.json()
  }
}

// Usage
const gateway = new ContentPaymentGateway()
await gateway.init()

const article = await gateway.accessContent(
  'article-123',
  'creator_wallet',
  0.05 // 5 cents
)

console.log('Article:', article)
```

---

## Integration Patterns

### Express.js API

```typescript
import express from 'express'
import { X402FacilitatorServer } from 'aether-agent-sdk'

const app = express()
app.use(express.json())

const facilitator = new X402FacilitatorServer()

// Middleware to check payment
async function requirePayment(req, res, next) {
  const paymentTx = req.headers['x-payment-tx']

  if (!paymentTx) {
    return res.status(402).json({
      error: 'Payment Required',
      paymentRequirements: {
        scheme: 'exact',
        network: 'solana-devnet',
        asset: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
        payTo: process.env.MERCHANT_WALLET_ADDRESS,
        maxAmountRequired: '1000000',
        resource: req.path,
        description: 'API access',
        mimeType: 'application/json',
        maxTimeoutSeconds: 120
      }
    })
  }

  // Verify transaction on Solana
  // (implementation depends on your verification logic)
  next()
}

// Protected endpoint
app.get('/api/premium-data', requirePayment, (req, res) => {
  res.json({ data: 'premium content' })
})

app.listen(3000, () => {
  console.log('API server running on port 3000')
})
```

### React Frontend

```typescript
import { Connection, PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token'

function PaymentButton({ amount, recipient, onSuccess }) {
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    setLoading(true)

    try {
      // Connect wallet (using Phantom, Solflare, etc.)
      const { solana } = window
      const publicKey = await solana.connect()

      // Create payment transaction
      // (implementation depends on your wallet adapter)

      const signature = await sendTransaction(/* ... */)

      // Wait for confirmation
      await connection.confirmTransaction(signature)

      onSuccess(signature)
    } catch (error) {
      console.error('Payment failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handlePayment} disabled={loading}>
      {loading ? 'Processing...' : `Pay ${amount} USDC`}
    </button>
  )
}
```

---

## Testing

### Unit Tests

```typescript
import { SettlementAgent } from 'aether-agent-sdk'

describe('SettlementAgent', () => {
  let agent: SettlementAgent

  beforeEach(async () => {
    agent = new SettlementAgent()
    await agent.init()
  })

  it('should execute payment', async () => {
    const paymentHeader = await agent.createSignedPayment(
      'test_wallet',
      1.0
    )

    expect(txHash).toBeTruthy()
    expect(typeof txHash).toBe('string')
  })

  it('should handle insufficient balance', async () => {
    // Mock insufficient balance scenario
    const paymentHeader = await agent.createSignedPayment(
      'test_wallet',
      999999.0
    )

    expect(txHash).toBeNull()
  })
})
```

### Integration Tests

```typescript
describe('x402 Payment Flow', () => {
  it('should complete full payment cycle', async () => {
    const facilitator = new X402FacilitatorServer()
    const agent = new SettlementAgent()

    await agent.init()

    // Create payment
    const requirements = {/* ... */}
    const payload = {/* ... */}
    const header = Buffer.from(JSON.stringify(payload)).toString('base64')

    // Verify
    const verification = await facilitator.verify(header, requirements)
    expect(verification.isValid).toBe(true)

    // Settle
    const settlement = await facilitator.settle(header, requirements)
    expect(settlement.success).toBe(true)
    expect(settlement.txHash).toBeTruthy()
  })
})
```

---

## Next Steps

- Review [API Reference](./API_REFERENCE.md) for complete API docs
- Read [x402 Guide](./X402_GUIDE.md) for protocol details
- Check [Setup Guide](./SETUP_GUIDE.md) for configuration

---

**Build powerful autonomous payment systems with Aether** 🚀
