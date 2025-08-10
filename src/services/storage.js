import { storage, account, ID, Permission, Role, Query, STORAGE_BUCKETS } from '../lib/appwrite.js';

class StorageService {
    // Upload chat image and return permanent URL
    async uploadChatImage(file, userId) {
        try {
            console.log('📤 Uploading chat image for user:', userId);
            
            // Get current session user ID to match permissions
            let currentUserId = null;
            try {
                const currentSession = await account.getSession('current');
                const currentUser = await account.get();
                currentUserId = currentUser.$id;
                console.log('✅ Current session user ID:', currentUserId);
                
                if (currentUserId !== userId) {
                    console.warn('⚠️ User ID mismatch! Session:', currentUserId, 'Provided:', userId);
                    // Use the actual session user ID for permissions
                    userId = currentUserId;
                }
            } catch (sessionError) {
                console.log('ℹ️ No existing session, creating anonymous session...');
                try {
                    await account.createAnonymousSession();
                    console.log('✅ Anonymous session created for chat image upload');
                    // For anonymous sessions, use broader permissions
                    userId = null;
                } catch (anonError) {
                    console.warn('⚠️ Could not create anonymous session:', anonError.message);
                    throw new Error('Authentication required for image upload');
                }
            }
            
            // Create unique filename
            const fileName = `chat_${userId || 'anon'}_${Date.now()}_${file.name}`;
            const renamedFile = new File([file], fileName, { type: file.type });
            
            // Upload to dedicated Chat Images bucket (use bucket-level permissions only)
            const result = await storage.createFile(
                STORAGE_BUCKETS.CHAT_IMAGES,
                ID.unique(),
                renamedFile
                // No file-level permissions - rely on bucket permissions
            );
            
            console.log('✅ Chat image uploaded successfully:', result.$id);
            
            const imageUrl = this.getFileViewURL(STORAGE_BUCKETS.CHAT_IMAGES, result.$id);
            
            return {
                fileId: result.$id,
                url: imageUrl,
                fileName: fileName,
                size: result.sizeOriginal
            };
            
        } catch (error) {
            console.error('❌ Chat image upload failed:', error);
            throw new Error(`Image upload failed: ${error.message}`);
        }
    }

    // Create message document in Appwrite database (production)
    async createMessage(databases, databaseId, collectionId, payload) {
        try {
            const result = await databases.createDocument(databaseId, collectionId, ID.unique(), payload)
            return { success: true, data: result }
        } catch (error) {
            console.error('❌ Error creating message:', error)
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
            console.error('❌ Error converting base64 to blob:', error);
            throw new Error('Failed to convert image data');
        }
    }

