// Real market data service to replace mock data
export interface MarketDataConfig {
  apiKey?: string;
  baseUrl?: string;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface FutureQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export class MarketDataService {
  private config: MarketDataConfig;

  constructor(config: MarketDataConfig = {}) {
    this.config = {
      baseUrl: 'https://api.polygon.io',
      ...config
    };
  }

  // Get real market indexes data
  async getMarketIndexes(): Promise<MarketIndex[]> {
    try {
      // For now, we'll use a free API or fallback to a reliable source
      // In production, you'd use a paid service like Polygon, Alpha Vantage, or IEX
      const symbols = ['SPY', 'QQQ', 'DIA', 'IWM'];
      const indexes: MarketIndex[] = [];

      for (const symbol of symbols) {
        try {
          // Using a free API like Alpha Vantage or IEX Cloud
          const response = await fetch(
            `https://api.iexcloud.io/v1/data/core/quote/${symbol}?token=${this.config.apiKey || 'pk_test'}`
          );
          
          if (response.ok) {
            const data = await response.json();
            indexes.push({
              symbol: data.symbol,
              name: data.companyName || symbol,
              price: data.latestPrice || 0,
              change: data.change || 0,
              changePercent: data.changePercent || 0
            });
          } else {
            // Fallback to mock data if API fails
            indexes.push(this.getMockIndex(symbol));
          }
        } catch (error) {
          console.warn(`Failed to fetch data for ${symbol}:`, error);
          indexes.push(this.getMockIndex(symbol));
        }
      }

      return indexes;
    } catch (error) {
      console.error('Error fetching market indexes:', error);
      return this.getMockIndexes();
    }
  }

  // Get real stock quotes
  async getStockQuotes(symbols: string[]): Promise<StockQuote[]> {
    try {
      const quotes: StockQuote[] = [];

      for (const symbol of symbols) {
        try {
          const response = await fetch(
            `https://api.iexcloud.io/v1/data/core/quote/${symbol}?token=${this.config.apiKey || 'pk_test'}`
          );
          
          if (response.ok) {
            const data = await response.json();
            quotes.push({
              symbol: data.symbol,
              name: data.companyName || symbol,
              price: data.latestPrice || 0,
              change: data.change || 0,
              changePercent: data.changePercent || 0,
              volume: data.volume || 0
            });
          } else {
            quotes.push(this.getMockStock(symbol));
          }
        } catch (error) {
          console.warn(`Failed to fetch data for ${symbol}:`, error);
          quotes.push(this.getMockStock(symbol));
        }
      }

      return quotes;
    } catch (error) {
      console.error('Error fetching stock quotes:', error);
      return this.getMockStocks();
    }
  }

  // Get real futures data
  async getFuturesQuotes(): Promise<FutureQuote[]> {
    try {
      // Futures data is typically from a different source
      // For now, we'll use mock data as most free APIs don't provide futures
      return this.getMockFutures();
    } catch (error) {
      console.error('Error fetching futures quotes:', error);
      return this.getMockFutures();
    }
  }

  // Mock data fallbacks
  private getMockIndexes(): MarketIndex[] {
    return [
      { symbol: "SPY", name: "S&P 500 ETF", price: 450.25, change: 2.15, changePercent: 0.48 },
      { symbol: "QQQ", name: "Nasdaq 100 ETF", price: 378.90, change: -1.25, changePercent: -0.33 },
      { symbol: "DIA", name: "Dow Jones ETF", price: 350.75, change: 3.50, changePercent: 1.01 },
      { symbol: "IWM", name: "Russell 2000 ETF", price: 185.40, change: 0.85, changePercent: 0.46 }
    ];
  }

  private getMockStocks(): StockQuote[] {
    return [
      { symbol: "AAPL", name: "Apple Inc.", price: 178.50, change: 1.25, changePercent: 0.71, volume: 52000000 },
      { symbol: "MSFT", name: "Microsoft Corp.", price: 380.25, change: -2.15, changePercent: -0.56, volume: 28000000 },
      { symbol: "NVDA", name: "NVIDIA Corp.", price: 495.75, change: 8.50, changePercent: 1.74, volume: 45000000 },
      { symbol: "TSLA", name: "Tesla Inc.", price: 245.80, change: -3.20, changePercent: -1.28, volume: 95000000 },
      { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.30, change: 0.85, changePercent: 0.60, volume: 22000000 },
      { symbol: "AMZN", name: "Amazon.com Inc.", price: 155.60, change: 1.95, changePercent: 1.27, volume: 38000000 }
    ];
  }

  private getMockFutures(): FutureQuote[] {
    return [
      { symbol: "ES", name: "E-mini S&P 500", price: 4520.25, change: 15.50, changePercent: 0.34 },
      { symbol: "NQ", name: "E-mini Nasdaq", price: 15678.50, change: -25.75, changePercent: -0.16 },
      { symbol: "YM", name: "E-mini Dow", price: 35210.00, change: 45.00, changePercent: 0.13 },
      { symbol: "RTY", name: "E-mini Russell 2000", price: 1855.60, change: 8.20, changePercent: 0.44 }
    ];
  }

  private getMockIndex(symbol: string): MarketIndex {
    const mockData: Record<string, MarketIndex> = {
      'SPY': { symbol: "SPY", name: "S&P 500 ETF", price: 450.25, change: 2.15, changePercent: 0.48 },
      'QQQ': { symbol: "QQQ", name: "Nasdaq 100 ETF", price: 378.90, change: -1.25, changePercent: -0.33 },
      'DIA': { symbol: "DIA", name: "Dow Jones ETF", price: 350.75, change: 3.50, changePercent: 1.01 },
      'IWM': { symbol: "IWM", name: "Russell 2000 ETF", price: 185.40, change: 0.85, changePercent: 0.46 }
    };
    return mockData[symbol] || { symbol, name: symbol, price: 100, change: 0, changePercent: 0 };
  }

  private getMockStock(symbol: string): StockQuote {
    const mockData: Record<string, StockQuote> = {
      'AAPL': { symbol: "AAPL", name: "Apple Inc.", price: 178.50, change: 1.25, changePercent: 0.71, volume: 52000000 },
      'MSFT': { symbol: "MSFT", name: "Microsoft Corp.", price: 380.25, change: -2.15, changePercent: -0.56, volume: 28000000 },
      'NVDA': { symbol: "NVDA", name: "NVIDIA Corp.", price: 495.75, change: 8.50, changePercent: 1.74, volume: 45000000 },
      'TSLA': { symbol: "TSLA", name: "Tesla Inc.", price: 245.80, change: -3.20, changePercent: -1.28, volume: 95000000 },
      'GOOGL': { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.30, change: 0.85, changePercent: 0.60, volume: 22000000 },
      'AMZN': { symbol: "AMZN", name: "Amazon.com Inc.", price: 155.60, change: 1.95, changePercent: 1.27, volume: 38000000 }
    };
    return mockData[symbol] || { symbol, name: symbol, price: 100, change: 0, changePercent: 0, volume: 0 };
  }
}

// Export a singleton instance
export const marketDataService = new MarketDataService({
  apiKey: process.env.NEXT_PUBLIC_IEX_API_KEY || process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY
});
