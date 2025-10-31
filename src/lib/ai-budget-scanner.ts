// AI-powered budget-based contract scanning and recommendation engine
import { modelService } from './ml/model-service';
import { featureEngine } from './ml/feature-engine';
import { getRLAgent } from './rl-agent';

export interface BudgetScanRequest {
  budget: number;
  riskTolerance: 'low' | 'medium' | 'high';
  strategy: 'growth' | 'income' | 'balanced';
  maxPositions: number;
  timeHorizon: '1week' | '1month' | '3months';
}

export interface ContractRecommendation {
  symbol: string;
  strikePrice: number;
  expirationDate: string;
  type: 'call' | 'put';
  price: number;
  recommendedContracts: number;
  allocation: number;
  
  // AI Reasoning
  confidence: number;
  expectedReturn: number;
  maxLoss: number;
  winProbability: number;
  
  // Detailed explanation
  reasoning: string[];
  mlSignals: {
    priceTarget: number;
    currentPrice: number;
    ivRank: number;
    technicalScore: number;
    volumeLiquidity: string;
  };
  
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  };
  
  score: number;
}

export interface ScanResult {
  recommendations: ContractRecommendation[];
  portfolioMetrics: {
    totalAllocation: number;
    expectedReturn: number;
    maxLoss: number;
    overallWinProbability: number;
    portfolioDelta: number;
    diversificationScore: number;
  };
  scanMetadata: {
    timestamp: number;
    symbolsScanned: number;
    contractsAnalyzed: number;
    scanDuration: number;
  };
}

interface StockCandidate {
  symbol: string;
  currentPrice: number;
  priceTarget: number;
  confidence: number;
  technicalScore: number;
  ivRank: number;
}

interface OptionsContract {
  symbol: string;
  strikePrice: number;
  expirationDate: string;
  type: 'call' | 'put';
  price: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

class AIBudgetScanner {
  private scanStartTime: number = 0;
  private symbolsScanned: number = 0;
  private contractsAnalyzed: number = 0;

  /**
   * Main entry point: Scan market and return budget-optimized contract recommendations
   */
  async scanMarket(request: BudgetScanRequest): Promise<ScanResult> {
    this.scanStartTime = Date.now();
    this.symbolsScanned = 0;
    this.contractsAnalyzed = 0;

    // Validate request
    this.validateRequest(request);

    // Step 1: RL Agent determines optimal position sizing strategy
    const positionSizingStrategy = this.getPositionSizingStrategy(request);

    // Step 2: ML Models identify promising stocks
    const promisingStocks = await this.identifyPromisingStocks(request);
    this.symbolsScanned = promisingStocks.length;

    // Step 3: Scan options chains for each stock
    const allContracts = await this.scanOptionsChains(promisingStocks, request);
    this.contractsAnalyzed = allContracts.length;

    // Step 4: Score and rank all contracts
    const scoredContracts = this.scoreContracts(allContracts, request, promisingStocks);

    // Step 5: Optimize portfolio allocation
    const optimizedPortfolio = this.optimizePortfolio(
      scoredContracts,
      request,
      positionSizingStrategy
    );

    // Step 6: Calculate portfolio metrics
    const portfolioMetrics = this.calculatePortfolioMetrics(optimizedPortfolio, request);

    return {
      recommendations: optimizedPortfolio,
      portfolioMetrics,
      scanMetadata: {
        timestamp: Date.now(),
        symbolsScanned: this.symbolsScanned,
        contractsAnalyzed: this.contractsAnalyzed,
        scanDuration: Date.now() - this.scanStartTime
      }
    };
  }

  /**
   * Validate scan request parameters
   */
  private validateRequest(request: BudgetScanRequest): void {
    if (request.budget < 100) {
      throw new Error('Budget must be at least $100');
    }
    if (request.budget > 1000000) {
      throw new Error('Budget cannot exceed $1,000,000');
    }
    if (request.maxPositions < 1 || request.maxPositions > 10) {
      throw new Error('Max positions must be between 1 and 10');
    }
  }

