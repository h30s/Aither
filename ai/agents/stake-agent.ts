import { BaseAgent, AgentIntent, SimulationResult, ExecutionResult, RiskLevel, AgentCapability, CallData } from './base';
import { ethers } from 'ethers';

interface StakeParameters {
  amount: string;
  validatorId?: string;
  validatorAddress?: string;
  operation: 'stake' | 'unstake' | 'claim_rewards';
  positionId?: string;
}

interface ValidatorInfo {
  id: string;
  name: string;
  address: string;
  commission: number; // percentage
  apr: number; // percentage  
  uptime: number; // percentage
  totalStaked: string;
  maxCapacity: string;
  active: boolean;
}

export class StakeAgent extends BaseAgent {
  private provider: ethers.Provider;
  private stakingAdapterAddress: string;
  private validators: Map<string, ValidatorInfo> = new Map();

  constructor(provider: ethers.Provider, stakingAdapterAddress: string) {
    super('stake-agent', 'Stake Agent', [
      AgentCapability.STAKE,
      AgentCapability.UNSTAKE,
      'validator_analysis',
      'rewards_optimization',
      'risk_assessment'
    ]);
    
    this.provider = provider;
    this.stakingAdapterAddress = stakingAdapterAddress;
    this.initializeValidators();
  }

