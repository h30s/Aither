import { BaseAgent, AgentIntent, SimulationResult, ExecutionResult, RiskLevel, AgentCapability, CallData } from './base';
import { ethers } from 'ethers';

interface AnalyticsParameters {
  operation: 'decode_transaction' | 'analyze_gas' | 'performance_report' | 'risk_assessment' | 'optimization_suggestions';
  transactionHash?: string;
  userAddress?: string;
  timeframe?: '24h' | '7d' | '30d' | 'all';
}

interface DecodedTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: number;
  gasPrice: string;
  totalCost: string;
  status: 'success' | 'failed';
  timestamp: number;
  operations: Array<{
    type: string;
    description: string;
    tokens?: string[];
    amounts?: string[];
  }>;
  summary: string;
  recommendation?: string;
}

interface GasAnalysis {
  totalGasUsed: number;
  totalCostSTT: number;
  averageGasPrice: number;
  mostExpensiveTx: { hash: string; cost: number };
  cheapestTx: { hash: string; cost: number };
  optimizationTips: string[];
  savingsPotential: number;
}

interface PerformanceReport {
  period: string;
  metrics: {
    totalTransactions: number;
    successRate: number;
    averageGasUsed: number;
    totalVolume: number;
    profitLoss: number;
    roi: number;
  };
  breakdown: {
    swaps: number;
    stakes: number;
    claims: number;
    other: number;
  };
  topPerformers: Array<{
    operation: string;
    profit: number;
    roi: number;
  }>;
}

interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100
  factors: Array<{
    category: string;
    level: string;
    description: string;
    mitigation: string;
  }>;
  recommendations: string[];
}

export class AnalyticsAgent extends BaseAgent {
  private provider: ethers.Provider;
  private transactionCache: Map<string, DecodedTransaction> = new Map();

  constructor(provider: ethers.Provider) {
    super('analytics-agent', 'Analytics Agent', [
      AgentCapability.TRANSACTION_ANALYSIS,
      'gas_analysis',
      'performance_metrics',
      'risk_assessment',
      'optimization',
      'reporting'
    ]);
    
    this.provider = provider;
  }

  async simulate(intent: AgentIntent): Promise<SimulationResult> {
    this.validateIntent(intent);
    
    try {
      const params = this.parseAnalyticsParameters(intent);
      const justification = this.generateJustification(params);
      
      return {
        success: true,
        gasEstimate: 0, // Analytics operations don't consume gas
        valueEstimate: 0,
        risk: RiskLevel.LOW,
        calls: [],
        justification,
        warnings: [],
        confidence: 0.90
      };
    } catch (error) {
      return {
        success: false,
        gasEstimate: 0,
        valueEstimate: 0,
        risk: RiskLevel.LOW,
        calls: [],
        justification: `Failed to simulate analytics query: ${error instanceof Error ? error.message : 'Unknown error'}`,
        warnings: ['Analytics simulation failed'],
        confidence: 0
      };
    }
  }

  async execute(intent: AgentIntent): Promise<ExecutionResult> {
    this.validateIntent(intent);
    
    try {
      const params = this.parseAnalyticsParameters(intent);
      let result: any;

      // Execute analytics operation
      switch (params.operation) {
        case 'decode_transaction':
          if (!params.transactionHash) {
            throw new Error('Transaction hash required for decoding');
          }
          result = await this.decodeTransaction(params.transactionHash);
          break;
        
        case 'analyze_gas':
          result = await this.analyzeGas(params.userAddress || intent.userAddress, params.timeframe);
          break;
        
        case 'performance_report':
          result = await this.generatePerformanceReport(params.userAddress || intent.userAddress, params.timeframe);
          break;
        
        case 'risk_assessment':
          result = await this.assessRisk(params.userAddress || intent.userAddress);
          break;
        
        case 'optimization_suggestions':
          result = await this.generateOptimizationSuggestions(params.userAddress || intent.userAddress);
          break;
        
        default:
          throw new Error(`Unsupported operation: ${params.operation}`);
      }

      return {
        success: true,
        gasUsed: 0,
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
        return this.formatAnalyticsData(data);
      } catch {
        return 'Analytics data retrieved successfully.';
      }
    } else {
      return `Analytics query failed: ${result.error}`;
    }
  }

  private parseAnalyticsParameters(intent: AgentIntent): AnalyticsParameters {
    const params = intent.parameters;
    
    return {
      operation: (params.operation as any) || 'performance_report',
      transactionHash: params.transactionHash as string,
      userAddress: params.userAddress as string,
      timeframe: (params.timeframe as any) || '7d'
    };
  }

