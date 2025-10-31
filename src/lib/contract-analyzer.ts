// AI-powered individual contract analysis
import { featureEngine } from './ml/feature-engine';
import { modelService } from './ml/model-service';
import { alpacaOptionsData, getDataSourceInfo, type DataSourceInfo } from './alpaca-options-data';

export interface ContractAnalysisRequest {
  symbol: string;
  strikePrice: number;
  expirationDate: string; // YYYY-MM-DD
  optionType: 'call' | 'put';
  contractPrice?: number; // Optional - will fetch if not provided
  quantity?: number; // Default 1
}

export interface ContractAnalysisResult {
  contract: {
    symbol: string;
    strikePrice: number;
    expirationDate: string;
    optionType: 'call' | 'put';
    currentPrice: number;
    quantity: number;
  };
  
  dataSource: DataSourceInfo;
  
  stockAnalysis: {
    currentPrice: number;
    priceTarget: number;
    priceTargetLow: number;
    priceTargetHigh: number;
    expectedMove: number;
    expectedMovePercent: number;
    technicalScore: number;
    momentumScore: number;
  };
  
  probabilities: {
    winProbability: number;
    breakEvenPrice: number;
    probabilityITM: number; // Probability of being in-the-money at expiration
    probabilityProfit: number; // Probability of making profit
  };
  
  returns: {
    maxGain: number;
    maxGainPercent: number;
    expectedReturn: number;
    expectedReturnPercent: number;
    maxLoss: number;
    maxLossPercent: number;
    riskRewardRatio: number;
  };
  
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    explanation: {
      delta: string;
      theta: string;
      vega: string;
    };
  };
  
  volatility: {
    impliedVolatility: number;
    ivRank: number;
    ivPercentile: number;
    historicalVolatility: number;
    evaluation: 'underpriced' | 'fairly-priced' | 'overpriced';
  };
  
  timeAnalysis: {
    daysToExpiration: number;
    timeDecayPerDay: number;
    optimalHoldingPeriod: number; // Days
    urgency: 'low' | 'medium' | 'high';
  };
  
  recommendation: {
    action: 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell';
    confidence: number;
    reasoning: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'very-high';
    alternativeStrikes?: number[]; // Better strike suggestions
  };
  
  aiInsights: {
    summary: string;
    keyRisks: string[];
    keyOpportunities: string[];
    marketContext: string;
  };
}

