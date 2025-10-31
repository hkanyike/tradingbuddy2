import { db } from '@/db';
import { watchlistRecommendations, user, assets } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    // Get user
    const users = await db.select({ id: user.id }).from(user).limit(1);
    
    if (users.length === 0) {
        console.error('❌ No users found in database. Please seed users first.');
        return;
    }
    
    const userId = users[0].id;

    // Get assets
    const symbols = ['AAPL', 'NVDA', 'TSLA'];
    const assetMap = new Map<string, number>();
    
    for (const symbol of symbols) {
        const asset = await db.select({ id: assets.id }).from(assets).where(eq(assets.symbol, symbol)).limit(1);
        if (asset.length > 0) {
            assetMap.set(symbol, asset[0].id);
        } else {
            console.error(`❌ Asset ${symbol} not found. Please seed assets first.`);
            return;
        }
    }

    const nowISO = new Date().toISOString();

    const sampleRecommendations = [
        {
            userId: userId,
            assetId: assetMap.get('AAPL')!,
            recommendationType: 'ai',
            confidenceScore: 0.85,
            reasoning: 'High IV rank detected. Good opportunity for premium selling strategies.',
            isDismissed: false,
            createdAt: nowISO,
            updatedAt: nowISO,
        },
        {
            userId: userId,
            assetId: assetMap.get('NVDA')!,
            recommendationType: 'technical',
            confidenceScore: 0.78,
            reasoning: 'Strong technical indicators showing upward momentum. Consider bullish spreads.',
            isDismissed: false,
            createdAt: nowISO,
            updatedAt: nowISO,
        },
        {
            userId: userId,
            assetId: assetMap.get('TSLA')!,
            recommendationType: 'fundamental',
            confidenceScore: 0.72,
            reasoning: 'Earnings approaching. High volatility environment suitable for neutral strategies.',
            isDismissed: false,
            createdAt: nowISO,
            updatedAt: nowISO,
        },
    ];

    await db.insert(watchlistRecommendations).values(sampleRecommendations);
    
    console.log('✅ Watchlist recommendations seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