    // Upload private photo (user access only)
    async uploadPrivatePhoto(userId, photoBase64) {
        try {
            console.log('📸 Uploading private photo for user:', userId);
            
            // Check if we have an active session, create anonymous session if needed
            let hasSession = false;
            try {
                const currentSession = await account.getSession('current');
                hasSession = !!currentSession;
                console.log('✅ Existing session found for storage operations');
            } catch (sessionError) {
                console.log('ℹ️ No existing session, creating anonymous session for storage...');
                try {
                    // Create anonymous session for storage operations
                    await account.createAnonymousSession();
                    hasSession = true;
                    console.log('✅ Anonymous session created for storage operations');
                } catch (anonError) {
                    console.warn('⚠️ Could not create anonymous session:', anonError.message);
                    console.log('📝 Proceeding with storage operation without session...');
                }
            }
            
            // Convert base64 to blob
            const blob = this.base64ToBlob(photoBase64);
            const fileName = `${userId}_private_${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            
            // Upload to Appwrite Storage
            const result = await storage.createFile(
                STORAGE_BUCKETS.PRIVATE_PHOTOS,
                ID.unique(),
                file
            );
            
            console.log('✅ Private photo uploaded successfully:', result.$id);
            
            return {
                fileId: result.$id,
                fileName: result.name,
                size: result.sizeOriginal,
                url: this.getFileViewURL(STORAGE_BUCKETS.PRIVATE_PHOTOS, result.$id),
                downloadUrl: this.getFileDownloadURL(STORAGE_BUCKETS.PRIVATE_PHOTOS, result.$id)
            };
        } catch (error) {
            console.error('❌ Error uploading private photo:', error);
            throw new Error('Private photo upload failed: ' + error.message);
        }
    }

    // Upload public photo (DEPRECATED - NOT USED)
    // NOTE: Public photos are now stored as base64 in database for member card display
    // This method is kept for potential future use but is not currently used in the application
    async uploadPublicPhoto(userId, photoBase64) {
        try {
            console.log('📸 Uploading public photo for user (DEPRECATED):', userId);
            console.warn('⚠️ uploadPublicPhoto is deprecated - public photos are stored as base64');
            
            // Convert base64 to blob
            const blob = this.base64ToBlob(photoBase64);
            const fileName = `${userId}_public_${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            
            // Upload to Appwrite Storage (same bucket, public permissions)
            const result = await storage.createFile(
                STORAGE_BUCKETS.PUBLIC_PHOTOS,
                ID.unique(),
                file,
                [
                    Permission.read(Role.any()), // Public can view member card photos
                    Permission.delete(Role.any()) // Allow any user to delete (simplified for now)
                ]
            );
            
            console.log('✅ Public photo uploaded successfully:', result.$id);
            
            return {
                fileId: result.$id,
                fileName: result.name,
                size: result.sizeOriginal,
                url: this.getFileViewURL(STORAGE_BUCKETS.PUBLIC_PHOTOS, result.$id),
                downloadUrl: this.getFileDownloadURL(STORAGE_BUCKETS.PUBLIC_PHOTOS, result.$id)
            };
        } catch (error) {
            console.error('❌ Error uploading public photo:', error);
            throw new Error('Public photo upload failed: ' + error.message);
        }
    }

    // Get file view URL (for display)
    getFileViewURL(bucketId, fileId) {
        return `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`;
    }

    // Get file download URL (for download)
    getFileDownloadURL(bucketId, fileId) {
        return `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/download?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`;
    }

    // Upload member card backup
    async uploadMemberCard(userId, memberCardBase64) {
        try {
            console.log('🎴 Uploading member card backup for user:', userId);
            
            // Get the current session user ID for permissions
            let currentUserId = null;
            let hasSession = false;
            
            try {
                const currentSession = await account.getSession('current');
                const currentUser = await account.get();
                currentUserId = currentUser.$id;
                hasSession = true;
                console.log('✅ Existing session found for member card backup, current user:', currentUserId);
            } catch (sessionError) {
                console.log('ℹ️ No existing session, creating anonymous session for member card backup...');
                try {
                    await account.createAnonymousSession();
                    hasSession = true;
                    console.log('✅ Anonymous session created for member card backup');
                    // For anonymous sessions, use broader permissions
                } catch (anonError) {
                    console.warn('⚠️ Could not create anonymous session:', anonError.message);
                    console.log('📝 Proceeding with member card backup without session...');
                }
            }
            
            // Convert base64 to blob
            const blob = this.base64ToBlob(memberCardBase64);
            const fileName = `${userId}_member_card_${Date.now()}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });
            
            // Set permissions based on session type
            let permissions = [];
            if (currentUserId) {
                // Use the actual current session user ID for permissions
                permissions = [
                    Permission.read(Role.user(currentUserId)),
                    Permission.delete(Role.user(currentUserId))
                ];
                console.log('🔒 Using user-specific permissions for:', currentUserId);
            } else {
                // For anonymous sessions or no session, use broader permissions
                permissions = [
                    Permission.read(Role.any()),
                    Permission.delete(Role.any())
                ];
                console.log('🔓 Using broad permissions for anonymous backup');
            }
            
            // Upload to Member Cards bucket
            const result = await storage.createFile(
                STORAGE_BUCKETS.MEMBER_CARDS,
                ID.unique(),
                file,
                permissions
            );
            
            console.log('✅ Member card backup uploaded successfully:', result.$id);
            
            return {
                fileId: result.$id,
                fileName: result.name,
                size: result.sizeOriginal,
                url: this.getFileViewURL(STORAGE_BUCKETS.MEMBER_CARDS, result.$id),
                downloadUrl: this.getFileDownloadURL(STORAGE_BUCKETS.MEMBER_CARDS, result.$id)
            };
        } catch (error) {
            console.error('❌ Error uploading member card backup:', error);
            throw new Error('Member card backup failed: ' + error.message);
        }
    }

    // Get user's member card backups
    async getUserMemberCards(userId) {
        try {
            console.log('🔍 Getting member card backups for user:', userId);
            
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
            console.error('❌ Error getting member card backups:', error);
            throw new Error('Failed to get member card backups: ' + error.message);
        }
    }

    // Delete photo
    async deletePhoto(bucketId, fileId) {
        try {
            console.log('🗑️ Deleting photo:', fileId);
            
            await storage.deleteFile(bucketId, fileId);
            console.log('✅ Photo deleted successfully');
            
            return { success: true };
        } catch (error) {
            console.error('❌ Error deleting photo:', error);
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
            console.error('❌ Error getting photo info:', error);
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
        console.log('📸 Processing public photo with original quality preservation...');
        return this.processPhotoForUpload(photoBase64, 2048, 0.98, {
            useOriginalQuality: true,
            maxWidth: 2048,  // Higher resolution for member cards
            maxHeight: 2048,
            preserveOriginalSize: false // Allow some resizing for very large images
        });
    }
}

export default new StorageService(); 