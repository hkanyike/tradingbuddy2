import { db } from '@/db';
import { user } from '@/db/schema';

async function main() {
    const sampleUsers = [
        {
            id: 'demo-user-1',
            email: 'demo@tradingbuddy.ai',
            name: 'Demo Trader',
            portfolioBalance: 100000,
            riskTolerance: 'moderate',
            executionMode: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
        }
    ];

    await db.insert(user).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
