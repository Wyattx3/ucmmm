#!/usr/bin/env node

/**
 * Setup script for member-cards storage bucket
 * 
 * This script creates the member-cards bucket in Appwrite Storage
 * for backing up generated member cards.
 * 
 * Usage: node setup-member-cards-bucket.js
 */

import { Client, Storage, Permission, Role } from 'appwrite';
import { config } from 'dotenv';

// Load environment variables
config();

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '688813660017c877f06e')
    .setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);

async function setupMemberCardsBucket() {
    try {
        console.log('🎴 Setting up member-cards storage bucket...');
        
        // Check if bucket already exists
        try {
            const existingBucket = await storage.getBucket('member-cards');
            console.log('✅ Bucket member-cards already exists:', existingBucket.name);
            return;
        } catch (error) {
            if (error.code !== 404) {
                throw error;
            }
            // Bucket doesn't exist, create it
        }
        
        // Create the member-cards bucket
        const bucket = await storage.createBucket(
            'member-cards',
            'Member Cards Backup',
            [
                Permission.create(Role.any()),           // Anyone can create (during registration)
                Permission.read(Role.users()),           // Only authenticated users can read
                Permission.update(Role.users()),         // Only authenticated users can update
                Permission.delete(Role.users())          // Only authenticated users can delete
            ],
            true,    // fileSecurity enabled for file-level permissions
            false,   // not enabled (compression)
            1048576, // 1MB max file size (member cards should be small)
            ['png', 'jpg', 'jpeg'], // Allowed file extensions
            true,    // encryption enabled
            false    // antivirus disabled
        );
        
        console.log('✅ Member cards bucket created successfully!');
        console.log(`   Bucket ID: ${bucket.$id}`);
        console.log(`   Bucket Name: ${bucket.name}`);
        console.log(`   Max File Size: ${bucket.maximumFileSize} bytes`);
        console.log(`   Allowed Extensions: ${bucket.allowedFileExtensions.join(', ')}`);
        console.log(`   File Security: ${bucket.fileSecurity ? 'Enabled' : 'Disabled'}`);
        console.log(`   Encryption: ${bucket.encryption ? 'Enabled' : 'Disabled'}`);
        
        console.log('\n📋 Next steps:');
        console.log('1. Update your .env file with APPWRITE_API_KEY if not already set');
        console.log('2. The member-cards bucket is now ready for use');
        console.log('3. Member cards will be automatically backed up when generated');
        console.log('4. Users can retrieve their backed up member cards from the Home screen');
        
    } catch (error) {
        console.error('❌ Error setting up member-cards bucket:', error);
        
        if (error.code === 401) {
            console.log('\n🔑 Authentication Error:');
            console.log('   Make sure APPWRITE_API_KEY is set in your .env file');
            console.log('   You can generate an API key from your Appwrite Console:');
            console.log('   Settings → API Keys → Create API Key');
        } else if (error.code === 404) {
            console.log('\n🏗️ Project Not Found:');
            console.log('   Make sure APPWRITE_PROJECT_ID is correct in your .env file');
            console.log('   Current Project ID:', process.env.APPWRITE_PROJECT_ID);
        }
        
        process.exit(1);
    }
}

// Run the setup
setupMemberCardsBucket();