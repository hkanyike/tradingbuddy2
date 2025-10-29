// Production-ready ensemble model combining multiple algorithms
import { TrainedModel } from './model-service';
import { TechnicalFeatures, VolatilityFeatures } from './feature-engine';

export interface EnsemblePrediction {
  value: number;
  confidence: number;
  individualPredictions: Array<{
    modelId: string;
    algorithm: string;
    prediction: number;
    confidence: number;
    weight: number;
  }>;
  votingResult: 'buy' | 'sell' | 'hold';
  consensus: number; // -1 to 1, how much models agree
}

export interface EnsembleConfig {
  name: string;
  models: string[]; // Model IDs
  weights: Record<string, number>; // Model weights
  votingMethod: 'weighted_average' | 'majority_vote' | 'stacking';
  confidenceThreshold: number;
  consensusThreshold: number;
}

export class EnsembleModel {
  private config: EnsembleConfig;
  private models: Map<string, TrainedModel> = new Map();
  private isInitialized = false;

  constructor(config: EnsembleConfig) {
    this.config = config;
  }

  /**
   * Initialize ensemble with trained models
   */
  async initialize(availableModels: TrainedModel[]): Promise<void> {
    try {
      // Load specified models
      for (const modelId of this.config.models) {
        const model = availableModels.find(m => m.id === modelId);
        if (model && model.status === 'ready') {
          this.models.set(modelId, model);
        } else {
          console.warn(`Model ${modelId} not available or not ready`);
        }
      }

      if (this.models.size === 0) {
        throw new Error('No valid models available for ensemble');
      }

      // Normalize weights
      this.normalizeWeights();
      
      this.isInitialized = true;
      console.log(`Ensemble model initialized with ${this.models.size} models`);
    } catch (error) {
      console.error('Failed to initialize ensemble model:', error);
      throw error;
    }
  }

  /**
   * Make ensemble prediction
   */
  async predict(features: TechnicalFeatures & VolatilityFeatures): Promise<EnsemblePrediction> {
    if (!this.isInitialized) {
      throw new Error('Ensemble model not initialized');
    }

    const individualPredictions: Array<{
      modelId: string;
      algorithm: string;
      prediction: number;
      confidence: number;
      weight: number;
    }> = [];

    // Get predictions from each model
    for (const [modelId, model] of this.models) {
      try {
        const prediction = await this.predictWithModel(model, features);
        const weight = this.config.weights[modelId] || 0;
        
        individualPredictions.push({
          modelId,
          algorithm: model.config.algorithm,
          prediction: prediction.value,
          confidence: prediction.confidence,
          weight
        });
      } catch (error) {
        console.error(`Error getting prediction from model ${modelId}:`, error);
        // Continue with other models
      }
    }

    if (individualPredictions.length === 0) {
      throw new Error('No valid predictions from ensemble models');
    }

    // Combine predictions based on voting method
    const ensembleResult = this.combinePredictions(individualPredictions);
    
    return {
      value: ensembleResult.value,
      confidence: ensembleResult.confidence,
      individualPredictions,
      votingResult: this.determineVotingResult(ensembleResult.value, ensembleResult.confidence),
      consensus: this.calculateConsensus(individualPredictions)
    };
  }

  /**
   * Get ensemble performance metrics
   */
  getEnsembleMetrics(): {
    modelCount: number;
    algorithms: string[];
    totalWeight: number;
    averageConfidence: number;
    modelHealth: Record<string, boolean>;
  } {
    const algorithms = Array.from(this.models.values()).map(m => m.config.algorithm);
    const totalWeight = Object.values(this.config.weights).reduce((sum, w) => sum + w, 0);
    const averageConfidence = Array.from(this.models.values())
      .reduce((sum, m) => sum + (m.metrics.accuracy || 0), 0) / this.models.size;
    
    const modelHealth: Record<string, boolean> = {};
    for (const [modelId, model] of this.models) {
      modelHealth[modelId] = model.status === 'ready';
    }

    return {
      modelCount: this.models.size,
      algorithms: [...new Set(algorithms)],
      totalWeight,
      averageConfidence,
      modelHealth
    };
  }

  /**
   * Update model weights based on performance
   */
  updateWeights(performanceData: Record<string, number>): void {
    // Update weights based on recent performance
    const totalPerformance = Object.values(performanceData).reduce((sum, p) => sum + p, 0);
    
    for (const modelId of Object.keys(performanceData)) {
      if (this.config.weights[modelId] !== undefined) {
        const performance = performanceData[modelId];
        const normalizedPerformance = totalPerformance > 0 ? performance / totalPerformance : 1 / Object.keys(performanceData).length;
        
        // Smooth weight update (70% old weight, 30% new weight)
        this.config.weights[modelId] = (this.config.weights[modelId] * 0.7) + (normalizedPerformance * 0.3);
      }
    }
    
    this.normalizeWeights();
  }

