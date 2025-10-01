import React, { useState, useMemo, useEffect } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { ZODIAC_COLORS } from '../utils/mockData'

const ChatList = ({ 
  members = [], 
  lastMessages = {}, 
  memberStatus = {},
  currentUser,
  onChatSelect,
  onSearch
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all') // all, online, groups
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [searchResults, setSearchResults] = useState({ members: [], groups: [], total: 0 })

  // Debounce search query for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filter members by gender for groups
  const boyGroupMembers = useMemo(() => {
    return members.filter(member => member.gender === 'male')
  }, [members])

  const girlGroupMembers = useMemo(() => {
    return members.filter(member => member.gender === 'female')
  }, [members])

  // Get current user's gender from their profile (will be passed from parent)
  const currentUserGender = currentUser?.gender || null

  // Fixed UC ERA groups - filtered by user's gender
  const allGroups = [
    {
      id: 'uc-main-group',
      name: 'Unbreakable Cube',
      isGroup: true,
      icon: '/ucera-logo.png',
      description: 'Main UC ERA discussion group',
      memberCount: `${members.length} Members`
    },
    {
      id: 'uc-boy-group', 
      name: 'Boy Group',
      isGroup: true,
      icon: '/icons/boy-group.png',
      description: 'UC ERA male members group',
      memberCount: `${boyGroupMembers.length} Boys`,
      allowedGender: 'male' // Only male users can access
    },
    {
      id: 'uc-girl-group',
      name: 'Girl Group', 
      isGroup: true,
      icon: '/icons/girl-group.png',
      description: 'UC ERA female members group',
      memberCount: `${girlGroupMembers.length} Girls`,
      allowedGender: 'female' // Only female users can access
    }
  ]

  // Filter groups based on current user's gender
  // Main group is visible to all, boy/girl groups only to respective genders
  const fixedGroups = useMemo(() => {
    const filtered = allGroups.filter(group => {
      // Main group is always visible
      if (group.id === 'uc-main-group') return true
      
      // For gender-specific groups, check user's gender
      if (group.allowedGender) {
        return currentUserGender === group.allowedGender
      }
      
      return true
    })
    
      currentUserGender,
      totalMembers: members.length,
      boyMembers: boyGroupMembers.length,
      girlMembers: girlGroupMembers.length,
      visibleGroups: filtered.map(g => g.name)
    })
    
    return filtered
  }, [currentUserGender, boyGroupMembers.length, girlGroupMembers.length, members.length])

  // Define getChatId function with proper hoisting
  function getChatId(memberId) {
    return [currentUser?.$id, memberId].sort().join('_')
  }

  // Get zodiac color for user
  const getZodiacColor = (member) => {
    return ZODIAC_COLORS[member.zodiacSign] || '#667eea'
  }

  // Count unread messages with safety checks
  const unreadCount = React.useMemo(() => {
    let count = 0
    
    // Safety check for data
    if (!lastMessages || !currentUser) return 0
    
    // Count unread from groups
    fixedGroups.forEach(group => {
      const lastMsg = lastMessages[group.id]
      if (lastMsg && !lastMsg.isFromMe && lastMsg.isUnread !== false) {
        count++
      }
    })
    
    // Count unread from members - with safety check
    if (members && Array.isArray(members)) {
      members.forEach(member => {
        const chatId = getChatId(member.id)
        const lastMsg = lastMessages[chatId]
        if (lastMsg && !lastMsg.isFromMe && lastMsg.isUnread !== false) {
          count++
        }
      })
    }
    
    return count
  }, [lastMessages, members, fixedGroups, currentUser])

  // Enhanced search with highlighting and better matching
  const performSearch = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return { members, groups: fixedGroups, hasResults: true }
    }

    const searchTerm = debouncedSearch.toLowerCase().trim()
    
    // Advanced search - match name, last message, or member count
    const searchMembers = members.filter(member => {
      const nameMatch = member.name.toLowerCase().includes(searchTerm)
      const chatId = getChatId(member.id)
      const lastMsg = lastMessages[chatId]
      const messageMatch = lastMsg?.text?.toLowerCase().includes(searchTerm)
      
      return nameMatch || messageMatch
    })

    const searchGroups = fixedGroups.filter(group => {
      const nameMatch = group.name.toLowerCase().includes(searchTerm)
      const descMatch = group.description.toLowerCase().includes(searchTerm)
      const lastMsg = lastMessages[group.id]
      const messageMatch = lastMsg?.text?.toLowerCase().includes(searchTerm)
      
      return nameMatch || descMatch || messageMatch
    })

    return { 
      members: searchMembers, 
      groups: searchGroups, 
      hasResults: searchMembers.length > 0 || searchGroups.length > 0,
      searchTerm
    }
  }, [debouncedSearch, members, fixedGroups, lastMessages, getChatId])

  // Apply filters (tab, unread, search)
  const filteredMembers = useMemo(() => {
    let result = performSearch.members
    
    // Apply tab filter
    if (activeTab === 'online') {
      result = result.filter(member => memberStatus[member.id]?.isOnline)
    } else if (activeTab === 'groups') {
      result = []
    }
    
    // Apply unread filter
    if (showUnreadOnly) {
      result = result.filter(member => {
        const chatId = getChatId(member.id)
        const lastMsg = lastMessages[chatId]
        return lastMsg && !lastMsg.isFromMe && lastMsg.isUnread !== false
      })
    }
    
    return result
  }, [performSearch.members, activeTab, memberStatus, showUnreadOnly, getChatId, lastMessages])

  const filteredGroups = useMemo(() => {
    let result = performSearch.groups
    
    // Apply unread filter
    if (showUnreadOnly) {
      result = result.filter(group => {
        const lastMsg = lastMessages[group.id]
        return lastMsg && !lastMsg.isFromMe && lastMsg.isUnread !== false
      })
    }
    
    return result
  }, [performSearch.groups, showUnreadOnly, lastMessages])

  // Highlight search terms in text
  const highlightText = (text, searchTerm) => {
    if (!searchTerm || !text) return text
    
    const regex = new RegExp(`(${searchTerm})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <SearchHighlight key={index}>{part}</SearchHighlight>
      ) : part
    )
  }

  const formatLastMessage = (lastMsg, isGroup = false) => {
    if (!lastMsg) return 'Start a conversation'
    
    let messageText = ''
    
    if (lastMsg.imageUrl && lastMsg.text) {
      messageText = `📷 ${lastMsg.text}`
    } else if (lastMsg.imageUrl) {
      messageText = '📷 Photo'
    } else {
      messageText = lastMsg.text || 'Start a conversation'
    }
    
    // For group messages, prepend sender name if not from current user
    if (isGroup && lastMsg.senderName && !lastMsg.isFromMe) {
      return `${lastMsg.senderName}: ${messageText}`
    }
    
    return messageText
  }

  const formatTime = (time) => {
    if (!time) return ''
    
    const messageDate = new Date(time)
    const now = new Date()
    const diffInHours = (now - messageDate) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // Less than a week
      return messageDate.toLocaleDateString([], { weekday: 'short' })
    }
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <Container>
      {/* Header */}
      <Header>
        <HeaderTop>
          <Title>Messages</Title>
          <HeaderActions>
            <UnreadButton 
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              $active={showUnreadOnly}
            >
              <UnreadIcon>
                {showUnreadOnly ? (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                  </svg>
                )}
              </UnreadIcon>
              <UnreadCount>{showUnreadOnly ? 'All' : unreadCount}</UnreadCount>
            </UnreadButton>
          </HeaderActions>
        </HeaderTop>

        {/* Filter Info */}
        {showUnreadOnly && (
          <FilterInfo>
            <FilterIcon>📬</FilterIcon>
            <FilterText>Showing unread messages only</FilterText>
            <FilterClear onClick={() => setShowUnreadOnly(false)}>
              Show all
            </FilterClear>
          </FilterInfo>
        )}

        {/* Search Bar */}
        <SearchContainer>
          <SearchIcon>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </SearchIcon>
          <SearchInput
            placeholder={showUnreadOnly ? "Search unread messages..." : "Search conversations..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
          {debouncedSearch && (
            <SearchResultCount>
              {filteredMembers.length + filteredGroups.length} results
            </SearchResultCount>
          )}
          {searchQuery && (
            <ClearButton onClick={() => setSearchQuery('')}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </ClearButton>
          )}
        </SearchContainer>

        {/* Tabs */}
        <TabsContainer>
          <Tab 
            $active={activeTab === 'all'} 
            onClick={() => setActiveTab('all')}
          >
            All
          </Tab>
          <Tab 
            $active={activeTab === 'online'} 
            onClick={() => setActiveTab('online')}
          >
            Online
          </Tab>
          <Tab 
            $active={activeTab === 'groups'} 
            onClick={() => setActiveTab('groups')}
          >
            Groups
          </Tab>
        </TabsContainer>
      </Header>

      {/* Chat List */}
      <ChatListContainer>
        <AnimatePresence>
          {(activeTab === 'groups' ? filteredGroups : filteredMembers).length === 0 && 
           (activeTab !== 'all' || filteredGroups.length === 0) ? (
            <EmptyState
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyIcon>🔍</EmptyIcon>
              <EmptyText>
                {debouncedSearch ? `No results for "${debouncedSearch}"` :
                 showUnreadOnly ? 'No unread messages' :
                 activeTab === 'groups' ? 'No groups found' : 'No conversations found'}
              </EmptyText>
              <EmptySubtext>
                {debouncedSearch ? 'Try searching for member names or message content' :
                 showUnreadOnly ? 'All messages have been read!' :
                 activeTab === 'groups' ? 'UC ERA has 3 main groups' : 'Start chatting with members'}
              </EmptySubtext>
            </EmptyState>
          ) : (
            <>
              {/* Show Groups in 'all' and 'groups' tabs */}
              {(activeTab === 'all' || activeTab === 'groups') && filteredGroups.map((group) => {
                const lastMsg = lastMessages[group.id]
                
                return (
                  <ChatItem
                    key={group.id}
                    onClick={() => onChatSelect(group)}
                    whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                  >
                    <AvatarContainer>
                      <Avatar 
                        $isGroup={true} 
                        $hasCustomIcon={group.id !== 'uc-main-group' && group.icon.startsWith('/')}
                      >
                        {group.id === 'uc-main-group' ? (
                          <UCLogo src="/ucera-logo.png" alt="UC" />
                        ) : group.icon.startsWith('/') ? (
                          <GroupLogo src={group.icon} alt={group.name} />
                        ) : (
                          <AvatarPlaceholder>{group.icon}</AvatarPlaceholder>
                        )}
                      </Avatar>
                      <GroupBadge />
                    </AvatarContainer>

                    <ChatContent>
                    <ChatHeader>
                      <ChatName>
                        {highlightText(group.name, performSearch.searchTerm)}
                      </ChatName>
                      <ChatTime>{lastMsg && formatTime(lastMsg.time)}</ChatTime>
                    </ChatHeader>
                      <ChatPreview>
                        <MessagePreview>
                          {formatLastMessage(lastMsg, true) === 'Start a conversation' 
                            ? group.description 
                            : formatLastMessage(lastMsg, true)
                          }
                        </MessagePreview>
                        <ChatMeta>
                          <MemberCount>{group.memberCount}</MemberCount>
                          {lastMsg && lastMsg.isUnread && !lastMsg.isFromMe && <UnreadIndicator />}
                        </ChatMeta>
                      </ChatPreview>
                    </ChatContent>
                  </ChatItem>
                )
              })}

              {/* Show Members in 'all' and non-groups tabs */}
              {activeTab !== 'groups' && filteredMembers.map((member) => {
                const chatId = getChatId(member.id)
                const lastMsg = lastMessages[chatId]
                const isOnline = memberStatus[member.id]?.isOnline
                
                return (
                  <ChatItem
                    key={member.id}
                    onClick={() => onChatSelect({
                      id: chatId,
                      name: member.name,
                      isGroup: false,
                      otherUserId: member.id,
                      publicPhoto: member.publicPhoto,
                      zodiacSign: member.zodiacSign
                    })}
                    whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                  >
                    <AvatarContainer>
                      <Avatar $zodiacColor={getZodiacColor(member)}>
                        {member.publicPhoto ? (
                          <img src={member.publicPhoto} alt={member.name} />
                        ) : (
                          <AvatarPlaceholder>👤</AvatarPlaceholder>
                        )}
                      </Avatar>
                      {isOnline && <OnlineBadge />}
                    </AvatarContainer>

                    <ChatContent>
                    <ChatHeader>
                      <ChatName>
                        {highlightText(member.name, performSearch.searchTerm)}
                      </ChatName>
                      <ChatTime>{lastMsg && formatTime(lastMsg.time)}</ChatTime>
                    </ChatHeader>
                      <ChatPreview>
                        <MessagePreview>
                          {formatLastMessage(lastMsg)}
                        </MessagePreview>
                        <ChatMeta>
                          {lastMsg && lastMsg.isUnread && !lastMsg.isFromMe && <UnreadBadge />}
                        </ChatMeta>
                      </ChatPreview>
                    </ChatContent>
                  </ChatItem>
                )
              })}
            </>
          )}
        </AnimatePresence>
      </ChatListContainer>
    </Container>
  )
}

export default ChatList

// Styled Components
const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
`

const Header = styled.header`
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding-bottom: 0;
`

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
`

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
`

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
`

const UnreadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 16px;
  border: none;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    : 'linear-gradient(135deg, #0084ff 0%, #006bff 100%)'
  };
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 13px;
  font-weight: 500;
  
  &:hover {
    background: ${props => props.$active
      ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
      : 'linear-gradient(135deg, #006bff 0%, #0056d3 100%)'
    };
    transform: translateY(-1px);
    box-shadow: ${props => props.$active
      ? '0 4px 12px rgba(239, 68, 68, 0.3)'
      : '0 4px 12px rgba(0, 132, 255, 0.3)'
    };
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: ${props => props.$active
      ? '0 2px 6px rgba(239, 68, 68, 0.2)'
      : '0 2px 6px rgba(0, 132, 255, 0.2)'
    };
  }
`

const UnreadIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
`

const UnreadCount = styled.span`
  font-weight: 600;
  font-size: 12px;
`

const FilterInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-left: 3px solid #0084ff;
  margin: 0 16px 8px;
  border-radius: 8px;
`

const FilterIcon = styled.span`
  font-size: 16px;
`

const FilterText = styled.span`
  flex: 1;
  font-size: 13px;
  color: #0369a1;
  font-weight: 500;
`

const FilterClear = styled.button`
  background: none;
  border: none;
  color: #0084ff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  
  &:hover {
    background: rgba(0, 132, 255, 0.1);
  }
`

const SearchHighlight = styled.span`
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  padding: 1px 3px;
  border-radius: 4px;
  font-weight: 600;
`

const SearchResultCount = styled.div`
  position: absolute;
  right: 48px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: #0084ff;
  background: rgba(0, 132, 255, 0.1);
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 500;
`

const SearchContainer = styled.div`
  position: relative;
  margin: 0 16px 12px;
`

const SearchIcon = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
`

const SearchInput = styled.input`
  width: 100%;
  height: 44px;
  background: #f5f5f5;
  border: none;
  border-radius: 22px;
  padding: 0 44px;
  font-size: 15px;
  color: #1a1a1a;
  outline: none;
  transition: all 0.2s;
  
  &::placeholder {
    color: #999;
  }
  
  &:focus {
    background: #e8e8e8;
  }
`

const ClearButton = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border-radius: 14px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(0, 0, 0, 0.2);
  }
`

const TabsContainer = styled.div`
  display: flex;
  padding: 0 16px;
  gap: 8px;
`

const Tab = styled.button`
  padding: 8px 16px;
  border: none;
  background: transparent;
  font-size: 15px;
  font-weight: 500;
  color: ${props => props.$active ? '#667eea' : '#666'};
  border-bottom: 2px solid ${props => props.$active ? '#667eea' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: ${props => props.$active ? '#667eea' : '#1a1a1a'};
  }
`

const ChatListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 0 100px 0;
  
  /* Prevent bottom navigation overlay */
`

const EmptyState = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
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

const ChatItem = styled(motion.div)`
  display: flex;
  align-items: center;
  padding: 14px 16px;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  min-height: 70px;
  
  /* Mobile-first: Better touch target */
  &:active {
    background-color: rgba(0, 0, 0, 0.05);
  }
`

const AvatarContainer = styled.div`
  position: relative;
  flex-shrink: 0;
  z-index: 1;
`

const Avatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 28px;
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
  position: relative;
  border: ${props => 
    props.$hasCustomIcon ? '3px solid #f59e0b' :
    props.$zodiacColor ? `3px solid ${props.$zodiacColor}` :
    props.$isGroup ? '3px solid #f59e0b' : 'none'
  };
  box-shadow: ${props => 
    props.$zodiacColor ? `0 0 0 1px rgba(255, 255, 255, 0.8), 0 2px 8px ${props.$zodiacColor}33` :
    props.$hasCustomIcon ? '0 0 0 1px rgba(255, 255, 255, 0.8), 0 2px 8px rgba(245, 158, 11, 0.3)' :
    'none'
  };
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 25px;
  }
`

const AvatarPlaceholder = styled.span`
  font-size: 24px;
  filter: brightness(0) invert(1);
`

const OnlineBadge = styled.div`
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 16px;
  height: 16px;
  background: #22c55e;
  border: 3px solid white;
  border-radius: 50%;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`

const ChatContent = styled.div`
  flex: 1;
  min-width: 0;
`

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`

const ChatName = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ChatTime = styled.span`
  font-size: 13px;
  color: #999;
  flex-shrink: 0;
`

const ChatPreview = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`

const MessagePreview = styled.p`
  margin: 0;
  font-size: 14px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
`

const UnreadBadge = styled.div`
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  flex-shrink: 0;
`

const GroupBadge = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 18px;
  height: 18px;
  background: #f59e0b;
  border: 3px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::after {
    content: '';
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 50%;
  }
`

const ChatMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`

const MemberCount = styled.span`
  font-size: 12px;
  color: #f59e0b;
  font-weight: 500;
  flex-shrink: 0;
`

const UnreadIndicator = styled.div`
  width: 6px;
  height: 6px;
  background: #22c55e;
  border-radius: 50%;
  flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.2); }
  }
`

const GroupLogo = styled.img`
  width: 32px;
  height: 32px;
  object-fit: contain;
  filter: none;
  border-radius: 16px;
`

const UCLogo = styled.img`
  width: 36px;
  height: 36px;
  object-fit: contain;
  filter: brightness(0) invert(1) contrast(1.2);
  transform: scale(1.1);
`

