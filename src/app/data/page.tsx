"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Database, Upload, RefreshCw, FileText, CheckCircle, AlertCircle, BarChart3, Zap, Shield, TestTube, Brain, Settings as SettingsIcon, Newspaper, Menu, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function DataManagementPage() {
  const { data: session, status } = useSession();
  const isPending = status === 'loading';
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLiveUpdateEnabled, setIsLiveUpdateEnabled] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  const [dataStatus, setDataStatus] = useState({
    underlyingBars: { status: "active", lastUpdate: "2 min ago", records: "2.4M" },
    optionsChains: { status: "active", lastUpdate: "5 min ago", records: "18.3M" },
    events: { status: "active", lastUpdate: "1 hour ago", records: "4.2K" },
    vix: { status: "active", lastUpdate: "5 min ago", records: "125K" }
  });

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
      return;
    }
  }, [session, isPending, router]);

  // Live updates interval
  useEffect(() => {
    if (!isLiveUpdateEnabled || !session) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isLiveUpdateEnabled, session]);

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
                  <Button variant="secondary" size="sm" className="font-medium shadow-sm">
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
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Shield className="h-4 w-4 mr-2" />
                        Risk
                      </Button>
                    </Link>
                    <Link href="/data" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="secondary" size="sm" className="w-full justify-start font-medium">
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

      <main className="container mx-auto px-4 lg:px-6 py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-1.5">Data Management</h2>
            <p className="text-sm text-muted-foreground">Manage historical data feeds, feature engineering, and data quality</p>
          </div>
        </div>

        {/* Data Sources Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Object.entries(dataStatus).map(([key, data]) => (
            <Card key={key} className="border border-border bg-gradient-to-br from-card to-card/50 hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {data.status === "active" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.records}</div>
                <p className="text-xs text-muted-foreground">Updated {data.lastUpdate}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Underlying Bars Schema */}
          <Card className="border border-border bg-gradient-to-br from-card to-card/50 shadow-sm">
            <CardHeader>
              <CardTitle>Underlying Bars</CardTitle>
              <CardDescription>Stock/ETF OHLCV with timestamp alignment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-muted/30 p-3 rounded font-mono text-xs">
                  <div className="text-muted-foreground mb-2">Schema:</div>
                  <div>timestamp: datetime</div>
                  <div>symbol: string</div>
                  <div>open, high, low, close: float</div>
                  <div>volume: int</div>
                </div>
                <div className="space-y-2">
                  <Label>Data Cadence</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">1-min (earnings days)</Button>
                    <Button variant="outline" size="sm">5-min (normal)</Button>
                    <Button variant="outline" size="sm">15-min (history)</Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="underlying-vendor">Vendor</Label>
                  <Input id="underlying-vendor" placeholder="Polygon.io, Alpaca, etc." />
                </div>
                <Button className="w-full gap-2">
                  <Upload className="h-4 w-4" />
                  Ingest Historical Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Options Chains Schema */}
          <Card className="border border-border bg-gradient-to-br from-card to-card/50 shadow-sm">
            <CardHeader>
              <CardTitle>Options Chains</CardTitle>
              <CardDescription>Quotes, Greeks, IV per strike/expiry</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-muted/30 p-3 rounded font-mono text-xs">
                  <div className="text-muted-foreground mb-2">Schema:</div>
                  <div>timestamp, symbol, expiry, strike</div>
                  <div>right: C/P</div>
                  <div>bid, ask, last, volume, oi</div>
                  <div>iv, delta, gamma, theta, vega</div>
                </div>
                <div>
                  <Label>Granularity</Label>
                  <div className="text-sm text-muted-foreground">Minute-level around earnings, 5-15 min elsewhere</div>
                </div>
                <div>
                  <Label htmlFor="options-vendor">Vendor</Label>
                  <Input id="options-vendor" placeholder="ORATS, ThetaData, IBKR, etc." />
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs">
                  Store as Parquet partitioned by date/symbol/expiry for fast I/O
                </div>
                <Button className="w-full gap-2">
                  <Upload className="h-4 w-4" />
                  Ingest Options Chains
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Events Data */}
          <Card className="border border-border bg-gradient-to-br from-card to-card/50 shadow-sm">
            <CardHeader>
              <CardTitle>Events Calendar</CardTitle>
              <CardDescription>Earnings, dividends, corporate actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-muted/30 p-3 rounded font-mono text-xs">
                  <div className="text-muted-foreground mb-2">Schema:</div>
                  <div>symbol: string</div>
                  <div>earnings_dt: datetime</div>
                  <div>before_open: bool</div>
                  <div>after_close: bool</div>
                  <div>div_dt: datetime (optional)</div>
                  <div>rate: float (optional)</div>
                </div>
                <div>
                  <Label htmlFor="events-source">Source</Label>
                  <Input id="events-source" placeholder="Earnings Whispers, AlphaVantage" />
                </div>
                <Button className="w-full gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Sync Events
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Market Regime Data */}
          <Card className="border border-border bg-gradient-to-br from-card to-card/50 shadow-sm">
            <CardHeader>
              <CardTitle>Market Regime</CardTitle>
              <CardDescription>VIX, rates, liquidity indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-muted/30 p-3 rounded font-mono text-xs">
                  <div className="text-muted-foreground mb-2">Indicators:</div>
                  <div>VIX level & term structure</div>
                  <div>Interest rates (risk-free)</div>
                  <div>Market depth/liquidity metrics</div>
                  <div>Overnight gap statistics</div>
                </div>
                <div>
                  <Label>Update Frequency</Label>
                  <Input type="number" placeholder="5" /> minutes
                </div>
                <Button className="w-full gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Update Regime Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Engineering Pipeline */}
        <Card className="mt-6 border border-border bg-gradient-to-br from-card to-card/50 shadow-sm">
          <CardHeader>
            <CardTitle>Feature Engineering Pipeline</CardTitle>
            <CardDescription>Transform raw data into ML features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">IV Term/Shape</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• iv_atm_front, iv_atm_next</li>
                    <li>• iv_spread = front - next</li>
                    <li>• Skew: iv_put_25d - iv_call_25d</li>
                    <li>• Smile curvature (quadratic fit)</li>
                  </ul>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">IV vs RV</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• iv_atm_front / realized_vol_20d</li>
                    <li>• expected_move = iv * sqrt(D)</li>
                    <li>• empirical gap stats</li>
                    <li>• vol-of-vol indicators</li>
                  </ul>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Liquidity</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• spread_pct = (ask - bid) / mid</li>
                    <li>• open_interest, volume</li>
                    <li>• NBBO age (if available)</li>
                    <li>• depth at L2</li>
                  </ul>
                </div>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Regime Indicators</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-xs text-muted-foreground">
                  <div>VIX level</div>
                  <div>Stock beta</div>
                  <div>Recent overnight gap σ</div>
                  <div>Post-earnings gating (minutes_since_open, gap_zscore)</div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  View Feature Definitions
                </Button>
                <Button variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rebuild Features
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Validation */}
        <Card className="mt-6 border border-border bg-gradient-to-br from-card to-card/50 shadow-sm">
          <CardHeader>
            <CardTitle>Data Quality & Validation</CardTitle>
            <CardDescription>Timestamp alignment, missing data checks, anomaly detection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Timestamp Alignment</h4>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-xs text-muted-foreground">Millisecond precision maintained across all feeds</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Missing Data</h4>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-xs text-muted-foreground">0.02% gaps detected, forward-fill applied</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Anomaly Detection</h4>
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-xs text-muted-foreground">3 outliers flagged in SPY chain (under review)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

