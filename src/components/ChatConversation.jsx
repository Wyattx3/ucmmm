import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import ChatHeader from './chat/ChatHeader'
import MessagesList from './chat/MessagesList'
import ChatInput from './chat/ChatInput'

const ChatConversation = ({ 
  chat, 
  messages = [], 
  currentUser,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  typingUsers = {},
  onBack,
  isLoading = false,
  memberStatus = {},
  allMembers = [] // Add allMembers for group member count
}) => {
  const [lastSeenMessageId, setLastSeenMessageId] = useState(null)
  
  // Get first typing user from typingUsers object
  const typingUserIds = Object.keys(typingUsers)
  const isTyping = typingUserIds.length > 0
  const typingUser = isTyping ? typingUsers[typingUserIds[0]] : null
  
  // Debug: Log typing state
  useEffect(() => {
    console.log('💬 ChatConversation typing state:', {
      typingUsers,
      typingUserIds,
      isTyping,
      typingUser
    })
  }, [typingUsers, typingUserIds, isTyping, typingUser])

  // Mark messages as seen
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.id !== lastSeenMessageId && lastMessage.from !== 'me') {
        setLastSeenMessageId(lastMessage.id)
      }
    }
  }, [messages, lastSeenMessageId])

  return (
    <Container
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <ChatHeader
        chat={chat}
        memberStatus={memberStatus}
        onBack={onBack}
        currentUser={currentUser}
        allMembers={allMembers}
      />

        <MessagesList
          messages={messages}
          currentUser={currentUser}
          chat={chat}
          isLoading={isLoading}
          isTyping={isTyping}
          typingUser={typingUser}
        />

      <ChatInput
        onSendMessage={onSendMessage}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
        placeholder="Type a message..."
      />
    </Container>
  )
}

export default ChatConversation

// Styled Components - Mobile Only
const Container = styled(motion.div)`
  /* Mobile-first: Full screen always */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  z-index: 1001;
  
  /* Remove all desktop responsive code - Mobile only */
`

