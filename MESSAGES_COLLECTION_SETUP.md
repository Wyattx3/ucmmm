# Messages Collection Setup - Production Guide

## 🎯 Production Fix for Message Collection

The messaging feature requires a dedicated `messages` collection in Appwrite. Here are the production methods to create it:

## Method 1: Appwrite Console (Recommended)

### Step 1: Access Dashboard
1. Visit: https://cloud.appwrite.io/console
2. Login to your account
3. Select project: **ucera-main eco** 
4. Navigate: **Databases** → **ucera-main** → **Create Collection**

### Step 2: Create Collection
```
Collection ID: messages
Collection Name: Messages
```

### Step 3: Add Attributes
```javascript
1. chatId (String, 255, Required)     // Groups messages by chat
2. from (String, 50, Required)        // 'me' or 'other'  
3. text (String, 5000, Optional)      // Message content
4. createdAt (DateTime, Required)     // Timestamp
5. senderId (String, 255, Optional)   // User ID
6. senderName (String, 255, Optional) // Display name
7. senderAvatar (String, 500000, Optional) // Base64 or URL
8. imageUrl (String, 2000, Optional)  // Media attachments
```

### Step 4: Set Permissions
```
Create: Any (allow anonymous during registration)
Read: Any (public chat visibility)
Update: Users (authenticated users only)
Delete: Users (authenticated users only)
```

## Method 2: Automated Script

### Prerequisites
```bash
# Install Node.js if not available
# Get API key from Appwrite Console > Settings > API Keys
export APPWRITE_API_KEY="your_admin_api_key_here"
```

### Run Setup Script
```bash
cd /Users/apple/Documents/hii/ucmmm
node setup-messages-collection.js
```

## Method 3: Manual REST API

### Create Collection
```bash
curl -X POST https://nyc.cloud.appwrite.io/v1/databases/ucera-main/collections \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: 688813660017c877f06e" \
  -H "X-Appwrite-Key: YOUR_API_KEY" \
  -d '{
    "collectionId": "messages",
    "name": "Messages",
    "permissions": ["create(\"any\")", "read(\"any\")", "update(\"users\")", "delete(\"users\")"]
  }'
```

### Create Attributes (run each separately)
```bash
# chatId
curl -X POST https://nyc.cloud.appwrite.io/v1/databases/ucera-main/collections/messages/attributes/string \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: 688813660017c877f06e" \
  -H "X-Appwrite-Key: YOUR_API_KEY" \
  -d '{"key": "chatId", "size": 255, "required": true}'

# from  
curl -X POST https://nyc.cloud.appwrite.io/v1/databases/ucera-main/collections/messages/attributes/string \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: 688813660017c877f06e" \
  -H "X-Appwrite-Key: YOUR_API_KEY" \
  -d '{"key": "from", "size": 50, "required": true}'

# text
curl -X POST https://nyc.cloud.appwrite.io/v1/databases/ucera-main/collections/messages/attributes/string \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: 688813660017c877f06e" \
  -H "X-Appwrite-Key: YOUR_API_KEY" \
  -d '{"key": "text", "size": 5000, "required": false}'

# createdAt
curl -X POST https://nyc.cloud.appwrite.io/v1/databases/ucera-main/collections/messages/attributes/datetime \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: 688813660017c877f06e" \
  -H "X-Appwrite-Key: YOUR_API_KEY" \
  -d '{"key": "createdAt", "required": true}'

# senderId
curl -X POST https://nyc.cloud.appwrite.io/v1/databases/ucera-main/collections/messages/attributes/string \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: 688813660017c877f06e" \
  -H "X-Appwrite-Key: YOUR_API_KEY" \
  -d '{"key": "senderId", "size": 255, "required": false}'

# senderName
curl -X POST https://nyc.cloud.appwrite.io/v1/databases/ucera-main/collections/messages/attributes/string \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: 688813660017c877f06e" \
  -H "X-Appwrite-Key: YOUR_API_KEY" \
  -d '{"key": "senderName", "size": 255, "required": false}'

# senderAvatar
curl -X POST https://nyc.cloud.appwrite.io/v1/databases/ucera-main/collections/messages/attributes/string \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: 688813660017c877f06e" \
  -H "X-Appwrite-Key: YOUR_API_KEY" \
  -d '{"key": "senderAvatar", "size": 500000, "required": false}'

# imageUrl
curl -X POST https://nyc.cloud.appwrite.io/v1/databases/ucera-main/collections/messages/attributes/string \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: 688813660017c877f06e" \
  -H "X-Appwrite-Key: YOUR_API_KEY" \
  -d '{"key": "imageUrl", "size": 2000, "required": false}'
```

## Verification

After collection creation, verify by:

1. **Console Check**: Go to Databases → ucera-main → messages collection should appear
2. **Test Message**: Try sending a message in the app
3. **Console Logs**: Should show `✅ Message sent to database successfully`
4. **Data Check**: View created documents in Appwrite console

## Production Benefits

✅ **Real-time messaging** with Appwrite subscriptions  
✅ **Persistent storage** - messages saved across sessions  
✅ **Scalable architecture** - handles multiple chats  
✅ **Secure permissions** - proper access controls  
✅ **Media support** - text + image messages  
✅ **User tracking** - sender information preserved  

## Next Steps

Once collection is created:
1. Refresh the app - messaging should work
2. Test sending/receiving messages
3. Verify real-time updates
4. Check message persistence across page refreshes