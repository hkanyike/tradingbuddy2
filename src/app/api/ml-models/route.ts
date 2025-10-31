import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mlModels } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';

const VALID_MODEL_TYPES = ['xgboost', 'lightgbm', 'har_rv', 'lstm', 'ensemble'] as const;
const VALID_STATUSES = ['training', 'active', 'archived', 'failed'] as const;

type ModelType = typeof VALID_MODEL_TYPES[number];
type ModelStatus = typeof VALID_STATUSES[number];

function isValidModelType(type: string): type is ModelType {
  return VALID_MODEL_TYPES.includes(type as ModelType);
}

function isValidStatus(status: string): status is ModelStatus {
  return VALID_STATUSES.includes(status as ModelStatus);
}

function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      if (!id) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const model = await db.select()
        .from(mlModels)
        .where(eq(mlModels.id, id))
        .limit(1);

      if (model.length === 0) {
        return NextResponse.json({ 
          error: 'Model not found',
          code: "MODEL_NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(model[0]);
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let query = db.select().from(mlModels);

    const conditions = [];

    if (status) {
      if (!isValidStatus(status)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      conditions.push(eq(mlModels.status, status));
    }

    if (type) {
      if (!isValidModelType(type)) {
        return NextResponse.json({ 
          error: `Invalid type. Must be one of: ${VALID_MODEL_TYPES.join(', ')}`,
          code: "INVALID_MODEL_TYPE" 
        }, { status: 400 });
      }
      conditions.push(eq(mlModels.type, type));
    }

    const results = conditions.length > 0
      ? await query.where(and(...conditions))
          .orderBy(desc(mlModels.createdAt))
          .limit(limit)
          .offset(offset)
      : await query
          .orderBy(desc(mlModels.createdAt))
          .limit(limit)
          .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      type,
      algorithm,
      version, 
      hyperparameters,
      featureImportance,
      status,
      metrics,
      modelPath,
      trainingDataSize
    } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ 
        error: "Name is required and must be a non-empty string",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!type || typeof type !== 'string') {
      return NextResponse.json({ 
        error: "Type is required",
        code: "MISSING_TYPE" 
      }, { status: 400 });
    }

    if (!isValidModelType(type)) {
      return NextResponse.json({ 
        error: `Invalid type. Must be one of: ${VALID_MODEL_TYPES.join(', ')}`,
        code: "INVALID_MODEL_TYPE" 
      }, { status: 400 });
    }

    if (!algorithm || typeof algorithm !== 'string' || algorithm.trim().length === 0) {
      return NextResponse.json({ 
        error: "Algorithm is required and must be a non-empty string",
        code: "MISSING_ALGORITHM" 
      }, { status: 400 });
    }

    if (!version || typeof version !== 'string' || version.trim().length === 0) {
      return NextResponse.json({ 
        error: "Version is required and must be a non-empty string",
        code: "MISSING_VERSION" 
      }, { status: 400 });
    }

    if (status && !isValidStatus(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    if (hyperparameters) {
      if (typeof hyperparameters === 'string') {
        if (!isValidJSON(hyperparameters)) {
          return NextResponse.json({ 
            error: "Hyperparameters must be valid JSON",
            code: "INVALID_HYPERPARAMETERS_JSON" 
          }, { status: 400 });
        }
      } else if (typeof hyperparameters !== 'object') {
        return NextResponse.json({ 
          error: "Hyperparameters must be a valid JSON object or string",
          code: "INVALID_HYPERPARAMETERS_TYPE" 
        }, { status: 400 });
      }
    }

    if (featureImportance) {
      if (typeof featureImportance === 'string') {
        if (!isValidJSON(featureImportance)) {
          return NextResponse.json({ 
            error: "Feature importance must be valid JSON",
            code: "INVALID_FEATURE_IMPORTANCE_JSON" 
          }, { status: 400 });
        }
      } else if (typeof featureImportance !== 'object') {
        return NextResponse.json({ 
          error: "Feature importance must be a valid JSON object or string",
          code: "INVALID_FEATURE_IMPORTANCE_TYPE" 
        }, { status: 400 });
      }
    }

    if (metrics) {
      if (typeof metrics === 'string') {
        if (!isValidJSON(metrics)) {
          return NextResponse.json({ 
            error: "Metrics must be valid JSON",
            code: "INVALID_METRICS_JSON" 
          }, { status: 400 });
        }
      } else if (typeof metrics !== 'object') {
        return NextResponse.json({ 
          error: "Metrics must be a valid JSON object or string",
          code: "INVALID_METRICS_TYPE" 
        }, { status: 400 });
      }
    }

    const currentTimestamp = new Date().toISOString();
    const modelId = `${type}-${Date.now()}`;

    const insertData: any = {
      id: modelId,
      name: name.trim(),
      type,
      algorithm: algorithm.trim(),
      version: version.trim(),
      status: status || 'training',
      trainedAt: Date.now(),
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };

    if (hyperparameters) {
      insertData.hyperparameters = typeof hyperparameters === 'string' 
        ? hyperparameters 
        : JSON.stringify(hyperparameters);
    }

    if (featureImportance) {
      insertData.featureImportance = typeof featureImportance === 'string' 
        ? featureImportance 
        : JSON.stringify(featureImportance);
    }

    if (metrics) {
      insertData.metrics = typeof metrics === 'string' 
        ? metrics 
        : JSON.stringify(metrics);
    }

    if (modelPath) {
      insertData.modelPath = modelPath;
    }

    if (trainingDataSize !== undefined && trainingDataSize !== null) {
      insertData.trainingDataSize = parseInt(String(trainingDataSize));
    }

    const newModel = await db.insert(mlModels)
      .values(insertData)
      .returning();

    return NextResponse.json(newModel[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const existingModel = await db.select()
      .from(mlModels)
      .where(eq(mlModels.id, id))
      .limit(1);

    if (existingModel.length === 0) {
      return NextResponse.json({ 
        error: 'Model not found',
        code: "MODEL_NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { 
      name, 
      type,
      algorithm,
      version, 
      hyperparameters,
      featureImportance,
      metrics,
      modelPath,
      trainingDataSize,
      status
    } = body;

    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ 
          error: "Name must be a non-empty string",
          code: "INVALID_NAME" 
        }, { status: 400 });
      }
      updates.name = name.trim();
    }

    if (type !== undefined) {
      if (!isValidModelType(type)) {
        return NextResponse.json({ 
          error: `Invalid type. Must be one of: ${VALID_MODEL_TYPES.join(', ')}`,
          code: "INVALID_MODEL_TYPE" 
        }, { status: 400 });
      }
      updates.type = type;
    }

    if (algorithm !== undefined) {
      if (typeof algorithm !== 'string' || algorithm.trim().length === 0) {
        return NextResponse.json({ 
          error: "Algorithm must be a non-empty string",
          code: "INVALID_ALGORITHM" 
        }, { status: 400 });
      }
      updates.algorithm = algorithm.trim();
    }

    if (version !== undefined) {
      if (typeof version !== 'string' || version.trim().length === 0) {
        return NextResponse.json({ 
          error: "Version must be a non-empty string",
          code: "INVALID_VERSION" 
        }, { status: 400 });
      }
      updates.version = version.trim();
    }

    if (status !== undefined) {
      if (!isValidStatus(status)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      updates.status = status;
    }

    if (modelPath !== undefined) {
      updates.modelPath = modelPath === null ? null : String(modelPath);
    }

    if (trainingDataSize !== undefined) {
      if (trainingDataSize === null) {
        updates.trainingDataSize = null;
      } else {
        updates.trainingDataSize = parseInt(String(trainingDataSize));
      }
    }

    if (hyperparameters !== undefined) {
      if (hyperparameters === null) {
        updates.hyperparameters = null;
      } else if (typeof hyperparameters === 'string') {
        if (!isValidJSON(hyperparameters)) {
          return NextResponse.json({ 
            error: "Hyperparameters must be valid JSON",
            code: "INVALID_HYPERPARAMETERS_JSON" 
          }, { status: 400 });
        }
        updates.hyperparameters = hyperparameters;
      } else if (typeof hyperparameters === 'object') {
        updates.hyperparameters = JSON.stringify(hyperparameters);
      } else {
        return NextResponse.json({ 
          error: "Hyperparameters must be a valid JSON object, string, or null",
          code: "INVALID_HYPERPARAMETERS_TYPE" 
        }, { status: 400 });
      }
    }

    if (featureImportance !== undefined) {
      if (featureImportance === null) {
        updates.featureImportance = null;
      } else if (typeof featureImportance === 'string') {
        if (!isValidJSON(featureImportance)) {
          return NextResponse.json({ 
            error: "Feature importance must be valid JSON",
            code: "INVALID_FEATURE_IMPORTANCE_JSON" 
          }, { status: 400 });
        }
        updates.featureImportance = featureImportance;
      } else if (typeof featureImportance === 'object') {
        updates.featureImportance = JSON.stringify(featureImportance);
      } else {
        return NextResponse.json({ 
          error: "Feature importance must be a valid JSON object, string, or null",
          code: "INVALID_FEATURE_IMPORTANCE_TYPE" 
        }, { status: 400 });
      }
    }

    if (metrics !== undefined) {
      if (metrics === null) {
        updates.metrics = null;
      } else if (typeof metrics === 'string') {
        if (!isValidJSON(metrics)) {
          return NextResponse.json({ 
            error: "Metrics must be valid JSON",
            code: "INVALID_METRICS_JSON" 
          }, { status: 400 });
        }
        updates.metrics = metrics;
      } else if (typeof metrics === 'object') {
        updates.metrics = JSON.stringify(metrics);
      } else {
        return NextResponse.json({ 
          error: "Metrics must be a valid JSON object, string, or null",
          code: "INVALID_METRICS_TYPE" 
        }, { status: 400 });
      }
    }

    const updated = await db.update(mlModels)
      .set(updates)
      .where(eq(mlModels.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const existingModel = await db.select()
      .from(mlModels)
      .where(eq(mlModels.id, id))
      .limit(1);

    if (existingModel.length === 0) {
      return NextResponse.json({ 
        error: 'Model not found',
        code: "MODEL_NOT_FOUND" 
      }, { status: 404 });
    }

    const deleted = await db.delete(mlModels)
      .where(eq(mlModels.id, id))
      .returning();

    return NextResponse.json({
      message: 'Model deleted successfully',
      model: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}
