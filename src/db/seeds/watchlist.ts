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
            notes: 'Watching for Q1 earnings report. Strong fundamentals and potential for IV expansion before announcement. Consider covered calls or cash-secured puts.',
            aiRecommended: false,
        },
        {
            userId: userId,
            assetId: assetMap.get('TSLA')!,
            addedAt: getDaysAgo(11),
            notes: 'High volatility creates premium opportunities. Perfect for iron condors and strangles. Monitor production numbers and delivery reports closely.',
            aiRecommended: false,
        },
        {
            userId: userId,
            assetId: assetMap.get('NVDA')!,
            addedAt: getDaysAgo(9),
            notes: 'AI sector leader with strong momentum. Data center demand driving growth. Recommended for bullish vertical spreads and long call positions.',
            aiRecommended: true,
        },
        {
            userId: userId,
            assetId: assetMap.get('SPY')!,
            addedAt: getDaysAgo(7),
            notes: 'Using for portfolio hedging and market-neutral strategies. Ideal for broad market exposure and protective puts during uncertain conditions.',
            aiRecommended: false,
        },
        {
            userId: userId,
            assetId: assetMap.get('QQQ')!,
            addedAt: getDaysAgo(5),
            notes: 'Tech sector concentration play. Strong performance trend. Consider ratio spreads and calendar strategies to capitalize on tech momentum.',
            aiRecommended: true,
        },
        {
            userId: userId,
            assetId: assetMap.get('MSFT')!,
            addedAt: getDaysAgo(4),
            notes: 'Stable blue-chip with consistent growth. Lower volatility makes it suitable for wheel strategy and conservative credit spreads. Azure growth story intact.',
            aiRecommended: false,
        },
        {
            userId: userId,
            assetId: assetMap.get('META')!,
            addedAt: getDaysAgo(2),
            notes: 'High implied volatility after earnings. Perfect for IV crush plays. Look for post-earnings short straddles and iron condors with tight strikes.',
            aiRecommended: true,
        },
        {
            userId: userId,
            assetId: assetMap.get('GOOGL')!,
            addedAt: getDaysAgo(1),
            notes: 'Excellent candidate for calendar spread setups. Moderate IV and liquid options market. Consider monthly vs weekly calendar spreads around key support levels.',
            aiRecommended: false,
        },
    ];

    await db.insert(watchlist).values(sampleWatchlist);
    
    console.log('✅ Watchlist seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});