# 🤖 Aither Agent SDK

**Extensible SDK for building AI agents on Somnia blockchain**

Build powerful AI agents that can understand natural language and execute DeFi operations on Somnia blockchain.

[![npm version](https://badge.fury.io/js/@aither-somnia%2Fagent-sdk.svg)](https://www.npmjs.com/package/@aither-somnia/agent-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

---

## 📦 Installation

```bash
npm install @aither-somnia/agent-sdk ethers
# or
yarn add @aither-somnia/agent-sdk ethers
# or
pnpm add @aither-somnia/agent-sdk ethers
```

---

## 🚀 Quick Start

### 1. Create Your First Agent

```typescript
import { BaseAgent, AgentIntent, SimulationResult, ExecutionResult, RiskLevel } from '@aither-somnia/agent-sdk';
import { ethers } from 'ethers';

class GreetingAgent extends BaseAgent {
  constructor() {
    super('greeting-agent', 'Greeting Agent', ['greet', 'hello']);
  }

  async simulate(intent: AgentIntent): Promise<SimulationResult> {
    return {
      success: true,
      gasEstimate: 0,
      valueEstimate: 0,
      risk: RiskLevel.LOW,
      calls: [],
      justification: `Will greet ${intent.userAddress}`,
      warnings: [],
      confidence: 1.0,
    };
  }

  async execute(intent: AgentIntent): Promise<ExecutionResult> {
    console.log(`Hello, ${intent.userAddress}!`);
    
    return {
      success: true,
      gasUsed: 0,
      valueTransferred: 0,
      calls: [],
      timestamp: Date.now(),
    };
  }
}

// Use your agent
const agent = new GreetingAgent();
const intent = {
  id: 'test-1',
  userAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  description: 'Say hello',
  parameters: {},
  maxGas: 100000,
  maxValue: 0,
  deadline: Date.now() + 3600,
};

const simulation = await agent.simulate(intent);
if (simulation.success) {
  await agent.execute(intent);
}
```

### 2. Use the Agent System

```typescript
import { createAgentSystem } from '@aither-somnia/agent-sdk';

const system = createAgentSystem({
  rpcUrl: 'https://testnet.somnia.network',
  openrouterApiKey: 'your-openrouter-key',
  veniceApiKey: 'your-venice-key', // Optional
});

// Process natural language
const plan = await system.processMessage(
  "Stake 100 STT with the best validator",
  userAddress
);

// Simulate the plan
const simulation = await system.simulatePlan(plan);

// Execute if simulation succeeds
if (simulation.every(s => s.success)) {
  const results = await system.executePlan(plan.id, plan);
}
```

### 3. Connect to Somnia Network

```typescript
import { connectWalletToSomnia, getWalletBalance } from '@aither-somnia/agent-sdk';

// Connect wallet and switch to Somnia
const { success, address, provider } = await connectWalletToSomnia();

if (success && address) {
  // Get balance
  const balance = await getWalletBalance(address, provider);
  console.log(`Balance: ${balance?.balanceFormatted} STT`);
}
```

---

## 📚 Core Concepts

### Agent Interface

Every agent must implement three methods:

```typescript
interface Agent {
  id: string;
  name: string;
  capabilities: string[];
  
  // Simulate execution without state changes
  simulate(intent: AgentIntent): Promise<SimulationResult>;
  
  // Execute the actual operation
  execute(intent: AgentIntent): Promise<ExecutionResult>;
  
  // Explain the result to the user
  explain(result: ExecutionResult): Promise<string>;
}
```

### Agent Intent

Describes what the user wants to do:

```typescript
interface AgentIntent {
  id: string;              // Unique identifier
  userAddress: string;     // Wallet address
  description: string;     // Human-readable description
  parameters: object;      // Operation-specific params
  maxGas: number;         // Max gas to spend
  maxValue: number;       // Max value to transfer
  deadline: number;       // Unix timestamp
  slippage?: number;      // Optional slippage tolerance
  priority?: 'low' | 'medium' | 'high';
}
```

### Simulation Result

What would happen if we execute:

```typescript
interface SimulationResult {
  success: boolean;
  gasEstimate: number;
  valueEstimate: number;
  risk: RiskLevel;
  calls: CallData[];
  justification: string;
  warnings: string[];
  confidence: number;      // 0-1 confidence score
}
```

---

## 🛠️ Built-in Agents

The SDK includes 5 production-ready agents:

### 1. Trade Agent

Handles token swapping with optimal routing:

```typescript
import { TradeAgent } from '@aither-somnia/agent-sdk';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://testnet.somnia.network');
const tradeAgent = new TradeAgent(provider, swapAdapterAddress);

// Get best route
const route = await tradeAgent.getBestRoute(
  tokenInAddress,
  tokenOutAddress,
  '100' // amount
);

console.log('Expected output:', route.expectedOutput);
console.log('Price impact:', route.priceImpact);
```

### 2. Stake Agent

Manages validator staking:

```typescript
import { StakeAgent } from '@aither-somnia/agent-sdk';

const stakeAgent = new StakeAgent(provider, stakingAdapterAddress);

// Get best validators
const validators = stakeAgent.getBestValidators(3);

// Calculate expected rewards
const rewards = stakeAgent.calculateExpectedRewards(
  1000,        // amount
  validatorId,
  365          // days
);
```

### 3. Portfolio Agent

Tracks balances and performance:

```typescript
import { PortfolioAgent } from '@aither-somnia/agent-sdk';

const portfolioAgent = new PortfolioAgent(provider, portfolioViewAddress);

// Get allocation
const allocation = await portfolioAgent.calculateAllocation(userAddress);

// Get performance metrics
const metrics = await portfolioAgent.getPerformanceMetrics(userAddress);
console.log('ROI:', metrics.roi);
console.log('Sharpe Ratio:', metrics.sharpeRatio);
```

### 4. Research Agent

Market data and news via Venice API:

```typescript
import { ResearchAgent } from '@aither-somnia/agent-sdk';

const researchAgent = new ResearchAgent(veniceApiKey);

// Get sentiment
const sentiment = await researchAgent.getSentiment('Somnia');
console.log('Market sentiment:', sentiment.label);
```

### 5. Analytics Agent

Transaction analysis and optimization:

```typescript
import { AnalyticsAgent } from '@aither-somnia/agent-sdk';

const analyticsAgent = new AnalyticsAgent(provider);

// Compare transactions
const comparison = await analyticsAgent.compareTransactions(
  txHash1,
  txHash2
);

console.log('Gas difference:', comparison.comparison.gasDifference);
```

---

## 🎨 Advanced Usage

### Custom Agent with State

```typescript
class CounterAgent extends BaseAgent {
  private count = 0;

  constructor() {
    super('counter', 'Counter Agent', ['count', 'increment']);
  }

  async simulate(intent: AgentIntent): Promise<SimulationResult> {
    const nextCount = this.count + 1;
    
    return {
      success: true,
      gasEstimate: 0,
      valueEstimate: 0,
      risk: RiskLevel.LOW,
      calls: [],
      justification: `Count will be ${nextCount}`,
      warnings: [],
      confidence: 1.0,
    };
  }

  async execute(intent: AgentIntent): Promise<ExecutionResult> {
    this.count++;
    
    return {
      success: true,
      gasUsed: 0,
      valueTransferred: 0,
      calls: [{
        success: true,
        gasUsed: 0,
        returnData: JSON.stringify({ count: this.count }),
      }],
      timestamp: Date.now(),
    };
  }

  async explain(result: ExecutionResult): Promise<string> {
    return `Counter incremented to ${this.count}`;
  }
}
```

### Agent with External API

```typescript
class WeatherAgent extends BaseAgent {
  constructor(private apiKey: string) {
    super('weather', 'Weather Agent', ['weather', 'forecast']);
  }

  async simulate(intent: AgentIntent): Promise<SimulationResult> {
    return {
      success: true,
      gasEstimate: 0,
      valueEstimate: 0,
      risk: RiskLevel.LOW,
      calls: [],
      justification: 'Will fetch weather data from API',
      warnings: [],
      confidence: 0.95,
    };
  }

  async execute(intent: AgentIntent): Promise<ExecutionResult> {
    const city = intent.parameters.city as string;
    const response = await fetch(
      `https://api.weather.com/current?city=${city}&key=${this.apiKey}`
    );
    const data = await response.json();

    return {
      success: true,
      gasUsed: 0,
      valueTransferred: 0,
      calls: [{
        success: true,
        gasUsed: 0,
        returnData: JSON.stringify(data),
      }],
      timestamp: Date.now(),
    };
  }
}
```

### Multi-Step Agent

```typescript
class ComplexAgent extends BaseAgent {
  async execute(intent: AgentIntent): Promise<ExecutionResult> {
    const results: CallResult[] = [];

    // Step 1: Approve token
    const approveResult = await this.approveToken(intent);
    results.push(approveResult);

    if (!approveResult.success) {
      return {
        success: false,
        error: 'Approval failed',
        calls: results,
        timestamp: Date.now(),
      };
    }

    // Step 2: Execute swap
    const swapResult = await this.executeSwap(intent);
    results.push(swapResult);

    return {
      success: swapResult.success,
      gasUsed: results.reduce((sum, r) => sum + r.gasUsed, 0),
      calls: results,
      timestamp: Date.now(),
    };
  }

