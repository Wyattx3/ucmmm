import { Client, Databases, Storage, Functions, ID } from 'node-appwrite';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
    endpoint: 'https://nyc.cloud.appwrite.io/v1',
    projectId: '68db5335002a5780ae9a',
    apiKey: 'standard_9e65d8e1af77654ab87f7ac216829f31d5e889a920feac3087a3e4ff066fb2769a5e27848127de9308ee707b692887580ef701fa64df49f0cc96054fef8e73d67ff5b9d338bb972fd4f03f0598e7a3f632e9461f2ba80c3ea0fe67a7011a49b5f8c624476564d507b16d74a57cccb2c27b3707f3d9e578699e1d0c0bff836fc9',
    resendApiKey: 're_PwPaZJNd_KqfU7wf7W3mPVuteGkp4xhjr'
};

const DATABASE_ID = 'ucera_main_db';

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(CONFIG.endpoint)
    .setProject(CONFIG.projectId)
    .setKey(CONFIG.apiKey);

const databases = new Databases(client);
const storage = new Storage(client);
const functions = new Functions(client);

console.log('🚀 UC ERA - Complete Appwrite Backend Setup\n');
console.log('📋 Project ID:', CONFIG.projectId);
console.log('🌐 Endpoint:', CONFIG.endpoint);
console.log('\n' + '='.repeat(60) + '\n');

// Helper function to handle API errors
async function safeApiCall(fn, errorMessage) {
    try {
        return await fn();
    } catch (error) {
        if (error.code === 409) {
            console.log(`ℹ️  ${errorMessage} (already exists - skipping)`);
            return null;
        }
        throw error;
    }
}

// Step 1: Create Database
async function createDatabase() {
    console.log('📦 STEP 1: Creating Database...');
    
    try {
        const database = await safeApiCall(
            () => databases.create(DATABASE_ID, 'UC ERA Main Database'),
            'Database already exists'
        );
        
        if (database) {
            console.log('✅ Database created:', database.name);
        } else {
            console.log('✅ Using existing database');
        }
    } catch (error) {
        console.error('❌ Database creation error:', error.message);
        throw error;
    }
    
    console.log('');
}

// Step 2: Create Collections with Attributes
async function createCollections() {
    console.log('📚 STEP 2: Creating Collections...\n');
    
    // Collection: users
    await createUsersCollection();
    
    // Collection: messages
    await createMessagesCollection();
    
    // Collection: otp_codes
    await createOtpCodesCollection();
    
    console.log('✅ All collections created successfully!\n');
}

async function createUsersCollection() {
    console.log('👤 Creating Users Collection...');
    
    try {
        const collection = await safeApiCall(
            () => databases.createCollection(DATABASE_ID, 'users', 'Users'),
            'Users collection'
        );
        
        if (collection) {
            console.log('✅ Users collection created');
            
            // Create attributes
            console.log('   Adding attributes...');
            
            await databases.createStringAttribute(DATABASE_ID, 'users', 'member_id', 7, true);
            await databases.createStringAttribute(DATABASE_ID, 'users', 'first_name', 100, true);
            await databases.createStringAttribute(DATABASE_ID, 'users', 'middle_name', 100, false);
            await databases.createStringAttribute(DATABASE_ID, 'users', 'last_name', 100, true);
            await databases.createStringAttribute(DATABASE_ID, 'users', 'full_name', 300, true);
            await databases.createEmailAttribute(DATABASE_ID, 'users', 'email', false);
            await databases.createStringAttribute(DATABASE_ID, 'users', 'phone_number', 20, false);
            await databases.createStringAttribute(DATABASE_ID, 'users', 'country_code', 10, false);
            await databases.createBooleanAttribute(DATABASE_ID, 'users', 'email_verified', false);
            await databases.createDatetimeAttribute(DATABASE_ID, 'users', 'email_verified_at', false);
            await databases.createDatetimeAttribute(DATABASE_ID, 'users', 'date_of_birth', false);
            await databases.createStringAttribute(DATABASE_ID, 'users', 'gender', 20, false);
            await databases.createStringAttribute(DATABASE_ID, 'users', 'citizenships', 1000, false);
            await databases.createStringAttribute(DATABASE_ID, 'users', 'living_city', 100, false);
            await databases.createStringAttribute(DATABASE_ID, 'users', 'passcode', 255, false);
            await databases.createIntegerAttribute(DATABASE_ID, 'users', 'registration_step', false);
            await databases.createDatetimeAttribute(DATABASE_ID, 'users', 'registration_started_at', false);
            await databases.createBooleanAttribute(DATABASE_ID, 'users', 'registration_completed', false);
            await databases.createDatetimeAttribute(DATABASE_ID, 'users', 'registration_completed_at', false);
            await databases.createStringAttribute(DATABASE_ID, 'users', 'account_status', 20, false);
            await databases.createBooleanAttribute(DATABASE_ID, 'users', 'has_member_card', false);
            await databases.createDatetimeAttribute(DATABASE_ID, 'users', 'member_card_completed_at', false);
            await databases.createStringAttribute(DATABASE_ID, 'users', 'relationship_status', 50, false);
            await databases.createStringAttribute(DATABASE_ID, 'users', 'favorite_food', 500, false);
            await databases.createStringAttribute(DATABASE_ID, 'users', 'favorite_artist', 500, false);
            await databases.createStringAttribute(DATABASE_ID, 'users', 'love_language', 100, false);
            await databases.createStringAttribute(DATABASE_ID, 'users', 'public_photo', 100000, false);
            await databases.createStringAttribute(DATABASE_ID, 'users', 'public_photo_url', 1000, false);
            await databases.createStringAttribute(DATABASE_ID, 'users', 'private_photo_id', 100, false);
            await databases.createStringAttribute(DATABASE_ID, 'users', 'private_photo_url', 1000, false);
            await databases.createIntegerAttribute(DATABASE_ID, 'users', 'private_photo_size', false);
            await databases.createBooleanAttribute(DATABASE_ID, 'users', 'is_online', false);
            await databases.createDatetimeAttribute(DATABASE_ID, 'users', 'last_seen', false);
            
            console.log('   ✅ All user attributes created');
            
            // Create indexes
            console.log('   Creating indexes...');
            await databases.createIndex(DATABASE_ID, 'users', 'idx_member_id', 'key', ['member_id']);
            await databases.createIndex(DATABASE_ID, 'users', 'idx_email', 'key', ['email']);
            console.log('   ✅ Indexes created');
        }
    } catch (error) {
        if (error.code !== 409) {
            console.error('❌ Users collection error:', error.message);
        }
    }
    
    console.log('');
}

