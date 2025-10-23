import { Agent, AgentIntent, SimulationResult, ExecutionResult, generateTraceId, AgentRegistry } from './base';
import { OpenAI } from 'openai';

interface IntentClassification {
  intent: string;
  confidence: number;
  requiredAgents: string[];
  parameters: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
}

interface ExecutionPlan {
  id: string;
  userAddress: string;
  classification: IntentClassification;
  steps: AgentIntent[];
  estimatedGas: number;
  estimatedValue: number;
  riskAssessment: string;
  explanation: string;
}

interface UserPreferences {
  maxSpendPerIntent: number;
  defaultSlippage: number;
  allowedProtocols: string[];
  allowedContracts: string[];
  defaultCurrency: string;
  riskTolerance: 'low' | 'medium' | 'high';
  auto2FA: boolean;
  auto2FAThreshold: number;
}

interface UserMemory {
  address: string;
  preferences: UserPreferences;
  recentIntents: string[];
  frequentOperations: Map<string, number>;
  lastUpdated: number;
}

export class CoreRouter {
  private openai: OpenAI;
  private agentRegistry: AgentRegistry;
  private model: string;
  private userMemory: Map<string, UserMemory> = new Map();

  constructor(openaiApiKey: string, agentRegistry: AgentRegistry, model: string = 'gpt-4-turbo-preview') {
    this.openai = new OpenAI({
      apiKey: openaiApiKey,
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
    });
    this.agentRegistry = agentRegistry;
    this.model = model;
  }

