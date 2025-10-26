/**
 * Reinforcement Learning Agent for Options Trading
 * 
 * Uses Q-Learning with experience replay for:
 * - Position sizing decisions
 * - Entry/exit timing
 * - Hedging actions
 * 
 * State: Portfolio Greeks, market conditions, IV metrics
 * Actions: Trade/Hold/Hedge with position sizes
 * Rewards: Risk-adjusted returns with transaction costs
 */

interface RLState {
  // Portfolio state
  portfolioDelta: number;
  portfolioGamma: number;
  portfolioTheta: number;
  portfolioVega: number;
  totalPositions: number;
  cashBalance: number;
  totalPnL: number;
  
  // Market state
  vixLevel: number;
  ivRank: number;
  priceChange: number;
  volumeRatio: number;
  
  // Position-specific
  positionDelta?: number;
  positionSize?: number;
  daysToExpiration?: number;
  profitPercent?: number;
}

interface RLAction {
  type: 'buy' | 'sell' | 'hold' | 'hedge' | 'close';
  sizePercent: number; // 0-100, percent of available capital
  symbol?: string;
}

interface Experience {
  state: RLState;
  action: RLAction;
  reward: number;
  nextState: RLState;
  done: boolean;
}

interface QValue {
  actionKey: string;
  value: number;
  visits: number;
}

export class ReinforcementLearningAgent {
  private qTable: Map<string, Map<string, QValue>>;
  private experienceBuffer: Experience[];
  private readonly bufferSize = 10000;
  private readonly batchSize = 32;
  
  // Hyperparameters
  private learningRate = 0.001;
  private discountFactor = 0.95;
  private epsilon = 0.1; // Exploration rate
  private epsilonDecay = 0.995;
  private epsilonMin = 0.01;
  
  // Reward shaping parameters
  private readonly profitWeight = 1.0;
  private readonly riskPenalty = 0.5;
  private readonly transactionCost = 0.01; // 1% per trade
  private readonly maxDrawdownPenalty = 2.0;
  
  // Risk constraints
  private readonly maxPositionSize = 0.25; // Max 25% per position
  private readonly maxPortfolioDelta = 100;
  private readonly maxTotalRisk = 10000; // Max $10k at risk

  constructor() {
    this.qTable = new Map();
    this.experienceBuffer = [];
  }

  /**
   * Discretize continuous state into bins for Q-table lookup
   */
  private discretizeState(state: RLState): string {
    const bins = {
      delta: this.binValue(state.portfolioDelta, -200, 200, 10),
      gamma: this.binValue(state.portfolioGamma, -50, 50, 5),
      theta: this.binValue(state.portfolioTheta, -500, 0, 10),
      vega: this.binValue(state.portfolioVega, -100, 100, 10),
      positions: this.binValue(state.totalPositions, 0, 20, 5),
      vix: this.binValue(state.vixLevel, 10, 50, 8),
      ivRank: this.binValue(state.ivRank, 0, 100, 10),
      pnl: this.binValue(state.totalPnL / 1000, -50, 50, 10),
    };
    
    return JSON.stringify(bins);
  }

  private binValue(value: number, min: number, max: number, numBins: number): number {
    const clipped = Math.max(min, Math.min(max, value));
    const binSize = (max - min) / numBins;
    return Math.floor((clipped - min) / binSize);
  }

  /**
   * Serialize action for Q-table storage
   */
  private actionToKey(action: RLAction): string {
    return `${action.type}_${Math.round(action.sizePercent / 10) * 10}`;
  }

  /**
   * Get all possible actions
   */
  private getPossibleActions(state: RLState): RLAction[] {
    const actions: RLAction[] = [];
    const sizeSteps = [10, 25, 50, 75, 100];
    
    // Always can hold
    actions.push({ type: 'hold', sizePercent: 0 });
    
    // Buy actions (if we have cash and room for positions)
    if (state.cashBalance > 1000 && state.totalPositions < 10) {
      for (const size of sizeSteps) {
        actions.push({ type: 'buy', sizePercent: size * this.maxPositionSize });
      }
    }
    
    // Sell/close actions (if we have positions)
    if (state.totalPositions > 0) {
      for (const size of sizeSteps) {
        actions.push({ type: 'sell', sizePercent: size });
        actions.push({ type: 'close', sizePercent: size });
      }
    }
    
    // Hedge actions (if delta is significant)
    if (Math.abs(state.portfolioDelta) > 20) {
      actions.push({ type: 'hedge', sizePercent: 50 });
      actions.push({ type: 'hedge', sizePercent: 100 });
    }
    
    return actions;
  }

