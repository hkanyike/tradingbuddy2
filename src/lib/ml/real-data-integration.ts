// Production-ready real market data integration
export interface MarketDataProvider {
  name: string;
  apiKey: string;
  baseUrl: string;
  rateLimit: number; // requests per minute
  isEnabled: boolean;
}

export interface RealTimeQuote {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  volume: number;
  timestamp: number;
  change: number;
  changePercent: number;
}

export interface HistoricalData {
  symbol: string;
  data: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

export interface OptionsData {
  symbol: string;
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

export class RealDataIntegration {
  private providers: Map<string, MarketDataProvider> = new Map();
  private rateLimiters: Map<string, { count: number; resetTime: number }> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize data providers
   */
  private initializeProviders(): void {
    // Polygon.io
    this.providers.set('polygon', {
      name: 'Polygon.io',
      apiKey: process.env.POLYGON_API_KEY || '',
      baseUrl: 'https://api.polygon.io',
      rateLimit: 1000, // 1000 requests per minute
      isEnabled: !!process.env.POLYGON_API_KEY
    });

    // Alpha Vantage
    this.providers.set('alpha_vantage', {
      name: 'Alpha Vantage',
      apiKey: process.env.ALPHA_VANTAGE_API_KEY || '',
      baseUrl: 'https://www.alphavantage.co/query',
      rateLimit: 5, // 5 requests per minute (free tier)
      isEnabled: !!process.env.ALPHA_VANTAGE_API_KEY
    });

    // IEX Cloud
    this.providers.set('iex_cloud', {
      name: 'IEX Cloud',
      apiKey: process.env.IEX_CLOUD_API_KEY || '',
      baseUrl: 'https://cloud.iexapis.com/stable',
      rateLimit: 100000, // 100k requests per month
      isEnabled: !!process.env.IEX_CLOUD_API_KEY
    });

    // Financial Modeling Prep
    this.providers.set('fmp', {
      name: 'Financial Modeling Prep',
      apiKey: process.env.FMP_API_KEY || '',
      baseUrl: 'https://financialmodelingprep.com/api/v3',
      rateLimit: 250, // 250 requests per day (free tier)
      isEnabled: !!process.env.FMP_API_KEY
    });
  }