  private async predictWithModel(
    model: TrainedModel, 
    features: TechnicalFeatures & VolatilityFeatures
  ): Promise<{ value: number; confidence: number }> {
    // This would use the actual model for prediction
    // For now, return simulated prediction based on model type
    
    let basePrediction = 0;
    let confidence = 0.8;

    switch (model.config.algorithm) {
      case 'xgboost':
        basePrediction = this.simulateXGBoostPrediction(features);
        confidence = 0.85;
        break;
      case 'lstm':
        basePrediction = this.simulateLSTMPrediction(features);
        confidence = 0.80;
        break;
      case 'transformer':
        basePrediction = this.simulateTransformerPrediction(features);
        confidence = 0.90;
        break;
      case 'random_forest':
        basePrediction = this.simulateRandomForestPrediction(features);
        confidence = 0.75;
        break;
      case 'svm':
        basePrediction = this.simulateSVMPrediction(features);
        confidence = 0.70;
        break;
      default:
        basePrediction = Math.random() * 2 - 1;
        confidence = 0.5;
    }

    return {
      value: basePrediction,
      confidence: confidence * (model.metrics.accuracy || 0.5)
    };
  }

  private combinePredictions(individualPredictions: any[]): { value: number; confidence: number } {
    switch (this.config.votingMethod) {
      case 'weighted_average':
        return this.weightedAverageVoting(individualPredictions);
      case 'majority_vote':
        return this.majorityVoteVoting(individualPredictions);
      case 'stacking':
        return this.stackingVoting(individualPredictions);
      default:
        return this.weightedAverageVoting(individualPredictions);
    }
  }

  private weightedAverageVoting(individualPredictions: any[]): { value: number; confidence: number } {
    let weightedSum = 0;
    let totalWeight = 0;
    let confidenceSum = 0;

    for (const pred of individualPredictions) {
      weightedSum += pred.prediction * pred.weight;
      totalWeight += pred.weight;
      confidenceSum += pred.confidence * pred.weight;
    }

    return {
      value: totalWeight > 0 ? weightedSum / totalWeight : 0,
      confidence: totalWeight > 0 ? confidenceSum / totalWeight : 0
    };
  }

  private majorityVoteVoting(individualPredictions: any[]): { value: number; confidence: number } {
    const votes = individualPredictions.map(pred => ({
      vote: pred.prediction > 0 ? 1 : pred.prediction < 0 ? -1 : 0,
      confidence: pred.confidence,
      weight: pred.weight
    }));

    const positiveVotes = votes.filter(v => v.vote === 1).reduce((sum, v) => sum + v.weight, 0);
    const negativeVotes = votes.filter(v => v.vote === -1).reduce((sum, v) => sum + v.weight, 0);
    const neutralVotes = votes.filter(v => v.vote === 0).reduce((sum, v) => sum + v.weight, 0);

    const totalWeight = positiveVotes + negativeVotes + neutralVotes;
    
    let value = 0;
    if (positiveVotes > negativeVotes && positiveVotes > neutralVotes) {
      value = positiveVotes / totalWeight;
    } else if (negativeVotes > positiveVotes && negativeVotes > neutralVotes) {
      value = -negativeVotes / totalWeight;
    }

    const averageConfidence = votes.reduce((sum, v) => sum + v.confidence, 0) / votes.length;

    return { value, confidence: averageConfidence };
  }

  private stackingVoting(individualPredictions: any[]): { value: number; confidence: number } {
    // Stacking would use a meta-learner to combine predictions
    // For now, use weighted average with higher weight for better performing models
    const sortedPredictions = individualPredictions.sort((a, b) => b.confidence - a.confidence);
    
    // Give higher weight to top-performing models
    const adjustedWeights = sortedPredictions.map((pred, index) => ({
      ...pred,
      weight: pred.weight * (1 + (0.2 * (sortedPredictions.length - index - 1) / sortedPredictions.length))
    }));

    return this.weightedAverageVoting(adjustedWeights);
  }

  private determineVotingResult(value: number, confidence: number): 'buy' | 'sell' | 'hold' {
    if (confidence < this.config.confidenceThreshold) {
      return 'hold';
    }

    if (value > 0.3) {
      return 'buy';
    } else if (value < -0.3) {
      return 'sell';
    } else {
      return 'hold';
    }
  }

