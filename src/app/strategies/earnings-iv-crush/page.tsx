"use client";

import Link from "next/link";
import { ArrowLeft, Play, Pause, Save, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function EarningsIVCrushPage() {
  const [isActive, setIsActive] = useState(false);
  const [config, setConfig] = useState({
    // Universe
    minOptionsVolume: 200,
    liquidityTickers: "SPY,QQQ",
    
    // Signal & Features
    ivPremiumThreshold: 1.2,
    ivWeeklyDiffThreshold: 5,
    skewDeltaLevel: 25,
    maxSpreadPercent: 5,
    minOpenInterest: 1000,
    
    // Entry Rules
    gapSigmaMin: -2,
    gapSigmaMax: 2,
    maxSpreadDollar: 0.05,
    strangeDeltaMin: 20,
    strangeDeltaMax: 30,
    targetCreditMultiplier: 1.2,
    entryDelayMinutes: 5,
    entryWindowMinutes: 15,
    
    // Risk & Position Sizing
    maxPositionRisk: 0.5, // % of equity
    stopLossMultiplier: 2.0, // x collected credit
    breachThreshold: 0.75, // x expected move
    maxDeltaPerShort: 0.15,
    dailyDrawdownLimit: 2.0, // %
    
    // Exit Rules
    exitTime: "15:45",
    profitTakePercent: 65, // keep 65-75% of premium
    
    // Regime Filters
    maxVIX: 35,
    minBeta: 0.5,
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
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Earnings IV-Crush</h1>
                <p className="text-sm text-muted-foreground">Delta-neutral premium capture strategy</p>
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
              Options IV typically spikes into earnings and mean-reverts after. This strategy sells post-earnings premium with tight risk controls.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-6 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Backtested Win Rate</p>
                <p className="text-2xl font-bold text-foreground">73.2%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Avg Return per Trade</p>
                <p className="text-2xl font-bold text-green-500">+2.8%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sharpe Ratio</p>
                <p className="text-2xl font-bold text-foreground">1.92</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Max Drawdown</p>
                <p className="text-2xl font-bold text-red-500">-4.1%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          {/* Universe Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Universe Selection</CardTitle>
              <CardDescription>Large-cap, highly liquid weeklies with earnings events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="liquidityTickers">Base Tickers (comma-separated)</Label>
                <Input
                  id="liquidityTickers"
                  value={config.liquidityTickers}
                  onChange={(e) => updateConfig('liquidityTickers', e.target.value)}
                  placeholder="SPY,QQQ,AAPL,MSFT"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Large-cap names with liquid weekly options
                </p>
              </div>
              <div>
                <Label htmlFor="minOptionsVolume">Top N by Options Volume</Label>
                <Input
                  id="minOptionsVolume"
                  type="number"
                  value={config.minOptionsVolume}
                  onChange={(e) => updateConfig('minOptionsVolume', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Filter top stocks by daily options volume rank
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                  ℹ️ Only names with earnings today after close or tomorrow pre-open
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Signal & Features */}
          <Card>
            <CardHeader>
              <CardTitle>Signal & Features</CardTitle>
              <CardDescription>IV premium, skew, liquidity metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ivPremiumThreshold">IV Premium Threshold (IV30d / RealizedVol20d)</Label>
                <Input
                  id="ivPremiumThreshold"
                  type="number"
                  step="0.1"
                  value={config.ivPremiumThreshold}
                  onChange={(e) => updateConfig('ivPremiumThreshold', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="ivWeeklyDiffThreshold">IV Weekly Diff Threshold (vol points)</Label>
                <Input
                  id="ivWeeklyDiffThreshold"
                  type="number"
                  value={config.ivWeeklyDiffThreshold}
                  onChange={(e) => updateConfig('ivWeeklyDiffThreshold', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  IV_EarningsWeek - IV_NextWeek minimum spread
                </p>
              </div>
              <div>
                <Label htmlFor="skewDeltaLevel">Skew Delta Level (±Δ)</Label>
                <Input
                  id="skewDeltaLevel"
                  type="number"
                  value={config.skewDeltaLevel}
                  onChange={(e) => updateConfig('skewDeltaLevel', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Compare IV(OTM put) - IV(OTM call) at equal delta
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Entry Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Entry Rules</CardTitle>
              <CardDescription>Post-earnings entry criteria (5-15 min after open)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gapSigmaMin">Gap Range Min (σ)</Label>
                  <Input
                    id="gapSigmaMin"
                    type="number"
                    step="0.1"
                    value={config.gapSigmaMin}
                    onChange={(e) => updateConfig('gapSigmaMin', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="gapSigmaMax">Gap Range Max (σ)</Label>
                  <Input
                    id="gapSigmaMax"
                    type="number"
                    step="0.1"
                    value={config.gapSigmaMax}
                    onChange={(e) => updateConfig('gapSigmaMax', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="maxSpreadDollar">Max Spread ($ for straddle)</Label>
                <Input
                  id="maxSpreadDollar"
                  type="number"
                  step="0.01"
                  value={config.maxSpreadDollar}
                  onChange={(e) => updateConfig('maxSpreadDollar', parseFloat(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="strangeDeltaMin">Strangle Delta Min</Label>
                  <Input
                    id="strangeDeltaMin"
                    type="number"
                    value={config.strangeDeltaMin}
                    onChange={(e) => updateConfig('strangeDeltaMin', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="strangeDeltaMax">Strangle Delta Max</Label>
                  <Input
                    id="strangeDeltaMax"
                    type="number"
                    value={config.strangeDeltaMax}
                    onChange={(e) => updateConfig('strangeDeltaMax', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="targetCreditMultiplier">Target Credit Multiplier (× next-day RV)</Label>
                <Input
                  id="targetCreditMultiplier"
                  type="number"
                  step="0.1"
                  value={config.targetCreditMultiplier}
                  onChange={(e) => updateConfig('targetCreditMultiplier', parseFloat(e.target.value))}
                />
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                  🎯 Sell 1-day strangle (±20-30Δ) OR short straddle if spreads tight
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Risk & Hedging */}
          <Card>
            <CardHeader>
              <CardTitle>Risk & Hedging</CardTitle>
              <CardDescription>Position sizing, stops, delta hedging rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="maxPositionRisk">Max Position Risk (% of equity)</Label>
                <Input
                  id="maxPositionRisk"
                  type="number"
                  step="0.1"
                  value={config.maxPositionRisk}
                  onChange={(e) => updateConfig('maxPositionRisk', parseFloat(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  0.25%-0.50% recommended per position max loss
                </p>
              </div>
              <div>
                <Label htmlFor="stopLossMultiplier">Stop-Loss Multiplier (× credit)</Label>
                <Input
                  id="stopLossMultiplier"
                  type="number"
                  step="0.1"
                  value={config.stopLossMultiplier}
                  onChange={(e) => updateConfig('stopLossMultiplier', parseFloat(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-buyback at 2× collected credit
                </p>
              </div>
              <div>
                <Label htmlFor="breachThreshold">Strike Breach Threshold (× expected move)</Label>
                <Input
                  id="breachThreshold"
                  type="number"
                  step="0.01"
                  value={config.breachThreshold}
                  onChange={(e) => updateConfig('breachThreshold', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="maxDeltaPerShort">Max Delta per Short (hedge trigger)</Label>
                <Input
                  id="maxDeltaPerShort"
                  type="number"
                  step="0.01"
                  value={config.maxDeltaPerShort}
                  onChange={(e) => updateConfig('maxDeltaPerShort', parseFloat(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If |Δ| {'>'} 0.15, rebalance with shares
                </p>
              </div>
              <div>
                <Label htmlFor="dailyDrawdownLimit">Kill-Switch: Daily DD Limit (%)</Label>
                <Input
                  id="dailyDrawdownLimit"
                  type="number"
                  step="0.1"
                  value={config.dailyDrawdownLimit}
                  onChange={(e) => updateConfig('dailyDrawdownLimit', parseFloat(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Halt all strategies if intraday drawdown exceeds limit
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Exit Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Exit Rules</CardTitle>
              <CardDescription>Time stops and profit targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="exitTime">Time Stop (ET)</Label>
                <Input
                  id="exitTime"
                  type="time"
                  value={config.exitTime}
                  onChange={(e) => updateConfig('exitTime', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Close all positions same day by this time
                </p>
              </div>
              <div>
                <Label htmlFor="profitTakePercent">Profit-Take: Keep % of Premium</Label>
                <Input
                  id="profitTakePercent"
                  type="number"
                  value={config.profitTakePercent}
                  onChange={(e) => updateConfig('profitTakePercent', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Buy back when 25-35% of credit remains (keep 65-75%)
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-xs font-medium text-green-900 dark:text-green-100">
                  ✓ Same-day exits only - no overnight risk
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Regime Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Regime Filters</CardTitle>
              <CardDescription>Market conditions and thresholds</CardDescription>
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
                <Label htmlFor="minBeta">Min Stock Beta</Label>
                <Input
                  id="minBeta"
                  type="number"
                  step="0.1"
                  value={config.minBeta}
                  onChange={(e) => updateConfig('minBeta', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="maxSpreadPercent">Max Liquidity Spread (%)</Label>
                <Input
                  id="maxSpreadPercent"
                  type="number"
                  step="0.1"
                  value={config.maxSpreadPercent}
                  onChange={(e) => updateConfig('maxSpreadPercent', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="minOpenInterest">Min Open Interest</Label>
                <Input
                  id="minOpenInterest"
                  type="number"
                  value={config.minOpenInterest}
                  onChange={(e) => updateConfig('minOpenInterest', parseInt(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ML Training Labels */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>ML Training Targets</CardTitle>
            <CardDescription>Supervised learning labels for strategy optimization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="h-6 w-6 bg-primary/10 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Post-Earnings Move Prediction</p>
                  <p className="text-xs text-muted-foreground">
                    Forecast realized move (open→close, close→close) and IV decay (IV_t+1 − IV_t)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="h-6 w-6 bg-primary/10 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Binary Classification: Profitable Trade</p>
                  <p className="text-xs text-muted-foreground">
                    Target: "profitable given quoted fills & execution rules"
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="h-6 w-6 bg-primary/10 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Regression: Delta-Hedged PnL</p>
                  <p className="text-xs text-muted-foreground">
                    Predict delta-hedged PnL for next trading session
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Requirements */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Data Requirements</CardTitle>
            <CardDescription>Historical options chains, underlying data, and event metadata</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Options Data (Minute Granularity)</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Bid/Ask/Mid prices with Greeks (Delta, Gamma, Theta, Vega)</li>
                  <li>• Implied Volatility surface by strike & expiry</li>
                  <li>• Open Interest & Volume</li>
                  <li>• Order book depth (L2 data)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Underlying & Event Data</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• OHLCV bars (1-min, 5-min)</li>
                  <li>• Earnings timestamps & surprise metrics</li>
                  <li>• Corporate actions (dividends, splits)</li>
                  <li>• VIX level & term structure</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}