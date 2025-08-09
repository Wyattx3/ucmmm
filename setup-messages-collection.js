#!/usr/bin/env node

/**
 * Appwrite Messages Collection Setup Script
 * Production-ready collection creation for UC ERA messaging system
 */

import { Client, Databases, ID, Permission, Role } from 'appwrite';

// Environment configuration
const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '688813660017c877f06e')
    .setKey(process.env.APPWRITE_API_KEY); // Admin API key required

const databases = new Databases(client);
const DATABASE_ID = 'ucera-main';
const COLLECTION_ID = 'messages';

async function createMessagesCollection() {
    try {
        console.log('🚀 Creating messages collection...');
        
        // Create collection
        const collection = await databases.createCollection(
            DATABASE_ID,
            COLLECTION_ID,
            'Messages',
            [
                Permission.create(Role.any()),
                Permission.read(Role.any()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ]
        );
        
        console.log('✅ Collection created:', collection.name);
        
        // Create attributes
        const attributes = [
            // Chat ID - required for grouping messages
            {
                method: 'createStringAttribute',
                params: [DATABASE_ID, COLLECTION_ID, 'chatId', 255, true]
            },
            // Message sender type: 'me' | 'other'
            {
                method: 'createStringAttribute', 
                params: [DATABASE_ID, COLLECTION_ID, 'from', 50, true]
            },
            // Message text content
            {
                method: 'createStringAttribute',
                params: [DATABASE_ID, COLLECTION_ID, 'text', 5000, false]
            },
            // Message creation timestamp
            {
                method: 'createDatetimeAttribute',
                params: [DATABASE_ID, COLLECTION_ID, 'createdAt', true]
            },
            // Sender user ID for tracking
            {
                method: 'createStringAttribute',
                params: [DATABASE_ID, COLLECTION_ID, 'senderId', 255, false]
            },
            // Sender display name
            {
                method: 'createStringAttribute',
                params: [DATABASE_ID, COLLECTION_ID, 'senderName', 255, false]
            },
            // Sender avatar (base64 or URL)
            {
                method: 'createStringAttribute',
                params: [DATABASE_ID, COLLECTION_ID, 'senderAvatar', 500000, false]
            },
            // Image URL for media messages
            {
                method: 'createStringAttribute',
                params: [DATABASE_ID, COLLECTION_ID, 'imageUrl', 2000, false]
            }
        ];
        
        console.log('📝 Creating attributes...');
        
        for (const attr of attributes) {
            try {
                await databases[attr.method](...attr.params);
                console.log(`✅ Created ${attr.params[2]} attribute`);
                
                // Wait between requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.warn(`⚠️ Attribute ${attr.params[2]} might already exist:`, error.message);
            }
        }
        
        console.log('🎉 Messages collection setup complete!');
        console.log(`
📋 Collection Details:
- Database: ${DATABASE_ID}
- Collection: ${COLLECTION_ID}
- Permissions: Create/Read (any), Update/Delete (users)
- Fields: chatId, from, text, createdAt, senderId, senderName, senderAvatar, imageUrl

🔧 Next Steps:
1. Update your frontend code if needed
2. Test message sending/receiving
3. Monitor real-time subscriptions
        `);
        
    } catch (error) {
        if (error.code === 409) {
            console.log('ℹ️ Collection already exists, updating attributes...');
            // Continue with attribute creation for existing collection
        } else {
            console.error('❌ Failed to create collection:', error.message);
            process.exit(1);
        }
    }
}

// Environment validation
if (!process.env.APPWRITE_API_KEY) {
    console.error(`
❌ Missing APPWRITE_API_KEY environment variable!

To get your API key:
1. Go to https://cloud.appwrite.io/console
2. Navigate to your project > Settings > API Keys
3. Create a new key with 'databases.write' permission
4. Set environment variable:
   export APPWRITE_API_KEY="your_api_key_here"

Then run: node setup-messages-collection.js
    `);
    process.exit(1);
}

// Run the setup
createMessagesCollection();