// UC ERA - Appwrite Production Configuration
import { Client, Databases, Storage, Functions, ID, Query } from 'appwrite';

// Appwrite configuration from environment variables
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '68db5335002a5780ae9a';

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId);

// Initialize services
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

// Database and Collection IDs
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'ucera_main_db';

export const COLLECTIONS = {
    USERS: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || 'users',
    MESSAGES: import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID || 'messages',
    OTP_CODES: import.meta.env.VITE_APPWRITE_OTP_CODES_COLLECTION_ID || 'otp_codes'
};

// Storage Bucket IDs
export const STORAGE_BUCKETS = {
    PROFILE_PHOTOS: import.meta.env.VITE_APPWRITE_PROFILE_PHOTOS_BUCKET_ID || 'profile-photos',
    MEMBER_CARDS: import.meta.env.VITE_APPWRITE_MEMBER_CARDS_BUCKET_ID || 'member-cards',
    CHAT_IMAGES: import.meta.env.VITE_APPWRITE_CHAT_IMAGES_BUCKET_ID || 'chat-images'
};

// Function IDs
export const FUNCTION_IDS = {
    SEND_OTP_EMAIL: import.meta.env.VITE_APPWRITE_SEND_OTP_FUNCTION_ID || 'send-otp-email',
    GENERATE_MEMBER_CARD: import.meta.env.VITE_APPWRITE_GENERATE_CARD_FUNCTION_ID || 'generate-member-card'
};

// Export ID and Query helpers
export { ID, Query };

// Export client for advanced usage
export default client;

console.log('🚀 Appwrite Production SDK initialized');
console.log('📋 Project:', projectId);
console.log('🌐 Endpoint:', endpoint);

