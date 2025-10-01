import { storage, account, ID, Permission, Role, Query, STORAGE_BUCKETS } from '../lib/appwrite.js';
class StorageService {
    // Upload chat image and return permanent URL
    async uploadChatImage(file, userId) {
        try {
            console.log('🖼️ Starting chat image upload:', {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                userId: userId,
                bucketId: STORAGE_BUCKETS.CHAT_IMAGES
            });
            
            // Use provided userId directly - no need to verify session
            // Anonymous sessions are created in auth.js during registration/login
            // Create unique filename
            const fileName = `chat_${userId || 'anon'}_${Date.now()}_${file.name}`;
            const renamedFile = new File([file], fileName, { type: file.type });
            
            console.log('📤 Uploading to Appwrite Storage...');
            // Upload to dedicated Chat Images bucket (use bucket-level permissions only)
            const result = await storage.createFile(
                STORAGE_BUCKETS.CHAT_IMAGES,
                ID.unique(),
                renamedFile
                // No file-level permissions - rely on bucket permissions
            );
            
            console.log('✅ Upload successful:', {
                fileId: result.$id,
                bucketId: STORAGE_BUCKETS.CHAT_IMAGES
            });
            
            const imageUrl = this.getFileViewURL(STORAGE_BUCKETS.CHAT_IMAGES, result.$id);
            console.log('🔗 Generated image URL:', imageUrl);
            
            return {
                fileId: result.$id,
                url: imageUrl,
                fileName: fileName,
                size: result.sizeOriginal
            };
        } catch (error) {
            console.error('❌ Chat image upload error:', {
                error: error.message,
                code: error.code,
                type: error.type,
                bucketId: STORAGE_BUCKETS.CHAT_IMAGES
            });
            throw new Error(`Image upload failed: ${error.message}`);
        }
    }
    // Create message document in Appwrite database (production)
    async createMessage(databases, databaseId, collectionId, payload) {
        try {
            const result = await databases.createDocument(databaseId, collectionId, ID.unique(), payload)
            return { success: true, data: result }
        } catch (error) {
            throw new Error('Failed to create message: ' + error.message)
        }
    }
    // Convert base64 to blob
    base64ToBlob(base64Data, contentType = 'image/jpeg') {
        try {
            // Remove data URL prefix if present
            const base64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
            // Convert base64 to binary
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            return new Blob([byteArray], { type: contentType });
        } catch (error) {
            throw new Error('Failed to convert image data');
        }
    }
    // Upload private photo (user access only)
    async uploadPrivatePhoto(userId, photoBase64) {
        try {
            // Anonymous session is already created in auth.js during registration/login
            // No need to check or create session here
            
            // Convert base64 to blob
            const blob = this.base64ToBlob(photoBase64);
            const fileName = `${userId}_private_${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            // Upload to Appwrite Storage
            const result = await storage.createFile(
                STORAGE_BUCKETS.PROFILE_PHOTOS,
                ID.unique(),
                file
            );
            return {
                fileId: result.$id,
                fileName: result.name,
                size: result.sizeOriginal,
                url: this.getFileViewURL(STORAGE_BUCKETS.PROFILE_PHOTOS, result.$id),
                downloadUrl: this.getFileDownloadURL(STORAGE_BUCKETS.PROFILE_PHOTOS, result.$id)
            };
        } catch (error) {
            throw new Error('Private photo upload failed: ' + error.message);
        }
    }
    // Upload public photo (DEPRECATED - NOT USED)
    // NOTE: Public photos are now stored as base64 in database for member card display
    // This method is kept for potential future use but is not currently used in the application
    async uploadPublicPhoto(userId, photoBase64) {
        try {
            console.log('📸 Uploading public photo for user (DEPRECATED):', userId);
            // Convert base64 to blob
            const blob = this.base64ToBlob(photoBase64);
            const fileName = `${userId}_public_${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            // Upload to Appwrite Storage (same bucket, public permissions)
            const result = await storage.createFile(
                STORAGE_BUCKETS.PROFILE_PHOTOS,
                ID.unique(),
                file,
                [
                    Permission.read(Role.any()), // Public can view member card photos
                    Permission.delete(Role.any()) // Allow any user to delete (simplified for now)
                ]
            );
            return {
                fileId: result.$id,
                fileName: result.name,
                size: result.sizeOriginal,
                url: this.getFileViewURL(STORAGE_BUCKETS.PROFILE_PHOTOS, result.$id),
                downloadUrl: this.getFileDownloadURL(STORAGE_BUCKETS.PROFILE_PHOTOS, result.$id)
            };
        } catch (error) {
            throw new Error('Public photo upload failed: ' + error.message);
        }
    }
    // Get file view URL (for display)
    getFileViewURL(bucketId, fileId) {
        // Use hardcoded values to match appwrite.js configuration
        const endpoint = 'https://nyc.cloud.appwrite.io/v1';
        const projectId = '68db5335002a5780ae9a';
        return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
    }
    // Get file download URL (for download)
    getFileDownloadURL(bucketId, fileId) {
        // Use hardcoded values to match appwrite.js configuration
        const endpoint = 'https://nyc.cloud.appwrite.io/v1';
        const projectId = '68db5335002a5780ae9a';
        return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/download?project=${projectId}`;
    }
    // Upload member card backup
    async uploadMemberCard(userId, memberCardBase64) {
        try {
            // Anonymous session is already created in auth.js during registration/login
            // No need to check or create session here
            
            // Convert base64 to blob
            const blob = this.base64ToBlob(memberCardBase64);
            const fileName = `${userId}_member_card_${Date.now()}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });
            
