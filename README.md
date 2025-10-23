# 🎯 Aither-Somnia: Open-Source Multi-Agent AI Copilot for DeFi on Somnia

<div align="center">

**From prompt to protocol — Aither-Somnia turns words into on-chain action.**

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Solidity](https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Somnia](https://img.shields.io/badge/Somnia-FF4400?style=for-the-badge&logo=blockchain&logoColor=white)](https://somnia.network/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://choosealicense.com/licenses/mit/)

[![GitHub stars](https://img.shields.io/github/stars/aither-somnia/aither-somnia?style=social)](https://github.com/aither-somnia/aither-somnia/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/aither-somnia/aither-somnia?style=social)](https://github.com/aither-somnia/aither-somnia/network/members)
[![Twitter Follow](https://img.shields.io/twitter/follow/aither_somnia?style=social)](https://twitter.com/aither_somnia)

</div>

Aither-Somnia is the **first open-source multi-agent AI copilot** designed specifically for DeFi operations on Somnia blockchain. It orchestrates specialized AI agents to execute complex financial strategies through natural language, making DeFi accessible to everyone while maintaining the security and transparency that crypto users demand.

## 🌟 Why Aither-Somnia?

- **🤖 Multi-Agent Intelligence**: Trade, Stake, Portfolio, Research, and Analytics agents working together
- **💬 Natural Language Interface**: "Stake 100 STT with the best validator" → Automatic execution
- **🔒 Security First**: On-chain allowlists, slippage protection, 2FA confirmation for sensitive operations
- **⚡ Somnia Optimized**: Built for Somnia's high-performance blockchain infrastructure
- **🛠️ Developer Friendly**: Comprehensive SDK for building custom agents
- **📊 Full Transparency**: All operations on-chain with detailed execution logs

---

## 🚀 Features

### Multi-Agent Architecture
- **Trade Agent**: Executes swaps with optimal routing and slippage protection
- **Stake Agent**: Manages validator delegation and rewards claiming
- **Portfolio Agent**: Real-time balance tracking and PnL analysis
- **Research Agent**: Market data and news via Venice API integration
- **Analytics Agent**: Transaction decoding and performance metrics

### DeFi Operations
- Natural language to on-chain execution
- Transaction preview with risk assessment
- Dry-run simulation before execution
- Batched operations for gas efficiency
- Automatic slippage protection
- Multi-step operation orchestration

### Security & Safety
- On-chain allowlists for contracts
- Per-intent spending limits
- 2-factor confirmation for sensitive actions
- Mandatory transaction simulation
- Approval minimization and auto-revoke

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 15, React 18, TypeScript
- **UI**: Tailwind CSS, Shadcn UI, Framer Motion
- **Wallet**: MetaMask, WalletConnect, Keplr

### Smart Contracts (Solidity)
- **AgentRegistry**: On-chain agent registration and capabilities
- **AgentOrchestrator**: Role-based access control and operation batching
- **ExecutionProxy**: Secure multicall execution with event emission
- **SwapAdapter**: DEX integration and routing
- **StakingAdapter**: Validator delegation and rewards management
- **PortfolioView**: Read-only balance and PnL helpers

### Backend
- **Runtime**: Node.js with TypeScript
- **AI**: OpenRouter (GPT-4, Claude) for intent parsing
- **Venice API**: Research and analytics integration
- **Database**: PostgreSQL via Supabase
- **Blockchain**: Somnia Testnet (Shannon) integration

## ⚡ Quick Start (< 2 minutes)

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- MetaMask or compatible Web3 wallet
- Somnia Testnet STT tokens ([Get from faucet](https://somnia.network/faucet))

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/aither-somnia/aither-somnia
cd aither-somnia
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set up environment variables

Copy the `.env.example` file to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_JWT_SECRET`: Secret key for JWT token generation
- `OPENROUTER_API_KEY`: API key for OpenRouter
- `OPENROUTER_BASE_URL`: Base URL for OpenRouter API
- `MODEL`: AI model to use
- `VENICE_API`: Venice API key for research agent
- `SOMNIA_RPC_URL`: Somnia Testnet RPC endpoint
- `SOMNIA_CHAIN_ID`: Somnia Testnet chain ID (Shannon)
- `SOMNIA_EXPLORER_URL`: Somnia block explorer URL
- `STT_SYMBOL`: Somnia Test Token symbol (STT)

### 4. Database Setup

You need to set up the following tables in your Supabase PostgreSQL database:

#### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  nonce UUID
);
```

#### Chats Table

```sql
CREATE TABLE chats (
  id UUID PRIMARY KEY,
  ai_id UUID,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT
);
```

#### Messages Table

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  chat_id UUID REFERENCES chats(id),
  sender_id UUID REFERENCES users(id),
  message JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 🎬 Demo Flows

### 1. "Stake 100 STT with the best validator"
- Router LLM parses intent and identifies staking requirement
- Portfolio Agent checks current balance and positions
- Analytics Agent evaluates validator performance metrics
- Stake Agent finds optimal validator (highest APR × uptime / commission)
- Preview shows: Validator choice, expected APR, fees, transaction cost
- User confirms → Transaction executes → Explorer link provided

### 2. "Swap my ETH for STT with 1% slippage"
- Trade Agent analyzes available DEX routes
- Calculates optimal path with minimal price impact
- Preview shows: Expected output, price impact, gas costs
- Dry-run simulation validates the swap
- User confirms → Swap executes → Success notification with details

### 3. "Show me my portfolio performance this week"
- Portfolio Agent aggregates all token balances and staking positions
- Analytics Agent calculates PnL, yield earned, and gas spent
- Generates interactive charts and performance metrics
- Displays allocation breakdown and risk assessment
- Provides recommendations for optimization

### 4. "Claim all my staking rewards"
- Stake Agent scans all active staking positions
- Calculates pending rewards across validators
- Batches reward claims for gas efficiency
- Preview shows: Total rewards, gas cost, net gain
- User confirms → Batch execution → Rewards transferred

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Project Structure

- `/app`: Main application code
  - `/api`: API routes for backend functionality
  - `/components`: React components
  - `/providers`: Context providers
  - `/services`: Service functions for API calls
- `/lib`: Utility libraries
- `/public`: Static assets
- `/ai`: AI-related functionality
- `/wallet`: Wallet integration code

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Smart Contracts (Somnia Testnet)

### Deployed Addresses

> **Note**: These contracts are ready for deployment. Run the deployment script to get actual addresses.

| Contract | Address | Purpose |
|----------|---------|----------|
| **AgentRegistry** | `TBD` | On-chain agent registration and capabilities |
| **AgentOrchestrator** | `TBD` | Multi-agent coordination and execution |
| **ExecutionProxy** | `TBD` | Secure multicall execution with allowlists |
| **SwapAdapter** | `TBD` | DEX integration and token swapping |
| **StakingAdapter** | `TBD` | Validator staking and rewards |
| **PortfolioView** | `TBD` | Read-only portfolio analytics |

### Deployment Instructions

1. **Setup Environment**
   ```bash
   cp .env.example .env.local
   # Add your private key and Somnia RPC URL
   ```

2. **Install Dependencies**
   ```bash
   cd contracts
   npm install
   ```

3. **Deploy to Somnia Testnet**
   ```bash
   npm run deploy:somnia
   ```

4. **Update Environment Variables**
   - Copy the deployed addresses from the deployment output
   - Update your `.env.local` with the new contract addresses

5. **Verify Contracts (Optional)**
   ```bash
   npm run verify
   ```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Deploy to Somnia Testnet
npm run deploy:somnia
```

## 📚 Resources

- [Somnia Documentation](https://docs.somnia.network)
- [Somnia Testnet Faucet](https://faucet.somnia.network)
- [Venice API Documentation](https://docs.venice.ai)
- [OpenRouter Documentation](https://openrouter.ai/docs)
