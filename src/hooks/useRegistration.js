import { useState } from 'react';
import authService from '../services/auth.js';

export const useRegistration = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [registrationData, setRegistrationData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        dateOfBirth: '',
        email: '',
        phoneNumber: '',
        countryCode: '+95',
        citizenships: [],
        livingCity: '',
        passcode: ''
    });

    // Helper function to handle API calls with loading states
    const handleApiCall = async (apiCall, successMessage) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const result = await apiCall();
            console.log('✅', successMessage, result);
            return result;
        } catch (err) {
            console.error('❌', err.message);
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Check for duplicate email and phone before registration
    const checkDuplicateContact = async (contactData) => {
        return handleApiCall(async () => {
            return await authService.checkDuplicateContact(contactData);
        }, 'Duplicate check completed');
    };

    // Step 1: Register Names
    const registerNames = async (nameData) => {
        return handleApiCall(async () => {
            const result = await authService.registerNames(nameData);
            setCurrentUserId(result.data.userId);
            setRegistrationData(prev => ({
                ...prev,
                firstName: nameData.firstName,
                middleName: nameData.middleName || '',
                lastName: nameData.lastName
            }));
            return result;
        }, 'Names registered successfully');
    };

    // Step 2: Register Date of Birth
    const registerDateOfBirth = async (dateOfBirth) => {
        if (!currentUserId) throw new Error('User ID not found');
        
        return handleApiCall(async () => {
            const result = await authService.registerDateOfBirth(currentUserId, dateOfBirth);
            setRegistrationData(prev => ({ ...prev, dateOfBirth }));
            return result;
        }, 'Date of birth registered successfully');
    };

    // Step 3: Register Contact Information
    const registerContact = async (contactData) => {
        if (!currentUserId) throw new Error('User ID not found');
        
        return handleApiCall(async () => {
            const result = await authService.registerContact(currentUserId, contactData);
            setRegistrationData(prev => ({
                ...prev,
                email: contactData.email,
                phoneNumber: contactData.phoneNumber,
                countryCode: contactData.countryCode
            }));
            return result;
        }, 'Contact information registered successfully');
    };

    // Step 4: Send OTP Verification
    const sendOTPVerification = async (email) => {
        if (!currentUserId) throw new Error('User ID not found');
        
        return handleApiCall(async () => {
            return await authService.sendOTPVerification(currentUserId, email);
        }, 'OTP sent successfully');
    };

    // Step 5: Verify OTP
    const verifyOTP = async (otpCode) => {
        if (!currentUserId) throw new Error('User ID not found');
        
        return handleApiCall(async () => {
            return await authService.verifyOTP(currentUserId, otpCode);
        }, 'OTP verified successfully');
    };

    // Step 6: Setup Passcode
    const setupPasscode = async (passcode) => {
        if (!currentUserId) throw new Error('User ID not found');
        
        return handleApiCall(async () => {
            const result = await authService.setupPasscode(currentUserId, passcode);
            setRegistrationData(prev => ({ ...prev, passcode }));
            return result;
        }, 'Passcode setup successfully');
    };

    // Step 7: Register Citizenship
    const registerCitizenship = async (citizenships) => {
        if (!currentUserId) throw new Error('User ID not found');
        
        return handleApiCall(async () => {
            const result = await authService.registerCitizenship(currentUserId, citizenships);
            setRegistrationData(prev => ({ ...prev, citizenships }));
            return result;
        }, 'Citizenship registered successfully');
    };

    // Step 8: Register Living City
    const registerCity = async (city) => {
        if (!currentUserId) throw new Error('User ID not found');
        
        return handleApiCall(async () => {
            const result = await authService.registerCity(currentUserId, city);
            setRegistrationData(prev => ({ ...prev, livingCity: city }));
            return result;
        }, 'Registration completed successfully');
    };

    // Get user data
    const getUserData = async () => {
        if (!currentUserId) throw new Error('User ID not found');
        
        return handleApiCall(async () => {
            return await authService.getUser(currentUserId);
        }, 'User data retrieved successfully');
    };

    // Reset registration state
    const resetRegistration = () => {
        setCurrentUserId(null);
        setRegistrationData({
            firstName: '',
            middleName: '',
            lastName: '',
            dateOfBirth: '',
            email: '',
            phoneNumber: '',
            countryCode: '+95',
            citizenships: [],
            livingCity: '',
            passcode: ''
        });
        setError(null);
    };

    return {
        // State
        isLoading,
        error,
        currentUserId,
        registrationData,
        
        // Actions
        registerNames,
        registerDateOfBirth,
        registerContact,
        sendOTPVerification,
        verifyOTP,
        setupPasscode,
        registerCitizenship,
        registerCity,
        getUserData,
        resetRegistration,
        checkDuplicateContact,
        verifyExistingUserPasscode: (userId, passcode) => authService.verifyExistingUserPasscode(userId, passcode),
        completeMemberCard: (userId, memberCardData) => authService.completeMemberCard(userId, memberCardData),
        
        // Helpers
        setError: (err) => setError(err)
    };
}; 