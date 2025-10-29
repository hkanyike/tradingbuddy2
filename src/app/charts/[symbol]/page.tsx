"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ChartData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  timeframes: {
    '1D': { data: Array<{ time: string; price: number; volume: number }> };
    '1W': { data: Array<{ time: string; price: number; volume: number }> };
    '1M': { data: Array<{ time: string; price: number; volume: number }> };
    '3M': { data: Array<{ time: string; price: number; volume: number }> };
    '1Y': { data: Array<{ time: string; price: number; volume: number }> };
  };
}

export default function ChartsPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = params.symbol as string;
  
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1D');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChartData = async () => {
      try {
        setIsLoading(true);
        
        // Generate mock chart data
        const generateMockData = (days: number) => {
          const data = [];
          const basePrice = 150;
          const now = new Date();
          
          for (let i = days; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // Generate realistic price movement
            const randomChange = (Math.random() - 0.5) * 0.02; // ±1% daily change
            const price = basePrice * (1 + randomChange * (days - i) / days);
            const volume = Math.floor(Math.random() * 1000000) + 500000;
            
            data.push({
              time: date.toISOString().split('T')[0],
              price: Math.max(price, 0.01),
              volume
            });
          }
          
          return data;
        };

        const mockData: ChartData = {
          symbol: symbol.toUpperCase(),
          name: `${symbol.toUpperCase()} Corporation`,
          currentPrice: 150.25,
          change: 2.15,
          changePercent: 1.45,
          volume: 2500000,
          timeframes: {
            '1D': { data: generateMockData(1) },
            '1W': { data: generateMockData(7) },
            '1M': { data: generateMockData(30) },
            '3M': { data: generateMockData(90) },
            '1Y': { data: generateMockData(365) }
          }
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setChartData(mockData);
      } catch (error) {
        console.error('Error loading chart data:', error);
        setError('Failed to load chart data');
      } finally {
        setIsLoading(false);
      }
    };

    if (symbol) {
      loadChartData();
    }
  }, [symbol]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-muted-foreground">Loading charts for {symbol}...</p>
        </div>
      </div>
    );
  }

  if (error || !chartData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Chart data not found'}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const currentData = chartData.timeframes[selectedTimeframe].data;
  const latestPrice = currentData[currentData.length - 1]?.price || chartData.currentPrice;
  const firstPrice = currentData[0]?.price || chartData.currentPrice;
  const timeframeChange = latestPrice - firstPrice;
  const timeframeChangePercent = (timeframeChange / firstPrice) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{chartData.symbol}</h1>
              <p className="text-muted-foreground">{chartData.name}</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Price Overview */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">${latestPrice.toFixed(2)}</div>
                <div className={`flex items-center gap-2 ${timeframeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {timeframeChange >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {timeframeChange >= 0 ? '+' : ''}{timeframeChange.toFixed(2)} ({timeframeChangePercent >= 0 ? '+' : ''}{timeframeChangePercent.toFixed(2)}%)
                  </span>
                  <span className="text-sm text-muted-foreground">({selectedTimeframe})</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Volume</div>
                <div className="font-medium">{chartData.volume.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart Tabs */}
        <Tabs defaultValue="price" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="price">Price Chart</TabsTrigger>
            <TabsTrigger value="volume">Volume Chart</TabsTrigger>
          </TabsList>

          <TabsContent value="price" className="space-y-6">
            {/* Timeframe Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Price Chart
                </CardTitle>
                <CardDescription>
                  Select a timeframe to view price movements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-6">
                  {(['1D', '1W', '1M', '3M', '1Y'] as const).map((timeframe) => (
                    <Button
                      key={timeframe}
                      variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTimeframe(timeframe)}
                    >
                      {timeframe}
                    </Button>
                  ))}
                </div>
                
                {/* Simple Chart Visualization */}
                <div className="h-96 bg-muted/20 rounded-lg p-4 flex items-end justify-between">
                  {currentData.map((point, index) => {
                    const maxPrice = Math.max(...currentData.map(p => p.price));
                    const minPrice = Math.min(...currentData.map(p => p.price));
                    const height = ((point.price - minPrice) / (maxPrice - minPrice)) * 100;
                    
                    return (
                      <div
                        key={index}
                        className="bg-primary rounded-sm flex-1 mx-0.5"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${point.time}: $${point.price.toFixed(2)}`}
                      />
                    );
                  })}
                </div>
                
                <div className="mt-4 text-sm text-muted-foreground text-center">
                  {currentData.length} data points for {selectedTimeframe}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="volume" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Volume Chart
                </CardTitle>
                <CardDescription>
                  Trading volume over the selected timeframe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-6">
                  {(['1D', '1W', '1M', '3M', '1Y'] as const).map((timeframe) => (
                    <Button
                      key={timeframe}
                      variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTimeframe(timeframe)}
                    >
                      {timeframe}
                    </Button>
                  ))}
                </div>
                
                {/* Volume Chart Visualization */}
                <div className="h-96 bg-muted/20 rounded-lg p-4 flex items-end justify-between">
                  {currentData.map((point, index) => {
                    const maxVolume = Math.max(...currentData.map(p => p.volume));
                    const height = (point.volume / maxVolume) * 100;
                    
                    return (
                      <div
                        key={index}
                        className="bg-blue-500 rounded-sm flex-1 mx-0.5"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${point.time}: ${point.volume.toLocaleString()} volume`}
                      />
                    );
                  })}
                </div>
                
                <div className="mt-4 text-sm text-muted-foreground text-center">
                  Average volume: {Math.round(currentData.reduce((sum, p) => sum + p.volume, 0) / currentData.length).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Chart Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Chart Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${Math.max(...currentData.map(p => p.price)).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">High</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  ${Math.min(...currentData.map(p => p.price)).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Low</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  ${(currentData.reduce((sum, p) => sum + p.price, 0) / currentData.length).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Average</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {currentData.length}
                </div>
                <div className="text-sm text-muted-foreground">Data Points</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
