import { BaseAgent, AgentIntent, SimulationResult, ExecutionResult, RiskLevel, AgentCapability, CallData } from './base';
import { ethers } from 'ethers';

interface PortfolioParameters {
  operation: 'get_balances' | 'get_pnl' | 'get_positions' | 'get_history';
  timeframe?: '24h' | '7d' | '30d' | '1y' | 'all';
  includeStaking?: boolean;
  includeTransactions?: boolean;
}

interface TokenBalance {
  address: string;
  symbol: string;
  balance: string;
  valueUSD: number;
  change24h: number;
}

interface StakingPosition {
  positionId: string;
  validatorName: string;
  amount: string;
  rewards: string;
  apr: number;
  startTime: number;
}

interface PnLData {
  totalValueUSD: number;
  change24h: number;
  change7d: number;
  change30d: number;
  gainLoss: number;
  gainLossPercent: number;
  stakingRewards: number;
  gasSpent: number;
}

export class PortfolioAgent extends BaseAgent {
  private provider: ethers.Provider;
  private portfolioViewAddress: string;
  private priceOracle: Map<string, number> = new Map();

  constructor(provider: ethers.Provider, portfolioViewAddress: string) {
    super('portfolio-agent', 'Portfolio Agent', [
      AgentCapability.PORTFOLIO_ANALYSIS,
      'balance_tracking',
      'pnl_calculation',
      'asset_allocation',
      'performance_metrics'
    ]);
    
    this.provider = provider;
    this.portfolioViewAddress = portfolioViewAddress;
    this.initializePriceOracle();
  }

  async simulate(intent: AgentIntent): Promise<SimulationResult> {
    this.validateIntent(intent);
    
    try {
      const params = this.parsePortfolioParameters(intent);
      
      // Portfolio operations are read-only, so simulation is straightforward
      const calls: CallData[] = [];
      const justification = this.generateJustification(params);
      
      return {
        success: true,
        gasEstimate: 50000, // Minimal gas for read operations
        valueEstimate: 0, // No value transfer
        risk: RiskLevel.LOW, // Read-only operations are low risk
        calls,
        justification,
        warnings: [],
        confidence: 0.95
      };
    } catch (error) {
      return {
        success: false,
        gasEstimate: 0,
        valueEstimate: 0,
        risk: RiskLevel.LOW,
        calls: [],
        justification: `Failed to simulate portfolio query: ${error instanceof Error ? error.message : 'Unknown error'}`,
        warnings: ['Query simulation failed'],
        confidence: 0
      };
    }
  }

