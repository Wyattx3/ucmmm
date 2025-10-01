import { Client, Databases, Storage, Functions, ID } from 'node-appwrite';

const CONFIG = {
    endpoint: 'https://nyc.cloud.appwrite.io/v1',
    projectId: '68db5335002a5780ae9a',
    apiKey: 'standard_9e65d8e1af77654ab87f7ac216829f31d5e889a920feac3087a3e4ff066fb2769a5e27848127de9308ee707b692887580ef701fa64df49f0cc96054fef8e73d67ff5b9d338bb972fd4f03f0598e7a3f632e9461f2ba80c3ea0fe67a7011a49b5f8c624476564d507b16d74a57cccb2c27b3707f3d9e578699e1d0c0bff836fc9',
    resendApiKey: 're_PwPaZJNd_KqfU7wf7W3mPVuteGkp4xhjr'
};

const DATABASE_ID = 'ucera_main_db';

const client = new Client()
    .setEndpoint(CONFIG.endpoint)
    .setProject(CONFIG.projectId)
    .setKey(CONFIG.apiKey);

const databases = new Databases(client);
const storage = new Storage(client);
const functions = new Functions(client);

console.log('🧪 UC ERA - Backend Services Complete Testing\n');
console.log('='.repeat(70));
console.log(`📋 Project: ${CONFIG.projectId}`);
console.log(`🌐 Endpoint: ${CONFIG.endpoint}`);
console.log('='.repeat(70) + '\n');

let testResults = {
    passed: 0,
    failed: 0,
    total: 0
};

function logTest(name, status, details = '') {
    testResults.total++;
    if (status) {
        testResults.passed++;
        console.log(`✅ TEST ${testResults.total}: ${name}`);
        if (details) console.log(`   ${details}`);
    } else {
        testResults.failed++;
        console.log(`❌ TEST ${testResults.total}: ${name}`);
        if (details) console.log(`   Error: ${details}`);
    }
    console.log('');
}

async function testDatabase() {
    console.log('📦 DATABASE TESTS');
    console.log('-'.repeat(70) + '\n');
    
    // Test 1: List all databases
    try {
        const dbs = await databases.list();
        const ucDb = dbs.databases.find(db => db.$id === DATABASE_ID);
        logTest('Database exists', !!ucDb, ucDb ? `Found: ${ucDb.name}` : 'Not found');
    } catch (error) {
        logTest('Database exists', false, error.message);
    }
    
    // Test 2: List users collection
    try {
        const users = await databases.listDocuments(DATABASE_ID, 'users');
        logTest('Users collection read', true, `Found ${users.documents.length} users`);
        
        if (users.documents.length > 0) {
            const user = users.documents[0];
            console.log(`   Sample user: ${user.full_name} (${user.member_id})`);
            console.log(`   Email: ${user.email}`);
            console.log(`   City: ${user.living_city}`);
            console.log('');
        }
    } catch (error) {
        logTest('Users collection read', false, error.message);
    }
    
    // Test 3: List messages collection
    try {
        const messages = await databases.listDocuments(DATABASE_ID, 'messages');
        logTest('Messages collection read', true, `Found ${messages.documents.length} messages`);
    } catch (error) {
        logTest('Messages collection read', false, error.message);
    }
    
    // Test 4: List otp_codes collection
    try {
        const otps = await databases.listDocuments(DATABASE_ID, 'otp_codes');
        logTest('OTP codes collection read', true, `Found ${otps.documents.length} OTP codes`);
    } catch (error) {
        logTest('OTP codes collection read', false, error.message);
    }
    
    // Test 5: Create and delete test OTP
    try {
        const testOtp = await databases.createDocument(
            DATABASE_ID,
            'otp_codes',
            ID.unique(),
            {
                email: 'test@ucera.com',
                otp_code: '999999',
                purpose: 'test',
                is_used: false,
                attempts: 0,
                expires_at: new Date(Date.now() + 600000).toISOString()
            }
        );
        
        await databases.deleteDocument(DATABASE_ID, 'otp_codes', testOtp.$id);
        logTest('OTP create/delete', true, 'Created and deleted test OTP successfully');
    } catch (error) {
        logTest('OTP create/delete', false, error.message);
    }
}

async function testStorage() {
    console.log('🗄️  STORAGE TESTS');
    console.log('-'.repeat(70) + '\n');
    
    // Test 1: List all buckets
    try {
        const buckets = await storage.listBuckets();
        logTest('Storage buckets list', true, `Found ${buckets.buckets.length} buckets`);
        
        buckets.buckets.forEach(bucket => {
            console.log(`   • ${bucket.name} (${bucket.$id})`);
            console.log(`     Max size: ${(bucket.maximumFileSize / 1000000).toFixed(1)}MB`);
        });
        console.log('');
    } catch (error) {
        logTest('Storage buckets list', false, error.message);
    }
    
    // Test 2: Check specific buckets
    const requiredBuckets = ['profile-photos', 'member-cards', 'chat-images'];
    try {
        const buckets = await storage.listBuckets();
        const bucketIds = buckets.buckets.map(b => b.$id);
        
        const allExist = requiredBuckets.every(id => bucketIds.includes(id));
        logTest('Required buckets exist', allExist, 
            allExist ? 'All required buckets found' : `Missing: ${requiredBuckets.filter(id => !bucketIds.includes(id)).join(', ')}`
        );
    } catch (error) {
        logTest('Required buckets exist', false, error.message);
    }
}

