import { db } from '@/db';
import { mlTrainingRuns, user } from '@/db/schema';

async function main() {
    // Query user table to get actual userId
    const users = await db.select().from(user).limit(1);
    
    if (users.length === 0) {
        console.error('❌ No users found in database. Please seed users first.');
        return;
    }
    
    const userId = users[0].id;
    const now = Date.now();
    const nowISO = new Date().toISOString();
    const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = now - (5 * 24 * 60 * 60 * 1000);

    const sampleTrainingRuns = [
        {
            id: 'run-1-' + Date.now(),
            modelId: 'xgboost-1' + now,
            experimentId: 'exp-1',
            runName: 'XGBoost Training Run 1',
            status: 'completed',
            startTime: fiveDaysAgo,
            endTime: fiveDaysAgo + (3600 * 1000),
            metrics: JSON.stringify({
                accuracy: 0.85,
                loss: 0.15
            }),
            parameters: JSON.stringify({
                max_depth: 6,
                learning_rate: 0.1
            }),
            tags: JSON.stringify({ userId }),
            artifacts: JSON.stringify([]),
            createdAt: nowISO,
        },
        {
            id: 'run-2-' + (Date.now() + 1),
            modelId: 'har-rv-1' + now,
            experimentId: 'exp-2',
            runName: 'HAR-RV Training Run 1',
            status: 'running',
            startTime: twoDaysAgo,
            endTime: null,
            metrics: JSON.stringify({
                r_squared: 0.72
            }),
            parameters: JSON.stringify({
                daily_lag: 1,
                weekly_lag: 5
            }),
            tags: JSON.stringify({ userId }),
            artifacts: JSON.stringify([]),
            createdAt: nowISO,
        },
    ];

    await db.insert(mlTrainingRuns).values(sampleTrainingRuns);
    
    console.log('✅ ML Training Runs seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
