import React, { useRef, useEffect } from 'react'
import styled from 'styled-components'
import { AnimatePresence, motion } from 'framer-motion'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

const MessagesList = ({ 
  messages = [], 
  currentUser, 
  chat,
  isLoading = false,
  isTyping = false,
  typingUser = null
}) => {
  const messagesEndRef = useRef(null)

  const scrollToTop = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Auto-scroll when messages change
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToTop()
    }, 100)
    return () => clearTimeout(timer)
  }, [messages])
  
  // Auto-scroll when typing indicator appears/disappears
  useEffect(() => {
    if (isTyping) {
      console.log('📜 Auto-scrolling for typing indicator...')
      const timer = setTimeout(() => {
        scrollToTop()
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [isTyping])

  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>Loading messages...</LoadingText>
      </LoadingContainer>
    )
  }

  if (messages.length === 0) {
    return (
      <EmptyState>
        <EmptyIcon>💬</EmptyIcon>
        <EmptyText>No messages yet</EmptyText>
        <EmptySubtext>Start the conversation!</EmptySubtext>
      </EmptyState>
    )
  }

  return (
    <Container>
      <MessagesContainer>
        {/* New messages appear at top */}
        <div ref={messagesEndRef} />
        
        {isTyping && typingUser && <TypingIndicator typingUser={typingUser} />}
        
        <AnimatePresence initial={false}>
          {messages.slice().reverse().map((msg, index) => {
            const originalIndex = messages.length - 1 - index
            const isMe = msg.senderId === currentUser?.$id || msg.from === 'me'
            const showAvatar = !isMe && (originalIndex === 0 || messages[originalIndex - 1]?.senderId !== msg.senderId)
            const isLastMessage = index === 0 // First in reversed array is newest
            
            return (
              <motion.div
                key={msg.id || originalIndex}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ 
                  duration: 0.3, 
                  ease: "easeOut",
                  delay: index * 0.02 
                }}
              >
                <MessageBubble
                  message={msg}
                  currentUser={currentUser}
                  chat={chat}
                  showAvatar={showAvatar}
                  isLastMessage={isLastMessage}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </MessagesContainer>
    </Container>
  )
}

export default MessagesList

// Styled Components
const Container = styled.div`
  flex: 1;
  overflow-y: auto;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  position: relative;
  margin-top: 60px; /* Account for fixed header */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  
  /* Hide scrollbar but keep functionality */
  &::-webkit-scrollbar {
    width: 0px;
    background: transparent;
  }
  scrollbar-width: none;
  -ms-overflow-style: none;
`

const MessagesContainer = styled.div`
  padding: 80px 0px 16px;
  display: flex;
  flex-direction: column-reverse;
  gap: 0px;
  min-height: calc(100vh - 140px);
  justify-content: flex-start;
  
  /* Messenger-style: Clean layout with minimal spacing */
`

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
`

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

const LoadingText = styled.p`
  color: #666;
  font-size: 14px;
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
`

const EmptyIcon = styled.div`
  font-size: 48px;
  opacity: 0.3;
`

const EmptyText = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
`

const EmptySubtext = styled.p`
  margin: 0;
  font-size: 14px;
  color: #666;
`
