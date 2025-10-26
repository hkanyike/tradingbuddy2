import { db } from '@/db';
import { mlTrainingRuns, user } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    // Query the actual user ID from the auth user table
    const users = await db.select({ id: user.id }).from(user).limit(1);
    
    if (users.length === 0) {
        throw new Error('No users found in database. Please seed users table first.');
    }
    
    const userId = users[0].id;
    console.log(`Using userId: ${userId}`);

    // Calculate dates
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgoPlus6Min = new Date(thirtyDaysAgo.getTime() + 6 * 60 * 1000);
    const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
    const fortyFiveDaysAgoPlus3Min = new Date(fortyFiveDaysAgo.getTime() + 3 * 60 * 1000);

    const sampleTrainingRuns = [
        {
            modelId: 1,
            userId: userId,
            datasetStartDate: '2023-01-01',
            datasetEndDate: '2023-12-31',
            trainingSamples: 8420,
            validationSamples: 2105,
            trainingMetrics: JSON.stringify({
                accuracy: 0.8742,
                precision: 0.8591,
                recall: 0.8823,
                f1: 0.8705,
                mse: 0.0234,
                mae: 0.1156,
                r2: 0.9123
            }),
            validationMetrics: JSON.stringify({
                accuracy: 0.8587,
                precision: 0.8432,
                recall: 0.8695,
                f1: 0.8562,
                mse: 0.0289,
                mae: 0.1289,
                r2: 0.8968
            }),
            overfittingScore: 0.0055,
            trainingDurationSeconds: 342,
            status: 'completed',
            createdAt: thirtyDaysAgo.toISOString(),
            completedAt: thirtyDaysAgoPlus6Min.toISOString(),
        },
        {
            modelId: 2,
            userId: userId,
            datasetStartDate: '2022-06-01',
            datasetEndDate: '2024-01-31',
            trainingSamples: 12567,
            validationSamples: 3142,
            trainingMetrics: JSON.stringify({
                accuracy: 0.9015,
                precision: 0.8924,
                recall: 0.9087,
                f1: 0.9005,
                mse: 0.0178,
                mae: 0.0987,
                r2: 0.9345
            }),
            validationMetrics: JSON.stringify({
                accuracy: 0.8891,
                precision: 0.8765,
                recall: 0.8956,
                f1: 0.8860,
                mse: 0.0201,
                mae: 0.1045,
                r2: 0.9267
            }),
            overfittingScore: 0.0078,
            trainingDurationSeconds: 189,
            status: 'completed',
            createdAt: fortyFiveDaysAgo.toISOString(),
            completedAt: fortyFiveDaysAgoPlus3Min.toISOString(),
        }
    ];

    await db.insert(mlTrainingRuns).values(sampleTrainingRuns);
    
    console.log('✅ ML Training Runs seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});