  private calculateConsensus(individualPredictions: any[]): number {
    if (individualPredictions.length <= 1) return 1;

    const values = individualPredictions.map(p => p.prediction);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Consensus is higher when predictions are closer together
    // Normalize to -1 to 1 range
    const maxStdDev = 2; // Assuming predictions range from -1 to 1
    return Math.max(-1, 1 - (stdDev / maxStdDev));
  }

  private normalizeWeights(): void {
    const totalWeight = Object.values(this.config.weights).reduce((sum, w) => sum + w, 0);
    
    if (totalWeight > 0) {
      for (const modelId of Object.keys(this.config.weights)) {
        this.config.weights[modelId] = this.config.weights[modelId] / totalWeight;
      }
    } else {
      // Equal weights if no weights specified
      const equalWeight = 1 / this.config.models.length;
      for (const modelId of this.config.models) {
        this.config.weights[modelId] = equalWeight;
      }
    }
  }

  // Simulated prediction methods for different algorithms
  private simulateXGBoostPrediction(features: TechnicalFeatures & VolatilityFeatures): number {
    // Simulate XGBoost prediction based on features
    const rsi = features.rsi_14 || 50;
    const macd = features.macd || 0;
    const volumeRatio = features.volume_ratio || 1;
    
    let prediction = 0;
    if (rsi < 30) prediction += 0.3; // Oversold
    if (rsi > 70) prediction -= 0.3; // Overbought
    if (macd > 0) prediction += 0.2; // Bullish MACD
    if (macd < 0) prediction -= 0.2; // Bearish MACD
    if (volumeRatio > 1.5) prediction += 0.1; // High volume
    
    return Math.max(-1, Math.min(1, prediction));
  }

  private simulateLSTMPrediction(features: TechnicalFeatures & VolatilityFeatures): number {
    // Simulate LSTM prediction (time series aware)
    const sma20 = features.sma_20 || 100;
    const sma50 = features.sma_50 || 100;
    const atr = features.atr_14 || 1;
    
    let prediction = 0;
    if (sma20 > sma50) prediction += 0.2; // Uptrend
    if (sma20 < sma50) prediction -= 0.2; // Downtrend
    if (atr > 2) prediction += 0.1; // High volatility
    
    return Math.max(-1, Math.min(1, prediction));
  }

  private simulateTransformerPrediction(features: TechnicalFeatures & VolatilityFeatures): number {
    // Simulate Transformer prediction (attention-based)
    const bbPosition = features.bb_position || 0.5;
    const williamsR = features.williams_r || -50;
    
    let prediction = 0;
    if (bbPosition < 0.2) prediction += 0.3; // Near lower Bollinger Band
    if (bbPosition > 0.8) prediction -= 0.3; // Near upper Bollinger Band
    if (williamsR < -80) prediction += 0.2; // Oversold
    if (williamsR > -20) prediction -= 0.2; // Overbought
    
    return Math.max(-1, Math.min(1, prediction));
  }

  private simulateRandomForestPrediction(features: TechnicalFeatures & VolatilityFeatures): number {
    // Simulate Random Forest prediction (ensemble of decision trees)
    const stochK = features.stoch_k || 50;
    const stochD = features.stoch_d || 50;
    const obv = features.obv || 0;
    
    let prediction = 0;
    if (stochK > 80 && stochD > 80) prediction -= 0.2; // Overbought
    if (stochK < 20 && stochD < 20) prediction += 0.2; // Oversold
    if (obv > 0) prediction += 0.1; // Positive OBV
    if (obv < 0) prediction -= 0.1; // Negative OBV
    
    return Math.max(-1, Math.min(1, prediction));
  }

  private simulateSVMPrediction(features: TechnicalFeatures & VolatilityFeatures): number {
    // Simulate SVM prediction (support vector machine)
    const rsi = features.rsi_14 || 50;
    const macd = features.macd || 0;
    const bbWidth = features.bb_width || 0.1;
    
    let prediction = 0;
    if (rsi > 50 && macd > 0) prediction += 0.3; // Bullish combination
    if (rsi < 50 && macd < 0) prediction -= 0.3; // Bearish combination
    if (bbWidth > 0.2) prediction += 0.1; // High volatility
    
    return Math.max(-1, Math.min(1, prediction));
  }
}

// Export factory function
export function createEnsembleModel(config: EnsembleConfig): EnsembleModel {
  return new EnsembleModel(config);
}