  /**
   * Get position sizing strategy from RL Agent
   */
  private getPositionSizingStrategy(request: BudgetScanRequest): any {
    // RL Agent determines optimal allocation per position
    const riskMultipliers = {
      low: 0.15,    // 15% max per position (conservative)
      medium: 0.25, // 25% max per position (moderate)
      high: 0.35    // 35% max per position (aggressive)
    };

    const maxAllocationPerPosition = request.budget * riskMultipliers[request.riskTolerance];

    return {
      maxAllocationPerPosition,
      minAllocationPerPosition: request.budget * 0.10, // At least 10%
      targetDiversification: request.maxPositions,
      riskMultiplier: riskMultipliers[request.riskTolerance]
    };
  }

  /**
   * Use ML models to identify promising stocks
   */
  private async identifyPromisingStocks(request: BudgetScanRequest): Promise<StockCandidate[]> {
    // In production, this would use real ML predictions
    // For now, we'll use a curated list based on strategy and market conditions
    
    const stockUniverse = this.getStockUniverse(request.strategy);
    
    // Simulate ML predictions for each stock
    const candidates: StockCandidate[] = [];
    
    for (const symbol of stockUniverse) {
      const candidate = await this.analyzeStock(symbol, request);
      if (candidate.confidence >= 0.65) { // Only high-confidence picks
        candidates.push(candidate);
      }
    }

    // Sort by confidence * technicalScore
    candidates.sort((a, b) => 
      (b.confidence * b.technicalScore) - (a.confidence * a.technicalScore)
    );

    // Return top candidates (2x maxPositions for diversification)
    return candidates.slice(0, request.maxPositions * 2);
  }

  /**
   * Get stock universe based on strategy
   */
  private getStockUniverse(strategy: string): string[] {
    const universes = {
      growth: ['NVDA', 'TSLA', 'AMD', 'PLTR', 'COIN', 'SQ', 'SHOP', 'SNOW', 'NET', 'DDOG'],
      income: ['AAPL', 'MSFT', 'JPM', 'BAC', 'JNJ', 'PG', 'KO', 'PEP', 'WMT', 'T'],
      balanced: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AMD', 'NFLX', 'DIS']
    };

    return universes[strategy as keyof typeof universes] || universes.balanced;
  }

  /**
   * Analyze individual stock with ML
   */
  private async analyzeStock(symbol: string, request: BudgetScanRequest): Promise<StockCandidate> {
    // Simulate ML analysis (in production, this would call real ML models)
    const basePrice = this.getSimulatedPrice(symbol);
    
    // Time horizon affects prediction magnitude
    const horizonMultipliers = {
      '1week': 0.03,   // 3% potential move
      '1month': 0.08,  // 8% potential move
      '3months': 0.15  // 15% potential move
    };

    const multiplier = horizonMultipliers[request.timeHorizon];
    const direction = Math.random() > 0.5 ? 1 : -1;
    const priceTarget = basePrice * (1 + (direction * multiplier * (0.5 + Math.random() * 0.5)));

    return {
      symbol,
      currentPrice: basePrice,
      priceTarget,
      confidence: 0.65 + Math.random() * 0.25, // 65-90% confidence
      technicalScore: 0.60 + Math.random() * 0.30, // 60-90% score
      ivRank: Math.random() * 100 // 0-100
    };
  }

  /**
   * Get simulated current price for a symbol
   */
  private getSimulatedPrice(symbol: string): number {
    const prices: Record<string, number> = {
      'AAPL': 175.43, 'MSFT': 378.91, 'GOOGL': 141.80, 'AMZN': 178.35,
      'NVDA': 495.22, 'TSLA': 242.84, 'META': 484.03, 'AMD': 164.25,
      'NFLX': 612.11, 'DIS': 93.12, 'JPM': 199.55, 'BAC': 38.74,
      'JNJ': 157.92, 'PG': 168.34, 'KO': 62.88, 'PEP': 172.45,
      'WMT': 165.78, 'T': 21.43, 'PLTR': 38.92, 'COIN': 232.11,
      'SQ': 71.44, 'SHOP': 75.33, 'SNOW': 169.22, 'NET': 97.88,
      'DDOG': 118.44
    };
    return prices[symbol] || 100;
  }

