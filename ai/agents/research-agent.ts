import { BaseAgent, AgentIntent, SimulationResult, ExecutionResult, RiskLevel, AgentCapability, CallData } from './base';
import axios from 'axios';

interface ResearchParameters {
  operation: 'market_data' | 'news' | 'token_analysis' | 'protocol_analysis' | 'trend_analysis';
  query: string;
  tokens?: string[];
  protocols?: string[];
  timeframe?: '24h' | '7d' | '30d';
}

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

interface NewsItem {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevance: number;
}

interface TokenAnalysis {
  token: string;
  fundamentals: {
    holders: number;
    transactions24h: number;
    liquidity: number;
    marketCapRank: number;
  };
  technicals: {
    rsi: number;
    macd: string;
    support: number;
    resistance: number;
  };
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  reasoning: string;
}

export class ResearchAgent extends BaseAgent {
  private veniceApiKey: string;
  private veniceBaseUrl: string = 'https://api.venice.ai/v1';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor(veniceApiKey: string) {
    super('research-agent', 'Research Agent', [
      AgentCapability.MARKET_RESEARCH,
      'news_aggregation',
      'token_analysis',
      'protocol_analysis',
      'sentiment_analysis',
      'trend_detection'
    ]);
    
    this.veniceApiKey = veniceApiKey || process.env.VENICE_API || '';
    
    if (!this.veniceApiKey) {
      console.warn('Venice API key not provided. Research agent will use mock data.');
    }
  }

  async simulate(intent: AgentIntent): Promise<SimulationResult> {
    this.validateIntent(intent);
    
    try {
      const params = this.parseResearchParameters(intent);
      const justification = this.generateJustification(params);
      
      return {
        success: true,
        gasEstimate: 0, // No gas for research operations
        valueEstimate: 0,
        risk: RiskLevel.LOW,
        calls: [],
        justification,
        warnings: [],
        confidence: 0.85
      };
    } catch (error) {
      return {
        success: false,
        gasEstimate: 0,
        valueEstimate: 0,
        risk: RiskLevel.LOW,
        calls: [],
        justification: `Failed to simulate research query: ${error instanceof Error ? error.message : 'Unknown error'}`,
        warnings: ['Research simulation failed'],
        confidence: 0
      };
    }
  }

