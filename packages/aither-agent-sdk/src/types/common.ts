/**
 * Risk levels for agent operations
 */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Priority levels for intent execution
 */
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * Standard agent capabilities
 */
export enum AgentCapability {
  // DeFi Operations
  SWAP = 'swap',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  YIELD_FARMING = 'yield_farming',
  LENDING = 'lending',
  BORROWING = 'borrowing',
  
  // Portfolio Management
  PORTFOLIO_ANALYSIS = 'portfolio_analysis',
  REBALANCING = 'rebalancing',
  RISK_ASSESSMENT = 'risk_assessment',
  
  // Research & Analytics
  MARKET_RESEARCH = 'market_research',
  TRANSACTION_ANALYSIS = 'transaction_analysis',
  PRICE_ANALYSIS = 'price_analysis',
  NEWS_ANALYSIS = 'news_analysis',
  
  // Cross-chain
  BRIDGE = 'bridge',
  CROSS_CHAIN_SWAP = 'cross_chain_swap',
  
  // Governance
  GOVERNANCE = 'governance',
  VOTING = 'voting',
  PROPOSAL_ANALYSIS = 'proposal_analysis',
  
  // Security
  SECURITY_AUDIT = 'security_audit',
  RISK_MONITORING = 'risk_monitoring',
  
  // Automation
  RECURRING_TASKS = 'recurring_tasks',
  CONDITION_MONITORING = 'condition_monitoring',
  
  // Social
  SOCIAL_TRADING = 'social_trading',
  COMMUNITY_ANALYSIS = 'community_analysis',
  
  // Custom capabilities (for extensibility)
  CUSTOM = 'custom'
}

/**
 * Network identifiers
 */
export enum Network {
  SOMNIA_TESTNET = 'somnia-testnet',
  SOMNIA_MAINNET = 'somnia-mainnet',
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism'
}

/**
 * Token standards
 */
export enum TokenStandard {
  NATIVE = 'native',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155'
}

/**
 * Transaction status
 */
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Agent execution modes
 */
export enum ExecutionMode {
  SIMULATION = 'simulation',
  DRY_RUN = 'dry_run',
  EXECUTE = 'execute'
}

/**
 * Event types for agent system
 */
export enum EventType {
  AGENT_REGISTERED = 'agent_registered',
  AGENT_UPDATED = 'agent_updated',
  AGENT_REMOVED = 'agent_removed',
  INTENT_CREATED = 'intent_created',
  INTENT_SIMULATED = 'intent_simulated',
  INTENT_EXECUTED = 'intent_executed',
  EXECUTION_COMPLETED = 'execution_completed',
  ERROR_OCCURRED = 'error_occurred'
}

/**
 * Log levels for debugging
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Gas estimation accuracy
 */
export enum GasEstimationAccuracy {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EXACT = 'exact'
}

/**
 * Slippage tolerance presets
 */
export const SLIPPAGE_PRESETS = {
  VERY_LOW: 0.1,    // 0.1%
  LOW: 0.5,         // 0.5%
  MEDIUM: 1.0,      // 1.0%
  HIGH: 3.0,        // 3.0%
  VERY_HIGH: 5.0    // 5.0%
} as const;

/**
 * Common error codes
 */
export enum ErrorCode {
  // Agent errors
  AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',
  AGENT_UNAVAILABLE = 'AGENT_UNAVAILABLE',
  AGENT_CAPABILITY_MISMATCH = 'AGENT_CAPABILITY_MISMATCH',
  
  // Intent errors
  INTENT_INVALID = 'INTENT_INVALID',
  INTENT_EXPIRED = 'INTENT_EXPIRED',
  INTENT_UNSUPPORTED = 'INTENT_UNSUPPORTED',
  
  // Execution errors
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  SIMULATION_FAILED = 'SIMULATION_FAILED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',
  DEADLINE_EXCEEDED = 'DEADLINE_EXCEEDED',
  GAS_LIMIT_EXCEEDED = 'GAS_LIMIT_EXCEEDED',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SCHEMA_ERROR = 'SCHEMA_ERROR',
  TYPE_ERROR = 'TYPE_ERROR',
  
  // Permission errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // Configuration errors
  CONFIG_ERROR = 'CONFIG_ERROR',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  
  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Type for error with code and context
 */
export interface CodedError extends Error {
  code: ErrorCode;
  context?: Record<string, unknown>;
}

/**
 * Utility type for making all properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Utility type for making specific properties required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Utility type for deep partial
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Utility type for branded strings (type safety)
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * Address type for type safety
 */
export type Address = Brand<string, 'Address'>;

/**
 * Transaction hash type
 */
export type TransactionHash = Brand<string, 'TransactionHash'>;

/**
 * Agent ID type
 */
export type AgentId = Brand<string, 'AgentId'>;

/**
 * Intent ID type
 */
export type IntentId = Brand<string, 'IntentId'>;

/**
 * Timestamp type (Unix timestamp)
 */
export type Timestamp = Brand<number, 'Timestamp'>;

/**
 * Wei amount type (for exact precision)
 */
export type Wei = Brand<string, 'Wei'>;

/**
 * Gas amount type
 */
export type Gas = Brand<number, 'Gas'>;

/**
 * Percentage type (0-100)
 */
export type Percentage = Brand<number, 'Percentage'>;

/**
 * Basis points type (0-10000, where 10000 = 100%)
 */
export type BasisPoints = Brand<number, 'BasisPoints'>;