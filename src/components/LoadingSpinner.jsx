import React from 'react'
import styled, { keyframes } from 'styled-components'

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const SpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: ${props => props.$fullHeight ? '100vh' : '200px'};
  flex-direction: column;
  gap: 16px;
`

const Spinner = styled.div`
  border: 4px solid #e5e7eb;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  width: ${props => props.$size || '40px'};
  height: ${props => props.$size || '40px'};
  animation: ${spin} 1s linear infinite;
`

const LoadingText = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 14px;
  font-weight: 500;
`

const LoadingSpinner = ({ 
  message = 'Loading...', 
  size = '40px', 
  fullHeight = false 
}) => {
  return (
    <SpinnerContainer $fullHeight={fullHeight}>
      <Spinner $size={size} />
      {message && <LoadingText>{message}</LoadingText>}
    </SpinnerContainer>
  )
}

export default LoadingSpinner