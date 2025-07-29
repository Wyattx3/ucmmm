import { Client, Account, Databases, ID } from 'appwrite';

// Appwrite configuration
const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);

// Database and Collection IDs
export const DATABASE_ID = 'ucera-main';
export const COLLECTIONS = {
    USERS: 'users',
    REGISTRATIONS: 'registrations',
    OTP_CODES: 'otp_codes',
    ETHNIC_GROUPS: 'ethnic_groups',
    CITIES: 'cities'
};

// Helper to generate unique IDs
export { ID };

// Export client for direct access if needed
export default client; 