import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧹 Cleaning up temporary setup files...\n');

const tempFiles = [
    // Old markdown documentation
    'APPWRITE_NEW_SETUP.md',
    'BROWSER_SETUP_REQUIRED.md',
    'COMPLETE_BACKEND_SUCCESS.md',
    'COMPLETE_SETUP_GUIDE.md',
    'FINAL_SETUP_COMMANDS.md',
    'FUNCTIONS_DEPLOYMENT_GUIDE.md',
    'MIGRATION_SUCCESS_SUMMARY.md',
    'ONE_STEP_SETUP.md',
    'PRODUCTION_DEPLOYMENT_GUIDE.md',
    'PRODUCTION_READY_STATUS.md',
    'QUICK_APPWRITE_SETUP.md',
    'README_MIGRATION.md',
    'SIMPLE_FUNCTION_UPLOAD.md',
    'VERCEL_MIGRATION_GUIDE.md',
    
    // Old setup scripts
    'add-missing-attributes.cjs',
    'add-resend-key.js',
    'appwrite-backend-setup.js',
    'auto-setup-backend.cjs',
    'cleanup-databases.cjs',
    'cleanup-storage.cjs',
    'complete-backend-setup.cjs',
    'create-complete-data.cjs',
    'create-functions.cjs',
    'create-messages.cjs',
    'create-production-data.cjs',
    'create-simple-data.cjs',
    'create-test-users.cjs',
    'create-uc-era-project.js',
    'deploy-complete-functions.cjs',
    'deploy-functions.js',
    'deploy-production.cjs',
    'final-backend-setup.cjs',
    'final-production-data.cjs',
    'production-data-setup.cjs',
    'run-complete-setup.cjs',
    'setup-appwrite-auto.cjs',
    'setup-appwrite-auto.js',
    'setup-database.cjs',
    'setup-database.js',
    'setup-new-appwrite.sh',
    'setup-production-backend.cjs',
    'setup-production-backend.js',
    'setup-vercel-env.cjs',
    'setup-vercel-env.js',
    'test-deployment.cjs',
    'test-deployment.js',
    'test-endpoints.cjs',
    'setup-attributes.sh',
    
    // Backup files
    'src/lib/appwrite-old.js',
    'src/lib/supabase.js',
    'src/services/auth-vercel.js',
    'src/services/message-vercel.js',
    'src/components/Home.jsx.backup'
];

let deleted = 0;
let notFound = 0;

tempFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`✅ Deleted: ${file}`);
            deleted++;
        } else {
            notFound++;
        }
    } catch (error) {
        console.log(`❌ Error deleting ${file}:`, error.message);
    }
});

console.log('\n' + '='.repeat(60));
console.log('📊 Cleanup Summary:');
console.log(`✅ Deleted: ${deleted} files`);
console.log(`ℹ️  Not found: ${notFound} files`);
console.log('='.repeat(60));

console.log('\n✨ Cleanup complete! Only essential files remain.');
console.log('\n📋 Keeping:');
console.log('  • APPWRITE_SETUP_COMPLETE.md - Final documentation');
console.log('  • setup-complete-appwrite.js - Backend setup script');
console.log('  • deploy-functions-cli.js - Functions deployment script');
console.log('  • test-backend-services.js - Backend testing script');
console.log('  • final-verification-test.js - Verification script');
console.log('');