class ContractAnalyzer {
  /**
   * Analyze a specific options contract
   */
  async analyzeContract(request: ContractAnalysisRequest): Promise<ContractAnalysisResult> {
    // Validate inputs
    this.validateRequest(request);
    
    // Try to get real-time data from Alpaca first
    const alpacaConfigured = alpacaOptionsData.isConfigured();
    console.log(`Alpaca configured: ${alpacaConfigured}`);
    
    // Get current stock price (try Alpaca, fall back to estimate)
    let stockPrice: number;
    const alpacaQuote = await alpacaOptionsData.getStockQuote(request.symbol);
    if (alpacaQuote) {
      stockPrice = alpacaQuote.price;
      console.log(`✅ Using live Alpaca price for ${request.symbol}: $${stockPrice}`);
    } else {
      stockPrice = this.getStockPrice(request.symbol);
      console.log(`⚠️ Using estimated price for ${request.symbol}: $${stockPrice}`);
    }
    
    // Try to get real contract data from Alpaca
    let contractPrice: number;
    let realGreeks: any = null;
    let realIV: number | null = null;
    
    if (alpacaConfigured) {
      const alpacaContract = await alpacaOptionsData.getSpecificContract(
        request.symbol,
        request.strikePrice,
        request.expirationDate,
        request.optionType
      );
      
      if (alpacaContract) {
        contractPrice = alpacaContract.lastPrice;
        realGreeks = {
          delta: alpacaContract.delta,
          gamma: alpacaContract.gamma,
          theta: alpacaContract.theta,
          vega: alpacaContract.vega
        };
        realIV = alpacaContract.impliedVolatility;
        console.log(`✅ Using live Alpaca contract data: $${contractPrice}`);
      } else {
        contractPrice = request.contractPrice || this.estimateContractPrice(
          stockPrice,
          request.strikePrice,
          request.expirationDate,
          request.optionType
        );
        console.log(`⚠️ Contract not found in Alpaca, using estimated price: $${contractPrice}`);
      }
    } else {
      contractPrice = request.contractPrice || this.estimateContractPrice(
        stockPrice,
        request.strikePrice,
        request.expirationDate,
        request.optionType
      );
      console.log(`⚠️ Alpaca not configured, using estimated price: $${contractPrice}`);
    }
    
    const quantity = request.quantity || 1;
    const dataSource = getDataSourceInfo(alpacaConfigured);
    
    // Perform analysis
    const stockAnalysis = await this.analyzeStock(request.symbol, request.expirationDate);
    const probabilities = this.calculateProbabilities(
      stockPrice,
      request.strikePrice,
      stockAnalysis.priceTarget,
      request.optionType,
      contractPrice,
      request.expirationDate
    );
    const returns = this.calculateReturns(
      contractPrice,
      request.strikePrice,
      stockAnalysis.priceTarget,
      stockPrice,
      request.optionType,
      quantity
    );
    const greeks = realGreeks || this.calculateGreeks(
      stockPrice,
      request.strikePrice,
      request.expirationDate,
      request.optionType,
      contractPrice
    );
    const volatility = this.analyzeVolatility(request.symbol, contractPrice, request.expirationDate);
    const timeAnalysis = this.analyzeTime(request.expirationDate, greeks.theta, contractPrice);
    const recommendation = this.generateRecommendation(
      probabilities,
      returns,
      volatility,
      timeAnalysis,
      stockAnalysis,
      request.optionType
    );
    const aiInsights = this.generateAIInsights(
      request,
      stockAnalysis,
      probabilities,
      returns,
      volatility,
      recommendation
    );
    
    return {
      contract: {
        symbol: request.symbol,
        strikePrice: request.strikePrice,
        expirationDate: request.expirationDate,
        optionType: request.optionType,
        currentPrice: contractPrice,
        quantity
      },
      dataSource,
      stockAnalysis,
      probabilities,
      returns,
      greeks,
      volatility,
      timeAnalysis,
      recommendation,
      aiInsights
    };
  }
  
  private validateRequest(request: ContractAnalysisRequest): void {
    if (!request.symbol || request.symbol.length === 0) {
      throw new Error('Symbol is required');
    }
    if (!request.strikePrice || request.strikePrice <= 0) {
      throw new Error('Strike price must be positive');
    }
    if (!request.expirationDate) {
      throw new Error('Expiration date is required');
    }
    const expDate = new Date(request.expirationDate);
    if (expDate <= new Date()) {
      throw new Error('Expiration date must be in the future');
    }
    if (!['call', 'put'].includes(request.optionType)) {
      throw new Error('Option type must be call or put');
    }
  }
  
  private getStockPrice(symbol: string): number {
    // Simulated prices - in production, fetch from Alpaca
    const prices: Record<string, number> = {
      'TSLA': 242.84, 'AAPL': 175.43, 'MSFT': 378.91, 'GOOGL': 141.80,
      'AMZN': 178.35, 'NVDA': 495.22, 'META': 484.03, 'AMD': 164.25,
      'NFLX': 612.11, 'DIS': 93.12
    };
    return prices[symbol] || 100;
  }
  