            // Use simple permissions - bucket already allows "any"
            const permissions = [
                Permission.read(Role.any()),
                Permission.delete(Role.any())
            ];
            // Upload to Member Cards bucket
            const result = await storage.createFile(
                STORAGE_BUCKETS.MEMBER_CARDS,
                ID.unique(),
                file,
                permissions
            );
            return {
                fileId: result.$id,
                fileName: result.name,
                size: result.sizeOriginal,
                url: this.getFileViewURL(STORAGE_BUCKETS.MEMBER_CARDS, result.$id),
                downloadUrl: this.getFileDownloadURL(STORAGE_BUCKETS.MEMBER_CARDS, result.$id)
            };
        } catch (error) {
            throw new Error('Member card backup failed: ' + error.message);
        }
    }
    // Get user's member card backups
    async getUserMemberCards(userId) {
        try {
            const files = await storage.listFiles(
                STORAGE_BUCKETS.MEMBER_CARDS,
                [Query.startsWith('name', `${userId}_member_card_`)]
            );
            return files.files.map(file => ({
                fileId: file.$id,
                fileName: file.name,
                size: file.sizeOriginal,
                createdAt: file.$createdAt,
                url: this.getFileViewURL(STORAGE_BUCKETS.MEMBER_CARDS, file.$id),
                downloadUrl: this.getFileDownloadURL(STORAGE_BUCKETS.MEMBER_CARDS, file.$id)
            }));
        } catch (error) {
            throw new Error('Failed to get member card backups: ' + error.message);
        }
    }
    // Delete photo
    async deletePhoto(bucketId, fileId) {
        try {
            await storage.deleteFile(bucketId, fileId);
            return { success: true };
        } catch (error) {
            throw new Error('Photo deletion failed: ' + error.message);
        }
    }
    // Get photo file info
    async getPhotoInfo(bucketId, fileId) {
        try {
            const file = await storage.getFile(bucketId, fileId);
            return {
                fileId: file.$id,
                fileName: file.name,
                size: file.sizeOriginal,
                mimeType: file.mimeType,
                url: this.getFileViewURL(bucketId, fileId)
            };
        } catch (error) {
            throw new Error('Failed to get photo info: ' + error.message);
        }
    }
    // Compress and validate photo before upload
    async processPhotoForUpload(photoBase64, maxSizeKB = 1024, quality = 0.8, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    // Calculate new dimensions with improved logic
                    let { width, height } = img;
                    const maxWidth = options.preserveOriginalSize ? width : (options.maxWidth || 1080);
                    const maxHeight = options.preserveOriginalSize ? height : (options.maxHeight || 1080);
                    // Only resize if image is larger than limits
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }
                    // Set canvas size
                    canvas.width = width;
                    canvas.height = height;
                    // Use better image rendering for quality
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    // Draw image with high quality
                    ctx.drawImage(img, 0, 0, width, height);
                    // Choose format based on quality needs
                    const format = options.useOriginalQuality ? 'image/png' : 'image/jpeg';
                    const finalQuality = options.useOriginalQuality ? 1.0 : quality;
                    // Convert to base64 with specified format and quality
                    let compressedBase64 = canvas.toDataURL(format, finalQuality);
                    // Check file size
                    const sizeKB = (compressedBase64.length * 0.75) / 1024; // Approximate size
                    // For original quality mode, allow larger files but still have limits
                    const actualMaxSize = options.useOriginalQuality ? (maxSizeKB * 3) : maxSizeKB;
                    if (sizeKB > actualMaxSize && !options.useOriginalQuality) {
                        // Only compress further if not in original quality mode
                        const newQuality = Math.max(0.5, quality * (maxSizeKB / sizeKB));
                        const finalBase64 = canvas.toDataURL('image/jpeg', newQuality);
                        console.log(`📸 Photo compressed from ${Math.round(sizeKB)}KB to ${Math.round((finalBase64.length * 0.75) / 1024)}KB`);
                        resolve(finalBase64);
                    } else {
                        if (options.useOriginalQuality && sizeKB > actualMaxSize) {
                            // For original quality, try one high-quality JPEG compression
                            compressedBase64 = canvas.toDataURL('image/jpeg', 0.95);
                            console.log(`📸 Original quality photo compressed to ${Math.round((compressedBase64.length * 0.75) / 1024)}KB`);
                        }
                        resolve(compressedBase64);
                    }
                };
                img.onerror = () => reject(new Error('Invalid image data'));
                img.src = photoBase64;
            } catch (error) {
                reject(error);
            }
        });
    }
    // New method specifically for high-quality member card photos
    async processPublicPhotoForMemberCard(photoBase64) {
        // IMPORTANT: Database public_photo field has 100,000 chars limit
        // Base64: 100,000 chars ≈ 75KB binary
        // Using high quality settings for best visual appearance in member cards
        return this.processPhotoForUpload(photoBase64, 95, 0.92, {
            useOriginalQuality: false,  // Must compress to fit DB limit
            maxWidth: 1600,   // High resolution for HD member cards
            maxHeight: 1600,  // Preserve detail and clarity
            preserveOriginalSize: false
        });
    }
}
export default new StorageService(); 