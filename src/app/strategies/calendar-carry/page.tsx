"use client";

import Link from "next/link";
import { ArrowLeft, Play, Pause, Save, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function CalendarCarryPage() {
  const [isActive, setIsActive] = useState(false);
  const [config, setConfig] = useState({
    // Setup & Screening
    ivFrontBackThreshold: 5, // vol points
    ivFrontBackMax: 8,
    minSkewStability: 0.8, // correlation threshold
    
    // Entry Rules
    entryTimeAfter: "10:00",
    atmDelta: 50,
    minPriceEdge: 0.05, // $ vs fitted IV surface
    maxSpreadPercent: 3,
    
    // Risk Management
    maxCapitalPerSymbol: 1.0, // % notional
    underlyingMoveThreshold: 1.25, // × modeled daily move
    backWeekIVSpikeThreshold: 3, // vol points increase
    
    // Exit Rules
    profitTargetMin: 15, // %
    profitTargetMax: 25,
    thetaStallHours: 2,
    timeStopEOD: true,
    closeBeforeExpiry: true, // T-1 of near expiry
    
    // Liquidity Filters
    minOpenInterest: 500,
    maxBidAskSpread: 0.10, // $ per contract
    minDailyVolume: 100,
    
    // Regime Filters
    maxVIX: 30,
    minIVRank: 20, // don't trade in extremely low IV environments
  });

  const updateConfig = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/strategies" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Strategies
          </Link>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Calendar-Carry</h1>
                <p className="text-sm text-muted-foreground">Term-structure mean reversion strategy</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="lg">
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
              <Button 
                size="lg"
                variant={isActive ? "destructive" : "default"}
                onClick={() => setIsActive(!isActive)}
              >
                {isActive ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Strategy
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Activate Strategy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Strategy Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Strategy Overview</CardTitle>
            <CardDescription>
              Exploits term structure inefficiencies by trading calendar spreads when front-week IV is rich vs back-week, harvesting carry as it normalizes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-6 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Backtested Win Rate</p>
                <p className="text-2xl font-bold text-foreground">68.5%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Avg Return per Trade</p>
                <p className="text-2xl font-bold text-green-500">+1.9%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sharpe Ratio</p>
                <p className="text-2xl font-bold text-foreground">1.64</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Max Drawdown</p>
                <p className="text-2xl font-bold text-red-500">-3.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          {/* Setup & Screening */}
          <Card>
            <CardHeader>
              <CardTitle>Setup & Screening</CardTitle>
              <CardDescription>Term structure screening criteria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ivFrontBackThreshold">IV Front-Back Min (vol points)</Label>
                  <Input
                    id="ivFrontBackThreshold"
                    type="number"
                    step="0.5"
                    value={config.ivFrontBackThreshold}
                    onChange={(e) => updateConfig('ivFrontBackThreshold', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="ivFrontBackMax">IV Front-Back Max (vol points)</Label>
                  <Input
                    id="ivFrontBackMax"
                    type="number"
                    step="0.5"
                    value={config.ivFrontBackMax}
                    onChange={(e) => updateConfig('ivFrontBackMax', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Screen when IV(Front, ATM) − IV(Next, ATM) is within this range
              </p>
              <div>
                <Label htmlFor="minSkewStability">Min Skew Stability</Label>
                <Input
                  id="minSkewStability"
                  type="number"
                  step="0.1"
                  value={config.minSkewStability}
                  onChange={(e) => updateConfig('minSkewStability', parseFloat(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Correlation threshold - require stable skew structure
                </p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                  ⚠️ Avoid symbols with major catalysts in back-week
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Entry Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Entry Rules</CardTitle>
              <CardDescription>Calendar spread entry criteria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="entryTimeAfter">Entry Time After (ET)</Label>
                <Input
                  id="entryTimeAfter"
                  type="time"
                  value={config.entryTimeAfter}
                  onChange={(e) => updateConfig('entryTimeAfter', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter after this time to avoid opening volatility
                </p>
              </div>
              <div>
                <Label htmlFor="atmDelta">ATM Delta Target</Label>
                <Input
                  id="atmDelta"
                  type="number"
                  value={config.atmDelta}
                  onChange={(e) => updateConfig('atmDelta', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Buy ATM calendar: long near-exp ATM, short next-exp ATM
                </p>
              </div>
              <div>
                <Label htmlFor="minPriceEdge">Min Price Edge ($ vs IV surface)</Label>
                <Input
                  id="minPriceEdge"
                  type="number"
                  step="0.01"
                  value={config.minPriceEdge}
                  onChange={(e) => updateConfig('minPriceEdge', parseFloat(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Mid-price edge ≥ $0.05 vs fitted IV surface required
                </p>
              </div>
              <div>
                <Label htmlFor="maxSpreadPercent">Max Spread (%)</Label>
                <Input
                  id="maxSpreadPercent"
                  type="number"
                  step="0.1"
                  value={config.maxSpreadPercent}
                  onChange={(e) => updateConfig('maxSpreadPercent', parseFloat(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Risk Management */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Management</CardTitle>
              <CardDescription>Position sizing and risk controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="maxCapitalPerSymbol">Max Capital per Symbol (% notional)</Label>
                <Input
                  id="maxCapitalPerSymbol"
                  type="number"
                  step="0.1"
                  value={config.maxCapitalPerSymbol}
                  onChange={(e) => updateConfig('maxCapitalPerSymbol', parseFloat(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  1% notional recommended maximum
                </p>
              </div>
              <div>
                <Label htmlFor="underlyingMoveThreshold">Underlying Move Stop (× modeled move)</Label>
                <Input
                  id="underlyingMoveThreshold"
                  type="number"
                  step="0.01"
                  value={config.underlyingMoveThreshold}
                  onChange={(e) => updateConfig('underlyingMoveThreshold', parseFloat(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Close if underlying moves {'>'} 1.25× modeled daily move
                </p>
              </div>
              <div>
                <Label htmlFor="backWeekIVSpikeThreshold">Back-Week IV Spike Alert (vol pts)</Label>
                <Input
                  id="backWeekIVSpikeThreshold"
                  type="number"
                  step="0.5"
                  value={config.backWeekIVSpikeThreshold}
                  onChange={(e) => updateConfig('backWeekIVSpikeThreshold', parseFloat(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Exit if back-week IV spikes (potential news leak)
                </p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-xs font-medium text-red-900 dark:text-red-100">
                  🛡️ Auto-close on risk threshold breach
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Exit Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Exit Rules</CardTitle>
              <CardDescription>Profit targets and time stops</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profitTargetMin">Profit Target Min (%)</Label>
                  <Input
                    id="profitTargetMin"
                    type="number"
                    value={config.profitTargetMin}
                    onChange={(e) => updateConfig('profitTargetMin', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="profitTargetMax">Profit Target Max (%)</Label>
                  <Input
                    id="profitTargetMax"
                    type="number"
                    value={config.profitTargetMax}
                    onChange={(e) => updateConfig('profitTargetMax', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Take profit when calendar gains 15-25% or theta stalls
              </p>
              <div>
                <Label htmlFor="thetaStallHours">Theta Stall Period (hours)</Label>
                <Input
                  id="thetaStallHours"
                  type="number"
                  value={config.thetaStallHours}
                  onChange={(e) => updateConfig('thetaStallHours', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Exit if theta gains stall for this many hours
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="timeStopEOD"
                    checked={config.timeStopEOD}
                    onChange={(e) => updateConfig('timeStopEOD', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="timeStopEOD" className="cursor-pointer">Close all positions EOD</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="closeBeforeExpiry"
                    checked={config.closeBeforeExpiry}
                    onChange={(e) => updateConfig('closeBeforeExpiry', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="closeBeforeExpiry" className="cursor-pointer">Close T-1 of near expiry</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liquidity Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Liquidity Filters</CardTitle>
              <CardDescription>Minimum liquidity requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="minOpenInterest">Min Open Interest</Label>
                <Input
                  id="minOpenInterest"
                  type="number"
                  value={config.minOpenInterest}
                  onChange={(e) => updateConfig('minOpenInterest', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="maxBidAskSpread">Max Bid-Ask Spread ($)</Label>
                <Input
                  id="maxBidAskSpread"
                  type="number"
                  step="0.01"
                  value={config.maxBidAskSpread}
                  onChange={(e) => updateConfig('maxBidAskSpread', parseFloat(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Per contract maximum spread
                </p>
              </div>
              <div>
                <Label htmlFor="minDailyVolume">Min Daily Volume</Label>
                <Input
                  id="minDailyVolume"
                  type="number"
                  value={config.minDailyVolume}
                  onChange={(e) => updateConfig('minDailyVolume', parseInt(e.target.value))}
                />
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                  ℹ️ Strict liquidity requirements ensure tight spreads and reliable fills
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Regime Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Regime Filters</CardTitle>
              <CardDescription>Market environment conditions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="maxVIX">Max VIX Level</Label>
                <Input
                  id="maxVIX"
                  type="number"
                  value={config.maxVIX}
                  onChange={(e) => updateConfig('maxVIX', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Don't trade if VIX exceeds this level
                </p>
              </div>
              <div>
                <Label htmlFor="minIVRank">Min IV Rank</Label>
                <Input
                  id="minIVRank"
                  type="number"
                  value={config.minIVRank}
                  onChange={(e) => updateConfig('minIVRank', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Avoid extremely low IV environments ({'<'}20 IVR)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strategy Mechanics */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Strategy Mechanics</CardTitle>
            <CardDescription>How the calendar-carry strategy works</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Calendar Spread Structure</h4>
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground mb-1">Long Leg (Near-Expiry)</p>
                    <p>Buy ATM option expiring in front week (near-term)</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Short Leg (Back-Week)</p>
                    <p>Sell ATM option expiring in next week (further out)</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">Profit Mechanism</h4>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• When front-week IV is elevated vs back-week, calendar spread is cheap</li>
                  <li>• As term structure normalizes, front-week decays faster (theta carry)</li>
                  <li>• Profit from time decay differential between near and far options</li>
                  <li>• Maximum profit when underlying stays near ATM strike</li>
                </ul>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <h4 className="font-medium text-sm text-amber-900 dark:text-amber-100 mb-2">Risk Factors</h4>
                <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                  <li>• Large underlying moves can hurt (want price stability)</li>
                  <li>• Back-week IV spike from news reduces spread value</li>
                  <li>• Front-week IV collapse can reduce profit potential</li>
                  <li>• Best in moderate volatility with stable skew</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Requirements */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Data Requirements</CardTitle>
            <CardDescription>Historical and real-time data needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Options Data</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Full IV surface across strikes & expiries</li>
                  <li>• Term structure (IV by expiry for ATM)</li>
                  <li>• Bid/Ask/Mid prices with Greeks</li>
                  <li>• Open Interest & Volume by expiry</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Underlying & Events</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• OHLCV bars (5-min granularity)</li>
                  <li>• Corporate event calendar (earnings, ex-div)</li>
                  <li>• VIX & VIX term structure</li>
                  <li>• Realized volatility (20-day, 60-day)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
