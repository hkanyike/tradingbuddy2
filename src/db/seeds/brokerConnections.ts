import { db } from '@/db';
import { brokerConnections, user } from '@/db/schema';

async function main() {
    // Query the user table to get the actual userId
    const users = await db.select().from(user).limit(1);
    
    if (users.length === 0) {
        console.error('❌ No users found in the database. Please seed users first.');
        return;
    }
    
    const actualUserId = users[0].id;
    const currentTimestamp = new Date().toISOString();
    
    const sampleBrokerConnection = {
        userId: actualUserId,
        brokerName: 'Tradier',
        apiKeyEncrypted: 'enc_tradier_demo_key_12345',
        isPaperTrading: true,
        isConnected: true,
        lastConnectedAt: currentTimestamp,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
    };

    await db.insert(brokerConnections).values(sampleBrokerConnection);
    
    console.log('✅ Broker connections seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
