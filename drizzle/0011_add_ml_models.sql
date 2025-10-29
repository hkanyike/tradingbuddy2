-- Add ML models table for model persistence
CREATE TABLE IF NOT EXISTS ml_models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'training',
  metrics TEXT,
  hyperparameters TEXT,
  training_data_size INTEGER DEFAULT 0,
  trained_at INTEGER NOT NULL,
  model_path TEXT,
  feature_importance TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ml_models_name ON ml_models(name);
CREATE INDEX IF NOT EXISTS idx_ml_models_status ON ml_models(status);
CREATE INDEX IF NOT EXISTS idx_ml_models_algorithm ON ml_models(algorithm);
CREATE INDEX IF NOT EXISTS idx_ml_models_trained_at ON ml_models(trained_at);
