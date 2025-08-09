# Multi-User Messaging Test Guide

## 🎯 Goal: Test Real User-to-User Messaging

### Method 1: Two Browser Windows (Recommended)

1. **Setup Windows**:
   ```
   Window 1: Normal browser (or Incognito)
   Window 2: Incognito/Private browsing mode
   ```

2. **Register Two Users**:
   - **Window 1**: Register User A (e.g., "John Doe")
   - **Window 2**: Register User B (e.g., "Jane Smith") 
   - Complete full registration (7 steps) in both

3. **Test Cross-Communication**:
   - **Window 1**: Go to Members list → Click User B → Send message
   - **Window 2**: Check if message appears in real-time
   - **Window 2**: Reply back to User A
   - **Window 1**: Verify reply received

### Method 2: Two Different Devices

1. **Device 1**: Phone/tablet - Register User A
2. **Device 2**: Computer - Register User B  
3. Test messaging between devices

### Method 3: Simulated Testing (Current)

Use CLI to inject messages as different users:

```bash
# Send message from "Alice" to current user
appwrite databases create-document \
  --database-id ucera-main \
  --collection-id messages \
  --document-id "alice_msg_$(date +%s)" \
  --data '{
    "chatId":"YOUR_USER_ID", 
    "from":"other",
    "text":"Hello from Alice!",
    "createdAt":"'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
    "senderId":"alice_test",
    "senderName":"Alice",
    "senderAvatar":"👩"
  }'
```

## 🔍 What to Monitor

### Console Logs (Critical):
```
🔔 Setting up global realtime subscription for user X
📡 Global realtime event received: [...]
💬 New message received globally: {...}
🔍 Current user ID: X, Message sender ID: Y
📬 Updated last message for chat Z
➕ Adding received message to current chat: {...}
```

### UI Changes:
- ✅ Last message updates in Members list
- ✅ Message appears in open chat (if chat is open)
- ✅ Real-time delivery (no refresh needed)
- ✅ Sender name/avatar display correctly

## ❌ Common Issues

### Issue: Messages not appearing
**Check:**
- Console for realtime subscription logs
- Message sender ID vs current user ID  
- Chat ID matching

### Issue: Last messages not updating
**Check:**
- `lastMsgByChat` state updates in console
- Member list re-rendering

### Issue: Only own messages work
**Check:**
- Global subscription vs chat-specific subscription
- User filtering logic (`senderId !== loggedInUser.$id`)

## 🚀 Production Test Checklist

- [ ] User A → User B messaging works
- [ ] User B → User A messaging works  
- [ ] Last message displays correctly
- [ ] Real-time updates (no refresh)
- [ ] Cross-device compatibility
- [ ] Multiple concurrent chats
- [ ] Message persistence across page refresh
- [ ] Avatar/sender info display

## 🔧 Debug Commands

```bash
# List all messages in collection
appwrite databases list-documents --database-id ucera-main --collection-id messages

# List all users  
appwrite databases list-documents --database-id ucera-main --collection-id users

# Create test message
appwrite databases create-document --database-id ucera-main --collection-id messages --document-id "test_$(date +%s)" --data '{"chatId":"TARGET_USER_ID","from":"other","text":"Test message","createdAt":"'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'","senderId":"test_sender","senderName":"Test User","senderAvatar":"🤖"}'
```