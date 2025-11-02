import chalk from 'chalk'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
  console.log(chalk.bold.cyan('\n════════════════════════════════════════════════════════'))
  console.log(chalk.bold.cyan('  Aether - Autonomous Agent SDK'))
  console.log(chalk.bold.cyan('════════════════════════════════════════════════════════\n'))

  console.log(chalk.yellow('🤖 Available Demos:\n'))
  console.log(chalk.blue('1. x402 Payment Demo'))
  console.log(chalk.gray('   npm run demo:payment\n'))

  console.log(chalk.green('💡 Quick Start:\n'))
  console.log(chalk.white('1. Configure your .env file with:'))
  console.log(chalk.gray('   - AGENT_PRIVATE_KEY (base58 format)'))
  console.log(chalk.gray('   - MERCHANT_WALLET_ADDRESS'))
  console.log(chalk.gray('   - SOLANA_RPC_URL (default: devnet)\n'))

  console.log(chalk.white('2. Ensure your agent wallet has:'))
  console.log(chalk.gray('   - Devnet SOL for transaction fees'))
  console.log(chalk.gray('   - Devnet USDC for payments\n'))

  console.log(chalk.white('3. Run a demo:'))
  console.log(chalk.gray('   npm run demo:payment\n'))

  console.log(chalk.bold.cyan('════════════════════════════════════════════════════════'))
  console.log(chalk.bold.cyan('  Autonomous Payments on Solana'))
  console.log(chalk.bold.cyan('════════════════════════════════════════════════════════\n'))
}

main()