  private async approveToken(intent: AgentIntent): Promise<CallResult> {
    // Implementation
  }

  private async executeSwap(intent: AgentIntent): Promise<CallResult> {
    // Implementation
  }
}
```

---

## 🔧 Utilities

### Network Management

```typescript
import {
  SOMNIA_TESTNET,
  isConnectedToSomnia,
  switchToSomniaNetwork,
  addSomniaNetwork,
} from '@aither-somnia/agent-sdk';

// Check current network
const isOnSomnia = await isConnectedToSomnia();

if (!isOnSomnia) {
  // Try to switch
  const { success } = await switchToSomniaNetwork();
  
  if (!success) {
    // Add network first
    await addSomniaNetwork();
  }
}
```

### Address Formatting

```typescript
import { formatAddress, getExplorerUrl } from '@aither-somnia/agent-sdk';

const short = formatAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
// "0x742d...0bEb"

const url = getExplorerUrl(txHash, 'tx');
// "https://explorer.testnet.somnia.network/tx/0x..."
```

### Balance Checking

```typescript
import { checkSufficientBalance } from '@aither-somnia/agent-sdk';

const check = await checkSufficientBalance(
  userAddress,
  '100', // required amount
  provider
);

if (!check.sufficient) {
  console.log(`Insufficient balance. Have: ${check.current}, Need: ${check.required}`);
}
```

---

## 📖 API Reference

### AgentRegistry

Manage multiple agents:

```typescript
import { AgentRegistry } from '@aither-somnia/agent-sdk';

