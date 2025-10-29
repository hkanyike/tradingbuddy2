"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Settings, Database, Shield, Bell, Key, Zap, TestTube, Brain, BarChart3, Newspaper, Menu, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface BrokerConnection {
  id: number;
  broker: string;
  api_key_preview: string;
  status: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const isPending = status === 'loading';
  const router = useRouter();
  const [brokerConnections, setBrokerConnections] = useState<BrokerConnection[]>([]);
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
    // Mock user ID - replace with actual auth
    const userId = "1";
    
    fetch(`/api/broker-connections/user/${userId}`)
      .then(res => res.json())
      .then(data => {
        setBrokerConnections(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error fetching broker connections:", error);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading settings...</p>
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
                  <Button variant="secondary" size="sm" className="font-medium shadow-sm">
                    <Settings className="h-4 w-4 mr-1.5" />
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
                      <Button variant="secondary" size="sm" className="w-full justify-start font-medium">
                        <Settings className="h-4 w-4 mr-2" />
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

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Settings</h2>
          <p className="text-muted-foreground mt-1">Configure your trading environment and integrations</p>
        </div>

        <div className="space-y-6">
          {/* Broker Integration */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Broker Integration</h3>
                <p className="text-sm text-muted-foreground">Connect your broker for live trading</p>
              </div>
            </div>

            {brokerConnections.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-lg">
                <Key className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No broker connections configured</p>
                <button className="bg-primary text-primary-foreground rounded-lg px-6 py-2 text-sm font-medium hover:bg-primary/90">
                  Add Broker Connection
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {brokerConnections.map(connection => (
                  <div key={connection.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h4 className="font-semibold text-foreground">{connection.broker}</h4>
                      <p className="text-sm text-muted-foreground">API Key: {connection.api_key_preview}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      connection.status === 'connected' 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {connection.status}
                    </span>
                  </div>
                ))}
                <button className="w-full border border-dashed border-border rounded-lg px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  + Add Another Broker
                </button>
              </div>
            )}

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Supported Brokers:</strong> Tradier, Interactive Brokers (IBKR). Start with paper trading to test strategies risk-free.
              </p>
            </div>
          </div>

          {/* Risk Management */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Risk Management</h3>
                <p className="text-sm text-muted-foreground">Configure position sizing and limits</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="max-position-size" className="text-sm font-medium text-foreground block mb-2">
                  Max Position Size (% of Portfolio)
                </Label>
                <Input 
                  id="max-position-size"
                  type="number" 
                  defaultValue="5" 
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground"
                  min="1"
                  max="25"
                />
              </div>

              <div>
                <Label htmlFor="daily-loss-limit" className="text-sm font-medium text-foreground block mb-2">
                  Daily Loss Limit (%)
                </Label>
                <Input 
                  id="daily-loss-limit"
                  type="number" 
                  defaultValue="2" 
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground"
                  min="1"
                  max="10"
                />
              </div>

              <div>
                <Label htmlFor="max-concurrent-positions" className="text-sm font-medium text-foreground block mb-2">
                  Maximum Concurrent Positions
                </Label>
                <Input 
                  id="max-concurrent-positions"
                  type="number" 
                  defaultValue="10" 
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground"
                  min="1"
                  max="50"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="kill-switch" className="h-4 w-4" defaultChecked />
                <Label htmlFor="kill-switch" className="text-sm text-foreground">
                  Enable kill-switch (auto-close all positions on daily limit breach)
                </Label>
              </div>

              <button className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 mt-4">
                Save Risk Settings
              </button>
            </div>
          </div>

          {/* Alerts & Notifications */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Bell className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Alerts & Notifications</h3>
                <p className="text-sm text-muted-foreground">Customize when you get notified</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Position opened/closed</span>
                <input type="checkbox" className="h-4 w-4" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Stop-loss triggered</span>
                <input type="checkbox" className="h-4 w-4" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Profit target reached</span>
                <input type="checkbox" className="h-4 w-4" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Risk limit approaching</span>
                <input type="checkbox" className="h-4 w-4" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">High-probability setup detected</span>
                <input type="checkbox" className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Data Sources */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Database className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Data Sources</h3>
                <p className="text-sm text-muted-foreground">Market data and options chains</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Trading Buddy uses real-time market data and historical options chains for analysis. 
              Configure your data provider API keys for enhanced functionality.
            </p>

            <button className="bg-secondary text-secondary-foreground rounded-lg px-6 py-2 text-sm font-medium hover:bg-secondary/90">
              Configure Data Providers
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

