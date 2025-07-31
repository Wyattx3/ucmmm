import { storage, ID, Permission, Role, STORAGE_BUCKETS } from '../lib/appwrite.js';

class StorageService {
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
            
            // Convert base64 to blob
            const blob = this.base64ToBlob(photoBase64);
            const fileName = `${userId}_private_${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            
            // Upload to Appwrite Storage
            const result = await storage.createFile(
                STORAGE_BUCKETS.PRIVATE_PHOTOS,
                ID.unique(),
                file,
                [
                    Permission.read(Role.any()), // Allow any user to read (simplified for now)
                    Permission.write(Role.any()) // Allow any user to write (simplified for now)
                ]
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

    // Upload public photo (public read, user write)
    async uploadPublicPhoto(userId, photoBase64) {
        try {
            console.log('📸 Uploading public photo for user:', userId);
            
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
    async processPhotoForUpload(photoBase64, maxSizeKB = 1024, quality = 0.8) {
        return new Promise((resolve, reject) => {
            try {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calculate new dimensions (max 1080p)
                    let { width, height } = img;
                    const maxWidth = 1080;
                    const maxHeight = 1080;
                    
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width *= ratio;
                        height *= ratio;
                    }
                    
                    // Set canvas size
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw and compress
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to base64 with compression
                    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                    
                    // Check file size
                    const sizeKB = (compressedBase64.length * 0.75) / 1024; // Approximate size
                    
                    if (sizeKB > maxSizeKB) {
                        // Further compress if still too large
                        const newQuality = Math.max(0.3, quality * (maxSizeKB / sizeKB));
                        const finalBase64 = canvas.toDataURL('image/jpeg', newQuality);
                        resolve(finalBase64);
                    } else {
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
}

export default new StorageService(); 