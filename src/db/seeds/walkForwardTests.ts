import { db } from '@/db';
import { walkForwardTests } from '@/db/schema';

async function main() {
    const sampleWalkForwardTests = [
        {
            name: 'IV Predictor Walk-Forward 180/30',
            modelId: 1,
            strategyId: 1,
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            trainWindowDays: 180,
            testWindowDays: 30,
            totalWindows: 6,
            completedWindows: 6,
            avgInSampleSharpe: 2.38,
            avgOutSampleSharpe: 2.12,
            degradationRatio: 0.891,
            totalReturn: 15.6,
            maxDrawdown: -7.2,
            resultsByWindow: JSON.stringify([
                {
                    window: 1,
                    train_start: '2023-01-01',
                    train_end: '2023-06-30',
                    test_start: '2023-07-01',
                    test_end: '2023-07-31',
                    in_sample_sharpe: 2.45,
                    out_sample_sharpe: 2.28,
                    test_return: 3.2,
                    test_drawdown: -1.2
                },
                {
                    window: 2,
                    train_start: '2023-02-01',
                    train_end: '2023-07-31',
                    test_start: '2023-08-01',
                    test_end: '2023-08-31',
                    in_sample_sharpe: 2.52,
                    out_sample_sharpe: 2.35,
                    test_return: 2.8,
                    test_drawdown: -1.8
                },
                {
                    window: 3,
                    train_start: '2023-03-01',
                    train_end: '2023-08-31',
                    test_start: '2023-09-01',
                    test_end: '2023-09-30',
                    in_sample_sharpe: 2.28,
                    out_sample_sharpe: 2.15,
                    test_return: 2.5,
                    test_drawdown: -2.1
                },
                {
                    window: 4,
                    train_start: '2023-04-01',
                    train_end: '2023-09-30',
                    test_start: '2023-10-01',
                    test_end: '2023-10-31',
                    in_sample_sharpe: 2.35,
                    out_sample_sharpe: 2.05,
                    test_return: 2.6,
                    test_drawdown: -2.3
                },
                {
                    window: 5,
                    train_start: '2023-05-01',
                    train_end: '2023-10-31',
                    test_start: '2023-11-01',
                    test_end: '2023-11-30',
                    in_sample_sharpe: 2.42,
                    out_sample_sharpe: 2.04,
                    test_return: 2.4,
                    test_drawdown: -2.5
                },
                {
                    window: 6,
                    train_start: '2023-06-01',
                    train_end: '2023-11-30',
                    test_start: '2023-12-01',
                    test_end: '2023-12-31',
                    in_sample_sharpe: 2.26,
                    out_sample_sharpe: 1.85,
                    test_return: 2.1,
                    test_drawdown: -2.8
                }
            ]),
            status: 'completed',
            createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
            completedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            name: 'Calendar Spread Walk-Forward 120/20',
            modelId: 2,
            strategyId: 2,
            userId: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            trainWindowDays: 120,
            testWindowDays: 20,
            totalWindows: 8,
            completedWindows: 8,
            avgInSampleSharpe: 2.85,
            avgOutSampleSharpe: 1.45,
            degradationRatio: 0.509,
            totalReturn: 6.8,
            maxDrawdown: -12.5,
            resultsByWindow: JSON.stringify([
                {
                    window: 1,
                    train_start: '2023-03-01',
                    train_end: '2023-06-30',
                    test_start: '2023-07-01',
                    test_end: '2023-07-21',
                    in_sample_sharpe: 3.05,
                    out_sample_sharpe: 2.18,
                    test_return: 2.4,
                    test_drawdown: -2.1
                },
                {
                    window: 2,
                    train_start: '2023-04-01',
                    train_end: '2023-07-31',
                    test_start: '2023-08-01',
                    test_end: '2023-08-21',
                    in_sample_sharpe: 2.92,
                    out_sample_sharpe: 1.95,
                    test_return: 1.8,
                    test_drawdown: -3.2
                },
                {
                    window: 3,
                    train_start: '2023-05-01',
                    train_end: '2023-08-31',
                    test_start: '2023-09-01',
                    test_end: '2023-09-21',
                    in_sample_sharpe: 2.88,
                    out_sample_sharpe: 1.72,
                    test_return: 1.5,
                    test_drawdown: -4.1
                },
                {
                    window: 4,
                    train_start: '2023-06-01',
                    train_end: '2023-09-30',
                    test_start: '2023-10-01',
                    test_end: '2023-10-21',
                    in_sample_sharpe: 2.95,
                    out_sample_sharpe: 1.52,
                    test_return: 1.2,
                    test_drawdown: -5.3
                },
                {
                    window: 5,
                    train_start: '2023-07-01',
                    train_end: '2023-10-31',
                    test_start: '2023-11-01',
                    test_end: '2023-11-21',
                    in_sample_sharpe: 2.78,
                    out_sample_sharpe: 1.38,
                    test_return: 0.8,
                    test_drawdown: -6.8
                },
                {
                    window: 6,
                    train_start: '2023-08-01',
                    train_end: '2023-11-30',
                    test_start: '2023-12-01',
                    test_end: '2023-12-21',
                    in_sample_sharpe: 2.82,
                    out_sample_sharpe: 1.25,
                    test_return: 0.5,
                    test_drawdown: -8.2
                },
                {
                    window: 7,
                    train_start: '2023-09-01',
                    train_end: '2023-12-31',
                    test_start: '2024-01-01',
                    test_end: '2024-01-21',
                    in_sample_sharpe: 2.75,
                    out_sample_sharpe: 1.05,
                    test_return: -0.2,
                    test_drawdown: -10.5
                },
                {
                    window: 8,
                    train_start: '2023-10-01',
                    train_end: '2024-01-31',
                    test_start: '2024-02-01',
                    test_end: '2024-02-21',
                    in_sample_sharpe: 2.65,
                    out_sample_sharpe: 0.85,
                    test_return: -0.8,
                    test_drawdown: -12.5
                }
            ]),
            status: 'completed',
            createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
            completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];

    await db.insert(walkForwardTests).values(sampleWalkForwardTests);
    
    console.log('✅ Walk-forward tests seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
