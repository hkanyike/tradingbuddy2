import { db } from '@/db';
import { watchlistRecommendations, user, assets } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    // Query the actual user ID from the user table
    const users = await db.select({ id: user.id }).from(user).limit(1);
    
    if (users.length === 0) {
        console.error('❌ No users found in database. Please seed users first.');
        return;
    }
    
    const userId = users[0].id;
    console.log(`Using userId: ${userId}`);

    // Query actual asset IDs
    const assetMappings = await db
        .select({ id: assets.id, symbol: assets.symbol })
        .from(assets)
        .where(eq(assets.symbol, 'AAPL'))
        .union(db.select({ id: assets.id, symbol: assets.symbol }).from(assets).where(eq(assets.symbol, 'TSLA')))
        .union(db.select({ id: assets.id, symbol: assets.symbol }).from(assets).where(eq(assets.symbol, 'NVDA')))
        .union(db.select({ id: assets.id, symbol: assets.symbol }).from(assets).where(eq(assets.symbol, 'SPY')))
        .union(db.select({ id: assets.id, symbol: assets.symbol }).from(assets).where(eq(assets.symbol, 'QQQ')))
        .union(db.select({ id: assets.id, symbol: assets.symbol }).from(assets).where(eq(assets.symbol, 'META')))
        .union(db.select({ id: assets.id, symbol: assets.symbol }).from(assets).where(eq(assets.symbol, 'MSFT')));

    const assetMap: Record<string, number> = {};
    assetMappings.forEach(asset => {
        assetMap[asset.symbol] = asset.id;
    });

    console.log('Asset mappings:', assetMap);

    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - (6 * 60 * 60 * 1000));

    const sampleRecommendations = [
        {
            userId: userId,
            assetId: assetMap['AAPL'] || 8,
            strategyId: 1,
            tradeAction: 'buy_call',
            strikePrice: 185.0,
            entryPrice: 4.50,
            expirationDate: new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000)).toISOString(),
            potentialGain: 550.0,
            potentialGainPercentage: 122.0,
            potentialLoss: -450.0,
            potentialLossPercentage: -100.0,
            riskRewardRatio: 1.2,
            confidenceScore: 0.82,
            recommendationReason: 'AAPL showing bullish momentum with strong support at $180. ATM call option offers favorable risk/reward before product announcement. IV at 23%, below historical average of 28%, suggesting underpriced options. Target profit at $190 resistance level.',
            dismissed: 0,
            createdAt: new Date(sixHoursAgo.getTime() + (0 * 60 * 60 * 1000)).toISOString(),
        },
        {
            userId: userId,
            assetId: assetMap['TSLA'] || 12,
            strategyId: 2,
            tradeAction: 'short_straddle',
            strikePrice: 245.0,
            entryPrice: 18.75,
            expirationDate: new Date(now.getTime() + (21 * 24 * 60 * 60 * 1000)).toISOString(),
            potentialGain: 1875.0,
            potentialGainPercentage: 100.0,
            potentialLoss: -2000.0,
            potentialLossPercentage: -106.0,
            riskRewardRatio: 0.9,
            confidenceScore: 0.78,
            recommendationReason: 'TSLA trading in tight range $240-$250 for 2 weeks with declining volatility. IV rank at 68% provides premium opportunity. Short ATM straddle benefits from theta decay and IV crush. Earnings not for 45 days. Manage if price breaks $235 or $255.',
            dismissed: 0,
            createdAt: new Date(sixHoursAgo.getTime() + (1 * 60 * 60 * 1000)).toISOString(),
        },
        {
            userId: userId,
            assetId: assetMap['NVDA'] || 13,
            strategyId: 3,
            tradeAction: 'long_strangle',
            strikePrice: 880.0,
            entryPrice: 32.50,
            expirationDate: new Date(now.getTime() + (28 * 24 * 60 * 60 * 1000)).toISOString(),
            potentialGain: 1250.0,
            potentialGainPercentage: 38.0,
            potentialLoss: -3250.0,
            potentialLossPercentage: -100.0,
            riskRewardRatio: 0.4,
            confidenceScore: 0.85,
            recommendationReason: 'NVDA approaching AI summit with potential major announcements. Historical data shows 15% average move post-events. IV percentile at 42% offers reasonable entry. Long strangle (820P/880C) profits from large move either direction. Break-even at $787.50 down or $912.50 up.',
            dismissed: 0,
            createdAt: new Date(sixHoursAgo.getTime() + (2 * 60 * 60 * 1000)).toISOString(),
        },
        {
            userId: userId,
            assetId: assetMap['SPY'] || 1,
            strategyId: 2,
            tradeAction: 'iron_condor',
            strikePrice: 510.0,
            entryPrice: 2.25,
            expirationDate: new Date(now.getTime() + (21 * 24 * 60 * 60 * 1000)).toISOString(),
            potentialGain: 225.0,
            potentialGainPercentage: 28.0,
            potentialLoss: -775.0,
            potentialLossPercentage: -97.0,
            riskRewardRatio: 3.4,
            confidenceScore: 0.89,
            recommendationReason: 'SPY consolidating in $505-$515 range with low volatility regime (VIX at 14). Iron condor 500/505/515/520 captures $2.25 credit with 78% probability of profit. Fed blackout period reduces headline risk. Exit at 50% max profit or manage at 21 delta breach.',
            dismissed: 0,
            createdAt: new Date(sixHoursAgo.getTime() + (3 * 60 * 60 * 1000)).toISOString(),
        },
        {
            userId: userId,
            assetId: assetMap['QQQ'] || 2,
            strategyId: 1,
            tradeAction: 'sell_put',
            strikePrice: 435.0,
            entryPrice: 3.85,
            expirationDate: new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000)).toISOString(),
            potentialGain: 385.0,
            potentialGainPercentage: 100.0,
            potentialLoss: -1265.0,
            potentialLossPercentage: -329.0,
            riskRewardRatio: 3.3,
            confidenceScore: 0.91,
            recommendationReason: 'QQQ strong uptrend with support at $440. Selling 435 put (5 points OTM) collects $3.85 premium with 85% probability of profit. Tech sector momentum strong. If assigned, cost basis $431.15 is attractive for long-term hold. Delta -0.15, 29% IV rank provides decent premium.',
            dismissed: 0,
            createdAt: new Date(sixHoursAgo.getTime() + (4 * 60 * 60 * 1000)).toISOString(),
        },
        {
            userId: userId,
            assetId: assetMap['META'] || 14,
            strategyId: 1,
            tradeAction: 'buy_call',
            strikePrice: 495.0,
            entryPrice: 8.25,
            expirationDate: new Date(now.getTime() + (21 * 24 * 60 * 60 * 1000)).toISOString(),
            potentialGain: 925.0,
            potentialGainPercentage: 112.0,
            potentialLoss: -825.0,
            potentialLossPercentage: -100.0,
            riskRewardRatio: 1.1,
            confidenceScore: 0.87,
            recommendationReason: 'META breaking out from consolidation pattern with volume confirmation. Recent AI product launches driving bullish sentiment. 495 call (ATM) priced at $8.25 with 45 delta offers leveraged upside exposure. Target $505-$510 zone. IV at 38% vs 52-week average of 44% suggests options still reasonably priced.',
            dismissed: 0,
            createdAt: new Date(sixHoursAgo.getTime() + (5 * 60 * 60 * 1000)).toISOString(),
        },
        {
            userId: userId,
            assetId: assetMap['MSFT'] || 9,
            strategyId: 2,
            tradeAction: 'iron_condor',
            strikePrice: 415.0,
            entryPrice: 1.95,
            expirationDate: new Date(now.getTime() + (28 * 24 * 60 * 60 * 1000)).toISOString(),
            potentialGain: 195.0,
            potentialGainPercentage: 24.0,
            potentialLoss: -805.0,
            potentialLossPercentage: -99.0,
            riskRewardRatio: 4.1,
            confidenceScore: 0.84,
            recommendationReason: 'MSFT trading sideways $410-$420 for 3 weeks. Low implied volatility (IV rank 31%) creates income opportunity. Iron condor 405/410/420/425 earns $1.95 credit with 76% success probability. Azure growth steady, no major catalysts for 30 days. Theta decay benefits position daily.',
            dismissed: 0,
            createdAt: new Date(sixHoursAgo.getTime() + (5.5 * 60 * 60 * 1000)).toISOString(),
        },
    ];

    await db.insert(watchlistRecommendations).values(sampleRecommendations);

    console.log('✅ Watchlist recommendations seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