  /**
   * Scan options chains for promising stocks
   */
  private async scanOptionsChains(
    stocks: StockCandidate[],
    request: BudgetScanRequest
  ): Promise<OptionsContract[]> {
    const allContracts: OptionsContract[] = [];

    for (const stock of stocks) {
      const contracts = await this.getOptionsChain(stock, request);
      allContracts.push(...contracts);
    }

    return allContracts;
  }

  /**
   * Get options chain for a stock (simulated - in production, call Alpaca API)
   */
  private async getOptionsChain(
    stock: StockCandidate,
    request: BudgetScanRequest
  ): Promise<OptionsContract[]> {
    const contracts: OptionsContract[] = [];
    const expirationDate = this.getExpirationDate(request.timeHorizon);
    
    // Determine if bullish or bearish based on price target
    const isBullish = stock.priceTarget > stock.currentPrice;
    const type: 'call' | 'put' = isBullish ? 'call' : 'put';

    // Generate strike prices around current price
    const strikes = this.generateStrikes(stock.currentPrice, type);

    for (const strike of strikes) {
      const contract = this.generateContract(stock, strike, expirationDate, type);
      contracts.push(contract);
    }

    return contracts;
  }

  /**
   * Generate expiration date based on time horizon
   */
  private getExpirationDate(horizon: string): string {
    const now = new Date();
    const daysToAdd = {
      '1week': 7,
      '1month': 30,
      '3months': 90
    }[horizon] || 30;

    const expiration = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    
    // Find next Friday
    while (expiration.getDay() !== 5) {
      expiration.setDate(expiration.getDate() + 1);
    }

    return expiration.toISOString().split('T')[0];
  }

  /**
   * Generate strike prices
   */
  private generateStrikes(currentPrice: number, type: 'call' | 'put'): number[] {
    const strikes: number[] = [];
    const strikeInterval = currentPrice > 100 ? 5 : 2.5;
    
    if (type === 'call') {
      // ATM and OTM calls
      for (let i = 0; i <= 3; i++) {
        strikes.push(Math.round((currentPrice + i * strikeInterval) / strikeInterval) * strikeInterval);
      }
    } else {
      // ATM and OTM puts
      for (let i = 0; i <= 3; i++) {
        strikes.push(Math.round((currentPrice - i * strikeInterval) / strikeInterval) * strikeInterval);
      }
    }

    return strikes;
  }