  async execute(intent: AgentIntent): Promise<ExecutionResult> {
    this.validateIntent(intent);
    
    try {
      const params = this.parsePortfolioParameters(intent);
      
      // Execute portfolio query based on operation
      let result: any;
      switch (params.operation) {
        case 'get_balances':
          result = await this.getBalances(intent.userAddress, params.includeStaking);
          break;
        case 'get_pnl':
          result = await this.getPnL(intent.userAddress, params.timeframe);
          break;
        case 'get_positions':
          result = await this.getPositions(intent.userAddress);
          break;
        case 'get_history':
          result = await this.getHistory(intent.userAddress, params.timeframe);
          break;
        default:
          throw new Error(`Unsupported operation: ${params.operation}`);
      }
      
      return {
        success: true,
        gasUsed: 0, // No gas for view functions
        valueTransferred: 0,
        calls: [{
          success: true,
          gasUsed: 0,
          returnData: JSON.stringify(result)
        }],
        timestamp: Date.now()
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
    if (result.success && result.calls[0]?.returnData) {
      try {
        const data = JSON.parse(result.calls[0].returnData);
        return this.formatPortfolioData(data);
      } catch {
        return 'Portfolio data retrieved successfully.';
      }
    } else {
      return `Portfolio query failed: ${result.error}`;
    }
  }

  private parsePortfolioParameters(intent: AgentIntent): PortfolioParameters {
    const params = intent.parameters;
    
    return {
      operation: (params.operation as any) || 'get_balances',
      timeframe: (params.timeframe as any) || '24h',
      includeStaking: params.includeStaking !== false,
      includeTransactions: params.includeTransactions === true
    };
  }

  private async getBalances(userAddress: string, includeStaking: boolean = true): Promise<{
    tokens: TokenBalance[];
    stakingPositions: StakingPosition[];
    totalValueUSD: number;
  }> {
    // Mock implementation - in production would call actual contracts
    const tokens: TokenBalance[] = [
      {
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'ETH',
        balance: '2.5',
        valueUSD: 5000,
        change24h: 2.5
      },
      {
        address: '0x1000000000000000000000000000000000000000',
        symbol: 'STT',
        balance: '1500',
        valueUSD: 1500,
        change24h: 1.2
      },
      {
        address: '0x2000000000000000000000000000000000000000',
        symbol: 'USDC',
        balance: '3000',
        valueUSD: 3000,
        change24h: 0.1
      }
    ];

    const stakingPositions: StakingPosition[] = includeStaking ? [
      {
        positionId: '0xpos1',
        validatorName: 'Somnia Validator Alpha',
        amount: '5000',
        rewards: '15.5',
        apr: 12,
        startTime: Date.now() - 30 * 24 * 60 * 60 * 1000 // 30 days ago
      }
    ] : [];

    const totalValueUSD = tokens.reduce((sum, t) => sum + t.valueUSD, 0) + 
                          stakingPositions.reduce((sum, p) => sum + parseFloat(p.amount) + parseFloat(p.rewards), 0);

    return { tokens, stakingPositions, totalValueUSD };
  }

  private async getPnL(userAddress: string, timeframe: string = '24h'): Promise<PnLData> {
    // Mock PnL calculation
    const currentValue = 14515.5; // Total portfolio value
    
    const timeframeMultiplier = {
      '24h': 0.5,
      '7d': 2,
      '30d': 5,
      '1y': 15,
      'all': 25
    }[timeframe] || 1;

    const gainLoss = 500 * timeframeMultiplier;
    const stakingRewards = 15.5 * timeframeMultiplier;
    const gasSpent = 0.15 * timeframeMultiplier;

    return {
      totalValueUSD: currentValue,
      change24h: 1.5,
      change7d: 3.2,
      change30d: 8.7,
      gainLoss,
      gainLossPercent: (gainLoss / (currentValue - gainLoss)) * 100,
      stakingRewards,
      gasSpent
    };
  }

  private async getPositions(userAddress: string): Promise<{
    staking: StakingPosition[];
    liquidity: any[];
    lending: any[];
  }> {
    const staking = [
      {
        positionId: '0xpos1',
        validatorName: 'Somnia Validator Alpha',
        amount: '5000',
        rewards: '15.5',
        apr: 12,
        startTime: Date.now() - 30 * 24 * 60 * 60 * 1000
      },
      {
        positionId: '0xpos2',
        validatorName: 'Somnia Validator Beta',
        amount: '2000',
        rewards: '8.2',
        apr: 14,
        startTime: Date.now() - 15 * 24 * 60 * 60 * 1000
      }
    ];

    return {
      staking,
      liquidity: [], // Future feature
      lending: [] // Future feature
    };
  }

  private async getHistory(userAddress: string, timeframe: string = '7d'): Promise<{
    transactions: any[];
    valueHistory: Array<{ timestamp: number; value: number }>;
  }> {
    // Mock transaction history
    const transactions = [
      {
        hash: '0x123...',
        type: 'stake',
        amount: '5000 STT',
        timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
        status: 'success'
      },
      {
        hash: '0x456...',
        type: 'swap',
        amount: '1 ETH → 2000 STT',
        timestamp: Date.now() - 25 * 24 * 60 * 60 * 1000,
        status: 'success'
      }
    ];

    // Mock value history
    const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 365;
    const valueHistory = Array.from({ length: days }, (_, i) => ({
      timestamp: Date.now() - (days - i) * 24 * 60 * 60 * 1000,
      value: 14000 + Math.random() * 1000 + (i * 10)
    }));

    return { transactions, valueHistory };
  }

  private generateJustification(params: PortfolioParameters): string {
    switch (params.operation) {
      case 'get_balances':
        return `Retrieving current token balances${params.includeStaking ? ' and staking positions' : ''} for comprehensive portfolio view.`;
      case 'get_pnl':
        return `Calculating profit/loss over ${params.timeframe} timeframe, including trading gains, staking rewards, and gas costs.`;
      case 'get_positions':
        return 'Analyzing all active positions including staking, liquidity pools, and lending protocols.';
      case 'get_history':
        return `Fetching transaction history for the past ${params.timeframe} to analyze portfolio activity.`;
      default:
        return 'Executing portfolio query operation.';
    }
  }

  private formatPortfolioData(data: any): string {
    if (data.tokens) {
      const totalValue = data.totalValueUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
      const tokenCount = data.tokens.length;
      const stakingCount = data.stakingPositions?.length || 0;
      return `Portfolio: ${totalValue} across ${tokenCount} tokens${stakingCount > 0 ? ` and ${stakingCount} staking positions` : ''}.`;
    } else if (data.gainLoss !== undefined) {
      const pnl = data.gainLoss > 0 ? `+${data.gainLoss.toFixed(2)}` : data.gainLoss.toFixed(2);
      const pct = data.gainLossPercent > 0 ? `+${data.gainLossPercent.toFixed(2)}%` : `${data.gainLossPercent.toFixed(2)}%`;
      return `Portfolio P&L: $${pnl} (${pct}). Staking rewards: $${data.stakingRewards.toFixed(2)}. Gas spent: $${data.gasSpent.toFixed(2)}.`;
    }
    return 'Portfolio data retrieved successfully.';
  }

  private initializePriceOracle(): void {
    // Initialize with demo prices
    this.priceOracle.set('0x0000000000000000000000000000000000000000', 2000); // ETH
    this.priceOracle.set('0x1000000000000000000000000000000000000000', 1); // STT
    this.priceOracle.set('0x2000000000000000000000000000000000000000', 1); // USDC
    this.priceOracle.set('0x3000000000000000000000000000000000000000', 45000); // WBTC
  }

  // Public utility methods
  public async calculateAllocation(userAddress: string): Promise<{
    tokens: Array<{ symbol: string; percentage: number; valueUSD: number }>;
    staking: { percentage: number; valueUSD: number };
  }> {
    const balances = await this.getBalances(userAddress, true);
    const total = balances.totalValueUSD;
    
    const tokens = balances.tokens.map(t => ({
      symbol: t.symbol,
      percentage: (t.valueUSD / total) * 100,
      valueUSD: t.valueUSD
    }));

    const stakingValue = balances.stakingPositions.reduce((sum, p) => 
      sum + parseFloat(p.amount) + parseFloat(p.rewards), 0
    );

    return {
      tokens,
      staking: {
        percentage: (stakingValue / total) * 100,
        valueUSD: stakingValue
      }
    };
  }

  public async getPerformanceMetrics(userAddress: string): Promise<{
    roi: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
  }> {
    // Simplified metrics calculation
    return {
      roi: 12.5,
      sharpeRatio: 1.8,
      maxDrawdown: -8.3,
      winRate: 65
    };
  }
}
