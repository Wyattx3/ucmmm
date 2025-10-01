import React from 'react'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'

const TypingIndicator = ({ typingUser }) => {
  return (
    <TypingWrapper>
      {/* Avatar */}
      <TypingAvatar>
        {typingUser?.avatar ? (
          <img src={typingUser.avatar} alt={typingUser.name} />
        ) : (
          <AvatarIcon>👤</AvatarIcon>
        )}
      </TypingAvatar>
      
      {/* Typing Bubble */}
      <TypingContainer
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
      >
        <TypingText>{typingUser?.name || 'Someone'} is typing</TypingText>
        <TypingDots>
          <TypingDot delay={0} />
          <TypingDot delay={0.2} />
          <TypingDot delay={0.4} />
        </TypingDots>
      </TypingContainer>
    </TypingWrapper>
  )
}

export default TypingIndicator

// Styled Components
const bounceIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`

const TypingWrapper = styled.div`
  display: flex;
  margin-bottom: 12px;
  padding: 0 16px;
  justify-content: flex-start;
  animation: ${bounceIn} 0.3s ease-out;
`

const TypingAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 8px;
  margin-top: 4px;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const AvatarIcon = styled.span`
  font-size: 16px;
  color: white;
`

const TypingContainer = styled(motion.div)`
  background: #f1f3f4;
  border-radius: 18px;
  border-bottom-left-radius: 6px;
  padding: 12px 16px;
  margin-right: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
`

const TypingText = styled.span`
  font-size: 12px;
  color: #65676b;
  font-style: italic;
`

const TypingDots = styled.div`
  display: flex;
  gap: 4px;
`

const TypingDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #90a4ae;
  animation: typing 1.4s infinite ease-in-out;
  animation-delay: ${props => props.delay}s;
  
  @keyframes typing {
    0%, 80%, 100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
`
