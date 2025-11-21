import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { X402FacilitatorServer } from '../facilitator/X402FacilitatorServer'
import chalk from 'chalk'
import dotenv from 'dotenv'
import bs58 from 'bs58'

dotenv.config()

export class SettlementAgent {
  private connection: Connection
  private agentWallet?: Keypair
  private facilitator: X402FacilitatorServer
  private merchantWallet: string

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
    const agentPrivateKey = process.env.AGENT_PRIVATE_KEY
    const merchantWallet = process.env.MERCHANT_WALLET_ADDRESS

    if (!merchantWallet) {
      console.error(chalk.red('\n❌ Configuration Error: Missing MERCHANT_WALLET_ADDRESS'))
      console.log(chalk.yellow('\n📋 Setup Instructions:'))
      console.log(chalk.white('1. Copy the example configuration:'))
      console.log(chalk.gray('   cp .env.example .env\n'))
      console.log(chalk.white('2. Edit .env and add:'))
      console.log(chalk.gray('   AGENT_PRIVATE_KEY=your_base58_key'))
      console.log(chalk.gray('   MERCHANT_WALLET_ADDRESS=recipient_address\n'))
      console.log(chalk.white('3. Generate a Solana wallet (if needed):'))
      console.log(chalk.gray('   solana-keygen new --outfile wallet.json\n'))
      throw new Error('Missing required environment variable: MERCHANT_WALLET_ADDRESS')
    }

    this.connection = new Connection(rpcUrl, 'confirmed')
    this.merchantWallet = merchantWallet
    this.facilitator = new X402FacilitatorServer()

