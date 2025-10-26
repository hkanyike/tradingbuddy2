/**
 * Black-Scholes Greeks Calculator
 * Calculates option Greeks (Delta, Gamma, Theta, Vega, Rho)
 */

// Standard normal cumulative distribution function
function normCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

// Standard normal probability density function
function normPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export interface GreeksInput {
  spotPrice: number;          // Current underlying price
  strikePrice: number;        // Option strike price
  timeToExpiry: number;       // Time to expiration in years
  volatility: number;         // Implied volatility (as decimal, e.g., 0.30 for 30%)
  riskFreeRate: number;       // Risk-free interest rate (as decimal, e.g., 0.05 for 5%)
  optionType: 'call' | 'put'; // Option type
}

export interface Greeks {
  delta: number;    // Rate of change of option price with respect to underlying price
  gamma: number;    // Rate of change of delta with respect to underlying price
  theta: number;    // Rate of change of option price with respect to time (per day)
  vega: number;     // Rate of change of option price with respect to volatility (per 1% change)
  rho: number;      // Rate of change of option price with respect to interest rate (per 1% change)
  price: number;    // Theoretical option price
}

export function calculateGreeks(input: GreeksInput): Greeks {
  const { spotPrice, strikePrice, timeToExpiry, volatility, riskFreeRate, optionType } = input;

  // Handle edge cases
  if (timeToExpiry <= 0) {
    const intrinsicValue = optionType === 'call' 
      ? Math.max(spotPrice - strikePrice, 0)
      : Math.max(strikePrice - spotPrice, 0);
    
    return {
      delta: optionType === 'call' ? (spotPrice > strikePrice ? 1 : 0) : (spotPrice < strikePrice ? -1 : 0),
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0,
      price: intrinsicValue,
    };
  }

  // Black-Scholes d1 and d2
  const sqrtT = Math.sqrt(timeToExpiry);
  const d1 = (Math.log(spotPrice / strikePrice) + (riskFreeRate + 0.5 * volatility * volatility) * timeToExpiry) / (volatility * sqrtT);
  const d2 = d1 - volatility * sqrtT;

  // Calculate price
  let price: number;
  let delta: number;
  let rho: number;

  if (optionType === 'call') {
    price = spotPrice * normCDF(d1) - strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normCDF(d2);
    delta = normCDF(d1);
    rho = strikePrice * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * normCDF(d2) / 100;
  } else {
    price = strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normCDF(-d2) - spotPrice * normCDF(-d1);
    delta = normCDF(d1) - 1;
    rho = -strikePrice * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * normCDF(-d2) / 100;
  }

  // Calculate Gamma (same for calls and puts)
  const gamma = normPDF(d1) / (spotPrice * volatility * sqrtT);

  // Calculate Theta (per day)
  const thetaAnnual = optionType === 'call'
    ? (-spotPrice * normPDF(d1) * volatility / (2 * sqrtT) - riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normCDF(d2))
    : (-spotPrice * normPDF(d1) * volatility / (2 * sqrtT) + riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normCDF(-d2));
  
  const theta = thetaAnnual / 365; // Convert to per-day

  // Calculate Vega (per 1% change in volatility)
  const vega = spotPrice * normPDF(d1) * sqrtT / 100;

  return {
    delta: Number(delta.toFixed(4)),
    gamma: Number(gamma.toFixed(4)),
    theta: Number(theta.toFixed(4)),
    vega: Number(vega.toFixed(4)),
    rho: Number(rho.toFixed(4)),
    price: Number(price.toFixed(2)),
  };
}

export interface PortfolioGreeks {
  netDelta: number;
  netGamma: number;
  netTheta: number;
  netVega: number;
  netRho: number;
}

export function calculatePortfolioGreeks(positions: Array<{
  quantity: number;
  greeks: Greeks;
}>): PortfolioGreeks {
  return positions.reduce(
    (acc, pos) => ({
      netDelta: acc.netDelta + pos.quantity * pos.greeks.delta,
      netGamma: acc.netGamma + pos.quantity * pos.greeks.gamma,
      netTheta: acc.netTheta + pos.quantity * pos.greeks.theta,
      netVega: acc.netVega + pos.quantity * pos.greeks.vega,
      netRho: acc.netRho + pos.quantity * pos.greeks.rho,
    }),
    { netDelta: 0, netGamma: 0, netTheta: 0, netVega: 0, netRho: 0 }
  );
}