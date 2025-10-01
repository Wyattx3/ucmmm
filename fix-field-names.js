import fs from 'fs';

const authFile = './src/services/auth.js';

// Read the file
let content = fs.readFileSync(authFile, 'utf8');

// Field name mappings (camelCase -> snake_case)
const fieldMappings = {
    'emailVerified': 'email_verified',
    'emailVerifiedAt': 'email_verified_at',
    'phoneNumber': 'phone_number',
    'countryCode': 'country_code',
    'registrationStep': 'registration_step',
    'registrationStartedAt': 'registration_started_at',
    'registrationCompleted': 'registration_completed',
    'registrationCompletedAt': 'registration_completed_at',
    'accountStatus': 'account_status',
    'livingCity': 'living_city',
    'relationshipStatus': 'relationship_status',
    'favoriteFood': 'favorite_food',
    'favoriteArtist': 'favorite_artist',
    'loveLanguage': 'love_language',
    'hasMemberCard': 'has_member_card',
    'memberCardCompletedAt': 'member_card_completed_at',
    'publicPhoto': 'public_photo',
    'publicPhotoUrl': 'public_photo_url',
    'privatePhotoId': 'private_photo_id',
    'privatePhotoUrl': 'private_photo_url',
    'privatePhotoSize': 'private_photo_size',
    'firstName': 'first_name',
    'middleName': 'middle_name',
    'lastName': 'last_name',
    'fullName': 'full_name',
    'dateOfBirth': 'date_of_birth'
};

// Replace in object literals (when used as keys in database operations)
Object.entries(fieldMappings).forEach(([camel, snake]) => {
    // Pattern for object keys in database operations
    const patterns = [
        new RegExp(`(\\s+)${camel}:`, 'g'),  // In object literals
        new RegExp(`'${camel}'`, 'g'),  // In Query.equal and similar
        new RegExp(`"${camel}"`, 'g'),  // In Query.equal with double quotes
    ];
    
    patterns.forEach(pattern => {
        if (pattern.source.includes(':')) {
            content = content.replace(pattern, `$1${snake}:`);
        } else {
            content = content.replace(pattern, `'${snake}'`);
        }
    });
});

// Write back
fs.writeFileSync(authFile, content, 'utf8');

console.log('✅ Field names updated successfully in auth.js');
console.log('📝 Converted all camelCase database fields to snake_case');