    if (agentPrivateKey) {
      try {
        const privateKeyBytes = bs58.decode(agentPrivateKey)
        this.agentWallet = Keypair.fromSecretKey(privateKeyBytes)
        console.log(chalk.green(`✅ Settlement Agent initialized with wallet: ${this.agentWallet.publicKey.toBase58()}`))
      } catch (error) {
        console.error(chalk.red('❌ Failed to load agent wallet:'), error)
      }
    }
  }

  async triggerSettlement(verification: any): Promise<void> {
    console.log(chalk.yellow('🔧 SettlementAgent: Triggering settlement...'))
    await this.executeSettlement(verification)
  }

  async init(): Promise<void> {
    try {
      const agentId = process.env.SETTLEMENT_AGENT_ID
      console.log(chalk.yellow('✅ SettlementAgent initialized for Solana'))
      console.log(`🆔 Agent ID: ${agentId}`)
      console.log(`🌐 RPC URL: ${process.env.SOLANA_RPC_URL}`)
    } catch (error) {
      console.error('❌ Failed to initialize SettlementAgent:', error)
      throw error
    }
  }

  private createPaymentRequirements() {
    const paymentAmount = parseFloat(process.env.DEFAULT_PAYMENT_AMOUNT_USDC || '1.0')
    const amountInMicroUsdc = Math.floor(paymentAmount * 1_000_000)

    return {
      scheme: 'exact' as const,
      network: 'solana-devnet',
      asset: process.env.USDC_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
      payTo: this.merchantWallet,
      maxAmountRequired: amountInMicroUsdc.toString(),
      resource: '/agent-settlement',
      description: 'A2A agent settlement via x402 on Solana',
      mimeType: 'application/json',
      maxTimeoutSeconds: 120
    }
  }

  private async executeSettlement(verification: any): Promise<void> {
    try {
      console.log(chalk.yellow('💰 Initiating settlement flow on Solana...'))

      const requirements = this.createPaymentRequirements()

      console.log(chalk.blue('📋 Step 1: Creating payment authorization...'))
      const paymentPayload = this.createPaymentPayload(requirements)
      const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64')

      console.log(chalk.blue('📋 Payment payload structure:'), JSON.stringify(paymentPayload, null, 2))

      console.log(chalk.blue('📋 Step 2: Verifying payment...'))
      const verificationResult = await this.facilitator.verify(paymentHeader, requirements)

      if (!verificationResult.isValid) {
        throw new Error(`Payment verification failed: ${verificationResult.invalidReason}`)
      }
      console.log(chalk.green('✅ Payment verification successful'))

      console.log(chalk.blue('📋 Step 3: Settling payment and executing USDC transfer...'))
      const settlementResult = await this.facilitator.settle(paymentHeader, requirements)

      if (!settlementResult.success) {
        throw new Error(`Payment settlement failed: ${settlementResult.error}`)
      }

      console.log(chalk.green('✅ Payment settled successfully!'))
      console.log(chalk.blue(`📋 Transaction signature: ${settlementResult.txHash}`))
      console.log(chalk.blue(`📋 Explorer: https://explorer.solana.com/tx/${settlementResult.txHash}?cluster=devnet`))

    } catch (error) {
      console.error('❌ Error executing settlement:', error)
      throw error
    }
  }

  private createPaymentPayload(requirements: any) {
    if (!this.agentWallet) {
      throw new Error('Agent wallet not initialized')
    }

    const validBefore = Math.floor(Date.now() / 1000) + requirements.maxTimeoutSeconds

    return {
      x402Version: 1,
      scheme: requirements.scheme,
      network: requirements.network,
      payload: {
        authorization: {
          from: this.agentWallet.publicKey.toBase58(),
          to: requirements.payTo,
          value: requirements.maxAmountRequired,
          asset: requirements.asset,
          validBefore: validBefore
        }
      }
    }
  }

  /**
   * Creates a signed x402 payment
   */
  async createSignedPayment(recipientAddress: string, amountUsdc: number): Promise<string> {
    try {
      if (!this.agentWallet) {
        throw new Error('Agent wallet not initialized')
      }

      console.log(chalk.blue(`📝 Creating signed x402 payment...`))
      console.log(chalk.blue(`💵 Amount: ${amountUsdc} USDC`))
      console.log(chalk.blue(`📍 Recipient: ${recipientAddress}`))

      const amountInMicroUsdc = Math.floor(amountUsdc * 1_000_000)
      const recipientPubkey = new PublicKey(recipientAddress)
      const usdcMint = new PublicKey(process.env.USDC_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')

      // Create token instance
      const token = new Token(
        this.connection,
        usdcMint,
        TOKEN_PROGRAM_ID,
        this.agentWallet
      )

      // Get or create token accounts
      const fromTokenAccount = await token.getOrCreateAssociatedAccountInfo(
        this.agentWallet.publicKey
      )

      const toTokenAccount = await token.getOrCreateAssociatedAccountInfo(
        recipientPubkey
      )

      console.log(chalk.blue(`📋 From: ${this.agentWallet.publicKey.toBase58()}`))
      console.log(chalk.blue(`📋 To: ${recipientAddress}`))

      // Create transfer instruction
      const transferInstruction = Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        fromTokenAccount.address,
        toTokenAccount.address,
        this.agentWallet.publicKey,
        [],
        amountInMicroUsdc
      )

      // Create transaction
      const transaction = new Transaction().add(transferInstruction)

      // Get recent blockhash
      const { blockhash } = await this.connection.getRecentBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = this.agentWallet.publicKey

      // Sign transaction
      transaction.sign(this.agentWallet)

      console.log(chalk.green(`✅ Transaction signed`))

      // Create x402 payload with signed transaction
      const validBefore = Math.floor(Date.now() / 1000) + 300 // 5 minutes

      const paymentPayload = {
        x402Version: 1,
        scheme: 'exact',
        network: 'solana-devnet',
        payload: {
          authorization: {
            from: this.agentWallet.publicKey.toBase58(),
            to: recipientAddress,
            value: amountInMicroUsdc.toString(),
            asset: usdcMint.toBase58(),
            validBefore: validBefore
          },
          signedTransaction: transaction.serialize().toString('base64')
        }
      }

      // Encode to base64
      const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64')

      console.log(chalk.green(`✅ x402 payment created (signed transaction included)`))

      return paymentHeader
    } catch (error) {
      console.error(chalk.red('❌ Error creating signed payment:'), error)
      throw error
    }
  }
}
