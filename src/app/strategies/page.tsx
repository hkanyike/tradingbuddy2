"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Play, Pause, Settings as SettingsIcon, Calendar, Zap, Shield, Database, TestTube, Brain, BarChart3, Newspaper, Menu, Wifi, WifiOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface Strategy {
  id: number;
  name: string;
  type?: string;
  strategyType?: string;
  status?: string;
  isActive?: boolean;
  description: string;
  parameters?: Record<string, any>;
  config?: string;
  performance?: {
    total_trades: number;
    win_rate: number;
    avg_return: number;
    sharpe_ratio: number;
  };
}

export default function StrategiesPage() {
  const { data: session, status } = useSession();
  const isPending = status === 'loading';
  const router = useRouter();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLiveUpdateEnabled, setIsLiveUpdateEnabled] = useState(true);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
      return;
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (!isLiveUpdateEnabled) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, [isLiveUpdateEnabled]);

  useEffect(() => {
    const userId = "1";
    
    fetch(`/api/strategies/user/${userId}`)
      .then(res => res.json())
      .then(data => {
        setStrategies(data || []);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error fetching strategies:", error);
        setIsLoading(false);
      });
  }, []);

  const toggleStrategy = async (strategyId: number, isActive: boolean) => {
    const newStatus = !isActive;
    
    try {
      await fetch(`/api/strategies/${strategyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus })
      });
      
      setStrategies(prev => prev.map(s => 
        s.id === strategyId ? { ...s, isActive: newStatus } : s
      ));
    } catch (error) {
      console.error("Error toggling strategy:", error);
    }
  };

  const deleteStrategy = async (strategyId: number) => {
    if (!confirm("Are you sure you want to delete this strategy?")) {
      return;
    }

    try {
      const response = await fetch(`/api/strategies?id=${strategyId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setStrategies(prev => prev.filter(s => s.id !== strategyId));
      }
    } catch (error) {
      console.error("Error deleting strategy:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Zap className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground text-lg">Loading strategies...</p>
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
                  <Button variant="secondary" size="sm" className="font-medium shadow-sm">
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
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    <Link href="/strategies" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="secondary" size="sm" className="w-full justify-start font-medium">
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

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-6 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Trading Strategies</h2>
          <p className="text-muted-foreground">Configure and manage your AI-powered trading strategies</p>
        </div>

        {/* Your Configured Strategies */}
        {strategies.length > 0 ? (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">Active Strategies</h3>
              <span className="text-sm text-muted-foreground">{strategies.length} configured</span>
            </div>
            
            <div className="space-y-4">
              {strategies.map(strategy => {
                const isActive = strategy.isActive ?? (strategy.status === 'active');
                const strategyType = strategy.strategyType || strategy.type || 'custom';
                
                return (
                  <div key={strategy.id} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="text-xl font-semibold text-foreground">{strategy.name}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isActive 
                              ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                              : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                          }`}>
                            {isActive ? 'Active' : 'Paused'}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                            {strategyType}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6 max-w-3xl">{strategy.description}</p>
                        
                        {strategy.performance ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Trades</p>
                              <p className="text-2xl font-bold text-foreground">{strategy.performance.total_trades}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Win Rate</p>
                              <p className="text-2xl font-bold text-foreground">{strategy.performance.win_rate.toFixed(1)}%</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Return</p>
                              <p className="text-2xl font-bold text-green-500">+{strategy.performance.avg_return.toFixed(2)}%</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Sharpe Ratio</p>
                              <p className="text-2xl font-bold text-foreground">{strategy.performance.sharpe_ratio.toFixed(2)}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-muted/50 rounded-lg p-4 border border-dashed border-border">
                            <p className="text-sm text-muted-foreground">
                              ⏳ Awaiting first trade execution. Performance metrics will be available once the strategy begins trading.
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-6">
                        <button 
                          onClick={() => toggleStrategy(strategy.id, isActive)}
                          className={`p-3 rounded-lg transition-all border ${
                            isActive 
                              ? 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20 text-yellow-600' 
                              : 'bg-green-500/10 hover:bg-green-500/20 border-green-500/20 text-green-600'
                          }`}
                          title={isActive ? 'Pause strategy' : 'Activate strategy'}
                        >
                          {isActive ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteStrategy(strategy.id)}
                          className="p-3 rounded-lg transition-all border bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-600"
                          title="Delete strategy"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-12 bg-muted/30 border-2 border-dashed border-border rounded-xl p-12 text-center">
            <Zap className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Active Strategies</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              You haven't configured any trading strategies yet. Get started by selecting one of the pre-built strategies below.
            </p>
          </div>
        )}

        {/* Available Strategy Templates */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Strategy Templates</h3>
              <p className="text-sm text-muted-foreground mt-1">Pre-built strategies ready to configure</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings IV-Crush Strategy */}
            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <TrendingUp className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground">Earnings IV-Crush</h4>
                    <p className="text-xs text-muted-foreground">Delta-neutral premium capture</p>
                  </div>
                </div>
                <Link href="/strategies/earnings-iv-crush">
                  <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="View details">
                    <SettingsIcon className="h-5 w-5 text-muted-foreground" />
                  </button>
                </Link>
              </div>
              
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Captures IV mean-reversion after earnings by selling post-earnings premium with tight delta-neutral hedging and strict risk controls.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                  <p className="text-lg font-bold text-foreground">73.2%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Avg Return</p>
                  <p className="text-lg font-bold text-green-500">+2.8%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Sharpe</p>
                  <p className="text-lg font-bold text-foreground">1.92</p>
                </div>
              </div>

              <Link href="/strategies/earnings-iv-crush" className="block">
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Configure Strategy
                </Button>
              </Link>
            </div>

            {/* Calendar-Carry Strategy */}
            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <Calendar className="h-7 w-7 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground">Calendar-Carry</h4>
                    <p className="text-xs text-muted-foreground">Term structure arbitrage</p>
                  </div>
                </div>
                <Link href="/strategies/calendar-carry">
                  <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="View details">
                    <SettingsIcon className="h-5 w-5 text-muted-foreground" />
                  </button>
                </Link>
              </div>
              
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Exploits term structure inefficiencies by trading calendar spreads when front-week IV is rich vs back-week, harvesting carry as it normalizes.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                  <p className="text-lg font-bold text-foreground">68.5%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Avg Return</p>
                  <p className="text-lg font-bold text-green-500">+1.9%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Sharpe</p>
                  <p className="text-lg font-bold text-foreground">1.64</p>
                </div>
              </div>

              <Link href="/strategies/calendar-carry" className="block">
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Configure Strategy
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl p-6">
          <div className="flex gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">About Strategy Configuration</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                Each strategy includes configurable parameters for risk management, position sizing, entry/exit rules, and more. 
                Click "Configure Strategy" to customize thresholds, stop-loss rules, and execution preferences before activation.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

