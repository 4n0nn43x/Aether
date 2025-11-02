import { SettlementAgent } from '../src/agents/SettlementAgent'
import { X402FacilitatorServer } from '../src/facilitator/X402FacilitatorServer'
import chalk from 'chalk'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
  console.log(chalk.bold.cyan('\n════════════════════════════════════════════════════════'))
  console.log(chalk.bold.cyan('  Aether x402 Payment Demo'))
  console.log(chalk.bold.cyan('════════════════════════════════════════════════════════\n'))

  try {
    console.log(chalk.yellow('🚀 Initializing Aether agents on Solana...\n'))

    const facilitator = new X402FacilitatorServer()
    const settlementAgent = new SettlementAgent()

    await settlementAgent.init()

    console.log(chalk.green('✅ Agents initialized successfully\n'))

    console.log(chalk.bold.white('📋 Supported Payment Schemes:'))
    const schemes = facilitator.getSupportedSchemes()
    console.log(chalk.blue(JSON.stringify(schemes, null, 2)))
    console.log()

    console.log(chalk.bold.white('💰 Executing x402 Payment Settlement...\n'))

    const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS
    const paymentAmount = parseFloat(process.env.DEFAULT_PAYMENT_AMOUNT_USDC || '1.0')

    if (!merchantAddress) {
      throw new Error('MERCHANT_WALLET_ADDRESS not configured in .env')
    }

    console.log(chalk.blue(`📍 Merchant Address: ${merchantAddress}`))
    console.log(chalk.blue(`💵 Payment Amount: ${paymentAmount} USDC\n`))

    const txHash = await settlementAgent.executeSolanaTransfer(merchantAddress, paymentAmount)

    if (txHash) {
      console.log(chalk.green.bold('\n✅ Payment Settlement Successful!'))
      console.log(chalk.blue(`📋 Transaction Signature: ${txHash}`))
      console.log(chalk.blue(`🔗 Explorer: https://explorer.solana.com/tx/${txHash}?cluster=devnet\n`))
    } else {
      console.log(chalk.red('\n❌ Payment Settlement Failed\n'))
    }

    console.log(chalk.bold.cyan('════════════════════════════════════════════════════════'))
    console.log(chalk.bold.cyan('  Demo Complete'))
    console.log(chalk.bold.cyan('════════════════════════════════════════════════════════\n'))

  } catch (error) {
    console.error(chalk.red('\n❌ Demo Error:'), error)
    process.exit(1)
  }
}

main()