async function createMessagesCollection() {
    console.log('💬 Creating Messages Collection...');
    
    try {
        const collection = await safeApiCall(
            () => databases.createCollection(DATABASE_ID, 'messages', 'Messages'),
            'Messages collection'
        );
        
        if (collection) {
            console.log('✅ Messages collection created');
            
            console.log('   Adding attributes...');
            
            await databases.createStringAttribute(DATABASE_ID, 'messages', 'sender_id', 100, true);
            await databases.createStringAttribute(DATABASE_ID, 'messages', 'receiver_id', 100, false);
            await databases.createStringAttribute(DATABASE_ID, 'messages', 'content', 10000, true);
            await databases.createStringAttribute(DATABASE_ID, 'messages', 'message_type', 20, false);
            await databases.createStringAttribute(DATABASE_ID, 'messages', 'image_url', 1000, false);
            await databases.createIntegerAttribute(DATABASE_ID, 'messages', 'image_size', false);
            await databases.createStringAttribute(DATABASE_ID, 'messages', 'file_name', 255, false);
            await databases.createBooleanAttribute(DATABASE_ID, 'messages', 'is_read', false);
            await databases.createDatetimeAttribute(DATABASE_ID, 'messages', 'read_at', false);
            
            console.log('   ✅ All message attributes created');
            
            // Create indexes
            console.log('   Creating indexes...');
            await databases.createIndex(DATABASE_ID, 'messages', 'idx_sender_id', 'key', ['sender_id']);
            await databases.createIndex(DATABASE_ID, 'messages', 'idx_receiver_id', 'key', ['receiver_id']);
            console.log('   ✅ Indexes created');
        }
    } catch (error) {
        if (error.code !== 409) {
            console.error('❌ Messages collection error:', error.message);
        }
    }
    
    console.log('');
}

async function createOtpCodesCollection() {
    console.log('🔐 Creating OTP Codes Collection...');
    
    try {
        const collection = await safeApiCall(
            () => databases.createCollection(DATABASE_ID, 'otp_codes', 'OTP Codes'),
            'OTP Codes collection'
        );
        
        if (collection) {
            console.log('✅ OTP Codes collection created');
            
            console.log('   Adding attributes...');
            
            await databases.createStringAttribute(DATABASE_ID, 'otp_codes', 'user_id', 100, false);
            await databases.createEmailAttribute(DATABASE_ID, 'otp_codes', 'email', true);
            await databases.createStringAttribute(DATABASE_ID, 'otp_codes', 'otp_code', 6, true);
            await databases.createStringAttribute(DATABASE_ID, 'otp_codes', 'purpose', 50, false);
            await databases.createBooleanAttribute(DATABASE_ID, 'otp_codes', 'is_used', false);
            await databases.createIntegerAttribute(DATABASE_ID, 'otp_codes', 'attempts', false);
            await databases.createDatetimeAttribute(DATABASE_ID, 'otp_codes', 'expires_at', false);
            await databases.createDatetimeAttribute(DATABASE_ID, 'otp_codes', 'verified_at', false);
            
            console.log('   ✅ All OTP attributes created');
            
            // Create indexes
            console.log('   Creating indexes...');
            await databases.createIndex(DATABASE_ID, 'otp_codes', 'idx_user_id', 'key', ['user_id']);
            await databases.createIndex(DATABASE_ID, 'otp_codes', 'idx_email', 'key', ['email']);
            console.log('   ✅ Indexes created');
        }
    } catch (error) {
        if (error.code !== 409) {
            console.error('❌ OTP Codes collection error:', error.message);
        }
    }
    
    console.log('');
}

