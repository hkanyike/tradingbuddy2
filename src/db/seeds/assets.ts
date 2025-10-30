import { db } from '@/db';
import { assets } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    // Query existing assets to avoid duplicates
    const existingAssets = await db.select({ symbol: assets.symbol }).from(assets);
    const existingSymbols = new Set(existingAssets.map(a => a.symbol));
    
    // Define all assets with exact specifications
    const now = new Date().toISOString();
    const allAssets = [
        // Tech Giants (assetTypeId: 1)
        { symbol: 'AAPL', name: 'Apple Inc.', assetTypeId: 1, sector: 'Technology', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'MSFT', name: 'Microsoft Corporation', assetTypeId: 1, sector: 'Technology', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', assetTypeId: 1, sector: 'Technology', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', assetTypeId: 1, sector: 'Consumer Cyclical', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'META', name: 'Meta Platforms Inc.', assetTypeId: 1, sector: 'Technology', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', assetTypeId: 1, sector: 'Technology', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'TSLA', name: 'Tesla Inc.', assetTypeId: 1, sector: 'Automotive', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'NFLX', name: 'Netflix Inc.', assetTypeId: 1, sector: 'Communication Services', isActive: true, createdAt: now, updatedAt: now },
        
        // High-Volume Meme/Growth Stocks (assetTypeId: 1)
        { symbol: 'PLTR', name: 'Palantir Technologies Inc.', assetTypeId: 1, sector: 'Technology', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', assetTypeId: 1, sector: 'Technology', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'INTC', name: 'Intel Corporation', assetTypeId: 1, sector: 'Technology', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'BABA', name: 'Alibaba Group Holding Ltd', assetTypeId: 1, sector: 'Technology', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'NIO', name: 'NIO Inc.', assetTypeId: 1, sector: 'Automotive', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'RIVN', name: 'Rivian Automotive Inc.', assetTypeId: 1, sector: 'Automotive', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'LCID', name: 'Lucid Group Inc.', assetTypeId: 1, sector: 'Automotive', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'SOFI', name: 'SoFi Technologies Inc.', assetTypeId: 1, sector: 'Financial Services', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'HOOD', name: 'Robinhood Markets Inc.', assetTypeId: 1, sector: 'Financial Services', isActive: true, createdAt: now, updatedAt: now },
        
        // Finance Stocks (assetTypeId: 1)
        { symbol: 'JPM', name: 'JPMorgan Chase & Co.', assetTypeId: 1, sector: 'Financial Services', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'BAC', name: 'Bank of America Corp.', assetTypeId: 1, sector: 'Financial Services', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'GS', name: 'Goldman Sachs Group Inc.', assetTypeId: 1, sector: 'Financial Services', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'WFC', name: 'Wells Fargo & Company', assetTypeId: 1, sector: 'Financial Services', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'MS', name: 'Morgan Stanley', assetTypeId: 1, sector: 'Financial Services', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'C', name: 'Citigroup Inc.', assetTypeId: 1, sector: 'Financial Services', isActive: true, createdAt: now, updatedAt: now },
        
        // Other High-Volume Stocks (assetTypeId: 1)
        { symbol: 'DIS', name: 'The Walt Disney Company', assetTypeId: 1, sector: 'Communication Services', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'BA', name: 'The Boeing Company', assetTypeId: 1, sector: 'Industrials', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'UBER', name: 'Uber Technologies Inc.', assetTypeId: 1, sector: 'Technology', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'LYFT', name: 'Lyft Inc.', assetTypeId: 1, sector: 'Technology', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'SNAP', name: 'Snap Inc.', assetTypeId: 1, sector: 'Technology', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'TWTR', name: 'Twitter/X Corp.', assetTypeId: 1, sector: 'Technology', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'SQ', name: 'Block Inc.', assetTypeId: 1, sector: 'Financial Services', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'PYPL', name: 'PayPal Holdings Inc.', assetTypeId: 1, sector: 'Financial Services', isActive: true, createdAt: now, updatedAt: now },
        
        // Major ETFs (assetTypeId: 2)
        { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', assetTypeId: 2, sector: 'Market Index', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'QQQ', name: 'Invesco QQQ Trust', assetTypeId: 2, sector: 'Technology', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF', assetTypeId: 2, sector: 'Market Index', isActive: true, createdAt: now, updatedAt: now },
        { symbol: 'IWM', name: 'iShares Russell 2000 ETF', assetTypeId: 2, sector: 'Small Cap', isActive: true, createdAt: now, updatedAt: now },
    ];
    
    // Filter out assets that already exist
    const newAssets = allAssets.filter(asset => !existingSymbols.has(asset.symbol));
    
    // Insert only new assets
    if (newAssets.length > 0) {
        await db.insert(assets).values(newAssets);
        console.log(`✅ Successfully added ${newAssets.length} new assets`);
        console.log(`📊 Skipped ${allAssets.length - newAssets.length} existing assets`);
        
        // Log which assets were added
        const addedSymbols = newAssets.map(a => a.symbol).join(', ');
        console.log(`📝 Added assets: ${addedSymbols}`);
    } else {
        console.log('✅ All assets already exist in database - no new assets added');
    }
    
    console.log(`📈 Total assets in definition: ${allAssets.length}`);
    console.log(`💾 Total assets in database: ${existingSymbols.size + newAssets.length}`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
