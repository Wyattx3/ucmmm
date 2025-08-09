#!/usr/bin/env node

/**
 * Create test users for multi-user messaging testing
 */

import { Client, Databases, ID } from 'appwrite';

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '688813660017c877f06e')
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = 'ucera-main';
const USERS_COLLECTION = 'users';

const testUsers = [
    {
        firstName: 'Alice',
        lastName: 'Smith', 
        fullName: 'Alice Smith',
        email: 'alice@test.com',
        phoneNumber: '+1234567890',
        memberID: '1000001',
        emailVerified: true,
        publicPhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' // 1x1 red pixel
    },
    {
        firstName: 'Bob',
        lastName: 'Johnson',
        fullName: 'Bob Johnson', 
        email: 'bob@test.com',
        phoneNumber: '+1234567891',
        memberID: '1000002',
        emailVerified: true,
        publicPhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' // 1x1 green pixel
    },
    {
        firstName: 'Charlie',
        lastName: 'Davis',
        fullName: 'Charlie Davis',
        email: 'charlie@test.com', 
        phoneNumber: '+1234567892',
        memberID: '1000003',
        emailVerified: true,
        publicPhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' // 1x1 blue pixel
    }
];

async function createTestUsers() {
    console.log('🧪 Creating test users for multi-user messaging...');
    
    for (const user of testUsers) {
        try {
            const result = await databases.createDocument(
                DATABASE_ID,
                USERS_COLLECTION,
                ID.unique(),
                {
                    ...user,
                    dateOfBirth: '1990-01-01',
                    registrationStep: 'completed',
                    accountStatus: 'active',
                    registrationCompletedAt: new Date().toISOString(),
                    hasMemberCard: true,
                    memberCardCompletedAt: new Date().toISOString()
                }
            );
            
            console.log(`✅ Created user: ${user.fullName} (ID: ${result.$id})`);
            
            // Wait between requests
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            if (error.code === 409) {
                console.log(`ℹ️ User ${user.fullName} already exists`);
            } else {
                console.error(`❌ Failed to create ${user.fullName}:`, error.message);
            }
        }
    }
    
    console.log('\n🎉 Test users setup complete!');
    console.log('\n📋 Test Instructions:');
    console.log('1. Open UC ERA app in multiple browser windows/tabs');
    console.log('2. Login with different test users in each window:');
    console.log('   - Use Member Card login');
    console.log('   - Decode existing member cards or create new ones');
    console.log('3. Send messages between users');
    console.log('4. Verify real-time delivery');
    
    console.log('\n🔧 Alternative Testing (Manual):');
    console.log('1. Open 2 incognito windows');
    console.log('2. Register 2 different accounts');
    console.log('3. Complete registration in both');
    console.log('4. Test messaging between them');
}

if (!process.env.APPWRITE_API_KEY) {
    console.error('❌ APPWRITE_API_KEY required. Set it and run again.');
    process.exit(1);
}

createTestUsers();