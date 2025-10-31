"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  Activity,
  Zap,
  Target,
  BarChart3,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface RLStats {
  totalStates: number;
  totalExperiences: number;
  epsilon: number;
  avgQValue: number;
  learnedActions: number;
  status: string;
  version: string;
}

interface MLModel {
  id: string;
  name: string;
  status: 'training' | 'ready' | 'failed' | 'deprecated';
  metrics: {
    accuracy?: number;
    sharpeRatio?: number;
  };
}

export function AIAgentDashboard() {
  const [rlStats, setRlStats] = useState<RLStats | null>(null);
  const [mlModels, setMlModels] = useState<MLModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch RL stats
      const rlResponse = await fetch('/api/rl/stats');
      if (rlResponse.ok) {
        const rlData = await rlResponse.json();
        setRlStats(rlData);
      }

      // Fetch ML models
      const mlResponse = await fetch('/api/ml/models');
      if (mlResponse.ok) {
        const mlData = await mlResponse.json();
        setMlModels(mlData.models || []);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching AI data:', error);
      toast.error('Failed to fetch AI agent data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const activeModels = mlModels.filter(m => m.status === 'ready').length;
  const trainingModels = mlModels.filter(m => m.status === 'training').length;
  const avgAccuracy = mlModels.length > 0
    ? mlModels.reduce((sum, m) => sum + (m.metrics.accuracy || 0), 0) / mlModels.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Trading Agent
          </h2>
          <p className="text-muted-foreground">
            Reinforcement Learning & Machine Learning Models
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              RL Agent Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/10 text-green-700 border-green-500/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                {rlStats?.status || 'Active'}
              </Badge>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Version {rlStats?.version || '1.0.0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Learned States
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(rlStats?.totalStates || 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {(rlStats?.learnedActions || 0).toLocaleString()} actions
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Experience Buffer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(rlStats?.totalExperiences || 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Training samples
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Q-Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(rlStats?.avgQValue || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(rlStats?.avgQValue || 0) >= 0 ? '+' : ''}
              {(rlStats?.avgQValue || 0).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Expected value per action
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RL Agent Details */}
      <Card>
        <CardHeader>
          <CardTitle>Reinforcement Learning Agent</CardTitle>
          <CardDescription>
            Q-Learning agent that learns optimal trading strategies through experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Exploration Rate</div>
              <div className="text-lg font-bold">
                {((rlStats?.epsilon || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {(rlStats?.epsilon || 0) < 0.05 ? 'Mostly exploiting' : 'Still exploring'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total States</div>
              <div className="text-lg font-bold">
                {(rlStats?.totalStates || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Learned Actions</div>
              <div className="text-lg font-bold">
                {(rlStats?.learnedActions || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Experience Count</div>
              <div className="text-lg font-bold">
                {(rlStats?.totalExperiences || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm">
              The RL agent learns from every trade outcome, continuously improving position sizing, 
              entry/exit timing, and hedging decisions. It uses Q-learning with experience replay to 
              optimize for risk-adjusted returns.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ML Models Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Machine Learning Models
          </CardTitle>
          <CardDescription>
            Trained models for price prediction and strategy optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Active Models</div>
              <div className="text-2xl font-bold">{activeModels}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Ready for predictions
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Training</div>
              <div className="text-2xl font-bold">{trainingModels}</div>
              <div className="text-xs text-muted-foreground mt-1">
                In progress
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Avg Accuracy</div>
              <div className="text-2xl font-bold">
                {(avgAccuracy * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Across all models
              </div>
            </div>
          </div>

          {mlModels.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No ML models trained yet</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/models'}>
                Train First Model
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

