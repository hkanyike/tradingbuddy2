"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, BarChart3, Database, TestTube, Brain, Settings as SettingsIcon, Zap, Shield, Newspaper, Menu, Calendar, Globe, TrendingDown, Wifi, WifiOff, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { NewsFeed } from "@/components/dashboard/news-feed";
import { SentimentIndicator } from "@/components/dashboard/sentiment-indicator";
import { EarningsCalendar } from "@/components/dashboard/earnings-calendar";
import { EconomicEvents } from "@/components/dashboard/economic-events";

export default function NewsPage() {
  const { data: session, status } = useSession();
  const isPending = status === 'loading';
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("market-news");
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLiveUpdateEnabled, setIsLiveUpdateEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
      return;
    }
  }, [session, isPending, router]);

  // Time update effect
  useEffect(() => {
    if (!isLiveUpdateEnabled) return;
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [isLiveUpdateEnabled]);

  // Online status effect
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load watchlist symbols for personalized news
  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const userId = session?.user ? (session.user as any).id : null;
        if (!userId) return;
        const [assetsRes, watchlistRes] = await Promise.all([
          fetch("/api/assets").then(res => res.json()),
          fetch(`/api/watchlist?userId=${userId}`).then(res => res.json())
        ]);
        
        const assets = assetsRes || [];
        const watchlist = watchlistRes || [];
        
        const symbols = watchlist
          .map((item: any) => assets.find((a: any) => a.id === item.assetId)?.symbol)
          .filter(Boolean);
        
        setWatchlistSymbols(symbols);
      } catch (error) {
        console.error("Error loading watchlist:", error);
      }
    };

    if (session?.user) {
      loadWatchlist();
    }
  }, [session]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header with Navigation */}
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
                  <Button variant="secondary" size="sm" className="font-medium shadow-sm">
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
              {/* Online/Offline Status */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/50 text-xs">
                {isOnline ? (
                  <>
                    <Wifi className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-muted-foreground font-medium">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-muted-foreground font-medium">Offline</span>
                  </>
                )}
              </div>

              {/* Time Display */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/50 text-xs">
                <span className="text-muted-foreground font-mono">
                  {lastUpdate.toLocaleTimeString()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-secondary"
                  onClick={() => setIsLiveUpdateEnabled(!isLiveUpdateEnabled)}
                >
                  {isLiveUpdateEnabled ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </Button>
              </div>

              {/* Mobile Menu */}
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
                      <Button variant="secondary" size="sm" className="w-full justify-start font-medium">
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

              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 lg:px-6 py-6 lg:py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Newspaper className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Market News & Events</h2>
            </div>
            <p className="text-muted-foreground">Real-time market news, sentiment analysis, earnings calendar, and economic events</p>
          </div>

          {/* Tabs for different news sections */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-1 bg-muted/50 p-1 mb-6">
              <TabsTrigger value="market-news" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Globe className="h-4 w-4 mr-1.5" />
                Market News
              </TabsTrigger>
              <TabsTrigger value="sentiment" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <TrendingUp className="h-4 w-4 mr-1.5" />
                Sentiment
              </TabsTrigger>
              <TabsTrigger value="earnings" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Calendar className="h-4 w-4 mr-1.5" />
                Earnings
              </TabsTrigger>
              <TabsTrigger value="economic" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <TrendingDown className="h-4 w-4 mr-1.5" />
                Economic
              </TabsTrigger>
            </TabsList>

            <TabsContent value="market-news" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <NewsFeed symbol={watchlistSymbols.join(',')} />
              </div>
            </TabsContent>

            <TabsContent value="sentiment" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <SentimentIndicator symbol={watchlistSymbols.join(',')} />
              </div>
            </TabsContent>

            <TabsContent value="earnings" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <EarningsCalendar />
              </div>
            </TabsContent>

            <TabsContent value="economic" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <EconomicEvents />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

