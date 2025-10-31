import { db } from '@/db';
import { walkForwardTests, user } from '@/db/schema';

async function main() {
    // Query user table to get actual userId
    const users = await db.select().from(user).limit(1);
    
    if (users.length === 0) {
        console.error('❌ No users found in database. Please seed users first.');
        return;
    }
    
    const userId = users[0].id;
    const nowISO = new Date().toISOString();

    const sampleWalkForwardTests = [
        {
            userId: userId,
            strategyId: 1,
            modelId: null,
            name: 'IV Crush Strategy Walk-Forward Test',
            startDate: '2023-01-01',
            endDate: '2024-01-01',
            trainingPeriod: 90,
            testingPeriod: 30,
            stepSize: 30,
            totalReturn: 15.5,
            sharpeRatio: 1.8,
            maxDrawdown: -8.2,
            winRate: 0.65,
            parameters: JSON.stringify({
                minIVRank: 70,
                maxDTE: 7
            }),
            results: JSON.stringify({
                windows: 12,
                avgReturn: 1.3
            }),
            status: 'completed',
            createdAt: nowISO,
            completedAt: nowISO,
        },
    ];

    await db.insert(walkForwardTests).values(sampleWalkForwardTests);
    
    console.log('✅ Walk-forward tests seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
