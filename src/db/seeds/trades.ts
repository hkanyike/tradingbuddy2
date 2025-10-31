import { db } from '@/db';
import { trades, user } from '@/db/schema';

async function main() {
    // Query user table to get actual userId
    const users = await db.select().from(user).limit(1);
    
    if (users.length === 0) {
        console.error('❌ No users found in database. Please seed users first.');
        return;
    }
    
    const userId = users[0].id;
    const nowISO = new Date().toISOString();

    const sampleTrades = [
        {
            userId: userId,
            positionId: null,
            assetId: 1,
            tradeType: 'buy',
            quantity: 100,
            price: 445.50,
            commission: 1.00,
            pnl: 0,
            executedAt: new Date('2024-01-15T09:30:00Z').toISOString(),
            createdAt: nowISO,
        },
        {
            userId: userId,
            positionId: null,
            assetId: 1,
            tradeType: 'sell',
            quantity: 100,
            price: 455.75,
            commission: 1.00,
            pnl: 1023.00,
            executedAt: new Date('2024-01-18T15:45:00Z').toISOString(),
            createdAt: nowISO,
        },
        {
            userId: userId,
            positionId: null,
            assetId: 2,
            tradeType: 'buy',
            quantity: 50,
            price: 185.25,
            commission: 0.50,
            pnl: 0,
            executedAt: new Date('2024-01-20T10:00:00Z').toISOString(),
            createdAt: nowISO,
        },
    ];

    await db.insert(trades).values(sampleTrades);
    
    console.log('✅ Trades seeder completed successfully');
    console.log(`📈 Generated ${sampleTrades.length} trades`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
