# Appwrite Storage Setup Guide

## 🗂️ Storage Buckets Configuration

### Required Buckets:

#### 1. Private Photos Bucket
```bash
Bucket ID: private-photos
Name: Private Photos
Enabled: Yes
Max File Size: 10MB
Allowed File Extensions: jpg, jpeg, png, webp
Compression: Automatic
Antivirus: Enabled
```

**Permissions:**
- Read: `user:USER_ID` (Only owner can read)
- Create: `user:USER_ID` (Only owner can upload)
- Update: `user:USER_ID` (Only owner can update)
- Delete: `user:USER_ID` (Only owner can delete)

#### 2. Public Photos Bucket
```bash
Bucket ID: public-photos
Name: Public Photos (Member Cards)
Enabled: Yes
Max File Size: 10MB
Allowed File Extensions: jpg, jpeg, png, webp
Compression: Automatic
Antivirus: Enabled
```

**Permissions:**
- Read: `any()` (Public can view)
- Create: `users` (Authenticated users can upload)
- Update: `user:USER_ID` (Only owner can update)
- Delete: `user:USER_ID` (Only owner can delete)

## 🖥️ Manual Setup Steps

### Step 1: Create Storage Buckets

1. Go to Appwrite Console
2. Navigate to **Storage** section
3. Click **Create Bucket**

**For Private Photos:**
```
Bucket ID: private-photos
Name: Private Photos
Permissions: As shown above
```

**For Public Photos:**
```
Bucket ID: public-photos
Name: Public Photos
Permissions: As shown above
```

### Step 2: Configure Environment Variables

Ensure your `.env` file contains:
```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
```

### Step 3: Test Storage Access

Run this test in browser console:
```javascript
// Test storage service
import storageService from './src/services/storage.js';

// Test photo upload
const testPhoto = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...";
storageService.uploadPublicPhoto("test-user-id", testPhoto)
  .then(result => console.log("✅ Upload successful:", result))
  .catch(error => console.error("❌ Upload failed:", error));
```

## 🔧 Automated Setup Script

### Create Buckets via Appwrite CLI

```bash
# Install Appwrite CLI
npm install -g appwrite-cli

# Login to Appwrite
appwrite login

# Create private photos bucket
appwrite storage createBucket \
  --bucketId private-photos \
  --name "Private Photos" \
  --permissions 'read("user:USER_ID"),create("user:USER_ID"),update("user:USER_ID"),delete("user:USER_ID")' \
  --fileSecurity true \
  --enabled true \
  --maximumFileSize 10485760 \
  --allowedFileExtensions jpg,jpeg,png,webp \
  --compression gzip \
  --encryption true

# Create public photos bucket  
appwrite storage createBucket \
  --bucketId public-photos \
  --name "Public Photos" \
  --permissions 'read("any()"),create("users"),update("user:USER_ID"),delete("user:USER_ID")' \
  --fileSecurity true \
  --enabled true \
  --maximumFileSize 10485760 \
  --allowedFileExtensions jpg,jpeg,png,webp \
  --compression gzip \
  --encryption true
```

## 📊 Storage Optimization

### File Compression Settings:
- **Private Photos**: 80% quality, max 512KB
- **Public Photos**: 90% quality, max 1MB  
- **Resolution**: Max 1080p for both

### Benefits:
- **95% Database Size Reduction**
- **Faster Query Performance**  
- **CDN Optimization**
- **Better Security Controls**

## 🛡️ Security Features

### Access Control:
```javascript
// Private photos - user only
Permission.read(Role.user(userId))

// Public photos - public read, user write
Permission.read(Role.any())
Permission.update(Role.user(userId))
```

### File Validation:
- Antivirus scanning
- File type validation  
- Size limits
- Format conversion

## 🚀 Usage in Application

### Upload Process:
```javascript
// Frontend sends base64
const photoBase64 = "data:image/jpeg;base64,...";

// Backend processes and uploads
const result = await storageService.uploadPublicPhoto(userId, photoBase64);

// Database stores URL reference
const updateData = {
  publicPhotoUrl: result.url,
  publicPhotoId: result.fileId
};
```

### Display Process:
```javascript
// MemberCard component
<img src={memberData.publicPhotoUrl || memberData.publicPhoto} />
```

## 🔍 Monitoring & Analytics

### Storage Usage:
- Track file uploads per user
- Monitor storage quota usage
- Analyze file sizes and formats

### Error Handling:
- File upload failures
- Permission denied errors
- Storage quota exceeded

## 📈 Migration Strategy

### Phase 1: Dual Support
- Support both base64 and storage URLs
- New uploads use Appwrite Storage
- Existing base64 data remains

### Phase 2: Background Migration
- Convert existing base64 to files
- Update database references
- Clean up base64 data

### Phase 3: Full Migration
- Remove base64 support
- Storage-only implementation
- Performance optimizations 