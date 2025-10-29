"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Play, 
  Pause, 
  Trash2, 
  BarChart3, 
  TrendingUp, 
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Download,
  Upload
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';

interface Model {
  id: string;
  name: string;
  version: string;
  type: 'classification' | 'regression' | 'time_series';
  algorithm: 'xgboost' | 'lstm' | 'transformer' | 'random_forest' | 'svm';
  status: 'training' | 'ready' | 'failed' | 'deprecated';
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    mse?: number;
    mae?: number;
    rmse?: number;
    r2Score?: number;
    sharpeRatio?: number;
    maxDrawdown?: number;
    winRate?: number;
    profitFactor?: number;
  };
  trainingDataSize: number;
  trainedAt: number;
  featureImportance?: Record<string, number>;
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [trainingProgress, setTrainingProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ml/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data.models || []);
      } else {
        console.error('Failed to load models');
        toast.error('Failed to load models');
      }
    } catch (error) {
      console.error('Error loading models:', error);
      toast.error('Error loading models');
    } finally {
      setIsLoading(false);
    }
  };

  const trainNewModel = async () => {
    try {
      // Example model configuration
      const config = {
        name: 'Trading Strategy Model',
        type: 'classification',
        algorithm: 'xgboost',
        features: ['sma_20', 'rsi_14', 'macd', 'volume_ratio', 'atr_14'],
        target: 'price_direction',
        hyperparameters: {
          n_estimators: 100,
          max_depth: 6,
          learning_rate: 0.1
        },
        trainingDataSize: 10000,
        validationSplit: 0.2,
        testSplit: 0.1
      };

      // Example training data (in real app, this would come from feature engineering)
      const data = {
        features: Array.from({ length: 1000 }, () => ({
          sma_20: Math.random() * 100,
          rsi_14: Math.random() * 100,
          macd: (Math.random() - 0.5) * 2,
          volume_ratio: Math.random() * 2,
          atr_14: Math.random() * 5
        })),
        targets: Array.from({ length: 1000 }, () => Math.random() > 0.5 ? 1 : 0),
        timestamps: Array.from({ length: 1000 }, (_, i) => Date.now() - i * 86400000),
        symbols: Array.from({ length: 1000 }, () => 'AAPL')
      };

      const response = await fetch('/api/ml/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config, data }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Model training started');
        setModels(prev => [...prev, result.model]);
        
        // Simulate training progress
        simulateTrainingProgress(result.model.id);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to start training');
      }
    } catch (error) {
      console.error('Error training model:', error);
      toast.error('Error training model');
    }
  };

  const simulateTrainingProgress = (modelId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        // Update model status to ready
        setModels(prev => prev.map(model => 
          model.id === modelId ? { ...model, status: 'ready' } : model
        ));
        delete trainingProgress[modelId];
        toast.success('Model training completed');
      }
      setTrainingProgress(prev => ({ ...prev, [modelId]: progress }));
    }, 1000);
  };

  const deleteModel = async (modelId: string) => {
    try {
      const response = await fetch(`/api/ml/models/${modelId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setModels(prev => prev.filter(model => model.id !== modelId));
        toast.success('Model deleted');
      } else {
        toast.error('Failed to delete model');
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      toast.error('Error deleting model');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'training':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'deprecated':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-500/10 text-green-700 border-green-500/30';
      case 'training':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/30';
      case 'failed':
        return 'bg-red-500/10 text-red-700 border-red-500/30';
      case 'deprecated':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/30';
    }
  };

  const formatMetric = (value: number | undefined, type: 'percentage' | 'number' | 'currency' = 'number') => {
    if (value === undefined) return 'N/A';
    
    switch (type) {
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'currency':
        return `$${value.toFixed(2)}`;
      default:
        return value.toFixed(3);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground text-lg">Loading models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ML Models</h1>
          <p className="text-muted-foreground">Train and manage machine learning models for trading strategies</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={trainNewModel} className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Train New Model
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Model
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">All Models</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Models</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{models.length}</div>
                <p className="text-xs text-muted-foreground">
                  {models.filter(m => m.status === 'ready').length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Training</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {models.filter(m => m.status === 'training').length}
                </div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {models.length > 0 
                    ? formatMetric(
                        models
                          .filter(m => m.metrics.accuracy !== undefined)
                          .reduce((sum, m) => sum + (m.metrics.accuracy || 0), 0) / 
                        models.filter(m => m.metrics.accuracy !== undefined).length,
                        'percentage'
                      )
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">Across all models</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Best Sharpe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {models.length > 0 
                    ? formatMetric(
                        Math.max(...models.map(m => m.metrics.sharpeRatio || 0)),
                        'number'
                      )
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">Risk-adjusted return</p>
              </CardContent>
            </Card>
          </div>

          {models.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Models</CardTitle>
                <CardDescription>Latest trained models and their performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {models.slice(0, 3).map((model) => (
                    <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(model.status)}
                        <div>
                          <h3 className="font-medium">{model.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {model.algorithm.toUpperCase()} • {model.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatMetric(model.metrics.accuracy, 'percentage')}
                          </div>
                          <div className="text-xs text-muted-foreground">Accuracy</div>
                        </div>
                        <Badge className={getStatusColor(model.status)}>
                          {model.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          {models.length === 0 ? (
            <EmptyState
              icon={Brain}
              title="No Models"
              description="Train your first machine learning model to get started"
              buttonText="Train New Model"
              onButtonClick={trainNewModel}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {models.map((model) => (
                <Card key={model.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(model.status)}
                        <CardTitle className="text-lg">{model.name}</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteModel(model.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {model.algorithm.toUpperCase()} • {model.type} • v{model.version}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {model.status === 'training' && trainingProgress[model.id] !== undefined && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Training Progress</span>
                          <span>{Math.round(trainingProgress[model.id])}%</span>
                        </div>
                        <Progress value={trainingProgress[model.id]} className="h-2" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Accuracy</div>
                        <div className="font-medium">
                          {formatMetric(model.metrics.accuracy, 'percentage')}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Sharpe Ratio</div>
                        <div className="font-medium">
                          {formatMetric(model.metrics.sharpeRatio, 'number')}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Win Rate</div>
                        <div className="font-medium">
                          {formatMetric(model.metrics.winRate, 'percentage')}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Max Drawdown</div>
                        <div className="font-medium">
                          {formatMetric(model.metrics.maxDrawdown, 'percentage')}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Training Data: {model.trainingDataSize.toLocaleString()} samples</span>
                        <span>{new Date(model.trainedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Training Queue</CardTitle>
              <CardDescription>Models currently being trained</CardDescription>
            </CardHeader>
            <CardContent>
              {models.filter(m => m.status === 'training').length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No Active Training"
                  description="No models are currently being trained"
                  buttonText="Start Training"
                  onButtonClick={trainNewModel}
                />
              ) : (
                <div className="space-y-4">
                  {models
                    .filter(m => m.status === 'training')
                    .map((model) => (
                      <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
                          <div>
                            <h3 className="font-medium">{model.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {model.algorithm.toUpperCase()} • {model.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32">
                            <Progress value={trainingProgress[model.id] || 0} className="h-2" />
                          </div>
                          <span className="text-sm font-medium">
                            {Math.round(trainingProgress[model.id] || 0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Comparison</CardTitle>
              <CardDescription>Compare performance metrics across all models</CardDescription>
            </CardHeader>
            <CardContent>
              {models.length === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  title="No Performance Data"
                  description="Train some models to see performance metrics"
                  buttonText="Train New Model"
                  onButtonClick={trainNewModel}
                />
              ) : (
                <div className="space-y-4">
                  {models.map((model) => (
                    <div key={model.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium">{model.name}</h3>
                        <Badge className={getStatusColor(model.status)}>
                          {model.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Accuracy</div>
                          <div className="font-medium text-lg">
                            {formatMetric(model.metrics.accuracy, 'percentage')}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Sharpe Ratio</div>
                          <div className="font-medium text-lg">
                            {formatMetric(model.metrics.sharpeRatio, 'number')}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Win Rate</div>
                          <div className="font-medium text-lg">
                            {formatMetric(model.metrics.winRate, 'percentage')}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Max Drawdown</div>
                          <div className="font-medium text-lg">
                            {formatMetric(model.metrics.maxDrawdown, 'percentage')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}