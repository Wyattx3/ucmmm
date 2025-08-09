# Create Messages Collection - Manual Steps

## Via Appwrite Console Dashboard

1. **Login to Appwrite Console**: https://cloud.appwrite.io/console
2. **Navigate to**: Project > Databases > ucera-main database
3. **Create New Collection**:
   - Collection ID: `messages`
   - Collection Name: `Messages`

## Add Attributes

```
1. chatId
   - Type: String
   - Size: 255
   - Required: Yes
   - Array: No

2. from  
   - Type: String
   - Size: 50
   - Required: Yes
   - Array: No

3. text
   - Type: String  
   - Size: 5000
   - Required: No
   - Array: No

4. createdAt
   - Type: DateTime
   - Required: Yes
   - Array: No

5. senderId
   - Type: String
   - Size: 255  
   - Required: No
   - Array: No

6. senderName
   - Type: String
   - Size: 255
   - Required: No
   - Array: No

7. senderAvatar
   - Type: String
   - Size: 500000 (for base64 images)
   - Required: No
   - Array: No

8. imageUrl
   - Type: String
   - Size: 2000
   - Required: No
   - Array: No
```

## Set Permissions

### Create Permission
- Any: ✅ (Allow any user to create messages)

### Read Permission  
- Any: ✅ (Allow any user to read messages)

### Update Permission
- Users: ✅ (Only authenticated users can update)

### Delete Permission
- Users: ✅ (Only authenticated users can delete)

## After Creation

1. Update `/src/lib/appwrite.js`:
   ```javascript
   MESSAGES: 'messages' // Change back from 'users' to 'messages'
   ```

2. Test messaging functionality

## Alternative: CLI Command (if Node.js available)

```bash
# Create collection
npx appwrite databases createCollection \
  --databaseId ucera-main \
  --collectionId messages \
  --name "Messages"

# Add attributes
npx appwrite databases createStringAttribute \
  --databaseId ucera-main \
  --collectionId messages \
  --key chatId \
  --size 255 \
  --required true

npx appwrite databases createStringAttribute \
  --databaseId ucera-main \
  --collectionId messages \
  --key from \
  --size 50 \
  --required true

npx appwrite databases createStringAttribute \
  --databaseId ucera-main \
  --collectionId messages \
  --key text \
  --size 5000 \
  --required false

npx appwrite databases createDatetimeAttribute \
  --databaseId ucera-main \
  --collectionId messages \
  --key createdAt \
  --required true

npx appwrite databases createStringAttribute \
  --databaseId ucera-main \
  --collectionId messages \
  --key senderId \
  --size 255 \
  --required false

npx appwrite databases createStringAttribute \
  --databaseId ucera-main \
  --collectionId messages \
  --key senderName \
  --size 255 \
  --required false

npx appwrite databases createStringAttribute \
  --databaseId ucera-main \
  --collectionId messages \
  --key senderAvatar \
  --size 500000 \
  --required false
```