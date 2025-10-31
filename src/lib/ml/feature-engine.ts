// Production-ready feature engineering for trading ML models
export interface MarketData {
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
}

export interface OptionsData {
  symbol: string;
  timestamp: number;
  strike: number;
  expiration: string;
  optionType: 'call' | 'put';
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export interface TechnicalFeatures {
  // Price-based features
  sma_5: number;
  sma_10: number;
  sma_20: number;
  sma_50: number;
  sma_200: number;
  ema_12: number;
  ema_26: number;
  
  // Volatility features
  atr_14: number;
  bb_upper: number;
  bb_lower: number;
  bb_width: number;
  bb_position: number;
  rsi_14: number;
  rsi_21: number;
  
  // Momentum features
  macd: number;
  macd_signal: number;
  macd_histogram: number;
  stoch_k: number;
  stoch_d: number;
  williams_r: number;
  
  // Volume features
  volume_sma_20: number;
  volume_ratio: number;
  obv: number;
  vwap: number;
  price_volume_trend: number;
  
  // Market microstructure
  bid_ask_spread: number;
  price_impact: number;
  order_flow_imbalance: number;
  
  // Time-based features
  hour_of_day: number;
  day_of_week: number;
  day_of_month: number;
  is_market_open: boolean;
  minutes_to_close: number;
  
  // Volatility surface features (for options)
  iv_smile: number;
  iv_term_structure: number;
  skew: number;
  kurtosis: number;
}

export interface VolatilityFeatures {
  // Implied volatility features
  iv_atm: number;
  iv_25d: number;
  iv_75d: number;
  iv_skew: number;
  iv_term_structure: number;
  iv_mean_reversion: number;
  
  // Historical volatility features
  hv_5d: number;
  hv_10d: number;
  hv_20d: number;
  hv_30d: number;
  hv_60d: number;
  hv_90d: number;
  
  // Volatility ratios
  iv_hv_ratio: number;
  iv_hv_ratio_5d: number;
  iv_hv_ratio_20d: number;
  
  // Volatility of volatility
  vvol: number;
  vvol_5d: number;
  vvol_20d: number;
}

export class FeatureEngine {
  private lookbackPeriods = [5, 10, 20, 50, 200];
  
  /**
   * Calculate technical indicators from OHLCV data
   */
  calculateTechnicalFeatures(data: MarketData[]): TechnicalFeatures[] {
    if (data.length < 200) {
      throw new Error('Insufficient data for technical analysis. Need at least 200 data points.');
    }

    const features: TechnicalFeatures[] = [];
    
    for (let i = 199; i < data.length; i++) {
      const window = data.slice(i - 199, i + 1);
      const current = data[i];
      
      features.push({
        // Simple Moving Averages
        sma_5: this.sma(window.slice(-5), 'close'),
        sma_10: this.sma(window.slice(-10), 'close'),
        sma_20: this.sma(window.slice(-20), 'close'),
        sma_50: this.sma(window.slice(-50), 'close'),
        sma_200: this.sma(window, 'close'),
        
        // Exponential Moving Averages
        ema_12: this.ema(window, 'close', 12),
        ema_26: this.ema(window, 'close', 26),
        
        // Volatility indicators
        atr_14: this.atr(window.slice(-14), 14),
        ...this.bollingerBands(window.slice(-20), 20, 2),
        rsi_14: this.rsi(window.slice(-14), 14),
        rsi_21: this.rsi(window.slice(-21), 21),
        
        // Momentum indicators
        ...this.macd(window, 12, 26, 9),
        ...this.stochastic(window.slice(-14), 14, 3),
        williams_r: this.williamsR(window.slice(-14), 14),
        
        // Volume indicators
        volume_sma_20: this.sma(window.slice(-20), 'volume'),
        volume_ratio: current.volume / this.sma(window.slice(-20), 'volume'),
        obv: this.obv(window),
        vwap: this.vwap(window),
        price_volume_trend: this.priceVolumeTrend(window),
        
        // Market microstructure (simplified)
        bid_ask_spread: this.calculateBidAskSpread(current),
        price_impact: this.calculatePriceImpact(window.slice(-5)),
        order_flow_imbalance: this.calculateOrderFlowImbalance(window.slice(-10)),
        
        // Time features
        hour_of_day: new Date(current.timestamp).getHours(),
        day_of_week: new Date(current.timestamp).getDay(),
        day_of_month: new Date(current.timestamp).getDate(),
        is_market_open: this.isMarketOpen(current.timestamp),
        minutes_to_close: this.minutesToMarketClose(current.timestamp),
        
        // Volatility surface (placeholder - would need options data)
        iv_smile: 0, // Would calculate from options chain
        iv_term_structure: 0,
        skew: 0,
        kurtosis: 0,
      });
    }
    
    return features;
  }