async function testFunctions() {
    console.log('⚡ FUNCTIONS TESTS');
    console.log('-'.repeat(70) + '\n');
    
    // Test 1: List all functions
    try {
        const funcs = await functions.list();
        logTest('Functions list', true, `Found ${funcs.functions.length} functions`);
        
        funcs.functions.forEach(func => {
            console.log(`   • ${func.name} (${func.$id})`);
            console.log(`     Runtime: ${func.runtime}`);
            console.log(`     Status: ${func.enabled ? 'Enabled' : 'Disabled'}`);
        });
        console.log('');
    } catch (error) {
        logTest('Functions list', false, error.message);
    }
    
    // Test 2: Check send-otp-email function
    try {
        const func = await functions.get('send-otp-email');
        logTest('send-otp-email function exists', true, `Name: ${func.name}, Runtime: ${func.runtime}`);
        
        // Check deployments
        const deployments = await functions.listDeployments('send-otp-email');
        console.log(`   Deployments: ${deployments.deployments.length}`);
        if (deployments.deployments.length > 0) {
            const latest = deployments.deployments[0];
            console.log(`   Latest: ${latest.$id} - Status: ${latest.status}`);
        }
        console.log('');
    } catch (error) {
        logTest('send-otp-email function exists', false, error.message);
    }
    
    // Test 3: Check generate-member-card function
    try {
        const func = await functions.get('generate-member-card');
        logTest('generate-member-card function exists', true, `Name: ${func.name}, Runtime: ${func.runtime}`);
        
        // Check deployments
        const deployments = await functions.listDeployments('generate-member-card');
        console.log(`   Deployments: ${deployments.deployments.length}`);
        if (deployments.deployments.length > 0) {
            const latest = deployments.deployments[0];
            console.log(`   Latest: ${latest.$id} - Status: ${latest.status}`);
        }
        console.log('');
    } catch (error) {
        logTest('generate-member-card function exists', false, error.message);
    }
    
    // Test 4: Check environment variables for send-otp-email
    try {
        const vars = await functions.listVariables('send-otp-email');
        const hasResendKey = vars.variables.some(v => v.key === 'RESEND_API_KEY');
        logTest('send-otp-email environment variables', hasResendKey, 
            hasResendKey ? 'RESEND_API_KEY configured' : 'RESEND_API_KEY missing'
        );
    } catch (error) {
        logTest('send-otp-email environment variables', false, error.message);
    }
    
    // Test 5: Execute send-otp-email function (real test)
    try {
        console.log('   Executing send-otp-email function...');
        const execution = await functions.createExecution(
            'send-otp-email',
            JSON.stringify({
                email: 'test@ucera.com',
                userName: 'Test User',
                otpCode: '123456'
            }),
            false
        );
        
        // Wait for completion
        let status = execution.status;
        let attempts = 0;
        while (status !== 'completed' && status !== 'failed' && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const exec = await functions.getExecution('send-otp-email', execution.$id);
            status = exec.status;
            attempts++;
        }
        
        const finalExec = await functions.getExecution('send-otp-email', execution.$id);
        const success = finalExec.status === 'completed' && finalExec.responseStatusCode === 200;
        
        logTest('send-otp-email execution', success, 
            success ? `Status: ${finalExec.status}, Response: ${finalExec.responseStatusCode}` : 
            `Status: ${finalExec.status}, Error: ${finalExec.stderr}`
        );
        
        if (success && finalExec.responseBody) {
            try {
                const response = JSON.parse(finalExec.responseBody);
                console.log(`   Response: ${JSON.stringify(response, null, 2)}`);
            } catch (e) {
                console.log(`   Response: ${finalExec.responseBody}`);
            }
        }
        console.log('');
    } catch (error) {
        logTest('send-otp-email execution', false, error.message);
    }
}

async function testDataIntegrity() {
    console.log('🔍 DATA INTEGRITY TESTS');
    console.log('-'.repeat(70) + '\n');
    
    // Test 1: Check user data structure
    try {
        const users = await databases.listDocuments(DATABASE_ID, 'users');
        if (users.documents.length > 0) {
            const user = users.documents[0];
            const requiredFields = ['member_id', 'first_name', 'last_name', 'full_name', 'email'];
            const hasAllFields = requiredFields.every(field => user.hasOwnProperty(field));
            
            logTest('User data structure', hasAllFields, 
                hasAllFields ? 'All required fields present' : 
                `Missing fields: ${requiredFields.filter(f => !user.hasOwnProperty(f)).join(', ')}`
            );
        } else {
            logTest('User data structure', false, 'No users found to test');
        }
    } catch (error) {
        logTest('User data structure', false, error.message);
    }
    
    // Test 2: Check unique member IDs
    try {
        const users = await databases.listDocuments(DATABASE_ID, 'users');
        const memberIds = users.documents.map(u => u.member_id);
        const uniqueIds = new Set(memberIds);
        const allUnique = memberIds.length === uniqueIds.size;
        
        logTest('Unique member IDs', allUnique, 
            allUnique ? `All ${memberIds.length} member IDs are unique` : 
            'Duplicate member IDs found'
        );
    } catch (error) {
        logTest('Unique member IDs', false, error.message);
    }
    
    // Test 3: Check email format
    try {
        const users = await databases.listDocuments(DATABASE_ID, 'users');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const allValid = users.documents.every(u => !u.email || emailRegex.test(u.email));
        
        logTest('Email format validation', allValid, 
            allValid ? 'All emails are valid' : 'Invalid email formats found'
        );
    } catch (error) {
        logTest('Email format validation', false, error.message);
    }
}

async function printSummary() {
    console.log('='.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    console.log('='.repeat(70));
    
    if (testResults.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Backend is ready for production! 🚀\n');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
    }
}

async function main() {
    try {
        await testDatabase();
        await testStorage();
        await testFunctions();
        await testDataIntegrity();
        await printSummary();
    } catch (error) {
        console.error('\n❌ Testing failed:', error);
        process.exit(1);
    }
}

main();

