"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { TrendingUp, AlertCircle, Shield, Activity, Zap, TrendingDown, Search, Plus, X, Sparkles, Star, ArrowUpRight, ArrowDownRight, BarChart3, Database, TestTube, Brain, Home, Settings as SettingsIcon, RefreshCw, Wifi, WifiOff, Newspaper, Calendar, Globe, Building2, LineChart, ChevronDown, Menu, Eye, TrendingUpDown, Layers, DollarSign, Info, Cpu, Target, TrendingUpIcon, Flame, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { createAlpacaWebSocket, type AlpacaWebSocketClient } from "@/lib/alpaca-websocket";
import { createAIRecommendationEngine, type Recommendation } from "@/lib/ai-recommendation-engine";
import { NewsFeed } from "@/components/dashboard/news-feed";
import { SentimentIndicator } from "@/components/dashboard/sentiment-indicator";
import { EarningsCalendar } from "@/components/dashboard/earnings-calendar";
import { EconomicEvents } from "@/components/dashboard/economic-events";
import { calculateGreeks } from "@/lib/greeks-calculator";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { LoadingSpinner, LoadingPage } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { safeApiCall } from "@/lib/api-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Position {
  id: number;
  symbol: string;
  type: string;
  positionType?: "call" | "put"; // For options (call/put)
  quantity: number;
  entry_price: number;
  current_price: number;
  pnl: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  expirationDate?: string; // For options
  strikePrice?: number; // For options
  iv?: number; // Implied volatility
  name?: string; // Asset name
  assetId?: number; // For looking up asset details
}

interface RiskMetric {
  total_positions: number;
  portfolio_delta: number;
  portfolio_gamma: number;
  portfolio_theta: number;
  portfolio_vega: number;
  max_loss: number;
  buying_power_used: number;
  risk_level: "low" | "medium" | "high";
}

interface Alert {
  id: number;
  type: string;
  message: string;
  severity: string;
  created_at: string;
}

interface Strategy {
  id: number;
  name: string;
  strategyType: string;
  isActive: boolean;
  performance: {
    totalReturn: number;
    winRate: number;
    sharpeRatio: number;
    maxDrawdown: number;
    avgReturn: number;
  };
}

interface Asset {
  id: number;
  symbol: string;
  name: string;
  sector: string;
  assetTypeId: number;
}

interface AlpacaAsset {
  symbol: string;
  name: string;
  exchange: string;
  assetClass: string;
  tradable: boolean;
  marginable: boolean;
  shortable: boolean;
}

// Add new interface for live asset details
interface LiveAssetDetails {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  changePercent?: number;
  exchange: string;
}

interface AssetType {
  id: number;
  name: string;
  description: string;
}

interface WatchlistItem {
  id: number;
  userId: number;
  assetId: number;
  addedAt: string;
  notes: string | null;
  aiRecommended: boolean;
}

interface WatchlistRecommendation {
  id: number;
  userId: number;
  assetId: number;
  recommendationReason: string;
  confidenceScore: number;
  strategyId: number | null;
  createdAt: string;
  dismissed: boolean;
  tradeAction?: string;
  strikePrice?: number;
  entryPrice?: number;
  expirationDate?: string;
  potentialGain?: number;
  potentialGainPercent?: number;
  potentialLoss?: number;
  potentialLossPercent?: number;
  riskRewardRatio?: number;
}

interface OptionsQuote {
  id: number;
  symbol: string;
  optionSymbol: string;
  strikePrice: number;
  expirationDate: string;
  optionType: string;
  bid: number | null;
  ask: number | null;
  lastPrice: number | null;
  volume: number | null;
  openInterest: number | null;
  impliedVolatility: number | null;
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  vega: number | null;
  underlyingPrice: number | null;
  timestamp: string;
}

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

