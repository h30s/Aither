import { RiskLevel, Priority, AgentCapability } from './common';

/**
 * Core agent interface that all agents must implement
 */
export interface Agent {
  /** Unique identifier for the agent */
  readonly id: string;
  
  /** Human-readable name for the agent */
  readonly name: string;
  
  /** Array of capabilities this agent supports */
  readonly capabilities: AgentCapability[];
  
  /** Agent version for compatibility tracking */
  readonly version: string;
  
  /** Agent description */
  readonly description?: string;
  
  /**
   * Simulate execution of an intent without making state changes
   * @param intent - The intent to simulate
   * @returns Promise resolving to simulation results
   */
  simulate(intent: AgentIntent): Promise<SimulationResult>;
  
  /**
   * Execute an intent and make on-chain changes
   * @param intent - The intent to execute
   * @returns Promise resolving to execution results
   */
  execute(intent: AgentIntent): Promise<ExecutionResult>;
  
  /**
   * Explain the results of an execution in human-readable terms
   * @param result - The execution result to explain
   * @returns Promise resolving to explanation string
   */
  explain(result: ExecutionResult): Promise<string>;
  
  /**
   * Validate that the agent can handle a specific intent
   * @param intent - The intent to validate
   * @returns Promise resolving to validation result
   */
  validate?(intent: AgentIntent): Promise<ValidationResult>;
  
  /**
   * Get agent health status and diagnostics
   * @returns Promise resolving to health information
   */
  getHealth?(): Promise<AgentHealth>;
}

/**
 * Intent passed to agents for processing
 */
export interface AgentIntent {
  /** Unique identifier for this intent */
  id: string;
  
  /** Address of the user making the request */
  userAddress: string;
  
  /** Human-readable description of the intent */
  description: string;
  
  /** Intent-specific parameters */
  parameters: Record<string, unknown>;
  
  /** Maximum gas willing to spend */
  maxGas: number;
  
  /** Maximum value (in wei) to transfer */
  maxValue: number;
  
  /** Unix timestamp when this intent expires */
  deadline: number;
  
  /** Slippage tolerance (0-100) */
  slippage?: number;
  
  /** Priority level for execution */
  priority?: Priority;
  
  /** Context from previous intents */
  context?: IntentContext;
}

/**
 * Result of simulating an agent intent
 */
export interface SimulationResult {
  /** Whether the simulation was successful */
  success: boolean;
  
  /** Estimated gas consumption */
  gasEstimate: number;
  
  /** Estimated value transfer */
  valueEstimate: number;
  
  /** Risk assessment of the operation */
  risk: RiskLevel;
  
  /** Array of calls that would be made */
  calls: CallData[];
  
  /** Human-readable justification for the plan */
  justification: string;
  
  /** Array of warnings about the operation */
  warnings: string[];
  
  /** Confidence score (0-1) in the simulation */
  confidence: number;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Result of executing an agent intent
 */
export interface ExecutionResult {
  /** Whether the execution was successful */
  success: boolean;
  
  /** Transaction hash if successful */
  transactionHash?: string;
  
  /** Actual gas used */
  gasUsed?: number;
  
  /** Actual value transferred */
  valueTransferred?: number;
  
  /** Results of individual calls */
  calls: CallResult[];
  
  /** Error message if failed */
  error?: string;
  
  /** Timestamp of execution */
  timestamp: number;
  
  /** URL to block explorer */
  explorerUrl?: string;
  
  /** Additional execution metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Data for a single call to be made
 */
export interface CallData {
  /** Target contract address */
  target: string;
  
  /** Encoded call data */
  data: string;
  
  /** Value to send (in wei) */
  value: number;
  
  /** Human-readable description */
  description: string;
  
  /** Gas limit for this specific call */
  gasLimit?: number;
  
  /** Whether this call is required for success */
  required?: boolean;
}

/**
 * Result of a single call execution
 */
export interface CallResult {
  /** Whether the call was successful */
  success: boolean;
  
  /** Gas used by this call */
  gasUsed: number;
  
  /** Return data from the call */
  returnData?: string;
  
  /** Error message if failed */
  error?: string;
  
  /** Events emitted by this call */
  events?: CallEvent[];
}

/**
 * Event emitted during call execution
 */
export interface CallEvent {
  /** Event name */
  name: string;
  
  /** Event arguments */
  args: Record<string, unknown>;
  
  /** Contract address that emitted the event */
  address: string;
}

/**
 * Context passed between related intents
 */
export interface IntentContext {
  /** Previous intent IDs in this session */
  previousIntents?: string[];
  
  /** User preferences */
  preferences?: Record<string, unknown>;
  
  /** Session-specific data */
  sessionData?: Record<string, unknown>;
}

/**
 * Result of validating an agent intent
 */
export interface ValidationResult {
  /** Whether the intent is valid */
  valid: boolean;
  
  /** Error messages if invalid */
  errors?: string[];
  
  /** Warning messages */
  warnings?: string[];
  
  /** Suggested modifications */
  suggestions?: Record<string, unknown>;
}

/**
 * Agent health and diagnostic information
 */
export interface AgentHealth {
  /** Overall health status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  
  /** Last successful execution timestamp */
  lastSuccess?: number;
  
  /** Current error rate (0-1) */
  errorRate: number;
  
  /** Average response time in milliseconds */
  avgResponseTime: number;
  
  /** Additional diagnostic information */
  diagnostics?: Record<string, unknown>;
}

/**
 * Agent configuration options
 */
export interface AgentConfig {
  /** Whether to enable debug logging */
  debug?: boolean;
  
  /** Maximum retry attempts for failed operations */
  maxRetries?: number;
  
  /** Timeout for operations in milliseconds */
  timeout?: number;
  
  /** Custom configuration specific to the agent */
  custom?: Record<string, unknown>;
}

/**
 * Agent metadata for registration
 */
export interface AgentMetadata {
  /** Agent name */
  name: string;
  
  /** Agent description */
  description: string;
  
  /** Agent version */
  version: string;
  
  /** Author information */
  author: string;
  
  /** License */
  license: string;
  
  /** Homepage URL */
  homepage?: string;
  
  /** Documentation URL */
  documentation?: string;
  
  /** Tags for categorization */
  tags?: string[];
}