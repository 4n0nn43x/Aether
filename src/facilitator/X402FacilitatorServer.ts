import { Connection, PublicKey, Transaction, Keypair, sendAndConfirmTransaction } from '@solana/web3.js'
import {
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import { loadEnvIfNeeded } from '../utils/env'
import chalk from 'chalk'
import bs58 from 'bs58'

loadEnvIfNeeded()

export class X402FacilitatorServer {
  private connection: Connection
  private agentWallet?: Keypair
  private usdcMint: PublicKey

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
    const agentPrivateKey = process.env.AGENT_PRIVATE_KEY
    const usdcMint = process.env.USDC_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'

    this.connection = new Connection(rpcUrl, 'confirmed')
    this.usdcMint = new PublicKey(usdcMint)

    if (agentPrivateKey) {
      try {
        const privateKeyBytes = bs58.decode(agentPrivateKey)
        this.agentWallet = Keypair.fromSecretKey(privateKeyBytes)
        console.log(chalk.green(`✅ Facilitator initialized with wallet: ${this.agentWallet.publicKey.toBase58()}`))
      } catch (error) {
        console.warn(chalk.yellow('⚠️  Invalid AGENT_PRIVATE_KEY format. Please provide a valid base58 encoded key.'))
        console.warn(chalk.yellow('    Generate one with: solana-keygen new'))
      }
    } else {
      console.warn(chalk.yellow('⚠️  AGENT_PRIVATE_KEY not configured. Some features will be unavailable.'))
    }
  }

  async verify(paymentHeader: string, paymentRequirements: any): Promise<any> {
    try {
      console.log(chalk.blue('🔍 Facilitator: Verifying payment...'))

      const paymentPayload = JSON.parse(Buffer.from(paymentHeader, 'base64').toString())

      const isValid = this.validatePaymentLocally(paymentPayload, paymentRequirements)

      if (isValid) {
        console.log(chalk.green('✅ Facilitator: Payment verification successful'))
        return { isValid: true, invalidReason: null }
      } else {
        console.log(chalk.red('❌ Facilitator: Payment verification failed'))
        return { isValid: false, invalidReason: 'Local validation failed' }
      }
    } catch (error) {
      console.error('❌ Facilitator: Verification error:', error)
      return {
        isValid: false,
        invalidReason: `Verification error: ${(error as Error).message}`
      }
    }
  }

  private validatePaymentLocally(paymentPayload: any, requirements: any): boolean {
    try {
      if (paymentPayload.x402Version !== 1) {
        console.log(chalk.red('❌ Invalid x402 version'))
        return false
      }

      if (paymentPayload.scheme !== requirements.scheme) {
        console.log(chalk.red('❌ Scheme mismatch'))
        return false
      }

      if (paymentPayload.network !== 'solana-devnet') {
        console.log(chalk.red('❌ Network mismatch - expected solana-devnet'))
        return false
      }

      const authorization = paymentPayload.payload?.authorization
      if (!authorization) {
        console.log(chalk.red('❌ No authorization found'))
        return false
      }

      if (authorization.value !== requirements.maxAmountRequired) {
        console.log(chalk.red('❌ Amount mismatch'))
        return false
      }

      if (authorization.to !== requirements.payTo) {
        console.log(chalk.red('❌ Recipient mismatch'))
        return false
      }

      const now = Math.floor(Date.now() / 1000)
      if (authorization.validBefore && now > authorization.validBefore) {
        console.log(chalk.red('❌ Payment expired'))
        return false
      }

      console.log(chalk.green('✅ All local validations passed'))
      return true
    } catch (error) {
      console.error('❌ Local validation error:', error)
      return false
    }
  }

  async settle(paymentHeader: string, paymentRequirements: any): Promise<any> {
    try {
      console.log(chalk.blue('🏦 Facilitator: Settling payment on Solana...'))

      const paymentPayload = JSON.parse(Buffer.from(paymentHeader, 'base64').toString())

      const txHash = await this.executeUSDCTransfer(paymentPayload, paymentRequirements)

      if (txHash) {
        console.log(chalk.green('✅ Facilitator: Payment settled successfully'))
        console.log(chalk.blue(`📋 Transaction Signature: ${txHash}`))
        console.log(chalk.blue(`📋 Network: solana-devnet`))

        return {
          success: true,
          error: null,
          txHash: txHash,
          networkId: 'solana-devnet'
        }
      } else {
        console.log(chalk.red('❌ Facilitator: Payment settlement failed'))
        return {
          success: false,
          error: 'Failed to execute transfer',
          txHash: null,
          networkId: null
        }
      }
    } catch (error) {
      console.error('❌ Facilitator: Settlement error:', error)
      return {
        success: false,
        error: `Settlement error: ${(error as Error).message}`,
        txHash: null,
        networkId: null
      }
    }
  }

  private async executeUSDCTransfer(paymentPayload: any, requirements: any): Promise<string | null> {
    try {
      console.log(chalk.blue('💰 Processing x402 payment on Solana...'))

      const authorization = paymentPayload.payload?.authorization
      if (!authorization) {
        throw new Error('No authorization found in payment payload')
      }

      // Check if payload contains a pre-signed transaction (standard x402 flow)
      const signedTransactionBase64 = paymentPayload.payload?.signedTransaction

      if (signedTransactionBase64) {
        // Standard x402 flow: Submit pre-signed transaction
        console.log(chalk.blue('📋 Pre-signed transaction detected (standard x402 flow)'))
        console.log(chalk.blue(`📋 From: ${authorization.from}`))
        console.log(chalk.blue(`📋 To: ${authorization.to}`))
        console.log(chalk.blue(`📋 Amount: ${Number(authorization.value) / 1_000_000} USDC`))

        // Deserialize the transaction
        const transactionBuffer = Buffer.from(signedTransactionBase64, 'base64')
        const transaction = Transaction.from(transactionBuffer)

        console.log(chalk.yellow('📋 Submitting pre-signed transaction to Solana...'))

        // Submit the pre-signed transaction
        const signature = await this.connection.sendRawTransaction(
          transaction.serialize(),
          {
            skipPreflight: false,
            preflightCommitment: 'confirmed'
          }
        )

        // Wait for confirmation
        await this.connection.confirmTransaction(signature, 'confirmed')

        console.log(chalk.green(`✅ Transaction confirmed: ${signature}`))
        return signature

      } else {
        // Fallback: Old behavior (facilitator creates and executes the transaction)
        console.log(chalk.yellow('⚠️  No pre-signed transaction - using legacy flow'))

        if (!this.agentWallet) {
          throw new Error('Agent wallet not initialized (required for legacy flow)')
        }

        const recipientAddress = new PublicKey(authorization.to)
        const amount = Number(authorization.value)

        const token = new Token(
          this.connection,
          this.usdcMint,
          TOKEN_PROGRAM_ID,
          this.agentWallet
        )

        const fromTokenAccount = await token.getOrCreateAssociatedAccountInfo(
          this.agentWallet.publicKey
        )

        const toTokenAccount = await token.getOrCreateAssociatedAccountInfo(
          recipientAddress
        )

        console.log(chalk.blue(`📋 Current USDC balance: ${Number(fromTokenAccount.amount) / 1_000_000} USDC`))
        console.log(chalk.blue(`📋 Transfer amount: ${amount / 1_000_000} USDC`))
        console.log(chalk.blue(`📋 Recipient: ${recipientAddress.toBase58()}`))

        if (Number(fromTokenAccount.amount) < amount) {
          throw new Error(`Insufficient USDC balance: ${Number(fromTokenAccount.amount) / 1_000_000} < ${amount / 1_000_000}`)
        }

        console.log(chalk.yellow('📋 Submitting transaction...'))
        const signature = await token.transfer(
          fromTokenAccount.address,
          toTokenAccount.address,
          this.agentWallet,
          [],
          amount
        )

        console.log(chalk.green(`✅ Transfer confirmed: ${signature}`))
        return signature
      }

    } catch (error) {
      console.error('❌ USDC transfer error:', error)
      return null
    }
  }

  getSupportedSchemes(): { kinds: Array<{ scheme: string; network: string }> } {
    return {
      kinds: [
        { scheme: 'exact', network: 'solana-devnet' }
      ]
    }
  }
}