  /**
   * Select action using epsilon-greedy policy
   */
  selectAction(state: RLState, explore: boolean = true): RLAction {
    const possibleActions = this.getPossibleActions(state);
    
    // Exploration: random action
    if (explore && Math.random() < this.epsilon) {
      return possibleActions[Math.floor(Math.random() * possibleActions.length)];
    }
    
    // Exploitation: best action from Q-table
    const stateKey = this.discretizeState(state);
    const qValues = this.qTable.get(stateKey);
    
    if (!qValues || qValues.size === 0) {
      // No experience yet, return safe action
      return { type: 'hold', sizePercent: 0 };
    }
    
    // Find action with highest Q-value
    let bestAction: RLAction = { type: 'hold', sizePercent: 0 };
    let bestValue = -Infinity;
    
    for (const action of possibleActions) {
      const actionKey = this.actionToKey(action);
      const qValue = qValues.get(actionKey);
      
      if (qValue && qValue.value > bestValue) {
        bestValue = qValue.value;
        bestAction = action;
      }
    }
    
    return bestAction;
  }

  /**
   * Calculate reward with proper shaping
   */
  private calculateReward(
    state: RLState,
    action: RLAction,
    nextState: RLState
  ): number {
    let reward = 0;
    
    // 1. Profit component (main driver)
    const pnlChange = nextState.totalPnL - state.totalPnL;
    reward += pnlChange * this.profitWeight;
    
    // 2. Transaction costs
    if (action.type !== 'hold') {
      reward -= this.transactionCost * (action.sizePercent / 100) * Math.abs(state.cashBalance);
    }
    
    // 3. Risk penalty (penalize excessive Greeks)
    const deltaRisk = Math.abs(nextState.portfolioDelta) > this.maxPortfolioDelta 
      ? -this.riskPenalty * (Math.abs(nextState.portfolioDelta) - this.maxPortfolioDelta)
      : 0;
    reward += deltaRisk;
    
    const gammaRisk = Math.abs(nextState.portfolioGamma) > 50
      ? -this.riskPenalty * 0.5
      : 0;
    reward += gammaRisk;
    
    // 4. Drawdown penalty
    if (nextState.totalPnL < 0 && nextState.totalPnL < state.totalPnL) {
      const drawdownPercent = Math.abs(nextState.totalPnL / state.cashBalance) * 100;
      if (drawdownPercent > 5) {
        reward -= this.maxDrawdownPenalty * (drawdownPercent - 5);
      }
    }
    
    // 5. Position count penalty (avoid over-trading)
    if (nextState.totalPositions > 8) {
      reward -= 0.1 * (nextState.totalPositions - 8);
    }
    
    // 6. Theta decay bonus (collecting premium is good)
    if (state.portfolioTheta < 0) {
      reward += Math.abs(state.portfolioTheta) * 0.01; // Small bonus for theta collection
    }
    
    // 7. Successful hedge bonus
    if (action.type === 'hedge' && Math.abs(nextState.portfolioDelta) < Math.abs(state.portfolioDelta)) {
      reward += 1.0; // Reward successful delta reduction
    }
    
    return reward;
  }

  /**
   * Update Q-table using TD learning
   */
  private updateQValue(experience: Experience): void {
    const { state, action, reward, nextState, done } = experience;
    
    const stateKey = this.discretizeState(state);
    const actionKey = this.actionToKey(action);
    
    // Initialize state in Q-table if needed
    if (!this.qTable.has(stateKey)) {
      this.qTable.set(stateKey, new Map());
    }
    
    const stateQValues = this.qTable.get(stateKey)!;
    
    // Initialize action Q-value if needed
    if (!stateQValues.has(actionKey)) {
      stateQValues.set(actionKey, { actionKey, value: 0, visits: 0 });
    }
    
    const currentQ = stateQValues.get(actionKey)!;
    
    // Calculate max Q-value for next state
    let maxNextQ = 0;
    if (!done) {
      const nextStateKey = this.discretizeState(nextState);
      const nextQValues = this.qTable.get(nextStateKey);
      
      if (nextQValues) {
        for (const qValue of nextQValues.values()) {
          maxNextQ = Math.max(maxNextQ, qValue.value);
        }
      }
    }
    
    // TD update: Q(s,a) = Q(s,a) + α * [r + γ * max Q(s',a') - Q(s,a)]
    const tdTarget = reward + this.discountFactor * maxNextQ;
    const tdError = tdTarget - currentQ.value;
    
    currentQ.value += this.learningRate * tdError;
    currentQ.visits += 1;
    
    stateQValues.set(actionKey, currentQ);
  }

