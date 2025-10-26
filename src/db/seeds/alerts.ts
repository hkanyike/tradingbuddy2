import { db } from '@/db';
import { alerts, user } from '@/db/schema';

async function main() {
    // First, query the actual user ID from the auth user table
    const users = await db.select({ id: user.id }).from(user).limit(1);
    
    if (!users.length) {
        console.error('❌ No users found in database. Please seed users first.');
        return;
    }
    
    const userId = users[0].id;
    console.log(`📝 Using userId: ${userId}`);
    
    const sampleAlerts = [
        {
            userId: userId,
            positionId: 3,
            alertType: 'stop_loss',
            title: 'Stop Loss Triggered',
            message: 'Your stop loss was triggered on SPY $450 Put position. Position closed at $447.50 to limit further losses. Total loss: -$275 (-5.5%).',
            severity: 'critical',
            isRead: false,
            isDismissed: false,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
            userId: userId,
            positionId: 7,
            alertType: 'take_profit',
            title: 'Take Profit Target Reached',
            message: 'Congratulations! Your AAPL $180 Call position hit take profit target. Position closed at $182.75 with realized gain of +$425 (+8.5%).',
            severity: 'info',
            isRead: true,
            isDismissed: false,
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            userId: userId,
            positionId: null,
            alertType: 'risk_limit',
            title: 'Portfolio Heat Warning',
            message: 'Your portfolio heat has reached 82% of your risk limit. Current total exposure: $41,000 of $50,000 max. Consider reducing position sizes or closing losing positions.',
            severity: 'warning',
            isRead: false,
            isDismissed: false,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            userId: userId,
            positionId: null,
            alertType: 'setup',
            title: 'New IV Opportunity Detected',
            message: 'High IV rank detected on TSLA (78th percentile). Options premiums elevated. Consider iron condor setup with 45 DTE expiration. Expected IV contraction could yield 12-15% return.',
            severity: 'info',
            isRead: false,
            isDismissed: false,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            userId: userId,
            positionId: null,
            alertType: 'news',
            title: 'FOMC Meeting Today - Volatility Expected',
            message: 'Federal Reserve announces interest rate decision today at 2:00 PM ET. Historical data shows 25% average increase in SPX volatility around FOMC meetings. Review your delta exposure and consider hedging strategies.',
            severity: 'warning',
            isRead: true,
            isDismissed: true,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ];

    await db.insert(alerts).values(sampleAlerts);
    
    console.log('✅ Alerts seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});