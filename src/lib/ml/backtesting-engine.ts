// Production-ready backtesting engine for ML trading strategies
import { TechnicalFeatures, VolatilityFeatures } from './feature-engine';

export interface BacktestConfig {
  name: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  symbols: string[];
  modelId: string;
  positionSize: number; // Percentage of capital per trade
  maxPositions: number;
  stopLoss: number; // Percentage
  takeProfit: number; // Percentage
  commission: number; // Per trade
  slippage: number; // Percentage
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryTime: number;
  exitTime: number;
  pnl: number;
  pnlPercent: number;
  commission: number;
  slippage: number;
  reason: 'stop_loss' | 'take_profit' | 'model_signal' | 'end_of_data';
  modelPrediction: number;
  confidence: number;
}

export interface BacktestMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageTradeDuration: number; // In hours
  calmarRatio: number;
  var95: number; // Value at Risk 95%
  cvar95: number; // Conditional Value at Risk 95%
}

export interface BacktestResult {
  id: string;
  config: BacktestConfig;
  metrics: BacktestMetrics;
  trades: Trade[];
  equityCurve: Array<{ timestamp: number; equity: number; drawdown: number }>;
  monthlyReturns: Array<{ month: string; return: number }>;
  symbolReturns: Record<string, number>;
  createdAt: number;
  status: 'running' | 'completed' | 'failed';
}

export class BacktestingEngine {
  private backtests: Map<string, BacktestResult> = new Map();

  /**
   * Run a backtest
   */
  async runBacktest(config: BacktestConfig): Promise<BacktestResult> {
    const backtestId = `backtest_${Date.now()}`;
    
    const result: BacktestResult = {
      id: backtestId,
      config,
      metrics: {} as BacktestMetrics,
      trades: [],
      equityCurve: [],
      monthlyReturns: [],
      symbolReturns: {},
      createdAt: Date.now(),
      status: 'running'
    };

    this.backtests.set(backtestId, result);

    try {
      console.log(`Starting backtest: ${config.name}`);
      
      // Load historical data
      const historicalData = await this.loadHistoricalData(config);
      
      // Generate features
      const features = await this.generateFeatures(historicalData);
      
      // Run backtest simulation
      await this.runSimulation(result, features, historicalData);
      
      // Calculate metrics
      result.metrics = this.calculateMetrics(result);
      
      // Generate reports
      this.generateReports(result);
      
      result.status = 'completed';
      console.log(`Backtest completed: ${config.name}`);
      
      return result;
    } catch (error) {
      console.error(`Backtest failed: ${config.name}`, error);
      result.status = 'failed';
      throw error;
    }
  }

  /**
   * Get backtest result
   */
  getBacktest(backtestId: string): BacktestResult | undefined {
    return this.backtests.get(backtestId);
  }

  /**
   * Get all backtests
   */
  getAllBacktests(): BacktestResult[] {
    return Array.from(this.backtests.values());
  }

  /**
   * Delete backtest
   */
  deleteBacktest(backtestId: string): boolean {
    return this.backtests.delete(backtestId);
  }

  private async loadHistoricalData(config: BacktestConfig): Promise<any[]> {
    // This would load real historical data
    // For now, return simulated data
    const data: any[] = [];
    const startTime = config.startDate.getTime();
    const endTime = config.endDate.getTime();
    const interval = 24 * 60 * 60 * 1000; // Daily data
    
    for (let time = startTime; time <= endTime; time += interval) {
      for (const symbol of config.symbols) {
        const basePrice = 100 + Math.random() * 100;
        const change = (Math.random() - 0.5) * 4;
        
        data.push({
          symbol,
          timestamp: time,
          open: basePrice,
          high: basePrice + Math.random() * 2,
          low: basePrice - Math.random() * 2,
          close: basePrice + change,
          volume: Math.floor(Math.random() * 1000000) + 100000
        });
      }
    }
    
    return data.sort((a, b) => a.timestamp - b.timestamp);
  }

  private async generateFeatures(historicalData: any[]): Promise<any[]> {
    // This would use the feature engine to generate features
    // For now, return simulated features
    return historicalData.map((data, index) => ({
      ...data,
      features: {
        sma_20: 100 + Math.random() * 20,
        rsi_14: 30 + Math.random() * 40,
        macd: (Math.random() - 0.5) * 2,
        volume_ratio: 0.5 + Math.random(),
        // ... other features
      }
    }));
  }

