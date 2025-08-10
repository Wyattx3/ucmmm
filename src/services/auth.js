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
    clearSessionUser() { try { localStorage.removeItem('ucera_session_user') } catch {} }

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
                
                console.log('🔢 Generated Member ID:', memberID);
                
                // Check if this Member ID already exists
                try {
                    const existingUsers = await databases.listDocuments(
                        DATABASE_ID,
                        COLLECTIONS.USERS,
                        [Query.equal('memberID', memberID)]
                    );
                    
                    if (existingUsers.documents.length === 0) {
                        isUnique = true;
                        console.log('✅ Member ID is unique:', memberID);
                    } else {
                        console.log('🔄 Member ID already exists, generating new one...');
                        attempts++;
                    }
                } catch (error) {
                    console.warn('⚠️ Error checking Member ID uniqueness:', error.message);
                    // If we can't check, assume it's unique to avoid infinite loop
                    isUnique = true;
                }
            }

            if (!isUnique) {
                throw new Error('Failed to generate unique Member ID after multiple attempts');
            }

            return memberID;
        } catch (error) {
            console.error('❌ Error generating Member ID:', error);
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
                [Query.equal('memberID', normalized)]
            );
            if (!res.documents.length) {
                throw new Error('Member ID မတွေ့ရှိပါ');
            }
            return { success: true, data: res.documents[0] };
        } catch (error) {
            console.error('❌ Error getUserByMemberID:', error);
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
            console.error('❌ Error getUserByEmail:', error);
            throw new Error('Email ဖြင့် user မတွေ့ပါ: ' + error.message);
        }
    }

    // Login with memberID + passcode
    async loginWithMemberIDAndPasscode(memberID, passcode) {
        try {
            const userRes = await this.getUserByMemberID(memberID);
            const user = userRes.data;
            // Verify passcode
            await this.verifyExistingUserPasscode(user.$id, passcode);
            return { success: true, data: user };
        } catch (error) {
            console.error('❌ Login failed');
            // Do not surface server/internal messages directly to user
            throw new Error('လော့ဂ်အင် မအောင်မြင်ပါ');
        }
    }

    // Register Step 1: Names
    async registerNames(userData) {
        try {
            console.log('📝 Registering names:', userData);
            
            // Generate unique Member ID
            const memberID = await this.generateMemberID();
            
            // Create user document in database
            const userDoc = await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                ID.unique(),
                {
                    memberID: memberID,
                    firstName: userData.firstName.trim(),
                    middleName: userData.middleName?.trim() || '',
                    lastName: userData.lastName.trim(),
                    fullName: this.getFullName(userData),
                    registrationStep: 1,
                    registrationStartedAt: new Date().toISOString(),
                    accountStatus: 'pending'
                }
            );

            console.log('✅ Names registered successfully with Member ID:', userDoc.memberID);
            return {
                success: true,
                data: {
                    userId: userDoc.$id,
                    fullName: userDoc.fullName,
                    step: 1,
                    nextStep: 'date-of-birth'
                }
            };
        } catch (error) {
            console.error('❌ Error registering names:', error);
            throw new Error('Failed to register names: ' + error.message);
        }
    }

    // Register Step 2: Date of Birth
    async registerDateOfBirth(userId, dateOfBirth) {
        try {
            console.log('📅 Registering date of birth for user:', userId);
            
            const updatedUser = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId,
                {
                    dateOfBirth: dateOfBirth,
                    registrationStep: 2
                }
            );

            console.log('✅ Date of birth registered successfully');
            return {
                success: true,
                data: {
                    userId: userId,
                    step: 2,
                    nextStep: 'contact'
                }
            };
        } catch (error) {
            console.error('❌ Error registering date of birth:', error);
            throw new Error('Failed to register date of birth: ' + error.message);
        }
    }

    // Register Step 3: Contact Information
    async registerContact(userId, contactData) {
        try {
            console.log('📞 Registering contact info for user:', userId);
            
            const emailLower = contactData.email.toLowerCase();
            const fullPhoneNumber = `${contactData.countryCode}${contactData.phoneNumber.replace(/\D/g, '')}`;
            
            // Check for duplicate email (only verified accounts)
            console.log('🔍 Checking for duplicate email:', emailLower);
            try {
                const existingEmailUsers = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.USERS,
                    [
                        Query.equal('email', emailLower),
                        Query.equal('emailVerified', true), // Only check verified accounts
                        Query.notEqual('$id', userId) // Exclude current user
                    ]
                );
                
                if (existingEmailUsers.documents.length > 0) {
                    const existingUser = existingEmailUsers.documents[0];
                    console.log('📧 Found existing VERIFIED user with email:', emailLower);
                    // Return existing user info instead of throwing generic error
                    throw new Error(JSON.stringify({
                        type: 'EXISTING_USER',
                        userId: existingUser.$id,
                        email: existingUser.email,
                        hasMemberCard: existingUser.hasMemberCard || false,
                        isEmailDuplicate: true,
                        emailVerified: existingUser.emailVerified
                    }));
                }
            } catch (queryError) {
                if (queryError.message.includes('အီးမေးလ်ကို အခြားအကောင့်')) {
                    throw queryError; // Re-throw our custom error
                }
                console.warn('⚠️ Could not check email duplicates:', queryError.message);
            }
            
            // Check for duplicate phone number (only verified accounts)
            console.log('🔍 Checking for duplicate phone number:', fullPhoneNumber);
            try {
                const existingPhoneUsers = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.USERS,
                    [
                        Query.equal('phoneNumber', contactData.phoneNumber.replace(/\D/g, '')),
                        Query.equal('countryCode', contactData.countryCode || '+95'),
                        Query.equal('emailVerified', true), // Only check verified accounts
                        Query.notEqual('$id', userId) // Exclude current user
                    ]
                );
                
                if (existingPhoneUsers.documents.length > 0) {
                    const existingUser = existingPhoneUsers.documents[0];
                    console.log('📱 Found existing VERIFIED user with phone:', fullPhoneNumber);
                    // Return existing user info instead of throwing generic error
                    throw new Error(JSON.stringify({
                        type: 'EXISTING_USER',
                        userId: existingUser.$id,
                        phoneNumber: existingUser.phoneNumber,
                        hasMemberCard: existingUser.hasMemberCard || false,
                        isPhoneDuplicate: true,
                        emailVerified: existingUser.emailVerified
                    }));
                }
            } catch (queryError) {
                if (queryError.message.includes('ဖုန်းနံပါတ်ကို အခြားအကောင့်')) {
                    throw queryError; // Re-throw our custom error
                }
                console.warn('⚠️ Could not check phone duplicates:', queryError.message);
            }
            
            // If no duplicates found, proceed with registration
            const updatedUser = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId,
                {
                    email: emailLower,
                    phoneNumber: contactData.phoneNumber.replace(/\D/g, ''), // Store clean number
                    countryCode: contactData.countryCode || '+95',
                    registrationStep: 3
                }
            );

            console.log('✅ Contact info registered successfully');
            return {
                success: true,
                data: {
                    userId: userId,
                    step: 3,
                    nextStep: 'verification'
                }
            };
        } catch (error) {
            console.error('❌ Error registering contact:', error);
            
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

    // Send OTP for email verification
    async sendOTPVerification(userId, email) {
        try {
            console.log('📧 Sending OTP to:', email);
            
            // Generate 6-digit OTP
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Get user data for personalized email
            let userName = null;
            try {
                const userDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, userId);
                userName = userDoc.fullName || userDoc.firstName;
            } catch (err) {
                console.warn('Could not get user name for email:', err.message);
            }
            
            // Store OTP in database
            const otpDoc = await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.OTP_CODES,
                ID.unique(),
                {
                    userId: userId,
                    email: email.toLowerCase(),
                    otpCode: otpCode,
                    purpose: 'email-verification',
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
                    isUsed: false,
                    attempts: 0
                }
            );

            // Send email using cloud function
            try {
                console.log('🚀 Triggering cloud function for email sending...');
                
                const functionResponse = await functions.createExecution(
                    'send-otp-email', // Function ID
                    JSON.stringify({
                        userId: userId,
                        email: email,
                        userName: userName,
                        otpCode: otpCode
                    }), // Data payload
                    false, // Not async
                    '/',    // Path
                    'POST'  // Method
                );

                console.log('✅ Email function executed successfully:', functionResponse);
                
                // Update OTP record with email sent status
                try {
                    await databases.updateDocument(
                        DATABASE_ID,
                        COLLECTIONS.OTP_CODES,
                        otpDoc.$id,
                        {
                            emailSentAt: new Date().toISOString()
                        }
                    );
                    console.log('📝 OTP record updated with email sent status');
                } catch (updateError) {
                    console.warn('Could not update OTP record:', updateError.message);
                }
                
            } catch (emailError) {
                console.error('⚠️ Email sending failed, but OTP is saved:', emailError.message);
                console.error('Full error details:', emailError);
                // Don't fail the entire process if email fails
                console.log('📨 OTP for debugging:', otpCode); // Fallback for development
            }
            
            return {
                success: true,
                data: {
                    otpId: otpDoc.$id,
                    message: `Verification code sent to ${email}`
                }
            };
        } catch (error) {
            console.error('❌ Error sending OTP:', error);
            throw new Error('Failed to send OTP: ' + error.message);
        }
    }

    // Verify OTP
    async verifyOTP(userId, otpCode) {
        try {
            console.log('🔍 Verifying OTP for user:', userId);
            
            // Find valid OTP
            const otpResponse = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.OTP_CODES,
                [
                    Query.equal('userId', userId),
                    Query.equal('isUsed', false),
                    Query.greaterThan('expiresAt', new Date().toISOString())
                ]
            );

            if (otpResponse.documents.length === 0) {
                throw new Error('No valid OTP found or OTP has expired');
            }

            const otpDoc = otpResponse.documents[0];
            
            // Check attempts
            if (otpDoc.attempts >= 3) {
                throw new Error('Maximum verification attempts exceeded. Please request a new OTP.');
            }

            // Verify code
            if (otpDoc.otpCode !== otpCode) {
                // Increment attempts
                await databases.updateDocument(
                    DATABASE_ID,
                    COLLECTIONS.OTP_CODES,
                    otpDoc.$id,
                    { attempts: otpDoc.attempts + 1 }
                );
                
                const remainingAttempts = 3 - (otpDoc.attempts + 1);
                if (remainingAttempts > 0) {
                    throw new Error(`Invalid OTP code. ${remainingAttempts} attempts remaining.`);
                } else {
                    throw new Error('Invalid OTP code. Maximum attempts exceeded. Please request a new OTP.');
                }
            }

            // Mark OTP as used
            await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.OTP_CODES,
                otpDoc.$id,
                {
                    isUsed: true,
                    verifiedAt: new Date().toISOString()
                }
            );

            // Update user
            await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId,
                {
                    emailVerified: true,
                    emailVerifiedAt: new Date().toISOString(),
                    registrationStep: 4
                }
            );

            console.log('✅ OTP verified successfully');
            return {
                success: true,
                data: {
                    userId: userId,
                    step: 4,
                    nextStep: 'passcode'
                }
            };
        } catch (error) {
            console.error('❌ Error verifying OTP:', error);
            throw new Error('OTP verification failed: ' + error.message);
        }
    }

    // Setup passcode
    async setupPasscode(userId, passcode) {
        try {
            console.log('🔐 Setting up passcode for user:', userId);
            
            // Hash passcode (in production, use proper hashing)
            const hashedPasscode = btoa(passcode); // Simple encoding for demo
            
            await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId,
                {
                    passcode: hashedPasscode,
                    registrationStep: 5
                }
            );

            console.log('✅ Passcode setup successfully');
            return {
                success: true,
                data: {
                    userId: userId,
                    step: 5,
                    nextStep: 'citizenship'
                }
            };
        } catch (error) {
            console.error('❌ Error setting up passcode:', error);
            throw new Error('Failed to setup passcode: ' + error.message);
        }
    }

    // Register citizenship
    async registerCitizenship(userId, citizenships) {
        try {
            console.log('🏴 Registering citizenship for user:', userId);
            
            await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId,
                {
                    citizenships: citizenships,
                    registrationStep: 6
                }
            );

            console.log('✅ Citizenship registered successfully');
            return {
                success: true,
                data: {
                    userId: userId,
                    step: 6,
                    nextStep: 'city'
                }
            };
        } catch (error) {
            console.error('❌ Error registering citizenship:', error);
            throw new Error('Failed to register citizenship: ' + error.message);
        }
    }

    // Register living city
    async registerCity(userId, city) {
        try {
            console.log('🏙️ Registering city for user:', userId);
            
            const updatedUser = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId,
                {
                    livingCity: city,
                    registrationStep: 7,
                    registrationCompleted: true,
                    registrationCompletedAt: new Date().toISOString(),
                    accountStatus: 'active'
                }
            );

            console.log('✅ Registration completed successfully for Member ID:', updatedUser.memberID);
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
            console.error('❌ Error registering city:', error);
            throw new Error('Failed to register city: ' + error.message);
        }
    }

    // Complete Member Card Application
    async completeMemberCard(userId, memberCardData) {
        try {
            console.log('🎴 Completing member card for user:', userId);
            console.log('🎴 Member card data received:', memberCardData);
            
            // Handle photo storage - Private photo to cloud storage, Public photo as base64
            let privatePhotoData = null;
            let compressedPublicPhoto = null;
            
            if (memberCardData.privatePhoto) {
                console.log('📸 Processing private photo for cloud storage...');
                const compressedPrivate = await storageService.processPhotoForUpload(
                    memberCardData.privatePhoto, 
                    512, // 512KB max
                    0.8  // 80% quality
                );
                privatePhotoData = await storageService.uploadPrivatePhoto(userId, compressedPrivate);
            }
            
            if (memberCardData.publicPhoto) {
                console.log('📸 Processing public photo for base64 storage...');
                // Compress public photo but don't upload to cloud storage
                compressedPublicPhoto = await storageService.processPhotoForUpload(
                    memberCardData.publicPhoto,
                    1024, // 1MB max  
                    0.9   // 90% quality (higher quality for member card display)
                );
                console.log('📸 Public photo compressed for database storage');
            }
            
            // Process and validate member card data before database update
            // Note: Frontend already converts arrays to comma-separated strings before sending
            const updateData = {
                relationshipStatus: memberCardData.relationshipStatus,
                gender: memberCardData.gender,
                // Frontend sends comma-separated strings, validate and store as-is
                favoriteFood: memberCardData.favoriteFood || '',
                favoriteArtist: memberCardData.favoriteArtist || '',
                loveLanguage: memberCardData.loveLanguage,
                hasMemberCard: true,
                memberCardCompletedAt: new Date().toISOString()
            };

            console.log('📝 Member card data validation:', {
                favoriteFood: `${typeof updateData.favoriteFood} - "${updateData.favoriteFood}"`,
                favoriteArtist: `${typeof updateData.favoriteArtist} - "${updateData.favoriteArtist}"`,
                relationshipStatus: updateData.relationshipStatus,
                gender: updateData.gender,
                loveLanguage: updateData.loveLanguage
            });

            // Add photo data based on storage strategy
            if (privatePhotoData) {
                // Private photo stored in cloud storage
                updateData.privatePhotoId = privatePhotoData.fileId;
                updateData.privatePhotoUrl = privatePhotoData.url;
                updateData.privatePhotoSize = privatePhotoData.size;
                console.log('📸 Private photo cloud storage data added:', privatePhotoData);
            }
            
            if (compressedPublicPhoto) {
                // Public photo stored as base64 in database for member card display
                updateData.publicPhoto = compressedPublicPhoto;
                console.log('📸 Public photo base64 data added for member card display');
            }

            // Include name updates if provided (for existing users who edited names)
            if (memberCardData.firstName) {
                updateData.firstName = memberCardData.firstName;
            }
            if (memberCardData.middleName !== undefined) {
                updateData.middleName = memberCardData.middleName;
            }
            if (memberCardData.lastName) {
                updateData.lastName = memberCardData.lastName;
            }

            console.log('📝 Final update data being sent to database:', updateData);
            
            const updatedUser = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId,
                updateData
            );
            
            console.log('✅ Member card completed successfully');
            console.log('📄 Updated user document:', updatedUser);
            return {
                success: true,
                data: updatedUser
            };
        } catch (error) {
            console.error('❌ Error completing member card:', error);
            throw new Error('Member card completion failed: ' + error.message);
        }
    }

    // Check for duplicate email and phone number
    async checkDuplicateContact(contactData) {
        try {
            console.log('🔍 Checking for duplicate contact info');
            const emailLower = contactData.email.toLowerCase();
            const cleanPhone = contactData.phoneNumber.replace(/\D/g, '');
            
            // Check for duplicate email (only verified accounts)
            const existingEmailUsers = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.USERS,
                [
                    Query.equal('email', emailLower),
                    Query.equal('emailVerified', true) // Only check verified accounts
                ]
            );
            
            if (existingEmailUsers.documents.length > 0) {
                const existingUser = existingEmailUsers.documents[0];
                console.log('📧 Found existing VERIFIED user with email:', emailLower);
                // Return existing user info instead of throwing generic error
                throw new Error(JSON.stringify({
                    type: 'EXISTING_USER',
                    userId: existingUser.$id,
                    email: existingUser.email,
                    hasMemberCard: existingUser.hasMemberCard || false,
                    isEmailDuplicate: true,
                    emailVerified: existingUser.emailVerified
                }));
            }
            
            // Check for duplicate phone number (only verified accounts)
            const existingPhoneUsers = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.USERS,
                [
                    Query.equal('phoneNumber', cleanPhone),
                    Query.equal('countryCode', contactData.countryCode || '+95'),
                    Query.equal('emailVerified', true) // Only check verified accounts
                ]
            );
            
            if (existingPhoneUsers.documents.length > 0) {
                const existingUser = existingPhoneUsers.documents[0];
                console.log('📱 Found existing VERIFIED user with phone:', cleanPhone);
                // Return existing user info instead of throwing generic error
                throw new Error(JSON.stringify({
                    type: 'EXISTING_USER',
                    userId: existingUser.$id,
                    phoneNumber: existingUser.phoneNumber,
                    hasMemberCard: existingUser.hasMemberCard || false,
                    isPhoneDuplicate: true,
                    emailVerified: existingUser.emailVerified
                }));
            }
            
            console.log('✅ No duplicates found');
            return { success: true, message: 'Contact information is available' };
        } catch (error) {
            console.error('❌ Error checking duplicates:', error);
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
            console.error('❌ Error getting user:', error);
            throw new Error('Failed to get user: ' + error.message);
        }
    }

    // Update user names only (for name editing)
    async updateUserNames(userId, nameData) {
        try {
            console.log('📝 Updating user names:', userId, nameData);
            
            const updatedUser = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId,
                {
                    firstName: nameData.firstName,
                    middleName: nameData.middleName || '',
                    lastName: nameData.lastName
                }
            );
            
            console.log('✅ User names updated successfully');
            return {
                success: true,
                user: updatedUser
            };
        } catch (error) {
            console.error('❌ Error updating user names:', error);
            throw new Error('Name update failed: ' + error.message);
        }
    }

    // Verify existing user passcode
    async verifyExistingUserPasscode(userId, passcode) {
        try {
            console.log('🔐 Verifying existing user passcode for:', userId);
            
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
            
            console.log('✅ Existing user passcode verified successfully');
            return {
                success: true,
                user: user
            };
        } catch (error) {
            console.error('❌ Error verifying existing user passcode:', error);
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