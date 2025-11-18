# Contributing to Aether

Thank you for your interest in contributing to Aether! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and professional in all interactions.

### Our Standards

- Use welcoming and inclusive language
- Respect differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- TypeScript knowledge
- Solana development experience (recommended)
- Familiarity with autonomous agents and AI (helpful)

### Setting Up Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/4n0nn43x/aether.git
   cd aether
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Solana devnet credentials
   ```

4. **Build the Project**
   ```bash
   npm run build
   ```

5. **Run Tests** (if available)
   ```bash
   npm test
   ```

---

## Development Workflow

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions or updates

Example: `feature/add-jupiter-integration`

### Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(agents): add multi-signature support to SettlementAgent
fix(x402): resolve payment verification timeout issue
docs(readme): update installation instructions
refactor(protocols): simplify A2A message handling
```

---

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Provide explicit types for function parameters and return values
- Avoid `any` types when possible
- Use interfaces for object shapes
- Document complex types with JSDoc comments

**Example:**
```typescript
/**
 * Executes a Solana transfer with the specified parameters
 * @param recipient - The recipient's wallet address
 * @param amount - Amount in USDC
 * @returns Transaction signature hash
 */
async executeSolanaTransfer(
  recipient: string,
  amount: number
): Promise<string> {
  // Implementation
}
```

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in objects and arrays
- Maximum line length: 100 characters
- Use meaningful variable and function names

### File Organization

```
src/
├── agents/          # Agent implementations
├── protocols/       # Protocol implementations (A2A, AP2)
├── facilitator/     # x402 facilitator server
├── services/        # Utility services
├── utils/           # Helper functions
└── index.ts         # Main SDK entry point
```

### Error Handling

- Use try-catch blocks for async operations
- Throw descriptive errors with context
- Log errors appropriately
- Never swallow errors silently

**Example:**
```typescript
try {
  const tx = await this.connection.sendTransaction(transaction, signers)
  return tx
} catch (error) {
  console.error('Failed to send transaction:', error)
  throw new Error(`Transaction failed: ${error.message}`)
}
```

---

## Pull Request Process

### Before Submitting

1. **Update Documentation** - Update relevant docs if needed
2. **Run Build** - Ensure `npm run build` succeeds
3. **Test Your Changes** - Verify functionality works as expected
4. **Check Code Style** - Follow the coding standards above
5. **Update CHANGELOG** - Add entry for your changes (if applicable)

### PR Guidelines

1. **Create a Clear Title**
   - Use descriptive titles: "Add Jupiter swap integration to SettlementAgent"
   - Not: "Update agent.ts"

2. **Write a Detailed Description**
   ```markdown
   ## What does this PR do?
   Brief description of changes

   ## Why is this needed?
   Explanation of the problem being solved

   ## How to test?
   Steps to verify the changes work

   ## Related Issues
   Fixes #123
   ```

3. **Keep PRs Focused**
   - One feature or fix per PR
   - Avoid mixing unrelated changes
   - Break large changes into smaller PRs

4. **Request Review**
   - Tag relevant maintainers
   - Respond to feedback promptly
   - Be open to suggestions

### PR Review Process

- Maintainers will review within 3-5 business days
- Address all review comments
- Keep the conversation professional and constructive
- Once approved, maintainers will merge your PR

---

## Testing Guidelines

### Writing Tests

- Write unit tests for new functions
- Test edge cases and error conditions
- Use descriptive test names
- Mock external dependencies (Solana RPC, etc.)

**Example Test Structure:**
```typescript
describe('SettlementAgent', () => {
  describe('executeSolanaTransfer', () => {
    it('should successfully transfer USDC to recipient', async () => {
      // Test implementation
    })

    it('should throw error when recipient address is invalid', async () => {
      // Test implementation
    })
  })
})
```

### Running Tests

```bash
npm test                    # Run all tests
npm test -- --watch        # Run in watch mode
npm test -- AgentName      # Run specific test suite
```

---

## Documentation

### Code Documentation

- Add JSDoc comments for all public APIs
- Document parameters, return types, and exceptions
- Provide usage examples for complex functions
- Keep comments up-to-date with code changes

### Documentation Files

When updating documentation:

- **README.md** - High-level project overview
- **docs/SETUP_GUIDE.md** - Installation and setup
- **docs/API_REFERENCE.md** - API documentation
- **docs/USAGE_GUIDE.md** - Usage examples
- **docs/X402_GUIDE.md** - x402 protocol guide

---

## Project-Specific Guidelines

### Solana Integration

- Use devnet for development and testing
- Always verify transaction signatures
- Handle network errors gracefully
- Respect RPC rate limits
- Use USDC for payment examples

### Agent Development

- Follow the existing agent patterns
- Implement proper initialization/cleanup
- Use async/await for all async operations
- Log important state changes
- Handle agent lifecycle properly

### x402 Protocol

- Follow the x402 specification strictly
- Implement proper payment verification
- Handle payment failures gracefully
- Document any protocol extensions

---

## Getting Help

- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check the docs/ folder
- **Examples**: Review demo/ folder for usage examples

---

## Recognition

Contributors will be recognized in:
- Project README.md
- Release notes
- Git commit history

Thank you for contributing to Aether and helping build the future of autonomous agent economies!

---

## License

By contributing to Aether, you agree that your contributions will be licensed under the MIT License.