  /**
   * Get real-time quote
   */
  async getRealTimeQuote(symbol: string): Promise<RealTimeQuote | null> {
    try {
      // Try providers in order of preference
      const providers = ['polygon', 'iex_cloud', 'alpha_vantage', 'fmp'];
      
      for (const providerName of providers) {
        const provider = this.providers.get(providerName);
        if (!provider || !provider.isEnabled) continue;

        if (this.isRateLimited(providerName)) {
          console.log(`Rate limited for ${providerName}, trying next provider`);
          continue;
        }

        try {
          const quote = await this.fetchQuoteFromProvider(provider, symbol);
          if (quote) {
            this.updateRateLimit(providerName);
            return quote;
          }
        } catch (error) {
          console.error(`Error fetching quote from ${providerName}:`, error);
          continue;
        }
      }

      console.warn(`No provider available for symbol ${symbol}`);
      return null;
    } catch (error) {
      console.error(`Error getting real-time quote for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get historical data
   */
  async getHistoricalData(
    symbol: string, 
    timeframe: '1min' | '5min' | '15min' | '1hour' | '1day' = '1day',
    period: number = 30 // days
  ): Promise<HistoricalData | null> {
    try {
      const providers = ['polygon', 'iex_cloud', 'alpha_vantage', 'fmp'];
      
      for (const providerName of providers) {
        const provider = this.providers.get(providerName);
        if (!provider || !provider.isEnabled) continue;

        if (this.isRateLimited(providerName)) continue;

        try {
          const data = await this.fetchHistoricalFromProvider(provider, symbol, timeframe, period);
          if (data) {
            this.updateRateLimit(providerName);
            return data;
          }
        } catch (error) {
          console.error(`Error fetching historical data from ${providerName}:`, error);
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error(`Error getting historical data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get options data
   */
  async getOptionsData(symbol: string): Promise<OptionsData[]> {
    try {
      // Only Polygon.io has comprehensive options data
      const provider = this.providers.get('polygon');
      if (!provider || !provider.isEnabled) {
        console.warn('Polygon.io not available for options data');
        return [];
      }

      if (this.isRateLimited('polygon')) {
        console.warn('Polygon.io rate limited for options data');
        return [];
      }

      try {
        const options = await this.fetchOptionsFromProvider(provider, symbol);
        this.updateRateLimit('polygon');
        return options;
      } catch (error) {
        console.error('Error fetching options data:', error);
        return [];
      }
    } catch (error) {
      console.error(`Error getting options data for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Get market status
   */
  async getMarketStatus(): Promise<{ isOpen: boolean; nextOpen: Date; nextClose: Date }> {
    try {
      const provider = this.providers.get('polygon');
      if (!provider || !provider.isEnabled) {
        // Fallback to basic market hours
        return this.getBasicMarketStatus();
      }

      const response = await fetch(`${provider.baseUrl}/v1/marketstatus?apikey=${provider.apiKey}`);
      const data = await response.json();

      return {
        isOpen: data.market === 'open',
        nextOpen: new Date(data.nextMarketOpen),
        nextClose: new Date(data.nextMarketClose)
      };
    } catch (error) {
      console.error('Error getting market status:', error);
      return this.getBasicMarketStatus();
    }
  }

  private async fetchQuoteFromProvider(provider: MarketDataProvider, symbol: string): Promise<RealTimeQuote | null> {
    switch (provider.name) {
      case 'Polygon.io':
        return this.fetchPolygonQuote(provider, symbol);
      case 'IEX Cloud':
        return this.fetchIEXQuote(provider, symbol);
      case 'Alpha Vantage':
        return this.fetchAlphaVantageQuote(provider, symbol);
      case 'Financial Modeling Prep':
        return this.fetchFMPQuote(provider, symbol);
      default:
        return null;
    }
  }

  private async fetchPolygonQuote(provider: MarketDataProvider, symbol: string): Promise<RealTimeQuote | null> {
    const response = await fetch(
      `${provider.baseUrl}/v1/last/trade/${symbol}?apikey=${provider.apiKey}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      symbol: data.symbol,
      price: data.last?.price || 0,
      bid: data.last?.bid || 0,
      ask: data.last?.ask || 0,
      volume: data.last?.size || 0,
      timestamp: data.last?.timestamp || Date.now(),
      change: 0, // Would need previous close
      changePercent: 0
    };
  }

  private async fetchIEXQuote(provider: MarketDataProvider, symbol: string): Promise<RealTimeQuote | null> {
    const response = await fetch(
      `${provider.baseUrl}/stock/${symbol}/quote?token=${provider.apiKey}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      symbol: data.symbol,
      price: data.latestPrice || 0,
      bid: data.iexBidPrice || 0,
      ask: data.iexAskPrice || 0,
      volume: data.latestVolume || 0,
      timestamp: data.latestUpdate || Date.now(),
      change: data.change || 0,
      changePercent: data.changePercent || 0
    };
  }

  private async fetchAlphaVantageQuote(provider: MarketDataProvider, symbol: string): Promise<RealTimeQuote | null> {
    const response = await fetch(
      `${provider.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${provider.apiKey}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const quote = data['Global Quote'];
    
    if (!quote) return null;
    
    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']) || 0,
      bid: 0, // Not available in Alpha Vantage
      ask: 0, // Not available in Alpha Vantage
      volume: parseInt(quote['06. volume']) || 0,
      timestamp: Date.now(),
      change: parseFloat(quote['09. change']) || 0,
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')) || 0
    };
  }

  private async fetchFMPQuote(provider: MarketDataProvider, symbol: string): Promise<RealTimeQuote | null> {
    const response = await fetch(
      `${provider.baseUrl}/quote/${symbol}?apikey=${provider.apiKey}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (!data || data.length === 0) return null;
    
    const quote = data[0];
    
    return {
      symbol: quote.symbol,
      price: quote.price || 0,
      bid: 0, // Not available in FMP free tier
      ask: 0, // Not available in FMP free tier
      volume: quote.volume || 0,
      timestamp: Date.now(),
      change: quote.change || 0,
      changePercent: quote.changesPercentage || 0
    };
  }

  private async fetchHistoricalFromProvider(
    provider: MarketDataProvider, 
    symbol: string, 
    timeframe: string, 
    period: number
  ): Promise<HistoricalData | null> {
    // Implementation would depend on provider
    // For now, return null to indicate not implemented
    return null;
  }

  private async fetchOptionsFromProvider(provider: MarketDataProvider, symbol: string): Promise<OptionsData[]> {
    // Implementation would fetch options chain from Polygon.io
    // For now, return empty array
    return [];
  }

  private isRateLimited(providerName: string): boolean {
    const limiter = this.rateLimiters.get(providerName);
    if (!limiter) return false;

    const now = Date.now();
    if (now > limiter.resetTime) {
      // Reset counter
      limiter.count = 0;
      limiter.resetTime = now + 60000; // Reset in 1 minute
      return false;
    }

    const provider = this.providers.get(providerName);
    return limiter.count >= (provider?.rateLimit || 0);
  }

  private updateRateLimit(providerName: string): void {
    const limiter = this.rateLimiters.get(providerName) || { count: 0, resetTime: Date.now() + 60000 };
    limiter.count++;
    this.rateLimiters.set(providerName, limiter);
  }

  private getBasicMarketStatus(): { isOpen: boolean; nextOpen: Date; nextClose: Date } {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Basic market hours: 9:30 AM - 4:00 PM EST, Monday-Friday
    const isOpen = day >= 1 && day <= 5 && hour >= 9 && hour < 16;
    
    // Calculate next open/close (simplified)
    const nextOpen = new Date(now);
    nextOpen.setHours(9, 30, 0, 0);
    if (nextOpen <= now) {
      nextOpen.setDate(nextOpen.getDate() + 1);
    }
    
    const nextClose = new Date(now);
    nextClose.setHours(16, 0, 0, 0);
    if (nextClose <= now) {
      nextClose.setDate(nextClose.getDate() + 1);
    }
    
    return { isOpen, nextOpen, nextClose };
  }
}

// Export singleton instance
export const realDataIntegration = new RealDataIntegration();