  private async decodeTransaction(txHash: string): Promise<DecodedTransaction> {
    // Check cache first
    const cached = this.transactionCache.get(txHash);
    if (cached) return cached;

    try {
      // In production, fetch actual transaction from blockchain
      // For now, use mock data
      const decoded: DecodedTransaction = {
        hash: txHash,
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        to: '0x0000000000000000000000000000000000001000',
        value: '100',
        gasUsed: 185000,
        gasPrice: '20',
        totalCost: '0.0037',
        status: 'success',
        timestamp: Date.now() - 60 * 60 * 1000,
        operations: [
          {
            type: 'swap',
            description: 'Swapped 100 STT for 0.048 ETH',
            tokens: ['STT', 'ETH'],
            amounts: ['100', '0.048']
          }
        ],
        summary: 'Successfully swapped 100 STT tokens for 0.048 ETH via DEX router. Transaction completed with optimal gas usage.',
        recommendation: 'Gas price was in the optimal range. Consider batching similar operations to save on gas costs.'
      };

      this.transactionCache.set(txHash, decoded);
      return decoded;
    } catch (error) {
      throw new Error(`Failed to decode transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async analyzeGas(userAddress: string, timeframe: string = '7d'): Promise<GasAnalysis> {
    // Mock gas analysis - in production would aggregate actual transaction data
    const mockData: GasAnalysis = {
      totalGasUsed: 1_250_000,
      totalCostSTT: 0.025, // 25 STT
      averageGasPrice: 20,
      mostExpensiveTx: {
        hash: '0xabc123...',
        cost: 0.008
      },
      cheapestTx: {
        hash: '0xdef456...',
        cost: 0.001
      },
      optimizationTips: [
        'Consider batching multiple operations into single transactions to save ~30% on gas',
        'Execute transactions during off-peak hours (typically 2-6 AM UTC) for lower gas prices',
        'Use transaction simulators before execution to avoid failed transactions',
        'Set appropriate gas limits to avoid over-paying while ensuring success'
      ],
      savingsPotential: 0.0075 // Could have saved 7.5 STT
    };

    return mockData;
  }

  private async generatePerformanceReport(userAddress: string, timeframe: string = '7d'): Promise<PerformanceReport> {
    // Mock performance report
    const report: PerformanceReport = {
      period: timeframe,
      metrics: {
        totalTransactions: 42,
        successRate: 97.6,
        averageGasUsed: 185_000,
        totalVolume: 15_500,
        profitLoss: 650,
        roi: 4.35
      },
      breakdown: {
        swaps: 18,
        stakes: 12,
        claims: 8,
        other: 4
      },
      topPerformers: [
        {
          operation: 'ETH/STT Swap',
          profit: 250,
          roi: 12.5
        },
        {
          operation: 'Validator Alpha Staking',
          profit: 185,
          roi: 3.7
        },
        {
          operation: 'Rewards Claim',
          profit: 125,
          roi: 100 // No cost, pure profit
        }
      ]
    };

    return report;
  }

  private async assessRisk(userAddress: string): Promise<RiskAssessment> {
    // Mock risk assessment
    const assessment: RiskAssessment = {
      overallRisk: 'low',
      score: 25, // 0-100, lower is better
      factors: [
        {
          category: 'Portfolio Concentration',
          level: 'low',
          description: 'Portfolio is well-diversified across 5 tokens',
          mitigation: 'Maintain diversification, consider adding 1-2 more assets'
        },
        {
          category: 'Smart Contract Risk',
          level: 'low',
          description: 'All interactions with audited contracts',
          mitigation: 'Continue using verified contracts only'
        },
        {
          category: 'Validator Risk',
          level: 'low',
          description: 'Staking with top-tier validators (>99% uptime)',
          mitigation: 'Consider spreading stakes across 3-4 validators'
        },
        {
          category: 'Liquidity Risk',
          level: 'medium',
          description: '15% of portfolio in low-liquidity assets',
          mitigation: 'Reduce exposure to illiquid positions or plan gradual exits'
        }
      ],
      recommendations: [
        'Your current risk profile is well-balanced for steady growth',
        'Consider setting stop-loss limits on volatile positions',
        'Maintain emergency fund (20-30% in stablecoins)',
        'Review and rebalance portfolio monthly'
      ]
    };

    return assessment;
  }

  private async generateOptimizationSuggestions(userAddress: string): Promise<{
    gasOptimization: string[];
    strategyOptimization: string[];
    securityOptimization: string[];
    estimatedImpact: {
      gasSavings: number;
      yieldIncrease: number;
      riskReduction: number;
    };
  }> {
    return {
      gasOptimization: [
        'Batch similar operations: Save ~30% on gas by combining multiple swaps',
        'Use multicall for stake+claim operations: Reduce overhead by 40%',
        'Optimize approval amounts: Set exact approvals to avoid multiple transactions',
        'Schedule transactions during low-activity periods: Save 15-25% on gas prices'
      ],
      strategyOptimization: [
        'Auto-compound staking rewards: Increase yield by ~8% annually',
        'Rebalance to optimal allocation: Maintain 60/30/10 split for risk-adjusted returns',
        'Implement dollar-cost averaging: Reduce timing risk on entries',
        'Set up automated claims: Capture rewards before fee increases'
      ],
      securityOptimization: [
        'Enable 2FA confirmation for transactions >1000 STT',
        'Set daily spending limits: Protect against unauthorized access',
        'Use hardware wallet for large holdings: Enhanced security for 50%+ of portfolio',
        'Regular allowance audits: Revoke unused approvals monthly'
      ],
      estimatedImpact: {
        gasSavings: 35, // percentage
        yieldIncrease: 12, // percentage
        riskReduction: 40 // percentage
      }
    };
  }

  private generateJustification(params: AnalyticsParameters): string {
    switch (params.operation) {
      case 'decode_transaction':
        return `Decoding transaction ${params.transactionHash?.slice(0, 10)}... to extract operations, costs, and provide insights.`;
      case 'analyze_gas':
        return `Analyzing gas usage patterns over ${params.timeframe} to identify optimization opportunities and cost savings.`;
      case 'performance_report':
        return `Generating comprehensive performance report for ${params.timeframe} including transaction metrics, P&L, and top operations.`;
      case 'risk_assessment':
        return 'Evaluating portfolio risk across concentration, smart contracts, validators, and liquidity with mitigation strategies.';
      case 'optimization_suggestions':
        return 'Analyzing current operations to provide actionable optimization suggestions for gas, strategy, and security.';
      default:
        return 'Executing analytics operation.';
    }
  }

  private formatAnalyticsData(data: any): string {
    if (data.hash && data.operations) {
      // Decoded transaction
      return `Transaction ${data.hash.slice(0, 10)}...: ${data.summary}. Gas used: ${data.gasUsed.toLocaleString()}. Status: ${data.status}.`;
    } else if (data.totalGasUsed !== undefined) {
      // Gas analysis
      return `Gas Analysis: Used ${data.totalGasUsed.toLocaleString()} gas (${data.totalCostSTT} STT). ` +
             `Potential savings: ${data.savingsPotential} STT (${Math.round(data.savingsPotential / data.totalCostSTT * 100)}%).`;
    } else if (data.metrics) {
      // Performance report
      return `Performance (${data.period}): ${data.metrics.totalTransactions} txs, ${data.metrics.successRate}% success rate. ` +
             `P&L: +${data.metrics.profitLoss} STT (${data.metrics.roi}% ROI).`;
    } else if (data.overallRisk) {
      // Risk assessment
      return `Risk Assessment: ${data.overallRisk.toUpperCase()} (score: ${data.score}/100). ` +
             `${data.factors.length} factors analyzed. ${data.recommendations.length} recommendations provided.`;
    } else if (data.estimatedImpact) {
      // Optimization suggestions
      return `Optimization Potential: ${data.estimatedImpact.gasSavings}% gas savings, ` +
             `${data.estimatedImpact.yieldIncrease}% yield increase, ${data.estimatedImpact.riskReduction}% risk reduction.`;
    }
    return 'Analytics completed successfully.';
  }

  // Public utility methods
  public async compareTransactions(txHash1: string, txHash2: string): Promise<{
    tx1: DecodedTransaction;
    tx2: DecodedTransaction;
    comparison: {
      gasDifference: number;
      costDifference: number;
      moreEfficient: string;
      insights: string[];
    };
  }> {
    const tx1 = await this.decodeTransaction(txHash1);
    const tx2 = await this.decodeTransaction(txHash2);

    const gasDiff = tx1.gasUsed - tx2.gasUsed;
    const costDiff = parseFloat(tx1.totalCost) - parseFloat(tx2.totalCost);

    return {
      tx1,
      tx2,
      comparison: {
        gasDifference: gasDiff,
        costDifference: costDiff,
        moreEfficient: gasDiff < 0 ? txHash1 : txHash2,
        insights: [
          `Gas difference: ${Math.abs(gasDiff).toLocaleString()} (${Math.abs(gasDiff / tx1.gasUsed * 100).toFixed(1)}%)`,
          `Cost difference: ${Math.abs(costDiff).toFixed(6)} STT`,
          gasDiff < 0 ? 'First transaction was more efficient' : 'Second transaction was more efficient'
        ]
      }
    };
  }

  public clearCache(): void {
    this.transactionCache.clear();
  }

  public async getTransactionInsights(txHash: string): Promise<string[]> {
    const decoded = await this.decodeTransaction(txHash);
    const insights: string[] = [];

    // Add insights based on transaction data
    if (decoded.gasUsed > 200000) {
      insights.push('⚠️ High gas usage - consider optimizing or batching operations');
    }

    if (decoded.status === 'success') {
      insights.push('✅ Transaction executed successfully');
    } else {
      insights.push('❌ Transaction failed - review parameters and conditions');
    }

    if (decoded.recommendation) {
      insights.push(`💡 ${decoded.recommendation}`);
    }

    return insights;
  }
}
