import { db } from '@/db';
import { assets } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    // Query existing assets to avoid duplicates
    const existingAssets = await db.select({ symbol: assets.symbol }).from(assets);
    const existingSymbols = new Set(existingAssets.map(a => a.symbol));
    
    // Define all assets with exact specifications
    const allAssets = [
        // Tech Giants (assetTypeId: 1)
        { symbol: 'AAPL', name: 'Apple Inc.', assetTypeId: 1, sector: 'Technology', liquidityRank: 11, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'MSFT', name: 'Microsoft Corporation', assetTypeId: 1, sector: 'Technology', liquidityRank: 12, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', assetTypeId: 1, sector: 'Technology', liquidityRank: 15, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', assetTypeId: 1, sector: 'Consumer Cyclical', liquidityRank: 17, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'META', name: 'Meta Platforms Inc.', assetTypeId: 1, sector: 'Technology', liquidityRank: 18, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', assetTypeId: 1, sector: 'Technology', liquidityRank: 13, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'TSLA', name: 'Tesla Inc.', assetTypeId: 1, sector: 'Automotive', liquidityRank: 19, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'NFLX', name: 'Netflix Inc.', assetTypeId: 1, sector: 'Communication Services', liquidityRank: 34, isActive: true, createdAt: new Date().toISOString() },
        
        // High-Volume Meme/Growth Stocks (assetTypeId: 1)
        { symbol: 'PLTR', name: 'Palantir Technologies Inc.', assetTypeId: 1, sector: 'Technology', liquidityRank: 45, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', assetTypeId: 1, sector: 'Technology', liquidityRank: 14, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'INTC', name: 'Intel Corporation', assetTypeId: 1, sector: 'Technology', liquidityRank: 36, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'BABA', name: 'Alibaba Group Holding Ltd', assetTypeId: 1, sector: 'Technology', liquidityRank: 48, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'NIO', name: 'NIO Inc.', assetTypeId: 1, sector: 'Automotive', liquidityRank: 65, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'RIVN', name: 'Rivian Automotive Inc.', assetTypeId: 1, sector: 'Automotive', liquidityRank: 72, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'LCID', name: 'Lucid Group Inc.', assetTypeId: 1, sector: 'Automotive', liquidityRank: 85, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'SOFI', name: 'SoFi Technologies Inc.', assetTypeId: 1, sector: 'Financial Services', liquidityRank: 78, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'HOOD', name: 'Robinhood Markets Inc.', assetTypeId: 1, sector: 'Financial Services', liquidityRank: 82, isActive: true, createdAt: new Date().toISOString() },
        
        // Finance Stocks (assetTypeId: 1)
        { symbol: 'JPM', name: 'JPMorgan Chase & Co.', assetTypeId: 1, sector: 'Financial Services', liquidityRank: 21, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'BAC', name: 'Bank of America Corp.', assetTypeId: 1, sector: 'Financial Services', liquidityRank: 28, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'GS', name: 'Goldman Sachs Group Inc.', assetTypeId: 1, sector: 'Financial Services', liquidityRank: 42, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'WFC', name: 'Wells Fargo & Company', assetTypeId: 1, sector: 'Financial Services', liquidityRank: 38, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'MS', name: 'Morgan Stanley', assetTypeId: 1, sector: 'Financial Services', liquidityRank: 46, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'C', name: 'Citigroup Inc.', assetTypeId: 1, sector: 'Financial Services', liquidityRank: 44, isActive: true, createdAt: new Date().toISOString() },
        
        // Other High-Volume Stocks (assetTypeId: 1)
        { symbol: 'DIS', name: 'The Walt Disney Company', assetTypeId: 1, sector: 'Communication Services', liquidityRank: 35, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'BA', name: 'The Boeing Company', assetTypeId: 1, sector: 'Industrials', liquidityRank: 52, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'UBER', name: 'Uber Technologies Inc.', assetTypeId: 1, sector: 'Technology', liquidityRank: 58, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'LYFT', name: 'Lyft Inc.', assetTypeId: 1, sector: 'Technology', liquidityRank: 95, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'SNAP', name: 'Snap Inc.', assetTypeId: 1, sector: 'Technology', liquidityRank: 88, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'TWTR', name: 'Twitter/X Corp.', assetTypeId: 1, sector: 'Technology', liquidityRank: 120, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'SQ', name: 'Block Inc.', assetTypeId: 1, sector: 'Financial Services', liquidityRank: 68, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'PYPL', name: 'PayPal Holdings Inc.', assetTypeId: 1, sector: 'Financial Services', liquidityRank: 62, isActive: true, createdAt: new Date().toISOString() },
        
        // Major ETFs (assetTypeId: 2)
        { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', assetTypeId: 2, sector: 'Market Index', liquidityRank: 5, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'QQQ', name: 'Invesco QQQ Trust', assetTypeId: 2, sector: 'Technology', liquidityRank: 6, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF', assetTypeId: 2, sector: 'Market Index', liquidityRank: 8, isActive: true, createdAt: new Date().toISOString() },
        { symbol: 'IWM', name: 'iShares Russell 2000 ETF', assetTypeId: 2, sector: 'Small Cap', liquidityRank: 7, isActive: true, createdAt: new Date().toISOString() },
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