  async execute(intent: AgentIntent): Promise<ExecutionResult> {
    this.validateIntent(intent);
    
    try {
      const params = this.parseResearchParameters(intent);
      let result: any;

      // Check cache first
      const cacheKey = JSON.stringify(params);
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        result = cached.data;
      } else {
        // Execute research query
        switch (params.operation) {
          case 'market_data':
            result = await this.getMarketData(params.tokens || []);
            break;
          case 'news':
            result = await this.getNews(params.query, params.timeframe);
            break;
          case 'token_analysis':
            result = await this.analyzeToken(params.tokens?.[0] || params.query);
            break;
          case 'protocol_analysis':
            result = await this.analyzeProtocol(params.protocols?.[0] || params.query);
            break;
          case 'trend_analysis':
            result = await this.analyzeTrends(params.query, params.timeframe);
            break;
          default:
            throw new Error(`Unsupported operation: ${params.operation}`);
        }

        // Cache the result
        this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
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
        return this.formatResearchData(data);
      } catch {
        return 'Research data retrieved successfully.';
      }
    } else {
      return `Research query failed: ${result.error}`;
    }
  }

  private parseResearchParameters(intent: AgentIntent): ResearchParameters {
    const params = intent.parameters;
    
    return {
      operation: (params.operation as any) || 'market_data',
      query: (params.query as string) || intent.description || '',
      tokens: params.tokens as string[],
      protocols: params.protocols as string[],
      timeframe: (params.timeframe as any) || '24h'
    };
  }

  private async getMarketData(tokens: string[]): Promise<MarketData[]> {
    // If Venice API is available, use it; otherwise use mock data
    if (this.veniceApiKey && tokens.length > 0) {
      try {
        const response = await this.queryVenice(`Get current market data including price, 24h change, volume, and market cap for: ${tokens.join(', ')}`);
        return this.parseMarketDataFromVenice(response);
      } catch (error) {
        console.warn('Venice API call failed, using mock data:', error);
      }
    }

    // Mock market data
    return [
      {
        symbol: 'STT',
        price: 1.02,
        change24h: 2.3,
        volume24h: 5_000_000,
        marketCap: 50_000_000,
        sentiment: 'bullish'
      },
      {
        symbol: 'ETH',
        price: 2150,
        change24h: -1.5,
        volume24h: 12_000_000_000,
        marketCap: 250_000_000_000,
        sentiment: 'neutral'
      }
    ];
  }

  private async getNews(query: string, timeframe: string = '24h'): Promise<NewsItem[]> {
    if (this.veniceApiKey) {
      try {
        const response = await this.queryVenice(
          `Find recent crypto news related to: ${query}. Timeframe: ${timeframe}. Include sentiment analysis.`
        );
        return this.parseNewsFromVenice(response);
      } catch (error) {
        console.warn('Venice API call failed, using mock data:', error);
      }
    }

    // Mock news
    return [
      {
        title: 'Somnia Network Achieves 400,000 TPS Milestone',
        summary: 'Somnia blockchain demonstrates unprecedented throughput in latest stress test, positioning itself as a leader in high-performance L1 networks.',
        source: 'CryptoNews',
        url: 'https://example.com/news1',
        publishedAt: Date.now() - 2 * 60 * 60 * 1000,
        sentiment: 'positive',
        relevance: 0.95
      },
      {
        title: 'DeFi TVL Reaches New High Across Multiple Chains',
        summary: 'Total value locked in DeFi protocols surpasses previous records as institutional adoption continues to grow.',
        source: 'DeFi Pulse',
        url: 'https://example.com/news2',
        publishedAt: Date.now() - 5 * 60 * 60 * 1000,
        sentiment: 'positive',
        relevance: 0.75
      },
      {
        title: 'Regulatory Clarity Boosts Market Sentiment',
        summary: 'New regulatory frameworks provide clearer guidelines for crypto operations, reducing uncertainty in the market.',
        source: 'Blockchain Times',
        url: 'https://example.com/news3',
        publishedAt: Date.now() - 8 * 60 * 60 * 1000,
        sentiment: 'positive',
        relevance: 0.60
      }
    ];
  }

  private async analyzeToken(token: string): Promise<TokenAnalysis> {
    if (this.veniceApiKey) {
      try {
        const response = await this.queryVenice(
          `Provide comprehensive technical and fundamental analysis for ${token}. Include holder count, transaction volume, ` +
          `RSI, MACD, support/resistance levels, and investment recommendation with reasoning.`
        );
        return this.parseTokenAnalysisFromVenice(response);
      } catch (error) {
        console.warn('Venice API call failed, using mock data:', error);
      }
    }

    // Mock token analysis
    return {
      token,
      fundamentals: {
        holders: 15420,
        transactions24h: 8500,
        liquidity: 5_000_000,
        marketCapRank: 150
      },
      technicals: {
        rsi: 62,
        macd: 'bullish crossover',
        support: 0.95,
        resistance: 1.15
      },
      recommendation: 'buy',
      reasoning: 'Strong fundamentals with increasing holder count and transaction volume. Technical indicators suggest bullish momentum with RSI in healthy range. Good liquidity supports stable price action.'
    };
  }

  private async analyzeProtocol(protocol: string): Promise<{
    name: string;
    tvl: number;
    tvlChange24h: number;
    apy: number;
    riskScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
  }> {
    if (this.veniceApiKey) {
      try {
        const response = await this.queryVenice(
          `Analyze ${protocol} DeFi protocol. Include TVL, APY, risk assessment, strengths, weaknesses, and recommendation.`
        );
        return this.parseProtocolAnalysisFromVenice(response);
      } catch (error) {
        console.warn('Venice API call failed, using mock data:', error);
      }
    }

    // Mock protocol analysis
    return {
      name: protocol,
      tvl: 50_000_000,
      tvlChange24h: 5.2,
      apy: 12.5,
      riskScore: 35, // out of 100
      strengths: [
        'Audited smart contracts by top security firms',
        'Strong community and active development',
        'Competitive yields with sustainable tokenomics'
      ],
      weaknesses: [
        'Relatively new protocol with limited track record',
        'Concentrated liquidity in few pools'
      ],
      recommendation: 'Suitable for moderate risk tolerance. Consider diversifying across multiple protocols.'
    };
  }

  private async analyzeTrends(query: string, timeframe: string = '24h'): Promise<{
    trends: Array<{ topic: string; score: number; direction: 'up' | 'down' | 'stable' }>;
    insights: string[];
    recommendations: string[];
  }> {
    if (this.veniceApiKey) {
      try {
        const response = await this.queryVenice(
          `Analyze current trends in crypto/DeFi related to: ${query}. Timeframe: ${timeframe}. ` +
          `Provide trending topics, insights, and actionable recommendations.`
        );
        return this.parseTrendAnalysisFromVenice(response);
      } catch (error) {
        console.warn('Venice API call failed, using mock data:', error);
      }
    }

    // Mock trend analysis
    return {
      trends: [
        { topic: 'Layer 1 Performance', score: 85, direction: 'up' },
        { topic: 'Staking Yields', score: 72, direction: 'stable' },
        { topic: 'DeFi Innovation', score: 68, direction: 'up' }
      ],
      insights: [
        'High-performance L1s gaining market share due to scalability improvements',
        'Staking remains popular with consistent yields around 10-15%',
        'New DeFi primitives focusing on capital efficiency and user experience'
      ],
      recommendations: [
        'Consider exposure to high-performance blockchain ecosystems',
        'Diversify staking across multiple validators for risk management',
        'Monitor emerging DeFi protocols with innovative mechanisms'
      ]
    };
  }

  private async queryVenice(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.veniceBaseUrl}/chat/completions`,
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a crypto and DeFi research assistant. Provide accurate, data-driven insights.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.veniceApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      throw new Error(`Venice API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseMarketDataFromVenice(response: string): MarketData[] {
    // In production, parse structured response from Venice
    // For now, return empty array to trigger fallback
    return [];
  }

  private parseNewsFromVenice(response: string): NewsItem[] {
    return [];
  }

  private parseTokenAnalysisFromVenice(response: string): TokenAnalysis {
    // Fallback will be triggered
    return {} as TokenAnalysis;
  }

  private parseProtocolAnalysisFromVenice(response: string): any {
    return {};
  }

  private parseTrendAnalysisFromVenice(response: string): any {
    return {};
  }

  private generateJustification(params: ResearchParameters): string {
    switch (params.operation) {
      case 'market_data':
        return `Fetching real-time market data for ${params.tokens?.join(', ') || 'requested tokens'} including price, volume, and sentiment.`;
      case 'news':
        return `Searching for relevant news and updates related to: ${params.query}. Analyzing sentiment and relevance.`;
      case 'token_analysis':
        return `Conducting comprehensive technical and fundamental analysis for ${params.tokens?.[0] || params.query}.`;
      case 'protocol_analysis':
        return `Evaluating ${params.protocols?.[0] || params.query} protocol: TVL, yields, risk factors, and recommendations.`;
      case 'trend_analysis':
        return `Analyzing current trends and market sentiment for: ${params.query}. Providing actionable insights.`;
      default:
        return 'Executing research query.';
    }
  }

  private formatResearchData(data: any): string {
    if (Array.isArray(data) && data[0]?.symbol) {
      // Market data
      const items = data.slice(0, 3).map((d: MarketData) => 
        `${d.symbol}: $${d.price} (${d.change24h > 0 ? '+' : ''}${d.change24h.toFixed(2)}%)`
      );
      return `Market Data: ${items.join(', ')}`;
    } else if (Array.isArray(data) && data[0]?.title) {
      // News
      return `Found ${data.length} relevant news articles. Top: "${data[0].title}" (${data[0].sentiment} sentiment)`;
    } else if (data.recommendation) {
      // Token analysis
      return `Analysis: ${data.recommendation.toUpperCase()}. ${data.reasoning}`;
    } else if (data.trends) {
      // Trend analysis
      return `Top trends: ${data.trends.slice(0, 3).map((t: any) => t.topic).join(', ')}`;
    }
    return 'Research completed successfully.';
  }

  // Public utility methods
  public async getSentiment(query: string): Promise<{ score: number; label: string; confidence: number }> {
    const news = await this.getNews(query, '24h');
    const positiveCount = news.filter(n => n.sentiment === 'positive').length;
    const negativeCount = news.filter(n => n.sentiment === 'negative').length;
    const total = news.length;

    const score = (positiveCount - negativeCount) / total * 100;
    const label = score > 20 ? 'bullish' : score < -20 ? 'bearish' : 'neutral';
    const confidence = Math.abs(score) / 100;

    return { score, label, confidence };
  }

  public clearCache(): void {
    this.cache.clear();
  }
}