  /**
   * Store experience and train
   */
  learn(
    state: RLState,
    action: RLAction,
    nextState: RLState,
    done: boolean = false
  ): void {
    // Calculate reward
    const reward = this.calculateReward(state, action, nextState);
    
    // Store experience
    const experience: Experience = { state, action, reward, nextState, done };
    this.experienceBuffer.push(experience);
    
    // Limit buffer size
    if (this.experienceBuffer.length > this.bufferSize) {
      this.experienceBuffer.shift();
    }
    
    // Train on batch
    if (this.experienceBuffer.length >= this.batchSize) {
      this.trainBatch();
    }
    
    // Decay exploration rate
    this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay);
  }

  /**
   * Train on random batch from experience buffer
   */
  private trainBatch(): void {
    const batchSize = Math.min(this.batchSize, this.experienceBuffer.length);
    const batch: Experience[] = [];
    
    // Sample random experiences
    for (let i = 0; i < batchSize; i++) {
      const idx = Math.floor(Math.random() * this.experienceBuffer.length);
      batch.push(this.experienceBuffer[idx]);
    }
    
    // Update Q-values
    for (const experience of batch) {
      this.updateQValue(experience);
    }
  }

  /**
   * Get action recommendation with confidence score
   */
  getRecommendation(state: RLState): {
    action: RLAction;
    confidence: number;
    qValue: number;
    explanation: string;
  } {
    const action = this.selectAction(state, false);
    const stateKey = this.discretizeState(state);
    const actionKey = this.actionToKey(action);
    
    const qValues = this.qTable.get(stateKey);
    const qValue = qValues?.get(actionKey);
    
    // Confidence based on number of visits and Q-value magnitude
    const visits = qValue?.visits || 0;
    const value = qValue?.value || 0;
    const confidence = Math.min(100, (visits / 10) * 50 + Math.min(50, Math.abs(value) * 10));
    
    // Generate explanation
    const explanation = this.explainAction(action, state, value);
    
    return {
      action,
      confidence,
      qValue: value,
      explanation,
    };
  }

  private explainAction(action: RLAction, state: RLState, qValue: number): string {
    const explanations: string[] = [];
    
    switch (action.type) {
      case 'buy':
        explanations.push(`Open new position (${action.sizePercent.toFixed(0)}% size)`);
        if (state.ivRank > 70) explanations.push('IV is elevated - good for premium selling');
        if (Math.abs(state.portfolioDelta) < 20) explanations.push('Portfolio is balanced');
        break;
        
      case 'sell':
        explanations.push(`Close ${action.sizePercent.toFixed(0)}% of positions`);
        if (state.totalPnL > 0) explanations.push('Take profits');
        if (state.vixLevel > 30) explanations.push('High volatility - risk reduction');
        break;
        
      case 'hedge':
        explanations.push(`Hedge delta exposure (${action.sizePercent.toFixed(0)}%)`);
        explanations.push(`Current delta: ${state.portfolioDelta.toFixed(1)}`);
        break;
        
      case 'close':
        explanations.push('Close position');
        if (state.totalPnL < 0) explanations.push('Cut losses');
        if (state.positionDelta && Math.abs(state.positionDelta) > 0.8) {
          explanations.push('High directional risk');
        }
        break;
        
      case 'hold':
        explanations.push('Hold current positions');
        if (Math.abs(state.portfolioDelta) < 30) explanations.push('Portfolio is balanced');
        if (state.portfolioTheta < -100) explanations.push('Collecting theta decay');
        break;
    }
    
    if (qValue > 0) {
      explanations.push(`Expected value: +$${qValue.toFixed(2)}`);
    } else if (qValue < 0) {
      explanations.push(`Risk: $${Math.abs(qValue).toFixed(2)}`);
    }
    
    return explanations.join('. ');
  }

  /**
   * Export model state for persistence
   */
  exportModel(): string {
    const modelData = {
      qTable: Array.from(this.qTable.entries()).map(([state, actions]) => ({
        state,
        actions: Array.from(actions.entries()),
      })),
      epsilon: this.epsilon,
      experienceCount: this.experienceBuffer.length,
      timestamp: new Date().toISOString(),
    };
    
    return JSON.stringify(modelData);
  }

  /**
   * Import model state
   */
  importModel(jsonData: string): void {
    try {
      const modelData = JSON.parse(jsonData);
      
      this.qTable.clear();
      for (const { state, actions } of modelData.qTable) {
        const actionsMap = new Map(actions);
        this.qTable.set(state, actionsMap);
      }
      
      this.epsilon = modelData.epsilon || this.epsilon;
      
      console.log(`✅ RL Model imported: ${this.qTable.size} states`);
    } catch (error) {
      console.error('Failed to import RL model:', error);
    }
  }

  /**
   * Get training statistics
   */
  getStatistics(): {
    totalStates: number;
    totalExperiences: number;
    epsilon: number;
    avgQValue: number;
    learnedActions: number;
  } {
    let totalQValues = 0;
    let qValueSum = 0;
    
    for (const actions of this.qTable.values()) {
      for (const qValue of actions.values()) {
        totalQValues++;
        qValueSum += qValue.value;
      }
    }
    
    return {
      totalStates: this.qTable.size,
      totalExperiences: this.experienceBuffer.length,
      epsilon: this.epsilon,
      avgQValue: totalQValues > 0 ? qValueSum / totalQValues : 0,
      learnedActions: totalQValues,
    };
  }
}

/**
 * Create singleton RL agent instance
 */
let rlAgentInstance: ReinforcementLearningAgent | null = null;

export function createRLAgent(): ReinforcementLearningAgent {
  if (!rlAgentInstance) {
    rlAgentInstance = new ReinforcementLearningAgent();
  }
  return rlAgentInstance;
}

export function getRLAgent(): ReinforcementLearningAgent | null {
  return rlAgentInstance;
}
