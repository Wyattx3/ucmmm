import React from 'react'
import styled from 'styled-components'
import { ZODIAC_COLORS } from '../../utils/mockData'

const ChatHeader = ({ 
  chat, 
  memberStatus = {}, 
  onBack, 
  currentUser,
  allMembers = []
}) => {
  const isOnline = chat?.otherUserId && memberStatus[chat.otherUserId]?.isOnline
  const zodiacColor = !chat?.isGroup && chat?.zodiacSign ? ZODIAC_COLORS[chat.zodiacSign] : null

  // Calculate real online count for groups
  const getOnlineCount = () => {
    if (!chat?.isGroup) return 0
    
    // Filter members based on group type
    let groupMembers = allMembers
    
    if (chat.id === 'uc-boy-group') {
      groupMembers = allMembers.filter(m => m.gender === 'male')
    } else if (chat.id === 'uc-girl-group') {
      groupMembers = allMembers.filter(m => m.gender === 'female')
    }
    // uc-main-group includes all members
    
    // Count online members
    const onlineCount = groupMembers.filter(m => memberStatus[m.id]?.isOnline).length
    
    // Add current user if online
    const currentUserOnline = memberStatus[currentUser?.$id]?.isOnline ? 1 : 0
    
    return onlineCount + currentUserOnline
  }

  const onlineCount = getOnlineCount()

  // Debug log for group statistics
  if (chat?.isGroup) {
      groupId: chat.id,
      groupName: chat.name,
      totalMembers: chat.memberCount,
      onlineCount: onlineCount,
      allMembersCount: allMembers.length,
      memberStatusCount: Object.keys(memberStatus).length
    })
  }

  return (
    <Header>
      <HeaderContent>
        <BackButton onClick={onBack}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 18l-6-6 6-6"/>
          </svg>
        </BackButton>
        
        <UserInfo>
          <Avatar 
            $isGroup={chat?.isGroup}
            $hasCustomIcon={chat?.id !== 'uc-main-group' && chat?.icon?.startsWith('/')}
            $zodiacColor={zodiacColor}
          >
            {chat?.publicPhoto ? (
              <img src={chat.publicPhoto} alt={chat.name} />
            ) : chat?.isGroup ? (
              chat?.id === 'uc-main-group' ? (
                <UCLogoHeader src="/ucera-logo.png" alt="UC" />
              ) : chat?.icon?.startsWith('/') ? (
                <GroupLogoIcon src={chat.icon} alt={chat.name} />
              ) : (
                <GroupIcon>{chat.icon || '👥'}</GroupIcon>
              )
            ) : (
              <UserIcon>👤</UserIcon>
            )}
            {!chat?.isGroup && isOnline && <OnlineIndicator />}
          </Avatar>
          
          <UserDetails>
            <UserName>{chat?.name || 'Chat'}</UserName>
            <UserStatus>
              {chat?.isGroup 
                ? `${chat?.memberCount || 'Group chat'} • ${onlineCount} online`
                : isOnline 
                  ? 'Active now' 
                  : memberStatus[chat?.otherUserId]?.status || 'Offline'
              }
            </UserStatus>
          </UserDetails>
        </UserInfo>

        {/* Remove action buttons - not needed yet */}
      </HeaderContent>
    </Header>
  )
}

export default ChatHeader

// Styled Components
const Header = styled.header`
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1002;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  padding: 14px 16px;
  gap: 12px;
  min-height: 56px;
  
  /* Mobile-first: No responsive breakpoints needed */
`

const BackButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border: none;
  background: transparent;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
`

const UserInfo = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`

const Avatar = styled.div`
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  overflow: hidden;
  background: ${props => 
    props.$hasCustomIcon ? 'white' :
    props.$zodiacColor ? `linear-gradient(135deg, ${props.$zodiacColor} 0%, ${props.$zodiacColor}dd 100%)` :
    props.$isGroup ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' :
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: ${props => 
    props.$hasCustomIcon ? '3px solid #f59e0b' :
    props.$zodiacColor ? `3px solid ${props.$zodiacColor}` :
    props.$isGroup ? '3px solid #f59e0b' : 'none'
  };
  box-shadow: ${props => 
    props.$zodiacColor ? `0 0 0 1px rgba(255, 255, 255, 0.8), 0 2px 6px ${props.$zodiacColor}44` :
    props.$hasCustomIcon ? '0 0 0 1px rgba(255, 255, 255, 0.8), 0 2px 6px rgba(245, 158, 11, 0.3)' :
    'none'
  };
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 18px;
  }
`

const GroupIcon = styled.span`
  font-size: 20px;
`

const UserIcon = styled.span`
  font-size: 20px;
  filter: brightness(0) invert(1);
`

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  background: #22c55e;
  border: 3px solid white;
  border-radius: 50%;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`

const UserDetails = styled.div`
  flex: 1;
  min-width: 0;
`

const UserName = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  /* Mobile-optimized font size */
`

const UserStatus = styled.p`
  margin: 0;
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

/* Action buttons removed - clean header design */

const GroupLogoIcon = styled.img`
  width: 24px;
  height: 24px;
  object-fit: contain;
  filter: none;
  border-radius: 12px;
`

const UCLogoHeader = styled.img`
  width: 28px;
  height: 28px;
  object-fit: contain;
  filter: brightness(0) invert(1) contrast(1.3);
  transform: scale(1.1);
`