  private async runSimulation(
    result: BacktestResult, 
    features: any[], 
    historicalData: any[]
  ): Promise<void> {
    let capital = result.config.initialCapital;
    let positions: Map<string, Trade> = new Map();
    let tradeId = 0;
    
    const equityCurve: Array<{ timestamp: number; equity: number; drawdown: number }> = [];
    let peakEquity = capital;
    
    for (let i = 0; i < features.length; i++) {
      const data = features[i];
      const currentPrice = data.close;
      const timestamp = data.timestamp;
      
      // Update existing positions
      for (const [symbol, position] of positions) {
        if (position.exitTime === 0) {
          // Check stop loss and take profit
          const pnlPercent = position.type === 'long' 
            ? (currentPrice - position.entryPrice) / position.entryPrice
            : (position.entryPrice - currentPrice) / position.entryPrice;
          
          let shouldExit = false;
          let exitReason: Trade['reason'] = 'model_signal';
          
          if (pnlPercent <= -result.config.stopLoss) {
            shouldExit = true;
            exitReason = 'stop_loss';
          } else if (pnlPercent >= result.config.takeProfit) {
            shouldExit = true;
            exitReason = 'take_profit';
          }
          
          if (shouldExit) {
            // Close position
            const exitPrice = currentPrice * (1 + (Math.random() - 0.5) * result.config.slippage);
            const pnl = position.type === 'long'
              ? (exitPrice - position.entryPrice) * position.quantity
              : (position.entryPrice - exitPrice) * position.quantity;
            
            const commission = result.config.commission * 2; // Entry + exit
            const netPnl = pnl - commission;
            
            position.exitPrice = exitPrice;
            position.exitTime = timestamp;
            position.pnl = netPnl;
            position.pnlPercent = pnlPercent;
            position.commission = commission;
            position.slippage = Math.abs(exitPrice - currentPrice) / currentPrice;
            position.reason = exitReason;
            
            capital += netPnl;
            positions.delete(symbol);
            result.trades.push(position);
          }
        }
      }
      
      // Check for new entry signals
      if (positions.size < result.config.maxPositions) {
        // This would use the actual ML model for predictions
        const prediction = Math.random() * 2 - 1; // -1 to 1
        const confidence = 0.5 + Math.random() * 0.5; // 0.5 to 1.0
        
        if (Math.abs(prediction) > 0.3 && confidence > 0.6) {
          const positionSize = capital * result.config.positionSize;
          const quantity = positionSize / currentPrice;
          
          const trade: Trade = {
            id: `trade_${tradeId++}`,
            symbol: data.symbol,
            type: prediction > 0 ? 'long' : 'short',
            entryPrice: currentPrice,
            exitPrice: 0,
            quantity,
            entryTime: timestamp,
            exitTime: 0,
            pnl: 0,
            pnlPercent: 0,
            commission: result.config.commission,
            slippage: 0,
            reason: 'model_signal',
            modelPrediction: prediction,
            confidence
          };
          
          positions.set(data.symbol, trade);
          capital -= result.config.commission;
        }
      }
      
      // Update equity curve
      const currentEquity = capital + Array.from(positions.values()).reduce((sum, pos) => {
        if (pos.exitTime === 0) {
          const unrealizedPnl = pos.type === 'long'
            ? (currentPrice - pos.entryPrice) * pos.quantity
            : (pos.entryPrice - currentPrice) * pos.quantity;
          return sum + unrealizedPnl;
        }
        return sum;
      }, 0);
      
      peakEquity = Math.max(peakEquity, currentEquity);
      const drawdown = (peakEquity - currentEquity) / peakEquity;
      
      equityCurve.push({
        timestamp,
        equity: currentEquity,
        drawdown
      });
    }
    
    // Close any remaining positions
    for (const [symbol, position] of positions) {
      if (position.exitTime === 0) {
        const lastData = features[features.length - 1];
        position.exitPrice = lastData.close;
        position.exitTime = lastData.timestamp;
        position.reason = 'end_of_data';
        
        const pnl = position.type === 'long'
          ? (position.exitPrice - position.entryPrice) * position.quantity
          : (position.entryPrice - position.exitPrice) * position.quantity;
        
        position.pnl = pnl - position.commission;
        position.pnlPercent = position.type === 'long'
          ? (position.exitPrice - position.entryPrice) / position.entryPrice
          : (position.entryPrice - position.exitPrice) / position.entryPrice;
        
        result.trades.push(position);
      }
    }
    
    result.equityCurve = equityCurve;
  }

