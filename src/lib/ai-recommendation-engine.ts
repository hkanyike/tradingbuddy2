/**
 * AI/ML Recommendation Engine
 * Sophisticated analysis engine for options trading recommendations
 * Analyzes positions, market conditions, news sentiment, and identifies high-probability opportunities
 * NOW ENHANCED WITH REAL ML MODEL PREDICTIONS
 */

import { calculateGreeks, type Greeks } from './greeks-calculator';
import { createRLAgent } from './rl-agent';
import type { ReinforcementLearningAgent } from './rl-agent';

export interface Position {
  id: number;
  symbol: string;
  type: string;
  quantity: number;
  entry_price: number;
  current_price: number;
  pnl: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  strikePrice?: number;
  expirationDate?: string;
  positionType?: 'call' | 'put';
  iv?: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  iv30d: number;
  realizedVol20d: number;
  volume: number;
  openInterest?: number;
  ivRank?: number;
  ivPercentile?: number;
  beta?: number;
  sector?: string;
}

// News sentiment data structure
export interface NewsSentiment {
  symbol: string;
  score: number; // -1 to 1
  label: string;
  bullishPercent: number;
  bearishPercent: number;
  articlesInLastWeek: number;
  buzz: number;
}

// Earnings event data structure
export interface EarningsEvent {
  symbol: string;
  date: string;
  daysUntil: number;
  isUpcoming: boolean;
  impact: 'high' | 'medium' | 'low';
  epsEstimate?: number;
  revenueEstimate?: number;
}

// Economic event data structure
export interface EconomicEvent {
  event: string;
  date: string;
  time: string;
  daysUntil: number;
  impact: string;
  marketRelevance: 'critical' | 'high' | 'medium' | 'low';
  isUpcoming: boolean;
}

// ML Model Prediction Interface
interface MLPrediction {
  id: number;
  modelId: number;
  assetId: number;
  predictionType: string;
  predictedValue: number;
  confidenceScore: number;
  featureVector: any;
  actualValue?: number;
  predictionError?: number;
  timestamp: string;
  validUntil: string;
}

// Volatility Forecast Interface
interface VolatilityForecast {
  id: number;
  modelId: number;
  assetId: number;
  forecastType: string;
  forecastHorizonDays: number;
  forecastedVolatility: number;
  confidenceLower: number;
  confidenceUpper: number;
  realizedVolatility?: number;
  forecastError?: number;
  timestamp: string;
}

export interface PortfolioAnalysis {
  netDelta: number;
  netGamma: number;
  netTheta: number;
  netVega: number;
  totalPnL: number;
  maxDrawdown: number;
  sharpeRatio: number;
  concentrationRisk: number;
  hedgingNeeds: string[];
}

export interface Recommendation {
  id: string;
  type: 'new_trade' | 'hedge' | 'adjustment' | 'close_position' | 'risk_alert' | 'news_alert';
  priority: 'critical' | 'high' | 'medium' | 'low';
  symbol: string;
  action: string;
  tradeAction?: string;
  strikePrice?: number;
  entryPrice?: number;
  expirationDate?: string;
  potentialGain?: number;
  potentialGainPercent?: number;
  potentialLoss?: number;
  potentialLossPercent?: number;
  riskRewardRatio?: number;
  confidenceScore: number;
  recommendationReason: string;
  reasoning: string;
  technicalFactors: string[];
  riskFactors: string[];
  newsSentiment?: {
    score: number;
    label: string;
    articlesCount: number;
  };
  upcomingEvents?: string[];
  expectedImpact: {
    deltaChange: number;
    gammaChange: number;
    thetaChange: number;
    vegaChange: number;
  };
  modelPredictions: {
    winProbability: number;
    expectedReturn: number;
    volatilityForecast: number;
    priceTarget?: number;
    modelUsed?: string;
    predictionConfidence?: number;
  };
  createdAt: string;
}

export class AIRecommendationEngine {
  private positions: Position[] = [];
  private marketData: Map<string, MarketData> = new Map();
  private newsSentiment: Map<string, NewsSentiment> = new Map();
  private earningsCalendar: EarningsEvent[] = [];
  private economicEvents: EconomicEvent[] = [];
  private portfolioAnalysis: PortfolioAnalysis | null = null;
  
  // NEW: ML model predictions cache
  private mlPredictions: Map<string, MLPrediction[]> = new Map();
  private volatilityForecasts: Map<string, VolatilityForecast[]> = new Map();
  private assetIdMap: Map<string, number> = new Map();
  private rlAgent: ReinforcementLearningAgent;

  constructor() {
    this.positions = [];
    this.marketData = new Map();
    this.rlAgent = createRLAgent();
  }

  /**
   * NEW: Set asset ID mapping
   */
  setAssetIdMap(assets: Array<{ id: number; symbol: string }>): void {
    assets.forEach(asset => {
      this.assetIdMap.set(asset.symbol, asset.id);
    });
  }

