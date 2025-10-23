/**
 * @fileoverview Aither-Somnia Agent SDK
 * @version 1.0.0
 * @description Official SDK for building AI agents on the Aither-Somnia multi-agent platform
 */

// Core types and interfaces
export type {
  Agent,
  AgentIntent,
  SimulationResult,
  ExecutionResult,
  CallData,
  CallResult,
} from './types/agent';

export type {
  SomniaConfig,
  ContractAddresses,
  NetworkConfig,
  TokenInfo,
} from './types/network';

export type {
  AgentCapability,
  RiskLevel,
  Priority,
} from './types/common';

// Core classes
export { BaseAgent } from './core/base-agent';
export { AgentRegistry } from './core/agent-registry';
export { SomniaProvider } from './core/somnia-provider';

// Utilities
export { AgentBuilder } from './utils/agent-builder';
export { ContractHelper } from './utils/contract-helper';
export { ValidationHelper } from './utils/validation';
export { FormatHelper } from './utils/format';

// Schemas for validation
export {
  AgentIntentSchema,
  SimulationResultSchema,
  CallDataSchema,
} from './schemas/agent';

// Constants
export {
  SOMNIA_TESTNET,
  DEFAULT_GAS_LIMITS,
  SUPPORTED_CAPABILITIES,
} from './constants';

// Client for interacting with deployed Aither-Somnia system
export { AitherClient } from './client/aither-client';

// Version info
export const SDK_VERSION = '1.0.0';
export const COMPATIBLE_PLATFORM_VERSION = '1.0.0';

/**
 * Quick start factory function
 * @param config - Configuration for the SDK
 * @returns Configured AitherClient instance
 */
export function createAitherClient(config: {
  rpcUrl: string;
  contractAddresses: ContractAddresses;
  privateKey?: string;
}) {
  return new AitherClient(config);
}

/**
 * Agent builder factory function
 * @param id - Unique identifier for the agent
 * @param name - Human-readable name
 * @param capabilities - Array of capabilities
 * @returns AgentBuilder instance for method chaining
 */
export function createAgent(id: string, name: string, capabilities: AgentCapability[]) {
  return new AgentBuilder(id, name, capabilities);
}