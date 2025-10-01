const sdk = require('node-appwrite');

const client = new sdk.Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('68db5335002a5780ae9a')
    .setKey('standard_9e65d8e1af77654ab87f7ac216829f31d5e889a920feac3087a3e4ff066fb2769a5e27848127de9308ee707b692887580ef701fa64df49f0cc96054fef8e73d67ff5b9d338bb972fd4f03f0598e7a3f632e9461f2ba80c3ea0fe67a7011a49b5f8c624476564d507b16d74a57cccb2c27b3707f3d9e578699e1d0c0bff836fc9');

const databases = new sdk.Databases(client);

async function cleanupTypingIndicators() {
    try {
        console.log('🧹 Cleaning up typing indicators from database...\n');
        
        const DATABASE_ID = 'ucera_main_db';
        const COLLECTION_ID = 'messages';
        
        // Get all typing indicators
        const typingIndicators = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [
                sdk.Query.equal('message_type', 'typing'),
                sdk.Query.limit(1000)
            ]
        );
        
        console.log(`📊 Found ${typingIndicators.documents.length} typing indicators`);
        
        if (typingIndicators.documents.length === 0) {
            console.log('✅ No typing indicators to clean up!');
            return;
        }
        
        // Delete in batches
        let deleted = 0;
        for (const doc of typingIndicators.documents) {
            try {
                await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, doc.$id);
                deleted++;
                process.stdout.write(`\r🗑️  Deleted: ${deleted}/${typingIndicators.documents.length}`);
            } catch (error) {
                console.error(`\n❌ Failed to delete ${doc.$id}:`, error.message);
            }
        }
        
        console.log(`\n\n✅ Cleanup complete! Deleted ${deleted} typing indicators`);
        console.log('💡 Your messages should now load properly on page reload!');
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
        throw error;
    }
}

cleanupTypingIndicators()
    .then(() => {
        console.log('\n🎉 All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Error:', error);
        process.exit(1);
    });

