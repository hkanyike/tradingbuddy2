import { db } from '@/db';
import { trades, user } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    // First, query the actual user ID from the auth user table
    const users = await db.select({ id: user.id }).from(user).limit(1);
    
    if (users.length === 0) {
        throw new Error('No user found in the database. Please seed users first.');
    }
    
    const userId = users[0].id;
    console.log(`📊 Using userId: ${userId}`);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Helper function to generate dates within the last 30 days
    const getRandomDate = (start: Date, end: Date) => {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    };

    // Helper function to add days to a date
    const addDays = (date: Date, days: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    };

    const sampleTrades = [
        // WINNING TRADES (6 trades)
        {
            userId: userId,
            strategyId: 1,
            assetId: 2, // AAPL
            positionId: null,
            tradeType: 'buy',
            positionType: 'call',
            quantity: 5,
            entryPrice: 3.25,
            exitPrice: 6.80,
            strikePrice: 175.0,
            expirationDate: addDays(now, 25).toISOString(),
            realizedPnl: 1750.0, // (6.80 - 3.25) * 5 * 100 - 10 - 15
            commission: 10.0,
            slippage: 15.0,
            executedAt: getRandomDate(thirtyDaysAgo, new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000)).toISOString(),
            closedAt: getRandomDate(new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000), new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        {
            userId: userId,
            strategyId: 2,
            assetId: 5, // TSLA
            positionId: null,
            tradeType: 'sell',
            positionType: 'put',
            quantity: 10,
            entryPrice: 2.10,
            exitPrice: 0.85,
            strikePrice: 220.0,
            expirationDate: addDays(now, 35).toISOString(),
            realizedPnl: 1235.0, // (2.10 - 0.85) * 10 * 100 - 15 - 10
            commission: 15.0,
            slippage: 10.0,
            executedAt: getRandomDate(thirtyDaysAgo, new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000)).toISOString(),
            closedAt: getRandomDate(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        {
            userId: userId,
            strategyId: 1,
            assetId: 3, // MSFT
            positionId: null,
            tradeType: 'buy',
            positionType: 'straddle',
            quantity: 3,
            entryPrice: 8.50,
            exitPrice: 14.20,
            strikePrice: 380.0,
            expirationDate: addDays(now, 42).toISOString(),
            realizedPnl: 1695.0, // (14.20 - 8.50) * 3 * 100 - 6 - 9
            commission: 6.0,
            slippage: 9.0,
            executedAt: getRandomDate(thirtyDaysAgo, new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000)).toISOString(),
            closedAt: getRandomDate(new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        {
            userId: userId,
            strategyId: 3,
            assetId: 1, // SPY
            positionId: null,
            tradeType: 'roll',
            positionType: 'call',
            quantity: 8,
            entryPrice: 4.75,
            exitPrice: 7.40,
            strikePrice: 465.0,
            expirationDate: addDays(now, 20).toISOString(),
            realizedPnl: 2102.0, // (7.40 - 4.75) * 8 * 100 - 12 - 6
            commission: 12.0,
            slippage: 6.0,
            executedAt: getRandomDate(thirtyDaysAgo, new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000)).toISOString(),
            closedAt: getRandomDate(new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000), new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        {
            userId: userId,
            strategyId: 2,
            assetId: 4, // NVDA
            positionId: null,
            tradeType: 'buy',
            positionType: 'spread',
            quantity: 12,
            entryPrice: 2.35,
            exitPrice: 3.95,
            strikePrice: 520.0,
            expirationDate: addDays(now, 28).toISOString(),
            realizedPnl: 1902.0, // (3.95 - 2.35) * 12 * 100 - 18 - 12
            commission: 18.0,
            slippage: 12.0,
            executedAt: getRandomDate(thirtyDaysAgo, new Date(now.getTime() - 24 * 24 * 60 * 60 * 1000)).toISOString(),
            closedAt: getRandomDate(new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000), new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        {
            userId: userId,
            strategyId: 1,
            assetId: 6, // AMZN
            positionId: null,
            tradeType: 'hedge',
            positionType: 'put',
            quantity: 6,
            entryPrice: 3.80,
            exitPrice: 5.65,
            strikePrice: 165.0,
            expirationDate: addDays(now, 32).toISOString(),
            realizedPnl: 1087.0, // (5.65 - 3.80) * 6 * 100 - 11 - 12
            commission: 11.0,
            slippage: 12.0,
            executedAt: getRandomDate(thirtyDaysAgo, new Date(now.getTime() - 26 * 24 * 60 * 60 * 1000)).toISOString(),
            closedAt: getRandomDate(new Date(now.getTime() - 19 * 24 * 60 * 60 * 1000), new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        
        // LOSING TRADES (4 trades)
        {
            userId: userId,
            strategyId: 2,
            assetId: 7, // GOOGL
            positionId: null,
            tradeType: 'buy',
            positionType: 'call',
            quantity: 4,
            entryPrice: 6.50,
            exitPrice: 3.85,
            strikePrice: 145.0,
            expirationDate: addDays(now, 18).toISOString(),
            realizedPnl: -1078.0, // (3.85 - 6.50) * 4 * 100 - 8 - 10
            commission: 8.0,
            slippage: 10.0,
            executedAt: getRandomDate(thirtyDaysAgo, new Date(now.getTime() - 17 * 24 * 60 * 60 * 1000)).toISOString(),
            closedAt: getRandomDate(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        {
            userId: userId,
            strategyId: 3,
            assetId: 8, // META
            positionId: null,
            tradeType: 'sell',
            positionType: 'put',
            quantity: 7,
            entryPrice: 3.20,
            exitPrice: 7.15,
            strikePrice: 480.0,
            expirationDate: addDays(now, 45).toISOString(),
            realizedPnl: -2778.0, // (3.20 - 7.15) * 7 * 100 - 14 - 15
            commission: 14.0,
            slippage: 15.0,
            executedAt: getRandomDate(thirtyDaysAgo, new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000)).toISOString(),
            closedAt: getRandomDate(new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000), new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        {
            userId: userId,
            strategyId: 1,
            assetId: 9, // QQQ
            positionId: null,
            tradeType: 'buy',
            positionType: 'calendar',
            quantity: 9,
            entryPrice: 5.40,
            exitPrice: 4.25,
            strikePrice: 400.0,
            expirationDate: addDays(now, 38).toISOString(),
            realizedPnl: -1050.0, // (4.25 - 5.40) * 9 * 100 - 15 - 20
            commission: 15.0,
            slippage: 20.0,
            executedAt: getRandomDate(thirtyDaysAgo, new Date(now.getTime() - 23 * 24 * 60 * 60 * 1000)).toISOString(),
            closedAt: getRandomDate(new Date(now.getTime() - 17 * 24 * 60 * 60 * 1000), new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        {
            userId: userId,
            strategyId: 2,
            assetId: 3, // MSFT
            positionId: null,
            tradeType: 'roll',
            positionType: 'put',
            quantity: 5,
            entryPrice: 7.25,
            exitPrice: 5.10,
            strikePrice: 370.0,
            expirationDate: addDays(now, 22).toISOString(),
            realizedPnl: -1090.0, // (5.10 - 7.25) * 5 * 100 - 10 - 15
            commission: 10.0,
            slippage: 15.0,
            executedAt: getRandomDate(thirtyDaysAgo, new Date(now.getTime() - 19 * 24 * 60 * 60 * 1000)).toISOString(),
            closedAt: getRandomDate(new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000), new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)).toISOString(),
        },
    ];

    await db.insert(trades).values(sampleTrades);
    
    console.log('✅ Trades seeder completed successfully');
    console.log(`📈 Generated 10 closed trades:`);
    console.log(`   • 6 winning trades (positive P&L)`);
    console.log(`   • 4 losing trades (negative P&L)`);
    console.log(`   • Total P&L: $${sampleTrades.reduce((sum, t) => sum + t.realizedPnl, 0).toFixed(2)}`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