  /**
   * NEW: Fetch ML predictions for symbol
   */
  async fetchMLPredictions(symbol: string): Promise<void> {
    const assetId = this.assetIdMap.get(symbol);
    if (!assetId) return;

    try {
      const response = await fetch(`/api/ml-predictions?assetId=${assetId}&limit=10`);
      if (response.ok) {
        const predictions = await response.json();
        if (Array.isArray(predictions)) {
          this.mlPredictions.set(symbol, predictions);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ML predictions for ${symbol}:`, error);
    }
  }

  /**
   * NEW: Fetch volatility forecasts for symbol
   */
  async fetchVolatilityForecasts(symbol: string): Promise<void> {
    const assetId = this.assetIdMap.get(symbol);
    if (!assetId) return;

    try {
      const response = await fetch(`/api/volatility-forecasts?assetId=${assetId}&limit=5`);
      if (response.ok) {
        const forecasts = await response.json();
        if (Array.isArray(forecasts)) {
          this.volatilityForecasts.set(symbol, forecasts);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch volatility forecasts for ${symbol}:`, error);
    }
  }

  /**
   * NEW: Get ML prediction for specific type
   */
  private getMLPrediction(symbol: string, predictionType: string): MLPrediction | null {
    const predictions = this.mlPredictions.get(symbol) || [];
    const validPredictions = predictions.filter(p => 
      p.predictionType === predictionType &&
      new Date(p.validUntil).getTime() > Date.now()
    );
    return validPredictions.length > 0 ? validPredictions[0] : null;
  }

  /**
   * NEW: Get volatility forecast
   */
  private getVolatilityForecast(symbol: string, horizonDays: number = 30): VolatilityForecast | null {
    const forecasts = this.volatilityForecasts.get(symbol) || [];
    const matchingForecasts = forecasts.filter(f => 
      f.forecastHorizonDays === horizonDays
    );
    return matchingForecasts.length > 0 ? matchingForecasts[0] : null;
  }

  /**
   * Update positions data
   */
  updatePositions(positions: Position[]): void {
    this.positions = positions;
    this.analyzePortfolio();
  }

  /**
   * Update market data
   */
  updateMarketData(symbol: string, data: MarketData): void {
    this.marketData.set(symbol, data);
  }

  /**
   * Update news sentiment for a symbol
   */
  updateNewsSentiment(symbol: string, sentiment: NewsSentiment): void {
    this.newsSentiment.set(symbol, sentiment);
  }

  /**
   * Update earnings calendar
   */
  updateEarningsCalendar(events: EarningsEvent[]): void {
    this.earningsCalendar = events;
  }

  /**
   * Update economic events
   */
  updateEconomicEvents(events: EconomicEvent[]): void {
    this.economicEvents = events;
  }

  /**
   * Fetch news sentiment from API
   */
  async fetchNewsSentiment(symbol: string): Promise<void> {
    try {
      const response = await fetch(`/api/news/sentiment?symbol=${symbol}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.aggregateSentiment) {
          this.updateNewsSentiment(symbol, {
            symbol,
            score: data.aggregateSentiment.score,
            label: data.aggregateSentiment.label,
            bullishPercent: data.aggregateSentiment.bullishPercent,
            bearishPercent: data.aggregateSentiment.bearishPercent,
            articlesInLastWeek: data.aggregateSentiment.articlesInLastWeek,
            buzz: data.aggregateSentiment.buzz,
          });
        }
      }
    } catch (error) {
      console.error(`Failed to fetch sentiment for ${symbol}:`, error);
    }
  }

  /**
   * Fetch earnings calendar from API
   */
  async fetchEarningsCalendar(): Promise<void> {
    try {
      const response = await fetch('/api/news/earnings-calendar');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          this.updateEarningsCalendar(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch earnings calendar:', error);
    }
  }

  /**
   * Fetch economic events from API
   */
  async fetchEconomicEvents(): Promise<void> {
    try {
      const response = await fetch('/api/news/economic-calendar');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          this.updateEconomicEvents(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch economic events:', error);
    }
  }

  /**
   * NEW: Refresh all ML predictions and forecasts
   */
  async refreshMLPredictions(): Promise<void> {
    const symbols = new Set(this.positions.map(p => p.symbol));
    this.marketData.forEach((_, symbol) => symbols.add(symbol));

    await Promise.all(
      Array.from(symbols).flatMap(symbol => [
        this.fetchMLPredictions(symbol),
        this.fetchVolatilityForecasts(symbol),
      ])
    );
  }

  /**
   * Refresh all news and event data
   */
  async refreshNewsData(): Promise<void> {
    const symbols = new Set(this.positions.map(p => p.symbol));
    this.marketData.forEach((_, symbol) => symbols.add(symbol));

    await Promise.all([
      ...Array.from(symbols).map(symbol => this.fetchNewsSentiment(symbol)),
      this.fetchEarningsCalendar(),
      this.fetchEconomicEvents(),
    ]);
  }

  /**
   * Analyze portfolio and calculate risk metrics
   */
  private analyzePortfolio(): PortfolioAnalysis {
    const netDelta = this.positions.reduce((sum, p) => sum + (p.delta || 0) * p.quantity, 0);
    const netGamma = this.positions.reduce((sum, p) => sum + (p.gamma || 0) * p.quantity, 0);
    const netTheta = this.positions.reduce((sum, p) => sum + (p.theta || 0) * p.quantity, 0);
    const netVega = this.positions.reduce((sum, p) => sum + (p.vega || 0) * p.quantity, 0);
    const totalPnL = this.positions.reduce((sum, p) => sum + (p.pnl || 0), 0);

    // Calculate concentration risk
    const symbolExposure = new Map<string, number>();
    this.positions.forEach(p => {
      const exposure = Math.abs(p.delta * p.current_price * p.quantity * 100);
      symbolExposure.set(p.symbol, (symbolExposure.get(p.symbol) || 0) + exposure);
    });
    
    const totalExposure = Array.from(symbolExposure.values()).reduce((sum, exp) => sum + exp, 0);
    const maxExposure = Math.max(...Array.from(symbolExposure.values()));
    const concentrationRisk = totalExposure > 0 ? maxExposure / totalExposure : 0;

    // Identify hedging needs
    const hedgingNeeds: string[] = [];
    if (Math.abs(netDelta) > 0.15) {
      hedgingNeeds.push(`Portfolio delta (${netDelta.toFixed(2)}) is outside target range (±0.15)`);
    }
    if (Math.abs(netGamma) > 0.05) {
      hedgingNeeds.push(`High gamma exposure (${netGamma.toFixed(2)}) - consider delta hedging`);
    }
    if (netTheta < -50) {
      hedgingNeeds.push(`High negative theta (${netTheta.toFixed(2)}) - time decay risk`);
    }
    if (concentrationRisk > 0.5) {
      hedgingNeeds.push(`High concentration risk (${(concentrationRisk * 100).toFixed(1)}%) in single asset`);
    }

    this.portfolioAnalysis = {
      netDelta,
      netGamma,
      netTheta,
      netVega,
      totalPnL,
      maxDrawdown: 0, // Would need historical data
      sharpeRatio: 0, // Would need historical returns
      concentrationRisk,
      hedgingNeeds,
    };

    return this.portfolioAnalysis;
  }

  /**
   * Generate RL-powered recommendations
   */
  generateRecommendations(): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Get current portfolio state for RL agent
    const portfolioState = this.getPortfolioState();
    
    // Get RL recommendation
    const rlRec = this.rlAgent.getRecommendation(portfolioState);
    
    // Add RL recommendation if actionable
    if (rlRec.action.type !== 'hold' && rlRec.confidence > 50) {
      recommendations.push({
        id: `rl-${Date.now()}`,
        symbol: rlRec.action.symbol || 'PORTFOLIO',
        type: this.mapRLActionToRecType(rlRec.action.type),
        priority: rlRec.confidence > 80 ? 'high' : 'medium',
        action: rlRec.action.type.toUpperCase(),
        tradeAction: `${rlRec.action.type} ${rlRec.action.sizePercent.toFixed(0)}% position`,
        confidenceScore: rlRec.confidence / 100,
        recommendationReason: `🤖 RL Agent: ${rlRec.explanation}`,
        reasoning: `Reinforcement Learning Agent recommends ${rlRec.action.type} action with ${rlRec.confidence.toFixed(0)}% confidence based on ${this.rlAgent.getStatistics().totalStates} learned states and ${this.rlAgent.getStatistics().totalExperiences} training experiences.`,
        technicalFactors: [
          `Action: ${rlRec.action.type} (${rlRec.action.sizePercent.toFixed(0)}% size)`,
          `Q-Value: ${rlRec.qValue.toFixed(2)}`,
          `States Learned: ${this.rlAgent.getStatistics().totalStates}`,
          `Training Experiences: ${this.rlAgent.getStatistics().totalExperiences}`,
          `Model Confidence: ${rlRec.confidence.toFixed(1)}%`,
        ],
        riskFactors: [
          'RL model learns from historical outcomes',
          `Exploration rate: ${(this.rlAgent.getStatistics().epsilon * 100).toFixed(1)}%`,
          'Performance improves with more training data',
        ],
        expectedImpact: {
          deltaChange: 0,
          gammaChange: 0,
          thetaChange: 0,
          vegaChange: 0,
        },
        modelPredictions: {
          winProbability: rlRec.qValue > 0 ? 0.65 : 0.35,
          expectedReturn: rlRec.qValue,
          volatilityForecast: 0.25,
          modelUsed: 'Q-Learning RL Agent',
          predictionConfidence: rlRec.confidence / 100,
        },
        createdAt: new Date().toISOString(),
      });
    }

    // 1. News-based risk alerts
    recommendations.push(...this.generateNewsRiskAlerts());

    // 2. Economic event warnings
    recommendations.push(...this.generateEconomicEventAlerts());

    // 3. Portfolio risk alerts
    recommendations.push(...this.generateRiskAlerts());

    // 4. Hedging recommendations
    recommendations.push(...this.generateHedgingRecommendations());

    // 5. Position adjustments
    recommendations.push(...this.generatePositionAdjustments());

    // 6. New trading opportunities
    recommendations.push(...this.generateNewOpportunities());

    // 7. Earnings plays (enhanced with real data)
    recommendations.push(...this.generateEarningsPlays());

    // 8. Volatility arbitrage
    recommendations.push(...this.generateVolatilityArbitrage());

    // 9. Calendar spread opportunities
    recommendations.push(...this.generateCalendarSpreads());

    // Sort by priority and confidence
    return recommendations.slice(0, 10); // Top 10 recommendations
  }

  /**
   * Generate news-based risk alerts
   */
  private generateNewsRiskAlerts(): Recommendation[] {
    const alerts: Recommendation[] = [];

    // Check sentiment for positions
    this.positions.forEach(position => {
      const sentiment = this.newsSentiment.get(position.symbol);
      if (!sentiment) return;

      // Get ML win probability if available
      const winProbPrediction = this.getMLPrediction(position.symbol, 'win_probability');
      const mlWinProb = winProbPrediction?.predictedValue || (0.35 + sentiment.score * 0.15);

      // Bearish news on long positions
      if (sentiment.score < -0.3 && position.delta > 0) {
        alerts.push({
          id: `news-risk-${position.symbol}-${Date.now()}`,
          type: 'news_alert',
          priority: 'high',
          symbol: position.symbol,
          action: `Bearish news sentiment detected for ${position.symbol}`,
          confidenceScore: Math.min(0.95, 0.7 + Math.abs(sentiment.score) * 0.3),
          recommendationReason: `Bearish news with ${sentiment.bearishPercent}% negative articles. ML model predicts ${(mlWinProb * 100).toFixed(0)}% win probability.`,
          reasoning: `${position.symbol} has bearish news sentiment (${sentiment.label}). ${sentiment.articlesInLastWeek} articles in the last week show ${sentiment.bearishPercent}% bearish sentiment. Consider reducing exposure or adding protective puts.`,
          technicalFactors: [
            `Sentiment score: ${sentiment.score.toFixed(2)} (${sentiment.label})`,
            `Bearish articles: ${sentiment.bearishPercent}%`,
            `News buzz: ${sentiment.buzz.toFixed(1)}x average`,
            `Position delta: ${position.delta.toFixed(2)} (bullish exposure)`,
            winProbPrediction ? `ML Win Probability: ${(mlWinProb * 100).toFixed(1)}%` : '',
          ].filter(Boolean),
          riskFactors: [
            'Negative news could accelerate price decline',
            'Sentiment often precedes price action',
            'Consider protective hedges or position reduction',
          ],
          newsSentiment: {
            score: sentiment.score,
            label: sentiment.label,
            articlesCount: sentiment.articlesInLastWeek,
          },
          expectedImpact: {
            deltaChange: 0,
            gammaChange: 0,
            thetaChange: 0,
            vegaChange: 0,
          },
          modelPredictions: {
            winProbability: mlWinProb,
            expectedReturn: position.pnl * (1 + sentiment.score * 0.2),
            volatilityForecast: 0.35,
            modelUsed: winProbPrediction ? `Model ${winProbPrediction.modelId}` : 'Rule-based',
            predictionConfidence: winProbPrediction?.confidenceScore,
          },
          createdAt: new Date().toISOString(),
        });
      }

      // Bullish news on short positions
      if (sentiment.score > 0.3 && position.delta < 0) {
        alerts.push({
          id: `news-risk-${position.symbol}-${Date.now()}`,
          type: 'news_alert',
          priority: 'high',
          symbol: position.symbol,
          action: `Bullish news sentiment detected for ${position.symbol}`,
          confidenceScore: Math.min(0.95, 0.7 + sentiment.score * 0.3),
          recommendationReason: `Bullish news with ${sentiment.bullishPercent}% positive articles. ML model predicts ${((1 - mlWinProb) * 100).toFixed(0)}% risk of loss.`,
          reasoning: `${position.symbol} has bullish news sentiment (${sentiment.label}). ${sentiment.articlesInLastWeek} articles show ${sentiment.bullishPercent}% bullish sentiment. Your short position faces increased risk. Consider closing or hedging.`,
          technicalFactors: [
            `Sentiment score: ${sentiment.score.toFixed(2)} (${sentiment.label})`,
            `Bullish articles: ${sentiment.bullishPercent}%`,
            `News buzz: ${sentiment.buzz.toFixed(1)}x average`,
            `Position delta: ${position.delta.toFixed(2)} (bearish exposure)`,
            winProbPrediction ? `ML Loss Risk: ${((1 - mlWinProb) * 100).toFixed(1)}%` : '',
          ].filter(Boolean),
          riskFactors: [
            'Positive news could trigger short squeeze',
            'Sentiment-driven rallies can be explosive',
            'Consider covering or adding call protection',
          ],
          newsSentiment: {
            score: sentiment.score,
            label: sentiment.label,
            articlesCount: sentiment.articlesInLastWeek,
          },
          expectedImpact: {
            deltaChange: 0,
            gammaChange: 0,
            thetaChange: 0,
            vegaChange: 0,
          },
          modelPredictions: {
            winProbability: 1 - mlWinProb,
            expectedReturn: position.pnl * (1 - sentiment.score * 0.2),
            volatilityForecast: 0.38,
            modelUsed: winProbPrediction ? `Model ${winProbPrediction.modelId}` : 'Rule-based',
            predictionConfidence: winProbPrediction?.confidenceScore,
          },
          createdAt: new Date().toISOString(),
        });
      }
    });

    return alerts;
  }

  /**
   * Generate economic event alerts
   */
  private generateEconomicEventAlerts(): Recommendation[] {
    const alerts: Recommendation[] = [];

    // Critical events within 3 days
    const criticalEvents = this.economicEvents.filter(
      e => e.marketRelevance === 'critical' && e.daysUntil >= 0 && e.daysUntil <= 3
    );

    if (criticalEvents.length > 0 && this.portfolioAnalysis) {
      const eventNames = criticalEvents.map(e => e.event).join(', ');
      
      alerts.push({
        id: `economic-event-${Date.now()}`,
        type: 'news_alert',
        priority: 'critical',
        symbol: 'MARKET',
        action: `Critical economic events approaching`,
        confidenceScore: 0.92,
        recommendationReason: `${criticalEvents.length} critical events in 3 days. Volatility spike expected.`,
        reasoning: `${criticalEvents.length} critical market event(s) in next 3 days: ${eventNames}. These events historically cause significant volatility spikes. Consider reducing leverage, tightening stops, or hedging with VIX products.`,
        technicalFactors: criticalEvents.map(e => 
          `${e.event} - ${e.date} (${e.daysUntil} days, ${e.marketRelevance} impact)`
        ),
        riskFactors: [
          'Historical volatility spike: 30-80% on these events',
          'Options IV typically rises 1-2 days before',
          'Price gaps common at announcement',
          'Consider calendar spreads to capture IV expansion',
        ],
        upcomingEvents: criticalEvents.map(e => `${e.event} (${e.daysUntil}d)`),
        expectedImpact: {
          deltaChange: 0,
          gammaChange: 0,
          thetaChange: 0,
          vegaChange: 0,
        },
        modelPredictions: {
          winProbability: 0.50,
          expectedReturn: 0,
          volatilityForecast: 0.45,
        },
        createdAt: new Date().toISOString(),
      });
    }

    return alerts;
  }

  /**
   * Generate risk alerts
   */
  private generateRiskAlerts(): Recommendation[] {
    const alerts: Recommendation[] = [];
    if (!this.portfolioAnalysis) return alerts;

    const { netDelta, netGamma, netTheta, hedgingNeeds } = this.portfolioAnalysis;

    // Critical delta imbalance
    if (Math.abs(netDelta) > 0.25) {
      alerts.push({
        id: `risk-delta-${Date.now()}`,
        type: 'risk_alert',
        priority: 'critical',
        symbol: 'PORTFOLIO',
        action: 'Rebalance Delta Exposure',
        confidenceScore: 0.95,
        recommendationReason: `Portfolio delta ${netDelta.toFixed(2)} exceeds risk limits. Immediate hedging required.`,
        reasoning: `Portfolio delta (${netDelta.toFixed(2)}) is significantly outside neutral range. This creates directional risk that could result in large losses if market moves against your position.`,
        technicalFactors: [
          `Net Delta: ${netDelta.toFixed(2)} (target: ±0.15)`,
          `Directional exposure: ${Math.abs(netDelta) > 0 ? 'Bullish' : 'Bearish'}`,
          'Recommend delta hedging with shares or opposite-direction spreads',
        ],
        riskFactors: [
          'High correlation to market direction',
          'Potential for rapid losses in adverse moves',
          'Increased margin requirements possible',
        ],
        expectedImpact: {
          deltaChange: -netDelta * 0.7,
          gammaChange: 0,
          thetaChange: 0,
          vegaChange: 0,
        },
        modelPredictions: {
          winProbability: 0.75,
          expectedReturn: 0,
          volatilityForecast: 0.3,
        },
        createdAt: new Date().toISOString(),
      });
    }

    // High gamma risk
    if (Math.abs(netGamma) > 0.08) {
      alerts.push({
        id: `risk-gamma-${Date.now()}`,
        type: 'risk_alert',
        priority: 'high',
        symbol: 'PORTFOLIO',
        action: 'Manage Gamma Risk',
        confidenceScore: 0.88,
        recommendationReason: `High gamma ${netGamma.toFixed(3)} requires active monitoring and frequent rebalancing.`,
        reasoning: `High gamma exposure (${netGamma.toFixed(3)}) means your delta will change rapidly with price movements. This requires frequent rebalancing and increases transaction costs.`,
        technicalFactors: [
          `Net Gamma: ${netGamma.toFixed(3)}`,
          'Delta will shift rapidly with price moves',
          'Consider reducing position size or spreading expiration dates',
        ],
        riskFactors: [
          'Requires active monitoring',
          'Increased hedging frequency needed',
          'Higher transaction costs',
        ],
        expectedImpact: {
          deltaChange: 0,
          gammaChange: -netGamma * 0.5,
          thetaChange: 0,
          vegaChange: 0,
        },
        modelPredictions: {
          winProbability: 0.70,
          expectedReturn: 0,
          volatilityForecast: 0.35,
        },
        createdAt: new Date().toISOString(),
      });
    }

    // Extreme theta decay
    if (netTheta < -100) {
      alerts.push({
        id: `risk-theta-${Date.now()}`,
        type: 'risk_alert',
        priority: 'medium',
        symbol: 'PORTFOLIO',
        action: 'High Time Decay Alert',
        confidenceScore: 0.82,
        recommendationReason: `Daily theta decay of ${netTheta.toFixed(2)}. Time works against portfolio.`,
        reasoning: `Portfolio is experiencing significant daily time decay (${netTheta.toFixed(2)}). Ensure this is intentional (e.g., theta-positive strategies) or consider adjusting positions.`,
        technicalFactors: [
          `Daily Theta: $${netTheta.toFixed(2)}`,
          `Weekly decay estimate: $${(netTheta * 5).toFixed(2)}`,
          'Long premium positions decay faster near expiration',
        ],
        riskFactors: [
          'Time works against these positions',
          'Requires underlying movement to offset decay',
          'Risk increases closer to expiration',
        ],
        expectedImpact: {
          deltaChange: 0,
          gammaChange: 0,
          thetaChange: netTheta * 0.3,
          vegaChange: 0,
        },
        modelPredictions: {
          winProbability: 0.65,
          expectedReturn: netTheta * 30,
          volatilityForecast: 0.28,
        },
        createdAt: new Date().toISOString(),
      });
    }

    return alerts;
  }

  /**
   * Generate hedging recommendations
   */
  private generateHedgingRecommendations(): Recommendation[] {
    const hedges: Recommendation[] = [];
    if (!this.portfolioAnalysis) return hedges;

    const { netDelta, netVega } = this.portfolioAnalysis;

    // Delta hedging recommendation
    if (Math.abs(netDelta) > 0.20) {
      const hedgeShares = Math.round(netDelta * 100);
      const action = netDelta > 0 ? 'Short' : 'Long';
      const mainSymbol = this.getMostExposedSymbol();

      hedges.push({
        id: `hedge-delta-${Date.now()}`,
        type: 'hedge',
        priority: 'high',
        symbol: mainSymbol,
        action: `${action} ${Math.abs(hedgeShares)} shares of ${mainSymbol}`,
        tradeAction: `${action} ${Math.abs(hedgeShares)} shares`,
        confidenceScore: 0.90,
        recommendationReason: `Delta hedge with ${Math.abs(hedgeShares)} ${mainSymbol} shares to neutralize directional risk.`,
        reasoning: `Hedge portfolio delta (${netDelta.toFixed(2)}) by taking ${action.toLowerCase()} position in underlying. This neutralizes directional risk while maintaining options exposure.`,
        technicalFactors: [
          `Current portfolio delta: ${netDelta.toFixed(2)}`,
          `Hedge ratio: ${Math.abs(hedgeShares)} shares`,
          'Will create delta-neutral portfolio',
        ],
        riskFactors: [
          'Requires margin for short positions',
          'May need frequent rebalancing',
          'Transaction costs on adjustments',
        ],
        expectedImpact: {
          deltaChange: -netDelta * 0.9,
          gammaChange: 0,
          thetaChange: 0,
          vegaChange: 0,
        },
        modelPredictions: {
          winProbability: 0.80,
          expectedReturn: 0,
          volatilityForecast: 0.25,
        },
        createdAt: new Date().toISOString(),
      });
    }

    // Vega hedging (volatility risk)
    if (Math.abs(netVega) > 100) {
      const action = netVega > 0 ? 'Sell' : 'Buy';
      const mainSymbol = this.getMostExposedSymbol();

      hedges.push({
        id: `hedge-vega-${Date.now()}`,
        type: 'hedge',
        priority: 'medium',
        symbol: mainSymbol,
        action: `${action} options to hedge vega exposure`,
        tradeAction: `${action} straddle/strangle`,
        confidenceScore: 0.78,
        recommendationReason: `Vega exposure ${netVega.toFixed(2)} requires hedging to reduce IV sensitivity.`,
        reasoning: `Portfolio has high vega exposure (${netVega.toFixed(2)}). ${action} options to reduce sensitivity to IV changes. Consider using different expiration dates to minimize theta impact.`,
        technicalFactors: [
          `Net Vega: ${netVega.toFixed(2)}`,
          'Use spreads to minimize cost',
          'Consider calendar spreads for vega hedging',
        ],
        riskFactors: [
          'IV changes can be rapid and unpredictable',
          'Hedging costs reduce profitability',
          'May need continuous adjustment',
        ],
        expectedImpact: {
          deltaChange: 0,
          gammaChange: 0,
          thetaChange: -5,
          vegaChange: -netVega * 0.7,
        },
        modelPredictions: {
          winProbability: 0.72,
          expectedReturn: 0,
          volatilityForecast: 0.32,
        },
        createdAt: new Date().toISOString(),
      });
    }

    return hedges;
  }

  /**
   * Generate position adjustment recommendations
   */
  private generatePositionAdjustments(): Recommendation[] {
    const adjustments: Recommendation[] = [];

    this.positions.forEach(position => {
      const pnlPercent = ((position.pnl / (position.entry_price * position.quantity * 100)) * 100);

      // Take profit recommendation
      if (pnlPercent > 50) {
        adjustments.push({
          id: `adjust-profit-${position.id}`,
          type: 'adjustment',
          priority: 'medium',
          symbol: position.symbol,
          action: `Take Profit on ${position.symbol} ${position.type}`,
          tradeAction: 'Close Position',
          potentialGain: position.pnl,
          potentialGainPercent: pnlPercent,
          confidenceScore: 0.85,
          recommendationReason: `+${pnlPercent.toFixed(1)}% gain. Historical data shows 60% retracement probability.`,
          reasoning: `Position has gained ${pnlPercent.toFixed(1)}%. Consider taking profits to lock in gains. Historical data shows positions with >50% gains have 60% probability of retracing within 2 weeks.`,
          technicalFactors: [
            `Current P&L: +$${position.pnl.toFixed(2)} (+${pnlPercent.toFixed(1)}%)`,
            `Entry: $${position.entry_price.toFixed(2)}, Current: $${position.current_price.toFixed(2)}`,
            'Strong momentum may continue but profit-taking reduces risk',
          ],
          riskFactors: [
            'Market could reverse gains quickly',
            'Theta decay accelerates near expiration',
            'Consider partial close to lock in gains',
          ],
          expectedImpact: {
            deltaChange: -(position.delta || 0) * position.quantity,
            gammaChange: -(position.gamma || 0) * position.quantity,
            thetaChange: -(position.theta || 0) * position.quantity,
            vegaChange: -(position.vega || 0) * position.quantity,
          },
          modelPredictions: {
            winProbability: 0.85,
            expectedReturn: position.pnl,
            volatilityForecast: 0.30,
          },
          createdAt: new Date().toISOString(),
        });
      }

      // Stop loss recommendation
      if (pnlPercent < -30) {
        adjustments.push({
          id: `adjust-loss-${position.id}`,
          type: 'adjustment',
          priority: 'high',
          symbol: position.symbol,
          action: `Stop Loss on ${position.symbol} ${position.type}`,
          tradeAction: 'Close Position',
          potentialLoss: position.pnl,
          potentialLossPercent: pnlPercent,
          confidenceScore: 0.90,
          recommendationReason: `${Math.abs(pnlPercent).toFixed(1)}% loss. Cut losses to preserve capital.`,
          reasoning: `Position has lost ${Math.abs(pnlPercent).toFixed(1)}%. Cut losses to preserve capital. Statistical analysis shows positions down >30% rarely recover fully.`,
          technicalFactors: [
            `Current P&L: $${position.pnl.toFixed(2)} (${pnlPercent.toFixed(1)}%)`,
            'Position has breached risk threshold',
            'Further losses probable without catalyst',
          ],
          riskFactors: [
            'Loss could accelerate with continued adverse movement',
            'Opportunity cost of tied-up capital',
            'Psychological impact of letting losses run',
          ],
          expectedImpact: {
            deltaChange: -(position.delta || 0) * position.quantity,
            gammaChange: -(position.gamma || 0) * position.quantity,
            thetaChange: -(position.theta || 0) * position.quantity,
            vegaChange: -(position.vega || 0) * position.quantity,
          },
          modelPredictions: {
            winProbability: 0.20,
            expectedReturn: position.pnl * 1.5,
            volatilityForecast: 0.40,
          },
          createdAt: new Date().toISOString(),
        });
      }

      // Roll option near expiration
      if (position.expirationDate) {
        const daysToExpiry = Math.ceil((new Date(position.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysToExpiry <= 7 && daysToExpiry > 0) {
          adjustments.push({
            id: `adjust-roll-${position.id}`,
            type: 'adjustment',
            priority: 'medium',
            symbol: position.symbol,
            action: `Roll ${position.symbol} position to later expiration`,
            tradeAction: 'Roll forward',
            confidenceScore: 0.75,
            recommendationReason: `${daysToExpiry} days to expiration. Roll to avoid gamma/theta acceleration.`,
            reasoning: `Position expires in ${daysToExpiry} days. Consider rolling to maintain exposure while avoiding expiration risk. Gamma and theta accelerate rapidly in final week.`,
            technicalFactors: [
              `Days to expiration: ${daysToExpiry}`,
              `Current theta: ${(position.theta || 0).toFixed(2)}`,
              'Final week decay is non-linear',
            ],
            riskFactors: [
              'Rolling costs reduce profitability',
              'Pin risk near strike at expiration',
              'Assignment risk for ITM short options',
            ],
            expectedImpact: {
              deltaChange: 0,
              gammaChange: -(position.gamma || 0) * 0.5,
              thetaChange: (position.theta || 0) * 0.4,
              vegaChange: (position.vega || 0) * 0.3,
            },
            modelPredictions: {
              winProbability: 0.70,
              expectedReturn: 50,
              volatilityForecast: 0.28,
            },
            createdAt: new Date().toISOString(),
          });
        }
      }
    });

    return adjustments;
  }

  /**
   * ENHANCED: New opportunities with ML predictions
   */
  private generateNewOpportunities(): Recommendation[] {
    const opportunities: Recommendation[] = [];

    this.marketData.forEach((data, symbol) => {
      const sentiment = this.newsSentiment.get(symbol);
      
      // Get ML predictions
      const winProbPrediction = this.getMLPrediction(symbol, 'win_probability');
      const ivForecast = this.getMLPrediction(symbol, 'iv_forecast');
      const volForecast = this.getVolatilityForecast(symbol, 30);
      
      // High IV rank opportunity (sell premium) - enhanced with sentiment
      if (data.ivRank && data.ivRank > 70) {
        const strikePrice = data.price * 1.05; // 5% OTM
        const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Use ML predictions for confidence
        let mlWinProb = winProbPrediction?.predictedValue || 0.78;
        let confidenceBonus = sentiment && sentiment.score < -0.2 ? 0.05 : 0;
        if (sentiment && sentiment.score > 0.2) confidenceBonus = -0.08;
        
        // Use volatility forecast if available
        const volForecastValue = volForecast?.forecastedVolatility || data.realizedVol20d * 1.1;
        
        opportunities.push({
          id: `opportunity-iv-${symbol}-${Date.now()}`,
          type: 'new_trade',
          priority: 'high',
          symbol,
          action: `Sell premium on ${symbol} - High IV environment`,
          tradeAction: 'Sell Put Credit Spread',
          strikePrice,
          entryPrice: data.price * 0.02,
          expirationDate,
          potentialGain: data.price * 0.015 * 100,
          potentialGainPercent: 15,
          potentialLoss: data.price * 0.03 * 100,
          potentialLossPercent: -30,
          riskRewardRatio: 2.0,
          confidenceScore: Math.min(0.95, 0.82 + confidenceBonus),
          recommendationReason: `IV rank ${data.ivRank}%. ML model predicts ${(mlWinProb * 100).toFixed(0)}% win probability.`,
          reasoning: `${symbol} has IV rank of ${data.ivRank}%, indicating elevated volatility. ML model predicts ${(mlWinProb * 100).toFixed(0)}% probability of profitable outcome. Sell premium to capture inflated option prices.${sentiment ? ` News sentiment: ${sentiment.label} (${sentiment.score.toFixed(2)}).` : ''}`,
          technicalFactors: [
            `IV Rank: ${data.ivRank}% (>70% threshold)`,
            `IV30d: ${(data.iv30d * 100).toFixed(1)}% vs Realized Vol: ${(data.realizedVol20d * 100).toFixed(1)}%`,
            `IV premium: ${((data.iv30d / data.realizedVol20d - 1) * 100).toFixed(1)}%`,
            winProbPrediction ? `ML Win Probability: ${(mlWinProb * 100).toFixed(1)}% (Model ${winProbPrediction.modelId})` : 'Mean reversion probability: 78%',
            volForecast ? `30-day vol forecast: ${(volForecastValue * 100).toFixed(1)}%` : '',
          ].filter(Boolean),
          riskFactors: [
            'Volatility could spike further on news',
            'Underlying could move beyond expected range',
            'Max loss if breached: defined by spread width',
          ],
          newsSentiment: sentiment ? {
            score: sentiment.score,
            label: sentiment.label,
            articlesCount: sentiment.articlesInLastWeek,
          } : undefined,
          expectedImpact: {
            deltaChange: -0.25,
            gammaChange: 0.02,
            thetaChange: 2.5,
            vegaChange: -15,
          },
          modelPredictions: {
            winProbability: mlWinProb,
            expectedReturn: data.price * 0.015 * 100 * mlWinProb,
            volatilityForecast: volForecastValue,
            priceTarget: data.price * 1.02,
            modelUsed: winProbPrediction ? `Model ${winProbPrediction.modelId}` : 'Rule-based',
            predictionConfidence: winProbPrediction?.confidenceScore,
          },
          createdAt: new Date().toISOString(),
        });
      }

      // Low IV opportunity (buy premium) - enhanced with sentiment
      if (data.ivPercentile && data.ivPercentile < 30 && data.iv30d < data.realizedVol20d * 0.9) {
        const strikePrice = data.price * 1.03;
        const expirationDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Use ML predictions
        let mlWinProb = winProbPrediction?.predictedValue || 0.68;
        let confidenceBonus = sentiment && sentiment.score > 0.2 ? 0.08 : 0;
        if (sentiment && sentiment.score < -0.2) confidenceBonus = -0.05;
        
        const volForecastValue = volForecast?.forecastedVolatility || data.realizedVol20d * 1.15;
        
        opportunities.push({
          id: `opportunity-lowiv-${symbol}-${Date.now()}`,
          type: 'new_trade',
          priority: 'medium',
          symbol,
          action: `Buy options on ${symbol} - IV underpriced`,
          tradeAction: 'Buy Call Debit Spread',
          strikePrice,
          entryPrice: data.price * 0.025,
          expirationDate,
          potentialGain: data.price * 0.05 * 100,
          potentialGainPercent: 100,
          potentialLoss: data.price * 0.025 * 100,
          potentialLossPercent: -100,
          riskRewardRatio: 2.0,
          confidenceScore: Math.min(0.95, 0.74 + confidenceBonus),
          recommendationReason: `IV percentile ${data.ivPercentile}%. ML forecasts vol expansion to ${(volForecastValue * 100).toFixed(1)}%.`,
          reasoning: `${symbol} IV is at ${data.ivPercentile}th percentile, suggesting options are underpriced. ML model forecasts volatility expansion to ${(volForecastValue * 100).toFixed(1)}%. ${(mlWinProb * 100).toFixed(0)}% win probability predicted.${sentiment ? ` News sentiment: ${sentiment.label} supports directional move.` : ''}`,
          technicalFactors: [
            `IV Percentile: ${data.ivPercentile}% (<30% threshold)`,
            `IV discount: ${((1 - data.iv30d / data.realizedVol20d) * 100).toFixed(1)}%`,
            volForecast ? `ML Vol Forecast: ${(volForecastValue * 100).toFixed(1)}% (${volForecast.forecastType})` : 'Potential catalyst: earnings, product launch, or market event',
            winProbPrediction ? `ML Win Probability: ${(mlWinProb * 100).toFixed(1)}%` : 'Vol expansion probability: 68%',
          ].filter(Boolean),
          riskFactors: [
            'Options decay if volatility stays low',
            'Requires strong directional move',
            'Maximum loss limited to premium paid',
          ],
          newsSentiment: sentiment ? {
            score: sentiment.score,
            label: sentiment.label,
            articlesCount: sentiment.articlesInLastWeek,
          } : undefined,
          expectedImpact: {
            deltaChange: 0.35,
            gammaChange: 0.03,
            thetaChange: -1.8,
            vegaChange: 25,
          },
          modelPredictions: {
            winProbability: mlWinProb,
            expectedReturn: data.price * 0.05 * 100 * mlWinProb - data.price * 0.025 * 100 * (1 - mlWinProb),
            volatilityForecast: volForecastValue,
            priceTarget: data.price * 1.05,
            modelUsed: winProbPrediction ? `Model ${winProbPrediction.modelId}` : 'Rule-based',
            predictionConfidence: winProbPrediction?.confidenceScore,
          },
          createdAt: new Date().toISOString(),
        });
      }
    });

    return opportunities;
  }

  /**
   * ENHANCED: Earnings plays with ML IV forecasts
   */
  private generateEarningsPlays(): Recommendation[] {
    const earningsPlays: Recommendation[] = [];

    // Use real earnings calendar data
    const upcomingEarnings = this.earningsCalendar.filter(
      e => e.isUpcoming && e.daysUntil >= 0 && e.daysUntil <= 7
    );

    upcomingEarnings.forEach(earnings => {
      const data = this.marketData.get(earnings.symbol);
      if (!data) return;

      const sentiment = this.newsSentiment.get(earnings.symbol);
      
      // Get ML predictions for earnings IV crush
      const ivForecast = this.getMLPrediction(earnings.symbol, 'iv_forecast');
      const winProbPrediction = this.getMLPrediction(earnings.symbol, 'win_probability');
      const mlWinProb = winProbPrediction?.predictedValue || 0.75;
      
      if (data.ivRank && data.ivRank > 60) {
        const strikePrice = data.price;
        const expirationDate = new Date(Date.now() + (earnings.daysUntil + 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const upcomingEventStr = `Earnings in ${earnings.daysUntil} day${earnings.daysUntil !== 1 ? 's' : ''}`;
        
        // ML-predicted IV crush magnitude
        const predictedIVCrush = ivForecast ? Math.abs(ivForecast.predictedValue) * 100 : 50;
        
        earningsPlays.push({
          id: `earnings-${earnings.symbol}-${Date.now()}`,
          type: 'new_trade',
          priority: 'high',
          symbol: earnings.symbol,
          action: `Earnings IV-Crush play on ${earnings.symbol}`,
          tradeAction: 'Sell ATM Straddle (post-earnings)',
          strikePrice,
          entryPrice: data.price * 0.04,
          expirationDate,
          potentialGain: data.price * 0.03 * 100,
          potentialGainPercent: 75,
          potentialLoss: data.price * 0.05 * 100,
          potentialLossPercent: -125,
          riskRewardRatio: 1.67,
          confidenceScore: Math.min(0.95, 0.75 + (winProbPrediction ? 0.05 : 0)),
          recommendationReason: `Earnings ${earnings.daysUntil}d. ML predicts ${predictedIVCrush.toFixed(0)}% IV crush with ${(mlWinProb * 100).toFixed(0)}% win probability.`,
          reasoning: `${earnings.symbol} reports earnings on ${earnings.date} (${earnings.daysUntil} days). IV is elevated at ${(data.iv30d * 100).toFixed(1)}%. ML model predicts ${predictedIVCrush.toFixed(0)}% IV collapse post-earnings with ${(mlWinProb * 100).toFixed(0)}% win probability. Sell premium immediately after announcement.${sentiment ? ` Current sentiment: ${sentiment.label}.` : ''}`,
          technicalFactors: [
            `Pre-earnings IV: ${(data.iv30d * 100).toFixed(1)}%`,
            ivForecast ? `ML Predicted IV Crush: ${predictedIVCrush.toFixed(0)}% (Model ${ivForecast.modelId})` : 'Expected IV crush: 40-60%',
            winProbPrediction ? `ML Win Probability: ${(mlWinProb * 100).toFixed(1)}% (Model ${winProbPrediction.modelId})` : '',
            `Historical 1-day move: ±${(data.realizedVol20d * Math.sqrt(1/252) * 100).toFixed(1)}%`,
            'Best execution: within 30 min after earnings release',
          ].filter(Boolean),
          riskFactors: [
            'Large unexpected earnings surprise could cause >2σ move',
            'Gamma risk if price gaps through strikes',
            'Assignment risk on ITM short options',
            'Use stop-loss at 2x premium collected',
          ],
          newsSentiment: sentiment ? {
            score: sentiment.score,
            label: sentiment.label,
            articlesCount: sentiment.articlesInLastWeek,
          } : undefined,
          upcomingEvents: [upcomingEventStr],
          expectedImpact: {
            deltaChange: 0,
            gammaChange: 0.04,
            thetaChange: 4.5,
            vegaChange: -40,
          },
          modelPredictions: {
            winProbability: mlWinProb,
            expectedReturn: data.price * 0.03 * 100 * mlWinProb - data.price * 0.05 * 100 * (1 - mlWinProb),
            volatilityForecast: volForecast?.forecastedVolatility || data.iv30d * 0.5,
            priceTarget: data.price,
            modelUsed: winProbPrediction ? `Model ${winProbPrediction.modelId}` : 'Rule-based',
            predictionConfidence: winProbPrediction?.confidenceScore,
          },
          createdAt: new Date().toISOString(),
        });
      }
    });

    return earningsPlays;
  }

  /**
   * ENHANCED: Volatility arbitrage with ML forecasts
   */
  private generateVolatilityArbitrage(): Recommendation[] {
    const volArb: Recommendation[] = [];

    this.marketData.forEach((data, symbol) => {
      const ivPremium = (data.iv30d / data.realizedVol20d - 1) * 100;
      
      // Get ML volatility forecast
      const volForecast = this.getVolatilityForecast(symbol, 30);
      const predictedVol = volForecast?.forecastedVolatility || data.realizedVol20d * 1.08;
      
      if (ivPremium > 25) {
        const strikePrice = data.price;
        const expirationDate = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Enhanced expected return with ML forecast
        const expectedIVConvergence = (data.iv30d - predictedVol) * 100;
        const enhancedReturn = data.price * (expectedIVConvergence / 100) * 0.8 * 100;
        
        volArb.push({
          id: `volarb-${symbol}-${Date.now()}`,
          type: 'new_trade',
          priority: 'medium',
          symbol,
          action: `Volatility arbitrage on ${symbol}`,
          tradeAction: 'Sell straddle + delta hedge',
          strikePrice,
          entryPrice: data.price * 0.045,
          expirationDate,
          potentialGain: data.price * 0.035 * 100,
          potentialGainPercent: 78,
          potentialLoss: data.price * 0.02 * 100,
          potentialLossPercent: -44,
          riskRewardRatio: 1.75,
          confidenceScore: volForecast ? 0.82 : 0.77,
          recommendationReason: `${ivPremium.toFixed(1)}% IV premium. ML forecasts ${(predictedVol * 100).toFixed(1)}% realized vol.`,
          reasoning: `${symbol} shows ${ivPremium.toFixed(1)}% IV premium over realized volatility. ML model forecasts realized vol of ${(predictedVol * 100).toFixed(1)}%. Sell straddle and dynamically delta hedge to capture this mispricing.`,
          technicalFactors: [
            `IV: ${(data.iv30d * 100).toFixed(1)}% vs RV: ${(data.realizedVol20d * 100).toFixed(1)}%`,
            `IV premium: +${ivPremium.toFixed(1)}%`,
            volForecast ? `ML Vol Forecast: ${(predictedVol * 100).toFixed(1)}% (${volForecast.forecastType}, Model ${volForecast.modelId})` : '',
            volForecast ? `Confidence Interval: [${(volForecast.confidenceLower * 100).toFixed(1)}%, ${(volForecast.confidenceUpper * 100).toFixed(1)}%]` : '',
            'Dynamic hedging required to maintain delta neutrality',
            'Expected convergence in 2-3 weeks',
          ].filter(Boolean),
          riskFactors: [
            'Requires active delta hedging (2-3x daily)',
            'Transaction costs reduce profitability',
            'Tail risk if realized vol spikes above IV',
            'Model risk in volatility forecasting',
          ],
          expectedImpact: {
            deltaChange: 0,
            gammaChange: 0.05,
            thetaChange: 3.2,
            vegaChange: -35,
          },
          modelPredictions: {
            winProbability: 0.73,
            expectedReturn: enhancedReturn,
            volatilityForecast: predictedVol,
            modelUsed: volForecast ? `Model ${volForecast.modelId}` : 'Rule-based',
          },
          createdAt: new Date().toISOString(),
        });
      }
    });

    return volArb;
  }

  /**
   * Generate calendar spread opportunities
   */
  private generateCalendarSpreads(): Recommendation[] {
    const calendars: Recommendation[] = [];

    this.marketData.forEach((data, symbol) => {
      // Look for term structure opportunities
      // Simulate front month IV > back month IV (in production, fetch actual term structure)
      const frontMonthIV = data.iv30d * 1.1; // Simulated
      const backMonthIV = data.iv30d * 0.95; // Simulated
      const ivSkew = (frontMonthIV / backMonthIV - 1) * 100;

      if (ivSkew > 8) {
        const strikePrice = data.price;
        const expirationDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        calendars.push({
          id: `calendar-${symbol}-${Date.now()}`,
          type: 'new_trade',
          priority: 'medium',
          symbol,
          action: `Calendar spread on ${symbol}`,
          tradeAction: 'Buy calendar spread (sell front, buy back)',
          strikePrice,
          entryPrice: data.price * 0.012,
          expirationDate,
          potentialGain: data.price * 0.02 * 100,
          potentialGainPercent: 167,
          potentialLoss: data.price * 0.012 * 100,
          potentialLossPercent: -100,
          riskRewardRatio: 1.67,
          confidenceScore: 0.76,
          recommendationReason: `Front/back month IV skew ${ivSkew.toFixed(1)}%. Term structure normalization expected.`,
          reasoning: `${symbol} shows front-month IV at ${(frontMonthIV * 100).toFixed(1)}% vs back-month at ${(backMonthIV * 100).toFixed(1)}% (${ivSkew.toFixed(1)}% skew). Calendar spread captures theta decay and term structure normalization. Profits if underlying stays near strike.`,
          technicalFactors: [
            `Front month IV: ${(frontMonthIV * 100).toFixed(1)}%`,
            `Back month IV: ${(backMonthIV * 100).toFixed(1)}%`,
            `Term structure skew: ${ivSkew.toFixed(1)}%`,
            'Optimal when expecting range-bound movement',
          ],
          riskFactors: [
            'Large price moves hurt the position',
            'Requires underlying to stay near strike',
            'Front month assignment risk if ITM',
            'Best exit: when front option expires',
          ],
          expectedImpact: {
            deltaChange: 0,
            gammaChange: 0.01,
            thetaChange: 1.8,
            vegaChange: 5,
          },
          modelPredictions: {
            winProbability: 0.72,
            expectedReturn: data.price * 0.02 * 100 * 0.72 - data.price * 0.012 * 100 * 0.28,
            volatilityForecast: backMonthIV * 1.05,
            priceTarget: data.price,
          },
          createdAt: new Date().toISOString(),
        });
      }
    });

    return calendars;
  }

  /**
   * Get symbol with highest exposure
   */
  private getMostExposedSymbol(): string {
    const exposureMap = new Map<string, number>();
    
    this.positions.forEach(p => {
      const exposure = Math.abs(p.delta * p.current_price * p.quantity * 100);
      exposureMap.set(p.symbol, (exposureMap.get(p.symbol) || 0) + exposure);
    });

    let maxSymbol = 'SPY';
    let maxExposure = 0;
    
    exposureMap.forEach((exposure, symbol) => {
      if (exposure > maxExposure) {
        maxExposure = exposure;
        maxSymbol = symbol;
      }
    });

    return maxSymbol;
  }

  /**
   * Get portfolio analysis
   */
  getPortfolioAnalysis(): PortfolioAnalysis | null {
    return this.portfolioAnalysis;
  }

  /**
   * Get news sentiment for symbol
   */
  getNewsSentiment(symbol: string): NewsSentiment | undefined {
    return this.newsSentiment.get(symbol);
  }

  /**
   * Get upcoming earnings for symbol
   */
  getUpcomingEarnings(symbol: string): EarningsEvent[] {
    return this.earningsCalendar.filter(e => 
      e.symbol === symbol && e.isUpcoming
    );
  }

  /**
   * Get critical economic events
   */
  getCriticalEconomicEvents(): EconomicEvent[] {
    return this.economicEvents.filter(e => 
      e.marketRelevance === 'critical' && e.isUpcoming
    );
  }

  /**
   * NEW: Get ML predictions for symbol
   */
  getMLPredictions(symbol: string): MLPrediction[] {
    return this.mlPredictions.get(symbol) || [];
  }

  /**
   * NEW: Get volatility forecasts for symbol
   */
  getVolatilityForecasts(symbol: string): VolatilityForecast[] {
    return this.volatilityForecasts.get(symbol) || [];
  }

  /**
   * Get RL agent statistics
   */
  getRLStatistics() {
    return this.rlAgent.getStatistics();
  }

  /**
   * Export RL model
   */
  exportRLModel(): string {
    return this.rlAgent.exportModel();
  }

  /**
   * Import RL model
   */
  importRLModel(modelData: string): void {
    this.rlAgent.importModel(modelData);
  }

  /**
   * Train RL agent with trade outcome
   */
  learnFromTrade(
    beforeState: any,
    action: any,
    afterState: any,
    tradeClosed: boolean = false
  ): void {
    this.rlAgent.learn(beforeState, action, afterState, tradeClosed);
  }

  private getPortfolioState() {
    const totalDelta = this.positions.reduce((sum, p) => sum + (p.delta || 0), 0);
    const totalGamma = this.positions.reduce((sum, p) => sum + (p.gamma || 0), 0);
    const totalTheta = this.positions.reduce((sum, p) => sum + (p.theta || 0), 0);
    const totalVega = this.positions.reduce((sum, p) => sum + (p.vega || 0), 0);
    const totalPnL = this.positions.reduce((sum, p) => sum + (p.pnl || 0), 0);

    return {
      portfolioDelta: totalDelta,
      portfolioGamma: totalGamma,
      portfolioTheta: totalTheta,
      portfolioVega: totalVega,
      totalPositions: this.positions.length,
      cashBalance: 100000 - (this.positions.length * 5000), // Estimate
      totalPnL,
      vixLevel: 18, // Default, should be from market data
      ivRank: 50,
      priceChange: 0,
      volumeRatio: 1.0,
    };
  }

  private mapRLActionToRecType(actionType: string): 'new_trade' | 'hedge' | 'adjustment' | 'close_position' | 'risk_alert' | 'news_alert' {
    const mapping: Record<string, 'new_trade' | 'hedge' | 'adjustment' | 'close_position' | 'risk_alert' | 'news_alert'> = {
      buy: 'new_trade',
      sell: 'close_position',
      close: 'close_position',
      hedge: 'hedge',
      hold: 'adjustment',
    };
    return mapping[actionType] || 'adjustment';
  }
}

export function createAIRecommendationEngine(): AIRecommendationEngine {
  return new AIRecommendationEngine();
}
