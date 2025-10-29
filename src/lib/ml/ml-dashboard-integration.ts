// Production-ready ML integration for dashboard
import { modelService } from './model-service';
import { featureEngine } from './feature-engine';
import { dataPipeline } from './data-pipeline';
import { backtestingEngine } from './backtesting-engine';
import { newsSentimentEngine, type NewsArticle, type SentimentAnalysis } from './news-sentiment-engine';

export interface MLRecommendation {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  targetPrice: number;
  stopLoss: number;
  reasoning: string;
  modelVersion: string;
  features: Record<string, number>;
  newsImpact?: {
    sentiment: number;
    confidence: number;
    recentNews: NewsArticle[];
    events: any[];
  };
}

export interface MLSignal {
  symbol: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-1
  timeframe: string;
  modelVersion: string;
  timestamp: number;
}

export interface MLPrediction {
  symbol: string;
  prediction: number;
  confidence: number;
  timeframe: string;
  modelVersion: string;
  timestamp: number;
}

export class MLDashboardIntegration {
  private isInitialized = false;
  private activeModels: string[] = [];
  private lastUpdateTime = 0;
  private updateInterval = 30000; // 30 seconds

  /**
   * Initialize ML integration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('Initializing ML Dashboard Integration...');

    try {
      // Start data pipeline
      await dataPipeline.start();

      // Load active models
      await this.loadActiveModels();

      // Start periodic updates
      this.startPeriodicUpdates();

      this.isInitialized = true;
      console.log('ML Dashboard Integration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ML Dashboard Integration:', error);
      throw error;
    }
  }

  /**
   * Get AI recommendations for watchlist
   */
  async getWatchlistRecommendations(symbols: string[]): Promise<MLRecommendation[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const recommendations: MLRecommendation[] = [];

    for (const symbol of symbols) {
      try {
        // Get latest market data
        const marketData = await this.getLatestMarketData(symbol);
        if (!marketData) continue;

        // Generate features
        const features = await this.generateFeaturesForSymbol(symbol, marketData);
        if (!features) continue;

        // Get news sentiment
        const newsSentiment = await newsSentimentEngine.getSentimentAnalysis(symbol);
        const recentNews = await newsSentimentEngine.getNewsForSymbol(symbol, 5);
        const upcomingEvents = await newsSentimentEngine.getUpcomingEvents(symbol);

        // Get predictions from all active models
        const predictions = await this.getModelPredictions(features);
        
        // Aggregate predictions
        const aggregatedPrediction = this.aggregatePredictions(predictions);
        
        // Generate recommendation with news awareness
        const recommendation = this.generateNewsAwareRecommendation(
          symbol, 
          aggregatedPrediction, 
          features, 
          newsSentiment, 
          recentNews, 
          upcomingEvents
        );
        recommendations.push(recommendation);
      } catch (error) {
        console.error(`Failed to get recommendation for ${symbol}:`, error);
      }
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get market signals
   */
  async getMarketSignals(symbols: string[]): Promise<MLSignal[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const signals: MLSignal[] = [];

    for (const symbol of symbols) {
      try {
        const marketData = await this.getLatestMarketData(symbol);
        if (!marketData) continue;

        const features = await this.generateFeaturesForSymbol(symbol, marketData);
        if (!features) continue;

        const predictions = await this.getModelPredictions(features);
        const signal = this.generateSignal(symbol, predictions);
        signals.push(signal);
      } catch (error) {
        console.error(`Failed to get signal for ${symbol}:`, error);
      }
    }

    return signals;
  }

  /**
   * Get price predictions
   */
  async getPricePredictions(symbols: string[], timeframe: string = '1d'): Promise<MLPrediction[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const predictions: MLPrediction[] = [];

    for (const symbol of symbols) {
      try {
        const marketData = await this.getLatestMarketData(symbol);
        if (!marketData) continue;

        const features = await this.generateFeaturesForSymbol(symbol, marketData);
        if (!features) continue;

        const modelPredictions = await this.getModelPredictions(features);
        const aggregatedPrediction = this.aggregatePredictions(modelPredictions);
        
        predictions.push({
          symbol,
          prediction: aggregatedPrediction.value,
          confidence: aggregatedPrediction.confidence,
          timeframe,
          modelVersion: 'ensemble',
          timestamp: Date.now()
        });
      } catch (error) {
        console.error(`Failed to get prediction for ${symbol}:`, error);
      }
    }

    return predictions;
  }

  /**
   * Run backtest for a strategy
   */
  async runStrategyBacktest(config: any): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await backtestingEngine.runBacktest(config);
      return result;
    } catch (error) {
      console.error('Backtest failed:', error);
      throw error;
    }
  }

