"use client";

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  DollarSign,
  Percent,
  BarChart3,
  Info,
  Zap,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ContractAnalyzerPage() {
  const [symbol, setSymbol] = useState('');
  const [strikePrice, setStrikePrice] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [optionType, setOptionType] = useState<'call' | 'put'>('call');
  const [quantity, setQuantity] = useState('1');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [gptInsight, setGptInsight] = useState<any>(null);
  const [isLoadingGpt, setIsLoadingGpt] = useState(false);

  const handleAnalyze = async () => {
    if (!symbol || !strikePrice || !expirationDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    setGptInsight(null);

    try {
      const response = await fetch('/api/ai/analyze-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          strikePrice: parseFloat(strikePrice),
          expirationDate,
          optionType,
          quantity: parseInt(quantity) || 1
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysis(result);
        toast.success('Analysis complete!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing contract:', error);
      toast.error('Failed to analyze contract');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGetGPTInsight = async () => {
    if (!analysis) {
      toast.error('Please run analysis first');
      return;
    }

    setIsLoadingGpt(true);

    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trade_insight',
          symbol: symbol.toUpperCase(),
          contractDetails: {
            strike: parseFloat(strikePrice),
            expiration: expirationDate,
            type: optionType,
            currentPrice: analysis.marketData.contractPrice,
            iv: analysis.ivAnalysis.currentIV,
            delta: analysis.greeks.delta,
            theta: analysis.greeks.theta,
            vega: analysis.greeks.vega,
            gamma: analysis.greeks.gamma
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setGptInsight(result);
        toast.success('GPT analysis loaded!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'GPT analysis failed');
      }
    } catch (error) {
      console.error('Error getting GPT insight:', error);
      toast.error('Failed to get GPT insight');
    } finally {
      setIsLoadingGpt(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'strong-buy': return 'bg-green-600 text-white';
      case 'buy': return 'bg-green-500 text-white';
      case 'hold': return 'bg-yellow-500 text-white';
      case 'sell': return 'bg-red-500 text-white';
      case 'strong-sell': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-500/10 border-green-500/20';
      case 'medium': return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20';
      case 'high': return 'text-orange-600 bg-orange-500/10 border-orange-500/20';
      case 'very-high': return 'text-red-600 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-600 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10">
              <Target className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Contract Analyzer</h1>
              <p className="text-muted-foreground text-lg">
                AI-powered analysis for any options contract
              </p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Contract Details</CardTitle>
            <CardDescription>
              Enter the contract you want to analyze
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol *</Label>
                <Input
                  id="symbol"
                  placeholder="TSLA"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="strike">Strike Price *</Label>
                <Input
                  id="strike"
                  type="number"
                  placeholder="250.00"
                  value={strikePrice}
                  onChange={(e) => setStrikePrice(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration">Expiration Date *</Label>
                <Input
                  id="expiration"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Option Type *</Label>
                <Select value={optionType} onValueChange={(v: any) => setOptionType(v)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="put">Put</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing}
                  className="w-full"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Analyze Contract
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Data Source Indicator */}
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  Data Source Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div className="p-2 bg-muted/50 rounded">
                    <div className="text-xs text-muted-foreground mb-1">Stock Price</div>
                    <Badge variant={analysis.dataSource.stockPrice === 'alpaca-live' ? 'default' : 'secondary'}>
                      {analysis.dataSource.stockPrice === 'alpaca-live' ? '🟢 Live' : '⚠️ Estimated'}
                    </Badge>
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <div className="text-xs text-muted-foreground mb-1">Contract Price</div>
                    <Badge variant={analysis.dataSource.contractPrice === 'alpaca-live' ? 'default' : 'secondary'}>
                      {analysis.dataSource.contractPrice === 'alpaca-live' ? '🟢 Live' : '⚠️ Estimated'}
                    </Badge>
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <div className="text-xs text-muted-foreground mb-1">Greeks</div>
                    <Badge variant={analysis.dataSource.greeks === 'alpaca-live' ? 'default' : 'secondary'}>
                      {analysis.dataSource.greeks === 'alpaca-live' ? '🟢 Live' : '📐 Calculated'}
                    </Badge>
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <div className="text-xs text-muted-foreground mb-1">IV</div>
                    <Badge variant={analysis.dataSource.impliedVolatility === 'alpaca-live' ? 'default' : 'secondary'}>
                      {analysis.dataSource.impliedVolatility === 'alpaca-live' ? '🟢 Live' : '⚠️ Estimated'}
                    </Badge>
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <div className="text-xs text-muted-foreground mb-1">ML Prediction</div>
                    <Badge variant="secondary">
                      {analysis.dataSource.mlPrediction === 'trained-model' ? '🤖 Model' : '🧪 Simulated'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Summary */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  AI Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg mb-4">{analysis.aiInsights.summary}</p>
                <div className="flex items-center gap-4 flex-wrap">
                  <Badge className={`${getActionColor(analysis.recommendation.action)} text-lg px-4 py-2`}>
                    {analysis.recommendation.action.toUpperCase().replace('-', ' ')}
                  </Badge>
                  <Badge variant="outline" className="text-base px-3 py-1">
                    {(analysis.recommendation.confidence * 100).toFixed(0)}% Confidence
                  </Badge>
                  <Badge className={getRiskColor(analysis.recommendation.riskLevel) + ' text-base px-3 py-1'}>
                    {analysis.recommendation.riskLevel.toUpperCase().replace('-', ' ')} RISK
                  </Badge>
                </div>
                
                {/* GPT Insight Button */}
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    onClick={handleGetGPTInsight}
                    disabled={isLoadingGpt}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    {isLoadingGpt ? (
                      <>
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                        Getting GPT Insights...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Get OpenAI GPT Insights
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    {process.env.NEXT_PUBLIC_OPENAI_ENABLED === 'true' 
                      ? 'Powered by GPT-4 for deep market analysis' 
                      : 'Requires OpenAI API key'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* GPT Insight Card */}
            {gptInsight && (
              <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-500" />
                    OpenAI GPT-4 Analysis
                  </CardTitle>
                  <CardDescription>Advanced AI-powered market insights</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Analysis
                    </h4>
                    <p className="text-sm text-muted-foreground">{gptInsight.analysis}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Reasoning
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{gptInsight.reasoning}</p>
                  </div>

                  {gptInsight.risks && gptInsight.risks.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        Key Risks
                      </h4>
                      <ul className="space-y-1">
                        {gptInsight.risks.map((risk: string, idx: number) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {gptInsight.opportunities && gptInsight.opportunities.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Opportunities
                      </h4>
                      <ul className="space-y-1">
                        {gptInsight.opportunities.map((opp: string, idx: number) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {opp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-2 border-t">
                    <Badge className={getActionColor(gptInsight.recommendation)}>
                      GPT: {gptInsight.recommendation.toUpperCase().replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">
                      {(gptInsight.confidence * 100).toFixed(0)}% Confidence
                    </Badge>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {gptInsight.timeframe}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Win Probability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {(analysis.probabilities.winProbability * 100).toFixed(0)}%
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Expected Return</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    ${analysis.returns.expectedReturn.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analysis.returns.expectedReturnPercent.toFixed(0)}% ROI
                  </p>
                </CardContent>
              </Card>

              <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Max Loss</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    ${analysis.returns.maxLoss.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    100% of investment
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-500/20 bg-purple-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Risk/Reward</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {analysis.returns.riskRewardRatio.toFixed(2)}:1
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Greeks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  The Greeks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Delta</span>
                      <span className="text-2xl font-bold">{analysis.greeks.delta.toFixed(3)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{analysis.greeks.explanation.delta}</p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Theta (Daily)</span>
                      <span className="text-2xl font-bold">${analysis.greeks.theta.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{analysis.greeks.explanation.theta}</p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Vega</span>
                      <span className="text-2xl font-bold">${analysis.greeks.vega.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{analysis.greeks.explanation.vega}</p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Gamma</span>
                      <span className="text-2xl font-bold">{analysis.greeks.gamma.toFixed(3)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Rate of delta change</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Probabilities & Returns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Probability Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span>Win Probability</span>
                    <span className="font-bold">{(analysis.probabilities.winProbability * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span>Prob. ITM at Expiry</span>
                    <span className="font-bold">{(analysis.probabilities.probabilityITM * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span>Breakeven Price</span>
                    <span className="font-bold">${analysis.probabilities.breakEvenPrice.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Volatility Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span>Implied Volatility</span>
                    <span className="font-bold">{analysis.volatility.impliedVolatility}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span>IV Rank</span>
                    <span className="font-bold">{analysis.volatility.ivRank}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <span>Evaluation</span>
                    <Badge className={
                      analysis.volatility.evaluation === 'underpriced' ? 'bg-green-500' :
                      analysis.volatility.evaluation === 'overpriced' ? 'bg-red-500' : 'bg-yellow-500'
                    }>
                      {analysis.volatility.evaluation.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Time Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold mb-1">{analysis.timeAnalysis.daysToExpiration}</div>
                    <div className="text-sm text-muted-foreground">Days to Expiration</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold mb-1">${analysis.timeAnalysis.timeDecayPerDay.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Daily Time Decay</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold mb-1">
                      <Badge className={
                        analysis.timeAnalysis.urgency === 'low' ? 'bg-green-500' :
                        analysis.timeAnalysis.urgency === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }>
                        {analysis.timeAnalysis.urgency.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">Urgency Level</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Reasoning */}
            <Card>
              <CardHeader>
                <CardTitle>AI Reasoning</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.recommendation.reasoning.map((reason: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 p-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{reason}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Risks & Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-red-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Key Risks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.aiInsights.keyRisks.length > 0 ? (
                    <div className="space-y-2">
                      {analysis.aiInsights.keyRisks.map((risk: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{risk}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No major risks identified</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-green-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <TrendingUp className="h-5 w-5" />
                    Key Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.aiInsights.keyOpportunities.length > 0 ? (
                    <div className="space-y-2">
                      {analysis.aiInsights.keyOpportunities.map((opp: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{opp}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No significant opportunities identified</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Market Context */}
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  Market Context
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{analysis.aiInsights.marketContext}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

