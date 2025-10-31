import { db } from '@/db';
import { mlModels } from '@/db/schema';

async function main() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const sampleModels = [
        {
            id: 'xgboost-1' + Date.now(),
            name: 'XGBoost IV Mean Reversion',
            algorithm: 'xgboost',
            type: 'xgboost',
            version: 'v1.2.3',
            status: 'active',
            metrics: JSON.stringify({
                accuracy: 0.85,
                precision: 0.82,
                recall: 0.88,
                f1_score: 0.85
            }),
            hyperparameters: JSON.stringify({
                max_depth: 6,
                learning_rate: 0.1,
                n_estimators: 100,
                subsample: 0.8
            }),
            trainingDataSize: 10000,
            trainedAt: thirtyDaysAgo.getTime(),
            modelPath: '/models/xgboost_iv_v1.2.3.pkl',
            featureImportance: JSON.stringify({
                iv_term_spread: 0.28,
                skew_change: 0.22,
                volume_imbalance: 0.18
            }),
            createdAt: thirtyDaysAgo.toISOString(),
            updatedAt: fiveDaysAgo.toISOString(),
        },
        {
            id: 'har-rv-1' + Date.now(),
            name: 'HAR-RV Multi-Horizon Volatility',
            algorithm: 'har_rv',
            type: 'har_rv',
            version: 'v2.1.0',
            status: 'active',
            metrics: JSON.stringify({
                r_squared: 0.72,
                mae: 0.08,
                rmse: 0.11
            }),
            hyperparameters: JSON.stringify({
                daily_lag: 1,
                weekly_lag: 5,
                monthly_lag: 22
            }),
            trainingDataSize: 5000,
            trainedAt: twentyDaysAgo.getTime(),
            modelPath: '/models/har_rv_v2.1.0.pkl',
            featureImportance: JSON.stringify({
                daily_rv: 0.45,
                weekly_rv: 0.35,
                monthly_rv: 0.20
            }),
            createdAt: twentyDaysAgo.toISOString(),
            updatedAt: fiveDaysAgo.toISOString(),
        },
        {
            id: 'lstm-1' + Date.now(),
            name: 'LSTM Price Prediction',
            algorithm: 'lstm',
            type: 'lstm',
            version: 'v1.0.0',
            status: 'training',
            metrics: JSON.stringify({
                loss: 0.05
            }),
            hyperparameters: JSON.stringify({
                units: 128,
                dropout: 0.2,
                learning_rate: 0.001
            }),
            trainingDataSize: 15000,
            trainedAt: Date.now(),
            modelPath: null,
            featureImportance: null,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
        },
    ];

    await db.insert(mlModels).values(sampleModels);
    
    console.log('✅ ML models seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
