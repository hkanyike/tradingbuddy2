import { useState, useEffect, useCallback } from "react";
import { calculateGreeks } from "@/lib/greeks-calculator";

interface Position {
  id: number;
  assetId: number;
  symbol?: string;
  positionType: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  strikePrice?: number;
  expirationDate?: string;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  iv?: number;
  unrealizedPnl: number;
  status: string;
}

interface UseLivePositionsOptions {
  initialPositions: Position[];
  refreshInterval?: number;
  enableLiveUpdates?: boolean;
}

interface UseLivePositionsReturn {
  positions: Position[];
  isLiveUpdating: boolean;
  toggleLiveUpdates: () => void;
  manualRefresh: () => void;
  lastUpdate: Date;
}

/**
 * Hook for managing live position updates with real-time Greeks calculations
 */
export function useLivePositions({
  initialPositions,
  refreshInterval = 5000,
  enableLiveUpdates = true,
}: UseLivePositionsOptions): UseLivePositionsReturn {
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [isLiveUpdating, setIsLiveUpdating] = useState(enableLiveUpdates);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  /**
   * Calculate live Greeks for a position
   */
  const calculateLiveGreeks = useCallback((position: Position, currentPrice: number): Position => {
    // For non-options positions, just update price and P&L
    if (!position.strikePrice || !position.expirationDate) {
      return {
        ...position,
        currentPrice,
        unrealizedPnl: (currentPrice - position.entryPrice) * position.quantity,
      };
    }

    // Calculate time to expiry in years
    const expiryDate = new Date(position.expirationDate);
    const now = new Date();
    const timeToExpiry = Math.max(
      (expiryDate.getTime() - now.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
      0.001 // Minimum 1 day
    );

    // Determine option type from position type
    const optionType = position.positionType.toLowerCase().includes("call") ? "call" : "put";

    // Calculate Greeks
    const greeks = calculateGreeks({
      spotPrice: currentPrice,
      strikePrice: position.strikePrice,
      timeToExpiry,
      riskFreeRate: 0.05,
      volatility: position.iv || 0.3,
      optionType,
    });

    // Calculate unrealized P&L (for options: (current - entry) * quantity * 100)
    const multiplier = position.strikePrice ? 100 : 1;
    const unrealizedPnl = (currentPrice - position.entryPrice) * position.quantity * multiplier;

    return {
      ...position,
      currentPrice,
      delta: greeks.delta,
      gamma: greeks.gamma,
      theta: greeks.theta,
      vega: greeks.vega,
      unrealizedPnl,
    };
  }, []);

  /**
   * Simulate live price updates (random walk)
   */
  const updatePositionsWithLivePrices = useCallback(() => {
    setPositions(prev =>
      prev.map(position => {
        // Simulate price movement (±0.5% random walk)
        const basePrice = position.currentPrice || position.entryPrice;
        const volatility = 0.01; // 1% volatility
        const priceChange = basePrice * (Math.random() * volatility * 2 - volatility);
        const newPrice = Math.max(0.01, basePrice + priceChange); // Prevent negative prices

        return calculateLiveGreeks(position, newPrice);
      })
    );
    setLastUpdate(new Date());
  }, [calculateLiveGreeks]);

  /**
   * Fetch fresh position data from API
   */
  const fetchPositions = useCallback(async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/positions/user/1/open", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPositions(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch positions:", error);
    }
  }, []);

  /**
   * Manual refresh trigger
   */
  const manualRefresh = useCallback(() => {
    fetchPositions();
  }, [fetchPositions]);

  /**
   * Toggle live updates on/off
   */
  const toggleLiveUpdates = useCallback(() => {
    setIsLiveUpdating(prev => !prev);
  }, []);

  // Live price update interval
  useEffect(() => {
    if (!isLiveUpdating) return;

    const priceInterval = setInterval(() => {
      updatePositionsWithLivePrices();
    }, 2000); // Update prices every 2 seconds

    return () => clearInterval(priceInterval);
  }, [isLiveUpdating, updatePositionsWithLivePrices]);

  // API data refresh interval
  useEffect(() => {
    if (!isLiveUpdating) return;

    const apiInterval = setInterval(() => {
      fetchPositions();
    }, refreshInterval);

    return () => clearInterval(apiInterval);
  }, [isLiveUpdating, refreshInterval, fetchPositions]);

  // Update positions when initialPositions change
  useEffect(() => {
    setPositions(initialPositions);
  }, [initialPositions]);

  return {
    positions,
    isLiveUpdating,
    toggleLiveUpdates,
    manualRefresh,
    lastUpdate,
  };
}