const registry = new AgentRegistry();

// Register agents
registry.register(tradeAgent);
registry.register(stakeAgent);

// Get by capability
const swapAgents = registry.getByCapability('swap');

// Get all agents
const all = registry.getAll();
```

### CoreRouter

Intent classification and routing:

```typescript
import { CoreRouter } from '@aither-somnia/agent-sdk';

const router = new CoreRouter(openrouterApiKey, registry);

// Parse user intent
const plan = await router.parseIntent(
  "Swap 100 STT for ETH",
  userAddress
);

// Get user preferences
const prefs = router.getUserPreferences(userAddress);

// Set preferences
router.setUserPreferences(userAddress, {
  defaultSlippage: 1.5,
  maxSpendPerIntent: 5000,
});

// Record intent for learning
router.recordIntent(userAddress, 'swap_tokens');

// Get frequent operations
const frequent = router.getFrequentOperations(userAddress, 5);
```

---

## 🧪 Testing Your Agents

```typescript
import { BaseAgent, AgentIntent, RiskLevel } from '@aither-somnia/agent-sdk';

describe('MyAgent', () => {
  let agent: MyAgent;

  beforeEach(() => {
    agent = new MyAgent();
  });

  it('should simulate successfully', async () => {
    const intent: AgentIntent = {
      id: 'test',
      userAddress: '0x123...',
      description: 'Test operation',
      parameters: {},
      maxGas: 100000,
      maxValue: 0,
      deadline: Date.now() + 3600,
    };

    const result = await agent.simulate(intent);
    
    expect(result.success).toBe(true);
    expect(result.risk).toBe(RiskLevel.LOW);
  });

  it('should execute successfully', async () => {
    const result = await agent.execute(intent);
    
    expect(result.success).toBe(true);
    expect(result.gasUsed).toBeGreaterThan(0);
  });
});
```

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT © Aither Team

---

## 🔗 Links

- [Documentation](https://docs.aither-somnia.io)
- [GitHub](https://github.com/aither-somnia/aither-somnia)
- [Discord](https://discord.gg/aither)
- [Twitter](https://twitter.com/aither_somnia)

---

## 💡 Examples

Check out [/examples](./examples) for more use cases:

- Custom DeFi agent
- Multi-chain agent
- AI-powered strategy agent
- Automated portfolio rebalancing
- Social trading agent

---

**Happy Building! 🚀**
