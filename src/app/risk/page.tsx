"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, AlertTriangle, Shield, Activity, Zap, TrendingDown, BarChart3, Database, TestTube, Brain, Settings as SettingsIcon, ArrowUpRight, ArrowDownRight, AlertCircle, Newspaper, Menu, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

interface Position {
  id: number;
  symbol: string;
  type: string;
  quantity: number;
  entry_price: number;
  current_price: number;
  pnl: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
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

export default function RiskPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [positions, setPositions] = useState<Position[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLiveUpdateEnabled, setIsLiveUpdateEnabled] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const userId = "1";

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
      return;
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (!isPending && session?.user) {
      loadRiskData();
    }
  }, [session, isPending]);

  // Live updates interval
  useEffect(() => {
    if (!isLiveUpdateEnabled || !session) return;

    const interval = setInterval(() => {
      loadRiskData();
      setLastUpdate(new Date());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isLiveUpdateEnabled, session]);

  const loadRiskData = async () => {
    try {
      const [positionsData, riskData] = await Promise.all([
        fetch(`/api/positions/user/${userId}/open`).then(res => res.json()),
        fetch(`/api/risk-metrics/user/${userId}/latest`).then(res => res.json())
      ]);

      setPositions(Array.isArray(positionsData) ? positionsData : []);
      setRiskMetrics(riskData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading risk data:", error);
      setIsLoading(false);
    }
  };

  const totalExposure = Array.isArray(positions) ? positions.reduce((sum, pos) => sum + Math.abs(pos.quantity * pos.current_price), 0) : 0;
  const maxPortfolioRisk = 50000; // Example max risk
  const riskUtilization = (totalExposure / maxPortfolioRisk) * 100;

  const getRiskLevelColor = (level?: string) => {
    switch (level) {
      case "low": return "text-green-600 dark:text-green-500";
      case "medium": return "text-yellow-600 dark:text-yellow-500";
      case "high": return "text-red-600 dark:text-red-500";
      default: return "text-muted-foreground";
    }
  };

  const getRiskLevelBg = (level?: string) => {
    switch (level) {
      case "low": return "bg-green-500/10 border-green-500/20";
      case "medium": return "bg-yellow-500/10 border-yellow-500/20";
      case "high": return "bg-red-500/10 border-red-500/20";
      default: return "bg-muted";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground text-lg">Loading risk metrics...</p>
        </div>
      </div>
    );
  }

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
                  <Button variant="secondary" size="sm" className="font-medium shadow-sm">
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
                      <Button variant="secondary" size="sm" className="w-full justify-start font-medium">
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
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-6 py-6 lg:py-8 space-y-6 lg:space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-1.5">Risk Management</h2>
            <p className="text-sm text-muted-foreground">Monitor portfolio risk, exposure, and Greeks in real-time</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getRiskLevelBg(riskMetrics?.risk_level)}`}>
            <Shield className="h-4 w-4" />
            <span className="text-sm font-semibold">
              Risk Level: {riskMetrics?.risk_level?.toUpperCase() || "UNKNOWN"}
            </span>
          </div>
        </div>

        {/* Risk Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card className="border border-border bg-gradient-to-br from-card to-card/50 hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Exposure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">
                ${totalExposure.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {positions.length} open positions
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-gradient-to-br from-card to-card/50 hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Max Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1 text-red-600 dark:text-red-500">
                ${riskMetrics?.max_loss?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum potential loss
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-gradient-to-br from-card to-card/50 hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Portfolio Delta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold mb-1 ${Math.abs(riskMetrics?.portfolio_delta || 0) > 50 ? 'text-red-600 dark:text-red-500' : ''}`}>
                {riskMetrics?.portfolio_delta?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                Directional exposure
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-gradient-to-br from-card to-card/50 hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Buying Power</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">
                {((riskMetrics?.buying_power_used || 0) * 100).toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Capital utilization
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Greeks Breakdown */}
        <Card className="border border-border bg-gradient-to-br from-card to-card/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Portfolio Greeks</CardTitle>
            <CardDescription className="text-xs">Aggregate options Greeks across all positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Delta (Δ)</span>
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold mb-1">{riskMetrics?.portfolio_delta?.toFixed(2) || "0.00"}</div>
                <p className="text-xs text-muted-foreground">Directional sensitivity</p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Gamma (Γ)</span>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold mb-1">{riskMetrics?.portfolio_gamma?.toFixed(4) || "0.0000"}</div>
                <p className="text-xs text-muted-foreground">Delta rate of change</p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Theta (Θ)</span>
                  <TrendingDown className="h-4 w-4 text-orange-500" />
                </div>
                <div className="text-2xl font-bold mb-1">{riskMetrics?.portfolio_theta?.toFixed(2) || "0.00"}</div>
                <p className="text-xs text-muted-foreground">Time decay per day</p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Vega (ν)</span>
                  <Activity className="h-4 w-4 text-purple-500" />
                </div>
                <div className="text-2xl font-bold mb-1">{riskMetrics?.portfolio_vega?.toFixed(2) || "0.00"}</div>
                <p className="text-xs text-muted-foreground">Volatility sensitivity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Utilization */}
        <Card className="border border-border bg-gradient-to-br from-card to-card/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Risk Utilization</CardTitle>
            <CardDescription className="text-xs">Current capital deployment vs maximum risk limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Portfolio Exposure</span>
                <span className="text-sm font-mono font-bold">{riskUtilization.toFixed(1)}%</span>
              </div>
              <Progress value={riskUtilization} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2">
                ${totalExposure.toFixed(2)} / ${maxPortfolioRisk.toFixed(2)}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Buying Power Used</span>
                <span className="text-sm font-mono font-bold">{((riskMetrics?.buying_power_used || 0) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(riskMetrics?.buying_power_used || 0) * 100} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Position Risk Breakdown */}
        <Card className="border border-border bg-gradient-to-br from-card to-card/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Position Risk Breakdown</CardTitle>
                <CardDescription className="text-xs">Individual position exposures and Greeks</CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {positions.length} Positions
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {positions.length > 0 ? (
                positions.map((pos) => {
                  const exposure = Math.abs(pos.quantity * pos.current_price);
                  const isDeltaHigh = Math.abs(pos.delta) > 0.7;
                  
                  return (
                    <div key={pos.id} className="p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-all duration-200 border border-border/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${(pos.pnl || 0) >= 0 ? 'bg-green-500 shadow-green-500/50 shadow-md' : 'bg-red-500 shadow-red-500/50 shadow-md'}`} />
                          <div>
                            <div className="text-base font-bold">{pos.symbol}</div>
                            <div className="text-xs text-muted-foreground">{pos.type} • Qty: {pos.quantity}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold mb-1">Exposure: ${exposure.toFixed(2)}</div>
                          <div className={`text-sm font-bold ${(pos.pnl || 0) >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                            P&L: {(pos.pnl || 0) >= 0 ? '+' : ''}${(pos.pnl || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-3 pt-3 border-t border-border/50">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Delta</div>
                          <div className={`text-sm font-bold ${isDeltaHigh ? 'text-red-600 dark:text-red-500' : ''}`}>
                            {pos.delta?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Gamma</div>
                          <div className="text-sm font-bold">{pos.gamma?.toFixed(4) || '0.0000'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Theta</div>
                          <div className="text-sm font-bold">{pos.theta?.toFixed(2) || '0.00'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Vega</div>
                          <div className="text-sm font-bold">{pos.vega?.toFixed(2) || '0.00'}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No active positions</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Risk Alerts */}
        {riskMetrics?.risk_level === "high" && (
          <Card className="border-red-500/50 bg-red-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <div>
                  <CardTitle className="text-lg font-bold text-red-600 dark:text-red-500">High Risk Alert</CardTitle>
                  <CardDescription className="text-xs">Your portfolio has exceeded safe risk thresholds</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {Math.abs(riskMetrics.portfolio_delta) > 50 && (
                  <li className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span>Portfolio delta is too high: {riskMetrics.portfolio_delta.toFixed(2)}</span>
                  </li>
                )}
                {riskUtilization > 80 && (
                  <li className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span>Risk utilization exceeds 80%: {riskUtilization.toFixed(1)}%</span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

