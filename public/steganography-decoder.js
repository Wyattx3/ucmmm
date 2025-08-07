/**
 * Steganography Decoder for UC ERA Member Cards
 * Extracts hidden email and member ID from member card images
 */

// Extract hidden data from steganography-embedded image
function extractDataFromImage(imageData) {
    try {
        const pixels = imageData.data;
        
        // Extract data length first (32 bits)
        let lengthBits = '';
        for (let i = 0; i < 128; i += 4) { // 32 bits * 4 bytes per pixel
            lengthBits += (pixels[i] & 1).toString();
        }
        
        // Convert length bits to number
        const dataLength = parseInt(lengthBits, 2);
        
        if (dataLength <= 0 || dataLength > 1000) {
            throw new Error('Invalid data length detected');
        }
        
        // Extract actual data
        let dataBits = '';
        const totalBitsNeeded = dataLength * 8;
        const startPixel = 128; // Start after length data
        
        for (let i = startPixel; i < pixels.length && dataBits.length < totalBitsNeeded; i += 4) {
            dataBits += (pixels[i] & 1).toString();
        }
        
        // Convert bits to bytes
        const dataBytes = new Uint8Array(dataLength);
        for (let i = 0; i < dataLength; i++) {
            const bitString = dataBits.substr(i * 8, 8);
            dataBytes[i] = parseInt(bitString, 2);
        }
        
        // Convert bytes to string
        const decoder = new TextDecoder('utf-8');
        const hiddenData = decoder.decode(dataBytes);
        
        // Parse JSON data
        return JSON.parse(hiddenData);
        
    } catch (error) {
        console.error('Steganography extraction error:', error);
        throw new Error('Failed to extract hidden data from image');
    }
}

// Load image and extract steganography data
async function extractMemberCardData(imageFile) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        img.onload = function() {
            try {
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Draw image to canvas
                ctx.drawImage(img, 0, 0);
                
                // Get image data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                // Extract hidden data
                const hiddenData = extractDataFromImage(imageData);
                
                resolve({
                    success: true,
                    data: hiddenData
                });
                
            } catch (error) {
                reject({
                    success: false,
                    error: error.message
                });
            }
        };
        
        img.onerror = function() {
            reject({
                success: false,
                error: 'Failed to load image'
            });
        };
        
        // Handle both File objects and data URLs
        if (imageFile instanceof File) {
            const reader = new FileReader();
            reader.onload = function(e) {
                img.src = e.target.result;
            };
            reader.readAsDataURL(imageFile);
        } else if (typeof imageFile === 'string') {
            img.src = imageFile;
        } else {
            reject({
                success: false,
                error: 'Invalid image format'
            });
        }
    });
}

// Verify member card authenticity
async function verifyMemberCard(imageFile, expectedEmail, expectedMemberId) {
    try {
        const result = await extractMemberCardData(imageFile);
        
        if (!result.success) {
            return {
                valid: false,
                error: result.error
            };
        }
        
        const { email, memberId, timestamp, version } = result.data;
        
        // Verify extracted data matches expected values
        const emailMatch = email === expectedEmail;
        const memberIdMatch = memberId === expectedMemberId;
        
        return {
            valid: emailMatch && memberIdMatch,
            extractedData: {
                email,
                memberId,
                timestamp,
                version
            },
            verification: {
                emailMatch,
                memberIdMatch
            }
        };
        
    } catch (error) {
        return {
            valid: false,
            error: error.message
        };
    }
}

// Export functions for use
if (typeof window !== 'undefined') {
    window.UCERASteganography = {
        extractMemberCardData,
        verifyMemberCard
    };
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        extractMemberCardData,
        verifyMemberCard
    };
}