import { BaseAgent, AgentIntent, SimulationResult, ExecutionResult, RiskLevel, AgentCapability, CallData } from './base';
import { ethers } from 'ethers';

interface SwapParameters {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOutMin?: string;
  slippage?: number;
  deadline?: number;
  preferredDex?: string;
}

interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  priceUSD: number;
}

export class TradeAgent extends BaseAgent {
  private provider: ethers.Provider;
  private swapAdapterAddress: string;
  private supportedTokens: Map<string, TokenInfo> = new Map();

  constructor(provider: ethers.Provider, swapAdapterAddress: string) {
    super('trade-agent', 'Trade Agent', [
      AgentCapability.SWAP,
      'token_analysis',
      'price_discovery',
      'route_optimization'
    ]);
    
    this.provider = provider;
    this.swapAdapterAddress = swapAdapterAddress;
    this.initializeSupportedTokens();
  }

  async simulate(intent: AgentIntent): Promise<SimulationResult> {
    this.validateIntent(intent);
    
    try {
      const params = this.parseSwapParameters(intent);
      const quote = await this.getSwapQuote(params);
      
      const calls = await this.buildSwapCalls(params, intent.userAddress);
      const risk = this.calculateSwapRisk(params, quote);
      
      const warnings: string[] = [];
      if (quote.priceImpact > 5) {
        warnings.push(`High price impact: ${quote.priceImpact.toFixed(2)}%`);
      }
      if (params.slippage && params.slippage > 3) {
        warnings.push(`High slippage tolerance: ${params.slippage}%`);
      }

      const justification = this.generateSwapJustification(params, quote);

      return {
        success: true,
        gasEstimate: quote.gasEstimate,
        valueEstimate: parseFloat(params.amountIn),
        risk,
        calls,
        justification,
        warnings,
        confidence: this.calculateConfidence(quote, risk)
      };
    } catch (error) {
      return {
        success: false,
        gasEstimate: 0,
        valueEstimate: 0,
        risk: RiskLevel.HIGH,
        calls: [],
        justification: `Failed to simulate swap: ${error instanceof Error ? error.message : 'Unknown error'}`,
        warnings: ['Simulation failed - transaction may fail'],
        confidence: 0
      };
    }
  }

