"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Brain, Play, Upload, Download, Zap, Shield, Database, TestTube, BarChart3, Newspaper, Settings as SettingsIcon, Menu, Wifi, WifiOff, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface MLModel {
  id: number;
  name: string;
  modelType: string;
  version: string;
  status: string;
  description?: string;
  hyperparameters?: any;
  featureImportance?: any;
  strategyId?: number;
  createdAt: string;
  updatedAt: string;
}

interface TrainingRun {
  id: number;
  modelId: number;
  userId: string;
  datasetStartDate: string;
  datasetEndDate: string;
  trainingSamples: number;
  validationSamples: number;
  trainingMetrics: any;
  validationMetrics: any;
  overfittingScore?: number;
  trainingDurationSeconds: number;
  status: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

interface Strategy {
  id: number;
  name: string;
  strategyType: string;
}

export default function ModelsPage() {
  const { data: session, status } = useSession();
  const isPending = status === 'loading';
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLiveUpdateEnabled, setIsLiveUpdateEnabled] = useState(true);

  const [models, setModels] = useState<MLModel[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingDialogOpen, setTrainingDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
  const [trainingRuns, setTrainingRuns] = useState<TrainingRun[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Training form state
  const [trainingForm, setTrainingForm] = useState({
    modelType: "xgboost",
    name: "",
    strategyId: "",
    version: "v1.0.0",
    datasetStartDate: "2023-01-01",
    datasetEndDate: "2024-12-31",
    trainingSamples: 10000,
    validationSamples: 2500,
    maxDepth: 6,
    learningRate: 0.05,
    nEstimators: 600,
  });

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
      return;
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (!isPending && session?.user) {
      loadData();
    }
  }, [session, isPending]);