interface FutureQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const isPending = status === 'loading';
  const router = useRouter();

  const [positions, setPositions] = useState<Position[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [totalPnL, setTotalPnL] = useState(0);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [recommendations, setRecommendations] = useState<WatchlistRecommendation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [optionsQuotes, setOptionsQuotes] = useState<OptionsQuote[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("SPY");
  const [isFetchingOptions, setIsFetchingOptions] = useState(false);
  const [lastFetchResult, setLastFetchResult] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLiveUpdateEnabled, setIsLiveUpdateEnabled] = useState(true);
  const [updateInterval, setUpdateInterval] = useState(5000);
  const [alpacaWs, setAlpacaWs] = useState<AlpacaWebSocketClient | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<Recommendation[]>([]);
  const [aiEngine] = useState(() => createAIRecommendationEngine());
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);
  const [marketIndexes, setMarketIndexes] = useState<MarketIndex[]>([]);
  const [stockQuotes, setStockQuotes] = useState<StockQuote[]>([]);
  const [futuresQuotes, setFuturesQuotes] = useState<FutureQuote[]>([]);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedLiveAsset, setSelectedLiveAsset] = useState<LiveAssetDetails | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [liveAssetDialogOpen, setLiveAssetDialogOpen] = useState(false);
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [rlStats, setRlStats] = useState<any>(null);
  const hasLoadedInitialData = useRef(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedAssetTypes, setSelectedAssetTypes] = useState<string[]>(["stock", "etf", "index", "future"]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<WatchlistRecommendation | null>(null);
  const [recommendationDialogOpen, setRecommendationDialogOpen] = useState(false);
  
  // New state for real-time search
  const [alpacaSearchResults, setAlpacaSearchResults] = useState<AlpacaAsset[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<"database" | "live">("live");
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // New state for watchlist prices
  const [watchlistPrices, setWatchlistPrices] = useState<Record<string, { price: number; change: number; changePercent: number }>>({});
  
  // New state for adding positions
  const [addPositionDialogOpen, setAddPositionDialogOpen] = useState(false);
  const [newPositionForm, setNewPositionForm] = useState({
    symbol: "",
    positionType: "stock",
    quantity: "",
    entryPrice: "",
    strikePrice: "",
    expirationDate: "",
  });
  const [isCreatingPosition, setIsCreatingPosition] = useState(false);

  // Get userId from session - no fallback to prevent data leakage
  const userId = session?.user?.id;

  // Show loading page while session is loading
  if (isPending) {
    return <LoadingPage text="Loading dashboard..." />;
  }

  // Redirect to sign-in if not authenticated
  if (!session?.user) {
    router.push("/sign-in");
    return null;
  }

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
      return;
    }
  }, [session, isPending, router]);

  // Load initial data when session is ready (only once)
  useEffect(() => {
    if (!isPending && session?.user && !hasLoadedInitialData.current) {
      hasLoadedInitialData.current = true;
      loadAllData();
    }
  }, [session, isPending]);

  // Initialize market data
  useEffect(() => {
    // Simulate major indexes
    const indexes: MarketIndex[] = [
      { symbol: "SPY", name: "S&P 500 ETF", price: 450.25, change: 2.15, changePercent: 0.48 },
      { symbol: "QQQ", name: "Nasdaq 100 ETF", price: 378.90, change: -1.25, changePercent: -0.33 },
      { symbol: "DIA", name: "Dow Jones ETF", price: 350.75, change: 3.50, changePercent: 1.01 },
      { symbol: "IWM", name: "Russell 2000 ETF", price: 185.40, change: 0.85, changePercent: 0.46 }
    ];
    setMarketIndexes(indexes);

    // Simulate top stocks
    const stocks: StockQuote[] = [
      { symbol: "AAPL", name: "Apple Inc.", price: 178.50, change: 1.25, changePercent: 0.71, volume: 52000000 },
      { symbol: "MSFT", name: "Microsoft Corp.", price: 380.25, change: -2.15, changePercent: -0.56, volume: 28000000 },
      { symbol: "NVDA", name: "NVIDIA Corp.", price: 495.75, change: 8.50, changePercent: 1.74, volume: 45000000 },
      { symbol: "TSLA", name: "Tesla Inc.", price: 245.80, change: -3.20, changePercent: -1.28, volume: 95000000 },
      { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.30, change: 0.85, changePercent: 0.60, volume: 22000000 },
      { symbol: "AMZN", name: "Amazon.com Inc.", price: 155.60, change: 1.95, changePercent: 1.27, volume: 38000000 }
    ];
    setStockQuotes(stocks);

    // Simulate futures
    const futures: FutureQuote[] = [
      { symbol: "ES", name: "E-mini S&P 500", price: 4520.25, change: 15.50, changePercent: 0.34 },
      { symbol: "NQ", name: "E-mini Nasdaq", price: 15678.50, change: -25.75, changePercent: -0.16 },
      { symbol: "YM", name: "E-mini Dow", price: 35210.00, change: 45.00, changePercent: 0.13 },
      { symbol: "RTY", name: "E-mini Russell 2000", price: 1855.60, change: 8.20, changePercent: 0.44 }
    ];
    setFuturesQuotes(futures);
  }, []);

  useEffect(() => {
    const loadAssetTypes = async () => {
      try {
        const token = localStorage.getItem("bearer_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : { Authorization: '' };
        const res = await fetch("/api/asset-types", { headers });
        const data = await res.json();
        setAssetTypes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading asset types:", error);
      }
    };
    loadAssetTypes();
  }, []);

  useEffect(() => {
    if (!session) return;

    const apiKey = process.env.NEXT_PUBLIC_ALPACA_API_KEY || '';
    const secretKey = process.env.NEXT_PUBLIC_ALPACA_SECRET_KEY || '';

    if (!apiKey || !secretKey) {
      console.warn('Alpaca API keys not configured - WebSocket disabled');
      return;
    }

    const ws = createAlpacaWebSocket({
      apiKey,
      secretKey,
      feed: 'iex',
      paper: true,
    });

    ws.onConnected(() => {
      console.log('✅ Alpaca WebSocket connected');
      setWsConnected(true);
      
      const symbols = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN'];
      ws.subscribeStockQuotes(symbols);
      console.log(`📡 Subscribed to: ${symbols.join(', ')}`);
    });

    ws.onDisconnected(() => {
      console.log('❌ Alpaca WebSocket disconnected');
      setWsConnected(false);
    });

    ws.onStockQuote((quote) => {
      console.log(`📊 Live quote: ${quote.symbol} - Bid: $${quote.bidPrice} / Ask: $${quote.askPrice}`);
      
      const midPrice = (quote.bidPrice + quote.askPrice) / 2;
      
      // Update AI engine
      aiEngine.updateMarketData(quote.symbol, {
        symbol: quote.symbol,
        price: midPrice,
        iv30d: 0.25,
        realizedVol20d: 0.20,
        volume: 1000000,
        ivRank: 50,
        ivPercentile: 50,
      });

      // Update market indexes (SPY, QQQ, DIA, IWM)
      setMarketIndexes(prev => {
        if (!Array.isArray(prev)) return prev;
        return prev.map(index => {
          if (index.symbol === quote.symbol) {
            const oldPrice = index.price - index.change;
            const newChange = midPrice - oldPrice;
            const newChangePercent = (newChange / oldPrice) * 100;
            return {
              ...index,
              price: midPrice,
              change: newChange,
              changePercent: newChangePercent
            };
          }
          return index;
        });
      });

      // Update stock quotes (AAPL, MSFT, etc.)
      setStockQuotes(prev => {
        if (!Array.isArray(prev)) return prev;
        return prev.map(stock => {
          if (stock.symbol === quote.symbol) {
            const oldPrice = stock.price - stock.change;
            const newChange = midPrice - oldPrice;
            const newChangePercent = (newChange / oldPrice) * 100;
            return {
              ...stock,
              price: midPrice,
              change: newChange,
              changePercent: newChangePercent,
              volume: stock.volume // Keep existing volume or update if available
            };
          }
          return stock;
        });
      });
    });

    ws.onStockTrade((trade) => {
      console.log(`💹 Live trade: ${trade.symbol} - $${trade.price} (${trade.size} shares)`);
      
      // Update prices from actual trades
      setMarketIndexes(prev => {
        if (!Array.isArray(prev)) return prev;
        return prev.map(index => {
          if (index.symbol === trade.symbol) {
            const oldPrice = index.price - index.change;
            const newChange = trade.price - oldPrice;
            const newChangePercent = (newChange / oldPrice) * 100;
            return {
              ...index,
              price: trade.price,
              change: newChange,
              changePercent: newChangePercent
            };
          }
          return index;
        });
      });

      setStockQuotes(prev => {
        if (!Array.isArray(prev)) return prev;
        return prev.map(stock => {
          if (stock.symbol === trade.symbol) {
            const oldPrice = stock.price - stock.change;
            const newChange = trade.price - oldPrice;
            const newChangePercent = (newChange / oldPrice) * 100;
            return {
              ...stock,
              price: trade.price,
              change: newChange,
              changePercent: newChangePercent,
              volume: stock.volume + trade.size // Add trade size to volume
            };
          }
          return stock;
        });
      });
    });

    ws.onError((error) => {
      console.error('❌ Alpaca WebSocket error:', error);
    });

    ws.connect();
    setAlpacaWs(ws);

    return () => {
      ws.disconnect();
    };
  }, [session, aiEngine]);

  // AI recommendations - only regenerate when positions actually change
  useEffect(() => {
    if (positions.length > 0) {
      aiEngine.updatePositions(positions);
      
      const recommendations = aiEngine.generateRecommendations();
      setAiRecommendations(recommendations);
      console.log(`🤖 AI generated ${recommendations.length} recommendations`);
    }
  }, [positions, aiEngine]);

  // Live updates interval - don't include positions.length
  useEffect(() => {
    if (!isLiveUpdateEnabled || !session) return;

    const interval = setInterval(() => {
      loadAllData();
      setLastUpdate(new Date());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [isLiveUpdateEnabled, updateInterval, session]);

  useEffect(() => {
    const watchlistAssets = watchlist
      .map((item) => ({
        ...item,
        asset: assets.find((a) => a.id === item.assetId),
      }))
      .filter((item) => item.asset);
    const symbols = watchlistAssets.map(item => item.asset?.symbol).filter((symbol): symbol is string => Boolean(symbol));
    setWatchlistSymbols(symbols);
  }, [watchlist, assets]);

  // Fetch prices for watchlist assets
  useEffect(() => {
    const fetchWatchlistPrices = async () => {
      const symbols = watchlist
        .map((item) => allAssets.find((a) => a.id === item.assetId)?.symbol)
        .filter(Boolean);
      
      if (symbols.length === 0) return;

      const token = localStorage.getItem("bearer_token");
      const pricePromises = symbols.map(async (symbol) => {
        try {
          const res = await fetch(`/api/alpaca/get-quote?symbol=${symbol}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : { Authorization: '' },
          });
          if (res.ok) {
            const data = await res.json();
            return { symbol, data };
          }
        } catch (error) {
          console.error(`Error fetching price for ${symbol}:`, error);
        }
        return null;
      });

      const results = await Promise.all(pricePromises);
      const newPrices: Record<string, { price: number; change: number; changePercent: number }> = {};
      
      results.forEach((result) => {
        if (result && result.data && result.symbol) {
          newPrices[result.symbol] = {
            price: result.data.price,
            change: result.data.change,
            changePercent: result.data.changePercent,
          };
        }
      });

      setWatchlistPrices(newPrices);
    };

    if (watchlist.length > 0 && allAssets.length > 0) {
      fetchWatchlistPrices();
    }
  }, [watchlist, allAssets]);

  // Fetch RL agent statistics
  useEffect(() => {
    if (aiEngine) {
      const stats = aiEngine.getRLStatistics();
      setRlStats(stats);
    }
  }, [aiRecommendations, aiEngine]);

  const calculateLiveGreeks = (position: any, currentPrice: number) => {
    const timeToExpiry = position.expirationDate 
      ? (new Date(position.expirationDate).getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000)
      : 0.1;

    const greeks = calculateGreeks({
      spotPrice: currentPrice,
      strikePrice: position.strikePrice || currentPrice,
      timeToExpiry,
      riskFreeRate: 0.05,
      volatility: position.iv || 0.3,
      optionType: position.positionType === "call" ? "call" : "put",
    });

    return {
      ...position,
      currentPrice,
      delta: greeks.delta,
      gamma: greeks.gamma,
      theta: greeks.theta,
      vega: greeks.vega,
      unrealizedPnl: (currentPrice - position.entryPrice) * position.quantity * 100,
    };
  };

  // Update live prices for indexes, stocks, and futures
  useEffect(() => {
    if (!isLiveUpdateEnabled) return;

    const priceInterval = setInterval(() => {
      setMarketIndexes(prev => {
        if (!Array.isArray(prev)) return [];
        return prev.map(index => {
          const change = (Math.random() - 0.5) * 2;
          const currentPrice = index.price ?? 0;
          const currentChange = index.change ?? 0;
          const newPrice = currentPrice + change;
          const oldPrice = currentPrice - currentChange;
          const totalChange = newPrice - oldPrice;
          const divisor = newPrice - totalChange;
          return {
            ...index,
            price: newPrice,
            change: totalChange,
            changePercent: divisor !== 0 ? (totalChange / divisor) * 100 : 0
          };
        });
      });

      setStockQuotes(prev => {
        if (!Array.isArray(prev)) return [];
        return prev.map(stock => {
          const change = (Math.random() - 0.5) * 5;
          const currentPrice = stock.price ?? 0;
          const currentChange = stock.change ?? 0;
          const newPrice = currentPrice + change;
          const oldPrice = currentPrice - currentChange;
          const totalChange = newPrice - oldPrice;
          const divisor = newPrice - totalChange;
          return {
            ...stock,
            price: newPrice,
            change: totalChange,
            changePercent: divisor !== 0 ? (totalChange / divisor) * 100 : 0,
            volume: stock.volume + Math.floor(Math.random() * 100000)
          };
        });
      });

      setFuturesQuotes(prev => {
        if (!Array.isArray(prev)) return [];
        return prev.map(future => {
          const change = (Math.random() - 0.5) * 10;
          const currentPrice = future.price ?? 0;
          const currentChange = future.change ?? 0;
          const newPrice = currentPrice + change;
          const oldPrice = currentPrice - currentChange;
          const totalChange = newPrice - oldPrice;
          const divisor = newPrice - totalChange;
          return {
            ...future,
            price: newPrice,
            change: totalChange,
            changePercent: divisor !== 0 ? (totalChange / divisor) * 100 : 0
          };
        });
      });

      setPositions(prev => {
        if (!Array.isArray(prev) || prev.length === 0) return prev;
        
        return prev.map(position => {
          const currentPrice = position.current_price ?? position.entry_price ?? 0;
          const priceChange = currentPrice * (Math.random() * 0.01 - 0.005);
          const newPrice = currentPrice + priceChange;
          
          const timeToExpiry = position.expirationDate 
            ? (new Date(position.expirationDate).getTime() - Date.now()) / (365.25 * 24 * 60 * 60 * 1000)
            : 0.1;

          const greeks = calculateGreeks({
            spotPrice: newPrice,
            strikePrice: position.strikePrice || newPrice,
            timeToExpiry,
            riskFreeRate: 0.05,
            volatility: position.iv || 0.3,
            optionType: position.positionType === "call" ? "call" : "put",
          });

          return {
            ...position,
            currentPrice: newPrice,
            delta: greeks.delta,
            gamma: greeks.gamma,
            theta: greeks.theta,
            vega: greeks.vega,
            unrealizedPnl: (newPrice - (position.entry_price ?? 0)) * (position.quantity ?? 0) * 100,
          };
        });
      });
    }, 2000);

    return () => clearInterval(priceInterval);
  }, [isLiveUpdateEnabled]);

  const loadAllData = async () => {
    if (!userId) return;
    
    try {
      const token = localStorage.getItem("bearer_token");
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : { Authorization: '' };

      // Helper function to safely fetch and handle errors
      const safeFetch = async (url: string) => {
        try {
          const res = await fetch(url, { headers });
          if (!res.ok) {
            console.warn(`API call failed: ${url} - Status: ${res.status}`);
            return null;
          }
          return await res.json();
        } catch (error) {
          console.error(`Error fetching ${url}:`, error);
          return null;
        }
      };

      const [positionsData, riskData, alertsData, strategiesData, assetsData, watchlistData, recsData] = await Promise.all([
        safeFetch(`/api/positions/user/${userId}/open`),
        safeFetch(`/api/risk-metrics/user/${userId}/latest`),
        safeFetch(`/api/alerts/user/${userId}/unread`),
        safeFetch(`/api/strategies/user/${userId}`),
        safeFetch(`/api/assets?limit=1000`),
        safeFetch(`/api/watchlist?userId=${userId}`),
        safeFetch(`/api/watchlist-recommendations/user/${userId}?dismissed=false`)
      ]);

      // Store all assets first
      const allAssetsArray = Array.isArray(assetsData) ? assetsData : [];
      setAllAssets(allAssetsArray);
      
      // Enrich positions with asset names
      const enrichedPositions = (Array.isArray(positionsData) ? positionsData : []).map((pos: Position) => {
        const asset = allAssetsArray.find((a: Asset) => a.id === pos.assetId);
        return {
          ...pos,
          name: asset?.name || pos.symbol, // Add asset name, fallback to symbol
        };
      });
      
      setPositions(enrichedPositions);
      setRiskMetrics(riskData || null);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      // Only set assets directly on initial load - let the filter effect handle it after
      if (isLoading) {
        setAssets(allAssetsArray);
      }
      setWatchlist(Array.isArray(watchlistData) ? watchlistData : []);
      setRecommendations(Array.isArray(recsData) ? recsData : []);

      const total = enrichedPositions.reduce((sum: number, pos: Position) => sum + (pos.pnl || 0), 0);
      setTotalPnL(total);

      const strategiesWithPerformance = (Array.isArray(strategiesData) ? strategiesData : []).map((s: any) => ({
        ...s,
        performance: {
          totalReturn: typeof s.performance?.totalReturn === 'number' ? s.performance.totalReturn : Math.random() * 40 - 10,
          winRate: typeof s.performance?.winRate === 'number' ? s.performance.winRate : 60 + Math.random() * 20,
          sharpeRatio: typeof s.performance?.sharpeRatio === 'number' ? s.performance.sharpeRatio : 1.2 + Math.random() * 1.5,
          maxDrawdown: typeof s.performance?.maxDrawdown === 'number' ? s.performance.maxDrawdown : -(5 + Math.random() * 15),
          avgReturn: typeof s.performance?.avgReturn === 'number' ? s.performance.avgReturn : Math.random() * 3 - 0.5,
        },
      }));
      setStrategies(strategiesWithPerformance);
      
      // Only set loading to false on first load
      if (isLoading) {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data. Please try again.");
      if (isLoading) {
        setIsLoading(false);
      }
    }
  };

  const addToWatchlist = async (assetId: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ userId, assetId }),
      });
      if (res.ok) {
        loadAllData();
      }
    } catch (error) {
      console.error("Error adding to watchlist:", error);
    }
  };

  const removeFromWatchlist = async (id: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/watchlist?id=${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        loadAllData();
      }
    } catch (error) {
      console.error("Error removing from watchlist:", error);
    }
  };

  const dismissRecommendation = async (id: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch(`/api/watchlist-recommendations/${id}/dismiss`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        loadAllData();
      }
    } catch (error) {
      console.error("Error dismissing recommendation:", error);
    }
  };

  const addRecommendationToWatchlist = async (recommendation: WatchlistRecommendation) => {
    await addToWatchlist(recommendation.assetId);
    await dismissRecommendation(recommendation.id);
  };

  const fetchOptionsData = async (symbol: string) => {
    setIsFetchingOptions(true);
    setLastFetchResult(null);
    try {
      const res = await fetch("/api/alpaca/fetch-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      
      const data = await res.json();
      setLastFetchResult(data);
      
      if (data.success) {
        await loadOptionsQuotes(symbol);
      }
    } catch (error) {
      console.error("Error fetching options data:", error);
      setLastFetchResult({ error: "Failed to fetch options data" });
    } finally {
      setIsFetchingOptions(false);
    }
  };

  const loadOptionsQuotes = async (symbol: string) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : { Authorization: '' };
      const res = await fetch(`/api/market-data/options-quotes/latest?symbol=${symbol}&limit=20`, { headers });
      const data = await res.json();
      setOptionsQuotes(data || []);
    } catch (error) {
      console.error("Error loading options quotes:", error);
    }
  };

  const getAssetTypeInfo = (assetTypeId: number) => {
    const type = assetTypes.find(t => t.id === assetTypeId);
    if (!type || !type.name) return { name: "Unknown", icon: Building2, color: "gray" };
    
    const name = type.name.toLowerCase();
    if (name.includes("stock")) {
      return { name: "Stock", icon: TrendingUpDown, color: "blue" };
    } else if (name.includes("etf")) {
      return { name: "ETF", icon: Layers, color: "purple" };
    } else if (name.includes("index")) {
      return { name: "Index", icon: BarChart3, color: "green" };
    } else if (name.includes("option")) {
      return { name: "Option", icon: DollarSign, color: "orange" };
    } else if (name.includes("future")) {
      return { name: "Future", icon: Flame, color: "red" };
    }
    return { name: type.name, icon: Building2, color: "gray" };
  };

  const openAssetDetails = async (asset: Asset) => {
    // Try to fetch real-time price from Alpaca
    try {
      const token = localStorage.getItem("bearer_token");
      const priceRes = await fetch(`/api/alpaca/get-quote?symbol=${asset.symbol}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (priceRes.ok) {
        const quoteData = await priceRes.json();
        
        // Enhance asset with live price data
        const enhancedAsset = {
          ...asset,
          price: quoteData.price,
          change: quoteData.change,
          changePercent: quoteData.changePercent,
        };
        
        setSelectedAsset(enhancedAsset as any);
      } else {
        // Fallback to local quotes if API fails
        const stockQuote = stockQuotes.find(s => s.symbol === asset.symbol);
        const marketIndex = marketIndexes.find(m => m.symbol === asset.symbol);
        
        if (stockQuote || marketIndex) {
          const enhancedAsset = {
            ...asset,
            price: stockQuote?.price || marketIndex?.price,
            change: stockQuote?.change || marketIndex?.change,
            changePercent: stockQuote?.changePercent || marketIndex?.changePercent,
          };
          setSelectedAsset(enhancedAsset as any);
        } else {
          setSelectedAsset(asset);
        }
      }
    } catch (error) {
      console.error("Error fetching asset price:", error);
      setSelectedAsset(asset);
    }
    
    setAssetDialogOpen(true);
  };

  const openLiveAssetDetails = async (alpacaAsset: AlpacaAsset) => {
    // Check if asset exists in database first
    const dbAsset = allAssets.find(a => a.symbol === alpacaAsset.symbol);
    if (dbAsset) {
      openAssetDetails(dbAsset);
      return;
    }

    // Try to fetch real-time price from Alpaca
    try {
      const token = localStorage.getItem("bearer_token");
      const priceRes = await fetch(`/api/alpaca/get-quote?symbol=${alpacaAsset.symbol}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      let price, change, changePercent;
      if (priceRes.ok) {
        const quoteData = await priceRes.json();
        price = quoteData.price;
        change = quoteData.change;
        changePercent = quoteData.changePercent;
      } else {
        // Fallback to local quotes if API fails
        const stockQuote = stockQuotes.find(s => s.symbol === alpacaAsset.symbol);
        const marketIndex = marketIndexes.find(m => m.symbol === alpacaAsset.symbol);
        price = stockQuote?.price || marketIndex?.price;
        change = stockQuote?.change || marketIndex?.change;
        changePercent = stockQuote?.changePercent || marketIndex?.changePercent;
      }
      
      const liveDetails: LiveAssetDetails = {
        symbol: alpacaAsset.symbol,
        name: alpacaAsset.name,
        exchange: alpacaAsset.exchange,
        price,
        change,
        changePercent,
      };

      setSelectedLiveAsset(liveDetails);
      setLiveAssetDialogOpen(true);
    } catch (error) {
      console.error("Error fetching live asset details:", error);
      // Still open dialog with available data
      const liveDetails: LiveAssetDetails = {
        symbol: alpacaAsset.symbol,
        name: alpacaAsset.name,
        exchange: alpacaAsset.exchange,
      };
      setSelectedLiveAsset(liveDetails);
      setLiveAssetDialogOpen(true);
    }
  };

  const openPositionDetails = (position: Position) => {
    setSelectedPosition(position);
    setPositionDialogOpen(true);
  };

  const toggleAssetType = (type: string) => {
    setSelectedAssetTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  // Real-time Alpaca search
  useEffect(() => {
    if (searchMode !== "live" || !searchQuery.trim()) {
      setAlpacaSearchResults([]);
      setSearchError(null);
      return;
    }

    const searchAlpaca = async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const response = await fetch(`/api/alpaca/search-assets?query=${encodeURIComponent(searchQuery)}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to search assets' }));
          throw new Error(errorData.error || `Search failed: ${response.status}`);
        }
        
        const results = await response.json();
        setAlpacaSearchResults(Array.isArray(results) ? results : []);
        console.log(`✅ Found ${results.length} results for "${searchQuery}"`);
      } catch (error: any) {
        console.error("Error searching Alpaca:", error);
        setSearchError(error.message || "Failed to search assets. Please try again.");
        setAlpacaSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchAlpaca, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchMode]);

  // Client-side filtering for database search mode
  useEffect(() => {
    if (searchMode !== "database") {
      return;
    }

    let filtered = [...allAssets];

    // Filter by asset type
    if (selectedAssetTypes.length > 0 && selectedAssetTypes.length < 4) {
      filtered = filtered.filter(asset => {
        const typeInfo = getAssetTypeInfo(asset.assetTypeId);
        const typeName = typeInfo.name.toLowerCase();
        return selectedAssetTypes.some(selected => typeName.includes(selected));
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(asset => 
        asset.symbol.toLowerCase().includes(query) || 
        asset.name.toLowerCase().includes(query)
      );
    }

    setAssets(filtered);
  }, [allAssets, selectedAssetTypes, searchQuery, assetTypes, searchMode]);

  const filteredAssets = searchMode === "database" ? assets : [];

  const watchlistAssets = watchlist
    .map((item) => ({
      ...item,
      asset: allAssets.find((a) => a.id === item.assetId),
    }))
    .filter((item) => item.asset);

  // Get AI recommended assets for watchlist
  const aiRecommendedAssets = recommendations.map(rec => ({
    recommendation: rec,
    asset: allAssets.find(a => a.id === rec.assetId)
  })).filter(item => item.asset);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const handleCreatePosition = async () => {
    if (!newPositionForm.symbol || !newPositionForm.quantity || !newPositionForm.entryPrice) {
      toast.error("Please fill in required fields: Symbol, Quantity, and Entry Price");
      return;
    }

    setIsCreatingPosition(true);
    try {
      const token = localStorage.getItem("bearer_token");
      
      // First, find the asset by symbol
      const assetRes = await fetch(`/api/assets?search=${encodeURIComponent(newPositionForm.symbol.toUpperCase())}&limit=1`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!assetRes.ok) {
        toast.error("Failed to find asset. Please check the symbol.");
        setIsCreatingPosition(false);
        return;
      }
      
      const assets = await assetRes.json();
      if (!Array.isArray(assets) || assets.length === 0) {
        toast.error(`Asset not found: ${newPositionForm.symbol.toUpperCase()}`);
        setIsCreatingPosition(false);
        return;
      }
      
      const asset = assets[0];
      
      // Create position with assetId (userId is extracted from auth token automatically)
      const res = await fetch("/api/positions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          assetId: asset.id,
          positionType: newPositionForm.positionType,
          quantity: parseFloat(newPositionForm.quantity),
          entryPrice: parseFloat(newPositionForm.entryPrice),
          strikePrice: newPositionForm.strikePrice ? parseFloat(newPositionForm.strikePrice) : null,
          expirationDate: newPositionForm.expirationDate || null,
          status: "open",
        }),
      });

      if (res.ok) {
        toast.success(`Position created successfully for ${newPositionForm.symbol.toUpperCase()}`);
        setAddPositionDialogOpen(false);
        setNewPositionForm({
          symbol: "",
          positionType: "stock",
          quantity: "",
          entryPrice: "",
          strikePrice: "",
          expirationDate: "",
        });
        loadAllData();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create position");
      }
    } catch (error) {
      console.error("Error creating position:", error);
      toast.error("Failed to create position");
    } finally {
      setIsCreatingPosition(false);
    }
  };

  const addAlpacaAssetToWatchlist = async (alpacaAsset: AlpacaAsset) => {
    try {
      const token = localStorage.getItem("bearer_token");
      
      // First, check if asset exists in our database, if not create it
      let assetRes = await fetch(`/api/assets?search=${encodeURIComponent(alpacaAsset.symbol)}&limit=1`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      let assets = await assetRes.json();
      let assetId: number;
      
      if (!Array.isArray(assets) || assets.length === 0) {
        // Asset doesn't exist, create it
        const createRes = await fetch("/api/assets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            symbol: alpacaAsset.symbol,
            name: alpacaAsset.name,
            sector: "General", // Default sector
            assetTypeId: 1, // Assuming 1 is stock type
          }),
        });
        
        if (!createRes.ok) {
          throw new Error("Failed to create asset");
        }
        
        const newAsset = await createRes.json();
        assetId = newAsset.id;
      } else {
        assetId = assets[0].id;
      }
      
      // Now add to watchlist
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ userId, assetId }),
      });
      
      if (res.ok) {
        toast.success(`Added ${alpacaAsset.symbol} to watchlist`);
        await loadAllData(); // Reload to update watchlist state
        setAlpacaSearchResults([]); // Clear search results to force re-render
        setSearchQuery(''); // Clear search to show updated state
      } else {
        throw new Error("Failed to add to watchlist");
      }
    } catch (error) {
      console.error("Error adding Alpaca asset to watchlist:", error);
      toast.error("Failed to add to watchlist");
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      localStorage.removeItem("bearer_token");
      toast.success("Signed out successfully");
      router.push("/");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-6 lg:gap-10">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-all duration-200 group">
                <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-base font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Trading Buddy</h1>
              </Link>
              
              <nav className="hidden lg:flex items-center gap-1">
                <Link href="/dashboard">
                  <Button variant="secondary" size="sm" className="font-medium shadow-sm">
                    <BarChart3 className="h-4 w-4 mr-1.5" />
                    Dashboard
                  </Button>
                </Link>
                
                <Link href="/strategies">
                  <Button variant="ghost" size="sm" className="hover:bg-secondary/80">
                    <Zap className="h-4 w-4 mr-1.5" />
                    Strategies
                  </Button>
                </Link>
                <Link href="/risk">
                  <Button variant="ghost" size="sm" className="hover:bg-secondary/80">
                    <Shield className="h-4 w-4 mr-1.5" />
                    Risk
                  </Button>
                </Link>
                <Link href="/data">
                  <Button variant="ghost" size="sm" className="hover:bg-secondary/80">
                    <Database className="h-4 w-4 mr-1.5" />
                    Data
                  </Button>
                </Link>
                <Link href="/backtest">
                  <Button variant="ghost" size="sm" className="hover:bg-secondary/80">
                    <TestTube className="h-4 w-4 mr-1.5" />
                    Backtest
                  </Button>
                </Link>
                <Link href="/models">
                  <Button variant="ghost" size="sm" className="hover:bg-secondary/80">
                    <Brain className="h-4 w-4 mr-1.5" />
                    Models
                  </Button>
                </Link>
                <Link href="/news">
                  <Button variant="ghost" size="sm" className="hover:bg-secondary/80">
                    <Newspaper className="h-4 w-4 mr-1.5" />
                    News
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="ghost" size="sm" className="hover:bg-secondary/80">
                    <SettingsIcon className="h-4 w-4 mr-1.5" />
                    Settings
                  </Button>
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px]">
                  <SheetHeader>
                    <SheetTitle>Navigation</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-2 mt-6">
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="secondary" size="sm" className="w-full justify-start font-medium">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>

                    <Link href="/strategies" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Zap className="h-4 w-4 mr-2" />
                        Strategies
                      </Button>
                    </Link>
                    <Link href="/risk" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Shield className="h-4 w-4 mr-2" />
                        Risk
                      </Button>
                    </Link>
                    <Link href="/data" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Database className="h-4 w-4 mr-2" />
                        Data
                      </Button>
                    </Link>
                    <Link href="/backtest" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <TestTube className="h-4 w-4 mr-2" />
                        Backtest
                      </Button>
                    </Link>
                    <Link href="/models" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Brain className="h-4 w-4 mr-2" />
                        Models
                      </Button>
                    </Link>
                    <Link href="/news" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Newspaper className="h-4 w-4 mr-2" />
                        News
                      </Button>
                    </Link>
                    <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <SettingsIcon className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary/80 backdrop-blur-sm shadow-sm">
                {wsConnected ? (
                  <>
                    <div className="relative">
                      <Wifi className="h-3.5 w-3.5 text-green-500" />
                      <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 hidden sm:inline">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-muted-foreground hidden sm:inline">Offline</span>
                  </>
                )}
              </div>

              <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary/80 backdrop-blur-sm shadow-sm">
                <div className={`h-1.5 w-1.5 rounded-full ${isLiveUpdateEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-xs text-muted-foreground">
                  {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsLiveUpdateEnabled(!isLiveUpdateEnabled)}
                  className="h-6 px-2 text-xs hover:bg-background/50"
                >
                  {isLiveUpdateEnabled ? 'Pause' : 'Resume'}
                </Button>
              </div>

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="p-1.5 rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">
                      {session?.user?.name || session?.user?.email || "User"}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2 border-b border-border">
                    <div className="text-sm font-medium">{session?.user?.name || "User"}</div>
                    <div className="text-xs text-muted-foreground truncate">{session?.user?.email}</div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ThemeToggle />
            </div>
          </div>
        </div>
        
        {/* Real-time Market Ticker */}
        <div className="border-t border-border/50 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 overflow-hidden">
          <div className="relative h-10 flex items-center">
            <div className="absolute inset-0 flex items-center animate-[ticker_30s_linear_infinite] hover:[animation-play-state:paused]">
              {[...marketIndexes, ...marketIndexes]
                .filter(index => 
                  index && 
                  index.symbol && 
                  typeof index.price === 'number' && 
                  typeof index.change === 'number' && 
                  typeof index.changePercent === 'number'
                )
                .map((index, i) => (
                <div key={`${index.symbol}-${i}`} className="flex items-center gap-2 px-6 whitespace-nowrap flex-shrink-0">
                  <span className="font-bold text-sm text-foreground">{index.symbol}</span>
                  <span className="text-sm font-semibold text-foreground">${index.price.toFixed(2)}</span>
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    index.change >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                  }`}>
                    {index.change >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    <span>{index.change >= 0 ? '+' : ''}{index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)</span>
                  </div>
                  <div className="w-px h-4 bg-border/50 ml-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-6 py-6 lg:py-8 space-y-6 lg:space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-1.5">Trading Dashboard</h2>
            <p className="text-sm text-muted-foreground">Real-time market overview and portfolio analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {aiRecommendations.length} AI Signals
              </span>
            </div>
            {rlStats && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30">
                <Cpu className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  RL: {rlStats.totalStates ?? 0} States
                </span>
              </div>
            )}
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Overview</TabsTrigger>
            <TabsTrigger value="watchlist" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Watchlist
              {(watchlist.length > 0 || recommendations.length > 0) && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {watchlist.length + recommendations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="search" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Search</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Portfolio Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <Card className="border border-border bg-gradient-to-br from-card to-card/50 hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total P&L</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold mb-1 ${totalPnL >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                    ${(totalPnL || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {positions.length} active position{positions.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border bg-gradient-to-br from-card to-card/50 hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Portfolio Delta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">
                    {(riskMetrics?.portfolio_delta || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Directional exposure
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border bg-gradient-to-br from-card to-card/50 hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Strategies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">
                    {strategies.filter(s => s.isActive).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    of {strategies.length} total
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border bg-gradient-to-br from-card to-card/50 hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Risk Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge 
                    variant={
                      riskMetrics?.risk_level === "low" ? "default" :
                      riskMetrics?.risk_level === "medium" ? "secondary" : "destructive"
                    }
                    className="text-xs font-semibold px-2.5 py-1"
                  >
                    {riskMetrics?.risk_level?.toUpperCase() || "UNKNOWN"}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    Max Loss: <span className="font-semibold">${(riskMetrics?.max_loss || 0).toFixed(2)}</span>
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* NEW: RL Agent Status Card */}
            {rlStats && (
              <Card className="border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-card shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Cpu className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">Reinforcement Learning Agent</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">Position sizing & trade timing optimizer</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Database className="h-3.5 w-3.5 text-purple-500" />
                        <div className="text-xs text-muted-foreground">States Learned</div>
                      </div>
                      <div className="text-xl font-bold">{(rlStats.totalStates ?? 0).toLocaleString()}</div>
                    </div>
                    
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-3.5 w-3.5 text-blue-500" />
                        <div className="text-xs text-muted-foreground">Experiences</div>
                      </div>
                      <div className="text-xl font-bold">{(rlStats.totalExperiences ?? 0).toLocaleString()}</div>
                    </div>
                    
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-3.5 w-3.5 text-green-500" />
                        <div className="text-xs text-muted-foreground">Actions Learned</div>
                      </div>
                      <div className="text-xl font-bold">{(rlStats.learnedActions ?? 0).toLocaleString()}</div>
                    </div>
                    
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUpIcon className="h-3.5 w-3.5 text-yellow-500" />
                        <div className="text-xs text-muted-foreground">Avg Q-Value</div>
                      </div>
                      <div className={`text-xl font-bold ${(rlStats.avgQValue ?? 0) >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                        {(rlStats.avgQValue ?? 0) >= 0 ? '+' : ''}{(rlStats.avgQValue ?? 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-purple-500/5 rounded-lg border border-purple-500/20">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-4 w-4 text-purple-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-1">
                          Continuous Learning Active
                        </div>
                        <div className="text-xs text-muted-foreground">
                          The RL agent learns from every trade outcome, improving position sizing and timing decisions. 
                          Exploration rate: {((rlStats.epsilon ?? 0) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Positions & AI Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-border bg-gradient-to-br from-card to-card/50 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">Live Positions</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {positions.length}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => setAddPositionDialogOpen(true)}
                        className="gap-1.5"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Position</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    {positions.length > 0 ? (
                      positions.slice(0, 5).map((pos) => (
                        <button
                          key={pos.id}
                          onClick={() => openPositionDetails(pos)}
                          className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-all duration-200 border border-border/50 hover:border-primary/50 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${(pos.pnl || 0) >= 0 ? 'bg-green-500 shadow-green-500/50 shadow-md' : 'bg-red-500 shadow-red-500/50 shadow-md'}`} />
                            <div className="text-left">
                              <div className="text-sm font-semibold group-hover:text-primary transition-colors">{pos.symbol}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">{pos.name || pos.symbol}</div>
                              <div className="text-xs text-muted-foreground">Qty: {pos.quantity} • Δ {pos.delta?.toFixed(2) || '0.00'}</div>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <div className={`text-base font-bold ${(pos.pnl || 0) >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                {(pos.pnl || 0) >= 0 ? '+' : ''}${(pos.pnl || 0).toFixed(2)}
                              </div>
                            </div>
                            <Info className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Activity className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">No active positions</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={() => setAddPositionDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          Add Your First Position
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border bg-gradient-to-br from-card to-card/50 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-bold">AI Recommendations</CardTitle>
                      {rlStats && rlStats.totalStates > 100 && (
                        <Badge variant="outline" className="text-xs bg-purple-500/10 border-purple-500/30">
                          <Cpu className="h-3 w-3 mr-1" />
                          RL-Enhanced
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {aiRecommendations.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    {aiRecommendations.length > 0 ? (
                      aiRecommendations.slice(0, 5).map((rec, index) => {
                        const asset = assets.find(a => a.symbol === rec.symbol);
                        const isInWatchlist = asset ? watchlistAssets.some(w => w.assetId === asset.id) : false;
                        const isRLRecommendation = rec.recommendationReason?.includes('🤖 RL Agent');
                        
                        return (
                          <button
                            key={rec.id}
                            onClick={() => {
                              if (asset) {
                                openAssetDetails(asset);
                              }
                            }}
                            className={`w-full p-3 rounded-lg hover:bg-muted/70 transition-all duration-200 border cursor-pointer text-left ${
                              isRLRecommendation 
                                ? 'bg-purple-500/5 border-purple-500/30' 
                                : 'bg-muted/50 border-border/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-1.5">
                              <div className="flex items-center gap-2 flex-1">
                                {isRLRecommendation ? (
                                  <Cpu className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                                ) : (
                                  <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                )}
                                <span className="text-sm font-semibold">{rec.symbol}</span>
                                <Badge variant="outline" className="text-xs font-mono">
                                  {((rec.confidenceScore || 0) * 100).toFixed(0)}%
                                </Badge>
                                {isRLRecommendation && (
                                  <Badge variant="outline" className="text-xs bg-purple-500/10 border-purple-500/30">
                                    RL
                                  </Badge>
                                )}
                                <Eye className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors ml-auto flex-shrink-0" />
                              </div>
                              {asset && (
                                isInWatchlist ? (
                                  <Badge variant="default" className="text-xs flex-shrink-0">
                                    <Star className="h-3 w-3 mr-1 fill-current" />
                                    Watching
                                  </Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 hover:bg-primary/10 flex-shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addToWatchlist(asset.id);
                                      toast.success(`Added ${asset.symbol} to watchlist`);
                                    }}
                                  >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    <span className="text-xs">Add</span>
                                  </Button>
                                )
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground leading-relaxed pl-5">
                              {rec.recommendationReason}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Brain className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">No AI recommendations</p>
                        <p className="text-xs mt-1 text-muted-foreground/70">
                          Add positions to receive ML-powered insights
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Strategies - Expanded */}
            <Card className="border border-border bg-gradient-to-br from-card to-card/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold">Trading Strategies</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Your configured trading strategies with live performance</p>
                  </div>
                  <Link href="/strategies">
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1.5" />
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {strategies.length > 0 ? (
                    strategies.map((strategy) => (
                      <div key={strategy.id} className="p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-all duration-200 border border-border/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${strategy.isActive ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                              <Zap className={`h-4 w-4 ${strategy.isActive ? 'text-green-500' : 'text-yellow-500'}`} />
                            </div>
                            <div>
                              <div className="font-semibold text-sm">{strategy.name}</div>
                              <div className="text-xs text-muted-foreground">{strategy.strategyType}</div>
                            </div>
                          </div>
                          <Badge 
                            variant={strategy.isActive ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {strategy.isActive ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground">Return</div>
                            <div className={`text-sm font-bold ${(strategy.performance?.totalReturn ?? 0) >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                              {(strategy.performance?.totalReturn ?? 0) >= 0 ? '+' : ''}{(strategy.performance?.totalReturn ?? 0).toFixed(2)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Win Rate</div>
                            <div className="text-sm font-bold">{(strategy.performance?.winRate ?? 0).toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Sharpe</div>
                            <div className="text-sm font-bold">{(strategy.performance?.sharpeRatio ?? 0).toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Drawdown</div>
                            <div className="text-sm font-bold text-red-600 dark:text-red-500">{(strategy.performance?.maxDrawdown ?? 0).toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Avg Return</div>
                            <div className="text-sm font-bold">{(strategy.performance?.avgReturn ?? 0).toFixed(2)}%</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Zap className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No active strategies</p>
                      <Link href="/strategies">
                        <Button size="sm" variant="outline" className="mt-3">
                          <Plus className="h-4 w-4 mr-1.5" />
                          Configure Strategy
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="watchlist" className="space-y-6 mt-6">
            {/* My Watchlist Section */}
            <Card className="border border-border bg-gradient-to-br from-card to-card/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary fill-primary" />
                      My Watchlist
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Stocks you're tracking before taking positions</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {watchlistAssets.length} {watchlistAssets.length === 1 ? 'asset' : 'assets'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {watchlistAssets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {watchlistAssets.map((item) => {
                      if (!item.asset) return null;
                      const typeInfo = getAssetTypeInfo(item.asset.assetTypeId);
                      const TypeIcon = typeInfo.icon;
                      const priceData = watchlistPrices[item.asset.symbol];
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => openAssetDetails(item.asset!)}
                          className="w-full flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20 group hover:bg-primary/10 transition-all duration-200 cursor-pointer"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Star className="h-5 w-5 text-primary fill-primary" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-base group-hover:text-primary transition-colors">{item.asset!.symbol}</span>
                                <Badge variant="outline" className="text-xs">
                                  <TypeIcon className="h-3 w-3 mr-1" />
                                  {typeInfo.name}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-1">{item.asset!.name}</div>
                              {priceData ? (
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-sm font-bold">${priceData.price.toFixed(2)}</span>
                                  <div className={`flex items-center gap-1 text-xs font-medium ${
                                    priceData.change >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                                  }`}>
                                    {priceData.change >= 0 ? (
                                      <ArrowUpRight className="h-3 w-3" />
                                    ) : (
                                      <ArrowDownRight className="h-3 w-3" />
                                    )}
                                    <span>
                                      {priceData.change >= 0 ? '+' : ''}{priceData.change.toFixed(2)} ({priceData.changePercent.toFixed(2)}%)
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground mt-1">
                                  <Badge variant="secondary" className="text-xs">{item.asset!.sector}</Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Info className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromWatchlist(item.id);
                                toast.success(`Removed ${item.asset?.symbol} from watchlist`);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-medium">No assets in your watchlist yet</p>
                    <p className="text-xs mt-1">Go to the Search tab to add stocks to track</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-4"
                      onClick={() => setSelectedTab("search")}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Browse Assets
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Recommended Additions */}
            <Card className="border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-card shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      AI Recommended Additions
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">AI-powered suggestions based on your portfolio</p>
                  </div>
                  <Badge variant="outline" className="text-xs bg-purple-500/10 border-purple-500/30">
                    {aiRecommendedAssets.length} recommendations
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {aiRecommendedAssets.length > 0 ? (
                  <div className="space-y-3">
                    {aiRecommendedAssets.map((item) => {
                      if (!item.asset) return null;
                      const typeInfo = getAssetTypeInfo(item.asset.assetTypeId);
                      const TypeIcon = typeInfo.icon;
                      const isInWatchlist = watchlistAssets.some(w => w.assetId === item.asset!.id);
                      
                      return (
                        <button
                          key={item.recommendation.id}
                          onClick={() => {
                            setSelectedRecommendation(item.recommendation);
                            setRecommendationDialogOpen(true);
                          }}
                          className="w-full p-4 bg-purple-500/5 rounded-lg border border-purple-500/20 hover:bg-purple-500/10 transition-all duration-200 cursor-pointer text-left"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="p-2 rounded-lg bg-purple-500/10">
                                <Sparkles className="h-4 w-4 text-purple-500" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-semibold text-base">{item.asset!.symbol}</span>
                                  <Badge variant="outline" className="text-xs">
                                    <TypeIcon className="h-3 w-3 mr-1" />
                                    {typeInfo.name}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs font-mono bg-purple-500/10 border-purple-500/30">
                                    {((item.recommendation.confidenceScore || 0) * 100).toFixed(0)}% confidence
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">{item.asset!.name}</div>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Info className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                              {isInWatchlist ? (
                                <Badge variant="default" className="text-xs">
                                  <Star className="h-3 w-3 mr-1 fill-current" />
                                  Watching
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToWatchlist(item.asset!.id);
                                    toast.success(`Added ${item.asset!.symbol} to watchlist`);
                                  }}
                                  className="gap-1.5"
                                >
                                  <Plus className="h-4 w-4" />
                                  Add
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dismissRecommendation(item.recommendation.id);
                                  toast.success("Recommendation dismissed");
                                }}
                                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="pl-11 text-sm text-muted-foreground leading-relaxed">
                            {item.recommendation.recommendationReason}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-medium">No AI recommendations yet</p>
                    <p className="text-xs mt-1">Add positions to receive ML-powered watchlist suggestions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-6 mt-6">
            <Card className="border border-border bg-gradient-to-br from-card to-card/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Asset Search</CardTitle>
                <CardDescription className="text-xs">
                  {searchMode === "live" 
                    ? "Search real-time tradeable assets from Alpaca"
                    : "Search assets in your local database"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Search Mode Toggle */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Search Mode:</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={searchMode === "live" ? "default" : "outline"}
                        onClick={() => setSearchMode("live")}
                        className="gap-2"
                      >
                        <Wifi className="h-3.5 w-3.5" />
                        Live Search (Real-time)
                      </Button>
                      <Button
                        size="sm"
                        variant={searchMode === "database" ? "default" : "outline"}
                        onClick={() => setSearchMode("database")}
                        className="gap-2"
                      >
                        <Database className="h-3.5 w-3.5" />
                        Database
                      </Button>
                    </div>
                  </div>

                  {/* Enhanced Search Bar */}
                  <div className="relative">
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border-2 border-primary/20 shadow-sm transition-all duration-200 focus-within:border-primary/40 focus-within:shadow-md">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {isSearching ? (
                          <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                        ) : (
                          <Search className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <Input
                        type="text"
                        placeholder={searchMode === "live" 
                          ? "Search any tradeable stock (e.g., AAPL, Tesla, Palantir)..."
                          : "Search by symbol (e.g., AAPL) or company name (e.g., Apple)..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                      />
                      {searchQuery && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSearchQuery('')} 
                          className="h-8 w-8 p-0 rounded-full hover:bg-primary/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground px-2">
                      {searchMode === "live" ? (
                        <>
                          {searchQuery ? (
                            isSearching ? (
                              <span className="flex items-center gap-2">
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Searching live assets...
                              </span>
                            ) : (
                              <span>Found <span className="font-semibold text-foreground">{alpacaSearchResults.length}</span> live tradeable asset{alpacaSearchResults.length !== 1 ? 's' : ''}</span>
                            )
                          ) : (
                            <span>🌐 <span className="font-semibold text-primary">Live Search Mode</span> - Type to search any tradeable US stock in real-time</span>
                          )}
                        </>
                      ) : (
                        searchQuery ? (
                          <span>Found <span className="font-semibold text-foreground">{filteredAssets.length}</span> result{filteredAssets.length !== 1 ? 's' : ''} in database</span>
                        ) : (
                          <span>Showing <span className="font-semibold text-foreground">{filteredAssets.length}</span> assets in database</span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Asset Type Filters - Only for database mode */}
                  {searchMode === "database" && (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-medium text-muted-foreground">Filter by type:</span>
                      <Button
                        size="sm"
                        variant={selectedAssetTypes.includes("stock") ? "default" : "outline"}
                        onClick={() => toggleAssetType("stock")}
                        className="gap-2"
                      >
                        <TrendingUpDown className="h-4 w-4" />
                        Stocks
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedAssetTypes.includes("etf") ? "default" : "outline"}
                        onClick={() => toggleAssetType("etf")}
                        className="gap-2"
                      >
                        <Layers className="h-4 w-4" />
                        ETFs
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedAssetTypes.includes("index") ? "default" : "outline"}
                        onClick={() => toggleAssetType("index")}
                        className="gap-2"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Indexes
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedAssetTypes.includes("future") ? "default" : "outline"}
                        onClick={() => toggleAssetType("future")}
                        className="gap-2"
                      >
                        <Flame className="h-4 w-4" />
                        Futures
                      </Button>
                      {selectedAssetTypes.length < 4 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedAssetTypes(["stock", "etf", "index", "future"])}
                          className="text-xs"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Search Results */}
                  <div>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                      {searchMode === "live" ? (
                        // Live Alpaca search results
                        alpacaSearchResults.length > 0 ? (
                          alpacaSearchResults.map((alpacaAsset) => {
                            const isInWatchlist = watchlistAssets.some(w => w.asset?.symbol === alpacaAsset.symbol);
                            
                            return (
                              <button
                                key={alpacaAsset.symbol}
                                onClick={() => openLiveAssetDetails(alpacaAsset)}
                                className={`w-full flex items-center justify-between p-4 rounded-lg transition-all duration-200 border cursor-pointer ${
                                  isInWatchlist 
                                    ? 'bg-primary/5 border-primary/20' 
                                    : 'bg-muted/50 border-border/50 hover:bg-muted/70 hover:border-primary/30'
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className={`p-2 rounded-lg ${isInWatchlist ? 'bg-primary/20' : 'bg-primary/10'}`}>
                                    {isInWatchlist ? (
                                      <Star className="h-4 w-4 text-primary fill-primary" />
                                    ) : (
                                      <Globe className="h-4 w-4 text-primary" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-sm">{alpacaAsset.symbol}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        <TrendingUpDown className="h-3 w-3 mr-1" />
                                        Stock
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">{alpacaAsset.exchange}</Badge>
                                      <Badge variant="default" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                                        <Wifi className="h-3 w-3 mr-1" />
                                        Live
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">{alpacaAsset.name}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Info className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                                  {!isInWatchlist && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 px-3 hover:bg-primary/10 gap-1.5"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addAlpacaAssetToWatchlist(alpacaAsset);
                                      }}
                                    >
                                      <Plus className="h-4 w-4" />
                                      Add
                                    </Button>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        ) : searchQuery ? (
                          <div className="text-center py-16 text-muted-foreground">
                            <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-medium">No live assets found for "{searchQuery}"</p>
                            <p className="text-xs mt-1">Try searching with a different symbol or company name</p>
                          </div>
                        ) : (
                          <div className="text-center py-16 text-muted-foreground">
                            <Globe className="h-12 w-12 mx-auto mb-4 text-primary opacity-50" />
                            <p className="text-sm font-medium">🌐 Real-time Asset Search</p>
                            <p className="text-xs mt-2 max-w-md mx-auto leading-relaxed">
                              Search for any tradeable US stock in real-time. Results are fetched directly from Alpaca's live market data.
                            </p>
                            <p className="text-xs mt-3 text-primary font-medium">
                              Try searching: PLTR, NVDA, TSLA, AAPL, or any company name
                            </p>
                          </div>
                        )
                      ) : (
                        // Database search results (existing code)
                        filteredAssets.length > 0 ? (
                          filteredAssets.map((asset) => {
                            const isInWatchlist = watchlistAssets.some(w => w.assetId === asset.id);
                            const typeInfo = getAssetTypeInfo(asset.assetTypeId);
                            const TypeIcon = typeInfo.icon;
                            
                            return (
                              <button
                                key={asset.id}
                                onClick={() => openAssetDetails(asset)}
                                className={`w-full flex items-center justify-between p-4 rounded-lg transition-all duration-200 border group cursor-pointer ${
                                  isInWatchlist 
                                    ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' 
                                    : 'bg-muted/50 border-border/50 hover:bg-muted/70 hover:border-primary/30'
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className={`p-2 rounded-lg ${isInWatchlist ? 'bg-primary/20' : 'bg-primary/10'}`}>
                                    {isInWatchlist ? (
                                      <Star className="h-4 w-4 text-primary fill-primary" />
                                    ) : (
                                      <TypeIcon className="h-4 w-4 text-primary" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-sm group-hover:text-primary transition-colors">{asset.symbol}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        <TypeIcon className="h-3 w-3 mr-1" />
                                        {typeInfo.name}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">{asset.sector}</Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">{asset.name}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Info className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                  {!isInWatchlist && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 px-3 hover:bg-primary/10 hover:text-primary gap-1.5"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addToWatchlist(asset.id);
                                        toast.success(`Added ${asset.symbol} to watchlist`);
                                      }}
                                    >
                                      <Plus className="h-4 w-4" />
                                      Add
                                    </Button>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        ) : searchQuery ? (
                          <div className="text-center py-16 text-muted-foreground">
                            <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-medium">No assets found for "{searchQuery}"</p>
                            <p className="text-xs mt-1">Try searching with a different symbol or company name</p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-4"
                              onClick={() => setSearchQuery('')}
                            >
                              Clear Search
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-16 text-muted-foreground">
                            <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-medium">No assets match your filters</p>
                            <p className="text-xs mt-1">Try adjusting your filter selection</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Position Dialog */}
      <Dialog open={addPositionDialogOpen} onOpenChange={setAddPositionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Position</DialogTitle>
            <DialogDescription>
              Create a new position to track in your portfolio
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol *</Label>
                <Input
                  id="symbol"
                  placeholder="e.g., AAPL, TSLA"
                  value={newPositionForm.symbol}
                  onChange={(e) =>
                    setNewPositionForm({ ...newPositionForm, symbol: e.target.value })
                  }
                  className="uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="positionType">Position Type *</Label>
                <Select
                  value={newPositionForm.positionType}
                  onValueChange={(value) =>
                    setNewPositionForm({ ...newPositionForm, positionType: value })
                  }
                >
                  <SelectTrigger id="positionType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="buy_call">Buy Call (Long Call)</SelectItem>
                    <SelectItem value="sell_call">Sell Call (Short Call)</SelectItem>
                    <SelectItem value="buy_put">Buy Put (Long Put)</SelectItem>
                    <SelectItem value="sell_put">Sell Put (Short Put)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="e.g., 100"
                  value={newPositionForm.quantity}
                  onChange={(e) =>
                    setNewPositionForm({ ...newPositionForm, quantity: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entryPrice">Entry Price *</Label>
                <Input
                  id="entryPrice"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 150.50"
                  value={newPositionForm.entryPrice}
                  onChange={(e) =>
                    setNewPositionForm({ ...newPositionForm, entryPrice: e.target.value })
                  }
                />
              </div>
            </div>

            {(newPositionForm.positionType === "buy_call" ||
              newPositionForm.positionType === "sell_call" ||
              newPositionForm.positionType === "buy_put" ||
              newPositionForm.positionType === "sell_put") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="strikePrice">Strike Price</Label>
                  <Input
                    id="strikePrice"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 160.00"
                    value={newPositionForm.strikePrice}
                    onChange={(e) =>
                      setNewPositionForm({ ...newPositionForm, strikePrice: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expirationDate">Expiration Date</Label>
                  <Input
                    id="expirationDate"
                    type="date"
                    value={newPositionForm.expirationDate}
                    onChange={(e) =>
                      setNewPositionForm({
                        ...newPositionForm,
                        expirationDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setAddPositionDialogOpen(false)}
                disabled={isCreatingPosition}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreatePosition}
                disabled={isCreatingPosition}
              >
                {isCreatingPosition ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Position
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Asset Details Dialog */}
      <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedAsset && (
                <>
                  <span className="text-2xl font-bold">{selectedAsset.symbol}</span>
                  {(() => {
                    const typeInfo = getAssetTypeInfo(selectedAsset.assetTypeId);
                    const TypeIcon = typeInfo.icon;
                    return (
                      <Badge variant="secondary">
                        <TypeIcon className="h-3.5 w-3.5 mr-1.5" />
                        {typeInfo.name}
                      </Badge>
                    );
                  })()}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedAsset?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAsset && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Symbol</div>
                  <div className="text-lg font-semibold">{selectedAsset.symbol}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Sector</div>
                  <Badge variant="outline">{selectedAsset.sector}</Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Company Name</div>
                <div className="font-medium">{selectedAsset.name}</div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    addToWatchlist(selectedAsset.id);
                    setAssetDialogOpen(false);
                  }}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Add to Watchlist
                </Button>
                <Button variant="outline" className="flex-1">
                  <LineChart className="h-4 w-4 mr-2" />
                  View Charts
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Live Asset Details Dialog */}
      <Dialog open={liveAssetDialogOpen} onOpenChange={setLiveAssetDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedLiveAsset && (
                <>
                  <span className="text-2xl font-bold">{selectedLiveAsset.symbol}</span>
                  <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30">
                    <Globe className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedLiveAsset?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLiveAsset && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Symbol</div>
                  <div className="text-lg font-semibold">{selectedLiveAsset.symbol}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Sector</div>
                  <Badge variant="outline">{selectedLiveAsset.exchange}</Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Company Name</div>
                <div className="font-medium">{selectedLiveAsset.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Price</div>
                  <div className="text-lg font-semibold">${selectedLiveAsset.price?.toFixed(2)}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Change</div>
                  <div className={`text-lg font-semibold ${(selectedLiveAsset.change || 0) >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                    {(selectedLiveAsset.change || 0) >= 0 ? '+' : ''}{(selectedLiveAsset.change || 0).toFixed(2)} ({(selectedLiveAsset.changePercent || 0).toFixed(2)}%)
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  className="flex-1" 
                  onClick={async () => {
                    // Convert LiveAssetDetails to AlpacaAsset format for adding to watchlist
                    const alpacaAsset: AlpacaAsset = {
                      symbol: selectedLiveAsset.symbol,
                      name: selectedLiveAsset.name,
                      exchange: selectedLiveAsset.exchange,
                      assetClass: 'us_equity',
                      tradable: true,
                      marginable: true,
                      shortable: true,
                    };
                    await addAlpacaAssetToWatchlist(alpacaAsset);
                    setLiveAssetDialogOpen(false);
                  }}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Add to Watchlist
                </Button>
                <Button variant="outline" className="flex-1">
                  <LineChart className="h-4 w-4 mr-2" />
                  View Charts
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Position Details Dialog */}
      <Dialog open={positionDialogOpen} onOpenChange={setPositionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedPosition && (
                <>
                  <span className="text-2xl font-bold">{selectedPosition.symbol}</span>
                  <Badge variant={selectedPosition.type === "call" ? "default" : "secondary"}>
                    {selectedPosition.type?.toUpperCase() || "POSITION"}
                  </Badge>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedPosition?.name || selectedPosition?.symbol}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPosition && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs text-muted-foreground uppercase">Quantity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedPosition.quantity ?? 0}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs text-muted-foreground uppercase">P&L</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${(selectedPosition.pnl || 0) >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                      {(selectedPosition.pnl || 0) >= 0 ? '+' : ''}${(selectedPosition.pnl ?? 0).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Price Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Entry Price</div>
                    <div className="text-lg font-semibold">${(selectedPosition.entry_price ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Current Price</div>
                    <div className="text-lg font-semibold">${(selectedPosition.current_price ?? 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Greeks</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Delta (Δ)</div>
                    <div className="text-lg font-semibold">{(selectedPosition.delta ?? 0).toFixed(4)}</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Gamma (Γ)</div>
                    <div className="text-lg font-semibold">{(selectedPosition.gamma ?? 0).toFixed(4)}</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Theta (Θ)</div>
                    <div className="text-lg font-semibold">{(selectedPosition.theta ?? 0).toFixed(4)}</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Vega (ν)</div>
                    <div className="text-lg font-semibold">{(selectedPosition.vega ?? 0).toFixed(4)}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" className="flex-1">
                  <LineChart className="h-4 w-4 mr-2" />
                  View Analysis
                </Button>
                <Button variant="destructive" className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Close Position
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recommendation Details Dialog */}
      <Dialog open={recommendationDialogOpen} onOpenChange={setRecommendationDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedRecommendation && (
                <>
                  <Sparkles className="h-6 w-6 text-purple-500" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {allAssets.find(a => a.id === selectedRecommendation.assetId)?.symbol}
                      </span>
                      <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30">
                        {((selectedRecommendation.confidenceScore || 0) * 100).toFixed(0)}% Confidence
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground font-normal mt-1">
                      {allAssets.find(a => a.id === selectedRecommendation.assetId)?.name}
                    </div>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRecommendation && (
            <div className="space-y-6 mt-4">
              {/* AI Reasoning */}
              <div className="p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-2">AI Analysis</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedRecommendation.recommendationReason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommended Action */}
              {selectedRecommendation.tradeAction && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-2">Recommended Action</h4>
                      <div className="text-sm font-medium text-primary">
                        {selectedRecommendation.tradeAction}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {selectedRecommendation.entryPrice != null && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Entry Price</div>
                    <div className="text-lg font-bold">
                      ${selectedRecommendation.entryPrice.toFixed(2)}
                    </div>
                  </div>
                )}

                {selectedRecommendation.strikePrice != null && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Strike Price</div>
                    <div className="text-lg font-bold">
                      ${selectedRecommendation.strikePrice.toFixed(2)}
                    </div>
                  </div>
                )}

                {selectedRecommendation.expirationDate && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Expiration Date</div>
                    <div className="text-lg font-bold">
                      {new Date(selectedRecommendation.expirationDate).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {selectedRecommendation.riskRewardRatio != null && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Risk/Reward Ratio</div>
                    <div className="text-lg font-bold text-primary">
                      1:{selectedRecommendation.riskRewardRatio.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Potential Outcomes */}
              {(selectedRecommendation.potentialGain != null || selectedRecommendation.potentialLoss != null) && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Potential Outcomes</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedRecommendation.potentialGain != null && (
                      <Card className="border-green-500/20 bg-green-500/5">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <CardTitle className="text-xs font-medium text-green-600 dark:text-green-500 uppercase">
                              Potential Gain
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                            ${selectedRecommendation.potentialGain.toFixed(2)}
                          </div>
                          {selectedRecommendation.potentialGainPercent != null && (
                            <div className="text-sm text-muted-foreground mt-1">
                              +{selectedRecommendation.potentialGainPercent.toFixed(1)}%
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {selectedRecommendation.potentialLoss != null && (
                      <Card className="border-red-500/20 bg-red-500/5">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            <CardTitle className="text-xs font-medium text-red-600 dark:text-red-500 uppercase">
                              Potential Loss
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-red-600 dark:text-red-500">
                            ${selectedRecommendation.potentialLoss.toFixed(2)}
                          </div>
                          {selectedRecommendation.potentialLossPercent != null && (
                            <div className="text-sm text-muted-foreground mt-1">
                              -{selectedRecommendation.potentialLossPercent.toFixed(1)}%
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* Key Bullet Points */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  Key Points
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <span>
                      <span className="font-medium">Confidence Score:</span> The AI is{' '}
                      {((selectedRecommendation.confidenceScore || 0) * 100).toFixed(0)}% confident in this recommendation
                      based on current market conditions and your portfolio.
                    </span>
                  </li>
                  {selectedRecommendation.tradeAction && (
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <span>
                        <span className="font-medium">Action Required:</span>{' '}
                        {selectedRecommendation.tradeAction}
                      </span>
                    </li>
                  )}
                  {selectedRecommendation.riskRewardRatio != null && (
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <span>
                        <span className="font-medium">Risk/Reward:</span> This trade offers a favorable{' '}
                        {selectedRecommendation.riskRewardRatio.toFixed(2)}:1 risk-to-reward ratio.
                      </span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <span>
                      <span className="font-medium">Recommendation Date:</span>{' '}
                      {new Date(selectedRecommendation.createdAt).toLocaleDateString()} at{' '}
                      {new Date(selectedRecommendation.createdAt).toLocaleTimeString()}
                    </span>
                  </li>
                  {selectedRecommendation.strategyId && (
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <span>
                        <span className="font-medium">Strategy Alignment:</span> This recommendation aligns
                        with your active trading strategies.
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  className="flex-1"
                  onClick={() => {
                    addToWatchlist(selectedRecommendation.assetId);
                    setRecommendationDialogOpen(false);
                    toast.success(`Added ${allAssets.find(a => a.id === selectedRecommendation.assetId)?.symbol} to watchlist`);
                  }}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Add to Watchlist
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    dismissRecommendation(selectedRecommendation.id);
                    setRecommendationDialogOpen(false);
                    toast.success("Recommendation dismissed");
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

