import { db } from '@/db';
import { marketSignals } from '@/db/schema';

async function main() {
    const now = new Date();
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const sampleMarketSignals = [
        {
            symbol: 'SPY',
            signalType: 'buy',
            strength: 0.85,
            confidence: 0.90,
            reasoning: 'High IV rank detected (85th percentile). Options premiums elevated. Earnings in 3 days - expect IV contraction post-earnings.',
            source: 'ai',
            createdAt: now.toISOString(),
            expiresAt: fiveDaysFromNow.toISOString(),
        },
        {
            symbol: 'AAPL',
            signalType: 'sell',
            strength: 0.72,
            confidence: 0.85,
            reasoning: 'Market showing weakness. Consider protective puts or reducing delta exposure.',
            source: 'technical',
            createdAt: now.toISOString(),
            expiresAt: threeDaysFromNow.toISOString(),
        },
        {
            symbol: 'MSFT',
            signalType: 'hold',
            strength: 0.65,
            confidence: 0.75,
            reasoning: 'IV rank at 68th percentile. Calendar spread opportunity with front-month elevated IV.',
            source: 'fundamental',
            createdAt: now.toISOString(),
            expiresAt: fiveDaysFromNow.toISOString(),
        },
        {
            symbol: 'TSLA',
            signalType: 'buy',
            strength: 0.80,
            confidence: 0.88,
            reasoning: 'Strong upward momentum with high volume surge. RSI showing bullish divergence.',
            source: 'ai',
            createdAt: now.toISOString(),
            expiresAt: threeDaysFromNow.toISOString(),
        },
        {
            symbol: 'NVDA',
            signalType: 'sell',
            strength: 0.78,
            confidence: 0.82,
            reasoning: 'Overbought conditions detected. Take profits on existing positions.',
            source: 'technical',
            createdAt: now.toISOString(),
            expiresAt: fiveDaysFromNow.toISOString(),
        },
    ];

    await db.insert(marketSignals).values(sampleMarketSignals);
    
    console.log('✅ Market signals seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
