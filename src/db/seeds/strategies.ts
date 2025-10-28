import { db } from '@/db';
import { strategies, user } from '@/db/schema';

async function main() {
    // First, query the actual user ID from the user table
    const users = await db.select({ id: user.id }).from(user).limit(1);
    
    if (users.length === 0) {
        console.error('❌ No users found in database. Please seed users first.');
        return;
    }
    
    const userId = users[0].id;
    console.log(`✅ Found user ID: ${userId}`);
    
    const sampleStrategies = [
        {
            userId: userId,
            name: 'Earnings IV-Crush',
            strategyType: 'iv_crush',
            description: 'Exploits pre-earnings volatility expansion by selling premium before earnings announcements, capitalizing on implied volatility crush post-earnings.',
            isActive: true,
            config: JSON.stringify({
                minIVRank: 70,
                maxDTE: 7,
                positionSize: 5,
                underlyingMinPrice: 50,
                underlyingMaxPrice: 500,
                targetPremium: 0.25,
                maxLoss: 1000,
                exitStrategy: 'pre_earnings',
                entryTiming: '2_days_before',
                preferredStructure: 'iron_condor'
            }),
            createdAt: new Date('2024-01-10').toISOString(),
            updatedAt: new Date('2024-01-10').toISOString(),
        },
        {
            userId: userId,
            name: 'Calendar-Carry',
            strategyType: 'calendar',
            description: 'Time decay arbitrage strategy using calendar spreads to capture theta decay differential between near-term and longer-dated options.',
            isActive: true,
            config: JSON.stringify({
                shortLegDTE: 30,
                longLegDTE: 60,
                positionSize: 3,
                minIVRank: 40,
                atmDelta: 0.50,
                targetCredit: 1.50,
                maxLoss: 800,
                adjustmentThreshold: 5,
                rollStrategy: 'weekly',
                preferredUnderlying: 'high_liquidity'
            }),
            createdAt: new Date('2024-01-15').toISOString(),
            updatedAt: new Date('2024-01-15').toISOString(),
        },
        {
            userId: userId,
            name: 'Delta-Neutral Straddles',
            strategyType: 'straddle',
            description: 'Market-neutral volatility play using ATM straddles, dynamically adjusted to maintain delta neutrality while capturing gamma and vega exposure.',
            isActive: true,
            config: JSON.stringify({
                atmStrike: 'exact',
                dte: 45,
                positionSize: 2,
                minIVRank: 30,
                maxIVRank: 70,
                deltaThreshold: 0.05,
                rebalanceFrequency: 'daily',
                profitTarget: 0.20,
                stopLoss: 0.40,
                hedgingStrategy: 'dynamic',
                vegaTarget: 100
            }),
            createdAt: new Date('2024-01-20').toISOString(),
            updatedAt: new Date('2024-01-20').toISOString(),
        }
    ];

    await db.insert(strategies).values(sampleStrategies);
    
    console.log('✅ Strategies seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
