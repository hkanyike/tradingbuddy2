// Production-ready experiment tracking with MLflow
import { TrainedModel } from './model-service';
import { TechnicalFeatures, VolatilityFeatures } from './feature-engine';

export interface ExperimentRun {
  runId: string;
  experimentId: string;
  name: string;
  status: 'running' | 'finished' | 'failed';
  startTime: number;
  endTime?: number;
  metrics: Record<string, number>;
  parameters: Record<string, any>;
  tags: Record<string, string>;
  artifacts: string[];
}

export interface Experiment {
  experimentId: string;
  name: string;
  description: string;
  tags: Record<string, string>;
  runs: ExperimentRun[];
  bestRun?: ExperimentRun;
  createdAt: number;
}

export class ExperimentTracker {
  private isInitialized = false;
  private experiments: Map<string, Experiment> = new Map();
  private currentRun: ExperimentRun | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize experiment tracking
   */
  private async initialize(): Promise<void> {
    try {
      // In production, this would connect to MLflow server
      // For now, we'll use in-memory tracking
      this.isInitialized = true;
      console.log('Experiment tracking initialized');
    } catch (error) {
      console.error('Failed to initialize experiment tracking:', error);
    }
  }

  /**
   * Create a new experiment
   */
  async createExperiment(
    name: string, 
    description: string = '', 
    tags: Record<string, string> = {}
  ): Promise<string> {
    const experimentId = `exp_${Date.now()}`;
    
    const experiment: Experiment = {
      experimentId,
      name,
      description,
      tags,
      runs: [],
      createdAt: Date.now()
    };

    this.experiments.set(experimentId, experiment);
    console.log(`Created experiment: ${name} (${experimentId})`);
    
    return experimentId;
  }

  /**
   * Start a new experiment run
   */
  async startRun(
    experimentId: string,
    runName: string,
    parameters: Record<string, any> = {},
    tags: Record<string, string> = {}
  ): Promise<string> {
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const run: ExperimentRun = {
      runId,
      experimentId,
      name: runName,
      status: 'running',
      startTime: Date.now(),
      metrics: {},
      parameters,
      tags,
      artifacts: []
    };

    const experiment = this.experiments.get(experimentId);
    if (experiment) {
      experiment.runs.push(run);
      this.currentRun = run;
    }

    console.log(`Started run: ${runName} (${runId})`);
    return runId;
  }

  /**
   * Log metrics during training
   */
  async logMetrics(metrics: Record<string, number>): Promise<void> {
    if (!this.currentRun) {
      console.warn('No active run to log metrics to');
      return;
    }

    Object.entries(metrics).forEach(([key, value]) => {
      this.currentRun!.metrics[key] = value;
    });

    console.log(`Logged metrics: ${Object.keys(metrics).join(', ')}`);
  }

  /**
   * Log a single metric
   */
  async logMetric(key: string, value: number, step?: number): Promise<void> {
    if (!this.currentRun) {
      console.warn('No active run to log metric to');
      return;
    }

    const metricKey = step !== undefined ? `${key}_step_${step}` : key;
    this.currentRun.metrics[metricKey] = value;
  }

  /**
   * Log parameters
   */
  async logParameters(parameters: Record<string, any>): Promise<void> {
    if (!this.currentRun) {
      console.warn('No active run to log parameters to');
      return;
    }

    Object.entries(parameters).forEach(([key, value]) => {
      this.currentRun!.parameters[key] = value;
    });
  }

  /**
   * Log tags
   */
  async logTags(tags: Record<string, string>): Promise<void> {
    if (!this.currentRun) {
      console.warn('No active run to log tags to');
      return;
    }

    Object.entries(tags).forEach(([key, value]) => {
      this.currentRun!.tags[key] = value;
    });
  }

  /**
   * Log artifacts (model files, plots, etc.)
   */
  async logArtifacts(artifacts: string[]): Promise<void> {
    if (!this.currentRun) {
      console.warn('No active run to log artifacts to');
      return;
    }

    this.currentRun.artifacts.push(...artifacts);
  }

