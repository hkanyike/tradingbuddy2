"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp, Shield, Zap, BarChart3, Bell, Settings, Database, TestTube, Brain, Newspaper, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSession, authClient } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function HomePage() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      localStorage.removeItem("bearer_token");
      router.push("/");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              
              {session?.user && (
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
                    <Button variant="ghost" size="sm" className="hover:bg-secondary/80">
                      <Settings className="h-4 w-4 mr-1.5" />
                      Settings
                    </Button>
                  </Link>
                </nav>
              )}
            </div>
            
            <div className="flex items-center gap-2 lg:gap-3">
              {session?.user && (
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
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Button>
                      </Link>
                    </div>
                  </SheetContent>
                </Sheet>
              )}

              {session?.user ? (
                <>
                  <Link href="/dashboard">
                    <Button size="sm">Go to Dashboard</Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-1.5" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link href="/sign-in">
                  <Button size="sm">Sign In</Button>
                </Link>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-block mb-4 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
            Invite-Only Platform
          </div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
            AI-Powered Options Trading
          </h2>
          <p className="text-xl text-muted-foreground">
            Automated trading strategies for earnings IV-crush, calendar spreads, and volatility arbitrage
          </p>
          <div className="flex gap-4 justify-center">
            {session?.user ? (
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button size="lg" className="gap-2">
                    Sign In <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" disabled>
                  Invite Only
                </Button>
              </>
            )}
          </div>
          {!session?.user && (
            <p className="text-sm text-muted-foreground">
              This platform requires an invite code to join. Have an invite? <Link href="/sign-up" className="text-primary hover:underline">Sign up here</Link>
            </p>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Automated Execution</CardTitle>
              <CardDescription>
                AI-powered trade generation with automated risk checks and broker execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Real-time signal generation</li>
                <li>• Complex order routing</li>
                <li>• Smart fill optimization</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Risk Management</CardTitle>
              <CardDescription>
                Multi-layered protection with position limits, stop-losses, and kill-switch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Position sizing controls</li>
                <li>• Greek exposure limits</li>
                <li>• Automated circuit breakers</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Multi-Asset Support</CardTitle>
              <CardDescription>
                Trade options on stocks, indices, ETFs, futures, and cryptocurrencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Index options (SPX, QQQ, IWM)</li>
                <li>• Sector & commodity ETFs</li>
                <li>• Futures & crypto options</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Strategy Library</CardTitle>
              <CardDescription>
                Pre-built strategies for earnings IV-crush, calendar spreads, and volatility trading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Earnings IV-Crush (delta-neutral)</li>
                <li>• Calendar-Carry spreads</li>
                <li>• Custom strategy builder</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Bell className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Real-Time Monitoring</CardTitle>
              <CardDescription>
                Live PnL tracking, Greek analytics, and intelligent alert system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Live position Greeks</li>
                <li>• Risk exposure dashboard</li>
                <li>• Smart alert notifications</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Settings className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Broker Integration</CardTitle>
              <CardDescription>
                Connect to Tradier, Interactive Brokers, or paper trade for testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Paper trading support</li>
                <li>• Multi-broker compatibility</li>
                <li>• Secure API key management</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      {session?.user && (
        <section className="container mx-auto px-4 py-16">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Ready to Start Trading?</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Set up your AI trading agent in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="gap-2">
                  Launch Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Trading Buddy - AI-Powered Options Trading Platform</p>
        </div>
      </footer>
    </div>
  );
}

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