  useEffect(() => {
    if (!isLiveUpdateEnabled || !session) return;

    const interval = setInterval(() => {
      loadData();
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, [isLiveUpdateEnabled, session]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : { Authorization: '' };

      const [modelsRes, strategiesRes] = await Promise.all([
        fetch("/api/ml-models", { headers }),
        fetch("/api/strategies", { headers })
      ]);

      const modelsData = await modelsRes.json();
      const strategiesData = await strategiesRes.json();

      setModels(Array.isArray(modelsData) ? modelsData : []);
      setStrategies(Array.isArray(strategiesData) ? strategiesData : []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load ML models");
      setIsLoading(false);
    }
  };

  const handleShowDetails = async (model: MLModel) => {
    setSelectedModel(model);
    setDetailsDialogOpen(true);
    setLoadingDetails(true);
    
    try {
      const token = localStorage.getItem("bearer_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : { Authorization: '' };
      
      // Fetch training runs for this model
      const runsRes = await fetch(`/api/ml-models/${model.id}/train`, { headers });
      if (runsRes.ok) {
        const runsData = await runsRes.json();
        setTrainingRuns(Array.isArray(runsData) ? runsData : []);
      }
    } catch (error) {
      console.error("Error loading model details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleTrainModel = async () => {
    if (!trainingForm.name.trim()) {
      toast.error("Please enter a model name");
      return;
    }

    setIsTraining(true);

    try {
      const token = localStorage.getItem("bearer_token");
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
      };

      // Create model
      const modelRes = await fetch("/api/ml-models", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: trainingForm.name,
          modelType: trainingForm.modelType,
          version: trainingForm.version,
          strategyId: trainingForm.strategyId ? parseInt(trainingForm.strategyId) : null,
          status: "training",
          hyperparameters: {
            max_depth: trainingForm.maxDepth,
            learning_rate: trainingForm.learningRate,
            n_estimators: trainingForm.nEstimators,
          }
        })
      });

      if (!modelRes.ok) {
        throw new Error("Failed to create model");
      }

      const newModel = await modelRes.json();

      // Start training run
      const trainingRes = await fetch(`/api/ml-models/${newModel.id}/train`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          datasetStartDate: trainingForm.datasetStartDate,
          datasetEndDate: trainingForm.datasetEndDate,
          trainingSamples: trainingForm.trainingSamples,
          validationSamples: trainingForm.validationSamples,
        })
      });

      if (!trainingRes.ok) {
        throw new Error("Failed to start training");
      }

      toast.success("Model training started successfully!");
      setTrainingDialogOpen(false);
      loadData();

      // Reset form
      setTrainingForm({
        ...trainingForm,
        name: "",
      });
    } catch (error) {
      console.error("Error training model:", error);
      toast.error("Failed to start model training");
    } finally {
      setIsTraining(false);
    }
  };

  const getModelTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      xgboost: "XGBoost Classifier",
      lightgbm: "LightGBM Classifier",
      har_rv: "HAR-RV Volatility",
      lstm: "LSTM Neural Network",
      ensemble: "Ensemble Model"
    };
    return types[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500",
      training: "bg-yellow-500 animate-pulse",
      archived: "bg-gray-500",
      failed: "bg-red-500"
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      training: "secondary",
      archived: "secondary",
      failed: "destructive"
    };
    return variants[status] || "secondary";
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground text-lg">Loading ML models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
                  <Button variant="secondary" size="sm" className="font-medium shadow-sm">
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
                    <SettingsIcon className="h-4 w-4 mr-1.5" />
                    Settings
                  </Button>
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-3">
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
                      <Button variant="secondary" size="sm" className="w-full justify-start font-medium">
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
                        <SettingsIcon className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary/80 backdrop-blur-sm shadow-sm">
                <WifiOff className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-muted-foreground hidden sm:inline">Offline</span>
              </div>

              <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary/80 backdrop-blur-sm shadow-sm">
                <div className={`h-1.5 w-1.5 rounded-full ${isLiveUpdateEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-xs text-muted-foreground">
                  {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsLiveUpdateEnabled(!isLiveUpdateEnabled)}
                  className="h-6 px-2 text-xs hover:bg-background/50"
                >
                  {isLiveUpdateEnabled ? 'Pause' : 'Resume'}
                </Button>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-6 py-6 lg:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">ML Models</h2>
            <p className="text-sm text-muted-foreground">Machine learning models for trading predictions</p>
          </div>
          <Button onClick={() => setTrainingDialogOpen(true)} className="gap-2">
            <Play className="h-4 w-4" />
            Train New Model
          </Button>
        </div>

        {/* Active Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {models.length > 0 ? (
            models.map((model) => (
              <Card key={model.id} className="relative">
                <div className={`absolute top-3 right-3 h-2 w-2 rounded-full ${getStatusColor(model.status)}`} />
                <CardHeader>
                  <CardTitle className="text-sm pr-6">{model.name}</CardTitle>
                  <CardDescription>{getModelTypeLabel(model.modelType)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Version</span>
                      <span className="font-medium">{model.version}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={getStatusBadge(model.status)} className="text-xs">
                        {model.status}
                      </Badge>
                    </div>
                    {model.description && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {model.description}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleShowDetails(model)}>
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No ML models yet</p>
                  <Button 
                    onClick={() => setTrainingDialogOpen(true)} 
                    variant="outline" 
                    size="sm"
                    className="mt-4"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Train Your First Model
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Training Dialog */}
        <Dialog open={trainingDialogOpen} onOpenChange={setTrainingDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Train New ML Model</DialogTitle>
              <DialogDescription>
                Configure and train a new machine learning model for trading predictions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="model-name">Model Name *</Label>
                  <Input
                    id="model-name"
                    placeholder="IV Predictor v1.0"
                    value={trainingForm.name}
                    onChange={(e) => setTrainingForm({ ...trainingForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="model-type">Model Type *</Label>
                  <select
                    id="model-type"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    value={trainingForm.modelType}
                    onChange={(e) => setTrainingForm({ ...trainingForm, modelType: e.target.value })}
                  >
                    <option value="xgboost">XGBoost Classifier</option>
                    <option value="lightgbm">LightGBM Classifier</option>
                    <option value="har_rv">HAR-RV Volatility</option>
                    <option value="lstm">LSTM Neural Network</option>
                    <option value="ensemble">Ensemble Model</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={trainingForm.version}
                    onChange={(e) => setTrainingForm({ ...trainingForm, version: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="strategy">Strategy (Optional)</Label>
                  <select
                    id="strategy"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    value={trainingForm.strategyId}
                    onChange={(e) => setTrainingForm({ ...trainingForm, strategyId: e.target.value })}
                  >
                    <option value="">No Strategy</option>
                    {strategies.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Dataset Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={trainingForm.datasetStartDate}
                    onChange={(e) => setTrainingForm({ ...trainingForm, datasetStartDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">Dataset End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={trainingForm.datasetEndDate}
                    onChange={(e) => setTrainingForm({ ...trainingForm, datasetEndDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="training-samples">Training Samples</Label>
                  <Input
                    id="training-samples"
                    type="number"
                    value={trainingForm.trainingSamples}
                    onChange={(e) => setTrainingForm({ ...trainingForm, trainingSamples: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="validation-samples">Validation Samples</Label>
                  <Input
                    id="validation-samples"
                    type="number"
                    value={trainingForm.validationSamples}
                    onChange={(e) => setTrainingForm({ ...trainingForm, validationSamples: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">Hyperparameters</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="max-depth">Max Depth</Label>
                    <Input
                      id="max-depth"
                      type="number"
                      value={trainingForm.maxDepth}
                      onChange={(e) => setTrainingForm({ ...trainingForm, maxDepth: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="learning-rate">Learning Rate</Label>
                    <Input
                      id="learning-rate"
                      type="number"
                      step="0.01"
                      value={trainingForm.learningRate}
                      onChange={(e) => setTrainingForm({ ...trainingForm, learningRate: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="n-estimators">N Estimators</Label>
                    <Input
                      id="n-estimators"
                      type="number"
                      value={trainingForm.nEstimators}
                      onChange={(e) => setTrainingForm({ ...trainingForm, nEstimators: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setTrainingDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleTrainModel} disabled={isTraining}>
                {isTraining ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting Training...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Training
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Model Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Model Details</DialogTitle>
              <DialogDescription>
                View model configuration, hyperparameters, and training history
              </DialogDescription>
            </DialogHeader>

            {selectedModel && (
              <div className="space-y-6">
                {/* Model Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Model Name</p>
                    <p className="font-medium">{selectedModel.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Model Type</p>
                    <p className="font-medium">{getModelTypeLabel(selectedModel.modelType)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Version</p>
                    <p className="font-medium">{selectedModel.version}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={getStatusBadge(selectedModel.status)}>
                      {selectedModel.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-sm">{new Date(selectedModel.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="text-sm">{new Date(selectedModel.updatedAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Hyperparameters */}
                {selectedModel.hyperparameters && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Hyperparameters</h4>
                    <div className="grid grid-cols-3 gap-4 p-4 bg-secondary/30 rounded-lg">
                      {Object.entries(selectedModel.hyperparameters).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                          <p className="font-medium">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feature Importance */}
                {selectedModel.featureImportance && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Top Features</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedModel.featureImportance)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 5)
                        .map(([feature, importance]) => (
                          <div key={feature} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{feature}</span>
                              <span className="font-medium">{((importance as number) * 100).toFixed(1)}%</span>
                            </div>
                            <Progress value={(importance as number) * 100} className="h-2" />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Training Runs */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Training History</h4>
                  {loadingDetails ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : trainingRuns.length > 0 ? (
                    <div className="space-y-3">
                      {trainingRuns.map((run) => (
                        <Card key={run.id}>
                          <CardContent className="p-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Dataset Period</p>
                                <p className="font-medium">
                                  {new Date(run.datasetStartDate).toLocaleDateString()} - {new Date(run.datasetEndDate).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Status</p>
                                <Badge variant={run.status === 'completed' ? 'default' : run.status === 'failed' ? 'destructive' : 'secondary'}>
                                  {run.status}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Training Samples</p>
                                <p className="font-medium">{run.trainingSamples.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Validation Samples</p>
                                <p className="font-medium">{run.validationSamples.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Duration</p>
                                <p className="font-medium">{run.trainingDurationSeconds}s</p>
                              </div>
                              {run.overfittingScore && (
                                <div>
                                  <p className="text-muted-foreground">Overfitting Score</p>
                                  <p className="font-medium">{run.overfittingScore.toFixed(3)}</p>
                                </div>
                              )}
                              {run.trainingMetrics && (
                                <div className="col-span-2">
                                  <p className="text-muted-foreground mb-1">Training Metrics</p>
                                  <div className="flex gap-4 text-xs">
                                    {Object.entries(run.trainingMetrics).map(([key, value]) => (
                                      <span key={key}>
                                        <span className="text-muted-foreground">{key}:</span> <span className="font-medium">{typeof value === 'number' ? value.toFixed(4) : String(value)}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {run.validationMetrics && (
                                <div className="col-span-2">
                                  <p className="text-muted-foreground mb-1">Validation Metrics</p>
                                  <div className="flex gap-4 text-xs">
                                    {Object.entries(run.validationMetrics).map(([key, value]) => (
                                      <span key={key}>
                                        <span className="text-muted-foreground">{key}:</span> <span className="font-medium">{typeof value === 'number' ? value.toFixed(4) : String(value)}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {run.errorMessage && (
                                <div className="col-span-2">
                                  <p className="text-sm text-destructive">{run.errorMessage}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No training runs yet</p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

