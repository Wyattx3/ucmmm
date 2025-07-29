# 🚀 UC ERA Appwrite Integration Guide

## ✅ Completed Setup

### 🗄️ Database Structure
**Database ID:** `ucera-main`

#### 👥 Users Collection (`users`)
Complete user profile and registration tracking:

```javascript
{
  // Personal Information
  firstName: string(100) [required]
  middleName: string(100) [optional] 
  lastName: string(100) [required]
  fullName: string(300) [required]
  dateOfBirth: datetime [optional]
  
  // Contact Information
  email: email [optional]
  phoneNumber: string(20) [optional]
  countryCode: string(10) [optional]
  
  // Email Verification
  emailVerified: boolean [optional]
  emailVerifiedAt: datetime [optional]
  
  // Security
  passcode: string(100) [optional] // Hashed
  
  // Myanmar Cultural Data
  citizenships: string(500)[] [optional] // Array of ethnic groups
  livingCity: string(100) [optional]
  
  // Registration Progress
  registrationStep: integer(0-10) [required]
  registrationCompleted: boolean [optional]
  registrationStartedAt: datetime [optional]
  registrationCompletedAt: datetime [optional]
  accountStatus: string(20) [optional] // pending, active, suspended
}
```

#### 📧 OTP Codes Collection (`otp_codes`)
Email verification system:

```javascript
{
  userId: string(50) [required] // Reference to user
  email: email [required]
  otpCode: string(10) [required] // 6-digit code
  purpose: string(50) [required] // email-verification, etc.
  expiresAt: datetime [required] // 10 minutes expiration
  attempts: integer(0-10) [optional] // Max 3 attempts
  isUsed: boolean [optional]
  verifiedAt: datetime [optional]
}
```

### 🔧 Frontend Integration Files

#### `src/lib/appwrite.js`
- Appwrite client configuration
- Database and collection constants
- Service exports (account, databases)

#### `src/services/auth.js` 
Complete authentication service with methods:
- `registerNames()` - Step 1: User names
- `registerDateOfBirth()` - Step 2: Birth date
- `registerContact()` - Step 3: Email/phone
- `sendOTPVerification()` - Step 4: Send OTP
- `verifyOTP()` - Step 5: Verify email
- `setupPasscode()` - Step 6: Security code
- `registerCitizenship()` - Step 7: Ethnic groups
- `registerCity()` - Step 8: Living city
- `getUser()` - Retrieve user data

#### `src/hooks/useRegistration.js`
React hook for managing registration state:
- Loading states
- Error handling
- Form data management
- API call wrappers

### 🌍 Environment Variables
```env
VITE_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=688813660017c877f06e
VITE_RESEND_API_KEY=re_ZpGedVR5_AYoFY2KUVBgXBmdD2ugEwewD
```

## 🎯 Next Steps: Frontend Integration

### 1. Replace Mock Registration in App.jsx

Currently `App.jsx` uses mock data. Replace with real API calls:

```javascript
import { useRegistration } from './hooks/useRegistration';

function App() {
  const {
    isLoading,
    error,
    registerNames,
    registerDateOfBirth,
    registerContact,
    sendOTPVerification,
    verifyOTP,
    setupPasscode,
    registerCitizenship,
    registerCity
  } = useRegistration();

  const handleNext = async () => {
    try {
      if (currentScreen === 'registration') {
        await registerNames({
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName
        });
        setCurrentScreen('dateOfBirth');
      }
      // ... handle other steps
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };
}
```

### 2. Add Loading States

```javascript
<button 
  className={`next-button ${isLoading ? 'loading' : ''}`}
  onClick={handleNext}
  disabled={isLoading}
>
  {isLoading ? 'Please wait...' : 'Next'}
</button>
```

### 3. Error Handling

```javascript
{error && (
  <div className="error-message">
    {error}
  </div>
)}
```

### 4. OTP Integration

Replace mock OTP verification:

```javascript
const handleVerifyOTP = async () => {
  try {
    const otpCode = verificationCode.join('');
    await verifyOTP(otpCode);
    setCurrentScreen('success');
  } catch (error) {
    showNotification(error.message, 'error');
  }
};
```

## 🔒 Security Notes

1. **Passcode Hashing**: Currently using basic encoding. Implement proper hashing in production.
2. **Permissions**: Collections are set to public access. Restrict in production.
3. **OTP Email**: Currently logs OTP to console. Integrate with Resend API.
4. **Input Validation**: Client-side validation exists. Add server-side validation.

## 📊 Database Status

- ✅ Database created: `ucera-main`
- ✅ Collections created: `users`, `otp_codes` 
- ✅ All attributes configured
- ✅ Proper data types and constraints
- ✅ Myanmar ethnic groups support
- ✅ Registration progress tracking

## 🧪 Testing

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Test Registration Flow:**
   - Open browser console to see API calls
   - Check Appwrite console for data persistence
   - Verify OTP generation (logged to console)

3. **Appwrite Console:**
   - Database: https://cloud.appwrite.io/console/project/688813660017c877f06e/databases
   - View collections and documents
   - Monitor API requests

## 🐛 Troubleshooting

### Common Issues:

1. **Environment Variables Not Loading:**
   - Restart dev server after adding `.env`
   - Ensure variables start with `VITE_`

2. **Appwrite Connection Errors:**
   - Check project ID in `.env`
   - Verify endpoint URL
   - Check browser network tab

3. **Database Permission Errors:**
   - Collections have public read/write access
   - Check Appwrite console logs

4. **OTP Not Working:**
   - Currently logs to console (development mode)
   - Implement Resend API for production

## 📈 Production Checklist

- [ ] Implement proper password hashing
- [ ] Set up database permissions and security rules
- [ ] Integrate Resend API for OTP emails
- [ ] Add server-side validation
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Add backup and recovery procedures

---

**Ready to integrate! Frontend can now connect to Appwrite backend.** 🎉 

# UC ERA OTP Email Function Setup

## Required Environment Variables

For the OTP email sending function to work properly, you need to configure the following environment variables in your Appwrite function:

### Resend API Configuration

1. **RESEND_API_KEY**: Your Resend API key for sending emails
   - Get your API key from: https://resend.com/api-keys
   - This is required for the email sending functionality

### Appwrite Configuration

2. **APPWRITE_FUNCTION_ENDPOINT**: Your Appwrite endpoint (default: https://nyc.cloud.appwrite.io/v1)
3. **APPWRITE_FUNCTION_PROJECT_ID**: Your Appwrite project ID (default: 688813660017c877f06e)
4. **APPWRITE_API_KEY**: Your Appwrite API key with proper permissions

## Function Deployment

1. Deploy the `send-otp-email` function to your Appwrite project
2. Make sure all dependencies are installed:
   ```bash
   cd functions/send-otp-email
   npm install
   ```

## Email Configuration

The function sends emails from: `UC ERA <noreply@unbreakablecube.com>`

Make sure to:
- Verify your domain in Resend
- Configure proper DNS records for email delivery
- Test the email delivery in your Resend dashboard

## Troubleshooting

- Check Appwrite function logs for detailed error messages
- Verify that RESEND_API_KEY is properly set
- Ensure the email domain is verified in Resend
- Check that the function has proper permissions to access the database 