  async execute(intent: AgentIntent): Promise<ExecutionResult> {
    this.validateIntent(intent);
    
    try {
      const params = this.parseSwapParameters(intent);
      const calls = await this.buildSwapCalls(params, intent.userAddress);
      
      // In a real implementation, this would interact with the ExecutionProxy
      // For now, we'll simulate the execution
      const txHash = this.generateMockTxHash();
      const gasUsed = 150000 + Math.floor(Math.random() * 50000);
      
      return {
        success: true,
        transactionHash: txHash,
        gasUsed,
        valueTransferred: parseFloat(params.amountIn),
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
      return `${baseExplanation} The swap was executed successfully with optimal routing to minimize slippage and gas costs.`;
    } else {
      return `Swap failed: ${result.error}. This could be due to insufficient balance, high slippage, or network congestion.`;
    }
  }

  private parseSwapParameters(intent: AgentIntent): SwapParameters {
    const params = intent.parameters;
    
    if (!params.tokenIn || !params.tokenOut || !params.amountIn) {
      throw new Error('Missing required swap parameters: tokenIn, tokenOut, amountIn');
    }

    const slippage = intent.slippage || (params.slippage as number) || 1; // 1% default
    const deadline = intent.deadline || Math.floor(Date.now() / 1000) + 1200; // 20 minutes

    return {
      tokenIn: params.tokenIn as string,
      tokenOut: params.tokenOut as string,
      amountIn: params.amountIn as string,
      amountOutMin: params.amountOutMin as string,
      slippage,
      deadline,
      preferredDex: params.preferredDex as string
    };
  }

  private async getSwapQuote(params: SwapParameters) {
    // Mock quote - in production would call actual DEX APIs
    const tokenInInfo = this.supportedTokens.get(params.tokenIn.toLowerCase());
    const tokenOutInfo = this.supportedTokens.get(params.tokenOut.toLowerCase());
    
    if (!tokenInInfo || !tokenOutInfo) {
      throw new Error('Unsupported token pair');
    }

    const amountIn = parseFloat(params.amountIn);
    const exchangeRate = tokenInInfo.priceUSD / tokenOutInfo.priceUSD;
    const amountOut = amountIn * exchangeRate;
    
    // Apply fee (0.3% like Uniswap)
    const amountOutAfterFee = amountOut * 0.997;
    
    // Calculate price impact (simplified)
    const priceImpact = Math.min((amountIn / 100000) * 2, 15); // Max 15%
    
    return {
      amountOut: amountOutAfterFee,
      priceImpact,
      gasEstimate: 180000,
      route: [params.tokenIn, params.tokenOut],
      dexUsed: 'Demo AMM'
    };
  }

  private async buildSwapCalls(params: SwapParameters, userAddress: string): Promise<CallData[]> {
    // Build the swap call data
    const swapInterface = new ethers.Interface([
      'function executeSwap((address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMin, address recipient, uint256 deadline, bytes routeData), bytes32 preferredDex) external returns ((uint256 amountIn, uint256 amountOut, uint256 gasUsed, address[] path, bool success))'
    ]);

    const quote = await this.getSwapQuote(params);
    const amountOutMin = params.amountOutMin || (quote.amountOut * (1 - (params.slippage || 1) / 100)).toString();

    const swapParams = {
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      amountIn: ethers.parseUnits(params.amountIn, 18), // Assuming 18 decimals
      amountOutMin: ethers.parseUnits(amountOutMin, 18),
      recipient: userAddress,
      deadline: params.deadline || Math.floor(Date.now() / 1000) + 1200,
      routeData: '0x'
    };

    const preferredDex = params.preferredDex || ethers.ZeroHash;
    const callData = swapInterface.encodeFunctionData('executeSwap', [swapParams, preferredDex]);

    return [{
      target: this.swapAdapterAddress,
      data: callData,
      value: 0,
      description: `Swap ${params.amountIn} ${this.getTokenSymbol(params.tokenIn)} for ${this.getTokenSymbol(params.tokenOut)}`,
      gasLimit: 200000
    }];
  }

  private calculateSwapRisk(params: SwapParameters, quote: any): RiskLevel {
    const valueAtRisk = parseFloat(params.amountIn) * (this.supportedTokens.get(params.tokenIn.toLowerCase())?.priceUSD || 1);
    const complexity = 1; // Simple swap
    const priceImpact = quote.priceImpact / 100;
    
    return this.calculateRisk(valueAtRisk, complexity, priceImpact);
  }

  private generateSwapJustification(params: SwapParameters, quote: any): string {
    const tokenInSymbol = this.getTokenSymbol(params.tokenIn);
    const tokenOutSymbol = this.getTokenSymbol(params.tokenOut);
    
    return `Executing swap of ${params.amountIn} ${tokenInSymbol} for approximately ${quote.amountOut.toFixed(4)} ${tokenOutSymbol} via ${quote.dexUsed}. ` +
           `Price impact: ${quote.priceImpact.toFixed(2)}%. Gas estimate: ${quote.gasEstimate.toLocaleString()} gas.`;
  }

  private calculateConfidence(quote: any, risk: RiskLevel): number {
    let confidence = 0.9;
    
    // Reduce confidence based on price impact
    confidence -= Math.min(quote.priceImpact / 100 * 2, 0.4);
    
    // Reduce confidence based on risk level
    switch (risk) {
      case RiskLevel.HIGH: confidence -= 0.2; break;
      case RiskLevel.CRITICAL: confidence -= 0.4; break;
      case RiskLevel.MEDIUM: confidence -= 0.1; break;
    }
    
    return Math.max(0.1, confidence);
  }

  private getTokenSymbol(address: string): string {
    return this.supportedTokens.get(address.toLowerCase())?.symbol || address.slice(0, 6) + '...';
  }

  private generateMockTxHash(): string {
    return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  private initializeSupportedTokens(): void {
    // Initialize with demo tokens
    this.supportedTokens.set('0x0000000000000000000000000000000000000000', {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      decimals: 18,
      priceUSD: 2000
    });

    this.supportedTokens.set('0x1000000000000000000000000000000000000000', {
      address: '0x1000000000000000000000000000000000000000',
      symbol: 'STT',
      decimals: 18,
      priceUSD: 1
    });

    this.supportedTokens.set('0x2000000000000000000000000000000000000000', {
      address: '0x2000000000000000000000000000000000000000',
      symbol: 'USDC',
      decimals: 6,
      priceUSD: 1
    });

    this.supportedTokens.set('0x3000000000000000000000000000000000000000', {
      address: '0x3000000000000000000000000000000000000000',
      symbol: 'WBTC',
      decimals: 8,
      priceUSD: 45000
    });
  }

  // Public methods for external access
  public getSupportedTokens(): TokenInfo[] {
    return Array.from(this.supportedTokens.values());
  }

  public async getBestRoute(tokenIn: string, tokenOut: string, amountIn: string): Promise<{
    route: string[];
    expectedOutput: string;
    priceImpact: number;
    gasEstimate: number;
  }> {
    const params: SwapParameters = {
      tokenIn,
      tokenOut,
      amountIn
    };
    
    const quote = await this.getSwapQuote(params);
    
    return {
      route: quote.route,
      expectedOutput: quote.amountOut.toString(),
      priceImpact: quote.priceImpact,
      gasEstimate: quote.gasEstimate
    };
  }
}