/**
 * Alpaca Market Data Service
 * Fetches real-time and historical options chains, quotes, and underlying data
 */

const ALPACA_BASE_URL = process.env.ALPACA_DATA_URL || "https://data.alpaca.markets";
const ALPACA_API_KEY = process.env.ALPACA_API_KEY || "";
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY || "";

interface AlpacaOptionsChain {
  symbol: string;
  underlying_symbol: string;
  expiration_date: string;
  strike_price: number;
  option_type: "call" | "put";
  bid: number;
  ask: number;
  last: number;
  volume: number;
  open_interest: number;
  implied_volatility?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
}

interface AlpacaOptionsSnapshot {
  snapshots: {
    [symbol: string]: {
      latestTrade: {
        t: string;
        x: string;
        p: number;
        s: number;
        c: string[];
        i: number;
        z: string;
      };
      latestQuote: {
        t: string;
        ax: string;
        ap: number;
        as: number;
        bx: string;
        bp: number;
        bs: number;
        c: string[];
      };
      minuteBar?: {
        t: string;
        o: number;
        h: number;
        l: number;
        c: number;
        v: number;
        n: number;
        vw: number;
      };
      dailyBar?: {
        t: string;
        o: number;
        h: number;
        l: number;
        c: number;
        v: number;
        n: number;
        vw: number;
      };
      prevDailyBar?: {
        t: string;
        o: number;
        h: number;
        l: number;
        c: number;
        v: number;
        n: number;
        vw: number;
      };
      impliedVolatility?: number;
      greeks?: {
        delta: number;
        gamma: number;
        theta: number;
        vega: number;
        rho: number;
      };
    };
  };
}

/**
 * Fetch options chain for a given underlying symbol
 */
export async function fetchOptionsChain(
  underlyingSymbol: string,
  expirationDate?: string
): Promise<AlpacaOptionsChain[]> {
  try {
    const url = new URL(`${ALPACA_BASE_URL}/v1beta1/options/snapshots/${underlyingSymbol}`);
    
    if (expirationDate) {
      url.searchParams.append("expiration_date", expirationDate);
    }

    const response = await fetch(url.toString(), {
      headers: {
        "APCA-API-KEY-ID": ALPACA_API_KEY,
        "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Alpaca API error: ${response.status} ${response.statusText}`);
    }

    const data: AlpacaOptionsSnapshot = await response.json();
    
    // Transform Alpaca data to our standard format
    const optionsChain: AlpacaOptionsChain[] = [];
    
    for (const [symbol, snapshot] of Object.entries(data.snapshots)) {
      // Parse option symbol (format: AAPL230120C00150000)
      const optionMatch = symbol.match(/^([A-Z]+)(\d{6})([CP])(\d{8})$/);
      if (!optionMatch) continue;

      const [, underlying, expDate, optionType, strikeStr] = optionMatch;
      const strike = parseInt(strikeStr) / 1000;
      
      // Format expiration date from YYMMDD to YYYY-MM-DD
      const year = "20" + expDate.slice(0, 2);
      const month = expDate.slice(2, 4);
      const day = expDate.slice(4, 6);
      const formattedExpDate = `${year}-${month}-${day}`;

      optionsChain.push({
        symbol,
        underlying_symbol: underlying,
        expiration_date: formattedExpDate,
        strike_price: strike,
        option_type: optionType === "C" ? "call" : "put",
        bid: snapshot.latestQuote?.bp || 0,
        ask: snapshot.latestQuote?.ap || 0,
        last: snapshot.latestTrade?.p || 0,
        volume: snapshot.latestTrade?.s || 0,
        open_interest: 0, // Not directly provided by Alpaca snapshots
        implied_volatility: snapshot.impliedVolatility,
        delta: snapshot.greeks?.delta,
        gamma: snapshot.greeks?.gamma,
        theta: snapshot.greeks?.theta,
        vega: snapshot.greeks?.vega,
        rho: snapshot.greeks?.rho,
      });
    }

    return optionsChain;
  } catch (error) {
    console.error("Error fetching options chain from Alpaca:", error);
    throw error;
  }
}

/**
 * Fetch latest quote for underlying stock
 */
export async function fetchUnderlyingQuote(symbol: string) {
  try {
    const url = `${ALPACA_BASE_URL}/v2/stocks/${symbol}/snapshot`;

    const response = await fetch(url, {
      headers: {
        "APCA-API-KEY-ID": ALPACA_API_KEY,
        "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Alpaca API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      symbol,
      price: data.latestTrade?.p || 0,
      bid: data.latestQuote?.bp || 0,
      ask: data.latestQuote?.ap || 0,
      volume: data.dailyBar?.v || 0,
      timestamp: data.latestTrade?.t || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching underlying quote from Alpaca:", error);
    throw error;
  }
}

/**
 * Fetch historical bars for underlying
 */
export async function fetchHistoricalBars(
  symbol: string,
  timeframe: "1Min" | "5Min" | "15Min" | "1Hour" | "1Day" = "1Day",
  startDate: string,
  endDate?: string
) {
  try {
    const url = new URL(`${ALPACA_BASE_URL}/v2/stocks/${symbol}/bars`);
    url.searchParams.append("timeframe", timeframe);
    url.searchParams.append("start", startDate);
    if (endDate) {
      url.searchParams.append("end", endDate);
    }
    url.searchParams.append("limit", "10000");

    const response = await fetch(url.toString(), {
      headers: {
        "APCA-API-KEY-ID": ALPACA_API_KEY,
        "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Alpaca API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.bars || [];
  } catch (error) {
    console.error("Error fetching historical bars from Alpaca:", error);
    throw error;
  }
}

/**
 * Get available option contracts for a symbol
 */
export async function fetchOptionContracts(underlyingSymbol: string) {
  try {
    const url = `${ALPACA_BASE_URL}/v1beta1/options/contracts`;
    const params = new URLSearchParams({
      underlying_symbols: underlyingSymbol,
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        "APCA-API-KEY-ID": ALPACA_API_KEY,
        "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Alpaca API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.option_contracts || [];
  } catch (error) {
    console.error("Error fetching option contracts from Alpaca:", error);
    throw error;
  }
}