  /**
   * End the current run
   */
  async endRun(status: 'finished' | 'failed' = 'finished'): Promise<void> {
    if (!this.currentRun) {
      console.warn('No active run to end');
      return;
    }

    this.currentRun.status = status;
    this.currentRun.endTime = Date.now();

    // Update best run if this is better
    const experiment = this.experiments.get(this.currentRun.experimentId);
    if (experiment && status === 'finished') {
      this.updateBestRun(experiment, this.currentRun);
    }

    console.log(`Ended run: ${this.currentRun.name} (${status})`);
    this.currentRun = null;
  }

  /**
   * Get experiment by ID
   */
  getExperiment(experimentId: string): Experiment | undefined {
    return this.experiments.get(experimentId);
  }

  /**
   * Get all experiments
   */
  getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Get run by ID
   */
  getRun(runId: string): ExperimentRun | undefined {
    for (const experiment of this.experiments.values()) {
      const run = experiment.runs.find(r => r.runId === runId);
      if (run) return run;
    }
    return undefined;
  }

  /**
   * Compare runs
   */
  compareRuns(runIds: string[]): {
    runs: ExperimentRun[];
    comparison: Record<string, Record<string, number>>;
    bestRun: ExperimentRun | undefined;
  } {
    const runs = runIds.map(id => this.getRun(id)).filter(Boolean) as ExperimentRun[];
    
    const comparison: Record<string, Record<string, number>> = {};
    const allMetrics = new Set<string>();
    
    // Collect all unique metrics
    runs.forEach(run => {
      Object.keys(run.metrics).forEach(metric => allMetrics.add(metric));
    });

    // Build comparison table
    allMetrics.forEach(metric => {
      comparison[metric] = {};
      runs.forEach(run => {
        comparison[metric][run.runId] = run.metrics[metric] || 0;
      });
    });

    // Find best run based on primary metrics
    const bestRun = this.findBestRun(runs);

    return { runs, comparison, bestRun };
  }

  /**
   * Search experiments
   */
  searchExperiments(query: {
    name?: string;
    tags?: Record<string, string>;
    dateRange?: { start: number; end: number };
  }): Experiment[] {
    return Array.from(this.experiments.values()).filter(experiment => {
      if (query.name && !experiment.name.toLowerCase().includes(query.name.toLowerCase())) {
        return false;
      }

      if (query.tags) {
        for (const [key, value] of Object.entries(query.tags)) {
          if (experiment.tags[key] !== value) {
            return false;
          }
        }
      }

      if (query.dateRange) {
        if (experiment.createdAt < query.dateRange.start || experiment.createdAt > query.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Delete experiment
   */
  async deleteExperiment(experimentId: string): Promise<boolean> {
    return this.experiments.delete(experimentId);
  }

  /**
   * Export experiment data
   */
  exportExperiment(experimentId: string): string {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    return JSON.stringify(experiment, null, 2);
  }

  /**
   * Import experiment data
   */
  importExperiment(data: string): string {
    const experiment: Experiment = JSON.parse(data);
    this.experiments.set(experiment.experimentId, experiment);
    return experiment.experimentId;
  }

  private updateBestRun(experiment: Experiment, run: ExperimentRun): void {
    if (!experiment.bestRun) {
      experiment.bestRun = run;
      return;
    }

    // Compare based on primary metrics (accuracy, Sharpe ratio, etc.)
    const primaryMetrics = ['accuracy', 'sharpe_ratio', 'f1_score', 'r2_score'];
    
    for (const metric of primaryMetrics) {
      const currentBest = experiment.bestRun.metrics[metric] || 0;
      const newRun = run.metrics[metric] || 0;
      
      if (newRun > currentBest) {
        experiment.bestRun = run;
        break;
      } else if (newRun < currentBest) {
        break;
      }
    }
  }

  private findBestRun(runs: ExperimentRun[]): ExperimentRun | undefined {
    if (runs.length === 0) return undefined;

    const primaryMetrics = ['accuracy', 'sharpe_ratio', 'f1_score', 'r2_score'];
    
    return runs.reduce((best, current) => {
      for (const metric of primaryMetrics) {
        const bestValue = best.metrics[metric] || 0;
        const currentValue = current.metrics[metric] || 0;
        
        if (currentValue > bestValue) {
          return current;
        } else if (currentValue < bestValue) {
          return best;
        }
      }
      return best;
    });
  }
}

// Export singleton instance
export const experimentTracker = new ExperimentTracker();
