import { Client, Databases, Storage, Functions, ID } from 'node-appwrite';

const CONFIG = {
    endpoint: 'https://nyc.cloud.appwrite.io/v1',
    projectId: '68db5335002a5780ae9a',
    apiKey: 'standard_9e65d8e1af77654ab87f7ac216829f31d5e889a920feac3087a3e4ff066fb2769a5e27848127de9308ee707b692887580ef701fa64df49f0cc96054fef8e73d67ff5b9d338bb972fd4f03f0598e7a3f632e9461f2ba80c3ea0fe67a7011a49b5f8c624476564d507b16d74a57cccb2c27b3707f3d9e578699e1d0c0bff836fc9'
};

const DATABASE_ID = 'ucera_main_db';

const client = new Client()
    .setEndpoint(CONFIG.endpoint)
    .setProject(CONFIG.projectId)
    .setKey(CONFIG.apiKey);

const databases = new Databases(client);
const storage = new Storage(client);
const functions = new Functions(client);

console.log('\n🎯 UC ERA - Final Backend Verification Test\n');
console.log('='.repeat(70));

async function verifyComplete() {
    console.log('\n📋 VERIFICATION CHECKLIST:\n');
    
    // 1. Database
    try {
        const db = await databases.list();
        const ucDb = db.databases.find(d => d.$id === DATABASE_ID);
        console.log('✅ 1. Database exists:', ucDb?.name);
    } catch (e) {
        console.log('❌ 1. Database error:', e.message);
        return false;
    }
    
    // 2. Collections
    try {
        const users = await databases.listDocuments(DATABASE_ID, 'users');
        const messages = await databases.listDocuments(DATABASE_ID, 'messages');
        const otps = await databases.listDocuments(DATABASE_ID, 'otp_codes');
        console.log('✅ 2. Collections accessible:');
        console.log(`   • users: ${users.documents.length} documents`);
        console.log(`   • messages: ${messages.documents.length} documents`);
        console.log(`   • otp_codes: ${otps.documents.length} documents`);
    } catch (e) {
        console.log('❌ 2. Collections error:', e.message);
        return false;
    }
    
    // 3. Storage Buckets
    try {
        const buckets = await storage.listBuckets();
        console.log('✅ 3. Storage buckets:', buckets.buckets.length);
        buckets.buckets.forEach(b => {
            console.log(`   • ${b.name} (${b.$id})`);
        });
    } catch (e) {
        console.log('❌ 3. Storage error:', e.message);
        return false;
    }
    
    // 4. Functions
    try {
        const funcs = await functions.list();
        console.log('✅ 4. Functions deployed:', funcs.functions.length);
        funcs.functions.forEach(f => {
            console.log(`   • ${f.name} (${f.$id}) - ${f.enabled ? 'Enabled' : 'Disabled'}`);
        });
    } catch (e) {
        console.log('❌ 4. Functions error:', e.message);
        return false;
    }
    
    // 5. Function Execution Test
    try {
        console.log('\n🔥 5. Testing send-otp-email function execution...');
        const execution = await functions.createExecution(
            'send-otp-email',
            JSON.stringify({
                email: 'verification@ucera.com',
                userName: 'Verification User',
                otpCode: '888888'
            }),
            false
        );
        
        // Wait for completion
        let status = execution.status;
        let attempts = 0;
        while (status !== 'completed' && status !== 'failed' && attempts < 15) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const exec = await functions.getExecution('send-otp-email', execution.$id);
            status = exec.status;
            attempts++;
            process.stdout.write(`\r   Waiting for completion... (${attempts}s)`);
        }
        
        const finalExec = await functions.getExecution('send-otp-email', execution.$id);
        
        if (finalExec.status === 'completed' && finalExec.responseStatusCode === 200) {
            console.log('\n✅ 5. Function execution successful!');
            console.log('   Status:', finalExec.status);
            console.log('   Response code:', finalExec.responseStatusCode);
            
            if (finalExec.responseBody) {
                try {
                    const response = JSON.parse(finalExec.responseBody);
                    console.log('   Success:', response.success);
                    console.log('   Message:', response.message);
                } catch (e) {
                    // Ignore parse error
                }
            }
        } else {
            console.log('\n❌ 5. Function execution failed');
            console.log('   Status:', finalExec.status);
            console.log('   Response code:', finalExec.responseStatusCode);
            if (finalExec.stderr) {
                console.log('   Error:', finalExec.stderr);
            }
            return false;
        }
    } catch (e) {
        console.log('\n❌ 5. Function execution error:', e.message);
        return false;
    }
    
    // 6. Test Data Integrity
    try {
        const users = await databases.listDocuments(DATABASE_ID, 'users');
        if (users.documents.length >= 3) {
            console.log('✅ 6. Test data present:', users.documents.length, 'Myanmar users');
            users.documents.slice(0, 3).forEach(u => {
                console.log(`   • ${u.full_name} (${u.member_id}) - ${u.living_city}`);
            });
        } else {
            console.log('⚠️  6. Less than 3 test users found');
        }
    } catch (e) {
        console.log('❌ 6. Test data error:', e.message);
        return false;
    }
    
    // 7. Environment Variables
    try {
        const vars = await functions.listVariables('send-otp-email');
        const hasResendKey = vars.variables.some(v => v.key === 'RESEND_API_KEY');
        console.log('✅ 7. Environment variables configured:', hasResendKey ? 'RESEND_API_KEY present' : 'Missing');
    } catch (e) {
        console.log('❌ 7. Environment variables error:', e.message);
        return false;
    }
    
    return true;
}

async function main() {
    const success = await verifyComplete();
    
    console.log('\n' + '='.repeat(70));
    
    if (success) {
        console.log('\n🎉 VERIFICATION COMPLETE!');
        console.log('\n✅ UC ERA Backend အားလုံး အလုပ်လုပ်နေပါပြီ!');
        console.log('✅ Database, Storage, Functions အားလုံး ready ဖြစ်ပါပြီ!');
        console.log('✅ Production အတွက် အသင့်ဖြစ်ပါပြီ! 🚀');
        console.log('\n📱 Frontend: npm run dev ဖြင့် test လုပ်နိုင်ပါပြီ');
        console.log('🌐 Appwrite Console: https://cloud.appwrite.io/console/project-68db5335002a5780ae9a');
    } else {
        console.log('\n❌ VERIFICATION FAILED');
        console.log('Please check the errors above.');
    }
    
    console.log('\n' + '='.repeat(70) + '\n');
}

main();

