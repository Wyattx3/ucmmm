// Canvas-based member card using actual PNG templates
async function generateMemberCardWithCanvas(user, zodiacSign, templateId, photoUrl, log) {
    try {
        log('🎨 Starting Canvas-based member card with actual PNG template...');
        
        const userName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Member';
        const memberId = user.memberID || user.memberId || '1234567';
        
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
        
        // Since we're in cloud function, create a simple response with template info
        // The frontend will handle the actual template overlay
            // Use the user's public photo for member card display (base64 from database)
    // This avoids private photo access issues
    const publicPhotoForCard = userData.publicPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face';
    
    const memberCardData = {
        templateFile: templateFile,
        zodiacSign: zodiacSign,
        userName: userName,
        memberId: memberId,
        photoUrl: publicPhotoForCard,
        positions: {
            photo: { x: 39, y: 39, width: 203, height: 305, borderRadius: 15 },
            name: { x: 270, y: 295, width: 285, height: 36, fontSize: 30, fontWeight: 700, fontFamily: 'Asap Bold Italic', color: '#000000' },
            memberId: { x: 462, y: 355, width: 70, height: 13, fontSize: 13, fontWeight: 700, fontFamily: 'Arvo Bold', color: '#4A4A4A' }
        },
        canvasSize: { width: 576, height: 384 }
    };
        
        log('🎨 Canvas data prepared with actual template specifications');
        
        // Return the data as JSON for frontend processing
        return Buffer.from(JSON.stringify(memberCardData), 'utf8');
        
    } catch (error) {
        log('❌ Canvas data generation error:', error.message);
        throw error;
    }
}

module.exports = { generateMemberCardWithCanvas };