import { Client, Account, Databases, Functions, Storage, ID, Query, Permission, Role } from 'appwrite';

// Appwrite configuration
const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);
export const storage = new Storage(client);

// Database and Collection IDs
export const DATABASE_ID = 'ucera-main';
export const COLLECTIONS = {
    USERS: 'users',
    REGISTRATIONS: 'registrations',
    OTP_CODES: 'otp_codes',
    ETHNIC_GROUPS: 'ethnic_groups',
    CITIES: 'cities',
    GROUPS: 'groups',
    MESSAGES: 'messages'
};

// Storage Bucket IDs (Pro Plan - Multiple Buckets)
export const STORAGE_BUCKETS = {
    PRIVATE_PHOTOS: 'private-photos',
    PUBLIC_PHOTOS: 'private-photos',  // Same bucket, different file-level permissions
    CHAT_IMAGES: 'chat-images'        // Dedicated bucket for chat images
};

// Helper to generate unique IDs and Query objects
export { ID, Query, Permission, Role };

// Export client for direct access if needed
export default client; 