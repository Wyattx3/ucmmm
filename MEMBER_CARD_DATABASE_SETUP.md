# Member Card Database Setup Guide

## 🚨 Critical: Missing Database Attributes

The member card completion is failing because the `users` collection is missing member card attributes.

## 📊 Required Attributes to Add

### Go to Appwrite Console → Database → ucera-main → users collection → Add Attributes:

### 1. Member Card Status Fields:
```
hasMemberCard: Boolean (default: false)
memberCardCompletedAt: DateTime (optional)
```

### 2. Member Card Data Fields:
```
relationshipStatus: String (optional, 50 chars)
Values: single, in_relationship, married, complicated, not_specified

gender: String (optional, 30 chars)  
Values: male, female, lgbtq, prefer_not_to_say

favoriteFood: String (optional, 500 chars)
Multiple selections joined by comma

favoriteArtist: String (optional, 500 chars)
Multiple selections joined by comma

loveLanguage: String (optional, 50 chars)
Values: words_of_affirmation, acts_of_service, receiving_gifts, quality_time, physical_touch
```

### 3. Photo Storage Fields:
```
// Private Photo (Stored in Appwrite Cloud Storage)
privatePhotoId: String (optional, 100 chars)    // Cloud storage file ID
privatePhotoUrl: String (optional, 500 chars)   // Cloud storage URL
privatePhotoSize: Integer (optional)            // File size in bytes

// Public Photo (Stored as Base64 in Database)
publicPhoto: String (optional, 500000 chars)    // Base64 string for member card display
Note: Public photos are NOT stored in cloud storage, only as base64 for member card display
```

## 🧹 Database Cleanup Required

### Manual Cleanup via Appwrite Console:

1. **Delete Incomplete Registrations:**
   - Document ID: `6889b2620009ce681cb1` (Ham Na - typo email)
   - Document ID: `6889b26d003426f19f14` (Ham Na - incomplete)

2. **Keep Main User:**
   - Document ID: `688944d9001209dd9fd2` (Yan Min Yaus - naywpai@gmail.com)

## 🎯 After Setup Steps:

1. Add all missing attributes to users collection
2. Delete duplicate/incomplete user documents  
3. Test member card completion with existing user
4. Verify data storage in database and photos in storage

## 🔍 Verification:

After setup, the user document should contain:
```json
{
  "firstName": "Yan",
  "lastName": "Yaus", 
  "email": "naywpai@gmail.com",
  "hasMemberCard": true,
  "relationshipStatus": "single",
  "gender": "male",
  "favoriteFood": "မုန့်ဟင်းခါး",
  "favoriteArtist": "စိုင်းထီးဆိုင်", 
  "loveLanguage": "words_of_affirmation",
  "privatePhotoId": "photo123",
  "publicPhotoId": "photo456"
}
``` 