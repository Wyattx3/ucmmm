import { account, databases, functions, DATABASE_ID, COLLECTIONS, ID, Query } from '../lib/appwrite.js';

class AuthService {
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
            
            const updatedUser = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId,
                {
                    email: contactData.email.toLowerCase(),
                    phoneNumber: contactData.phoneNumber,
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
            throw new Error('Failed to register contact: ' + error.message);
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