  /**
   * Parse user intent and create execution plan
   */
  async parseIntent(
    userMessage: string,
    userAddress: string,
    context?: {
      previousMessages?: string[];
      userBalance?: number;
      currentPositions?: any[];
    }
  ): Promise<ExecutionPlan> {
    try {
      const classification = await this.classifyIntent(userMessage, context);
      const steps = await this.createExecutionSteps(classification, userAddress);
      
      // Calculate estimates from simulation results
      let estimatedGas = 0;
      let estimatedValue = 0;
      
      for (const step of steps) {
        const agents = this.agentRegistry.getByCapability(step.parameters.operation as string);
        if (agents.length > 0) {
          const simulation = await agents[0].simulate(step);
          estimatedGas += simulation.gasEstimate;
          estimatedValue += simulation.valueEstimate;
        }
      }

      const explanation = await this.generateExplanation(classification, steps, estimatedGas, estimatedValue);

      return {
        id: generateTraceId(),
        userAddress,
        classification,
        steps,
        estimatedGas,
        estimatedValue,
        riskAssessment: this.assessRisk(classification, estimatedValue),
        explanation
      };
    } catch (error) {
      throw new Error(`Failed to parse intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute a plan with the appropriate agents
   */
  async executePlan(plan: ExecutionPlan): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    for (const step of plan.steps) {
      try {
        // Find appropriate agent for this step
        const capability = this.inferCapabilityFromStep(step);
        const agents = this.agentRegistry.getByCapability(capability);
        
        if (agents.length === 0) {
          throw new Error(`No agent found for capability: ${capability}`);
        }

        // Use the first matching agent (could be improved with agent selection logic)
        const agent = agents[0];
        const result = await agent.execute(step);
        results.push(result);

        // Stop execution if any step fails (unless it's non-critical)
        if (!result.success && step.priority !== 'low') {
          break;
        }
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          calls: [],
          timestamp: Date.now()
        });
        break; // Stop on error
      }
    }

    return results;
  }

  /**
   * Simulate plan execution
   */
  async simulatePlan(plan: ExecutionPlan): Promise<SimulationResult[]> {
    const results: SimulationResult[] = [];

    for (const step of plan.steps) {
      const capability = this.inferCapabilityFromStep(step);
      const agents = this.agentRegistry.getByCapability(capability);
      
      if (agents.length === 0) {
        results.push({
          success: false,
          gasEstimate: 0,
          valueEstimate: 0,
          risk: 'high' as any,
          calls: [],
          justification: `No agent found for capability: ${capability}`,
          warnings: [`Missing agent for ${capability}`],
          confidence: 0
        });
        continue;
      }

      const agent = agents[0];
      const result = await agent.simulate(step);
      results.push(result);
    }

    return results;
  }

  private async classifyIntent(
    userMessage: string,
    context?: {
      previousMessages?: string[];
      userBalance?: number;
      currentPositions?: any[];
    }
  ): Promise<IntentClassification> {
    const systemPrompt = this.buildClassificationPrompt();
    const userPrompt = this.buildUserPrompt(userMessage, context);

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error('Invalid JSON response from LLM');
    }
  }

  private async createExecutionSteps(classification: IntentClassification, userAddress: string): Promise<AgentIntent[]> {
    const steps: AgentIntent[] = [];
    const baseDeadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    // Create steps based on classification
    switch (classification.intent) {
      case 'swap_tokens':
        steps.push({
          id: generateTraceId(),
          userAddress,
          description: `Swap ${classification.parameters.amountIn} ${classification.parameters.tokenIn} for ${classification.parameters.tokenOut}`,
          parameters: classification.parameters,
          maxGas: 300000,
          maxValue: parseFloat(classification.parameters.amountIn as string || '0'),
          deadline: baseDeadline,
          slippage: classification.parameters.slippage as number || 1
        });
        break;

      case 'stake_tokens':
        steps.push({
          id: generateTraceId(),
          userAddress,
          description: `Stake ${classification.parameters.amount} STT`,
          parameters: { ...classification.parameters, operation: 'stake' },
          maxGas: 300000,
          maxValue: parseFloat(classification.parameters.amount as string || '0'),
          deadline: baseDeadline
        });
        break;

      case 'unstake_tokens':
        steps.push({
          id: generateTraceId(),
          userAddress,
          description: `Unstake ${classification.parameters.amount} STT`,
          parameters: { ...classification.parameters, operation: 'unstake' },
          maxGas: 250000,
          maxValue: 0,
          deadline: baseDeadline
        });
        break;

      case 'claim_rewards':
        steps.push({
          id: generateTraceId(),
          userAddress,
          description: 'Claim staking rewards',
          parameters: { ...classification.parameters, operation: 'claim_rewards' },
          maxGas: 200000,
          maxValue: 0,
          deadline: baseDeadline
        });
        break;

      case 'portfolio_analysis':
        steps.push({
          id: generateTraceId(),
          userAddress,
          description: 'Analyze portfolio performance',
          parameters: { ...classification.parameters, operation: 'get_pnl' },
          maxGas: 0,
          maxValue: 0,
          deadline: baseDeadline
        });
        break;

      case 'get_balances':
        steps.push({
          id: generateTraceId(),
          userAddress,
          description: 'Get portfolio balances',
          parameters: { ...classification.parameters, operation: 'get_balances' },
          maxGas: 0,
          maxValue: 0,
          deadline: baseDeadline
        });
        break;

      case 'market_research':
        steps.push({
          id: generateTraceId(),
          userAddress,
          description: 'Research market data',
          parameters: { ...classification.parameters, operation: classification.parameters.operation || 'market_data' },
          maxGas: 0,
          maxValue: 0,
          deadline: baseDeadline
        });
        break;

      case 'transaction_analysis':
        steps.push({
          id: generateTraceId(),
          userAddress,
          description: 'Analyze transaction',
          parameters: { ...classification.parameters, operation: 'decode_transaction' },
          maxGas: 0,
          maxValue: 0,
          deadline: baseDeadline
        });
        break;

      case 'risk_assessment':
        steps.push({
          id: generateTraceId(),
          userAddress,
          description: 'Assess portfolio risk',
          parameters: { ...classification.parameters, operation: 'risk_assessment' },
          maxGas: 0,
          maxValue: 0,
          deadline: baseDeadline
        });
        break;

      case 'get_news':
        steps.push({
          id: generateTraceId(),
          userAddress,
          description: 'Fetch crypto news',
          parameters: { ...classification.parameters, operation: 'news' },
          maxGas: 0,
          maxValue: 0,
          deadline: baseDeadline
        });
        break;

      case 'complex_operation':
        // For complex operations, create multiple steps
        if (classification.requiredAgents.includes('trade-agent') && classification.requiredAgents.includes('stake-agent')) {
          // Example: "Swap 100 STT for ETH then stake the ETH"
          steps.push(...await this.createComplexSteps(classification, userAddress));
        }
        break;

      default:
        throw new Error(`Unsupported intent: ${classification.intent}`);
    }

    return steps;
  }

  private inferCapabilityFromStep(step: AgentIntent): string {
    const operation = step.parameters.operation as string;
    const desc = step.description.toLowerCase();
    
    // Trading operations
    if (desc.includes('swap') || operation === 'swap') return 'swap';
    
    // Staking operations
    if (operation === 'stake') return 'stake';
    if (operation === 'unstake') return 'unstake';
    if (operation === 'claim_rewards') return 'stake';
    
    // Portfolio operations
    if (desc.includes('portfolio') || operation === 'get_balances' || operation === 'get_pnl' || operation === 'get_positions') {
      return 'portfolio_analysis';
    }
    
    // Research operations
    if (operation === 'market_data' || operation === 'news' || operation === 'token_analysis' || operation === 'protocol_analysis') {
      return 'market_research';
    }
    
    // Analytics operations
    if (operation === 'decode_transaction' || operation === 'analyze_gas' || operation === 'risk_assessment' || operation === 'performance_report') {
      return 'transaction_analysis';
    }
    
    return 'unknown';
  }

  private buildClassificationPrompt(): string {
    return `You are an expert DeFi intent classifier for a multi-agent AI system on Somnia blockchain.

Your task is to analyze user messages and classify them into structured intents with high accuracy.

Available agent capabilities:
- swap: Token swapping and DEX operations
- stake: Validator staking operations  
- unstake: Token unstaking and position management
- portfolio_analysis: Portfolio tracking and analytics
- market_research: Market data and analysis
- transaction_analysis: Transaction decoding and explanation

Common intent types:
- swap_tokens: User wants to swap one token for another
- stake_tokens: User wants to stake tokens with validators
- unstake_tokens: User wants to unstake tokens
- claim_rewards: User wants to claim staking rewards
- portfolio_analysis: User wants to see portfolio overview
- market_research: User wants market data or news
- transaction_analysis: User wants to understand a transaction

Output format (JSON only):
{
  "intent": "swap_tokens|stake_tokens|unstake_tokens|claim_rewards|portfolio_analysis|market_research|transaction_analysis",
  "confidence": 0.0-1.0,
  "requiredAgents": ["agent1", "agent2"],
  "parameters": {
    // Intent-specific parameters
    // For swap: tokenIn, tokenOut, amountIn, amountOutMin, slippage
    // For stake: amount, validatorId (optional)  
    // For unstake: amount, positionId
    // For portfolio: timeframe, includeStaking
  },
  "priority": "low|medium|high",
  "riskLevel": "low|medium|high"
}

Rules:
- Always extract numeric amounts and addresses accurately
- Default slippage for swaps: 1%
- High priority for large amounts or time-sensitive operations
- Higher risk for larger amounts or complex operations
- Be conservative with confidence scores
- If unclear, ask for clarification by setting confidence < 0.5`;
  }

  private buildUserPrompt(
    userMessage: string,
    context?: {
      previousMessages?: string[];
      userBalance?: number;
      currentPositions?: any[];
    }
  ): string {
    let prompt = `User message: "${userMessage}"`;
    
    if (context?.userBalance) {
      prompt += `\nUser balance: ${context.userBalance} STT`;
    }
    
    if (context?.currentPositions?.length) {
      prompt += `\nCurrent positions: ${JSON.stringify(context.currentPositions)}`;
    }
    
    if (context?.previousMessages?.length) {
      prompt += `\nPrevious context: ${context.previousMessages.slice(-3).join('; ')}`;
    }
    
    return prompt;
  }

  private async generateExplanation(
    classification: IntentClassification,
    steps: AgentIntent[],
    estimatedGas: number,
    estimatedValue: number
  ): Promise<string> {
    const explanationPrompt = `Generate a clear, concise explanation for the user about what will happen.

Intent: ${classification.intent}
Steps: ${steps.length}
Estimated gas: ${estimatedGas}
Estimated value: ${estimatedValue} STT
Risk level: ${classification.riskLevel}

Provide a 2-3 sentence explanation of:
1. What action will be performed
2. Key parameters (amounts, validators, etc.)
3. Expected outcomes and any important considerations

Be friendly but precise. Don't include technical jargon.`;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: explanationPrompt }],
      temperature: 0.3,
      max_tokens: 200
    });

    return response.choices[0]?.message?.content || 'Execution plan generated successfully.';
  }

