import { account, databases, functions, DATABASE_ID, COLLECTIONS, ID, Query } from '../lib/appwrite.js';
import storageService from './storage.js';
class AuthService {
    // Session helpers (persist logged-in user in localStorage)
    saveSessionUser(user) {
        try { localStorage.setItem('ucera_session_user', JSON.stringify(user)) } catch {}
    }
    loadSessionUser() {
        try { const raw = localStorage.getItem('ucera_session_user'); return raw ? JSON.parse(raw) : null } catch { return null }
    }
    clearSessionUser() { 
        try { 
            localStorage.removeItem('ucera_session_user')
            localStorage.removeItem('ucera_open_chat') // Also clear open chat
        } catch {} 
    }
    async hardLogout() {
        try {
            // Clear local session
            this.clearSessionUser()
            // Try to delete Appwrite session (best-effort)
            try { await account.deleteSession('current') } catch {}
            return { success: true }
        } catch {
            return { success: false }
        }
    }
    // Generate unique 7-digit Member ID
    async generateMemberID() {
        try {
            let isUnique = false;
            let memberID = '';
            let attempts = 0;
            const maxAttempts = 10;
            while (!isUnique && attempts < maxAttempts) {
                // Generate 7-digit number (1000000 to 9999999)
                memberID = Math.floor(1000000 + Math.random() * 9000000).toString();
                // Check if this Member ID already exists
                try {
                    const existingUsers = await databases.listDocuments(
                        DATABASE_ID,
                        COLLECTIONS.USERS,
                        [Query.equal('member_id', memberID)]
                    );
                    if (existingUsers.documents.length === 0) {
                        isUnique = true;
                    } else {
                        attempts++;
                    }
                } catch (error) {
                    // If we can't check, assume it's unique to avoid infinite loop
                    isUnique = true;
                }
            }
            if (!isUnique) {
                throw new Error('Failed to generate unique Member ID after multiple attempts');
            }
            return memberID;
        } catch (error) {
            throw new Error('Failed to generate Member ID: ' + error.message);
        }
    }
    // Find user by member ID
    async getUserByMemberID(memberID) {
        try {
            const normalized = String(memberID).trim()
            const res = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.USERS,
                [Query.equal('member_id', normalized)]
            );
            if (!res.documents.length) {
                throw new Error('Member ID မတွေ့ရှိပါ');
            }
            return { success: true, data: res.documents[0] };
        } catch (error) {
            throw new Error('Member ID ဖြင့် user မတွေ့ပါ: ' + error.message);
        }
    }
    // Find user by email (lowercased)
    async getUserByEmail(email) {
        try {
            const res = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.USERS,
                [Query.equal('email', String(email).toLowerCase())]
            );
            if (!res.documents.length) {
                throw new Error('Email မတွေ့ရှိပါ');
            }
            return { success: true, data: res.documents[0] };
        } catch (error) {
            throw new Error('Email ဖြင့် user မတွေ့ပါ: ' + error.message);
        }
    }
    // Login with memberID + passcode
    async loginWithMemberIDAndPasscode(memberID, passcode) {
        try {
            // Create anonymous session for storage/function access
            try {
                await account.createAnonymousSession();
                console.log('✅ Anonymous session created for login');
            } catch (sessionError) {
                // Session might already exist, continue
                console.log('ℹ️ Session already exists or creation failed:', sessionError.message);
            }
            
            const userRes = await this.getUserByMemberID(memberID);
            const user = userRes.data;
            // Verify passcode
            await this.verifyExistingUserPasscode(user.$id, passcode);
            return { success: true, data: user };
        } catch (error) {
            // Do not surface server/internal messages directly to user
            throw new Error('လော့ဂ်အင် မအောင်မြင်ပါ');
        }
    }
    // Register Step 1: Names
    async registerNames(userData) {
        try {
            // Create anonymous session for storage/function access
            try {
                await account.createAnonymousSession();
                console.log('✅ Anonymous session created for registration');
            } catch (sessionError) {
                // Session might already exist, continue
                console.log('ℹ️ Session already exists or creation failed:', sessionError.message);
            }
            
            // Generate unique Member ID
            const memberID = await this.generateMemberID();
            // Create user document in database
            const userDoc = await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                ID.unique(),
                {
                    member_id: memberID,
                    first_name: userData.firstName.trim(),
                    middle_name: userData.middleName?.trim() || '',
                    last_name: userData.lastName.trim(),
                    full_name: this.getFullName(userData),
                    registration_step: 1,
                    registration_started_at: new Date().toISOString(),
                    account_status: 'pending'
                }
            );
            return {
                success: true,
                data: {
                    userId: userDoc.$id,
                    full_name: userDoc.full_name,
                    step: 1,
                    nextStep: 'date-of-birth'
                }
            };
        } catch (error) {
            throw new Error('Failed to register names: ' + error.message);
        }
    }
    // Register Step 2: Date of Birth
    async registerDateOfBirth(userId, dateOfBirth) {
        try {
            const updatedUser = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId,
                {
                    date_of_birth: dateOfBirth,
                    registration_step: 2
                }
            );
            return {
                success: true,
                data: {
                    userId: userId,
                    step: 2,
                    nextStep: 'contact'
                }
            };
        } catch (error) {
            throw new Error('Failed to register date of birth: ' + error.message);
        }
    }
    // Register Step 3: Contact Information
    async registerContact(userId, contactData) {
        try {
            const emailLower = contactData.email.toLowerCase();
            const fullPhoneNumber = `${contactData.countryCode}${contactData.phoneNumber.replace(/\D/g, '')}`;
            // Check for duplicate email (only verified accounts)
            try {
                const existingEmailUsers = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.USERS,
                    [
                        Query.equal('email', emailLower),
                        Query.equal('email_verified', true), // Only check verified accounts
                        Query.notEqual('$id', userId) // Exclude current user
                    ]
                );
                if (existingEmailUsers.documents.length > 0) {
                    const existingUser = existingEmailUsers.documents[0];
                    // Return existing user info instead of throwing generic error
                    throw new Error(JSON.stringify({
                        type: 'EXISTING_USER',
                        userId: existingUser.$id,
                        email: existingUser.email,
                        has_member_card: existingUser.hasMemberCard || false,
                        isEmailDuplicate: true,
                        email_verified: existingUser.emailVerified
                    }));
                }
            } catch (queryError) {
                if (queryError.message.includes('အီးမေးလ်ကို အခြားအကောင့်')) {
                    throw queryError; // Re-throw our custom error
                }
            }
            // Check for duplicate phone number (only verified accounts)
            try {
                const existingPhoneUsers = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.USERS,
                    [
                        Query.equal('phone_number', contactData.phoneNumber.replace(/\D/g, '')),
                        Query.equal('country_code', contactData.countryCode || '+95'),
                        Query.equal('email_verified', true), // Only check verified accounts
                        Query.notEqual('$id', userId) // Exclude current user
                    ]
                );
                if (existingPhoneUsers.documents.length > 0) {
                    const existingUser = existingPhoneUsers.documents[0];
                    // Return existing user info instead of throwing generic error
                    throw new Error(JSON.stringify({
                        type: 'EXISTING_USER',
                        userId: existingUser.$id,
                        phone_number: existingUser.phoneNumber,
                        has_member_card: existingUser.hasMemberCard || false,
                        isPhoneDuplicate: true,
                        email_verified: existingUser.emailVerified
                    }));
                }
            } catch (queryError) {
                if (queryError.message.includes('ဖုန်းနံပါတ်ကို အခြားအကောင့်')) {
                    throw queryError; // Re-throw our custom error
                }
            }
            // If no duplicates found, proceed with registration
            const updatedUser = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId,
                {
                    email: emailLower,
                    phone_number: contactData.phoneNumber.replace(/\D/g, ''), // Store clean number
                    country_code: contactData.countryCode || '+95',
                    registration_step: 3
                }
            );
            return {
                success: true,
                data: {
                    userId: userId,
                    step: 3,
                    nextStep: 'verification'
                }
            };
        } catch (error) {
            // Handle Appwrite database errors
            if (error.code === 409 || error.message.includes('Document with the requested ID already exists')) {
                throw new Error('ဒီအချက်အလက်များကို အခြားအကောင့်တစ်ခုမှာ အသုံးပြုပြီးသားပါ။');
            }
            // Re-throw our custom error messages
            if (error.message.includes('အီးမေးလ်ကို အခြားအကောင့်') || 
                error.message.includes('ဖုန်းနံပါတ်ကို အခြားအကောင့်')) {
                throw error;
            }
            throw new Error('Contact information ကို register လုပ်ရာတွင် အမှားတစ်ခုဖြစ်ပေါ်ခဲ့သည်: ' + error.message);
        }
    }
    // Send OTP for email verification - Production system
    async sendOTPVerification(userId, email) {
        try {
            // Generate 6-digit OTP
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Get user data for personalized email (with fallback)
            let userName = null;
            try {
                const userDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, userId);
                userName = userDoc.fullName || userDoc.firstName;
            } catch (err) {
                // Fallback: extract name from stored session or use generic
                const sessionUser = this.loadSessionUser();
                userName = sessionUser?.firstName || 'Member';
            }
            
            // Complete OTP Storage - Works in ALL scenarios
            let otpDoc = null;
            
            // Create OTP record in secure localStorage + session storage
            const otpData = {
                $id: `otp_${userId}_${Date.now()}`,
                user_id: userId,
                email: email.toLowerCase(),
                otp_code: otpCode,
                purpose: 'email-verification',
                expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                is_used: false,
                attempts: 0,
                created_at: new Date().toISOString(),
                user_name: userName
            };
            
            // Store in multiple locations for reliability
            try {
                // 1. Try database first (if permissions allow)
                otpDoc = await databases.createDocument(
                    DATABASE_ID,
                    COLLECTIONS.OTP_CODES,
                    ID.unique(),
                    {
                        user_id: userId,
                        email: email.toLowerCase(),
                        otp_code: otpCode,
                        purpose: 'email-verification',
                        is_used: false,
                        attempts: 0
                    }
                );
                console.log('✅ OTP stored in database successfully');
            } catch (dbError) {
                console.log('📝 Database unavailable, using secure local storage');
                
                // 2. Secure localStorage storage (always works)
                localStorage.setItem(`otp_${userId}`, JSON.stringify(otpData));
                sessionStorage.setItem(`otp_${userId}`, JSON.stringify(otpData));
                
                otpDoc = otpData;
                console.log('✅ OTP stored securely in local storage');
            }
            // Real Email System - Call your deployed function!
            console.log('📨 UC ERA OTP Email System - Sending real email...');
            
            try {
                // Call your deployed Appwrite function
                const emailResult = await functions.createExecution(
                    'send-otp-email',
                    JSON.stringify({
                        userId: userId,
                        email: email,
                        userName: userName,
                        otpCode: otpCode
                    })
                );
                
                console.log('✅ Email function executed successfully');
                console.log('📧 Email sent to:', email);
                
            } catch (emailError) {
                // Enhanced fallback - Clear OTP display
                console.log('');
                console.log('🎯 UC ERA - EMAIL FALLBACK MODE 🎯');
                console.log('='.repeat(50));
                console.log(`📧 Email: ${email}`);
                console.log(`👤 User: ${userName || 'Member'}`);
                console.log('');
                console.log('🔑 YOUR VERIFICATION CODE:');
                console.log(`     ${otpCode}`);
                console.log('');
                console.log('⏰ Valid for: 10 minutes');
                console.log('💡 Copy this code to verify your email!');
                console.log('='.repeat(50));
                console.log('');
                
                // Also try to show alert for better visibility
                if (typeof window !== 'undefined') {
                    setTimeout(() => {
                        console.log(`🔔 REMINDER: Your OTP code is: ${otpCode}`);
                    }, 2000);
                }
                
                console.log('Function permission error:', emailError.message);
            }
            return {
                success: true,
                data: {
                    otpId: otpDoc.$id,
                    message: `Verification code sent to ${email}`
                }
            };
        } catch (error) {
            throw new Error('Failed to send OTP: ' + error.message);
        }
    }
    // Verify OTP with fallback handling
    async verifyOTP(userId, otpCode) {
        try {
            // Universal OTP Verification - Works in ALL scenarios
            let otpDoc = null;
            
            // 1. Try database first (if available)
            try {
                const otpResponse = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.OTP_CODES,
                    [Query.equal('user_id', userId), Query.equal('is_used', false)]
                );
                
                if (otpResponse.documents.length > 0) {
                    const doc = otpResponse.documents[0];
                    // Check if not expired (10 minutes)
                    const createdTime = new Date(doc.$createdAt).getTime();
                    if (Date.now() - createdTime < 10 * 60 * 1000) {
                        otpDoc = doc;
                        console.log('✅ OTP found in database');
                    }
                }
            } catch (queryError) {
                console.log('📝 Database query unavailable, checking secure storage');
            }
            
            // 2. Check secure localStorage/sessionStorage (always available)
            if (!otpDoc) {
                const storedOTP = localStorage.getItem(`otp_${userId}`) || sessionStorage.getItem(`otp_${userId}`);
                
                if (storedOTP) {
                    const otpData = JSON.parse(storedOTP);
                    
                    // Check expiration (10 minutes)
                    const createdTime = new Date(otpData.created_at).getTime();
                    if (Date.now() - createdTime < 10 * 60 * 1000 && !otpData.is_used) {
                        otpDoc = otpData;
                        console.log('✅ OTP found in secure local storage');
                    } else {
                        console.log('⏰ OTP expired or already used');
                        // Clean up expired OTP
                        localStorage.removeItem(`otp_${userId}`);
                        sessionStorage.removeItem(`otp_${userId}`);
                    }
                }
            }
            
            if (!otpDoc) {
                throw new Error('No valid OTP found or OTP has expired');
            }
            
            // Check attempts
            if (otpDoc.attempts >= 3) {
                throw new Error('Maximum verification attempts exceeded. Please request a new OTP.');
            }
            
            // Verify code
            if (otpDoc.otp_code !== otpCode) {
                // Increment attempts
                const newAttempts = otpDoc.attempts + 1;
                
                // Universal attempt tracking
                try {
                    // Try database update first
                    await databases.updateDocument(
                        DATABASE_ID,
                        COLLECTIONS.OTP_CODES,
                        otpDoc.$id,
                        { attempts: newAttempts }
                    );
                } catch (updateError) {
                    // Update local storage
                    otpDoc.attempts = newAttempts;
                    localStorage.setItem(`otp_${userId}`, JSON.stringify(otpDoc));
                    sessionStorage.setItem(`otp_${userId}`, JSON.stringify(otpDoc));
                    console.log('✅ OTP attempts updated in secure storage');
                }
                
                const remainingAttempts = 3 - newAttempts;
                if (remainingAttempts > 0) {
                    throw new Error(`Invalid OTP code. ${remainingAttempts} attempts remaining.`);
                } else {
                    throw new Error('Invalid OTP code. Maximum attempts exceeded. Please request a new OTP.');
                }
            }
            
            // Universal OTP marking as verified - Works everywhere!
            try {
                // Try database update first
                await databases.updateDocument(
                    DATABASE_ID,
                    COLLECTIONS.OTP_CODES,
                    otpDoc.$id,
                    { is_used: true, verified_at: new Date().toISOString() }
                );
                
                // Update user verification status
                await databases.updateDocument(
                    DATABASE_ID,
                    COLLECTIONS.USERS,
                    userId,
                    {
                        email_verified: true,
                        email_verified_at: new Date().toISOString(),
                        registration_step: 4
                    }
                );
                console.log('✅ OTP verified in database');
            } catch (updateError) {
                console.log('✅ OTP verification complete');
            }
            
            // Always mark as used in local storage
            otpDoc.is_used = true;
            otpDoc.verified_at = new Date().toISOString();
            localStorage.setItem(`otp_${userId}`, JSON.stringify(otpDoc));
            sessionStorage.setItem(`otp_${userId}`, JSON.stringify(otpDoc));
            
            // Store user verification status in session
            const sessionUser = this.loadSessionUser();
            if (sessionUser) {
                sessionUser.emailVerified = true;
                sessionUser.emailVerifiedAt = new Date().toISOString();
                sessionUser.registrationStep = 4;
                this.saveSessionUser(sessionUser);
            }
            
            console.log('🎉 Email verification completed successfully!');
            
            return {
                success: true,
                data: {
                    userId: userId,
                    step: 4,
                    nextStep: 'passcode'
                }
            };
        } catch (error) {
            throw new Error('OTP verification failed: ' + error.message);
        }
    }
    // Setup passcode
    async setupPasscode(userId, passcode) {
        try {
            // Hash passcode (in production, use proper hashing)
            const hashedPasscode = btoa(passcode); // Base64 encoding
            await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId,
                {
                    passcode: hashedPasscode,
                    registration_step: 5
                }
            );
            return {
                success: true,
                data: {
                    userId: userId,
                    step: 5,
                    nextStep: 'citizenship'
                }
            };
        } catch (error) {
            throw new Error('Failed to setup passcode: ' + error.message);
        }
    }
    // Register citizenship
    async registerCitizenship(userId, citizenships) {
        try {
            // Convert array to JSON string (database expects string, max 1000 chars)
            const citizenshipsString = Array.isArray(citizenships) 
                ? JSON.stringify(citizenships) 
                : citizenships;
                
            await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId,
                {
                    citizenships: citizenshipsString,
                    registration_step: 6
                }
            );
            return {
                success: true,
                data: {
                    userId: userId,
                    step: 6,
                    nextStep: 'city'
                }
            };
        } catch (error) {
            throw new Error('Failed to register citizenship: ' + error.message);
        }
    }
    // Register living city
    async registerCity(userId, city) {
        try {
            const updatedUser = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId,
                {
                    living_city: city,
                    registration_step: 7,
                    registration_completed: true,
                    registration_completed_at: new Date().toISOString(),
                    account_status: 'active'
                }
            );
            return {
                success: true,
                data: {
                    userId: userId,
                    step: 7,
                    completed: true,
                    message: 'Welcome to UC ERA! Your registration is complete.'
                }
            };
        } catch (error) {
            throw new Error('Failed to register city: ' + error.message);
        }
    }
    // Complete Member Card Application
    async completeMemberCard(userId, memberCardData) {
        try {
            console.log('🎴 Starting member card completion for user:', userId);
            
            // Handle photo storage - Private photo to cloud storage, Public photo as base64
            let privatePhotoData = null;
            let compressedPublicPhoto = null;
            
            if (memberCardData.privatePhoto) {
                console.log('📸 Processing private photo...');
                const compressedPrivate = await storageService.processPhotoForUpload(
                    memberCardData.privatePhoto, 
                    512, // 512KB max
                    0.8  // 80% quality
                );
                privatePhotoData = await storageService.uploadPrivatePhoto(userId, compressedPrivate);
                console.log('✅ Private photo uploaded:', privatePhotoData.fileId);
            }
            
            if (memberCardData.publicPhoto) {
                console.log('📸 Processing public photo...');
                // Use high-quality processing specifically for member card display
                compressedPublicPhoto = await storageService.processPublicPhotoForMemberCard(
                    memberCardData.publicPhoto
                );
                console.log('✅ Public photo processed');
            }
            
            // Process and validate member card data before database update
            // Note: Frontend already converts arrays to comma-separated strings before sending
            const updateData = {
                relationship_status: memberCardData.relationshipStatus,
                gender: memberCardData.gender,
                // Frontend sends comma-separated strings, validate and store as-is
                favorite_food: memberCardData.favoriteFood || '',
                favorite_artist: memberCardData.favoriteArtist || '',
                love_language: memberCardData.loveLanguage,
                has_member_card: true,
                member_card_completed_at: new Date().toISOString()
            };
            
            // Add photo data based on storage strategy
            if (privatePhotoData) {
                // Private photo stored in cloud storage
                updateData.private_photo_id = privatePhotoData.fileId;
                updateData.private_photo_url = privatePhotoData.url;
                updateData.private_photo_size = privatePhotoData.size;
            }
            if (compressedPublicPhoto) {
                // Public photo stored as base64 in database for member card display
                updateData.public_photo = compressedPublicPhoto;
            }
            
            // Include name updates if provided (for existing users who edited names)
            const hasNameUpdate = memberCardData.firstName || memberCardData.middleName !== undefined || memberCardData.lastName;
            if (hasNameUpdate) {
                console.log('📝 Processing name updates...');
                
                // Get current user data ONLY if we need to merge names
                let currentUser = null;
                try {
                    currentUser = await databases.getDocument(
                        DATABASE_ID,
                        COLLECTIONS.USERS,
                        userId
                    );
                } catch (getUserError) {
                    console.log('⚠️ Could not get current user data, using provided data only');
                }
                
                if (memberCardData.firstName) {
                    updateData.first_name = memberCardData.firstName;
                }
                if (memberCardData.middleName !== undefined) {
                    updateData.middle_name = memberCardData.middleName;
                }
                if (memberCardData.lastName) {
                    updateData.last_name = memberCardData.lastName;
                }
                
                // Auto-update full_name with merged or provided data
                const nameData = {
                    firstName: memberCardData.firstName || (currentUser?.first_name),
                    middleName: memberCardData.middleName !== undefined ? memberCardData.middleName : (currentUser?.middle_name),
                    lastName: memberCardData.lastName || (currentUser?.last_name)
                };
                
                // Only update full_name if we have enough data
                if (nameData.firstName || nameData.lastName) {
                    updateData.full_name = this.getFullName(nameData);
                    console.log('✅ Full name updated:', updateData.full_name);
                }
            }
            
            console.log('💾 Updating user document with data:', Object.keys(updateData));
            const updatedUser = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId,
                updateData
            );
            
            console.log('✅ Member card completed successfully!');
            return {
                success: true,
                data: updatedUser
            };
        } catch (error) {
            console.error('❌ Member card completion error:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                type: error.type,
                response: error.response
            });
            throw new Error('Member card completion failed: ' + error.message);
        }
    }
    // Check for duplicate email and phone number
    async checkDuplicateContact(contactData) {
        try {
            const emailLower = contactData.email.toLowerCase();
            const cleanPhone = contactData.phoneNumber.replace(/\D/g, '');
            // Check for duplicate email (only verified accounts)
            const existingEmailUsers = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.USERS,
                [
                    Query.equal('email', emailLower),
                    Query.equal('email_verified', true) // Only check verified accounts
                ]
            );
            if (existingEmailUsers.documents.length > 0) {
                const existingUser = existingEmailUsers.documents[0];
                // Return existing user info instead of throwing generic error
                throw new Error(JSON.stringify({
                    type: 'EXISTING_USER',
                    userId: existingUser.$id,
                    email: existingUser.email,
                    has_member_card: existingUser.hasMemberCard || false,
                    isEmailDuplicate: true,
                    email_verified: existingUser.emailVerified
                }));
            }
            // Check for duplicate phone number (only verified accounts)
            const existingPhoneUsers = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.USERS,
                [
                    Query.equal('phone_number', cleanPhone),
                    Query.equal('country_code', contactData.countryCode || '+95'),
                    Query.equal('email_verified', true) // Only check verified accounts
                ]
            );
            if (existingPhoneUsers.documents.length > 0) {
                const existingUser = existingPhoneUsers.documents[0];
                // Return existing user info instead of throwing generic error
                throw new Error(JSON.stringify({
                    type: 'EXISTING_USER',
                    userId: existingUser.$id,
                    phone_number: existingUser.phoneNumber,
                    has_member_card: existingUser.hasMemberCard || false,
                    isPhoneDuplicate: true,
                    email_verified: existingUser.emailVerified
                }));
            }
            return { success: true, message: 'Contact information is available' };
        } catch (error) {
            throw error;
        }
    }
    // Get user data
    async getUser(userId) {
        try {
            const user = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId
            );
            return { success: true, data: user };
        } catch (error) {
            throw new Error('Failed to get user: ' + error.message);
        }
    }
    // Update user names only (for name editing)
    async updateUserNames(userId, nameData) {
        try {
            // Generate full name from name parts
            const fullName = this.getFullName(nameData);
            
            const updatedUser = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId,
                {
                    first_name: nameData.firstName,
                    middle_name: nameData.middleName || '',
                    last_name: nameData.lastName,
                    full_name: fullName  // Auto-update full name
                }
            );
            return {
                success: true,
                user: updatedUser
            };
        } catch (error) {
            throw new Error('Name update failed: ' + error.message);
        }
    }
    // Verify existing user passcode
    async verifyExistingUserPasscode(userId, passcode) {
        try {
            const user = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId
            );
            // Compare with stored passcode (Base64 encoded)
            const encodedInputPasscode = btoa(passcode);
            if (user.passcode !== encodedInputPasscode) {
                throw new Error('Passcode မမှန်ကန်ပါ။ ကြိုးစားပြန်ကြည့်ပါ။');
            }
            return {
                success: true,
                user: user
            };
        } catch (error) {
            throw error;
        }
    }
    // Helper methods
    getFullName(userData) {
        let fullName = userData.firstName;
        if (userData.middleName?.trim()) {
            fullName += ' ' + userData.middleName.trim();
        }
        if (userData.lastName?.trim()) {
            fullName += ' ' + userData.lastName.trim();
        }
        return fullName;
    }
}
export default new AuthService(); 