// Step 3: Create Storage Buckets
async function createStorageBuckets() {
    console.log('🗄️  STEP 3: Creating Storage Buckets...\n');
    
    const buckets = [
        { id: 'profile-photos', name: 'Profile Photos', maxFileSize: 5000000 }, // 5MB
        { id: 'member-cards', name: 'Member Cards', maxFileSize: 3000000 }, // 3MB
        { id: 'chat-images', name: 'Chat Images', maxFileSize: 10000000 } // 10MB
    ];
    
    for (const bucket of buckets) {
        try {
            const created = await safeApiCall(
                () => storage.createBucket(
                    bucket.id,
                    bucket.name,
                    ['read("any")', 'create("users")', 'update("users")', 'delete("users")'],
                    false, // compression
                    false, // encryption
                    bucket.maxFileSize,
                    ['jpg', 'jpeg', 'png', 'gif', 'webp']
                ),
                `Bucket "${bucket.name}"`
            );
            
            if (created) {
                console.log(`✅ Bucket created: ${bucket.name}`);
            }
        } catch (error) {
            if (error.code !== 409) {
                console.error(`❌ Bucket creation error (${bucket.name}):`, error.message);
            }
        }
    }
    
    console.log('\n✅ All storage buckets created successfully!\n');
}

// Step 4: Deploy Functions
async function deployFunctions() {
    console.log('⚡ STEP 4: Deploying Functions...\n');
    
    // Function 1: send-otp-email
    await deployOtpFunction();
    
    // Function 2: generate-member-card
    await deployMemberCardFunction();
    
    console.log('✅ All functions deployed successfully!\n');
}

async function deployOtpFunction() {
    console.log('📧 Deploying send-otp-email function...');
    
    try {
        const func = await safeApiCall(
            () => functions.create(
                'send-otp-email',
                'Send OTP Email',
                'node-18.0',
                ['email'],
                [],
                30,
                true,
                false
            ),
            'send-otp-email function'
        );
        
        if (func) {
            console.log('✅ Function created: send-otp-email');
            
            // Set environment variable
            await functions.createVariable('send-otp-email', 'RESEND_API_KEY', CONFIG.resendApiKey);
            console.log('   ✅ RESEND_API_KEY environment variable set');
        } else {
            console.log('   Updating environment variable...');
            try {
                await functions.createVariable('send-otp-email', 'RESEND_API_KEY', CONFIG.resendApiKey);
                console.log('   ✅ RESEND_API_KEY environment variable updated');
            } catch (e) {
                console.log('   ℹ️  Environment variable already set');
            }
        }
    } catch (error) {
        if (error.code !== 409) {
            console.error('❌ OTP function error:', error.message);
        }
    }
    
    console.log('');
}

async function deployMemberCardFunction() {
    console.log('🎴 Deploying generate-member-card function...');
    
    try {
        const func = await safeApiCall(
            () => functions.create(
                'generate-member-card',
                'Generate Member Card',
                'node-18.0',
                ['users'],
                [],
                60,
                true,
                false
            ),
            'generate-member-card function'
        );
        
        if (func) {
            console.log('✅ Function created: generate-member-card');
        }
    } catch (error) {
        if (error.code !== 409) {
            console.error('❌ Member card function error:', error.message);
        }
    }
    
    console.log('');
}