  /**
   * Calculate volatility features from options data
   */
  calculateVolatilityFeatures(optionsData: OptionsData[], marketData: MarketData[]): VolatilityFeatures[] {
    // Group options by timestamp
    const optionsByTime = this.groupOptionsByTime(optionsData);
    const features: VolatilityFeatures[] = [];
    
    for (const [timestamp, options] of optionsByTime) {
      const marketPoint = marketData.find(d => d.timestamp === timestamp);
      if (!marketPoint) continue;
      
      // Calculate ATM IV
      const atmStrike = marketPoint.close;
      const atmOptions = options.filter(o => 
        Math.abs(o.strike - atmStrike) / atmStrike < 0.05
      );
      
      const iv_atm = atmOptions.length > 0 ? 
        atmOptions.reduce((sum, o) => sum + o.impliedVolatility, 0) / atmOptions.length : 0;
      
      // Calculate skew
      const calls = options.filter(o => o.optionType === 'call');
      const puts = options.filter(o => o.optionType === 'put');
      
      const iv_25d = this.calculateIVAtDelta(puts, 0.25);
      const iv_75d = this.calculateIVAtDelta(calls, 0.75);
      const iv_skew = iv_25d - iv_75d;
      
      // Calculate historical volatility
      const hv_5d = this.calculateHistoricalVolatility(marketData, timestamp, 5);
      const hv_20d = this.calculateHistoricalVolatility(marketData, timestamp, 20);
      
      features.push({
        iv_atm,
        iv_25d,
        iv_75d,
        iv_skew,
        iv_term_structure: this.calculateTermStructure(options),
        iv_mean_reversion: this.calculateIVMeanReversion(options, marketData, timestamp),
        
        hv_5d,
        hv_10d: this.calculateHistoricalVolatility(marketData, timestamp, 10),
        hv_20d,
        hv_30d: this.calculateHistoricalVolatility(marketData, timestamp, 30),
        hv_60d: this.calculateHistoricalVolatility(marketData, timestamp, 60),
        hv_90d: this.calculateHistoricalVolatility(marketData, timestamp, 90),
        
        iv_hv_ratio: iv_atm / hv_20d,
        iv_hv_ratio_5d: iv_atm / hv_5d,
        iv_hv_ratio_20d: iv_atm / hv_20d,
        
        vvol: this.calculateVolatilityOfVolatility(options, 20),
        vvol_5d: this.calculateVolatilityOfVolatility(options, 5),
        vvol_20d: this.calculateVolatilityOfVolatility(options, 20),
      });
    }
    
    return features;
  }

