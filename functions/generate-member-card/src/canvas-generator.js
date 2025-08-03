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
        const memberCardData = {
            templateFile: templateFile,
            zodiacSign: zodiacSign,
            userName: userName,
            memberId: memberId,
            photoUrl: photoUrl,
                                positions: {
                        photo: { x: 40, y: 41, width: 201, height: 302, borderRadius: 14 },
                        name: { x: 280, y: 301, width: 275, height: 34, fontSize: 50, fontWeight: 700, fontFamily: 'Asap Bold Italic', color: '#000000' },
                        memberId: { x: 463, y: 358, width: 43, height: 13, fontSize: 50, fontWeight: 700, fontFamily: 'Arvo Bold', color: '#4A4A4A' }
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