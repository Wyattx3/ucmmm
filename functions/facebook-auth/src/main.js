import { Client, Databases, Account } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || '688813660017c877f06e')
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const account = new Account(client);

    try {
        const { userId, facebookData } = JSON.parse(req.body || '{}');

        if (!userId || !facebookData) {
            return res.json({
                success: false,
                message: 'Required data missing'
            }, 400);
        }

        log('🔗 Processing Facebook authentication for user:', userId);
        log('📊 Facebook data received:', JSON.stringify(facebookData, null, 2));

        // Update user document with Facebook connection status
        const updateData = {
            facebookConnected: true,
            facebookId: facebookData.id,
            facebookName: facebookData.name,
            facebookConnectedAt: new Date().toISOString()
        };

        log('📝 Updating user with Facebook data...');
        
        await databases.updateDocument(
            'ucera-main',
            'users', 
            userId,
            updateData
        );

        log('✅ Facebook authentication completed successfully');

        return res.json({
            success: true,
            message: 'Facebook လင့်ခ်ချိတ်ပြီးပါပြီ!',
            data: {
                facebookConnected: true,
                facebookName: facebookData.name
            }
        });

    } catch (err) {
        error('❌ Facebook authentication error:', err);
        return res.json({
            success: false,
            message: 'Facebook လင့်ခ်ချိတ်ရာတွင် အမှားရှိပါသည်',
            error: err.message
        }, 500);
    }
};