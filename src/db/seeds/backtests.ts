import { db } from '@/db';
import { backtests, user } from '@/db/schema';

async function main() {
    // Query the actual user ID from the auth user table
    const users = await db.select({ id: user.id }).from(user).limit(1);
    
    if (!users.length) {
        console.error('❌ No users found in database. Please seed users first.');
        return;
    }
    
    const userId = users[0].id;
    console.log(`Using user ID: ${userId}`);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    const sampleBacktests = [
        {
            name: 'IV Crush Earnings - Q4 2023',
            strategyId: 1,
            modelId: 1,
            userId: userId,
            startDate: new Date('2023-10-01').toISOString(),
            endDate: new Date('2023-12-31').toISOString(),
            initialCapital: 100000.0,
            finalCapital: 118350.0,
            totalReturn: 18.35,
            sharpeRatio: 2.45,
            sortinoRatio: 3.12,
            maxDrawdown: -5.8,
            winRate: 68.09,
            profitFactor: 2.83,
            totalTrades: 47,
            winningTrades: 32,
            losingTrades: 15,
            avgWin: 847.32,
            avgLoss: -312.45,
            totalCommissions: 235.0,
            totalSlippage: 118.50,
            configuration: {
                strategy: 'IV_CRUSH_EARNINGS',
                parameters: {
                    minIVRank: 70,
                    maxDaysToExpiration: 7,
                    targetDelta: 0.30,
                    positionSize: 0.05,
                    maxPositions: 10,
                    stopLoss: 0.50,
                    profitTarget: 0.80
                },
                assets: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'],
                timeframe: 'daily',
                slippage: 0.02,
                commission: 5.0
            },
            status: 'completed',
            errorMessage: null,
            createdAt: sixtyDaysAgo.toISOString(),
            completedAt: thirtyDaysAgo.toISOString(),
        },
        {
            name: 'Monthly Calendar Spreads - 2023',
            strategyId: 2,
            modelId: 2,
            userId: userId,
            startDate: new Date('2023-01-01').toISOString(),
            endDate: new Date('2023-12-31').toISOString(),
            initialCapital: 100000.0,
            finalCapital: 107820.0,
            totalReturn: 7.82,
            sharpeRatio: 1.32,
            sortinoRatio: 1.89,
            maxDrawdown: -8.5,
            winRate: 59.52,
            profitFactor: 1.68,
            totalTrades: 84,
            winningTrades: 50,
            losingTrades: 34,
            avgWin: 524.18,
            avgLoss: -378.92,
            totalCommissions: 420.0,
            totalSlippage: 168.0,
            configuration: {
                strategy: 'CALENDAR_SPREAD',
                parameters: {
                    spreadWidth: 30,
                    minIV: 20,
                    targetDelta: 0.50,
                    positionSize: 0.08,
                    maxPositions: 8,
                    stopLoss: 0.40,
                    profitTarget: 0.60,
                    rollDays: 7
                },
                assets: ['SPY', 'QQQ', 'IWM', 'DIA'],
                timeframe: 'daily',
                slippage: 0.02,
                commission: 5.0
            },
            status: 'completed',
            errorMessage: null,
            createdAt: new Date('2023-12-01').toISOString(),
            completedAt: sixtyDaysAgo.toISOString(),
        },
        {
            name: 'Delta-Neutral Straddles - Low Vol',
            strategyId: 3,
            modelId: 3,
            userId: userId,
            startDate: new Date('2023-07-01').toISOString(),
            endDate: new Date('2023-09-30').toISOString(),
            initialCapital: 100000.0,
            finalCapital: 93240.0,
            totalReturn: -6.76,
            sharpeRatio: -0.85,
            sortinoRatio: -1.23,
            maxDrawdown: -12.3,
            winRate: 41.94,
            profitFactor: 0.72,
            totalTrades: 31,
            winningTrades: 13,
            losingTrades: 18,
            avgWin: 412.67,
            avgLoss: -589.34,
            totalCommissions: 155.0,
            totalSlippage: 62.0,
            configuration: {
                strategy: 'DELTA_NEUTRAL_STRADDLE',
                parameters: {
                    minIVPercentile: 20,
                    maxIVPercentile: 40,
                    targetDelta: 0.05,
                    positionSize: 0.10,
                    maxPositions: 5,
                    stopLoss: 0.60,
                    profitTarget: 0.50,
                    hedgeThreshold: 0.15
                },
                assets: ['SPX', 'NDX', 'RUT'],
                timeframe: 'daily',
                slippage: 0.02,
                commission: 5.0
            },
            status: 'completed',
            errorMessage: null,
            createdAt: new Date('2023-09-15').toISOString(),
            completedAt: fortyFiveDaysAgo.toISOString(),
        },
        {
            name: 'Bullish Call Spreads - Tech Rally',
            strategyId: 1,
            modelId: 1,
            userId: userId,
            startDate: new Date('2024-01-01').toISOString(),
            endDate: new Date('2024-03-31').toISOString(),
            initialCapital: 100000.0,
            finalCapital: 112560.0,
            totalReturn: 12.56,
            sharpeRatio: 1.89,
            sortinoRatio: 2.45,
            maxDrawdown: -6.2,
            winRate: 64.10,
            profitFactor: 2.34,
            totalTrades: 39,
            winningTrades: 25,
            losingTrades: 14,
            avgWin: 723.89,
            avgLoss: -421.56,
            totalCommissions: 195.0,
            totalSlippage: 78.0,
            configuration: {
                strategy: 'BULLISH_CALL_SPREAD',
                parameters: {
                    spreadWidth: 10,
                    minIVRank: 30,
                    maxDaysToExpiration: 45,
                    targetDelta: 0.40,
                    positionSize: 0.06,
                    maxPositions: 12,
                    stopLoss: 0.45,
                    profitTarget: 0.75,
                    trendFilter: 'bullish'
                },
                assets: ['NVDA', 'MSFT', 'GOOGL', 'AAPL', 'AMD', 'AVGO'],
                timeframe: 'daily',
                slippage: 0.02,
                commission: 5.0
            },
            status: 'completed',
            errorMessage: null,
            createdAt: new Date('2024-03-15').toISOString(),
            completedAt: tenDaysAgo.toISOString(),
        },
        {
            name: 'Iron Condor Vol Harvesting',
            strategyId: 2,
            modelId: 2,
            userId: userId,
            startDate: new Date('2024-03-01').toISOString(),
            endDate: new Date('2024-06-30').toISOString(),
            initialCapital: 100000.0,
            finalCapital: null,
            totalReturn: null,
            sharpeRatio: null,
            sortinoRatio: null,
            maxDrawdown: null,
            winRate: null,
            profitFactor: null,
            totalTrades: null,
            winningTrades: null,
            losingTrades: null,
            avgWin: null,
            avgLoss: null,
            totalCommissions: null,
            totalSlippage: null,
            configuration: {
                strategy: 'IRON_CONDOR',
                parameters: {
                    wingWidth: 10,
                    minIVRank: 50,
                    maxDaysToExpiration: 45,
                    targetDelta: 0.16,
                    positionSize: 0.04,
                    maxPositions: 15,
                    stopLoss: 0.50,
                    profitTarget: 0.50,
                    managementRule: 'dynamic'
                },
                assets: ['SPY', 'QQQ', 'IWM', 'TLT', 'GLD'],
                timeframe: 'daily',
                slippage: 0.02,
                commission: 5.0
            },
            status: 'running',
            errorMessage: null,
            createdAt: fifteenDaysAgo.toISOString(),
            completedAt: null,
        },
    ];

    await db.insert(backtests).values(sampleBacktests);
    
    console.log('✅ Backtests seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
