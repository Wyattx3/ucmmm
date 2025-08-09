// Test script to simulate other user sending message
// Run this in browser console or as separate script

async function simulateOtherUserMessage() {
    // Import from global appwrite (assuming it's available)
    const { databases, DATABASE_ID, COLLECTIONS, ID } = window;
    
    try {
        // Get a random chat ID from existing members
        const chatId = "68975a1f002310f9a642"; // Use the chat ID from logs
        
        const fakeMessage = {
            chatId: chatId,
            from: "other",
            text: "Hello from another user! 👋",
            createdAt: new Date().toISOString(),
            senderId: "fake_user_123", // Different from current user
            senderName: "Test User",
            senderAvatar: "🤖"
        };
        
        console.log("📤 Simulating other user message:", fakeMessage);
        
        const result = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.MESSAGES,
            ID.unique(),
            fakeMessage
        );
        
        console.log("✅ Fake message created:", result.$id);
        console.log("🔔 Real-time should trigger now!");
        
    } catch (error) {
        console.error("❌ Failed to create fake message:", error);
    }
}

// To use: Copy this function and run simulateOtherUserMessage() in browser console
console.log("📋 To test real-time messaging:");
console.log("1. Copy the simulateOtherUserMessage function");
console.log("2. Paste in browser console");
console.log("3. Run simulateOtherUserMessage()");
console.log("4. Check if message appears in current chat");

// Export for module use
if (typeof module !== 'undefined') {
    module.exports = simulateOtherUserMessage;
}