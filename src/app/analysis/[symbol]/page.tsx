"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, Activity, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AnalysisData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  eps?: number;
  beta?: number;
  high52Week: number;
  low52Week: number;
  avgVolume: number;
  technicalAnalysis: {
    trend: 'bullish' | 'bearish' | 'neutral';
    support: number;
    resistance: number;
    rsi: number;
    macd: string;
    movingAverages: {
      sma20: number;
      sma50: number;
      sma200: number;
    };
  };
  fundamentalAnalysis: {
    rating: 'buy' | 'sell' | 'hold';
    targetPrice: number;
    upside: number;
    keyMetrics: {
      revenue: number;
      profitMargin: number;
      debtToEquity: number;
      roe: number;
    };
  };
}

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = params.symbol as string;
  
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalysisData = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, this would fetch from your analysis API
        // For now, we'll simulate the data
        const mockData: AnalysisData = {
          symbol: symbol.toUpperCase(),
          name: `${symbol.toUpperCase()} Corporation`,
          currentPrice: 150.25,
          change: 2.15,
          changePercent: 1.45,
          volume: 2500000,
          marketCap: 2500000000,
          pe: 18.5,
          eps: 8.12,
          beta: 1.2,
          high52Week: 165.50,
          low52Week: 120.75,
          avgVolume: 3000000,
          technicalAnalysis: {
            trend: 'bullish',
            support: 145.00,
            resistance: 160.00,
            rsi: 65.5,
            macd: 'Positive',
            movingAverages: {
              sma20: 148.50,
              sma50: 142.30,
              sma200: 135.80
            }
          },
          fundamentalAnalysis: {
            rating: 'buy',
            targetPrice: 175.00,
            upside: 16.5,
            keyMetrics: {
              revenue: 5000000000,
              profitMargin: 0.15,
              debtToEquity: 0.3,
              roe: 0.22
            }
          }
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setAnalysisData(mockData);
      } catch (error) {
        console.error('Error loading analysis data:', error);
        setError('Failed to load analysis data');
      } finally {
        setIsLoading(false);
      }
    };

    if (symbol) {
      loadAnalysisData();
    }
  }, [symbol]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-muted-foreground">Loading analysis for {symbol}...</p>
        </div>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Analysis data not found'}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{analysisData.symbol}</h1>
            <p className="text-muted-foreground">{analysisData.name}</p>
          </div>
        </div>

        {/* Price Overview */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">${analysisData.currentPrice.toFixed(2)}</div>
                <div className={`flex items-center gap-2 ${analysisData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysisData.change >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {analysisData.change >= 0 ? '+' : ''}{analysisData.change.toFixed(2)} ({analysisData.changePercent >= 0 ? '+' : ''}{analysisData.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Volume</div>
                <div className="font-medium">{analysisData.volume.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Tabs */}
        <Tabs defaultValue="technical" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="technical">Technical Analysis</TabsTrigger>
            <TabsTrigger value="fundamental">Fundamental Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="technical" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Trend Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Trend Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Overall Trend</span>
                      <Badge variant={analysisData.technicalAnalysis.trend === 'bullish' ? 'default' : analysisData.technicalAnalysis.trend === 'bearish' ? 'destructive' : 'secondary'}>
                        {analysisData.technicalAnalysis.trend.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Support</span>
                      <span className="font-medium">${analysisData.technicalAnalysis.support.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Resistance</span>
                      <span className="font-medium">${analysisData.technicalAnalysis.resistance.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">RSI</span>
                      <span className="font-medium">{analysisData.technicalAnalysis.rsi.toFixed(1)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Moving Averages */}
              <Card>
                <CardHeader>
                  <CardTitle>Moving Averages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">SMA 20</span>
                      <span className="font-medium">${analysisData.technicalAnalysis.movingAverages.sma20.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">SMA 50</span>
                      <span className="font-medium">${analysisData.technicalAnalysis.movingAverages.sma50.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">SMA 200</span>
                      <span className="font-medium">${analysisData.technicalAnalysis.movingAverages.sma200.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* MACD */}
              <Card>
                <CardHeader>
                  <CardTitle>MACD</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <Badge variant={analysisData.technicalAnalysis.macd === 'Positive' ? 'default' : 'secondary'}>
                      {analysisData.technicalAnalysis.macd}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="fundamental" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Rating & Target */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Rating & Target
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Analyst Rating</span>
                      <Badge variant={analysisData.fundamentalAnalysis.rating === 'buy' ? 'default' : analysisData.fundamentalAnalysis.rating === 'sell' ? 'destructive' : 'secondary'}>
                        {analysisData.fundamentalAnalysis.rating.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Target Price</span>
                      <span className="font-medium">${analysisData.fundamentalAnalysis.targetPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Upside Potential</span>
                      <span className="font-medium text-green-600">+{analysisData.fundamentalAnalysis.upside.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Key Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">P/E Ratio</span>
                      <span className="font-medium">{analysisData.pe?.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">EPS</span>
                      <span className="font-medium">${analysisData.eps?.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Beta</span>
                      <span className="font-medium">{analysisData.beta?.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Market Cap</span>
                      <span className="font-medium">${(analysisData.marketCap! / 1000000000).toFixed(1)}B</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Health */}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Revenue</span>
                      <span className="font-medium">${(analysisData.fundamentalAnalysis.keyMetrics.revenue / 1000000000).toFixed(1)}B</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Profit Margin</span>
                      <span className="font-medium">{(analysisData.fundamentalAnalysis.keyMetrics.profitMargin * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Debt/Equity</span>
                      <span className="font-medium">{analysisData.fundamentalAnalysis.keyMetrics.debtToEquity.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">ROE</span>
                      <span className="font-medium">{(analysisData.fundamentalAnalysis.keyMetrics.roe * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