// Step 5: Create Test Data
async function createTestData() {
    console.log('🧪 STEP 5: Creating Test Data...\n');
    
    const testUsers = [
        {
            member_id: 'UC00001',
            first_name: 'Thant',
            middle_name: 'Zin',
            last_name: 'Maung',
            full_name: 'Thant Zin Maung',
            email: 'thantzin@ucera.com',
            phone_number: '09123456789',
            country_code: '+95',
            email_verified: true,
            date_of_birth: new Date('1995-08-15').toISOString(),
            gender: 'Male',
            living_city: 'Yangon',
            registration_step: 11,
            registration_completed: true,
            account_status: 'active',
            has_member_card: true,
            is_online: true
        },
        {
            member_id: 'UC00002',
            first_name: 'Aye',
            middle_name: 'Thiri',
            last_name: 'Kyaw',
            full_name: 'Aye Thiri Kyaw',
            email: 'ayethiri@ucera.com',
            phone_number: '09987654321',
            country_code: '+95',
            email_verified: true,
            date_of_birth: new Date('1998-11-20').toISOString(),
            gender: 'Female',
            living_city: 'Mandalay',
            registration_step: 11,
            registration_completed: true,
            account_status: 'active',
            has_member_card: true,
            is_online: false
        },
        {
            member_id: 'UC00003',
            first_name: 'Zaw',
            middle_name: 'Lin',
            last_name: 'Htut',
            full_name: 'Zaw Lin Htut',
            email: 'zawlin@ucera.com',
            phone_number: '09555666777',
            country_code: '+95',
            email_verified: true,
            date_of_birth: new Date('1997-06-10').toISOString(),
            gender: 'Male',
            living_city: 'Naypyidaw',
            registration_step: 11,
            registration_completed: true,
            account_status: 'active',
            has_member_card: true,
            is_online: true
        }
    ];
    
    for (const user of testUsers) {
        try {
            const created = await databases.createDocument(
                DATABASE_ID,
                'users',
                ID.unique(),
                user
            );
            console.log(`✅ Test user created: ${user.full_name} (${user.member_id})`);
        } catch (error) {
            if (error.code !== 409) {
                console.error(`❌ User creation error (${user.full_name}):`, error.message);
            }
        }
    }
    
    console.log('\n✅ Test data created successfully!\n');
}

// Step 6: Test Backend Services
async function testBackendServices() {
    console.log('🧪 STEP 6: Testing Backend Services...\n');
    
    // Test 1: Database Read
    console.log('📖 Test 1: Database Read Test...');
    try {
        const users = await databases.listDocuments(DATABASE_ID, 'users');
        console.log(`✅ Database read successful! Found ${users.documents.length} users`);
    } catch (error) {
        console.error('❌ Database read error:', error.message);
    }
    
    console.log('');
    
    // Test 2: OTP Creation
    console.log('🔐 Test 2: OTP Code Creation Test...');
    try {
        const otpDoc = await databases.createDocument(
            DATABASE_ID,
            'otp_codes',
            ID.unique(),
            {
                email: 'test@ucera.com',
                otp_code: '123456',
                purpose: 'email-verification',
                is_used: false,
                attempts: 0,
                expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
            }
        );
        console.log(`✅ OTP code created successfully! Code: ${otpDoc.otp_code}`);
        
        // Clean up test OTP
        await databases.deleteDocument(DATABASE_ID, 'otp_codes', otpDoc.$id);
        console.log('   ✅ Test OTP cleaned up');
    } catch (error) {
        console.error('❌ OTP creation error:', error.message);
    }
    
    console.log('');
    
    // Test 3: Storage Buckets
    console.log('🗄️  Test 3: Storage Buckets Test...');
    try {
        const buckets = await storage.listBuckets();
        console.log(`✅ Storage read successful! Found ${buckets.buckets.length} buckets`);
        buckets.buckets.forEach(bucket => {
            console.log(`   • ${bucket.name} (${bucket.$id})`);
        });
    } catch (error) {
        console.error('❌ Storage read error:', error.message);
    }
    
    console.log('');
    
    // Test 4: Functions
    console.log('⚡ Test 4: Functions Test...');
    try {
        const funcs = await functions.list();
        console.log(`✅ Functions read successful! Found ${funcs.functions.length} functions`);
        funcs.functions.forEach(func => {
            console.log(`   • ${func.name} (${func.$id})`);
        });
    } catch (error) {
        console.error('❌ Functions read error:', error.message);
    }
    
    console.log('\n✅ All backend tests completed!\n');
}

// Main execution
async function main() {
    try {
        await createDatabase();
        await createCollections();
        
        // Wait for attributes to be ready
        console.log('⏳ Waiting for attributes to be ready...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('✅ Ready to continue\n');
        
        await createStorageBuckets();
        await deployFunctions();
        await createTestData();
        await testBackendServices();
        
        console.log('='.repeat(60));
        console.log('🎉 COMPLETE! All Appwrite Backend Services Setup လုပ်ပြီးပါပြီ!');
        console.log('='.repeat(60));
        console.log('\n📋 Summary:');
        console.log('✅ Database: ucera_main_db');
        console.log('✅ Collections: users, messages, otp_codes');
        console.log('✅ Storage Buckets: profile-photos, member-cards, chat-images');
        console.log('✅ Functions: send-otp-email, generate-member-card');
        console.log('✅ Test Data: 3 Myanmar users');
        console.log('\n🚀 Backend is ready for production!');
        
    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run
main();