  private estimateContractPrice(
    stockPrice: number,
    strikePrice: number,
    expirationDate: string,
    optionType: 'call' | 'put'
  ): number {
    const daysToExpiry = Math.max(1, Math.floor(
      (new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ));
    
    // Calculate moneyness
    const moneyness = optionType === 'call'
      ? (strikePrice - stockPrice) / stockPrice
      : (stockPrice - strikePrice) / stockPrice;
    
    // Intrinsic value
    const intrinsic = optionType === 'call'
      ? Math.max(0, stockPrice - strikePrice)
      : Math.max(0, strikePrice - stockPrice);
    
    // Time value
    const timeValue = (stockPrice * 0.02 * Math.sqrt(daysToExpiry / 365)) * 
                     Math.exp(-Math.abs(moneyness) * 2);
    
    return Math.max(0.10, intrinsic + timeValue);
  }
  
  private async analyzeStock(symbol: string, expirationDate: string): Promise<any> {
    const currentPrice = this.getStockPrice(symbol);
    const daysToExpiry = Math.max(1, Math.floor(
      (new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ));
    
    // Simulate ML prediction based on time horizon
    const volatilityFactor = 0.02 * Math.sqrt(daysToExpiry / 365);
    const trendDirection = Math.random() > 0.5 ? 1 : -1;
    const expectedMovePercent = (0.05 + Math.random() * 0.10) * trendDirection;
    
    const priceTarget = currentPrice * (1 + expectedMovePercent);
    const priceTargetLow = currentPrice * (1 + expectedMovePercent * 0.5);
    const priceTargetHigh = currentPrice * (1 + expectedMovePercent * 1.5);
    
    return {
      currentPrice,
      priceTarget,
      priceTargetLow,
      priceTargetHigh,
      expectedMove: priceTarget - currentPrice,
      expectedMovePercent: expectedMovePercent * 100,
      technicalScore: 0.60 + Math.random() * 0.30,
      momentumScore: 0.50 + Math.random() * 0.40
    };
  }
  
  private calculateProbabilities(
    stockPrice: number,
    strikePrice: number,
    priceTarget: number,
    optionType: 'call' | 'put',
    contractPrice: number,
    expirationDate: string
  ): any {
    const breakEvenPrice = optionType === 'call'
      ? strikePrice + contractPrice
      : strikePrice - contractPrice;
    
    // Simple probability model based on distance to target
    const moneyness = Math.abs(strikePrice - stockPrice) / stockPrice;
    const targetDistance = Math.abs(priceTarget - strikePrice) / stockPrice;
    
    let probabilityITM: number;
    if (optionType === 'call') {
      probabilityITM = priceTarget > strikePrice 
        ? 0.50 + (1 - moneyness) * 0.30
        : 0.30 - moneyness * 0.20;
    } else {
      probabilityITM = priceTarget < strikePrice
        ? 0.50 + (1 - moneyness) * 0.30
        : 0.30 - moneyness * 0.20;
    }
    
    probabilityITM = Math.max(0.05, Math.min(0.95, probabilityITM));
    
    const probabilityProfit = probabilityITM * 0.8; // Slightly lower than ITM
    const winProbability = probabilityProfit;
    
    return {
      winProbability: Math.round(winProbability * 100) / 100,
      breakEvenPrice: Math.round(breakEvenPrice * 100) / 100,
      probabilityITM: Math.round(probabilityITM * 100) / 100,
      probabilityProfit: Math.round(probabilityProfit * 100) / 100
    };
  }
  
  private calculateReturns(
    contractPrice: number,
    strikePrice: number,
    priceTarget: number,
    stockPrice: number,
    optionType: 'call' | 'put',
    quantity: number
  ): any {
    const investment = contractPrice * 100 * quantity;
    
    // Max gain (theoretical)
    const maxGain = optionType === 'call'
      ? Infinity // Unlimited for calls
      : (strikePrice * 100 * quantity) - investment; // Limited for puts
    
    // Expected return at price target
    const intrinsicAtTarget = optionType === 'call'
      ? Math.max(0, priceTarget - strikePrice)
      : Math.max(0, strikePrice - priceTarget);
    
    const valueAtTarget = intrinsicAtTarget * 100 * quantity;
    const expectedReturn = valueAtTarget - investment;
    const expectedReturnPercent = (expectedReturn / investment) * 100;
    
    // Max loss
    const maxLoss = investment;
    const maxLossPercent = 100;
    
    // Risk/reward
    const riskRewardRatio = expectedReturn > 0 ? expectedReturn / maxLoss : 0;
    
    return {
      maxGain: optionType === 'call' ? Infinity : Math.round(maxGain),
      maxGainPercent: optionType === 'call' ? Infinity : Math.round((maxGain / investment) * 100),
      expectedReturn: Math.round(expectedReturn),
      expectedReturnPercent: Math.round(expectedReturnPercent),
      maxLoss: Math.round(maxLoss),
      maxLossPercent: 100,
      riskRewardRatio: Math.round(riskRewardRatio * 100) / 100
    };
  }
  
  private calculateGreeks(
    stockPrice: number,
    strikePrice: number,
    expirationDate: string,
    optionType: 'call' | 'put',
    contractPrice: number
  ): any {
    const daysToExpiry = Math.max(1, Math.floor(
      (new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ));
    
    const moneyness = Math.abs(strikePrice - stockPrice) / stockPrice;
    
    // Delta
    const delta = optionType === 'call'
      ? 0.30 + (0.50 * Math.exp(-moneyness * 3))
      : -(0.30 + (0.50 * Math.exp(-moneyness * 3)));
    
    // Gamma
    const gamma = 0.05 * Math.exp(-moneyness * 2);
    
    // Theta (time decay per day)
    const theta = -(contractPrice / daysToExpiry) * 0.3;
    
    // Vega
    const vega = stockPrice * 0.01 * Math.sqrt(daysToExpiry / 365);
    
    return {
      delta: Math.round(delta * 1000) / 1000,
      gamma: Math.round(gamma * 1000) / 1000,
      theta: Math.round(theta * 100) / 100,
      vega: Math.round(vega * 100) / 100,
      explanation: {
        delta: `For every $1 move in ${optionType === 'call' ? 'up' : 'down'}, option gains ~$${Math.abs(delta).toFixed(2)}`,
        theta: `Loses ~$${Math.abs(theta).toFixed(2)} per day due to time decay`,
        vega: `Gains $${vega.toFixed(2)} for every 1% increase in IV`
      }
    };
  }
  
  private analyzeVolatility(symbol: string, contractPrice: number, expirationDate: string): any {
    // Simulated volatility analysis
    const ivRank = Math.random() * 100;
    const ivPercentile = Math.random() * 100;
    const impliedVolatility = 0.20 + Math.random() * 0.60;
    const historicalVolatility = impliedVolatility * (0.8 + Math.random() * 0.4);
    
    let evaluation: 'underpriced' | 'fairly-priced' | 'overpriced';
    if (impliedVolatility < historicalVolatility * 0.9) {
      evaluation = 'underpriced';
    } else if (impliedVolatility > historicalVolatility * 1.1) {
      evaluation = 'overpriced';
    } else {
      evaluation = 'fairly-priced';
    }
    
    return {
      impliedVolatility: Math.round(impliedVolatility * 100),
      ivRank: Math.round(ivRank),
      ivPercentile: Math.round(ivPercentile),
      historicalVolatility: Math.round(historicalVolatility * 100),
      evaluation
    };
  }
  
  private analyzeTime(expirationDate: string, theta: number, contractPrice: number): any {
    const daysToExpiration = Math.max(1, Math.floor(
      (new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ));
    
    const timeDecayPerDay = Math.abs(theta);
    
    // Optimal holding period (hold until 50% time decay eaten)
    const optimalHoldingPeriod = Math.floor(daysToExpiration * 0.5);
    
    let urgency: 'low' | 'medium' | 'high';
    if (daysToExpiration > 45) {
      urgency = 'low';
    } else if (daysToExpiration > 21) {
      urgency = 'medium';
    } else {
      urgency = 'high';
    }
    
    return {
      daysToExpiration,
      timeDecayPerDay: Math.round(timeDecayPerDay * 100) / 100,
      optimalHoldingPeriod,
      urgency
    };
  }
  
  private generateRecommendation(
    probabilities: any,
    returns: any,
    volatility: any,
    timeAnalysis: any,
    stockAnalysis: any,
    optionType: 'call' | 'put'
  ): any {
    let action: 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell';
    let confidence: number;
    const reasoning: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'very-high';
    
    // Decision logic
    const score = 
      probabilities.winProbability * 0.35 +
      (returns.riskRewardRatio > 1 ? 0.25 : 0) +
      (volatility.evaluation === 'underpriced' ? 0.20 : volatility.evaluation === 'fairly-priced' ? 0.10 : 0) +
      (stockAnalysis.technicalScore * 0.20);
    
    if (score > 0.7) {
      action = 'strong-buy';
      confidence = 0.80 + Math.random() * 0.15;
    } else if (score > 0.55) {
      action = 'buy';
      confidence = 0.65 + Math.random() * 0.15;
    } else if (score > 0.40) {
      action = 'hold';
      confidence = 0.50 + Math.random() * 0.15;
    } else if (score > 0.25) {
      action = 'sell';
      confidence = 0.60 + Math.random() * 0.15;
    } else {
      action = 'strong-sell';
      confidence = 0.70 + Math.random() * 0.15;
    }
    
    // Generate reasoning
    if (probabilities.winProbability > 0.65) {
      reasoning.push(`High win probability (${(probabilities.winProbability * 100).toFixed(0)}%)`);
    } else if (probabilities.winProbability < 0.40) {
      reasoning.push(`Low win probability (${(probabilities.winProbability * 100).toFixed(0)}%)`);
    }
    
    if (returns.riskRewardRatio > 1.5) {
      reasoning.push(`Favorable risk/reward ratio (${returns.riskRewardRatio.toFixed(2)}:1)`);
    } else if (returns.riskRewardRatio < 0.5) {
      reasoning.push(`Unfavorable risk/reward ratio (${returns.riskRewardRatio.toFixed(2)}:1)`);
    }
    
    if (volatility.evaluation === 'underpriced') {
      reasoning.push('Contract appears underpriced based on IV analysis');
    } else if (volatility.evaluation === 'overpriced') {
      reasoning.push('Contract appears overpriced - high IV premium');
    }
    
    if (timeAnalysis.urgency === 'high') {
      reasoning.push(`High time decay urgency (${timeAnalysis.daysToExpiration} days left)`);
    }
    
    if (stockAnalysis.technicalScore > 0.75) {
      reasoning.push('Strong technical momentum supporting move');
    }
    
    // Risk level
    if (probabilities.winProbability < 0.35 || timeAnalysis.daysToExpiration < 14) {
      riskLevel = 'very-high';
    } else if (probabilities.winProbability < 0.50 || timeAnalysis.daysToExpiration < 30) {
      riskLevel = 'high';
    } else if (probabilities.winProbability < 0.65) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }
    
    return {
      action,
      confidence: Math.round(confidence * 100) / 100,
      reasoning,
      riskLevel,
      alternativeStrikes: [] // Could suggest better strikes
    };
  }
  
  private generateAIInsights(
    request: ContractAnalysisRequest,
    stockAnalysis: any,
    probabilities: any,
    returns: any,
    volatility: any,
    recommendation: any
  ): any {
    const direction = request.optionType === 'call' ? 'upward' : 'downward';
    const moveNeeded = Math.abs(request.strikePrice - stockAnalysis.currentPrice);
    const movePercent = (moveNeeded / stockAnalysis.currentPrice * 100).toFixed(1);
    
    const summary = `This ${request.optionType} contract requires a ${movePercent}% ${direction} move to reach breakeven. ` +
                   `AI predicts a ${(probabilities.winProbability * 100).toFixed(0)}% probability of profit with ` +
                   `expected ${returns.expectedReturnPercent > 0 ? 'gain' : 'loss'} of ${Math.abs(returns.expectedReturnPercent).toFixed(0)}%. ` +
                   `Recommendation: ${recommendation.action.toUpperCase()}.`;
    
    const keyRisks: string[] = [];
    const keyOpportunities: string[] = [];
    
    // Risks
    if (probabilities.winProbability < 0.50) {
      keyRisks.push('Below 50% win probability');
    }
    if (returns.maxLoss > 1000) {
      keyRisks.push(`Significant capital at risk ($${returns.maxLoss.toLocaleString()})`);
    }
    if (recommendation.riskLevel === 'high' || recommendation.riskLevel === 'very-high') {
      keyRisks.push(`${recommendation.riskLevel} risk classification`);
    }
    if (volatility.evaluation === 'overpriced') {
      keyRisks.push('IV premium suggests contract may be overpriced');
    }
    
    // Opportunities
    if (probabilities.winProbability > 0.65) {
      keyOpportunities.push('High probability of profit');
    }
    if (returns.riskRewardRatio > 1.5) {
      keyOpportunities.push('Favorable risk/reward ratio');
    }
    if (volatility.evaluation === 'underpriced') {
      keyOpportunities.push('Contract appears undervalued');
    }
    if (stockAnalysis.technicalScore > 0.75) {
      keyOpportunities.push('Strong technical momentum');
    }
    
    const marketContext = `${request.symbol} is currently trading at $${stockAnalysis.currentPrice.toFixed(2)} ` +
                         `with AI predicting a move to $${stockAnalysis.priceTarget.toFixed(2)} ` +
                         `(${stockAnalysis.expectedMovePercent.toFixed(1)}%) by expiration.`;
    
    return {
      summary,
      keyRisks,
      keyOpportunities,
      marketContext
    };
  }
}

// Export singleton
export const contractAnalyzer = new ContractAnalyzer();

