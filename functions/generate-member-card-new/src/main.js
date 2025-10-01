const { Client, Databases } = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
    log('🎴 UC ERA - Generate Member Card function triggered');
    
    try {
        // Initialize Appwrite client
        const client = new Client()
            .setEndpoint(req.variables.APPWRITE_FUNCTION_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
            .setProject(req.variables.APPWRITE_FUNCTION_PROJECT_ID || '68d6ef61003543771161')
            .setKey(req.variables.APPWRITE_API_KEY);

        const databases = new Databases(client);

        // Parse request data
        let requestData;
        try {
            requestData = JSON.parse(req.body || '{}');
        } catch (parseError) {
            requestData = req.bodyJson || {};
        }
        
        const { userId } = requestData;

        if (!userId) {
            return res.json({
                success: false,
                error: 'User ID is required'
            }, 400);
        }

        log('👤 Generating member card for user:', userId);

        // Get user data from database
        let user;
        try {
            user = await databases.getDocument('ucera-main', 'users', userId);
            log('✅ User data retrieved:', user.fullName || user.firstName);
        } catch (dbError) {
            log('❌ Database error:', dbError.message);
            return res.json({
                success: false,
                error: 'User not found'
            }, 404);
        }

        // Calculate zodiac sign
        const zodiacSign = calculateZodiacSign(user.dateOfBirth);
        
        // Prepare member card data for frontend processing
        const memberCardData = {
            zodiacSign: zodiacSign,
            templateFile: `${zodiacSign}.png`,
            userName: user.fullName || `${user.firstName} ${user.lastName}`,
            memberId: user.memberID || '0000000',
            userEmail: user.email || 'unknown@email.com',
            publicPhoto: user.publicPhoto,
            canvasSize: { width: 576, height: 384 },
            positions: {
                photo: { x: 39, y: 39, width: 203, height: 305 },
                name: { x: 270, y: 295, width: 284, height: 36 },
                memberId: { x: 462, y: 355, width: 70, height: 13 }
            }
        };

        log('🎉 Member card data prepared for frontend rendering');

        return res.json({
            success: true,
            message: 'Member card data generated successfully',
            data: memberCardData
        });

    } catch (err) {
        error('❌ Member card generation error:', err.message);
        return res.json({
            success: false,
            error: 'Internal server error'
        }, 500);
    }
};

// Helper function to calculate zodiac sign
function calculateZodiacSign(dateOfBirth) {
    if (!dateOfBirth) return 'Aries';
    
    const date = new Date(dateOfBirth);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return 'Aries';
    if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return 'Taurus';
    if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return 'Gemini';
    if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return 'Cancer';
    if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return 'Leo';
    if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return 'Virgo';
    if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return 'Libra';
    if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return 'Scorpio';
    if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return 'Sagittarius';
    if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return 'Capricorn';
    if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return 'Aquarius';
    if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return 'Pisces';
    
    return 'Aries';
}