  private assessRisk(classification: IntentClassification, estimatedValue: number): string {
    if (classification.riskLevel === 'high' || estimatedValue > 10000) {
      return 'High risk operation - please review carefully before confirming.';
    }
    if (classification.riskLevel === 'medium' || estimatedValue > 1000) {
      return 'Medium risk operation - standard DeFi risks apply.';
    }
    return 'Low risk operation - minimal risk expected.';
  }

  /**
   * Get available agent capabilities
   */
  public getAvailableCapabilities(): string[] {
    const agents = this.agentRegistry.getAll();
    const capabilities = new Set<string>();
    
    agents.forEach(agent => {
      agent.capabilities.forEach(cap => capabilities.add(cap));
    });
    
    return Array.from(capabilities);
  }

  /**
   * Health check for all agents
   */
  public async healthCheck(): Promise<{ agent: string; status: 'healthy' | 'error'; error?: string }[]> {
    const agents = this.agentRegistry.getAll();
    const results = [];
    
    for (const agent of agents) {
      try {
        // Simple health check with minimal intent
        const testIntent: AgentIntent = {
          id: 'health-check',
          userAddress: '0x0000000000000000000000000000000000000000',
          description: 'Health check',
          parameters: {},
          maxGas: 100000,
          maxValue: 0,
          deadline: Math.floor(Date.now() / 1000) + 300
        };
        
        await agent.simulate(testIntent);
        results.push({ agent: agent.name, status: 'healthy' as const });
      } catch (error) {
        results.push({
          agent: agent.name,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }

  // Memory and preference management
  
  public getUserPreferences(userAddress: string): UserPreferences {
    const memory = this.userMemory.get(userAddress);
    if (memory) return memory.preferences;
    
    // Return default preferences
    return {
      maxSpendPerIntent: 10000,
      defaultSlippage: 1,
      allowedProtocols: [],
      allowedContracts: [],
      defaultCurrency: 'STT',
      riskTolerance: 'medium',
      auto2FA: true,
      auto2FAThreshold: 1000
    };
  }

  public setUserPreferences(userAddress: string, preferences: Partial<UserPreferences>): void {
    const existing = this.userMemory.get(userAddress);
    if (existing) {
      existing.preferences = { ...existing.preferences, ...preferences };
      existing.lastUpdated = Date.now();
    } else {
      this.userMemory.set(userAddress, {
        address: userAddress,
        preferences: { ...this.getUserPreferences(userAddress), ...preferences },
        recentIntents: [],
        frequentOperations: new Map(),
        lastUpdated: Date.now()
      });
    }
  }

  public recordIntent(userAddress: string, intent: string): void {
    const memory = this.userMemory.get(userAddress);
    if (!memory) {
      this.userMemory.set(userAddress, {
        address: userAddress,
        preferences: this.getUserPreferences(userAddress),
        recentIntents: [intent],
        frequentOperations: new Map([[intent, 1]]),
        lastUpdated: Date.now()
      });
    } else {
      memory.recentIntents.push(intent);
      if (memory.recentIntents.length > 50) {
        memory.recentIntents = memory.recentIntents.slice(-50);
      }
      
      const count = memory.frequentOperations.get(intent) || 0;
      memory.frequentOperations.set(intent, count + 1);
      memory.lastUpdated = Date.now();
    }
  }

  public getFrequentOperations(userAddress: string, limit: number = 5): Array<{ operation: string; count: number }> {
    const memory = this.userMemory.get(userAddress);
    if (!memory) return [];
    
    return Array.from(memory.frequentOperations.entries())
      .map(([operation, count]) => ({ operation, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private async createComplexSteps(classification: IntentClassification, userAddress: string): Promise<AgentIntent[]> {
    // Handle complex multi-step operations
    // This could be enhanced with more sophisticated planning logic
    const steps: AgentIntent[] = [];
    
    // Example implementation - would need to be expanded based on specific use cases
    return steps;
  }

  public clearUserMemory(userAddress: string): void {
    this.userMemory.delete(userAddress);
  }
}
