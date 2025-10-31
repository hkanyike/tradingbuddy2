import { db } from '@/db';
import { watchlist, user, assets } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    // First, get the actual user ID from the user table
    const users = await db.select({ id: user.id }).from(user).limit(1);
    
    if (users.length === 0) {
        throw new Error('No users found in the database. Please seed users first.');
    }
    
    const userId = users[0].id;
    console.log(`Using userId: ${userId}`);

    // Get asset IDs for the specified symbols
    const symbols = ['AAPL', 'TSLA', 'NVDA', 'SPY', 'QQQ', 'MSFT', 'META', 'GOOGL'];
    const assetMap = new Map<string, number>();
    
    for (const symbol of symbols) {
        const asset = await db.select({ id: assets.id }).from(assets).where(eq(assets.symbol, symbol)).limit(1);
        if (asset.length > 0) {
            assetMap.set(symbol, asset[0].id);
        } else {
            throw new Error(`Asset ${symbol} not found in database. Please seed assets first.`);
        }
    }

    // Calculate timestamps for the past 14 days
    const now = new Date();
    const getDaysAgo = (days: number): string => {
        const date = new Date(now);
        date.setDate(date.getDate() - days);
        return date.toISOString();
    };

    const sampleWatchlist = [
        {
            userId: userId,
            assetId: assetMap.get('AAPL')!,
            addedAt: getDaysAgo(13),
            createdAt: getDaysAgo(13),
        },
        {
            userId: userId,
            assetId: assetMap.get('TSLA')!,
            addedAt: getDaysAgo(11),
            createdAt: getDaysAgo(11),
        },
        {
            userId: userId,
            assetId: assetMap.get('NVDA')!,
            addedAt: getDaysAgo(9),
            createdAt: getDaysAgo(9),
        },
        {
            userId: userId,
            assetId: assetMap.get('SPY')!,
            addedAt: getDaysAgo(7),
            createdAt: getDaysAgo(7),
        },
        {
            userId: userId,
            assetId: assetMap.get('QQQ')!,
            addedAt: getDaysAgo(5),
            createdAt: getDaysAgo(5),
        },
        {
            userId: userId,
            assetId: assetMap.get('MSFT')!,
            addedAt: getDaysAgo(4),
            createdAt: getDaysAgo(4),
        },
        {
            userId: userId,
            assetId: assetMap.get('META')!,
            addedAt: getDaysAgo(2),
            createdAt: getDaysAgo(2),
        },
        {
            userId: userId,
            assetId: assetMap.get('GOOGL')!,
            addedAt: getDaysAgo(1),
            createdAt: getDaysAgo(1),
        },
    ];

    await db.insert(watchlist).values(sampleWatchlist);
    
    console.log('✅ Watchlist seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