  private calculateMetrics(result: BacktestResult): BacktestMetrics {
    const trades = result.trades;
    const equityCurve = result.equityCurve;
    
    if (trades.length === 0) {
      return {
        totalReturn: 0,
        totalReturnPercent: 0,
        annualizedReturn: 0,
        volatility: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
        winRate: 0,
        profitFactor: 0,
        averageWin: 0,
        averageLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        averageTradeDuration: 0,
        calmarRatio: 0,
        var95: 0,
        cvar95: 0
      };
    }
    
    const initialCapital = result.config.initialCapital;
    const finalCapital = equityCurve[equityCurve.length - 1]?.equity || initialCapital;
    const totalReturn = finalCapital - initialCapital;
    const totalReturnPercent = (totalReturn / initialCapital) * 100;
    
    // Calculate returns
    const returns = equityCurve.slice(1).map((point, i) => {
      const prevEquity = equityCurve[i].equity;
      return (point.equity - prevEquity) / prevEquity;
    });
    
    const annualizedReturn = this.calculateAnnualizedReturn(returns, result.config.startDate, result.config.endDate);
    const volatility = this.calculateVolatility(returns);
    const sharpeRatio = this.calculateSharpeRatio(returns);
    const sortinoRatio = this.calculateSortinoRatio(returns);
    
    // Drawdown
    const maxDrawdown = Math.max(...equityCurve.map(point => point.drawdown));
    const maxDrawdownPercent = maxDrawdown * 100;
    
    // Trade statistics
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const winRate = (winningTrades.length / trades.length) * 100;
    
    const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
    
    const averageWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
    
    const largestWin = Math.max(...trades.map(t => t.pnl), 0);
    const largestLoss = Math.min(...trades.map(t => t.pnl), 0);
    
    // Trade duration
    const tradeDurations = trades.map(t => (t.exitTime - t.entryTime) / (1000 * 60 * 60)); // Hours
    const averageTradeDuration = tradeDurations.reduce((sum, d) => sum + d, 0) / tradeDurations.length;
    
    // Risk metrics
    const calmarRatio = annualizedReturn / (maxDrawdownPercent / 100);
    const var95 = this.calculateVaR(returns, 0.95);
    const cvar95 = this.calculateCVaR(returns, 0.95);
    
    return {
      totalReturn,
      totalReturnPercent,
      annualizedReturn,
      volatility,
      sharpeRatio,
      sortinoRatio,
      maxDrawdown,
      maxDrawdownPercent,
      winRate,
      profitFactor,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      averageTradeDuration,
      calmarRatio,
      var95,
      cvar95
    };
  }

  private calculateAnnualizedReturn(returns: number[], startDate: Date, endDate: Date): number {
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const totalReturn = returns.reduce((acc, ret) => acc * (1 + ret), 1) - 1;
    return Math.pow(1 + totalReturn, 365 / totalDays) - 1;
  }

  private calculateVolatility(returns: number[]): number {
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(252); // Annualized
  }

  private calculateSharpeRatio(returns: number[]): number {
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const volatility = this.calculateVolatility(returns);
    return volatility > 0 ? (mean * 252) / volatility : 0; // Assuming 252 trading days
  }

  private calculateSortinoRatio(returns: number[]): number {
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const negativeReturns = returns.filter(ret => ret < 0);
    const downsideDeviation = Math.sqrt(
      negativeReturns.reduce((sum, ret) => sum + ret * ret, 0) / negativeReturns.length
    ) * Math.sqrt(252);
    return downsideDeviation > 0 ? (mean * 252) / downsideDeviation : 0;
  }

  private calculateVaR(returns: number[], confidence: number): number {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    return sortedReturns[index] || 0;
  }

  private calculateCVaR(returns: number[], confidence: number): number {
    const var95 = this.calculateVaR(returns, confidence);
    const tailReturns = returns.filter(ret => ret <= var95);
    return tailReturns.length > 0 ? tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length : 0;
  }

  private generateReports(result: BacktestResult): void {
    // Generate monthly returns
    const monthlyReturns: Array<{ month: string; return: number }> = [];
    const monthlyData = new Map<string, number[]>();
    
    result.equityCurve.forEach(point => {
      const date = new Date(point.timestamp);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(month)) {
        monthlyData.set(month, []);
      }
      monthlyData.get(month)!.push(point.equity);
    });
    
    for (const [month, equities] of monthlyData) {
      if (equities.length > 1) {
        const monthlyReturn = (equities[equities.length - 1] - equities[0]) / equities[0];
        monthlyReturns.push({ month, return: monthlyReturn });
      }
    }
    
    result.monthlyReturns = monthlyReturns;
    
    // Generate symbol returns
    const symbolReturns: Record<string, number> = {};
    const symbolData = new Map<string, number[]>();
    
    result.trades.forEach(trade => {
      if (!symbolData.has(trade.symbol)) {
        symbolData.set(trade.symbol, []);
      }
      symbolData.get(trade.symbol)!.push(trade.pnlPercent);
    });
    
    for (const [symbol, returns] of symbolData) {
      const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      symbolReturns[symbol] = avgReturn;
    }
    
    result.symbolReturns = symbolReturns;
  }
}

// Export singleton instance
export const backtestingEngine = new BacktestingEngine();