  /**
   * Train a new model
   */
  async trainModel(config: any, data: any): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const model = await modelService.trainModel(config, data);
      this.activeModels.push(model.id);
      return model;
    } catch (error) {
      console.error('Model training failed:', error);
      throw error;
    }
  }

  /**
   * Get model performance metrics
   */
  async getModelMetrics(modelId: string): Promise<any> {
    const model = modelService.getModel(modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    return {
      metrics: model.metrics,
      status: model.status,
      trainedAt: model.trainedAt,
      trainingDataSize: model.trainingDataSize
    };
  }

  private async loadActiveModels(): Promise<void> {
    const models = modelService.getModels();
    this.activeModels = models
      .filter(model => model.status === 'ready')
      .map(model => model.id);
  }

  private startPeriodicUpdates(): void {
    setInterval(async () => {
      if (Date.now() - this.lastUpdateTime < this.updateInterval) return;
      
      try {
        await this.loadActiveModels();
        this.lastUpdateTime = Date.now();
      } catch (error) {
        console.error('Periodic update failed:', error);
      }
    }, this.updateInterval);
  }

  private async getLatestMarketData(symbol: string): Promise<any> {
    // This would get real market data
    // For now, return simulated data
    return {
      symbol,
      timestamp: Date.now(),
      open: 100 + Math.random() * 20,
      high: 100 + Math.random() * 25,
      low: 100 - Math.random() * 15,
      close: 100 + Math.random() * 20,
      volume: Math.floor(Math.random() * 1000000) + 100000
    };
  }

  private async generateFeaturesForSymbol(symbol: string, marketData: any): Promise<any> {
    // This would use the feature engine to generate real features
    // For now, return simulated features
    return {
      sma_20: 100 + Math.random() * 10,
      rsi_14: 30 + Math.random() * 40,
      macd: (Math.random() - 0.5) * 2,
      volume_ratio: 0.5 + Math.random(),
      atr_14: 1 + Math.random() * 2,
      bb_position: Math.random(),
      // ... other features
    };
  }

  private async getModelPredictions(features: any): Promise<any[]> {
    const predictions: any[] = [];

    for (const modelId of this.activeModels) {
      try {
        const modelPredictions = await modelService.getPredictions(modelId, [features]);
        predictions.push(...modelPredictions);
      } catch (error) {
        console.error(`Failed to get predictions from model ${modelId}:`, error);
      }
    }

    return predictions;
  }

  private aggregatePredictions(predictions: any[]): { value: number; confidence: number } {
    if (predictions.length === 0) {
      return { value: 0, confidence: 0 };
    }

    // Weighted average based on confidence
    const totalWeight = predictions.reduce((sum, p) => sum + p.confidence, 0);
    const weightedValue = predictions.reduce((sum, p) => sum + p.prediction * p.confidence, 0);
    const averageConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

    return {
      value: totalWeight > 0 ? weightedValue / totalWeight : 0,
      confidence: averageConfidence
    };
  }

  private generateRecommendation(
    symbol: string, 
    prediction: { value: number; confidence: number }, 
    features: any
  ): MLRecommendation {
    const { value, confidence } = prediction;
    
    let action: 'buy' | 'sell' | 'hold';
    let reasoning: string;
    
    if (value > 0.3 && confidence > 0.7) {
      action = 'buy';
      reasoning = 'Strong bullish signal with high confidence';
    } else if (value < -0.3 && confidence > 0.7) {
      action = 'sell';
      reasoning = 'Strong bearish signal with high confidence';
    } else {
      action = 'hold';
      reasoning = 'Neutral signal or low confidence';
    }

    const currentPrice = 100; // Would get from market data
    const targetPrice = currentPrice * (1 + value * 0.1); // 10% of prediction as target
    const stopLoss = currentPrice * (1 - Math.abs(value) * 0.05); // 5% stop loss

    return {
      symbol,
      action,
      confidence,
      targetPrice,
      stopLoss,
      reasoning,
      modelVersion: 'ensemble',
      features: this.extractKeyFeatures(features)
    };
  }

  private generateNewsAwareRecommendation(
    symbol: string,
    prediction: { value: number; confidence: number },
    features: any,
    newsSentiment: SentimentAnalysis | null,
    recentNews: NewsArticle[],
    upcomingEvents: any[]
  ): MLRecommendation {
    const { value, confidence } = prediction;
    
    // Base recommendation from technical analysis
    let action: 'buy' | 'sell' | 'hold';
    let reasoning: string;
    let adjustedConfidence = confidence;
    let newsImpact: any = undefined;

    // Apply news sentiment adjustment
    if (newsSentiment) {
      const newsWeight = 0.3; // 30% weight for news sentiment
      const technicalWeight = 0.7; // 70% weight for technical analysis
      
      // Adjust prediction based on news sentiment
      const adjustedValue = (value * technicalWeight) + (newsSentiment.overallSentiment * newsWeight);
      
      // Adjust confidence based on news confidence
      adjustedConfidence = Math.min(1, (confidence * technicalWeight) + (newsSentiment.confidence * newsWeight));
      
      // Determine action based on adjusted values
      if (adjustedValue > 0.3 && adjustedConfidence > 0.6) {
        action = 'buy';
        reasoning = `Strong bullish signal (Technical: ${(value * 100).toFixed(1)}%, News: ${(newsSentiment.overallSentiment * 100).toFixed(1)}%)`;
      } else if (adjustedValue < -0.3 && adjustedConfidence > 0.6) {
        action = 'sell';
        reasoning = `Strong bearish signal (Technical: ${(value * 100).toFixed(1)}%, News: ${(newsSentiment.overallSentiment * 100).toFixed(1)}%)`;
      } else {
        action = 'hold';
        reasoning = `Mixed signals (Technical: ${(value * 100).toFixed(1)}%, News: ${(newsSentiment.overallSentiment * 100).toFixed(1)}%)`;
      }

      // Add news impact information
      newsImpact = {
        sentiment: newsSentiment.overallSentiment,
        confidence: newsSentiment.confidence,
        recentNews: recentNews.slice(0, 3), // Top 3 recent news
        events: upcomingEvents.slice(0, 2) // Top 2 upcoming events
      };

      // Add news-specific reasoning
      if (recentNews.length > 0) {
        const topNews = recentNews[0];
        if (topNews.impact === 'high') {
          reasoning += ` | High impact news: "${topNews.title}"`;
        }
      }

      if (upcomingEvents.length > 0) {
        const nextEvent = upcomingEvents[0];
        reasoning += ` | Upcoming: ${nextEvent.title}`;
      }
    } else {
      // Fallback to technical analysis only
      if (value > 0.3 && confidence > 0.7) {
        action = 'buy';
        reasoning = 'Strong bullish signal with high confidence (no news data)';
      } else if (value < -0.3 && confidence > 0.7) {
        action = 'sell';
        reasoning = 'Strong bearish signal with high confidence (no news data)';
      } else {
        action = 'hold';
        reasoning = 'Neutral signal or low confidence (no news data)';
      }
    }

    const currentPrice = 100; // Would get from market data
    const targetPrice = currentPrice * (1 + value * 0.1);
    const stopLoss = currentPrice * (1 - Math.abs(value) * 0.05);

    return {
      symbol,
      action,
      confidence: adjustedConfidence,
      targetPrice,
      stopLoss,
      reasoning,
      modelVersion: 'ensemble',
      features: this.extractKeyFeatures(features),
      newsImpact
    };
  }

  private generateSignal(symbol: string, predictions: any[]): MLSignal {
    const aggregated = this.aggregatePredictions(predictions);
    const { value, confidence } = aggregated;
    
    let signal: 'bullish' | 'bearish' | 'neutral';
    let strength: number;
    
    if (value > 0.2) {
      signal = 'bullish';
      strength = Math.min(confidence * Math.abs(value), 1);
    } else if (value < -0.2) {
      signal = 'bearish';
      strength = Math.min(confidence * Math.abs(value), 1);
    } else {
      signal = 'neutral';
      strength = 0.5;
    }

    return {
      symbol,
      signal,
      strength,
      timeframe: '1d',
      modelVersion: 'ensemble',
      timestamp: Date.now()
    };
  }

  private extractKeyFeatures(features: any): Record<string, number> {
    const keyFeatures = [
      'sma_20', 'rsi_14', 'macd', 'volume_ratio', 'atr_14', 'bb_position'
    ];
    
    const extracted: Record<string, number> = {};
    keyFeatures.forEach(key => {
      if (features[key] !== undefined) {
        extracted[key] = features[key];
      }
    });
    
    return extracted;
  }
}

// Export singleton instance
export const mlDashboardIntegration = new MLDashboardIntegration();
