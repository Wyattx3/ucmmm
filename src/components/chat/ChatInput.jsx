import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const ChatInput = ({ 
  onSendMessage,
  onTypingStart,
  onTypingStop,
  placeholder = "Type a message..."
}) => {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const handleSend = async () => {
    if ((message.trim() || selectedImage) && onSendMessage && !isSending) {
      setIsSending(true)
      const messageText = message.trim()
      const imageToSend = selectedImage
      
      // Clear inputs
      setMessage('')
      setSelectedImage(null)
      setImagePreview(null)
      
      try {
        await onSendMessage(messageText, imageToSend)
      } catch (error) {
        console.error('Failed to send message:', error)
        // Restore on error
        setMessage(messageText)
        setSelectedImage(imageToSend)
      } finally {
        setIsSending(false)
      }
    }
  }

  const handleImageSelect = (event) => {
    const file = event.target.files[0]
    if (file && file.type.startsWith('image/')) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
      setSelectedImage(file)
    }
    // Reset file input
    event.target.value = ''
  }

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setSelectedImage(null)
    setImagePreview(null)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e) => {
    setMessage(e.target.value)
    
    // Handle typing indicators
    if (!isTyping) {
      setIsTyping(true)
      if (onTypingStart) onTypingStart()
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set new timeout for typing stop
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      if (onTypingStop) onTypingStop()
    }, 1000)
  }

  const handleFocus = () => {
    inputRef.current?.focus()
  }

  const handleBlur = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    setIsTyping(false)
    if (onTypingStop) onTypingStop()
  }

  // Enhanced auto-resize for textarea
  const adjustHeight = () => {
    if (inputRef.current) {
      // First reset to minimum to get accurate scroll height
      inputRef.current.style.height = '20px'
      
      // Get the actual scroll height needed
      const scrollHeight = inputRef.current.scrollHeight
      
      // Set constraints
      const minHeight = 20
      const maxHeight = 80
      
      // Calculate and apply new height
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
      inputRef.current.style.height = newHeight + 'px'
      
      // Show scrollbar if content exceeds max height
      if (scrollHeight > maxHeight) {
        inputRef.current.style.overflowY = 'auto'
      } else {
        inputRef.current.style.overflowY = 'hidden'
      }
    }
  }

  // Adjust height when message changes
  useEffect(() => {
    adjustHeight()
  }, [message])

  // Real-time adjustment on input events
  const handleInput = (e) => {
    requestAnimationFrame(adjustHeight)
  }

  return (
    <InputArea>
      {/* Image Preview */}
      {imagePreview && (
        <ImagePreviewContainer>
          <ImagePreview>
            <img src={imagePreview} alt="Selected" />
            <RemoveImageButton onClick={removeImage}>
              ×
            </RemoveImageButton>
          </ImagePreview>
        </ImagePreviewContainer>
      )}

      <InputWrapper>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
        
        <AttachButton onClick={handleAttachClick}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
          </svg>
        </AttachButton>
        
        <MessageInput
          ref={inputRef}
          value={message}
          onChange={handleInputChange}
          onInput={handleInput}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={isSending}
        />
        
        <SendButton 
          onClick={handleSend}
          $active={(message.trim().length > 0 || selectedImage) && !isSending}
          $sending={isSending}
          disabled={isSending}
        >
          {isSending ? (
            <LoadingSpinner />
          ) : (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          )}
        </SendButton>
      </InputWrapper>
    </InputArea>
  )
}

export default ChatInput

// Styled Components
const InputArea = styled.div`
  background: white;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding: 14px 16px;
  padding-bottom: calc(14px + env(safe-area-inset-bottom, 20px));
  
  /* Mobile-first: Consistent padding */
`

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f1f3f4;
  border-radius: 20px;
  padding: 10px 4px 10px 12px;
  min-height: 40px;
  
  /* Messenger-style: Center aligned for perfect text positioning */
`

const AttachButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  
  &:hover {
    color: #667eea;
    background: rgba(102, 126, 234, 0.1);
  }
`

const MessageInput = styled.textarea`
  flex: 1;
  border: none;
  background: transparent;
  font-size: 15px;
  color: #050505;
  resize: none;
  outline: none;
  font-family: inherit;
  line-height: 20px;
  max-height: 80px;
  min-height: 20px;
  overflow-y: auto;
  padding: 0;
  margin: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  
  /* Perfect vertical centering */
  height: 20px;
  vertical-align: top;
  
  &::placeholder {
    color: #90a4ae;
    line-height: 20px;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  /* Custom scrollbar for long text */
  &::-webkit-scrollbar {
    width: 2px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(144, 164, 174, 0.3);
    border-radius: 1px;
  }
`

const SendButton = styled(motion.button)`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: ${props => 
    props.$sending ? '#0084ff' :
    props.$active ? '#0084ff' : '#9ca3af'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.$sending ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  flex-shrink: 0;
  position: relative;
  
  &:disabled {
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    background: ${props => 
      props.$active ? 'rgba(0, 132, 255, 0.1)' : 'rgba(156, 163, 175, 0.1)'
    };
    transform: scale(1.05);
  }
  
  &:active:not(:disabled) {
    transform: scale(0.95);
    background: ${props => 
      props.$active ? 'rgba(0, 132, 255, 0.2)' : 'rgba(156, 163, 175, 0.2)'
    };
  }
`

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

const ImagePreviewContainer = styled.div`
  padding: 8px 16px 0;
`

const ImagePreview = styled.div`
  position: relative;
  display: inline-block;
  border-radius: 12px;
  overflow: hidden;
  max-width: 200px;
  
  img {
    width: 100%;
    height: auto;
    max-height: 120px;
    object-fit: cover;
    display: block;
  }
`

const RemoveImageButton = styled.button`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
  }
`
