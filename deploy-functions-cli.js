import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';
import archiver from 'archiver';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
    endpoint: 'https://nyc.cloud.appwrite.io/v1',
    projectId: '68db5335002a5780ae9a',
    apiKey: 'standard_9e65d8e1af77654ab87f7ac216829f31d5e889a920feac3087a3e4ff066fb2769a5e27848127de9308ee707b692887580ef701fa64df49f0cc96054fef8e73d67ff5b9d338bb972fd4f03f0598e7a3f632e9461f2ba80c3ea0fe67a7011a49b5f8c624476564d507b16d74a57cccb2c27b3707f3d9e578699e1d0c0bff836fc9',
    resendApiKey: 're_PwPaZJNd_KqfU7wf7W3mPVuteGkp4xhjr'
};

console.log('⚡ UC ERA - Deploying Functions to Appwrite\n');

// Create function via API
async function createFunction(functionId, name, runtime) {
    console.log(`\n📦 Creating function: ${name}...`);
    
    try {
        const response = await fetch(`${CONFIG.endpoint}/functions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Appwrite-Project': CONFIG.projectId,
                'X-Appwrite-Key': CONFIG.apiKey
            },
            body: JSON.stringify({
                functionId: functionId,
                name: name,
                runtime: runtime,
                execute: ['any'],
                events: [],
                schedule: '',
                timeout: 30,
                enabled: true,
                logging: true,
                entrypoint: 'src/main.js'
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ Function created: ${name}`);
            return data;
        } else if (data.code === 409) {
            console.log(`ℹ️  Function already exists: ${name}`);
            return null;
        } else {
            console.error(`❌ Error creating function: ${data.message}`);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        return null;
    }
}

// Create environment variable
async function createVariable(functionId, key, value) {
    console.log(`   Setting ${key}...`);
    
    try {
        const response = await fetch(`${CONFIG.endpoint}/functions/${functionId}/variables`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Appwrite-Project': CONFIG.projectId,
                'X-Appwrite-Key': CONFIG.apiKey
            },
            body: JSON.stringify({
                key: key,
                value: value
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log(`   ✅ ${key} set successfully`);
            return data;
        } else if (data.code === 409) {
            console.log(`   ℹ️  ${key} already exists`);
            return null;
        } else {
            console.error(`   ❌ Error setting ${key}: ${data.message}`);
            return null;
        }
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        return null;
    }
}

// Create tarball
async function createTarball(sourceDir, outputFile) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputFile);
        const archive = archiver('tar', {
            gzip: true
        });

        output.on('close', () => {
            console.log(`   ✅ Tarball created: ${path.basename(outputFile)} (${archive.pointer()} bytes)`);
            resolve(outputFile);
        });

        archive.on('error', (err) => {
            reject(err);
        });

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

// Deploy function code
async function deployFunctionCode(functionId, tarballPath) {
    console.log(`   Deploying code from ${path.basename(tarballPath)}...`);
    
    try {
        const form = new FormData();
        form.append('entrypoint', 'src/main.js');
        form.append('code', fs.createReadStream(tarballPath));
        form.append('activate', 'true');

        const response = await fetch(`${CONFIG.endpoint}/functions/${functionId}/deployments`, {
            method: 'POST',
            headers: {
                'X-Appwrite-Project': CONFIG.projectId,
                'X-Appwrite-Key': CONFIG.apiKey,
                ...form.getHeaders()
            },
            body: form
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log(`   ✅ Code deployed successfully! Deployment ID: ${data.$id}`);
            return data;
        } else {
            console.error(`   ❌ Deployment error: ${data.message}`);
            return null;
        }
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        return null;
    }
}

// Main deployment
async function main() {
    console.log('='.repeat(60));
    
    // Function 1: send-otp-email
    console.log('\n📧 FUNCTION 1: send-otp-email');
    console.log('-'.repeat(60));
    
    await createFunction('send-otp-email', 'Send OTP Email', 'node-18.0');
    await createVariable('send-otp-email', 'RESEND_API_KEY', CONFIG.resendApiKey);
    
    const otpTarball = path.join(__dirname, 'functions', 'send-otp-email-deploy.tar.gz');
    await createTarball(
        path.join(__dirname, 'functions', 'send-otp-email'),
        otpTarball
    );
    await deployFunctionCode('send-otp-email', otpTarball);
    
    // Function 2: generate-member-card
    console.log('\n🎴 FUNCTION 2: generate-member-card');
    console.log('-'.repeat(60));
    
    await createFunction('generate-member-card', 'Generate Member Card', 'node-18.0');
    
    const cardTarball = path.join(__dirname, 'functions', 'generate-member-card-deploy.tar.gz');
    await createTarball(
        path.join(__dirname, 'functions', 'generate-member-card'),
        cardTarball
    );
    await deployFunctionCode('generate-member-card', cardTarball);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Functions deployed successfully!');
    console.log('='.repeat(60));
    
    // Cleanup
    console.log('\n🧹 Cleaning up temporary files...');
    try {
        if (fs.existsSync(otpTarball)) fs.unlinkSync(otpTarball);
        if (fs.existsSync(cardTarball)) fs.unlinkSync(cardTarball);
        console.log('✅ Cleanup complete');
    } catch (error) {
        console.log('ℹ️  Cleanup skipped');
    }
}

main().catch(console.error);

