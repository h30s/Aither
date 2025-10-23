import { ethers } from 'ethers';
import { AgentRegistry } from './base';
import { TradeAgent } from './trade-agent';
import { StakeAgent } from './stake-agent';
import { PortfolioAgent } from './portfolio-agent';
import { ResearchAgent } from './research-agent';
import { AnalyticsAgent } from './analytics-agent';
import { CoreRouter } from './router';

// Contract addresses (to be updated after deployment)
const CONTRACT_ADDRESSES = {
  SWAP_ADAPTER: process.env.NEXT_PUBLIC_SWAP_ADAPTER_ADDRESS || '0x0000000000000000000000000000000000000001',
  STAKING_ADAPTER: process.env.NEXT_PUBLIC_STAKING_ADAPTER_ADDRESS || '0x0000000000000000000000000000000000000002',
  AGENT_REGISTRY: process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000003',
  EXECUTION_PROXY: process.env.NEXT_PUBLIC_EXECUTION_PROXY_ADDRESS || '0x0000000000000000000000000000000000000004',
  PORTFOLIO_VIEW: process.env.NEXT_PUBLIC_PORTFOLIO_VIEW_ADDRESS || '0x0000000000000000000000000000000000000005'
};

export interface AgentSystemConfig {
  rpcUrl: string;
  openrouterApiKey: string;
  veniceApiKey?: string;
  model?: string;
  contractAddresses?: Partial<typeof CONTRACT_ADDRESSES>;
}

export class AgentSystem {
  private provider: ethers.Provider;
  private registry: AgentRegistry;
  private router: CoreRouter;
  private tradeAgent: TradeAgent;
  private stakeAgent: StakeAgent;
  private portfolioAgent: PortfolioAgent;
  private researchAgent: ResearchAgent;
  private analyticsAgent: AnalyticsAgent;
  
  constructor(config: AgentSystemConfig) {
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    
    // Initialize agent registry
    this.registry = new AgentRegistry();
    
    // Initialize agents with contract addresses
    const addresses = { ...CONTRACT_ADDRESSES, ...config.contractAddresses };
    
    this.tradeAgent = new TradeAgent(this.provider, addresses.SWAP_ADAPTER);
    this.stakeAgent = new StakeAgent(this.provider, addresses.STAKING_ADAPTER);
    this.portfolioAgent = new PortfolioAgent(this.provider, addresses.PORTFOLIO_VIEW);
    this.researchAgent = new ResearchAgent(config.veniceApiKey || process.env.VENICE_API || '');
    this.analyticsAgent = new AnalyticsAgent(this.provider);
    
    // Register agents
    this.registry.register(this.tradeAgent);
    this.registry.register(this.stakeAgent);
    this.registry.register(this.portfolioAgent);
    this.registry.register(this.researchAgent);
    this.registry.register(this.analyticsAgent);
    
    // Initialize router with OpenRouter
    this.router = new CoreRouter(
      config.openrouterApiKey,
      this.registry,
      config.model || 'openai/gpt-4-turbo-preview'
    );
  }

  /**
   * Process user message and return execution plan
   */
  async processMessage(
    message: string,
    userAddress: string,
    context?: {
      previousMessages?: string[];
      userBalance?: number;
      currentPositions?: any[];
    }
  ) {
    try {
      const plan = await this.router.parseIntent(message, userAddress, context);
      return plan;
    } catch (error) {
      throw new Error(`Failed to process message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute a plan
   */
  async executePlan(planId: string, plan: any) {
    try {
      return await this.router.executePlan(plan);
    } catch (error) {
      throw new Error(`Failed to execute plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Simulate a plan
   */
  async simulatePlan(plan: any) {
    try {
      return await this.router.simulatePlan(plan);
    } catch (error) {
      throw new Error(`Failed to simulate plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available capabilities
   */
  getCapabilities() {
    return this.router.getAvailableCapabilities();
  }

  /**
   * Health check all agents
   */
  async healthCheck() {
    return await this.router.healthCheck();
  }

  /**
   * Get agent registry (for advanced usage)
   */
  getRegistry() {
    return this.registry;
  }

  /**
   * Get specific agent
   */
  getTradeAgent() {
    return this.tradeAgent;
  }

  getStakeAgent() {
    return this.stakeAgent;
  }

  getPortfolioAgent() {
    return this.portfolioAgent;
  }

  getResearchAgent() {
    return this.researchAgent;
  }

  getAnalyticsAgent() {
    return this.analyticsAgent;
  }

  /**
   * Update contract addresses (useful after deployment)
   */
  updateContractAddresses(addresses: Partial<typeof CONTRACT_ADDRESSES>) {
    // This would require recreating agents in a production system
    console.warn('Contract address updates require system restart');
  }
}

// Factory function for easy initialization
export function createAgentSystem(config: AgentSystemConfig): AgentSystem {
  return new AgentSystem(config);
}

// Export individual agents and types for external use
export { TradeAgent } from './trade-agent';
export { StakeAgent } from './stake-agent';
export { PortfolioAgent } from './portfolio-agent';
export { ResearchAgent } from './research-agent';
export { AnalyticsAgent } from './analytics-agent';
export { CoreRouter } from './router';
export { AgentRegistry } from './base';
export type { Agent, AgentIntent, SimulationResult, ExecutionResult } from './base';

// Default export for convenience
export default AgentSystem;