import { db } from '@/db';
import { marketSignals } from '@/db/schema';

async function main() {
    const now = new Date();
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const sampleMarketSignals = [
        {
            assetId: 14,
            signalType: 'entry',
            strategyType: 'iv_crush',
            confidenceScore: 0.85,
            recommendedAction: 'Sell iron condor with 30-day expiration',
            ivPremium: 0.55,
            skew: -0.08,
            termStructure: JSON.stringify({
                '7d': 0.52,
                '14d': 0.54,
                '30d': 0.55,
                '60d': 0.48,
                '90d': 0.45
            }),
            liquidityScore: 0.90,
            riskRewardRatio: 3.2,
            isExecuted: false,
            validUntil: fiveDaysFromNow.toISOString(),
            createdAt: now.toISOString(),
        },
        {
            assetId: 1,
            signalType: 'hedge',
            strategyType: 'calendar',
            confidenceScore: 0.72,
            recommendedAction: 'Buy protective puts to hedge downside',
            ivPremium: 0.18,
            skew: -0.05,
            termStructure: JSON.stringify({
                '7d': 0.16,
                '14d': 0.17,
                '30d': 0.18,
                '60d': 0.19,
                '90d': 0.20
            }),
            liquidityScore: 0.95,
            riskRewardRatio: 2.5,
            isExecuted: false,
            validUntil: threeDaysFromNow.toISOString(),
            createdAt: now.toISOString(),
        },
        {
            assetId: 10,
            signalType: 'entry',
            strategyType: 'straddle',
            confidenceScore: 0.65,
            recommendedAction: 'Long straddle before earnings',
            ivPremium: 0.22,
            skew: -0.03,
            termStructure: JSON.stringify({
                '7d': 0.28,
                '14d': 0.25,
                '30d': 0.22,
                '60d': 0.20,
                '90d': 0.19
            }),
            liquidityScore: 0.92,
            riskRewardRatio: 2.8,
            isExecuted: true,
            validUntil: oneDayFromNow.toISOString(),
            createdAt: now.toISOString(),
        },
        {
            assetId: 2,
            signalType: 'exit',
            strategyType: 'calendar',
            confidenceScore: 0.58,
            recommendedAction: 'Close calendar spread - theta decay optimal',
            ivPremium: 0.20,
            skew: -0.04,
            termStructure: JSON.stringify({
                '7d': 0.19,
                '14d': 0.19,
                '30d': 0.20,
                '60d': 0.21,
                '90d': 0.22
            }),
            liquidityScore: 0.93,
            riskRewardRatio: 1.8,
            isExecuted: false,
            validUntil: sevenDaysFromNow.toISOString(),
            createdAt: now.toISOString(),
        },
        {
            assetId: 15,
            signalType: 'entry',
            strategyType: 'iv_crush',
            confidenceScore: 0.91,
            recommendedAction: 'Sell strangles - IV rank extremely high',
            ivPremium: 0.62,
            skew: -0.10,
            termStructure: JSON.stringify({
                '7d': 0.68,
                '14d': 0.65,
                '30d': 0.62,
                '60d': 0.55,
                '90d': 0.50
            }),
            liquidityScore: 0.88,
            riskRewardRatio: 4.1,
            isExecuted: false,
            validUntil: twoDaysFromNow.toISOString(),
            createdAt: now.toISOString(),
        },
    ];

    await db.insert(marketSignals).values(sampleMarketSignals);
    
    console.log('✅ Market signals seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});