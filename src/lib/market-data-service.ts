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
  private polygonKey: string | null = null;
  private alphaVantageKey: string | null = null;

  constructor(config: MarketDataConfig = {}) {
    this.config = {
      baseUrl: 'https://api.polygon.io',
      ...config
    };
    
    // Load API keys from environment
    this.polygonKey = process.env.POLYGON_API_KEY || null;
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY || null;
    
    console.log('Polygon API configured:', !!this.polygonKey);
    console.log('Alpha Vantage API configured:', !!this.alphaVantageKey);
  }

  // Get real market indexes data
  async getMarketIndexes(): Promise<MarketIndex[]> {
    try {
      const symbols = ['SPY', 'QQQ', 'DIA', 'IWM'];
      const indexes: MarketIndex[] = [];

      // Try Polygon first
      if (this.polygonKey) {
        for (const symbol of symbols) {
          try {
            const response = await fetch(
              `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${this.polygonKey}`
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data.results && data.results[0]) {
                const result = data.results[0];
                const change = result.c - result.o;
                const changePercent = (change / result.o) * 100;
                indexes.push({
                  symbol,
                  name: this.getIndexName(symbol),
                  price: result.c,
                  change,
                  changePercent
                });
                continue;
              }
            }
          } catch (error) {
            console.warn(`Polygon failed for ${symbol}:`, error);
          }
        }
        
        if (indexes.length > 0) {
          console.log(`✅ Fetched ${indexes.length} indexes from Polygon`);
          return indexes;
        }
      }

      // Try Alpha Vantage if Polygon fails
      if (this.alphaVantageKey) {
        for (const symbol of symbols) {
          try {
            const response = await fetch(
              `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageKey}`
            );
            
            if (response.ok) {
              const data = await response.json();
              const quote = data['Global Quote'];
              if (quote) {
                indexes.push({
                  symbol,
                  name: this.getIndexName(symbol),
                  price: parseFloat(quote['05. price']),
                  change: parseFloat(quote['09. change']),
                  changePercent: parseFloat(quote['10. change percent'].replace('%', ''))
                });
                continue;
              }
            }
          } catch (error) {
            console.warn(`Alpha Vantage failed for ${symbol}:`, error);
          }
        }
        
        if (indexes.length > 0) {
          console.log(`✅ Fetched ${indexes.length} indexes from Alpha Vantage`);
          return indexes;
        }
      }

      // Fallback to mock data
      console.log('⚠️ No market data APIs configured, using mock data');
      return this.getMockIndexes();
    } catch (error) {
      console.error('Error fetching market indexes:', error);
      return this.getMockIndexes();
    }
  }
  
  private getIndexName(symbol: string): string {
    const names: Record<string, string> = {
      'SPY': 'S&P 500',
      'QQQ': 'Nasdaq 100',
      'DIA': 'Dow Jones',
      'IWM': 'Russell 2000'
    };
    return names[symbol] || symbol;
  }

  // Get real stock quotes
  async getStockQuotes(symbols: string[]): Promise<StockQuote[]> {
    try {
      const quotes: StockQuote[] = [];

      // Try Polygon first
      if (this.polygonKey) {
        for (const symbol of symbols) {
          try {
            const response = await fetch(
              `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${this.polygonKey}`
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data.results && data.results[0]) {
                const result = data.results[0];
                const change = result.c - result.o;
                const changePercent = (change / result.o) * 100;
                quotes.push({
                  symbol,
                  name: symbol,
                  price: result.c,
                  change,
                  changePercent,
                  volume: result.v
                });
                continue;
              }
            }
          } catch (error) {
            console.warn(`Polygon failed for ${symbol}:`, error);
          }
        }
        
        if (quotes.length > 0) {
          console.log(`✅ Fetched ${quotes.length} quotes from Polygon`);
          return quotes;
        }
      }

      // Try Alpha Vantage if Polygon fails
      if (this.alphaVantageKey) {
        for (const symbol of symbols) {
          try {
            const response = await fetch(
              `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageKey}`
            );
            
            if (response.ok) {
              const data = await response.json();
              const quote = data['Global Quote'];
              if (quote) {
                quotes.push({
                  symbol,
                  name: symbol,
                  price: parseFloat(quote['05. price']),
                  change: parseFloat(quote['09. change']),
                  changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
                  volume: parseInt(quote['06. volume'])
                });
                continue;
              }
            }
          } catch (error) {
            console.warn(`Alpha Vantage failed for ${symbol}:`, error);
          }
        }
        
        if (quotes.length > 0) {
          console.log(`✅ Fetched ${quotes.length} quotes from Alpha Vantage`);
          return quotes;
        }
      }

      // Fallback to mock data
      console.log('⚠️ No market data APIs configured, using mock data');
      return symbols.map(s => this.getMockStock(s));
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
