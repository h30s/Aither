# Aither-Somnia Agent SDK

[![npm version](https://badge.fury.io/js/%40aither-somnia%2Fagent-sdk.svg)](https://badge.fury.io/js/%40aither-somnia%2Fagent-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

**Official SDK for building AI agents on the Aither-Somnia multi-agent platform**

The Aither-Somnia Agent SDK enables developers to create custom AI agents that can interact with DeFi protocols, execute transactions, and provide intelligent automation on the Somnia blockchain.

## 🚀 Features

- **Type-safe Agent Development** - Full TypeScript support with comprehensive type definitions
- **Multi-capability Support** - Built-in support for DeFi operations, portfolio management, research, and more
- **Simulation Framework** - Test agent logic without making on-chain transactions
- **Risk Assessment** - Automated risk scoring and validation for all operations
- **Contract Integration** - Pre-built helpers for interacting with Somnia smart contracts
- **Event System** - Subscribe to agent events and execution results
- **Extensible Architecture** - Easy to extend with custom capabilities and behaviors

## 📦 Installation

```bash
npm install @aither-somnia/agent-sdk
```

```bash
yarn add @aither-somnia/agent-sdk
```

```bash
pnpm add @aither-somnia/agent-sdk
```

## 🏗️ Quick Start

### Creating Your First Agent

```typescript
import { createAgent, AgentCapability, BaseAgent } from '@aither-somnia/agent-sdk';

// Create a simple yield farming agent
const yieldAgent = createAgent('yield-optimizer', 'Yield Optimizer', [
  AgentCapability.YIELD_FARMING,
  AgentCapability.PORTFOLIO_ANALYSIS
])
.setDescription('Automatically finds and executes optimal yield farming strategies')
.setVersion('1.0.0')
.addSimulateHandler(async (intent) => {
  // Your simulation logic here
  return {
    success: true,
    gasEstimate: 250000,
    valueEstimate: parseFloat(intent.parameters.amount as string),
    risk: 'medium',
    calls: [], // Your transaction calls
    justification: 'Optimal yield strategy identified',
    warnings: [],
    confidence: 0.9
  };
})
.addExecuteHandler(async (intent) => {
  // Your execution logic here
  return {
    success: true,
    transactionHash: '0x...',
    gasUsed: 234567,
    valueTransferred: parseFloat(intent.parameters.amount as string),
    calls: [],
    timestamp: Date.now(),
    explorerUrl: 'https://explorer.testnet.somnia.network/tx/0x...'
  };
})
.build();
```

### Connecting to Aither-Somnia

```typescript
import { createAitherClient } from '@aither-somnia/agent-sdk';

const client = createAitherClient({
  rpcUrl: 'https://testnet.somnia.network',
  contractAddresses: {
    AGENT_REGISTRY: '0x...',
    EXECUTION_PROXY: '0x...',
    SWAP_ADAPTER: '0x...',
    STAKING_ADAPTER: '0x...',
    PORTFOLIO_VIEW: '0x...',
    AGENT_ORCHESTRATOR: '0x...'
  }
});

// Register your agent
await client.registerAgent(yieldAgent);

// Execute an intent
const intent = {
  id: 'yield-1',
  userAddress: '0x...',
  description: 'Find best yield farming opportunity',
  parameters: {
    amount: '1000',
    riskTolerance: 'medium',
    duration: '30d'
  },
  maxGas: 500000,
  maxValue: 1000,
  deadline: Math.floor(Date.now() / 1000) + 3600
};

const result = await client.executeIntent('yield-optimizer', intent);
console.log('Execution result:', result);
```

## 🎯 Core Concepts

### Agents

Agents are autonomous programs that can understand user intents and execute blockchain operations. Each agent has:

- **Capabilities**: What types of operations it can perform
- **Simulation**: Preview operations without executing them
- **Execution**: Perform actual on-chain transactions
- **Explanation**: Provide human-readable explanations of results

### Intents

Intents represent user desires expressed in natural language or structured parameters:

```typescript
interface AgentIntent {
  id: string;
  userAddress: string;
  description: string;
  parameters: Record<string, unknown>;
  maxGas: number;
  maxValue: number;
  deadline: number;
  slippage?: number;
  priority?: 'low' | 'medium' | 'high';
}
```

### Capabilities

Standard capabilities include:

- `SWAP` - Token swapping and DEX operations
- `STAKE` - Validator staking operations
- `YIELD_FARMING` - Liquidity mining and farming
- `PORTFOLIO_ANALYSIS` - Portfolio tracking and analytics
- `MARKET_RESEARCH` - Market data and trend analysis
- `RISK_ASSESSMENT` - Risk evaluation and monitoring

## 📋 Examples

### DEX Trading Agent

```typescript
import { BaseAgent, AgentCapability, RiskLevel } from '@aither-somnia/agent-sdk';

class DEXTradingAgent extends BaseAgent {
  constructor() {
    super('dex-trader', 'DEX Trading Agent', [AgentCapability.SWAP], '1.0.0');
  }

  async simulate(intent) {
    const { tokenIn, tokenOut, amountIn } = intent.parameters;
    
    // Get price quote from DEX
    const quote = await this.getSwapQuote(tokenIn, tokenOut, amountIn);
    
    // Assess risk based on price impact
    const risk = quote.priceImpact > 5 ? RiskLevel.HIGH : RiskLevel.MEDIUM;
    
    return {
      success: true,
      gasEstimate: 180000,
      valueEstimate: parseFloat(amountIn),
      risk,
      calls: await this.buildSwapCalls(intent),
      justification: `Swap ${amountIn} ${tokenIn} for ~${quote.amountOut} ${tokenOut}`,
      warnings: quote.priceImpact > 3 ? ['High price impact'] : [],
      confidence: 0.95
    };
  }

  async execute(intent) {
    // Implementation details...
  }

  private async getSwapQuote(tokenIn, tokenOut, amountIn) {
    // DEX integration logic
  }
}
```

### Portfolio Rebalancing Agent

```typescript
class PortfolioRebalancer extends BaseAgent {
  constructor() {
    super('rebalancer', 'Portfolio Rebalancer', [
      AgentCapability.PORTFOLIO_ANALYSIS,
      AgentCapability.REBALANCING,
      AgentCapability.SWAP
    ], '1.0.0');
  }

  async simulate(intent) {
    const { targetAllocation, currentPortfolio } = intent.parameters;
    
    // Calculate required rebalancing trades
    const trades = await this.calculateRebalancingTrades(
      currentPortfolio, 
      targetAllocation
    );
    
    // Estimate costs and risks
    const totalGas = trades.reduce((sum, trade) => sum + trade.gasEstimate, 0);
    const totalValue = trades.reduce((sum, trade) => sum + trade.valueAtRisk, 0);
    
    return {
      success: true,
      gasEstimate: totalGas,
      valueEstimate: totalValue,
      risk: this.assessRebalancingRisk(trades),
      calls: trades.flatMap(trade => trade.calls),
      justification: `Rebalance portfolio with ${trades.length} trades`,
      warnings: [],
      confidence: 0.88
    };
  }

  private async calculateRebalancingTrades(current, target) {
    // Rebalancing algorithm
  }
}
```

### Automated Staking Agent

```typescript
class AutoStaker extends BaseAgent {
  constructor() {
    super('auto-staker', 'Auto Staking Agent', [
      AgentCapability.STAKE,
      AgentCapability.RISK_ASSESSMENT
    ], '1.0.0');
  }

  async simulate(intent) {
    const { amount, strategy } = intent.parameters;
    
    // Find best validators based on strategy
    const validators = await this.findOptimalValidators(strategy);
    
    // Calculate expected rewards
    const expectedAPR = await this.calculateExpectedAPR(validators, amount);
    
    return {
      success: true,
      gasEstimate: 250000,
      valueEstimate: parseFloat(amount),
      risk: RiskLevel.LOW, // Staking is generally low risk
      calls: await this.buildStakingCalls(validators, amount),
      justification: `Stake ${amount} STT across ${validators.length} validators (Expected APR: ${expectedAPR}%)`,
      warnings: [],
      confidence: 0.92
    };
  }

  private async findOptimalValidators(strategy) {
    // Validator selection algorithm
  }
}
```

## 🔧 Configuration

### Environment Variables

```bash
# Somnia Network
SOMNIA_RPC_URL=https://testnet.somnia.network
SOMNIA_CHAIN_ID=2323

# Contract Addresses (update after deployment)
AGENT_REGISTRY_ADDRESS=0x...
EXECUTION_PROXY_ADDRESS=0x...
SWAP_ADAPTER_ADDRESS=0x...
STAKING_ADAPTER_ADDRESS=0x...

# API Keys (optional)
OPENROUTER_API_KEY=your-key
VENICE_API_KEY=your-key
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## 🧪 Testing

```typescript
import { createAgent, AgentCapability } from '@aither-somnia/agent-sdk';

describe('MyAgent', () => {
  let agent;
  
  beforeEach(() => {
    agent = createAgent('test-agent', 'Test Agent', [AgentCapability.SWAP])
      .addSimulateHandler(async (intent) => ({
        success: true,
        gasEstimate: 100000,
        valueEstimate: 0,
        risk: 'low',
        calls: [],
        justification: 'Test operation',
        warnings: [],
        confidence: 1.0
      }))
      .build();
  });

  test('should simulate successfully', async () => {
    const intent = {
      id: 'test-1',
      userAddress: '0x...',
      description: 'Test swap',
      parameters: { tokenA: '0x...', tokenB: '0x...', amount: '100' },
      maxGas: 200000,
      maxValue: 100,
      deadline: Math.floor(Date.now() / 1000) + 3600
    };

    const result = await agent.simulate(intent);
    expect(result.success).toBe(true);
    expect(result.gasEstimate).toBe(100000);
  });
});
```

## 📚 Advanced Usage

### Custom Capability

```typescript
import { AgentCapability } from '@aither-somnia/agent-sdk';

// Define custom capability
const CUSTOM_ARBITRAGE = 'custom_arbitrage' as AgentCapability;

class ArbitrageAgent extends BaseAgent {
  constructor() {
    super('arbitrage-bot', 'Arbitrage Bot', [CUSTOM_ARBITRAGE], '1.0.0');
  }

  async simulate(intent) {
    // Find arbitrage opportunities
    const opportunities = await this.scanArbitrageOpportunities();
    
    if (opportunities.length === 0) {
      return {
        success: false,
        gasEstimate: 0,
        valueEstimate: 0,
        risk: 'low',
        calls: [],
        justification: 'No profitable arbitrage opportunities found',
        warnings: [],
        confidence: 1.0
      };
    }

    // Select best opportunity
    const bestOpp = opportunities[0];
    
    return {
      success: true,
      gasEstimate: bestOpp.gasRequired,
      valueEstimate: bestOpp.investment,
      risk: this.assessArbitrageRisk(bestOpp),
      calls: await this.buildArbitrageCalls(bestOpp),
      justification: `Arbitrage opportunity: ${bestOpp.profitUSD} USD profit`,
      warnings: bestOpp.timeWindow < 60 ? ['Short time window'] : [],
      confidence: bestOpp.certainty
    };
  }
}
```

### Event Monitoring

```typescript
import { AitherClient, EventType } from '@aither-somnia/agent-sdk';

const client = createAitherClient(config);

// Listen to execution events
client.on(EventType.EXECUTION_COMPLETED, (event) => {
  console.log('Execution completed:', event);
  
  if (event.success) {
    // Handle success
    logMetrics(event);
  } else {
    // Handle failure
    alertOnFailure(event);
  }
});

// Listen to agent health changes
client.on(EventType.AGENT_UPDATED, (event) => {
  if (event.health.status === 'unhealthy') {
    // Take corrective action
    disableAgent(event.agentId);
  }
});
```

### Gas Optimization

```typescript
import { GasEstimationAccuracy, ContractHelper } from '@aither-somnia/agent-sdk';

class GasOptimizedAgent extends BaseAgent {
  async simulate(intent) {
    // Use high accuracy gas estimation
    const gasHelper = new ContractHelper();
    const gasEstimate = await gasHelper.estimateGas(
      this.buildCalls(intent),
      GasEstimationAccuracy.HIGH
    );
    
    // Apply gas optimization strategies
    const optimizedCalls = await this.optimizeGasUsage(this.buildCalls(intent));
    
    return {
      success: true,
      gasEstimate: gasEstimate * 1.1, // 10% buffer
      // ... rest of simulation
    };
  }

  private async optimizeGasUsage(calls) {
    // Gas optimization logic
    return calls;
  }
}
```

## 🔐 Security Best Practices

1. **Validate All Inputs**: Always validate user parameters and contract responses
2. **Use Simulation**: Never execute without successful simulation
3. **Set Appropriate Limits**: Configure reasonable gas and value limits
4. **Monitor Risk Scores**: Implement risk-based execution controls
5. **Handle Errors Gracefully**: Provide meaningful error messages
6. **Rate Limiting**: Implement rate limiting for agent operations

```typescript
class SecureAgent extends BaseAgent {
  async simulate(intent) {
    // Input validation
    this.validateIntent(intent);
    
    // Risk assessment
    const riskScore = await this.assessRisk(intent);
    if (riskScore > 0.8) {
      throw new Error('Risk too high for automatic execution');
    }
    
    // Simulation with safety checks
    const result = await this.performSimulation(intent);
    
    // Additional validation
    this.validateSimulationResult(result);
    
    return result;
  }
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Documentation](https://docs.aither-somnia.io)
- [Examples Repository](https://github.com/aither-somnia/examples)
- [Discord Community](https://discord.gg/aither-somnia)
- [Twitter](https://twitter.com/aither_somnia)

## 🆘 Support

- GitHub Issues: [Report bugs or request features](https://github.com/aither-somnia/aither-somnia/issues)
- Discord: Join our community for support and discussions
- Documentation: Comprehensive guides and API reference

---

Built with ❤️ by the Aither-Somnia team