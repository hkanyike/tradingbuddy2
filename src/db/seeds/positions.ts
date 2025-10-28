import { db } from '@/db';
import { positions, user } from '@/db/schema';

async function main() {
    // Query the actual userId from the user table
    const users = await db.select({ id: user.id }).from(user).limit(1);
    
    if (users.length === 0) {
        throw new Error('No user found in the database. Please seed users first.');
    }
    
    const userId = users[0].id;
    
    // Calculate dates
    const today = new Date();
    const getExpiration = (daysFromNow: number) => {
        const date = new Date(today);
        date.setDate(date.getDate() + daysFromNow);
        return date.toISOString();
    };
    
    const getOpenDate = (daysAgo: number) => {
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString();
    };
    
    const samplePositions = [
        {
            userId: userId,
            strategyId: 1,
            assetId: 1, // AAPL
            positionType: 'call',
            quantity: 5,
            entryPrice: 3.50,
            currentPrice: 4.25,
            strikePrice: 450.00,
            expirationDate: getExpiration(30),
            delta: 0.62,
            gamma: 0.018,
            theta: -0.085,
            vega: 0.24,
            iv: 0.28,
            unrealizedPnl: (4.25 - 3.50) * 5 * 100, // $375
            stopLoss: 2.80,
            takeProfit: 5.50,
            status: 'open',
            openedAt: getOpenDate(14),
            updatedAt: today.toISOString(),
        },
        {
            userId: userId,
            strategyId: 2,
            assetId: 2, // QQQ
            positionType: 'put',
            quantity: 3,
            entryPrice: 4.20,
            currentPrice: 3.85,
            strikePrice: 375.00,
            expirationDate: getExpiration(45),
            delta: -0.48,
            gamma: 0.015,
            theta: -0.072,
            vega: 0.19,
            iv: 0.24,
            unrealizedPnl: (3.85 - 4.20) * 3 * 100, // -$105
            stopLoss: 5.20,
            takeProfit: 2.50,
            status: 'open',
            openedAt: getOpenDate(21),
            updatedAt: today.toISOString(),
        },
        {
            userId: userId,
            strategyId: 3,
            assetId: 6, // NVDA
            positionType: 'straddle',
            quantity: 2,
            entryPrice: 12.50,
            currentPrice: 14.80,
            strikePrice: 240.00,
            expirationDate: getExpiration(25),
            delta: 0.05,
            gamma: 0.025,
            theta: -0.18,
            vega: 0.42,
            iv: 0.52,
            unrealizedPnl: (14.80 - 12.50) * 2 * 100, // $460
            stopLoss: 10.00,
            takeProfit: 18.00,
            status: 'open',
            openedAt: getOpenDate(10),
            updatedAt: today.toISOString(),
        },
        {
            userId: userId,
            strategyId: 1,
            assetId: 7, // META
            positionType: 'spread',
            quantity: 10,
            entryPrice: 1.80,
            currentPrice: 1.50,
            strikePrice: 175.00,
            expirationDate: getExpiration(60),
            delta: 0.28,
            gamma: 0.012,
            theta: -0.045,
            vega: 0.15,
            iv: 0.31,
            unrealizedPnl: (1.50 - 1.80) * 10 * 100, // -$300
            stopLoss: 2.50,
            takeProfit: 0.75,
            status: 'open',
            openedAt: getOpenDate(28),
            updatedAt: today.toISOString(),
        },
        {
            userId: userId,
            strategyId: 2,
            assetId: 1, // SPY
            positionType: 'calendar',
            quantity: 1,
            entryPrice: 25.00,
            currentPrice: 28.50,
            strikePrice: 450.00,
            expirationDate: getExpiration(15),
            delta: 0.15,
            gamma: 0.008,
            theta: -0.12,
            vega: 0.35,
            iv: 0.18,
            unrealizedPnl: (28.50 - 25.00) * 1 * 100, // $350
            stopLoss: 20.00,
            takeProfit: 35.00,
            status: 'open',
            openedAt: getOpenDate(7),
            updatedAt: today.toISOString(),
        },
    ];

    await db.insert(positions).values(samplePositions);
    
    console.log('✅ Positions seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
