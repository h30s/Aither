import { z } from 'zod';

// Base types for agent system
export interface Agent {
  id: string;
  name: string;
  capabilities: string[];
  simulate(intent: AgentIntent): Promise<SimulationResult>;
  execute(intent: AgentIntent): Promise<ExecutionResult>;
  explain(result: ExecutionResult): Promise<string>;
}

export interface AgentIntent {
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

export interface SimulationResult {
  success: boolean;
  gasEstimate: number;
  valueEstimate: number;
  risk: RiskLevel;
  calls: CallData[];
  justification: string;
  warnings: string[];
  confidence: number;
}

export interface ExecutionResult {
  success: boolean;
  transactionHash?: string;
  gasUsed?: number;
  valueTransferred?: number;
  calls: CallResult[];
  error?: string;
  timestamp: number;
  explorerUrl?: string;
}

export interface CallData {
  target: string;
  data: string;
  value: number;
  description: string;
  gasLimit?: number;
}

export interface CallResult {
  success: boolean;
  gasUsed: number;
  returnData?: string;
  error?: string;
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AgentCapability {
  SWAP = 'swap',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  PORTFOLIO_ANALYSIS = 'portfolio_analysis',
  MARKET_RESEARCH = 'market_research',
  TRANSACTION_ANALYSIS = 'transaction_analysis',
  YIELD_FARMING = 'yield_farming',
  GOVERNANCE = 'governance',
  BRIDGE = 'bridge'
}

// Zod schemas for validation
export const AgentIntentSchema = z.object({
  id: z.string(),
  userAddress: z.string(),
  description: z.string(),
  parameters: z.record(z.unknown()),
  maxGas: z.number().positive(),
  maxValue: z.number().nonnegative(),
  deadline: z.number(),
  slippage: z.number().min(0).max(100).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional()
});

export const CallDataSchema = z.object({
  target: z.string(),
  data: z.string(),
  value: z.number().nonnegative(),
  description: z.string(),
  gasLimit: z.number().positive().optional()
});

export const SimulationResultSchema = z.object({
  success: z.boolean(),
  gasEstimate: z.number().nonnegative(),
  valueEstimate: z.number().nonnegative(),
  risk: z.enum(['low', 'medium', 'high', 'critical']),
  calls: z.array(CallDataSchema),
  justification: z.string(),
  warnings: z.array(z.string()),
  confidence: z.number().min(0).max(1)
});

// Base agent implementation
export abstract class BaseAgent implements Agent {
  public readonly id: string;
  public readonly name: string;
  public readonly capabilities: string[];

  constructor(id: string, name: string, capabilities: string[]) {
    this.id = id;
    this.name = name;
    this.capabilities = capabilities;
  }

  abstract simulate(intent: AgentIntent): Promise<SimulationResult>;
  abstract execute(intent: AgentIntent): Promise<ExecutionResult>;

  async explain(result: ExecutionResult): Promise<string> {
    if (result.success) {
      return `Successfully executed transaction. Gas used: ${result.gasUsed}. ${
        result.transactionHash ? `Transaction: ${result.transactionHash}` : ''
      }`;
    } else {
      return `Transaction failed: ${result.error || 'Unknown error'}`;
    }
  }

  protected validateIntent(intent: AgentIntent): void {
    const result = AgentIntentSchema.safeParse(intent);
    if (!result.success) {
      throw new Error(`Invalid intent: ${result.error.message}`);
    }
  }

  protected calculateRisk(
    valueAtRisk: number,
    complexity: number,
    priceImpact: number = 0
  ): RiskLevel {
    let riskScore = 0;

    // Value risk (0-40 points)
    if (valueAtRisk > 10000) riskScore += 40;
    else if (valueAtRisk > 1000) riskScore += 20;
    else if (valueAtRisk > 100) riskScore += 10;

    // Complexity risk (0-30 points)
    riskScore += Math.min(complexity * 10, 30);

    // Price impact risk (0-30 points)
    riskScore += Math.min(priceImpact * 100, 30);

    if (riskScore >= 70) return RiskLevel.CRITICAL;
    if (riskScore >= 50) return RiskLevel.HIGH;
    if (riskScore >= 25) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  protected generateExplorerUrl(txHash: string): string {
    const explorerUrl = process.env.SOMNIA_EXPLORER_URL || 'https://explorer.testnet.somnia.network';
    return `${explorerUrl}/tx/${txHash}`;
  }
}

// Agent registry for managing all agents
export class AgentRegistry {
  private agents = new Map<string, Agent>();

  register(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  get(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  getByCapability(capability: string): Agent[] {
    return Array.from(this.agents.values())
      .filter(agent => agent.capabilities.includes(capability));
  }

  getAll(): Agent[] {
    return Array.from(this.agents.values());
  }

  unregister(id: string): void {
    this.agents.delete(id);
  }
}

// Utility functions
export function formatGasEstimate(gas: number): string {
  if (gas > 1000000) return `${(gas / 1000000).toFixed(2)}M gas`;
  if (gas > 1000) return `${(gas / 1000).toFixed(1)}K gas`;
  return `${gas} gas`;
}

export function formatValueEstimate(value: number): string {
  if (value > 1000) return `${(value / 1000).toFixed(2)}K STT`;
  return `${value.toFixed(4)} STT`;
}

export function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}