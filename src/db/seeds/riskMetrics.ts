import { db } from '@/db';
import { riskMetrics, user } from '@/db/schema';

async function main() {
    // Query user table to get actual userId
    const users = await db.select().from(user).limit(1);
    
    if (users.length === 0) {
        console.error('❌ No users found in database. Please seed users first.');
        return;
    }
    
    const userId = users[0].id;
    const nowISO = new Date().toISOString();

    const sampleRiskMetrics = [
        {
            userId: userId,
            portfolioValue: 105000,
            totalPnl: 5000,
            dailyPnl: 250,
            sharpeRatio: 1.8,
            maxDrawdown: -2.5,
            var95: -1800,
            beta: 1.1,
            volatility: 0.15,
            calculatedAt: nowISO,
            createdAt: nowISO,
        },
    ];

    await db.insert(riskMetrics).values(sampleRiskMetrics);
    
    console.log('✅ Risk metrics seeder completed successfully');
    console.log(`   Used userId: ${userId}`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
