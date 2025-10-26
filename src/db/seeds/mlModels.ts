import { db } from '@/db';
import { mlModels } from '@/db/schema';

async function main() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
    const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const sampleModels = [
        {
            name: 'XGBoost IV Mean Reversion',
            modelType: 'xgboost',
            strategyId: 1,
            version: 'v1.2.3',
            status: 'active',
            description: 'Predicts short-term IV mean reversion opportunities using historical IV surface data and volume imbalances',
            hyperparameters: JSON.stringify({
                max_depth: 6,
                learning_rate: 0.1,
                n_estimators: 100,
                subsample: 0.8,
                colsample_bytree: 0.8,
                gamma: 0.1
            }),
            featureImportance: JSON.stringify({
                iv_term_spread: 0.28,
                skew_change: 0.22,
                volume_imbalance: 0.18,
                historical_vol: 0.15,
                liquidity_score: 0.10,
                regime_indicator: 0.07
            }),
            createdAt: thirtyDaysAgo.toISOString(),
            updatedAt: fiveDaysAgo.toISOString(),
        },
        {
            name: 'HAR-RV Multi-Horizon Volatility',
            modelType: 'har_rv',
            strategyId: 2,
            version: 'v2.1.0',
            status: 'active',
            description: 'Heterogeneous Autoregressive Realized Volatility model for 1-day, 7-day, and 30-day volatility forecasts',
            hyperparameters: JSON.stringify({
                daily_lag: 1,
                weekly_lag: 5,
                monthly_lag: 22,
                include_jumps: true,
                use_log: true
            }),
            featureImportance: JSON.stringify({
                rv_daily: 0.45,
                rv_weekly: 0.30,
                rv_monthly: 0.20,
                jump_component: 0.05
            }),
            createdAt: fortyFiveDaysAgo.toISOString(),
            updatedAt: tenDaysAgo.toISOString(),
        },
        {
            name: 'Ensemble Trade Win Probability',
            modelType: 'ensemble',
            strategyId: 3,
            version: 'v1.0.5',
            status: 'active',
            description: 'Ensemble model combining XGBoost, LightGBM, and LSTM to predict probability of profitable trade outcomes',
            hyperparameters: JSON.stringify({
                xgboost_weight: 0.4,
                lightgbm_weight: 0.3,
                lstm_weight: 0.3,
                ensemble_method: 'weighted_average',
                threshold: 0.65
            }),
            featureImportance: JSON.stringify({
                greeks_composite: 0.25,
                iv_rank: 0.20,
                liquidity: 0.15,
                regime: 0.12,
                spread_width: 0.10,
                time_decay: 0.10,
                momentum: 0.08
            }),
            createdAt: twentyDaysAgo.toISOString(),
            updatedAt: twoDaysAgo.toISOString(),
        }
    ];

    await db.insert(mlModels).values(sampleModels);
    
    console.log('✅ ML models seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});