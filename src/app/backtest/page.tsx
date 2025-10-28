"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Play, Settings as SettingsIcon, FileText, BarChart3, Zap, Shield, Database, TestTube, Brain, Newspaper, Menu, Wifi, WifiOff, RefreshCw, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Backtest {
  id: number;
  name: string;
  strategyId: number;
  modelId?: number;
  userId: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital?: number;
  totalReturn?: number;
  sharpeRatio?: number;
  sortinoRatio?: number;
  maxDrawdown?: number;
  winRate?: number;
  profitFactor?: number;
  totalTrades?: number;
  winningTrades?: number;
  losingTrades?: number;
  avgWin?: number;
  avgLoss?: number;
  totalCommissions?: number;
  totalSlippage?: number;
  configuration: any;
  status: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

interface Strategy {
  id: number;
  name: string;
  strategyType: string;
}

interface MLModel {
  id: number;
  name: string;
  modelType: string;
  version: string;
  status: string;
}

export default function BacktestPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLiveUpdateEnabled, setIsLiveUpdateEnabled] = useState(true);
  
  const [backtests, setBacktests] = useState<Backtest[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [models, setModels] = useState<MLModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [backtestDialogOpen, setBacktestDialogOpen] = useState(false);

  const [backtestForm, setBacktestForm] = useState({
    name: "",
    strategyId: "",
    modelId: "",
    startDate: "2023-01-01",
    endDate: "2024-12-31",
    initialCapital: 100000,
    entryAlpha: 0.25,
    exitAlpha: 0.25,
    slippageTicks: 1,
    spreadThreshold: 0.02,
    commissionPerContract: 0.65,
    occFee: 0.04,
    exchangeFee: 0.02,
  });

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
      return;
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (!isPending && session?.user) {
      loadData();
    }
  }, [session, isPending]);

  useEffect(() => {
    if (!isLiveUpdateEnabled || !session) return;

    const interval = setInterval(() => {
      loadData();
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, [isLiveUpdateEnabled, session]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [backtestsRes, strategiesRes, modelsRes] = await Promise.all([
        fetch("/api/backtests", { headers }),
        fetch("/api/strategies", { headers }),
        fetch("/api/ml-models?status=active", { headers })
      ]);

      const backtestsData = await backtestsRes.json();
      const strategiesData = await strategiesRes.json();
      const modelsData = await modelsRes.json();

      setBacktests(Array.isArray(backtestsData) ? backtestsData : []);
      setStrategies(Array.isArray(strategiesData) ? strategiesData : []);
      setModels(Array.isArray(modelsData) ? modelsData : []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load backtests");
      setIsLoading(false);
    }
  };

  const handleRunBacktest = async () => {
    if (!backtestForm.name.trim()) {
      toast.error("Please enter a backtest name");
      return;
    }

    if (!backtestForm.strategyId) {
      toast.error("Please select a strategy");
      return;
    }

    setIsRunning(true);

    try {
      const token = localStorage.getItem("bearer_token");
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
      };

      const res = await fetch("/api/backtests", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: backtestForm.name,
          strategyId: parseInt(backtestForm.strategyId),
          modelId: backtestForm.modelId ? parseInt(backtestForm.modelId) : null,
          startDate: new Date(backtestForm.startDate).toISOString(),
          endDate: new Date(backtestForm.endDate).toISOString(),
          initialCapital: backtestForm.initialCapital,
          configuration: {
            fill_model: {
              entry_alpha: backtestForm.entryAlpha,
              exit_alpha: backtestForm.exitAlpha,
              slippage_ticks: backtestForm.slippageTicks,
              spread_threshold: backtestForm.spreadThreshold,
            },
            costs: {
              commission_per_contract: backtestForm.commissionPerContract,
              occ_fee: backtestForm.occFee,
              exchange_fee: backtestForm.exchangeFee,
            }
          }
        })
      });

      if (!res.ok) {
        throw new Error("Failed to create backtest");
      }

      toast.success("Backtest started successfully!");
      setBacktestDialogOpen(false);
      loadData();

      // Reset form
      setBacktestForm({
        ...backtestForm,
        name: "",
      });
    } catch (error) {
      console.error("Error running backtest:", error);
      toast.error("Failed to start backtest");
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-green-500",
      running: "bg-yellow-500 animate-pulse",
      failed: "bg-red-500"
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      completed: "default",
      running: "secondary",
      failed: "destructive"
    };
    return variants[status] || "secondary";
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground text-lg">Loading backtests...</p>
        </div>
      </div>
    );
  }

  const completedBacktests = backtests.filter(b => b.status === "completed");
  const latestBacktest = completedBacktests[0];

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
                  <Button variant="ghost" size="sm" className="hover:bg-secondary/80">
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
                  <Button variant="secondary" size="sm" className="font-medium shadow-sm">
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
                      <Button variant="ghost" size="sm" className="w-full justify-start">
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
                      <Button variant="secondary" size="sm" className="w-full justify-start font-medium">
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
                <WifiOff className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-muted-foreground hidden sm:inline">Offline</span>
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
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-6 py-6 lg:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Backtesting</h2>
            <p className="text-sm text-muted-foreground">Historical strategy validation with realistic fills</p>
          </div>
          <Button onClick={() => setBacktestDialogOpen(true)} className="gap-2">
            <Play className="h-4 w-4" />
            Run New Backtest
          </Button>
        </div>

        {/* Latest Backtest Summary */}
        {latestBacktest && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{latestBacktest.name}</CardTitle>
                  <CardDescription>
                    {new Date(latestBacktest.startDate).toLocaleDateString()} to {new Date(latestBacktest.endDate).toLocaleDateString()} • {latestBacktest.totalTrades || 0} trades
                  </CardDescription>
                </div>
                <Badge variant={getStatusBadge(latestBacktest.status)}>
                  {latestBacktest.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 p-4 bg-muted/30 rounded-lg">
                <div className="text-center md:text-left">
                  <p className="text-xs text-muted-foreground mb-1">Net P&L</p>
                  <p className={`text-xl md:text-2xl font-bold ${(latestBacktest.finalCapital || 0) - latestBacktest.initialCapital >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(latestBacktest.finalCapital || 0) - latestBacktest.initialCapital >= 0 ? '+' : ''}
                    ${((latestBacktest.finalCapital || 0) - latestBacktest.initialCapital).toFixed(2)}
                  </p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xs text-muted-foreground mb-1">Sharpe Ratio</p>
                  <p className="text-xl md:text-2xl font-bold">{latestBacktest.sharpeRatio?.toFixed(2) || 'N/A'}</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xs text-muted-foreground mb-1">Max Drawdown</p>
                  <p className="text-xl md:text-2xl font-bold text-red-500">{latestBacktest.maxDrawdown?.toFixed(1) || 'N/A'}%</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                  <p className="text-xl md:text-2xl font-bold">{latestBacktest.winRate?.toFixed(1) || 'N/A'}%</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xs text-muted-foreground mb-1">Avg Win/Loss</p>
                  <p className="text-xl md:text-2xl font-bold">
                    ${latestBacktest.avgWin?.toFixed(0) || '0'} / ${Math.abs(latestBacktest.avgLoss || 0).toFixed(0)}
                  </p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xs text-muted-foreground mb-1">Total Costs</p>
                  <p className="text-xl md:text-2xl font-bold text-muted-foreground">
                    ${((latestBacktest.totalCommissions || 0) + (latestBacktest.totalSlippage || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Backtests List */}
        <Card>
          <CardHeader>
            <CardTitle>All Backtests</CardTitle>
            <CardDescription>Historical performance validation results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {backtests.length > 0 ? (
                backtests.map((backtest) => (
                  <div
                    key={backtest.id}
                    className="p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-all duration-200 border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${getStatusColor(backtest.status)}`} />
                        <div>
                          <div className="font-semibold text-sm">{backtest.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(backtest.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant={getStatusBadge(backtest.status)} className="text-xs">
                        {backtest.status}
                      </Badge>
                    </div>
                    
                    {backtest.status === "completed" && (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Return</div>
                          <div className={`text-sm font-bold ${(backtest.totalReturn || 0) >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                            {(backtest.totalReturn || 0) >= 0 ? '+' : ''}{backtest.totalReturn?.toFixed(2) || '0'}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Sharpe</div>
                          <div className="text-sm font-bold">{backtest.sharpeRatio?.toFixed(2) || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Drawdown</div>
                          <div className="text-sm font-bold text-red-600 dark:text-red-500">
                            {backtest.maxDrawdown?.toFixed(1) || 'N/A'}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Trades</div>
                          <div className="text-sm font-bold">{backtest.totalTrades || 0}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Win Rate</div>
                          <div className="text-sm font-bold">{backtest.winRate?.toFixed(1) || 'N/A'}%</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <TestTube className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No backtests yet</p>
                  <Button 
                    onClick={() => setBacktestDialogOpen(true)} 
                    variant="outline" 
                    size="sm"
                    className="mt-4"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run Your First Backtest
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Backtest Dialog */}
        <Dialog open={backtestDialogOpen} onOpenChange={setBacktestDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Run New Backtest</DialogTitle>
              <DialogDescription>
                Configure and execute a historical strategy validation
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="backtest-name">Backtest Name *</Label>
                  <Input
                    id="backtest-name"
                    placeholder="IV Crush Q4 2023"
                    value={backtestForm.name}
                    onChange={(e) => setBacktestForm({ ...backtestForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="strategy">Strategy *</Label>
                  <select
                    id="strategy"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    value={backtestForm.strategyId}
                    onChange={(e) => setBacktestForm({ ...backtestForm, strategyId: e.target.value })}
                  >
                    <option value="">Select Strategy</option>
                    {strategies.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="model">ML Model (Optional)</Label>
                  <select
                    id="model"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    value={backtestForm.modelId}
                    onChange={(e) => setBacktestForm({ ...backtestForm, modelId: e.target.value })}
                  >
                    <option value="">No Model</option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.version})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="initial-capital">Initial Capital</Label>
                  <Input
                    id="initial-capital"
                    type="number"
                    value={backtestForm.initialCapital}
                    onChange={(e) => setBacktestForm({ ...backtestForm, initialCapital: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="backtest-start-date">Start Date</Label>
                  <Input
                    id="backtest-start-date"
                    type="date"
                    value={backtestForm.startDate}
                    onChange={(e) => setBacktestForm({ ...backtestForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="backtest-end-date">End Date</Label>
                  <Input
                    id="backtest-end-date"
                    type="date"
                    value={backtestForm.endDate}
                    onChange={(e) => setBacktestForm({ ...backtestForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">Fill Model Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entry-alpha">Entry Alpha</Label>
                    <Input
                      id="entry-alpha"
                      type="number"
                      step="0.01"
                      value={backtestForm.entryAlpha}
                      onChange={(e) => setBacktestForm({ ...backtestForm, entryAlpha: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="exit-alpha">Exit Alpha</Label>
                    <Input
                      id="exit-alpha"
                      type="number"
                      step="0.01"
                      value={backtestForm.exitAlpha}
                      onChange={(e) => setBacktestForm({ ...backtestForm, exitAlpha: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="slippage-ticks">Slippage (ticks)</Label>
                    <Input
                      id="slippage-ticks"
                      type="number"
                      value={backtestForm.slippageTicks}
                      onChange={(e) => setBacktestForm({ ...backtestForm, slippageTicks: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="spread-threshold">Spread Threshold</Label>
                    <Input
                      id="spread-threshold"
                      type="number"
                      step="0.01"
                      value={backtestForm.spreadThreshold}
                      onChange={(e) => setBacktestForm({ ...backtestForm, spreadThreshold: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">Transaction Costs</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="commission">Commission/Contract</Label>
                    <Input
                      id="commission"
                      type="number"
                      step="0.01"
                      value={backtestForm.commissionPerContract}
                      onChange={(e) => setBacktestForm({ ...backtestForm, commissionPerContract: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="occ-fee">OCC Fee</Label>
                    <Input
                      id="occ-fee"
                      type="number"
                      step="0.01"
                      value={backtestForm.occFee}
                      onChange={(e) => setBacktestForm({ ...backtestForm, occFee: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="exchange-fee">Exchange Fee</Label>
                    <Input
                      id="exchange-fee"
                      type="number"
                      step="0.01"
                      value={backtestForm.exchangeFee}
                      onChange={(e) => setBacktestForm({ ...backtestForm, exchangeFee: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setBacktestDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRunBacktest} disabled={isRunning}>
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting Backtest...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Backtest
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