  // Technical indicator implementations
  private sma(data: MarketData[], field: keyof MarketData): number {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, d) => acc + (d[field] as number), 0);
    return sum / data.length;
  }

  private ema(data: MarketData[], field: keyof MarketData, period: number): number {
    if (data.length === 0) return 0;
    if (data.length < period) return this.sma(data, field);
    
    const multiplier = 2 / (period + 1);
    let ema = this.sma(data.slice(0, period), field);
    
    for (let i = period; i < data.length; i++) {
      ema = (data[i][field] as number) * multiplier + ema * (1 - multiplier);
    }
    
    return ema;
  }

  private atr(data: MarketData[], period: number): number {
    if (data.length < 2) return 0;
    
    const trueRanges = [];
    for (let i = 1; i < data.length; i++) {
      const high = data[i].high;
      const low = data[i].low;
      const prevClose = data[i - 1].close;
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
    }
    
    return this.sma(data.slice(-trueRanges.length), 'close') * 
           (trueRanges.reduce((sum, tr) => sum + tr, 0) / trueRanges.length / this.sma(data.slice(-trueRanges.length), 'close'));
  }

  private bollingerBands(data: MarketData[], period: number, stdDev: number) {
    const sma = this.sma(data, 'close');
    const variance = data.reduce((acc, d) => acc + Math.pow(d.close - sma, 2), 0) / data.length;
    const std = Math.sqrt(variance);
    
    const bb_upper = sma + (std * stdDev);
    const bb_lower = sma - (std * stdDev);
    const bb_width = (std * stdDev * 2) / sma;
    const bb_position = (data[data.length - 1].close - bb_lower) / (bb_upper - bb_lower);
    
    return {
      bb_upper,
      bb_lower,
      bb_width,
      bb_position,
    };
  }

  private rsi(data: MarketData[], period: number): number {
    if (data.length < period + 1) return 50;
    
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const avgGain = gains.reduce((sum, g) => sum + g, 0) / gains.length;
    const avgLoss = losses.reduce((sum, l) => sum + l, 0) / losses.length;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private macd(data: MarketData[], fastPeriod: number, slowPeriod: number, signalPeriod: number) {
    const emaFast = this.ema(data, 'close', fastPeriod);
    const emaSlow = this.ema(data, 'close', slowPeriod);
    const macd = emaFast - emaSlow;
    
    // Simplified signal line calculation
    const signal = this.ema(data, 'close', signalPeriod);
    
    return {
      macd,
      macd_signal: signal,
      macd_histogram: macd - signal,
    };
  }

  private stochastic(data: MarketData[], kPeriod: number, dPeriod: number) {
    const kValues = [];
    
    for (let i = kPeriod - 1; i < data.length; i++) {
      const window = data.slice(i - kPeriod + 1, i + 1);
      const highest = Math.max(...window.map(d => d.high));
      const lowest = Math.min(...window.map(d => d.low));
      const current = data[i].close;
      
      const k = ((current - lowest) / (highest - lowest)) * 100;
      kValues.push(k);
    }
    
    const stoch_k = kValues[kValues.length - 1] || 50;
    const stoch_d = kValues.slice(-dPeriod).reduce((sum, k) => sum + k, 0) / Math.min(dPeriod, kValues.length);
    
    return { stoch_k, stoch_d };
  }

  private williamsR(data: MarketData[], period: number): number {
    const highest = Math.max(...data.map(d => d.high));
    const lowest = Math.min(...data.map(d => d.low));
    const current = data[data.length - 1].close;
    
    return ((highest - current) / (highest - lowest)) * -100;
  }

  private obv(data: MarketData[]): number {
    let obv = 0;
    
    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const previous = data[i - 1];
      
      if (current.close > previous.close) {
        obv += current.volume;
      } else if (current.close < previous.close) {
        obv -= current.volume;
      }
    }
    
    return obv;
  }

  private vwap(data: MarketData[]): number {
    let totalVolume = 0;
    let totalPriceVolume = 0;
    
    for (const d of data) {
      const typicalPrice = (d.high + d.low + d.close) / 3;
      totalPriceVolume += typicalPrice * d.volume;
      totalVolume += d.volume;
    }
    
    return totalVolume > 0 ? totalPriceVolume / totalVolume : 0;
  }

  private priceVolumeTrend(data: MarketData[]): number {
    let pvt = 0;
    
    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const previous = data[i - 1];
      
      if (current.close > previous.close) {
        pvt += current.volume;
      } else if (current.close < previous.close) {
        pvt -= current.volume;
      }
    }
    
    return pvt;
  }

  // Helper methods
  private calculateBidAskSpread(data: MarketData): number {
    // Simplified - would need actual bid/ask data
    return data.close * 0.001; // 0.1% spread estimate
  }

  private calculatePriceImpact(data: MarketData[]): number {
    if (data.length < 2) return 0;
    const priceChange = data[data.length - 1].close - data[0].close;
    const volumeChange = data[data.length - 1].volume - data[0].volume;
    return volumeChange > 0 ? priceChange / volumeChange : 0;
  }

  private calculateOrderFlowImbalance(data: MarketData[]): number {
    // Simplified order flow calculation
    let buyVolume = 0;
    let sellVolume = 0;
    
    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const previous = data[i - 1];
      
      if (current.close > previous.close) {
        buyVolume += current.volume;
      } else if (current.close < previous.close) {
        sellVolume += current.volume;
      }
    }
    
    const totalVolume = buyVolume + sellVolume;
    return totalVolume > 0 ? (buyVolume - sellVolume) / totalVolume : 0;
  }

  private isMarketOpen(timestamp: number): boolean {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const day = date.getDay();
    
    // Simplified market hours (9:30 AM - 4:00 PM EST, Monday-Friday)
    return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
  }

  private minutesToMarketClose(timestamp: number): number {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const minute = date.getMinutes();
    
    if (!this.isMarketOpen(timestamp)) return 0;
    
    const marketClose = 16 * 60; // 4:00 PM in minutes
    const currentTime = hour * 60 + minute;
    
    return Math.max(0, marketClose - currentTime);
  }

  private groupOptionsByTime(optionsData: OptionsData[]): Map<number, OptionsData[]> {
    const grouped = new Map<number, OptionsData[]>();
    
    for (const option of optionsData) {
      if (!grouped.has(option.timestamp)) {
        grouped.set(option.timestamp, []);
      }
      grouped.get(option.timestamp)!.push(option);
    }
    
    return grouped;
  }

  private calculateIVAtDelta(options: OptionsData[], targetDelta: number): number {
    const sortedOptions = options
      .filter(o => Math.abs(o.delta - targetDelta) < 0.1)
      .sort((a, b) => Math.abs(a.delta - targetDelta) - Math.abs(b.delta - targetDelta));
    
    return sortedOptions.length > 0 ? sortedOptions[0].impliedVolatility : 0;
  }

  private calculateTermStructure(options: OptionsData[]): number {
    // Calculate IV term structure slope
    const expirations = [...new Set(options.map(o => o.expiration))].sort();
    if (expirations.length < 2) return 0;
    
    const shortTermIV = this.calculateAverageIV(options.filter(o => o.expiration === expirations[0]));
    const longTermIV = this.calculateAverageIV(options.filter(o => o.expiration === expirations[expirations.length - 1]));
    
    return longTermIV - shortTermIV;
  }

  private calculateAverageIV(options: OptionsData[]): number {
    if (options.length === 0) return 0;
    return options.reduce((sum, o) => sum + o.impliedVolatility, 0) / options.length;
  }

  private calculateIVMeanReversion(options: OptionsData[], marketData: MarketData[], timestamp: number): number {
    // Calculate how far current IV is from historical average
    const currentIV = this.calculateAverageIV(options);
    const historicalData = marketData.filter(d => d.timestamp < timestamp).slice(-20);
    
    if (historicalData.length === 0) return 0;
    
    const historicalVol = this.calculateHistoricalVolatility(historicalData, timestamp, 20);
    return currentIV - historicalVol;
  }

  private calculateHistoricalVolatility(data: MarketData[], timestamp: number, days: number): number {
    const cutoff = timestamp - (days * 24 * 60 * 60 * 1000);
    const relevantData = data.filter(d => d.timestamp >= cutoff && d.timestamp < timestamp);
    
    if (relevantData.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < relevantData.length; i++) {
      const ret = Math.log(relevantData[i].close / relevantData[i - 1].close);
      returns.push(ret);
    }
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(252); // Annualized
  }

  private calculateVolatilityOfVolatility(options: OptionsData[], period: number): number {
    // Calculate volatility of implied volatility
    const ivs = options.map(o => o.impliedVolatility);
    if (ivs.length < 2) return 0;
    
    const mean = ivs.reduce((sum, iv) => sum + iv, 0) / ivs.length;
    const variance = ivs.reduce((sum, iv) => sum + Math.pow(iv - mean, 2), 0) / ivs.length;
    
    return Math.sqrt(variance);
  }
}

// Export singleton instance
export const featureEngine = new FeatureEngine();
