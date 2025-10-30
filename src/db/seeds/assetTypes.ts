import { db } from '@/db';
import { assetTypes } from '@/db/schema';

async function main() {
    const now = new Date().toISOString();
    const sampleAssetTypes = [
        { name: 'Stock', description: 'Common stocks and equities', createdAt: now, updatedAt: now },
        { name: 'ETF', description: 'Exchange traded funds', createdAt: now, updatedAt: now },
        { name: 'Index', description: 'Market indices', createdAt: now, updatedAt: now },
        { name: 'Option', description: 'Options contracts', createdAt: now, updatedAt: now },
    ];

    await db.insert(assetTypes).values(sampleAssetTypes);
    
    console.log('✅ Asset types seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
