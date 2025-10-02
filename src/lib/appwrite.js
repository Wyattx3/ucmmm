// UC ERA - Appwrite Production Configuration
import { Client, Account, Databases, Storage, Functions, ID, Query, Permission, Role } from 'appwrite';

// Appwrite configuration - Hardcoded for reliability
const endpoint = 'https://nyc.cloud.appwrite.io/v1';
const projectId = '68db5335002a5780ae9a';

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

// Database and Collection IDs - Hardcoded for reliability
export const DATABASE_ID = 'ucera_main_db';

export const COLLECTIONS = {
    USERS: 'users',
    MESSAGES: 'messages',
    OTP_CODES: 'otp_codes'
};

// Storage Bucket IDs
export const STORAGE_BUCKETS = {
    PROFILE_PHOTOS: 'profile-photos',
    MEMBER_CARDS: 'member-cards',
    CHAT_IMAGES: 'chat-images'
};

// Function IDs
export const FUNCTION_IDS = {
    SEND_OTP_EMAIL: 'send-otp-email',
    GENERATE_MEMBER_CARD: 'generate-member-card'
};

// Export Appwrite helpers
export { ID, Query, Permission, Role };

// Export client for advanced usage
export default client;

console.log('🚀 Appwrite Production SDK initialized');
console.log('📋 Project:', projectId);
console.log('🌐 Endpoint:', endpoint);
console.log('💾 Database:', DATABASE_ID);

// Force clear ALL cached data on every load for fresh start
if (typeof window !== 'undefined') {
    const currentProjectId = projectId;
    const cacheVersion = 'v53_production_ready'; // Production ready - debug logs removed
    const cacheCleared = sessionStorage.getItem('cache_cleared_' + cacheVersion);
    
    if (!cacheCleared) {
        console.log('🧹 Force clearing cache (preserving session)...');
        
        // Preserve session data and open chat
        const sessionUser = localStorage.getItem('ucera_session_user');
        const openChat = localStorage.getItem('ucera_open_chat');
        
        // Clear all caches
        localStorage.clear();
        sessionStorage.clear();
        
        // Restore session data and open chat
        if (sessionUser) {
            localStorage.setItem('ucera_session_user', sessionUser);
            console.log('✅ Session preserved during cache clear');
        }
        if (openChat) {
            localStorage.setItem('ucera_open_chat', openChat);
            console.log('✅ Open chat preserved during cache clear');
        }
        
        sessionStorage.setItem('cache_cleared_' + cacheVersion, 'true');
        console.log('✅ Cache cleared! Reloading for fresh start...');
        // Force reload once
        setTimeout(() => window.location.reload(), 100);
    } else {
        console.log('✅ Cache cleared (' + cacheVersion + ') - All zodiac borders ready!');
    }
}

