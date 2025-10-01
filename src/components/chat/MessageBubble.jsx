import React, { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'
import { ZODIAC_COLORS } from '../../utils/mockData'
import SeenByList from './SeenByList'

const MessageBubble = ({ 
  message, 
  currentUser, 
  chat,
  showAvatar = false,
  isLastMessage = false
}) => {
  const isMe = message.senderId === currentUser?.$id || message.from === 'me'
  const [showSeenBy, setShowSeenBy] = useState(false)
  
  const formatTime = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <MessageWrapper $isMe={isMe}>
      {/* Avatar for others */}
      {!isMe && (
        <MessageAvatar $zodiacColor={ZODIAC_COLORS[message.senderZodiac] || '#667eea'}>
          {message.senderAvatar ? (
            <img src={message.senderAvatar} alt={message.senderName} />
          ) : (
            <AvatarIcon>👤</AvatarIcon>
          )}
        </MessageAvatar>
      )}
      
      {/* Message Bubble */}
      <BubbleContainer $isMe={isMe}>
        {!isMe && chat?.isGroup && (
          <SenderName>{message.senderName || 'Member'}</SenderName>
        )}
        
        {message.text && (
          <MessageText>{message.text}</MessageText>
        )}
        
        {message.imageUrl && (
          <MessageImage>
            <img src={message.imageUrl} alt="Shared image" />
          </MessageImage>
        )}
        
        {/* Time and Status */}
        <MessageMeta>
          <MessageTime $isMe={isMe}>
            {formatTime(message.createdAt || message.time)}
          </MessageTime>
          {isMe && (
            <MessageStatus 
              $status={
                message.sending ? 'sending' :
                message.failed ? 'failed' :
                message.id?.startsWith('temp_') ? 'sending' :
                message.seen ? 'seen' : 'delivered'
              }
              $clickable={message.isGroupMessage && message.seenCount > 0}
              onClick={() => {
                if (message.isGroupMessage && message.seenCount > 0) {
                  setShowSeenBy(true)
                }
              }}
            >
              {message.sending ? '⏱' : 
               message.failed ? '❌' :
               message.id?.startsWith('temp_') ? '⏱' :
               message.seen ? (
                 // Show seen count for group messages
                 message.isGroupMessage && message.seenCount > 0
                   ? `✓✓ ${message.seenCount}`
                   : '✓✓'
               ) : '✓'}
            </MessageStatus>
          )}
        </MessageMeta>
      </BubbleContainer>
      
      {/* Seen By Modal */}
      {showSeenBy && (
        <SeenByList 
          message={message} 
          onClose={() => setShowSeenBy(false)} 
        />
      )}
    </MessageWrapper>
  )
}

export default MessageBubble

// Styled Components
const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`

/* Messenger-Style Clean Design */

const MessageWrapper = styled.div`
  display: flex;
  margin-bottom: 12px;
  padding: 0 16px;
  ${props => props.$isMe ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
  animation: ${slideDown} 0.3s ease-out;
`

const MessageAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: ${props => props.$zodiacColor ? 
    `linear-gradient(135deg, ${props.$zodiacColor} 0%, ${props.$zodiacColor}dd 100%)` :
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };
  border: 2px solid ${props => props.$zodiacColor || '#667eea'};
  box-shadow: ${props => props.$zodiacColor ? 
    `0 0 0 1px rgba(255, 255, 255, 0.6), 0 1px 4px ${props.$zodiacColor}33` :
    'none'
  };
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
    border-radius: 14px;
  }
`

const AvatarIcon = styled.span`
  font-size: 16px;
  color: white;
`

const BubbleContainer = styled.div`
  max-width: 75%;
  position: relative;
  transition: all 0.2s ease;
  
  ${props => props.$isMe ? `
    /* My messages - Blue bubble on right */
    background: linear-gradient(135deg, #0084ff 0%, #006bff 100%);
    color: white;
    border-radius: 18px;
    border-bottom-right-radius: 6px;
    padding: 12px 16px 8px 16px;
    margin-left: 32px;
  ` : `
    /* Other messages - Gray bubble on left */
    background: #f1f3f4;
    color: #050505;
    border-radius: 18px;
    border-bottom-left-radius: 6px;
    padding: 12px 16px 8px 16px;
    margin-right: 32px;
  `}
`

const SenderName = styled.div`
  font-size: 12px;
  color: #0084ff;
  font-weight: 600;
  margin-bottom: 4px;
`

const MessageText = styled.div`
  font-size: 15px;
  line-height: 1.4;
  word-wrap: break-word;
  margin: 0;
`

const MessageImage = styled.div`
  border-radius: 12px;
  overflow: hidden;
  margin-top: 8px;
  max-width: 250px;
  
  img {
    width: 100%;
    height: auto;
    display: block;
  }
`

const MessageMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 11px;
`

const MessageTime = styled.span`
  color: ${props => props.$isMe ? 'rgba(255, 255, 255, 0.9)' : '#65676b'};
  font-size: 12px;
  font-weight: 400;
`

const MessageStatus = styled.span`
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease-in-out;
  transform-origin: center;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  user-select: none;
  
  ${props => props.$clickable && `
    &:hover {
      transform: scale(1.05);
      opacity: 0.8;
    }
    &:active {
      transform: scale(0.95);
    }
  `}
  
  ${props => {
    switch(props.$status) {
      case 'sending':
        return `
          color: rgba(255, 255, 255, 0.6);
          animation: pulse 1.5s ease-in-out infinite;
        `;
      case 'delivered':
        return `
          color: rgba(255, 255, 255, 0.8);
          animation: deliveredBounce 0.4s ease-out;
        `;
      case 'seen':
        return `
          color: #4ade80;
          animation: seenBounce 0.4s ease-out;
        `;
      case 'failed':
        return `
          color: #ef4444;
          animation: shake 0.5s ease-in-out;
        `;
      default:
        return `
          color: rgba(255, 255, 255, 0.8);
        `;
    }
  }}
  
  @keyframes pulse {
    0%, 100% { 
      opacity: 1; 
      transform: scale(1);
    }
    50% { 
      opacity: 0.5; 
      transform: scale(0.9);
    }
  }
  
  @keyframes deliveredBounce {
    0% { 
      opacity: 0.6;
      transform: scale(0.8);
    }
    50% { 
      opacity: 1;
      transform: scale(1.1);
    }
    100% { 
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes seenBounce {
    0% { 
      color: rgba(255, 255, 255, 0.8);
      transform: scale(0.9);
    }
    50% { 
      color: #4ade80;
      transform: scale(1.2);
    }
    100% { 
      color: #4ade80;
      transform: scale(1);
    }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-2px); }
    75% { transform: translateX(2px); }
  }
`
