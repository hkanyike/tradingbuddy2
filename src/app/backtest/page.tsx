"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Download,
  Calendar,
  DollarSign,
  Target,
  Shield,
  Zap
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';

interface BacktestResult {
  id: string;
  config: {
    name: string;
    startDate: string;
    endDate: string;
    initialCapital: number;
    symbols: string[];
    modelId: string;
    positionSize: number;
    maxPositions: number;
    stopLoss: number;
    takeProfit: number;
    commission: number;
    slippage: number;
  };
  metrics: {
    totalReturn: number;
    totalReturnPercent: number;
    annualizedReturn: number;
    volatility: number;
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    winRate: number;
    profitFactor: number;
    averageWin: number;
    averageLoss: number;
    largestWin: number;
    largestLoss: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    averageTradeDuration: number;
    calmarRatio: number;
    var95: number;
    cvar95: number;
  };
  trades: any[];
  equityCurve: Array<{ timestamp: number; equity: number; drawdown: number }>;
  monthlyReturns: Array<{ month: string; return: number }>;
  symbolReturns: Record<string, number>;
  createdAt: number;
  status: 'running' | 'completed' | 'failed';
}

export default function BacktestPage() {
  const [backtests, setBacktests] = useState<BacktestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Backtest configuration
  const [config, setConfig] = useState({
    name: '',
    startDate: '2023-01-01',
    endDate: '2024-01-01',
    initialCapital: 100000,
    symbols: ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL'],
    modelId: '',
    positionSize: 0.1,
    maxPositions: 5,
    stopLoss: 0.05,
    takeProfit: 0.15,
    commission: 0.001,
    slippage: 0.001
  });

  useEffect(() => {
    loadBacktests();
  }, []);

  const loadBacktests = async () => {
    try {
      setIsLoading(true);
      // In a real app, this would fetch from an API
      // For now, we'll simulate some data
      const mockBacktests: BacktestResult[] = [
        {
          id: 'backtest_1',
          config: {
            name: 'XGBoost Strategy',
            startDate: '2023-01-01',
            endDate: '2024-01-01',
            initialCapital: 100000,
            symbols: ['AAPL', 'MSFT', 'NVDA'],
            modelId: 'model_1',
            positionSize: 0.1,
            maxPositions: 3,
            stopLoss: 0.05,
            takeProfit: 0.15,
            commission: 0.001,
            slippage: 0.001
          },
          metrics: {
            totalReturn: 25000,
            totalReturnPercent: 25,
            annualizedReturn: 0.25,
            volatility: 0.18,
            sharpeRatio: 1.39,
            sortinoRatio: 1.85,
            maxDrawdown: -0.08,
            maxDrawdownPercent: -8,
            winRate: 0.65,
            profitFactor: 1.8,
            averageWin: 1250,
            averageLoss: -800,
            largestWin: 5000,
            largestLoss: -2000,
            totalTrades: 45,
            winningTrades: 29,
            losingTrades: 16,
            averageTradeDuration: 5.2,
            calmarRatio: 3.125,
            var95: -0.025,
            cvar95: -0.035
          },
          trades: [],
          equityCurve: [],
          monthlyReturns: [],
          symbolReturns: { 'AAPL': 0.12, 'MSFT': 0.18, 'NVDA': 0.35 },
          createdAt: Date.now() - 86400000,
          status: 'completed'
        }
      ];
      setBacktests(mockBacktests);
    } catch (error) {
      console.error('Error loading backtests:', error);
      toast.error('Error loading backtests');
    } finally {
      setIsLoading(false);
    }
  };

  const runBacktest = async () => {
    if (!config.name || !config.modelId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsRunning(true);
      
      // In a real app, this would call the backtesting API
      const mockResult: BacktestResult = {
        id: `backtest_${Date.now()}`,
        config: { ...config },
        metrics: {
          totalReturn: Math.random() * 50000 - 10000,
          totalReturnPercent: Math.random() * 60 - 10,
          annualizedReturn: Math.random() * 0.4 - 0.1,
          volatility: Math.random() * 0.3 + 0.1,
          sharpeRatio: Math.random() * 2 + 0.5,
          sortinoRatio: Math.random() * 2.5 + 0.5,
          maxDrawdown: -(Math.random() * 0.2 + 0.05),
          maxDrawdownPercent: -(Math.random() * 20 + 5),
          winRate: Math.random() * 0.4 + 0.4,
          profitFactor: Math.random() * 2 + 0.5,
          averageWin: Math.random() * 2000 + 500,
          averageLoss: -(Math.random() * 1500 + 500),
          largestWin: Math.random() * 8000 + 2000,
          largestLoss: -(Math.random() * 4000 + 1000),
          totalTrades: Math.floor(Math.random() * 100 + 20),
          winningTrades: 0,
          losingTrades: 0,
          averageTradeDuration: Math.random() * 10 + 2,
          calmarRatio: Math.random() * 4 + 1,
          var95: -(Math.random() * 0.05 + 0.01),
          cvar95: -(Math.random() * 0.08 + 0.02)
        },
        trades: [],
        equityCurve: [],
        monthlyReturns: [],
        symbolReturns: {},
        createdAt: Date.now(),
        status: 'running'
      };

      // Simulate running backtest
      setTimeout(() => {
        mockResult.status = 'completed';
        mockResult.metrics.winningTrades = Math.floor(mockResult.metrics.totalTrades * mockResult.metrics.winRate);
        mockResult.metrics.losingTrades = mockResult.metrics.totalTrades - mockResult.metrics.winningTrades;
        
        setBacktests(prev => [mockResult, ...prev]);
        setIsRunning(false);
        toast.success('Backtest completed successfully');
      }, 3000);

    } catch (error) {
      console.error('Error running backtest:', error);
      toast.error('Error running backtest');
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-500/30';
      case 'running':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/30';
      case 'failed':
        return 'bg-red-500/10 text-red-700 border-red-500/30';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/30';
    }
  };

  const formatMetric = (value: number | undefined, type: 'percentage' | 'number' | 'currency' = 'number') => {
    if (value === undefined) return 'N/A';
    
    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      default:
        return value.toFixed(3);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground text-lg">Loading backtests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backtesting</h1>
          <p className="text-muted-foreground">Test your trading strategies with historical data</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runBacktest} disabled={isRunning} className="flex items-center gap-2">
            {isRunning ? (
              <Activity className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? 'Running...' : 'Run Backtest'}
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Results
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configure">Configure</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Backtests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{backtests.length}</div>
                <p className="text-xs text-muted-foreground">
                  {backtests.filter(b => b.status === 'completed').length} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Return</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {backtests.length > 0 
                    ? formatMetric(
                        backtests
                          .filter(b => b.status === 'completed')
                          .reduce((sum, b) => sum + b.metrics.totalReturnPercent, 0) / 
                        backtests.filter(b => b.status === 'completed').length,
                        'percentage'
                      )
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">Annualized</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Best Sharpe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {backtests.length > 0 
                    ? formatMetric(
                        Math.max(...backtests.map(b => b.metrics.sharpeRatio || 0)),
                        'number'
                      )
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">Risk-adjusted</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {backtests.length > 0 
                    ? formatMetric(
                        Math.min(...backtests.map(b => b.metrics.maxDrawdownPercent || 0)),
                        'percentage'
                      )
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">Worst case</p>
              </CardContent>
            </Card>
          </div>

          {backtests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Backtests</CardTitle>
                <CardDescription>Latest backtest results and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {backtests.slice(0, 3).map((backtest) => (
                    <div key={backtest.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(backtest.status)}
                        <div>
                          <h3 className="font-medium">{backtest.config.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {backtest.config.startDate} - {backtest.config.endDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatMetric(backtest.metrics.totalReturnPercent, 'percentage')}
                          </div>
                          <div className="text-xs text-muted-foreground">Total Return</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatMetric(backtest.metrics.sharpeRatio, 'number')}
                          </div>
                          <div className="text-xs text-muted-foreground">Sharpe</div>
                        </div>
                        <Badge className={getStatusColor(backtest.status)}>
                          {backtest.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="configure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backtest Configuration</CardTitle>
              <CardDescription>Configure your backtest parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Strategy Name</Label>
                    <Input
                      id="name"
                      value={config.name}
                      onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter strategy name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={config.startDate}
                      onChange={(e) => setConfig(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={config.endDate}
                      onChange={(e) => setConfig(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="initialCapital">Initial Capital</Label>
                    <Input
                      id="initialCapital"
                      type="number"
                      value={config.initialCapital}
                      onChange={(e) => setConfig(prev => ({ ...prev, initialCapital: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="symbols">Symbols (comma-separated)</Label>
                    <Input
                      id="symbols"
                      value={config.symbols.join(', ')}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        symbols: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }))}
                      placeholder="AAPL, MSFT, NVDA"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="positionSize">Position Size (%)</Label>
                    <Input
                      id="positionSize"
                      type="number"
                      step="0.01"
                      value={config.positionSize}
                      onChange={(e) => setConfig(prev => ({ ...prev, positionSize: Number(e.target.value) }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxPositions">Max Positions</Label>
                    <Input
                      id="maxPositions"
                      type="number"
                      value={config.maxPositions}
                      onChange={(e) => setConfig(prev => ({ ...prev, maxPositions: Number(e.target.value) }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                    <Input
                      id="stopLoss"
                      type="number"
                      step="0.01"
                      value={config.stopLoss}
                      onChange={(e) => setConfig(prev => ({ ...prev, stopLoss: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="takeProfit">Take Profit (%)</Label>
                  <Input
                    id="takeProfit"
                    type="number"
                    step="0.01"
                    value={config.takeProfit}
                    onChange={(e) => setConfig(prev => ({ ...prev, takeProfit: Number(e.target.value) }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="commission">Commission (%)</Label>
                  <Input
                    id="commission"
                    type="number"
                    step="0.001"
                    value={config.commission}
                    onChange={(e) => setConfig(prev => ({ ...prev, commission: Number(e.target.value) }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="slippage">Slippage (%)</Label>
                  <Input
                    id="slippage"
                    type="number"
                    step="0.001"
                    value={config.slippage}
                    onChange={(e) => setConfig(prev => ({ ...prev, slippage: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {backtests.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No Backtest Results"
              description="Run your first backtest to see results"
              action={{
                label: "Run Backtest",
                onClick: () => setSelectedTab('configure')
              }}
            />
          ) : (
            <div className="space-y-6">
              {backtests.map((backtest) => (
                <Card key={backtest.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(backtest.status)}
                        <CardTitle className="text-lg">{backtest.config.name}</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {backtest.config.startDate} - {backtest.config.endDate} • 
                      ${backtest.config.initialCapital.toLocaleString()} initial capital
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {formatMetric(backtest.metrics.totalReturnPercent, 'percentage')}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Return</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">
                          {formatMetric(backtest.metrics.sharpeRatio, 'number')}
                        </div>
                        <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {formatMetric(backtest.metrics.maxDrawdownPercent, 'percentage')}
                        </div>
                        <div className="text-sm text-muted-foreground">Max Drawdown</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">
                          {formatMetric(backtest.metrics.winRate, 'percentage')}
                        </div>
                        <div className="text-sm text-muted-foreground">Win Rate</div>
                      </div>
                    </div>

                    {/* Detailed Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Total Trades</div>
                        <div className="font-medium">{backtest.metrics.totalTrades}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Profit Factor</div>
                        <div className="font-medium">{formatMetric(backtest.metrics.profitFactor, 'number')}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Trade Duration</div>
                        <div className="font-medium">{backtest.metrics.averageTradeDuration.toFixed(1)} days</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Average Win</div>
                        <div className="font-medium">{formatMetric(backtest.metrics.averageWin, 'currency')}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Average Loss</div>
                        <div className="font-medium">{formatMetric(backtest.metrics.averageLoss, 'currency')}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Volatility</div>
                        <div className="font-medium">{formatMetric(backtest.metrics.volatility, 'percentage')}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Strategy Comparison</CardTitle>
              <CardDescription>Compare performance across different strategies</CardDescription>
            </CardHeader>
            <CardContent>
              {backtests.length < 2 ? (
                <EmptyState
                  icon={BarChart3}
                  title="Need More Results"
                  description="Run at least 2 backtests to compare strategies"
                  action={{
                    label: "Run Backtest",
                    onClick: () => setSelectedTab('configure')
                  }}
                />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {backtests.map((backtest) => (
                      <div key={backtest.id} className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">{backtest.config.name}</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Return:</span>
                            <span className="font-medium">
                              {formatMetric(backtest.metrics.totalReturnPercent, 'percentage')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sharpe:</span>
                            <span className="font-medium">
                              {formatMetric(backtest.metrics.sharpeRatio, 'number')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Drawdown:</span>
                            <span className="font-medium">
                              {formatMetric(backtest.metrics.maxDrawdownPercent, 'percentage')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Win Rate:</span>
                            <span className="font-medium">
                              {formatMetric(backtest.metrics.winRate, 'percentage')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}