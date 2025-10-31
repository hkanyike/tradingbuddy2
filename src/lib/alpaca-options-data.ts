// Real-time options data from Alpaca
// https://docs.alpaca.markets/docs/options-trading

export interface AlpacaOptionsChain {
  symbol: string;
  contracts: AlpacaOptionsContract[];
  lastUpdated: number;
}

export interface AlpacaOptionsContract {
  symbol: string; // e.g., "AAPL251219C00150000"
  underlying: string; // e.g., "AAPL"
  strikePrice: number;
  expirationDate: string;
  optionType: 'call' | 'put';
  lastPrice: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface AlpacaStockQuote {
  symbol: string;
  price: number;
  bidPrice: number;
  askPrice: number;
  timestamp: number;
}

class AlpacaOptionsDataService {
  private apiKey: string | null = null;
  private secretKey: string | null = null;
  private baseUrl = 'https://paper-api.alpaca.markets';
  
  constructor() {
    // In production, get from environment variables
    this.apiKey = process.env.ALPACA_API_KEY || null;
    this.secretKey = process.env.ALPACA_API_SECRET || null; // Fixed: was ALPACA_SECRET_KEY
  }

  /**
   * Check if Alpaca credentials are configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.secretKey);
  }

  /**
   * Get real-time stock quote from Alpaca
   */
  async getStockQuote(symbol: string): Promise<AlpacaStockQuote | null> {
    if (!this.isConfigured()) {
      console.warn('Alpaca not configured - returning null');
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/v2/stocks/${symbol}/quotes/latest`,
        {
          headers: {
            'APCA-API-KEY-ID': this.apiKey!,
            'APCA-API-SECRET-KEY': this.secretKey!,
          },
        }
      );

      if (!response.ok) {
        console.error(`Alpaca API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      return {
        symbol,
        price: (data.quote.bp + data.quote.ap) / 2, // Mid price
        bidPrice: data.quote.bp,
        askPrice: data.quote.ap,
        timestamp: new Date(data.quote.t).getTime()
      };
    } catch (error) {
      console.error('Error fetching stock quote from Alpaca:', error);
      return null;
    }
  }

  /**
   * Get options chain from Alpaca
   * Note: Alpaca's options data API is available on paper/live trading accounts
   */
  async getOptionsChain(
    underlying: string,
    expirationDate?: string
  ): Promise<AlpacaOptionsChain | null> {
    if (!this.isConfigured()) {
      console.warn('Alpaca not configured - returning null');
      return null;
    }

    try {
      // Alpaca options snapshots endpoint
      const url = new URL(`${this.baseUrl}/v1beta1/options/snapshots/${underlying}`);
      if (expirationDate) {
        url.searchParams.append('expiration_date', expirationDate);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'APCA-API-KEY-ID': this.apiKey!,
          'APCA-API-SECRET-KEY': this.secretKey!,
        },
      });

      if (!response.ok) {
        console.error(`Alpaca options API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      // Transform Alpaca format to our format
      const contracts: AlpacaOptionsContract[] = (data.snapshots || []).map((snap: any) => ({
        symbol: snap.symbol,
        underlying,
        strikePrice: snap.strike_price,
        expirationDate: snap.expiration_date,
        optionType: snap.type === 'call' ? 'call' : 'put',
        lastPrice: snap.latest_quote?.ap || 0,
        bid: snap.latest_quote?.bp || 0,
        ask: snap.latest_quote?.ap || 0,
        volume: snap.volume || 0,
        openInterest: snap.open_interest || 0,
        impliedVolatility: snap.implied_volatility || 0,
        delta: snap.greeks?.delta || 0,
        gamma: snap.greeks?.gamma || 0,
        theta: snap.greeks?.theta || 0,
        vega: snap.greeks?.vega || 0,
        rho: snap.greeks?.rho || 0
      }));

      return {
        symbol: underlying,
        contracts,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Error fetching options chain from Alpaca:', error);
      return null;
    }
  }

  /**
   * Find specific contract in options chain
   */
  async getSpecificContract(
    underlying: string,
    strikePrice: number,
    expirationDate: string,
    optionType: 'call' | 'put'
  ): Promise<AlpacaOptionsContract | null> {
    const chain = await this.getOptionsChain(underlying, expirationDate);
    
    if (!chain) return null;

    return chain.contracts.find(c =>
      c.strikePrice === strikePrice &&
      c.expirationDate === expirationDate &&
      c.optionType === optionType
    ) || null;
  }
}

// Singleton instance
export const alpacaOptionsData = new AlpacaOptionsDataService();

/**
 * Data source indicator for transparency
 */
export interface DataSourceInfo {
  stockPrice: 'alpaca-live' | 'alpaca-delayed' | 'estimated';
  contractPrice: 'alpaca-live' | 'estimated';
  greeks: 'alpaca-live' | 'calculated';
  impliedVolatility: 'alpaca-live' | 'estimated';
  mlPrediction: 'trained-model' | 'simulated';
}

export function getDataSourceInfo(alpacaConfigured: boolean): DataSourceInfo {
  if (alpacaConfigured) {
    return {
      stockPrice: 'alpaca-live',
      contractPrice: 'alpaca-live',
      greeks: 'alpaca-live',
      impliedVolatility: 'alpaca-live',
      mlPrediction: 'simulated' // Until we train real models
    };
  } else {
    return {
      stockPrice: 'estimated',
      contractPrice: 'estimated',
      greeks: 'calculated',
      impliedVolatility: 'estimated',
      mlPrediction: 'simulated'
    };
  }
}

