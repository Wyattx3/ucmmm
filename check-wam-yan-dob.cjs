const sdk = require('node-appwrite');

const client = new sdk.Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('68db5335002a5780ae9a')
    .setKey('standard_9e65d8e1af77654ab87f7ac216829f31d5e889a920feac3087a3e4ff066fb2769a5e27848127de9308ee707b692887580ef701fa64df49f0cc96054fef8e73d67ff5b9d338bb972fd4f03f0598e7a3f632e9461f2ba80c3ea0fe67a7011a49b5f8c624476564d507b16d74a57cccb2c27b3707f3d9e578699e1d0c0bff836fc9');

const databases = new sdk.Databases(client);

async function checkWamYan() {
    try {
        // Get all users
        const users = await databases.listDocuments(
            'ucera_main_db',
            'users',
            [sdk.Query.limit(100)]
        );

        console.log('\n📊 All Users in Database:\n');
        console.log('Total users:', users.total);
        console.log('\n' + '='.repeat(80) + '\n');

        users.documents.forEach(user => {
            const name = user.full_name || user.first_name || 'Unknown';
            const dob = user.date_of_birth || 'NO DATE_OF_BIRTH';
            const id = user.$id;
            
            // Calculate zodiac from DOB
            let zodiac = 'Unknown';
            if (user.date_of_birth) {
                const date = new Date(user.date_of_birth);
                const month = date.getMonth() + 1;
                const day = date.getDate();
                
                if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) zodiac = 'Aquarius';
                else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) zodiac = 'Pisces';
                else if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) zodiac = 'Aries';
                else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) zodiac = 'Taurus';
                else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) zodiac = 'Gemini';
                else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) zodiac = 'Cancer';
                else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) zodiac = 'Leo';
                else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) zodiac = 'Virgo';
                else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) zodiac = 'Libra';
                else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) zodiac = 'Scorpio';
                else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) zodiac = 'Sagittarius';
                else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) zodiac = 'Capricorn';
            }

            console.log(`👤 ${name}`);
            console.log(`   ID: ${id}`);
            console.log(`   📅 DOB: ${dob}`);
            console.log(`   ♈ Zodiac: ${zodiac}`);
            console.log('');
        });

        console.log('='.repeat(80));

        // Find Wam Yan specifically
        const wamYan = users.documents.find(u => 
            (u.full_name || '').includes('Wam Yan') || 
            (u.first_name || '').includes('Wam') && (u.full_name || '').includes('Yan')
        );

        if (wamYan) {
            console.log('\n🎯 WAM YAN FOUND:\n');
            console.log('Full Data:', JSON.stringify({
                id: wamYan.$id,
                name: wamYan.full_name || wamYan.first_name,
                date_of_birth: wamYan.date_of_birth,
                member_id: wamYan.member_id
            }, null, 2));
        } else {
            console.log('\n⚠️  WAM YAN NOT FOUND');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkWamYan();