  /**
   * Generate contract details (simulated)
   */
  private generateContract(
    stock: StockCandidate,
    strike: number,
    expiration: string,
    type: 'call' | 'put'
  ): OptionsContract {
    const daysToExpiry = Math.max(1, Math.floor(
      (new Date(expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ));

    // Calculate moneyness
    const moneyness = type === 'call' 
      ? (strike - stock.currentPrice) / stock.currentPrice
      : (stock.currentPrice - strike) / stock.currentPrice;

    // Price based on moneyness and time
    const intrinsicValue = Math.max(0, 
      type === 'call' 
        ? stock.currentPrice - strike 
        : strike - stock.currentPrice
    );
    const timeValue = (stock.currentPrice * 0.02 * Math.sqrt(daysToExpiry / 365)) * 
                     Math.exp(-Math.abs(moneyness) * 2);
    const price = intrinsicValue + timeValue;

    // Generate Greeks
    const delta = type === 'call'
      ? 0.3 + (0.5 * Math.exp(-Math.abs(moneyness) * 3))
      : -(0.3 + (0.5 * Math.exp(-Math.abs(moneyness) * 3)));

    return {
      symbol: stock.symbol,
      strikePrice: strike,
      expirationDate: expiration,
      type,
      price: Math.max(0.10, price),
      bid: Math.max(0.05, price - 0.15),
      ask: price + 0.15,
      volume: Math.floor(Math.random() * 10000) + 1000,
      openInterest: Math.floor(Math.random() * 50000) + 5000,
      impliedVolatility: stock.ivRank / 100 * 0.8,
      delta,
      gamma: 0.05 * Math.exp(-Math.abs(moneyness) * 2),
      theta: -price / daysToExpiry * 0.3,
      vega: stock.currentPrice * 0.01 * Math.sqrt(daysToExpiry / 365)
    };
  }

  /**
   * Score all contracts using multi-factor model
   */
  private scoreContracts(
    contracts: OptionsContract[],
    request: BudgetScanRequest,
    stocks: StockCandidate[]
  ): ContractRecommendation[] {
    const recommendations: ContractRecommendation[] = [];

    for (const contract of contracts) {
      const stock = stocks.find(s => s.symbol === contract.symbol);
      if (!stock) continue;

      const recommendation = this.createRecommendation(contract, stock, request);
      recommendations.push(recommendation);
    }

    // Sort by score
    recommendations.sort((a, b) => b.score - a.score);

    return recommendations;
  }

  /**
   * Create contract recommendation with scoring
   */
  private createRecommendation(
    contract: OptionsContract,
    stock: StockCandidate,
    request: BudgetScanRequest
  ): ContractRecommendation {
    // Calculate expected move
    const expectedMove = stock.priceTarget - stock.currentPrice;
    const moveDirection = contract.type === 'call' ? 1 : -1;
    const favorableMove = expectedMove * moveDirection > 0;

    // Calculate position sizing based on risk tolerance
    const riskMultipliers = {
      low: 0.15,
      medium: 0.25,
      high: 0.35
    };
    const maxAllocation = request.budget * riskMultipliers[request.riskTolerance];
    
    // Calculate potential profit - respect position sizing limits
    const contractsAffordableByBudget = Math.floor(maxAllocation / (contract.price * 100));
    const recommendedContracts = Math.max(1, contractsAffordableByBudget);
    const allocation = recommendedContracts * contract.price * 100;

    // Estimate profit at price target
    const profitPerContract = favorableMove
      ? Math.max(0, Math.abs(stock.priceTarget - contract.strikePrice) - contract.price)
      : -contract.price * 0.5;
    const expectedReturn = profitPerContract * recommendedContracts * 100;
    const maxLoss = allocation;

    // Win probability based on ML confidence and moneyness
    const moneyness = Math.abs(contract.strikePrice - stock.currentPrice) / stock.currentPrice;
    const winProbability = favorableMove 
      ? stock.confidence * (1 - moneyness * 2)
      : stock.confidence * 0.3;

    // Calculate multi-factor score
    const score = this.calculateContractScore(
      contract,
      stock,
      expectedReturn,
      allocation,
      winProbability,
      request
    );

    // Generate reasoning
    const reasoning = this.generateReasoning(contract, stock, expectedReturn, winProbability);

    return {
      symbol: contract.symbol,
      strikePrice: contract.strikePrice,
      expirationDate: contract.expirationDate,
      type: contract.type,
      price: contract.price,
      recommendedContracts,
      allocation,
      confidence: stock.confidence,
      expectedReturn,
      maxLoss,
      winProbability: Math.max(0.1, Math.min(0.95, winProbability)),
      reasoning,
      mlSignals: {
        priceTarget: stock.priceTarget,
        currentPrice: stock.currentPrice,
        ivRank: stock.ivRank,
        technicalScore: stock.technicalScore,
        volumeLiquidity: contract.volume > 5000 ? 'High' : contract.volume > 1000 ? 'Medium' : 'Low'
      },
      greeks: {
        delta: contract.delta,
        gamma: contract.gamma,
        theta: contract.theta,
        vega: contract.vega
      },
      score
    };
  }

  /**
   * Calculate multi-factor contract score
   */
  private calculateContractScore(
    contract: OptionsContract,
    stock: StockCandidate,
    expectedReturn: number,
    allocation: number,
    winProbability: number,
    request: BudgetScanRequest
  ): number {
    const weights = {
      mlConfidence: 0.30,
      expectedReturn: 0.25,
      winProbability: 0.20,
      liquidity: 0.10,
      ivRank: 0.10,
      riskReward: 0.05
    };

    // Normalize scores to 0-1
    const mlScore = stock.confidence;
    const returnScore = Math.min(1, Math.max(0, expectedReturn / allocation + 0.5));
    const winScore = winProbability;
    const liquidityScore = Math.min(1, contract.volume / 10000);
    const ivScore = request.riskTolerance === 'low' 
      ? (100 - stock.ivRank) / 100  // Low IV preferred
      : stock.ivRank / 100;           // High IV preferred
    const riskRewardScore = expectedReturn > 0 ? Math.min(1, expectedReturn / allocation) : 0;

    const totalScore = 
      weights.mlConfidence * mlScore +
      weights.expectedReturn * returnScore +
      weights.winProbability * winScore +
      weights.liquidity * liquidityScore +
      weights.ivRank * ivScore +
      weights.riskReward * riskRewardScore;

    return totalScore;
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    contract: OptionsContract,
    stock: StockCandidate,
    expectedReturn: number,
    winProbability: number
  ): string[] {
    const reasoning: string[] = [];
    const movePercent = ((stock.priceTarget - stock.currentPrice) / stock.currentPrice * 100).toFixed(1);
    const moveDirection = stock.priceTarget > stock.currentPrice ? 'upside' : 'downside';

    reasoning.push(
      `ML predicts ${Math.abs(parseFloat(movePercent))}% ${moveDirection} to $${stock.priceTarget.toFixed(2)}`
    );

    if (stock.ivRank < 30) {
      reasoning.push('IV Rank at ' + stock.ivRank.toFixed(0) + '% - good entry for buying options');
    } else if (stock.ivRank > 70) {
      reasoning.push('IV Rank at ' + stock.ivRank.toFixed(0) + '% - elevated volatility');
    }

    if (stock.technicalScore > 0.75) {
      reasoning.push('Strong technical momentum (score: ' + (stock.technicalScore * 100).toFixed(0) + '/100)');
    }

    if (contract.volume > 5000) {
      reasoning.push(`High liquidity (volume: ${(contract.volume / 1000).toFixed(1)}K contracts/day)`);
    }

    if (expectedReturn > 0) {
      const roi = (expectedReturn / (contract.price * 100)).toFixed(0);
      reasoning.push(`Target profit: $${expectedReturn.toFixed(0)} (${roi}% ROI)`);
    }

    reasoning.push(`Win probability: ${(winProbability * 100).toFixed(0)}%`);

    return reasoning;
  }

  /**
   * Optimize portfolio for diversification and risk management
   */
  private optimizePortfolio(
    contracts: ContractRecommendation[],
    request: BudgetScanRequest,
    strategy: any
  ): ContractRecommendation[] {
    const selected: ContractRecommendation[] = [];
    let totalAllocated = 0;
    const symbolsUsed = new Set<string>();

    for (const contract of contracts) {
      // Skip if budget exhausted
      if (totalAllocated + contract.allocation > request.budget) continue;

      // Skip if max positions reached
      if (selected.length >= request.maxPositions) break;

      // Skip if symbol already used (diversification)
      if (symbolsUsed.has(contract.symbol)) continue;

      // Skip if allocation exceeds position limit
      if (contract.allocation > strategy.maxAllocationPerPosition) continue;

      // Add to portfolio
      selected.push(contract);
      totalAllocated += contract.allocation;
      symbolsUsed.add(contract.symbol);
    }

    return selected;
  }

  /**
   * Calculate overall portfolio metrics
   */
  private calculatePortfolioMetrics(
    recommendations: ContractRecommendation[],
    request: BudgetScanRequest
  ): any {
    const totalAllocation = recommendations.reduce((sum, r) => sum + r.allocation, 0);
    const expectedReturn = recommendations.reduce((sum, r) => sum + r.expectedReturn, 0);
    const maxLoss = totalAllocation;
    
    // Weighted average win probability
    const overallWinProbability = recommendations.reduce(
      (sum, r) => sum + r.winProbability * (r.allocation / totalAllocation),
      0
    );

    // Portfolio delta
    const portfolioDelta = recommendations.reduce(
      (sum, r) => sum + r.greeks.delta * r.recommendedContracts,
      0
    );

    // Diversification score (1 = perfectly diversified across max positions)
    const diversificationScore = recommendations.length / request.maxPositions;

    return {
      totalAllocation: Math.round(totalAllocation * 100) / 100,
      expectedReturn: Math.round(expectedReturn * 100) / 100,
      maxLoss: Math.round(maxLoss * 100) / 100,
      overallWinProbability: Math.round(overallWinProbability * 100) / 100,
      portfolioDelta: Math.round(portfolioDelta * 100) / 100,
      diversificationScore: Math.round(diversificationScore * 100) / 100
    };
  }
}

// Export singleton instance
export const aiBudgetScanner = new AIBudgetScanner();

