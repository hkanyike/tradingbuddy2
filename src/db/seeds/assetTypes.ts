import { db } from '@/db';
import { assetTypes } from '@/db/schema';

async function main() {
    const sampleAssetTypes = [
        {
            typeName: 'Stock',
            description: 'Common stocks and equities',
            createdAt: new Date().toISOString(),
        },
        {
            typeName: 'ETF',
            description: 'Exchange traded funds',
            createdAt: new Date().toISOString(),
        },
        {
            typeName: 'Index',
            description: 'Market indices',
            createdAt: new Date().toISOString(),
        },
        {
            typeName: 'Option',
            description: 'Options contracts',
            createdAt: new Date().toISOString(),
        }
    ];

    await db.insert(assetTypes).values(sampleAssetTypes);
    
    console.log('✅ Asset types seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});