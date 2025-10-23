/**
 * @aither-somnia/agent-sdk
 * 
 * Extensible SDK for building AI agents on Somnia blockchain
 * 
 * @example
 * ```typescript
 * import { BaseAgent, createAgentSystem } from '@aither-somnia/agent-sdk';
 * 
 * class MyCustomAgent extends BaseAgent {
 *   async simulate(intent) {
 *     // Your simulation logic
 *   }
 *   async execute(intent) {
 *     // Your execution logic
 *   }
 * }
 * 
 * const system = createAgentSystem({
 *   rpcUrl: 'https://testnet.somnia.network',
 *   openrouterApiKey: 'your-key'
 * });
 * ```
 */

// Core Agent Types & Interfaces
export type {
  Agent,
  AgentIntent,
  SimulationResult,
  ExecutionResult,
  CallData,
  CallResult,
} from '../ai/agents/base';

export {
  BaseAgent,
  AgentRegistry,
  RiskLevel,
  AgentCapability,
  generateTraceId,
  formatGasEstimate,
  formatValueEstimate,
} from '../ai/agents/base';

// Router & Orchestration
export { CoreRouter } from '../ai/agents/router';
export type { UserPreferences, UserMemory } from '../ai/agents/router';

// Pre-built Agents
export { TradeAgent } from '../ai/agents/trade-agent';
export { StakeAgent } from '../ai/agents/stake-agent';
export { PortfolioAgent } from '../ai/agents/portfolio-agent';
export { ResearchAgent } from '../ai/agents/research-agent';
export { AnalyticsAgent } from '../ai/agents/analytics-agent';

// Somnia Network Utilities
export {
  SOMNIA_TESTNET,
  isMetaMaskInstalled,
  getCurrentChainId,
  isConnectedToSomnia,
  addSomniaNetwork,
  switchToSomniaNetwork,
  connectWalletToSomnia,
  getWalletBalance,
  onAccountsChanged,
  onChainChanged,
  getNetworkInfo,
  formatAddress,
  getExplorerUrl,
  checkSufficientBalance,
} from '../lib/somnia-wallet';

export type { SomniaNetwork } from '../lib/somnia-wallet';

// Agent System Factory
export { AgentSystem, createAgentSystem } from '../ai/agents';
export type { AgentSystemConfig } from '../ai/agents';

// Version
export const SDK_VERSION = '1.0.0';

// Default export for convenience
export default {
  BaseAgent,
  AgentRegistry,
  CoreRouter,
  createAgentSystem,
  SDK_VERSION,
};
