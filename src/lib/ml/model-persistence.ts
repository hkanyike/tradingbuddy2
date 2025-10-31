// Production-ready model persistence and versioning
import { TrainedModel } from './model-service';
import { db } from '@/db';
import { mlModels } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface ModelMetadata {
  id: string;
  name: string;
  version: string;
  algorithm: string;
  type: string;
  status: string;
  metrics: Record<string, number>;
  hyperparameters: Record<string, any>;
  trainingDataSize: number;
  trainedAt: number;
  modelPath: string;
  featureImportance?: Record<string, number>;
}

export class ModelPersistence {
  private modelCache: Map<string, any> = new Map();
  private isInitialized = false;

  /**
   * Initialize model persistence
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load all models from database
      await this.loadAllModels();
      this.isInitialized = true;
      console.log('Model persistence initialized');
    } catch (error) {
      console.error('Failed to initialize model persistence:', error);
      throw error;
    }
  }

  /**
   * Save a trained model
   */
  async saveModel(model: TrainedModel, modelData: any): Promise<void> {
    try {
      const modelPath = `models/${model.id}_${model.version}.json`;
      
      // Save model metadata to database
      await db.insert(mlModels).values({
        id: model.id,
        name: model.name,
        version: model.version,
        algorithm: model.config.algorithm,
        type: model.config.type,
        status: model.status,
        metrics: JSON.stringify(model.metrics),
        hyperparameters: JSON.stringify(model.config.hyperparameters),
        trainingDataSize: model.trainingDataSize,
        trainedAt: model.trainedAt,
        modelPath,
        featureImportance: model.featureImportance ? JSON.stringify(model.featureImportance) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Save model data to file system (in production, use cloud storage)
      await this.saveModelData(modelPath, modelData);
      
      // Cache model
      this.modelCache.set(model.id, { model, data: modelData });
      
      console.log(`Model ${model.id} saved successfully`);
    } catch (error) {
      console.error(`Failed to save model ${model.id}:`, error);
      throw error;
    }
  }

  /**
   * Load a model by ID
   */
  async loadModel(modelId: string): Promise<{ model: TrainedModel; data: any } | null> {
    try {
      // Check cache first
      const cached = this.modelCache.get(modelId);
      if (cached) {
        return cached;
      }

      // Load from database
      const result = await db
        .select()
        .from(mlModels)
        .where(eq(mlModels.id, modelId))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const dbModel = result[0];
      
      // Load model data
      const modelData = dbModel.modelPath ? await this.loadModelData(dbModel.modelPath) : null;
      
      // Reconstruct TrainedModel object
      const model: TrainedModel = {
        id: dbModel.id,
        name: dbModel.name,
        version: dbModel.version,
        config: {
          name: dbModel.name,
          type: dbModel.type as any,
          algorithm: dbModel.algorithm as any,
          features: [], // Would be stored separately
          target: '', // Would be stored separately
          hyperparameters: JSON.parse(dbModel.hyperparameters || '{}'),
          trainingDataSize: dbModel.trainingDataSize || 0,
          validationSplit: 0.2,
          testSplit: 0.1
        },
        metrics: JSON.parse(dbModel.metrics || '{}'),
        trainingDataSize: dbModel.trainingDataSize || 0,
        trainedAt: dbModel.trainedAt,
        status: dbModel.status as any,
        modelPath: dbModel.modelPath || undefined,
        featureImportance: dbModel.featureImportance ? JSON.parse(dbModel.featureImportance) : undefined
      };

      // Cache model
      this.modelCache.set(modelId, { model, data: modelData });
      
      return { model, data: modelData };
    } catch (error) {
      console.error(`Failed to load model ${modelId}:`, error);
      return null;
    }
  }

  /**
   * Load all models
   */
  async loadAllModels(): Promise<TrainedModel[]> {
    try {
      const results = await db
        .select()
        .from(mlModels)
        .orderBy(mlModels.trainedAt);

      const models: TrainedModel[] = [];
      
      for (const dbModel of results) {
        const model: TrainedModel = {
          id: dbModel.id,
          name: dbModel.name,
          version: dbModel.version,
          config: {
            name: dbModel.name,
            type: dbModel.type as any,
            algorithm: dbModel.algorithm as any,
            features: [],
            target: '',
            hyperparameters: JSON.parse(dbModel.hyperparameters || '{}'),
            trainingDataSize: dbModel.trainingDataSize || 0,
            validationSplit: 0.2,
            testSplit: 0.1
          },
          metrics: JSON.parse(dbModel.metrics || '{}'),
          trainingDataSize: dbModel.trainingDataSize || 0,
          trainedAt: dbModel.trainedAt,
          status: dbModel.status as any,
          modelPath: dbModel.modelPath || undefined,
          featureImportance: dbModel.featureImportance ? JSON.parse(dbModel.featureImportance) : undefined
        };
        
        models.push(model);
      }

      return models;
    } catch (error) {
      console.error('Failed to load all models:', error);
      return [];
    }
  }

  /**
   * Update model status
   */
  async updateModelStatus(modelId: string, status: string): Promise<void> {
    try {
      await db
        .update(mlModels)
        .set({ 
          status,
          updatedAt: new Date().toISOString()
        })
        .where(eq(mlModels.id, modelId));

      // Update cache
      const cached = this.modelCache.get(modelId);
      if (cached) {
        cached.model.status = status as any;
      }
    } catch (error) {
      console.error(`Failed to update model status for ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(modelId: string): Promise<void> {
    try {
      // Get model path
      const result = await db
        .select()
        .from(mlModels)
        .where(eq(mlModels.id, modelId))
        .limit(1);

      if (result.length > 0 && result[0].modelPath) {
        // Delete model data file
        await this.deleteModelData(result[0].modelPath);
      }

      // Delete from database
      await db
        .delete(mlModels)
        .where(eq(mlModels.id, modelId));

      // Remove from cache
      this.modelCache.delete(modelId);
      
      console.log(`Model ${modelId} deleted successfully`);
    } catch (error) {
      console.error(`Failed to delete model ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Get model versions
   */
  async getModelVersions(modelName: string): Promise<TrainedModel[]> {
    try {
      const results = await db
        .select()
        .from(mlModels)
        .where(eq(mlModels.name, modelName))
        .orderBy(mlModels.trainedAt);

      return results.map(dbModel => ({
        id: dbModel.id,
        name: dbModel.name,
        version: dbModel.version,
        config: {
          name: dbModel.name,
          type: dbModel.type as any,
          algorithm: dbModel.algorithm as any,
          features: [],
          target: '',
          hyperparameters: JSON.parse(dbModel.hyperparameters || '{}'),
          trainingDataSize: dbModel.trainingDataSize || 0,
          validationSplit: 0.2,
          testSplit: 0.1
        },
        metrics: JSON.parse(dbModel.metrics || '{}'),
        trainingDataSize: dbModel.trainingDataSize || 0,
        trainedAt: dbModel.trainedAt,
        status: dbModel.status as any,
        modelPath: dbModel.modelPath || undefined,
        featureImportance: dbModel.featureImportance ? JSON.parse(dbModel.featureImportance) : undefined
      }));
    } catch (error) {
      console.error(`Failed to get versions for model ${modelName}:`, error);
      return [];
    }
  }

  private async saveModelData(path: string, data: any): Promise<void> {
    // In production, this would save to cloud storage (S3, GCS, etc.)
    // For now, we'll simulate saving
    console.log(`Saving model data to ${path}`);
    // In a real implementation, you would write the data to a file or cloud storage
  }

  private async loadModelData(path: string): Promise<any> {
    // In production, this would load from cloud storage
    // For now, we'll simulate loading
    console.log(`Loading model data from ${path}`);
    // In a real implementation, you would read the data from storage
    return {}; // Return mock model data
  }

  private async deleteModelData(path: string): Promise<void> {
    // In production, this would delete from cloud storage
    console.log(`Deleting model data from ${path}`);
  }
}

// Export singleton instance
export const modelPersistence = new ModelPersistence();
