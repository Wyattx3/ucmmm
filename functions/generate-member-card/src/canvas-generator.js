// Canvas-based member card using actual PNG templates with steganography
const { createCanvas, loadImage } = require('canvas');

async function generateMemberCardWithCanvas(user, zodiacSign, templateId, photoUrl, log) {
    try {
        log('🎨 Starting Canvas-based member card with actual PNG template...');
        
        const userName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Member';
        const memberId = user.memberID || user.memberId || '1234567';
        const userEmail = user.email || 'unknown@email.com';
        
        // Get the actual template data from your uploaded templates
        const fs = require('fs');
        const path = require('path');
        
        // Template files mapping
        const templateFiles = {
            'Aquarius': 'Aquarius.png',
            'Aries': 'Aries.png', 
            'Cancer': 'Cancer.png',
            'Capricorn': 'Capricorn.png',
            'Gemini': 'Gemini.png',
            'Leo': 'Leo.png',
            'Libra': 'Libra.png',
            'Pisces': 'Pisces.png',
            'Sagittarius': 'Sagittarius.png',
            'Scorpio': 'Scorpio.png',
            'Taurus': 'Taurus.png',
            'Virgo': 'Virgo.png'
        };
        
        const templateFile = templateFiles[zodiacSign] || templateFiles['Leo'];
        
        // Generate steganography-embedded member card
        const memberCardWithSteganography = await createMemberCardWithSteganography(
            templateFile, 
            user, 
            userName, 
            memberId, 
            userEmail, 
            log
        );
        log('🔐 Member card with steganography generated successfully');
        
        // Return the steganography-embedded member card as base64
        return Buffer.from(JSON.stringify({
            success: true,
            memberCardImage: memberCardWithSteganography,
            message: 'Member card generated with embedded security data'
        }), 'utf8');
        
    } catch (error) {
        log('❌ Canvas data generation error:', error.message);
        throw error;
    }
}

// Function to create member card with steganography
async function createMemberCardWithSteganography(templateFile, user, userName, memberId, userEmail, log) {
    try {
        log('🎨 Creating member card with steganography...');
        
        // Canvas size
        const canvasWidth = 576;
        const canvasHeight = 384;
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');
        
        // Template path (assuming templates are in public folder)
        const templatePath = path.join(__dirname, '../../public', templateFile);
        
        // Check if template exists, use fallback if not
        let templateImage;
        try {
            if (fs.existsSync(templatePath)) {
                templateImage = await loadImage(templatePath);
                log(`✅ Template loaded: ${templateFile}`);
            } else {
                // Create a simple fallback template
                log(`⚠️ Template not found: ${templateFile}, creating fallback`);
                templateImage = createFallbackTemplate(canvasWidth, canvasHeight);
            }
        } catch (error) {
            log(`❌ Error loading template: ${error.message}, creating fallback`);
            templateImage = createFallbackTemplate(canvasWidth, canvasHeight);
        }
        
        // Draw template background
        ctx.drawImage(templateImage, 0, 0, canvasWidth, canvasHeight);
        
        // Draw user photo
        try {
            if (user.publicPhoto && user.publicPhoto.startsWith('data:image')) {
                const userImage = await loadImage(user.publicPhoto);
                
                // Photo position and size
                const photoX = 39, photoY = 39, photoW = 203, photoH = 305, radius = 15;
                
                // Create rounded rectangle clipping path
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(photoX, photoY, photoW, photoH, radius);
                ctx.clip();
                
                // Draw user image
                ctx.drawImage(userImage, photoX, photoY, photoW, photoH);
                ctx.restore();
                
                log('✅ User photo drawn successfully');
            }
        } catch (error) {
            log(`❌ Error drawing user photo: ${error.message}`);
        }
        
        // Draw user name
        ctx.font = '700 30px Arial';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        
        // Calculate center position for name with max width
        const nameX = 270 + (284 / 2); // Center of name area
        const nameY = 295 + 25; // Adjust for font baseline
        const maxNameWidth = 284;
        
        // Adjust font size if text is too wide
        let fontSize = 30;
        ctx.font = `700 ${fontSize}px Arial`;
        while (ctx.measureText(userName).width > maxNameWidth && fontSize > 12) {
            fontSize--;
            ctx.font = `700 ${fontSize}px Arial`;
        }
        
        ctx.fillText(userName, nameX, nameY);
        log(`✅ User name drawn: ${userName}`);
        
        // Draw member ID
        ctx.font = '700 13px Arial';
        ctx.fillStyle = '#4A4A4A';
        ctx.textAlign = 'left';
        ctx.fillText(memberId, 462, 355 + 10); // Adjust for baseline
        log(`✅ Member ID drawn: ${memberId}`);
        
        // Get canvas as image data
        const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        
        // Embed steganography data
        const hiddenData = JSON.stringify({
            email: userEmail,
            memberId: memberId,
            timestamp: new Date().toISOString(),
            version: '1.0'
        });
        
        log(`🔐 Embedding hidden data: ${hiddenData.substring(0, 50)}...`);
        
        // Simple LSB steganography implementation
        const embeddedImageData = embedDataInImage(imageData, hiddenData, log);
        
        // Put modified image data back to canvas
        ctx.putImageData(embeddedImageData, 0, 0);
        
        // Convert to base64
        const base64Image = canvas.toDataURL('image/png');
        
        log('🔐 Steganography embedding completed successfully');
        return base64Image;
        
    } catch (error) {
        log(`❌ Steganography embedding error: ${error.message}`);
        throw error;
    }
}

// Simple LSB (Least Significant Bit) steganography implementation
function embedDataInImage(imageData, data, log) {
    try {
        const dataBytes = Buffer.from(data, 'utf8');
        const dataLength = dataBytes.length;
        
        // Convert data length to 32-bit array for embedding
        const lengthBytes = new Uint8Array(4);
        lengthBytes[0] = (dataLength >>> 24) & 0xFF;
        lengthBytes[1] = (dataLength >>> 16) & 0xFF;
        lengthBytes[2] = (dataLength >>> 8) & 0xFF;
        lengthBytes[3] = dataLength & 0xFF;
        
        // Combine length and data
        const fullData = new Uint8Array(4 + dataLength);
        fullData.set(lengthBytes, 0);
        fullData.set(dataBytes, 4);
        
        const pixels = imageData.data;
        let dataIndex = 0;
        let bitIndex = 0;
        
        // Embed data in LSB of red channel
        for (let i = 0; i < pixels.length && dataIndex < fullData.length; i += 4) {
            if (dataIndex < fullData.length) {
                const bit = (fullData[dataIndex] >>> (7 - bitIndex)) & 1;
                
                // Modify LSB of red channel
                pixels[i] = (pixels[i] & 0xFE) | bit;
                
                bitIndex++;
                if (bitIndex === 8) {
                    bitIndex = 0;
                    dataIndex++;
                }
            }
        }
        
        log(`🔐 Embedded ${fullData.length} bytes of hidden data`);
        return imageData;
        
    } catch (error) {
        log(`❌ LSB embedding error: ${error.message}`);
        throw error;
    }
}

// Create fallback template if original not found
function createFallbackTemplate(width, height) {
    const fallbackCanvas = createCanvas(width, height);
    const ctx = fallbackCanvas.getContext('2d');
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add decorative elements
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(width * 0.8, height * 0.2, 50, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(width * 0.2, height * 0.8, 30, 0, Math.PI * 2);
    ctx.fill();
    
    return fallbackCanvas;
}

module.exports = { generateMemberCardWithCanvas };