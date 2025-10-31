"use client";

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowRight,
  Clock,
  BarChart3,
  Activity,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ContractRecommendation {
  symbol: string;
  strikePrice: number;
  expirationDate: string;
  type: 'call' | 'put';
  price: number;
  recommendedContracts: number;
  allocation: number;
  confidence: number;
  expectedReturn: number;
  maxLoss: number;
  winProbability: number;
  reasoning: string[];
  mlSignals: {
    priceTarget: number;
    currentPrice: number;
    ivRank: number;
    technicalScore: number;
    volumeLiquidity: string;
  };
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  };
  score: number;
}

interface ScanResult {
  recommendations: ContractRecommendation[];
  portfolioMetrics: {
    totalAllocation: number;
    expectedReturn: number;
    maxLoss: number;
    overallWinProbability: number;
    portfolioDelta: number;
    diversificationScore: number;
  };
  scanMetadata: {
    timestamp: number;
    symbolsScanned: number;
    contractsAnalyzed: number;
    scanDuration: number;
  };
}

export default function AIBudgetScannerPage() {
  const [budget, setBudget] = useState<string>('5000');
  const [riskTolerance, setRiskTolerance] = useState<'low' | 'medium' | 'high'>('medium');
  const [strategy, setStrategy] = useState<'growth' | 'income' | 'balanced'>('balanced');
  const [maxPositions, setMaxPositions] = useState<string>('4');
  const [timeHorizon, setTimeHorizon] = useState<'1week' | '1month' | '3months'>('1month');
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedTab, setSelectedTab] = useState('recommendations');

  const handleScan = async () => {
    const budgetNum = parseFloat(budget);
    const maxPositionsNum = parseInt(maxPositions);

    if (isNaN(budgetNum) || budgetNum < 100) {
      toast.error('Budget must be at least $100');
      return;
    }

    if (isNaN(maxPositionsNum) || maxPositionsNum < 1 || maxPositionsNum > 10) {
      toast.error('Max positions must be between 1 and 10');
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      const response = await fetch('/api/ai/budget-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          budget: budgetNum,
          riskTolerance,
          strategy,
          maxPositions: maxPositionsNum,
          timeHorizon
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setScanResult(result);
        setSelectedTab('recommendations');
        toast.success(`Found ${result.recommendations.length} recommendations!`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Scan failed');
      }
    } catch (error) {
      console.error('Error scanning market:', error);
      toast.error('Failed to scan market');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10">
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">AI Budget Scanner</h1>
              <p className="text-muted-foreground text-lg">
                AI-powered contract recommendations based on your budget
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-yellow-700 dark:text-yellow-400">
                    Important Disclaimer
                  </p>
                  <p className="text-muted-foreground">
                    AI-generated recommendations are not financial advice. Options trading involves substantial risk of loss. 
                    You are responsible for all trading decisions. Past performance does not guarantee future results.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Scan Configuration
            </CardTitle>
            <CardDescription>
              Tell us about your budget and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="budget" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Budget
                </Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="5000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  min="100"
                  max="1000000"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum: $100 • Maximum: $1,000,000
                </p>
              </div>

              {/* Risk Tolerance */}
              <div className="space-y-2">
                <Label htmlFor="risk" className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Risk Tolerance
                </Label>
                <Select value={riskTolerance} onValueChange={(v: any) => setRiskTolerance(v)}>
                  <SelectTrigger id="risk">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Conservative)</SelectItem>
                    <SelectItem value="medium">Medium (Moderate)</SelectItem>
                    <SelectItem value="high">High (Aggressive)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {riskTolerance === 'low' && 'Max 15% per position'}
                  {riskTolerance === 'medium' && 'Max 25% per position'}
                  {riskTolerance === 'high' && 'Max 35% per position'}
                </p>
              </div>

              {/* Strategy */}
              <div className="space-y-2">
                <Label htmlFor="strategy" className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  Strategy
                </Label>
                <Select value={strategy} onValueChange={(v: any) => setStrategy(v)}>
                  <SelectTrigger id="strategy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="growth">Growth (Tech/High Growth)</SelectItem>
                    <SelectItem value="income">Income (Blue Chips)</SelectItem>
                    <SelectItem value="balanced">Balanced (Mixed)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {strategy === 'growth' && 'NVDA, TSLA, AMD, etc.'}
                  {strategy === 'income' && 'AAPL, MSFT, JPM, etc.'}
                  {strategy === 'balanced' && 'Mixed portfolio'}
                </p>
              </div>

              {/* Max Positions */}
              <div className="space-y-2">
                <Label htmlFor="positions" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-orange-500" />
                  Max Positions
                </Label>
                <Input
                  id="positions"
                  type="number"
                  placeholder="4"
                  value={maxPositions}
                  onChange={(e) => setMaxPositions(e.target.value)}
                  min="1"
                  max="10"
                />
                <p className="text-xs text-muted-foreground">
                  Diversification (1-10 positions)
                </p>
              </div>

              {/* Time Horizon */}
              <div className="space-y-2">
                <Label htmlFor="horizon" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-cyan-500" />
                  Time Horizon
                </Label>
                <Select value={timeHorizon} onValueChange={(v: any) => setTimeHorizon(v)}>
                  <SelectTrigger id="horizon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1week">1 Week (Short-term)</SelectItem>
                    <SelectItem value="1month">1 Month (Medium-term)</SelectItem>
                    <SelectItem value="3months">3 Months (Long-term)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Contract expiration timeframe
                </p>
              </div>

              {/* Scan Button */}
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button 
                  onClick={handleScan} 
                  disabled={isScanning}
                  className="w-full h-10"
                  size="lg"
                >
                  {isScanning ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Scanning Market...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Scan Market
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {scanResult && (
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recommendations">
                <Lightbulb className="h-4 w-4 mr-2" />
                Recommendations ({scanResult.recommendations.length})
              </TabsTrigger>
              <TabsTrigger value="portfolio">
                <BarChart3 className="h-4 w-4 mr-2" />
                Portfolio Analysis
              </TabsTrigger>
              <TabsTrigger value="details">
                <Info className="h-4 w-4 mr-2" />
                Scan Details
              </TabsTrigger>
            </TabsList>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-4">
              {scanResult.recommendations.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No recommendations found matching your criteria. Try adjusting your parameters.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                scanResult.recommendations.map((rec, index) => (
                  <Card key={index} className="border-primary/20 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            rec.type === 'call' ? 'bg-green-500/10' : 'bg-red-500/10'
                          }`}>
                            {rec.type === 'call' ? (
                              <TrendingUp className="h-6 w-6 text-green-500" />
                            ) : (
                              <TrendingDown className="h-6 w-6 text-red-500" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-2xl">
                              {rec.symbol} ${rec.strikePrice} {rec.type.toUpperCase()}
                            </CardTitle>
                            <CardDescription>
                              Expires {new Date(rec.expirationDate).toLocaleDateString()}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-lg px-3 py-1">
                          #{index + 1}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Price</div>
                          <div className="text-xl font-bold">${rec.price.toFixed(2)}</div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Contracts</div>
                          <div className="text-xl font-bold">{rec.recommendedContracts}x</div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Allocation</div>
                          <div className="text-xl font-bold">${rec.allocation.toFixed(0)}</div>
                        </div>
                        <div className="text-center p-3 bg-green-500/10 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Target Profit</div>
                          <div className="text-xl font-bold text-green-600">
                            ${rec.expectedReturn.toFixed(0)}
                          </div>
                        </div>
                      </div>

                      {/* AI Insights */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Brain className="h-4 w-4 text-purple-500" />
                          AI Reasoning
                        </h4>
                        <div className="space-y-2">
                          {rec.reasoning.map((reason, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Confidence & Risk */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">ML Confidence</span>
                            <span className="text-xl font-bold text-blue-600">
                              {(rec.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${rec.confidence * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Win Probability</span>
                            <span className="text-xl font-bold text-green-600">
                              {(rec.winProbability * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full transition-all"
                              style={{ width: `${rec.winProbability * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Max Loss</span>
                            <span className="text-xl font-bold text-red-600">
                              ${rec.maxLoss.toFixed(0)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            100% of allocation
                          </div>
                        </div>
                      </div>

                      {/* Greeks & Signals */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-2 bg-muted/30 rounded text-center">
                          <div className="text-xs text-muted-foreground">Delta</div>
                          <div className="font-semibold">{rec.greeks.delta.toFixed(2)}</div>
                        </div>
                        <div className="p-2 bg-muted/30 rounded text-center">
                          <div className="text-xs text-muted-foreground">Theta</div>
                          <div className="font-semibold">${rec.greeks.theta.toFixed(2)}</div>
                        </div>
                        <div className="p-2 bg-muted/30 rounded text-center">
                          <div className="text-xs text-muted-foreground">IV Rank</div>
                          <div className="font-semibold">{rec.mlSignals.ivRank.toFixed(0)}</div>
                        </div>
                        <div className="p-2 bg-muted/30 rounded text-center">
                          <div className="text-xs text-muted-foreground">Liquidity</div>
                          <div className="font-semibold">{rec.mlSignals.volumeLiquidity}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Portfolio Analysis
                  </CardTitle>
                  <CardDescription>
                    Overall portfolio metrics and risk assessment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="border-blue-500/20 bg-blue-500/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total Allocation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          ${scanResult.portfolioMetrics.totalAllocation.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {((scanResult.portfolioMetrics.totalAllocation / parseFloat(budget)) * 100).toFixed(1)}% of budget
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-green-500/20 bg-green-500/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Expected Return
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                          ${scanResult.portfolioMetrics.expectedReturn.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {((scanResult.portfolioMetrics.expectedReturn / scanResult.portfolioMetrics.totalAllocation) * 100).toFixed(1)}% ROI
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-red-500/20 bg-red-500/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Max Loss
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-red-600">
                          ${scanResult.portfolioMetrics.maxLoss.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          100% of allocation
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-purple-500/20 bg-purple-500/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Win Probability
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-purple-600">
                          {(scanResult.portfolioMetrics.overallWinProbability * 100).toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Weighted average
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-orange-500/20 bg-orange-500/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Portfolio Delta
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-orange-600">
                          {scanResult.portfolioMetrics.portfolioDelta.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Directional exposure
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-cyan-500/20 bg-cyan-500/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Diversification
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-cyan-600">
                          {(scanResult.portfolioMetrics.diversificationScore * 100).toFixed(0)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {scanResult.recommendations.length} positions
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Risk Assessment */}
                  <Card className="border-yellow-500/20 bg-yellow-500/5">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4 text-yellow-500" />
                        Risk Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Diversified across {scanResult.recommendations.length} different symbols</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Maximum risk limited to ${scanResult.portfolioMetrics.maxLoss.toLocaleString()} (allocated capital)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>All positions have {(scanResult.portfolioMetrics.overallWinProbability * 100).toFixed(0)}%+ weighted win probability</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>Portfolio delta of {scanResult.portfolioMetrics.portfolioDelta.toFixed(2)} indicates {Math.abs(scanResult.portfolioMetrics.portfolioDelta) > 2 ? 'high' : 'moderate'} directional exposure</span>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Scan Details
                  </CardTitle>
                  <CardDescription>
                    Technical details about the AI scan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Symbols Scanned</div>
                      <div className="text-2xl font-bold">{scanResult.scanMetadata.symbolsScanned}</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Contracts Analyzed</div>
                      <div className="text-2xl font-bold">{scanResult.scanMetadata.contractsAnalyzed}</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Scan Duration</div>
                      <div className="text-2xl font-bold">{(scanResult.scanMetadata.scanDuration / 1000).toFixed(2)}s</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Timestamp</div>
                      <div className="text-sm font-medium">
                        {new Date(scanResult.scanMetadata.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-sm">
                    <h4 className="font-semibold mb-2">Scan Parameters</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-muted-foreground">Budget:</span> ${parseFloat(budget).toLocaleString()}</div>
                      <div><span className="text-muted-foreground">Risk:</span> {riskTolerance}</div>
                      <div><span className="text-muted-foreground">Strategy:</span> {strategy}</div>
                      <div><span className="text-muted-foreground">Max Positions:</span> {maxPositions}</div>
                      <div><span className="text-muted-foreground">Time Horizon:</span> {timeHorizon}</div>
                      <div><span className="text-muted-foreground">Results:</span> {scanResult.recommendations.length} recommendations</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