  async simulate(intent: AgentIntent): Promise<SimulationResult> {
    this.validateIntent(intent);
    
    try {
      const params = this.parseStakeParameters(intent);
      const calls = await this.buildStakeCalls(params, intent.userAddress);
      const risk = this.calculateStakeRisk(params);
      
      const warnings: string[] = [];
      const justification = await this.generateStakeJustification(params);
      
      // Add operation-specific warnings
      if (params.operation === 'stake') {
        const amount = parseFloat(params.amount);
        if (amount < 1) {
          warnings.push('Amount below minimum staking threshold');
        }
        if (amount > 1000) {
          warnings.push('Large staking amount - consider validator limits');
        }
      }

      const gasEstimate = this.estimateGas(params.operation);
      const confidence = this.calculateConfidence(params, risk);

      return {
        success: true,
        gasEstimate,
        valueEstimate: parseFloat(params.amount || '0'),
        risk,
        calls,
        justification,
        warnings,
        confidence
      };
    } catch (error) {
      return {
        success: false,
        gasEstimate: 0,
        valueEstimate: 0,
        risk: RiskLevel.HIGH,
        calls: [],
        justification: `Failed to simulate ${intent.parameters.operation || 'staking operation'}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        warnings: ['Simulation failed - transaction may fail'],
        confidence: 0
      };
    }
  }

  async execute(intent: AgentIntent): Promise<ExecutionResult> {
    this.validateIntent(intent);
    
    try {
      const params = this.parseStakeParameters(intent);
      const calls = await this.buildStakeCalls(params, intent.userAddress);
      
      // Simulate execution (in production would call actual contracts)
      const txHash = this.generateMockTxHash();
      const gasUsed = this.estimateGas(params.operation) * 0.9; // Slightly less than estimate
      
      return {
        success: true,
        transactionHash: txHash,
        gasUsed,
        valueTransferred: parseFloat(params.amount || '0'),
        calls: calls.map(call => ({
          success: true,
          gasUsed: Math.floor(gasUsed / calls.length),
          returnData: '0x'
        })),
        timestamp: Date.now(),
        explorerUrl: this.generateExplorerUrl(txHash)
      };
    } catch (error) {
      return {
        success: false,
        calls: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  async explain(result: ExecutionResult): Promise<string> {
    if (result.success) {
      const baseExplanation = await super.explain(result);
      return `${baseExplanation} The staking operation was completed successfully. Rewards will begin accruing immediately.`;
    } else {
      return `Staking operation failed: ${result.error}. This could be due to insufficient balance, validator capacity limits, or network issues.`;
    }
  }

  private parseStakeParameters(intent: AgentIntent): StakeParameters {
    const params = intent.parameters;
    
    if (!params.operation) {
      throw new Error('Missing required parameter: operation');
    }

    const operation = params.operation as 'stake' | 'unstake' | 'claim_rewards';
    
    if (operation === 'stake' && !params.amount) {
      throw new Error('Amount required for staking operation');
    }

    return {
      amount: params.amount as string || '0',
      validatorId: params.validatorId as string,
      validatorAddress: params.validatorAddress as string,
      operation,
      positionId: params.positionId as string
    };
  }

  private async buildStakeCalls(params: StakeParameters, userAddress: string): Promise<CallData[]> {
    const stakingInterface = new ethers.Interface([
      'function stake(bytes32 validatorId, uint256 amount, address user) external returns ((address validator, uint256 amount, uint256 gasUsed, bool success, bytes32 positionId))',
      'function requestUnstake(bytes32 positionId, uint256 amount) external',
      'function claimRewards(bytes32 positionId) external returns (uint256)'
    ]);

    let callData: string;
    let description: string;
    let value = 0;

    switch (params.operation) {
      case 'stake':
        const validatorId = params.validatorId || this.selectBestValidator(parseFloat(params.amount));
        const amount = ethers.parseUnits(params.amount, 18);
        callData = stakingInterface.encodeFunctionData('stake', [validatorId, amount, userAddress]);
        description = `Stake ${params.amount} STT with validator ${this.getValidatorName(validatorId)}`;
        break;

      case 'unstake':
        if (!params.positionId) {
          throw new Error('Position ID required for unstaking');
        }
        const unstakeAmount = ethers.parseUnits(params.amount, 18);
        callData = stakingInterface.encodeFunctionData('requestUnstake', [params.positionId, unstakeAmount]);
        description = `Unstake ${params.amount} STT from position ${params.positionId.slice(0, 8)}...`;
        break;

      case 'claim_rewards':
        if (!params.positionId) {
          throw new Error('Position ID required for claiming rewards');
        }
        callData = stakingInterface.encodeFunctionData('claimRewards', [params.positionId]);
        description = `Claim rewards from position ${params.positionId.slice(0, 8)}...`;
        break;

      default:
        throw new Error(`Unsupported operation: ${params.operation}`);
    }

    return [{
      target: this.stakingAdapterAddress,
      data: callData,
      value,
      description,
      gasLimit: this.estimateGas(params.operation)
    }];
  }

  private calculateStakeRisk(params: StakeParameters): RiskLevel {
    const valueAtRisk = parseFloat(params.amount || '0');
    let complexity = 1;
    
    // Increase complexity based on operation
    if (params.operation === 'unstake') complexity = 2; // Unbonding period risk
    
    // Consider validator risk if staking
    if (params.operation === 'stake' && params.validatorId) {
      const validator = this.validators.get(params.validatorId);
      if (validator && validator.uptime < 95) {
        complexity += 1; // Higher risk validator
      }
    }
    
    return this.calculateRisk(valueAtRisk, complexity);
  }

  private async generateStakeJustification(params: StakeParameters): Promise<string> {
    switch (params.operation) {
      case 'stake':
        const validatorId = params.validatorId || this.selectBestValidator(parseFloat(params.amount));
        const validator = this.validators.get(validatorId);
        if (validator) {
          return `Staking ${params.amount} STT with ${validator.name} (APR: ${validator.apr}%, Commission: ${validator.commission}%, Uptime: ${validator.uptime}%). ` +
                 `This validator offers competitive rewards with good performance history.`;
        }
        return `Staking ${params.amount} STT with selected validator.`;

      case 'unstake':
        return `Requesting unstake of ${params.amount} STT. Tokens will be available after the 21-day unbonding period. ` +
               `Consider the opportunity cost of missing rewards during this period.`;

      case 'claim_rewards':
        return `Claiming accumulated staking rewards. This will reset the reward calculation period and transfer earned STT to your wallet.`;

      default:
        return `Executing ${params.operation} operation.`;
    }
  }

  private selectBestValidator(amount: number): string {
    // Select validator based on APR, capacity, and risk factors
    const activeValidators = Array.from(this.validators.values())
      .filter(v => v.active && parseFloat(v.totalStaked) + amount <= parseFloat(v.maxCapacity))
      .sort((a, b) => {
        // Score based on APR, low commission, high uptime
        const scoreA = a.apr * (1 - a.commission / 100) * (a.uptime / 100);
        const scoreB = b.apr * (1 - b.commission / 100) * (b.uptime / 100);
        return scoreB - scoreA;
      });

    if (activeValidators.length === 0) {
      throw new Error('No suitable validators available');
    }

    return activeValidators[0].id;
  }

  private getValidatorName(validatorId: string): string {
    return this.validators.get(validatorId)?.name || 'Unknown Validator';
  }

  private estimateGas(operation: string): number {
    switch (operation) {
      case 'stake': return 250000;
      case 'unstake': return 180000;
      case 'claim_rewards': return 150000;
      default: return 200000;
    }
  }

  private calculateConfidence(params: StakeParameters, risk: RiskLevel): number {
    let confidence = 0.9;
    
    // Reduce confidence for high-risk validators
    if (params.operation === 'stake' && params.validatorId) {
      const validator = this.validators.get(params.validatorId);
      if (validator) {
        if (validator.uptime < 95) confidence -= 0.2;
        if (validator.commission > 10) confidence -= 0.1;
      }
    }
    
    // Reduce confidence based on risk level
    switch (risk) {
      case RiskLevel.HIGH: confidence -= 0.2; break;
      case RiskLevel.CRITICAL: confidence -= 0.4; break;
      case RiskLevel.MEDIUM: confidence -= 0.1; break;
    }
    
    return Math.max(0.1, confidence);
  }

  private generateMockTxHash(): string {
    return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  private initializeValidators(): void {
    // Initialize with diotsrh validators
    this.validators.set('validator_1', {
      id: 'validator_1',
      name: 'Somnia Validator Alpha',
      address: '0x1111111111111111111111111111111111111111',
      commission: 5,
      apr: 12,
      uptime: 99.5,
      totalStaked: '500000',
      maxCapacity: '1000000',
      active: true
    });

    this.validators.set('validator_2', {
      id: 'validator_2', 
      name: 'Somnia Validator Beta',
      address: '0x2222222222222222222222222222222222222222',
      commission: 3,
      apr: 14,
      uptime: 99.0,
      totalStaked: '300000',
      maxCapacity: '500000',
      active: true
    });

    this.validators.set('validator_3', {
      id: 'validator_3',
      name: 'Somnia Validator Gamma', 
      address: '0x3333333333333333333333333333333333333333',
      commission: 7,
      apr: 10,
      uptime: 98.0,
      totalStaked: '750000',
      maxCapacity: '2000000',
      active: true
    });
  }

  // Public methods for external access
  public getValidators(): ValidatorInfo[] {
    return Array.from(this.validators.values()).filter(v => v.active);
  }

  public getBestValidators(count: number = 3): ValidatorInfo[] {
    return this.getValidators()
      .sort((a, b) => {
        const scoreA = a.apr * (1 - a.commission / 100) * (a.uptime / 100);
        const scoreB = b.apr * (1 - b.commission / 100) * (b.uptime / 100);
        return scoreB - scoreA;
      })
      .slice(0, count);
  }

  public calculateExpectedRewards(amount: number, validatorId: string, days: number = 365): number {
    const validator = this.validators.get(validatorId);
    if (!validator) return 0;
    
    const netAPR = validator.apr * (1 - validator.commission / 100) / 100;
    return amount * netAPR * (days / 365);
  }
}