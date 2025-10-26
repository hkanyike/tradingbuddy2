import { db } from '@/db';
import { riskMetrics, user } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    // Query the actual user ID from the auth user table
    const users = await db.select({ id: user.id }).from(user).limit(1);
    
    if (users.length === 0) {
        console.error('❌ No users found in database. Please seed users first.');
        return;
    }

    const userId = users[0].id;

    const sampleRiskMetrics = [
        {
            userId: userId,
            totalExposure: 45000,
            netDelta: 120,
            netGamma: 0.15,
            netTheta: -50,
            netVega: 85,
            portfolioHeat: 0.45,
            maxDrawdown: -0.08,
            dailyPnl: 580,
            sharpeRatio: 1.8,
            sortinoRatio: 2.3,
            winRate: 0.65,
            calculatedAt: new Date().toISOString(),
        }
    ];

    await db.insert(riskMetrics).values(sampleRiskMetrics);
    
    console.log('✅ Risk metrics seeder completed successfully');
    console.log(`   Used userId: ${userId}`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});