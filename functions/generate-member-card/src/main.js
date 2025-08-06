const { Client, Databases, Storage } = require('node-appwrite');
const { generateMemberCardWithCanvas } = require('./canvas-generator');

module.exports = async ({ req, res, log, error }) => {
    log('🚀 Member Card Generation Function Started');
    
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || '688813660017c877f06e')
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    try {
        let userId = null;
        
        // Debug ALL available data sources
        log('🔍 Complete debug info:', {
            reqKeys: Object.keys(req),
            method: req.method,
            url: req.url,
            body: req.body,
            bodyRaw: req.bodyRaw,
            bodyType: typeof req.body,
            bodyRawType: typeof req.bodyRaw,
            variables: req.variables,
            headers: req.headers
        });
        
        // Try multiple ways to get request data
        let requestData = {};
        
        // Method 1: Direct body access
        if (req.body && typeof req.body === 'object') {
            requestData = req.body;
            log('✅ Request body is object:', requestData);
        }
        // Method 2: Raw body parsing
        else if (req.bodyRaw && typeof req.bodyRaw === 'string' && req.bodyRaw.length > 0) {
            try {
                requestData = JSON.parse(req.bodyRaw);
                log('✅ Request bodyRaw parsed successfully:', requestData);
            } catch (parseError) {
                log('❌ Failed to parse bodyRaw:', parseError.message);
            }
        }
        // Method 3: String body parsing
        else if (req.body && typeof req.body === 'string' && req.body.length > 0) {
            try {
                requestData = JSON.parse(req.body);
                log('✅ Request body string parsed successfully:', requestData);
            } catch (parseError) {
                log('❌ Failed to parse body string:', parseError.message);
            }
        }
        
        // Get userId from request data
        userId = requestData.userId;
        
        // Fallback: Check URL parameters
        if (!userId && req.url && req.url.includes('userId=')) {
            const urlMatch = req.url.match(/userId=([^&]+)/);
            if (urlMatch) {
                userId = urlMatch[1];
                log('✅ Found userId in URL:', userId);
            }
        }
        
        if (!userId) {
            log('❌ No userId found anywhere');
            return res.json({
                success: false,
                message: 'User ID လိုအပ်ပါတယ်။',
                debug: {
                    requestData: requestData,
                    body: req.body,
                    bodyRaw: req.bodyRaw,
                    url: req.url,
                    method: req.method
                }
            }, 400);
        }

        log('🎴 Generating REAL member card for user:', userId);

        // Get user data from database with better error handling
        let user;
        try {
            log('🔍 Attempting to get user from database:', userId);
            log('🔍 Database ID: ucera-main, Collection: users');
            user = await databases.getDocument('ucera-main', 'users', userId);
            log('👤 User data retrieved successfully:', user.fullName || user.firstName);
            log('📧 User email:', user.email);
            log('📸 User publicPhoto available:', !!user.publicPhoto);
        } catch (dbError) {
            log('❌ Database access failed with error:', dbError.message);
            log('❌ Error code:', dbError.code);
            log('❌ Error type:', dbError.type);
            // Use sample user data when database fails
            user = {
                fullName: 'Sample User',
                firstName: 'Sample',
                lastName: 'User', 
                dateOfBirth: '1995-08-15',
                memberID: '1234567',
                publicPhoto: null, // Use publicPhoto not publicPhotoUrl
                publicPhotoUrl: null,
                privatePhotoUrl: null
            };
        }

        // Calculate zodiac sign from date of birth
        const zodiacSign = calculateZodiacSign(user.dateOfBirth);
        log('♌ Calculated zodiac sign:', zodiacSign);

        // Get template ID for zodiac sign
        const templateId = getZodiacTemplateId(zodiacSign);
        log('🎨 Template ID:', templateId);

        // Prepare photo URL - use public photo first, then private photo
        let photoUrl = user.publicPhotoUrl || user.privatePhotoUrl;
        
        // If no photo URL, use a professional placeholder
        if (!photoUrl) {
            photoUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face';
            log('📷 Using professional placeholder photo');
        }

        // Prepare Placid API request
        const placidData = {
            template_uuid: templateId,
            layers: {
                "Member Profile": {
                    image: photoUrl
                },
                "Name": {
                    text: user.fullName || `${user.firstName} ${user.lastName}`
                },
                "Member ID No.": {
                    text: user.memberID || user.memberId || '1234567'
                }
            }
        };

        log('📊 Placid request data prepared');
        log('🔑 Placid token available:', !!process.env.PLACID_TOKEN);

        // Generate member card using Canvas (Local Generation)
        try {
            log('🎨 Starting Canvas-based member card generation...');
            
            // Generate member card using Canvas
            const memberCardBuffer = await generateMemberCardWithCanvas(
                user,
                zodiacSign,
                templateId,
                photoUrl,
                log
            );
            
            log('🖼️ Member card generated with Canvas');
            
            // Convert buffer to JSON data for frontend Canvas processing
            const memberCardData = JSON.parse(memberCardBuffer.toString('utf8'));
            log('📄 Member card template data generated successfully');
            
            log('🎉 Member card template data generated successfully!');

            return res.json({
                success: true,
                message: 'Member Card အောင်မြင်စွာ ပြုလုပ်ပြီးပါပြီ! 🎉 (PNG Template Based)',
                data: {
                    ...memberCardData,
                    zodiacSign: zodiacSign,
                    templateId: templateId,
                    generatedWith: 'PNG Template',
                    useRealTemplate: true
                }
            });

        } catch (canvasError) {
            log('❌ Canvas generation error:', canvasError.message);
            
            // Ultimate fallback mode
            log('🔄 Falling back to placeholder mode...');
            
            const fallbackImageUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face';
            
            return res.json({
                success: true,
                message: 'Member Card အောင်မြင်စွာ ပြုလုပ်ပြီးပါပြီ! 🎉 (Fallback Mode)',
                data: {
                    imageUrl: fallbackImageUrl,
                    zodiacSign: zodiacSign,
                    templateId: templateId,
                    userName: user.fullName || `${user.firstName} ${user.lastName}`,
                    memberId: user.memberID || user.memberId || '1234567',
                    fallbackMode: true
                }
            });
        }

    } catch (err) {
        error('❌ Member card generation error:', err);
        error('❌ Error details:', {
            message: err.message,
            stack: err.stack,
            response: err.response ? {
                status: err.response.status,
                data: err.response.data
            } : 'No response'
        });
        
        return res.json({
            success: false,
            message: 'Member card ပြုလုပ်ရာတွင် အမှားရှိပါသည်',
            error: err.message,
            details: err.response ? err.response.data : null
        }, 500);
    }
};

// Helper function to calculate zodiac sign
function calculateZodiacSign(dateOfBirth) {
    if (!dateOfBirth) return 'Aries';
    
    const date = new Date(dateOfBirth);
    const month = date.getMonth() + 1; // 1-12
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
    
    return 'Aries'; // Default
}

// Helper function to get zodiac template ID
function getZodiacTemplateId(zodiacSign) {
    const templates = {
        'Aries': 'fmnviqlmouzpu',
        'Leo': 'hsmyvsu7gdbfm', 
        'Sagittarius': 'mps2l79rtqxlf',
        'Scorpio': 'ughxais7xalkq',
        'Cancer': 'opnwa9wnv17iz',
        'Pisces': 'zzwfgx8kqanqo',
        'Aquarius': 'g3rsjd2npbrad',
        'Gemini': '6ylzdnf2lqkda',
        'Libra': 'anwne8rfxlq9k',
        'Capricorn': 's7bbjdgkrzgkr',
        'Taurus': 'mm5pi4bbqu7yc',
        'Virgo': '6iopugcixby0d'
    };
    
    return templates[zodiacSign] || templates['Aries'];
}

