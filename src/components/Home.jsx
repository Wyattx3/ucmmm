import React, { useEffect, useMemo, useRef, useState } from 'react'
import client, { databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../lib/appwrite.js'
import storageService from '../services/storage.js'
import presenceService from '../services/presence.js'
import { ZODIAC_COLORS } from '../utils/mockData.js'
import { navigate } from '../utils/ucera-routing.js'
import './Home.css'
import styled from 'styled-components'
import BottomNav from './BottomNav'
import ChatList from './ChatList'
import ChatConversation from './ChatConversation'
import { AnimatePresence } from 'framer-motion'

const Home = ({ formData, notification, closeNotification, loggedInUser }) => {
  // Component initialization
  useEffect(() => {
    // Component loaded
  }, [loggedInUser]);
  
  // Restore open chat from localStorage on mount
  useEffect(() => {
    if (!loggedInUser?.$id) return
    
    try {
      const savedChat = localStorage.getItem('ucera_open_chat')
      if (savedChat) {
        const chat = JSON.parse(savedChat)
        setOpenChat(chat)
      }
    } catch (error) {
      // Failed to restore chat
      localStorage.removeItem('ucera_open_chat')
    }
  }, [loggedInUser])
  
  const [activeTab, setActiveTab] = useState('chat')
  const [showProfile, setShowProfile] = useState(false)
  const [openChat, setOpenChat] = useState(null)

  // Handle tab changes with clean URLs
  const handleTabChange = (newTab) => {
    setActiveTab(newTab)
    
    // Update URL based on tab
    switch(newTab) {
      case 'chat':
        navigate.toChat()
        break
      case 'more':
        navigate.toMore()
        break
      case 'settings':
        navigate.toSettings()
        break
    }
    
    setOpenChat(null) // Close any open chat when switching tabs
  }

  // Mark messages as read for a chat
  const markChatAsRead = async (chatId) => {
    try {
      // Detect group chat by ID pattern:
      // - Group IDs: "uc-main-group" (no underscore separator)
      // - Individual IDs: "userId1_userId2" (with underscore)
      const isGroupChat = !chatId.includes('_') || openChat?.isGroup || false
      
        chatId,
        isGroupChat,
        openChatIsGroup: openChat?.isGroup,
        hasUnderscore: chatId.includes('_')
      })
      
      // For group chats: query all messages that user hasn't read yet
      // For individual chats: query unread messages (is_read: false)
      const query = isGroupChat ? [
        Query.equal('chat_id', chatId),
        Query.notEqual('sender_id', loggedInUser?.$id),
        Query.limit(100)
      ] : [
        Query.equal('chat_id', chatId),
        Query.equal('is_read', false),
        Query.notEqual('sender_id', loggedInUser?.$id),
        Query.limit(100)
      ]
      
      const messagesToMark = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        query
      )
      
      // Mark each message as read
      const updatePromises = messagesToMark.documents.map(async (msg) => {
        if (isGroupChat) {
          // For group messages: add user to read_by array
          const currentReadBy = msg.read_by || []
          
            id: msg.$id,
            from: msg.sender_name,
            currentReadBy: currentReadBy,
            currentUserId: loggedInUser.$id,
            alreadyRead: currentReadBy.includes(loggedInUser.$id)
          })
          
          // Only update if user hasn't already read it
          if (!currentReadBy.includes(loggedInUser.$id)) {
            const newReadBy = [...currentReadBy, loggedInUser.$id]
              id: msg.$id,
              oldReadBy: currentReadBy,
              newReadBy: newReadBy
            })
            
            try {
              const result = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.MESSAGES,
                msg.$id,
                {
                  read_by: newReadBy,
                  read_at: new Date().toISOString()
                }
              )
                id: result.$id,
                read_by: result.read_by,
                count: result.read_by?.length || 0
              })
              return result
            } catch (error) {
              console.error('❌ Failed to update group message:', error.message)
              throw error
            }
          } else {
          }
        } else {
          // For individual messages: use is_read flag
            id: msg.$id,
            from: msg.sender_name
          })
          
          return databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.MESSAGES,
            msg.$id,
            {
              is_read: true,
              read_at: new Date().toISOString()
            }
          )
        }
      })
      
      await Promise.allSettled(updatePromises.filter(p => p)) // Filter out undefined promises
      
      
      // Update last message in state to reflect read status
      setLastMsgByChat(prev => {
        const lastMsg = prev[chatId]
        if (lastMsg && lastMsg.isUnread) {
          return {
            ...prev,
            [chatId]: {
              ...lastMsg,
              isUnread: false
            }
          }
        }
        return prev
      })
    } catch (error) {
      console.error('Failed to mark messages as read:', error)
    }
  }
  
  // Handle chat opening with clean URLs
  const handleChatOpen = (chat) => {
    setOpenChat(chat)
    // Save open chat to localStorage for persistence across reloads
    try {
      localStorage.setItem('ucera_open_chat', JSON.stringify(chat))
    } catch {}
    navigate.toChat(chat.id)
    
    // Mark messages as read
    if (loggedInUser?.$id) {
      markChatAsRead(chat.id)
    }
  }

  // Handle chat closing with clean URLs
  const handleChatClose = () => {
    setOpenChat(null)
    // Clear saved chat from localStorage
    try {
      localStorage.removeItem('ucera_open_chat')
    } catch {}
    navigate.toChat()
  }
  const [messagesByChat, setMessagesByChat] = useState({})
  const [allMembers, setAllMembers] = useState([])
  const [lastMsgByChat, setLastMsgByChat] = useState({})
  const [memberStatus, setMemberStatus] = useState({})
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [typingUsers, setTypingUsers] = useState({}) // { chatId: { userId: { name, avatar, timestamp } } }
  
  // Auto-clear stale typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setTypingUsers(prev => {
        const updated = { ...prev }
        let changed = false
        
        Object.keys(updated).forEach(chatId => {
          Object.keys(updated[chatId]).forEach(userId => {
            if (now - updated[chatId][userId].timestamp > 3000) {
              delete updated[chatId][userId]
              changed = true
            }
          })
          
          if (Object.keys(updated[chatId]).length === 0) {
            delete updated[chatId]
          }
        })
        
        return changed ? updated : prev
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])

  const todayLabel = useMemo(() => {
    const now = new Date()
    const options = { weekday: 'short', month: 'short', day: 'numeric' }
    return `Today • ${now.toLocaleDateString(undefined, options)}`
  }, [])

  // Initialize URL routing on component mount
  useEffect(() => {
    // Skip URL updates for non-logged users to prevent errors
    if (loggedInUser?.$id) {
      try {
        // updateURL(activeTab) - Remove this to prevent undefined function call
      } catch (error) {
      }
    }
  }, [])

  // Load members - Production mode (requires authentication)
  useEffect(() => {
    (async () => {
      // Production: Require authentication
      if (!loggedInUser?.$id) {
        setAllMembers([])
        setMemberStatus({})
        return
      }

      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.USERS,
          [
            Query.equal('has_member_card', true),
            Query.limit(50)
          ]
        )
        const mapped = res.documents
          .filter(d => d.$id !== loggedInUser?.$id)
          .map((d, idx) => {
            // Calculate zodiac sign from date of birth
            const calculateZodiac = (dob) => {
              if (!dob) return 'Aquarius'
              const date = new Date(dob)
              const month = date.getMonth() + 1
              const day = date.getDate()
              
              if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return 'Aries'
              if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return 'Taurus'
              if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return 'Gemini'
              if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return 'Cancer'
              if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return 'Leo'
              if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return 'Virgo'
              if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return 'Libra'
              if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return 'Scorpio'
              if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return 'Sagittarius'
              if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return 'Capricorn'
              if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return 'Aquarius'
              if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return 'Pisces'
              return 'Aquarius'
            }
            
            return {
              id: d.$id || `u-${idx}`, 
              name: d.full_name || d.first_name || 'Member', 
              publicPhoto: d.public_photo || null,
              zodiacSign: calculateZodiac(d.date_of_birth),
              gender: d.gender || null // Add gender field for group filtering
            }
          })
        
          total: mapped.length,
          sample: mapped[0] ? {
            name: mapped[0].name,
            hasPhoto: !!mapped[0].publicPhoto,
            zodiac: mapped[0].zodiacSign,
            gender: mapped[0].gender
          } : null,
          genderCounts: {
            male: mapped.filter(m => m.gender === 'male').length,
            female: mapped.filter(m => m.gender === 'female').length,
            other: mapped.filter(m => !m.gender || (m.gender !== 'male' && m.gender !== 'female')).length
          }
        })
        
        setAllMembers(mapped)

        // Load member status after getting members
        if (mapped.length > 0) {
          const userIds = mapped.map(m => m.id)
          try {
            const statusMap = await presenceService.getBulkUserStatus(userIds)
            setMemberStatus(statusMap)
          } catch (e) {
            const fallbackStatus = {}
            userIds.forEach(id => {
              fallbackStatus[id] = {
                isOnline: false,
                lastSeen: null,
                status: 'Status loading...'
              }
            })
            setMemberStatus(fallbackStatus)
          }
        }
      } catch (e) {
        // Production: Clear data on error
        console.error('Failed to load members:', e)
        setAllMembers([])
        setMemberStatus({})
      }
    })()
  }, [loggedInUser])

  // Load last messages - Production mode (individual chats + groups)
  useEffect(() => {
    (async () => {
      // Production: Require authentication
      if (!loggedInUser?.$id) {
        setLastMsgByChat({})
        return
      }

      try {
        const results = []
        
        // Load last messages for individual chats
        if (allMembers.length > 0) {
          const BATCH_SIZE = 2
          const members = allMembers.slice(0, 8)
          
          for (let i = 0; i < members.length; i += BATCH_SIZE) {
            const batch = members.slice(i, i + BATCH_SIZE)
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 300))
            }
            
            const batchResults = await Promise.allSettled(
              batch.map(async (m) => {
                try {
                  const chatId = [loggedInUser?.$id, m.id].sort().join('_')
                  const r = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.MESSAGES,
                    [Query.equal('chat_id', chatId), Query.orderDesc('created_at'), Query.limit(10)]
                  )
                  
                  // Filter out typing indicators and get the latest real message
                  const realMessages = r.documents.filter(d => !d.content?.startsWith('__TYPING_'))
                  const d = realMessages[0]
                  
                  if (!d) {
                    return [chatId, null]
                  }
                  const when = new Date(d.created_at || d.$createdAt)
                  const isFromMe = d.sender_id === loggedInUser?.$id
                  const lastMsg = { 
                    text: d.content, 
                    imageUrl: d.image_url,
                    time: when.toISOString(),
                    isFromMe: isFromMe,
                    senderName: !isFromMe ? d.sender_name : null,
                    isUnread: !isFromMe && !d.is_read // Mark as unread if from other user and not read
                  }
                  return [chatId, lastMsg]
                } catch (e) {
                  const chatId = [loggedInUser?.$id, m.id].sort().join('_')
                  return [chatId, null]
                }
              })
            )
            
            batchResults.forEach((result) => {
              if (result.status === 'fulfilled' && result.value) {
                results.push(result.value)
              }
            })
          }
        }
        
        // Load last messages for group chats
        const groupChats = ['uc-main-group', 'uc-boy-group', 'uc-girl-group']
        for (const groupId of groupChats) {
          try {
            const r = await databases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.MESSAGES,
              [Query.equal('chat_id', groupId), Query.orderDesc('created_at'), Query.limit(10)]
            )
            
            // Filter out typing indicators and get the latest real message
            const realMessages = r.documents.filter(d => !d.content?.startsWith('__TYPING_'))
            const d = realMessages[0]
            
            if (d) {
              const when = new Date(d.created_at || d.$createdAt)
              const isFromMe = d.sender_id === loggedInUser?.$id
              const lastMsg = {
                text: d.content,
                imageUrl: d.image_url,
                time: when.toISOString(),
                isFromMe: isFromMe,
                senderName: !isFromMe ? d.sender_name : null,
                isUnread: !isFromMe && !d.is_read // Mark as unread if from other user and not read
              }
              results.push([groupId, lastMsg])
            }
          } catch (e) {
          }
        }
        
        const map = {}
        results.forEach(([id, v]) => { map[id] = v })
        
        setLastMsgByChat(map)
      } catch (e) {
        console.error('❌ Failed to load last messages:', e)
        setLastMsgByChat({})
      }
    })()
  }, [allMembers, loggedInUser])

  // Load messages for open chat - Production mode
  useEffect(() => {
    if (!openChat) {
      return
    }
    
    
    // Production: Require authentication
    if (!loggedInUser?.$id) {
      setMessagesByChat(prev => ({
        ...prev,
        [openChat.id]: []
      }))
      setIsLoadingMessages(false)
      return
    }
    
    setIsLoadingMessages(true)
    const loadMessages = async () => {
      try {
        const cachedMessages = messagesByChat[openChat.id]
          chatId: openChat.id,
          hasCached: !!cachedMessages,
          cachedCount: cachedMessages?.length || 0
        })
        
        // Always load from database on chat open (don't rely on cache)
        // This ensures messages persist across page reloads
        
        // Build query based on chat type
        // Use DESC order to get latest messages first, then reverse to show oldest first
        let query = [Query.orderDesc('created_at'), Query.limit(100)]
        
        if (openChat.isGroup) {
          // For group chats, load by groupId or chat_id
          query.unshift(Query.equal('chat_id', openChat.id))
        } else {
          // For individual chats
          query.unshift(Query.equal('chat_id', openChat.id))
        }

          chatId: openChat.id,
          isGroup: openChat.isGroup,
          order: 'DESC (latest first)',
          limit: 100
        })

        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.MESSAGES,
          query
        )
        
          totalDocs: res.documents.length,
          chatId: openChat.id
        })
        
        // Calculate zodiac sign from date of birth
        const calculateZodiac = (dob) => {
          if (!dob) return 'Aquarius'
          const date = new Date(dob)
          const month = date.getMonth() + 1
          const day = date.getDate()
          
          if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return 'Aries'
          if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return 'Taurus'
          if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return 'Gemini'
          if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return 'Cancer'
          if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return 'Leo'
          if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return 'Virgo'
          if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return 'Libra'
          if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return 'Scorpio'
          if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return 'Sagittarius'
          if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return 'Capricorn'
          if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return 'Aquarius'
          if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return 'Pisces'
          return 'Aquarius'
        }
        
        // Get unique sender IDs (excluding current user)
        const uniqueSenderIds = [...new Set(
          res.documents
            .filter(d => !d.content?.startsWith('__TYPING_') && d.sender_id !== loggedInUser?.$id)
            .map(d => d.sender_id)
        )]
        
        // Fetch sender user data for zodiac calculation
        const senderZodiacs = {}
        if (uniqueSenderIds.length > 0) {
          try {
            // Fetch all users and filter by sender IDs
            const usersRes = await databases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.USERS,
              [Query.limit(100)]
            )
            
            // Map user IDs to their zodiac signs
            usersRes.documents.forEach(user => {
              if (uniqueSenderIds.includes(user.$id)) {
                senderZodiacs[user.$id] = calculateZodiac(user.date_of_birth)
              }
            })
          } catch (err) {
          }
        }
        
        const messages = res.documents
          .filter(d => !d.content?.startsWith('__TYPING_')) // Filter out typing indicators
          .reverse() // Reverse to show oldest first
          .map(d => {
          const isMe = d.sender_id === loggedInUser?.$id
          const isGroup = d.is_group_message || false
          
          // For group messages: check if current user is in read_by array
          // For individual messages: use is_read flag
          const readBy = d.read_by || []
          const seenStatus = isGroup 
            ? readBy.length > 0 
            : (d.is_read || false)
          
          // Get sender zodiac: from DB field, or calculated from user profile, or current user's, or default
          const senderZodiac = d.sender_zodiac || 
                              senderZodiacs[d.sender_id] || 
                              (isMe ? calculateZodiac(loggedInUser?.date_of_birth) : 'Aquarius')
          
          return {
            id: d.$id,
            text: d.content,
            from: isMe ? 'me' : 'other',
            time: new Date(d.created_at || d.$createdAt).toISOString(),
            createdAt: d.created_at || d.$createdAt,
            senderName: d.sender_name || 'Member',
            senderAvatar: d.sender_avatar,
            senderZodiac: senderZodiac,
            senderId: d.sender_id,
            imageUrl: d.image_url,
            dbSaved: true,
            isGroupMessage: isGroup,
            seen: seenStatus,
            delivered: true,
            readBy: readBy, // Array of user IDs who have read this message (for groups)
            seenCount: isGroup ? readBy.length : (d.is_read ? 1 : 0) // Count of users who have seen
          }
        })
        
          count: messages.length,
          chatId: openChat.id
        })
        
        setMessagesByChat(prev => {
          const currentMessages = prev[openChat.id] || []
          const tempMessages = currentMessages.filter(msg => msg.id.startsWith('temp_') && !msg.dbSaved)
          const dbMessageIds = new Set(messages.map(m => m.id))
          const nonDuplicateCurrentMessages = currentMessages.filter(msg => 
            !dbMessageIds.has(msg.id) && msg.id.startsWith('temp_')
          )
          const finalMessages = [...messages, ...nonDuplicateCurrentMessages]
            dbMessages: messages.length,
            tempMessages: tempMessages.length,
            finalCount: finalMessages.length
          })
          return { ...prev, [openChat.id]: finalMessages }
        })
        setIsLoadingMessages(false)
      } catch (e) {
        console.error('❌ Failed to load messages:', e)
        
        // Production: Empty messages on error
        const messages = []
        
        setMessagesByChat(prev => ({ ...prev, [openChat.id]: messages }))
        setIsLoadingMessages(false)
      }
    }
    loadMessages()
  }, [openChat, loggedInUser])

  // Handle typing indicators with real-time broadcast
  const handleTypingStart = async () => {
    if (!openChat || !loggedInUser) return
    
      chatId: openChat.id,
      userId: loggedInUser.$id,
      userName: loggedInUser.full_name || loggedInUser.first_name
    })
    
    try {
      // Broadcast typing start event via Appwrite Realtime
      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        ID.unique(),
        {
          chat_id: openChat.id,
          content: '__TYPING_START__',
          sender_id: loggedInUser.$id,
          sender_name: loggedInUser.full_name || loggedInUser.first_name,
          sender_avatar: loggedInUser.public_photo,
          created_at: new Date().toISOString(),
          // Fill required fields (no sender_zodiac - field doesn't exist)
          receiver_id: !openChat.isGroup ? openChat.otherUserId : null,
          message_type: 'typing',
          image_url: null,
          image_size: null,
          file_name: null,
          is_read: false,
          read_at: null,
          is_group_message: openChat.isGroup || false,
          group_id: openChat.isGroup ? openChat.id : null
        }
      )
      
      // Delete this temporary typing indicator after 5 seconds
      setTimeout(async () => {
        try {
          await databases.deleteDocument(DATABASE_ID, COLLECTIONS.MESSAGES, doc.$id)
        } catch (e) {
          // Ignore deletion errors
        }
      }, 5000)
    } catch (error) {
      console.error('❌ Typing indicator broadcast failed:', error)
    }
  }
  
  const handleTypingStop = async () => {
    if (!openChat || !loggedInUser) return
    
      chatId: openChat.id,
      userId: loggedInUser.$id
    })
    
    try {
      // Broadcast typing stop event
      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        ID.unique(),
        {
          chat_id: openChat.id,
          content: '__TYPING_STOP__',
          sender_id: loggedInUser.$id,
          sender_name: loggedInUser.full_name || loggedInUser.first_name,
          created_at: new Date().toISOString(),
          // Fill required fields (no sender_zodiac - field doesn't exist)
          receiver_id: !openChat.isGroup ? openChat.otherUserId : null,
          message_type: 'typing',
          sender_avatar: null, // No avatar needed for STOP event
          image_url: null,
          image_size: null,
          file_name: null,
          is_read: false,
          read_at: null,
          is_group_message: openChat.isGroup || false,
          group_id: openChat.isGroup ? openChat.id : null
        }
      )
      
      // Delete this temporary typing indicator immediately after broadcast
      setTimeout(async () => {
        try {
          await databases.deleteDocument(DATABASE_ID, COLLECTIONS.MESSAGES, doc.$id)
        } catch (e) {
          // Ignore deletion errors
        }
      }, 1000)
    } catch (error) {
      console.error('❌ Typing stop broadcast failed:', error)
    }
  }
  
  // Handle sending messages with image support
  const handleSendMessage = async (text, imageFile = null) => {
    if (!openChat || !loggedInUser) return
    
    let imageUrl = null
    let imageFileId = null
    
    // Handle image upload if file is provided
    if (imageFile) {
      try {
        const uploadResult = await storageService.uploadChatImage(imageFile, loggedInUser.$id)
        imageUrl = uploadResult.url
        imageFileId = uploadResult.fileId
      } catch (error) {
        console.error('❌ Image upload failed:', error)
        alert('ပုံတင်ရာတွင် အမှားရှိပါသည်။ ထပ်စမ်းကြည့်ပါ။')
        return // Don't send message if image upload fails
      }
    }
    
    // Calculate zodiac sign from date of birth
    const calculateZodiac = (dob) => {
      if (!dob) return 'Aquarius'
      const date = new Date(dob)
      const month = date.getMonth() + 1
      const day = date.getDate()
      
      if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return 'Aries'
      if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return 'Taurus'
      if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return 'Gemini'
      if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return 'Cancer'
      if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return 'Leo'
      if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return 'Virgo'
      if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return 'Libra'
      if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return 'Scorpio'
      if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return 'Sagittarius'
      if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return 'Capricorn'
      if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return 'Aquarius'
      if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return 'Pisces'
      return 'Aquarius'
    }
    
    const tempId = `temp_${Date.now()}`
    const timestamp = new Date().toISOString()
    const newMessage = {
      id: tempId,
      text: text || null,
      imageUrl: imageUrl || null,
      from: 'me',
      senderId: loggedInUser.$id,
      senderName: loggedInUser.full_name || loggedInUser.first_name,
      senderAvatar: loggedInUser.public_photo,
      senderZodiac: calculateZodiac(loggedInUser.date_of_birth),
      createdAt: timestamp,
      time: timestamp,
      dbSaved: false,
      sending: true,
      delivered: false, // Not delivered yet (sending)
      seen: false // Not seen yet
    }
    
    // Add to UI immediately with optimistic update
    setMessagesByChat(prev => ({
      ...prev,
      [openChat.id]: [...(prev[openChat.id] || []), newMessage]
    }))
    
    // Update last message
    setLastMsgByChat(prev => ({
      ...prev,
      [openChat.id]: {
        text: newMessage.text,
        imageUrl: newMessage.imageUrl,
        time: timestamp,
        isFromMe: true
      }
    }))
    
    // Save to database with group support
    try {
      // Calculate zodiac sign from date of birth
      const calculateZodiac = (dob) => {
        if (!dob) return 'Aquarius'
        const date = new Date(dob)
        const month = date.getMonth() + 1
        const day = date.getDate()
        
        if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return 'Aries'
        if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return 'Taurus'
        if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return 'Gemini'
        if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return 'Cancer'
        if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return 'Leo'
        if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return 'Virgo'
        if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return 'Libra'
        if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return 'Scorpio'
        if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return 'Sagittarius'
        if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return 'Capricorn'
        if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return 'Aquarius'
        if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return 'Pisces'
        return 'Aquarius'
      }
      
      const messageData = {
        chat_id: openChat.id,
        content: newMessage.text || '', // Empty string if only image
        created_at: timestamp,
        sender_id: loggedInUser.$id,
        sender_name: loggedInUser.full_name || loggedInUser.first_name,
        sender_avatar: loggedInUser.public_photo,
        // sender_zodiac: calculateZodiac(loggedInUser.date_of_birth), // TODO: Add after creating database field
        image_url: newMessage.imageUrl || null,
        // Set defaults for other fields to avoid null issues
        receiver_id: !openChat.isGroup ? openChat.otherUserId : null,
        message_type: imageFile ? 'image' : 'text',
        image_size: null,
        file_name: null,
        is_read: false,
        read_at: null,
        is_group_message: openChat.isGroup || false,
        group_id: openChat.isGroup ? openChat.id : null
      }
      
        chatId: openChat.id,
        content: messageData.content,
        hasText: !!messageData.content,
        hasImage: !!messageData.image_url,
        isGroup: openChat.isGroup,
        senderId: loggedInUser.$id
      })

      const savedMessage = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        ID.unique(),
        messageData
      )
      
        id: savedMessage.$id,
        chatId: savedMessage.chat_id,
        content: savedMessage.content
      })
      
      // Update message with saved data - smooth transition to delivered
      setTimeout(() => {
        setMessagesByChat(prev => ({
          ...prev,
          [openChat.id]: prev[openChat.id].map(msg => 
            msg.id === tempId 
              ? { 
                  ...msg, 
                  id: savedMessage.$id, 
                  dbSaved: true, 
                  sending: false, 
                  delivered: true,
                  seen: false // Keep as not seen until other user reads it
                }
              : msg
          )
        }))
        
          id: savedMessage.$id,
          delivered: true,
          seen: false
        })
      }, 500) // Small delay for smooth transition
      
      } catch (e) {
        
        // In development mode, simulate successful save with smooth transition
        setTimeout(() => {
          const mockId = `mock_${Date.now()}`
          setMessagesByChat(prev => ({
            ...prev,
            [openChat.id]: prev[openChat.id].map(msg => 
              msg.id === tempId 
                ? { 
                    ...msg, 
                    id: mockId, 
                    dbSaved: true, 
                    sending: false, 
                    delivered: true,
                    seen: false // Keep as not seen until other user reads it
                  }
                : msg
            )
          }))
        }, 800) // Realistic timing for smooth UX
      }
  }

  // Message deduplication tracking
  const processedMessageIds = useRef(new Set())
  const lastProcessedTime = useRef(0)
  const activeSubscriptionRef = useRef(null)
  const openChatRef = useRef(openChat)
  openChatRef.current = openChat

  // Realtime subscription with fallback to local mode
  useEffect(() => {
    if (!loggedInUser) return
    
    let subscriptionActive = true
    let retryCount = 0
    const maxRetries = 1 // Reduce retries for development
    
    const createSubscription = () => {
      if (!subscriptionActive) return null
      if (activeSubscriptionRef.current) {
        return activeSubscriptionRef.current
      }
      
      try {
        const unsubscribe = client.subscribe(
          [`databases.${DATABASE_ID}.collections.${COLLECTIONS.MESSAGES}.documents`],
          (response) => {
            const isCreate = response.events.some(event => 
              event.includes('.create') && event.includes('messages')
            )
            const isUpdate = response.events.some(event => 
              event.includes('.update') && event.includes('messages')
            )
            
            // Handle message updates (e.g., is_read status changes)
            if (isUpdate && response.payload) {
              const updatedMessage = response.payload
              const messageId = updatedMessage.$id
              
              const isGroup = updatedMessage.is_group_message || false
              const readBy = updatedMessage.read_by || []
              const seenStatus = isGroup 
                ? readBy.length > 0 
                : (updatedMessage.is_read || false)
              
                id: messageId,
                isGroup,
                isRead: updatedMessage.is_read,
                readBy: readBy,
                seenCount: readBy.length,
                readAt: updatedMessage.read_at
              })
              
              // Update message in all chats where it appears
              setMessagesByChat(prev => {
                const updated = { ...prev }
                let didUpdate = false
                
                Object.keys(updated).forEach(chatId => {
                  const messages = updated[chatId]
                  const messageIndex = messages.findIndex(msg => msg.id === messageId)
                  
                  if (messageIndex !== -1) {
                    updated[chatId] = messages.map(msg => 
                      msg.id === messageId 
                        ? { 
                            ...msg, 
                            seen: seenStatus,
                            delivered: true,
                            readBy: readBy,
                            seenCount: isGroup ? readBy.length : (updatedMessage.is_read ? 1 : 0)
                          }
                        : msg
                    )
                    didUpdate = true
                      chatId,
                      messageId,
                      seen: seenStatus,
                      seenCount: isGroup ? readBy.length : (updatedMessage.is_read ? 1 : 0)
                    })
                  }
                })
                
                return didUpdate ? updated : prev
              })
              
              return // Don't process as create event
            }
            
            if (isCreate && response.payload) {
              const newMessage = response.payload
              const messageId = newMessage.$id
              const currentTime = Date.now()
              
              if (processedMessageIds.current.has(messageId)) {
                return
              }
              
              if (currentTime - lastProcessedTime.current > 30000) {
                processedMessageIds.current.clear()
                lastProcessedTime.current = currentTime
              }
              
              processedMessageIds.current.add(messageId)
              
              // Handle typing indicators (don't add to message list or last message preview)
              if (newMessage.content?.startsWith('__TYPING_')) {
                const chatId = newMessage.chat_id
                const senderId = newMessage.sender_id
                
                  type: newMessage.content,
                  chatId,
                  senderId,
                  senderName: newMessage.sender_name,
                  currentUserId: loggedInUser.$id,
                  isOwnEvent: senderId === loggedInUser.$id
                })
                
                // Don't show typing indicator for current user
                if (senderId === loggedInUser.$id) {
                  return
                }
                
                if (newMessage.content === '__TYPING_START__') {
                  setTypingUsers(prev => {
                    const updated = {
                      ...prev,
                      [chatId]: {
                        ...(prev[chatId] || {}),
                        [senderId]: {
                          name: newMessage.sender_name || 'Member',
                          avatar: newMessage.sender_avatar,
                          timestamp: Date.now()
                        }
                      }
                    }
                    return updated
                  })
                } else if (newMessage.content === '__TYPING_STOP__') {
                  setTypingUsers(prev => {
                    const chatTyping = { ...(prev[chatId] || {}) }
                    delete chatTyping[senderId]
                    return {
                      ...prev,
                      [chatId]: chatTyping
                    }
                  })
                }
                
                return // Don't process typing indicators as messages or update last message
              }
              
              // Update last message for the chat (individual or group)
              const chatIdToUpdate = newMessage.group_id || newMessage.chat_id
              const isFromMe = newMessage.sender_id === loggedInUser.$id
              setLastMsgByChat(prev => ({
                ...prev,
                [chatIdToUpdate]: {
                  text: newMessage.content,
                  imageUrl: newMessage.image_url,
                  time: new Date(newMessage.created_at || newMessage.$createdAt).toISOString(),
                  isFromMe: isFromMe,
                  senderName: !isFromMe ? newMessage.sender_name : null,
                  isUnread: !isFromMe && !newMessage.is_read // Mark as unread if from other user and not read
                }
              }))
              
              const currentOpenChat = openChatRef.current
              
              // Add to current chat if it's open and not from current user
              // Support both individual and group chats
              const shouldAddToCurrent = currentOpenChat && (
                (newMessage.chat_id === currentOpenChat.id) ||
                (currentOpenChat.isGroup && newMessage.group_id === currentOpenChat.id)
              )
              
              if (shouldAddToCurrent && newMessage.sender_id !== loggedInUser.$id) {
                setMessagesByChat(prev => {
                  const currentMessages = prev[currentOpenChat.id] || []
                  const messageExists = currentMessages.some(msg => msg.id === messageId)
                  
                  if (messageExists) {
                    return prev
                  }
                  
                  const message = {
                    id: messageId,
                    text: newMessage.content,
                    from: 'other',
                    time: new Date(newMessage.created_at || newMessage.$createdAt).toISOString(),
                    createdAt: newMessage.created_at || newMessage.$createdAt,
                    senderName: newMessage.sender_name || 'Member',
                    senderAvatar: newMessage.sender_avatar,
                    senderId: newMessage.sender_id,
                    imageUrl: newMessage.image_url,
                    dbSaved: true,
                    isGroupMessage: newMessage.is_group_message || false,
                    seen: newMessage.is_read || false, // Map is_read from DB to seen for tick status
                    delivered: true // Real-time message is already delivered
                  }
                  
                  return {
                    ...prev,
                    [currentOpenChat.id]: [...currentMessages, message]
                  }
                })
              }
            }
          }
        )
        
        activeSubscriptionRef.current = unsubscribe
        return unsubscribe
      } catch (error) {
        // Don't retry in development - just use local mode
        return null
      }
    }
    
    const subscriptionDelay = setTimeout(() => {
      createSubscription()
    }, 200)
    
    return () => {
      subscriptionActive = false
      clearTimeout(subscriptionDelay)
      if (activeSubscriptionRef.current) {
        activeSubscriptionRef.current()
        activeSubscriptionRef.current = null
      }
    }
  }, [loggedInUser])

  // Initialize presence tracking
  useEffect(() => {
    if (loggedInUser?.$id) {
      presenceService.startPresence(loggedInUser.$id)
      return () => {
        presenceService.stopPresence()
      }
    }
  }, [loggedInUser])

  // Realtime updates for member online status
  useEffect(() => {
    if (!loggedInUser || allMembers.length === 0) return
    
    
    const unsubscribe = client.subscribe(
      [`databases.${DATABASE_ID}.collections.${COLLECTIONS.USERS}.documents`],
      (response) => {
        if (!response?.events?.some((e) => e.includes('.update'))) return
        
        const updatedUser = response.payload
        const userId = updatedUser?.$id
        if (!userId) return
        
        const isInList = allMembers.some((m) => m.id === userId)
        if (!isInList) return
        
        // Use snake_case field names (database format)
        const lastSeen = updatedUser.last_seen ? new Date(updatedUser.last_seen) : null
        const isOnlineFlag = Boolean(updatedUser.is_online)
        const ONLINE_THRESHOLD = 3 * 60 * 1000
        const isRecentlyActive = lastSeen && (Date.now() - lastSeen.getTime()) < ONLINE_THRESHOLD
        const isOnlineEffective = isOnlineFlag && isRecentlyActive
        const statusText = presenceService.getStatusText(isOnlineEffective, lastSeen)
        
          userId,
          name: allMembers.find(m => m.id === userId)?.name,
          isOnline: isOnlineEffective,
          status: statusText
        })
        
        setMemberStatus((prev) => ({
          ...prev,
          [userId]: {
            isOnline: isOnlineEffective,
            lastSeen,
            status: statusText,
          },
        }))
      }
    )
    
    return () => {
      try { 
        unsubscribe()
      } catch {}
    }
  }, [loggedInUser, allMembers])

  // Periodically update member status (for "Last seen X ago" text updates)
  useEffect(() => {
    if (allMembers.length === 0) return
    
    const updateMemberStatus = async () => {
      try {
        const userIds = allMembers.map(m => m.id)
        const statusMap = await presenceService.getBulkUserStatus(userIds)
        setMemberStatus(prev => ({...prev, ...statusMap}))
      } catch (error) {
        console.error('Error updating member status:', error)
      }
    }
    
    // Initial update after 2 seconds
    const initialUpdate = setTimeout(updateMemberStatus, 2000)
    // Update every 30 seconds to refresh "Last seen X ago" text
    const statusInterval = setInterval(updateMemberStatus, 30 * 1000)
    
    return () => {
      clearTimeout(initialUpdate)
      clearInterval(statusInterval)
    }
  }, [allMembers])

  return (
    <Screen>
      <Container>
        {notification.show && (
          <Notification className={notification.type}>
            <span>{notification.message}</span>
            <button onClick={closeNotification}>×</button>
          </Notification>
        )}

        {/* Header - Hide when chat is open */}
        {!openChat && (
          <Header>
            <HeaderContent>
              <ProfileButton 
                onClick={() => setShowProfile(true)}
                  $zodiacColor={(() => {
                    // Calculate zodiac from date_of_birth using UTC
                    const dob = loggedInUser?.date_of_birth
                    if (!dob) return null
                    
                    // Parse using UTC to avoid timezone issues
                    const date = new Date(dob)
                    const month = date.getUTCMonth() + 1
                    const day = date.getUTCDate()
                    
                    let zodiac = null
                    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) zodiac = 'Aries'
                    else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) zodiac = 'Taurus'
                    else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) zodiac = 'Gemini'
                    else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) zodiac = 'Cancer'
                    else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) zodiac = 'Leo'
                    else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) zodiac = 'Virgo'
                    else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) zodiac = 'Libra'
                    else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) zodiac = 'Scorpio'
                    else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) zodiac = 'Sagittarius'
                    else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) zodiac = 'Capricorn'
                    else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) zodiac = 'Aquarius'
                    else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) zodiac = 'Pisces'
                    
                    return ZODIAC_COLORS[zodiac] || null
                  })()}
              >
                {loggedInUser?.public_photo ? (
                  <img src={loggedInUser.public_photo} alt="Profile" />
                ) : (
                  <span>👤</span>
                )}
              </ProfileButton>
              
              <HeaderInfo>
                <UserName>{loggedInUser?.full_name || loggedInUser?.first_name || 'Member'}</UserName>
                <DateLabel>{todayLabel}</DateLabel>
              </HeaderInfo>
              
              <LogoContainer>
                <img src="/ucera-logo.png" alt="UC ERA" height="24" />
              </LogoContainer>
            </HeaderContent>
          </Header>
        )}

        {/* Main Content */}
        <MainContent>
          {activeTab === 'chat' && (
            <>
              <AnimatePresence mode="wait">
                {!openChat ? (
                  <ChatList
                    key="chat-list"
                    members={allMembers}
                    lastMessages={lastMsgByChat}
                    memberStatus={memberStatus}
                    currentUser={loggedInUser}
                    onChatSelect={handleChatOpen}
                  />
                ) : (
                  <>
                    <ChatConversation
                      key={`chat-${openChat.id}`}
                      chat={{
                        ...openChat,
                        zodiacSign: (() => {
                          // Check if chatting with self (own user ID)
                          if (openChat.otherUserId === loggedInUser?.$id) {
                            // Use own zodiac
                            const calculateZodiac = (dob) => {
                              if (!dob) return 'Aquarius'
                              const date = new Date(dob)
                              const month = date.getMonth() + 1
                              const day = date.getDate()
                              
                              if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return 'Aries'
                              if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return 'Taurus'
                              if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return 'Gemini'
                              if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return 'Cancer'
                              if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return 'Leo'
                              if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return 'Virgo'
                              if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return 'Libra'
                              if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return 'Scorpio'
                              if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return 'Sagittarius'
                              if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return 'Capricorn'
                              if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return 'Aquarius'
                              if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return 'Pisces'
                              return 'Aquarius'
                            }
                            return calculateZodiac(loggedInUser.date_of_birth)
                          }
                          
                          // Find other user in members
                          const member = allMembers.find(m => m.id === openChat.otherUserId)
                          return member?.zodiacSign
                        })()
                      }}
                      messages={messagesByChat[openChat.id] || []}
                      currentUser={loggedInUser}
                      onSendMessage={handleSendMessage}
                      onTypingStart={handleTypingStart}
                      onTypingStop={handleTypingStop}
                      typingUsers={typingUsers[openChat.id] || {}}
                      onBack={handleChatClose}
                      isLoading={isLoadingMessages}
                      memberStatus={memberStatus}
                      allMembers={allMembers}
                    />
                  </>
                )}
              </AnimatePresence>
            </>
          )}
          
          {activeTab === 'more' && (
            <MoreSection>
              <SectionTitle>More Features</SectionTitle>
              <MoreGrid>
                <MoreCard>
                  <div className="icon">🏦</div>
                  <div className="title">UC Bank</div>
                  <div className="desc">Digital banking services</div>
                  <Badge>Coming soon</Badge>
                </MoreCard>
                <MoreCard>
                  <div className="icon">📅</div>
                  <div className="title">Events</div>
                  <div className="desc">Discover upcoming activities</div>
                  <Badge>Coming soon</Badge>
                </MoreCard>
                <MoreCard>
                  <div className="icon">🛍️</div>
                  <div className="title">Marketplace</div>
                  <div className="desc">Share and exchange</div>
                  <Badge>Coming soon</Badge>
                </MoreCard>
                <MoreCard>
                  <div className="icon">📄</div>
                  <div className="title">Documents</div>
                  <div className="desc">Resources & forms</div>
                  <Badge>Coming soon</Badge>
                </MoreCard>
              </MoreGrid>
            </MoreSection>
          )}
          
          {activeTab === 'settings' && (
            <ComingSoon>
              <div className="title">Settings</div>
              <div className="desc">App preferences and configurations</div>
              <Badge>Coming soon</Badge>
            </ComingSoon>
          )}
        </MainContent>

        {/* Profile Drawer */}
        <AnimatePresence>
          {showProfile && (
            <Overlay onClick={() => setShowProfile(false)}>
              <Drawer onClick={(e) => e.stopPropagation()}>
                <DrawerHeader>
                  <strong>Profile</strong>
                  <CloseBtn onClick={() => setShowProfile(false)}>×</CloseBtn>
                </DrawerHeader>
              <ProfileCard>
                 <ProfilePhoto $zodiacColor={(() => {
                   // Calculate zodiac from date_of_birth using UTC
                   const dob = loggedInUser?.date_of_birth
                   if (!dob) return null
                   
                   // Parse using UTC to avoid timezone issues
                   const date = new Date(dob)
                   const month = date.getUTCMonth() + 1
                   const day = date.getUTCDate()
                   
                   let zodiac = null
                   if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) zodiac = 'Aries'
                   else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) zodiac = 'Taurus'
                   else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) zodiac = 'Gemini'
                   else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) zodiac = 'Cancer'
                   else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) zodiac = 'Leo'
                   else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) zodiac = 'Virgo'
                   else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) zodiac = 'Libra'
                   else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) zodiac = 'Scorpio'
                   else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) zodiac = 'Sagittarius'
                   else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) zodiac = 'Capricorn'
                   else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) zodiac = 'Aquarius'
                   else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) zodiac = 'Pisces'
                   
                   return ZODIAC_COLORS[zodiac] || null
                 })()}>
                  {loggedInUser?.public_photo ? (
                    <img src={loggedInUser.public_photo} alt="Profile" />
                  ) : (
                    <span>👤</span>
                  )}
                </ProfilePhoto>
                  <ProfileInfo>
                    <ProfileName>{loggedInUser?.full_name || loggedInUser?.first_name || 'UC ERA Member'}</ProfileName>
                    <ProfileMeta>Member #{loggedInUser?.member_id || '0000000'}</ProfileMeta>
                  </ProfileInfo>
                </ProfileCard>
                <DrawerActions>
                  <button onClick={() => alert('Edit profile coming soon')}>Edit Profile</button>
                </DrawerActions>
              </Drawer>
            </Overlay>
          )}
        </AnimatePresence>

        {/* Bottom Navigation */}
        {!openChat && (
          <NavContainer>
            <BottomNav value={activeTab} onChange={handleTabChange} />
          </NavContainer>
        )}
      </Container>
    </Screen>
  )
}

export default Home

// Styled Components - Mobile First Design
const Screen = styled.div`
  min-height: 100vh;
  width: 100vw;
  background: white;
  position: relative;
  overflow: hidden;
`

const Container = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: white;
  position: relative;
  overflow: hidden;
  
  /* Remove desktop centering - Keep mobile-first full screen */
`

const Notification = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: #3b82f6;
  color: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1000;
  
  &.success { background: #10b981; }
  &.error { background: #ef4444; }
  
  button {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    margin: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    text-align: center;
  }
`

const Header = styled.header`
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding: 12px 16px;
  position: sticky;
  top: 0;
  z-index: 100;
  min-height: 60px;
  
  /* Mobile-first header - no need for desktop adjustments */
`

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
  min-height: 36px;
`

const ProfileButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border: 3px solid ${props => props.$zodiacColor || '#667eea'};
  background: ${props => props.$zodiacColor ? 
    `linear-gradient(135deg, ${props.$zodiacColor} 0%, ${props.$zodiacColor}dd 100%)` :
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s;
  box-shadow: ${props => props.$zodiacColor ? 
    `0 0 0 1px rgba(255, 255, 255, 0.8), 0 2px 8px ${props.$zodiacColor}44` :
    'none'
  };
  
  /* Mobile-optimized touch target */
  &:active { transform: scale(0.95); }
  
  &:hover {
    transform: scale(1.05);
    box-shadow: ${props => props.$zodiacColor ? 
      `0 0 0 1px rgba(255, 255, 255, 0.9), 0 4px 12px ${props.$zodiacColor}66` :
      'none'
    };
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 17px;
  }
  
  span {
    color: white;
    font-size: 18px;
  }
`

const HeaderInfo = styled.div`
  flex: 1;
`

const UserName = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
`

const DateLabel = styled.p`
  margin: 0;
  font-size: 12px;
  color: #666;
`

const LogoContainer = styled.div`
  img {
    height: 24px;
    opacity: 0.8;
  }
`

const MainContent = styled.main`
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
`

const MoreSection = styled.div`
  padding: 20px;
`

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 20px;
`

const MoreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
`

const MoreCard = styled.div`
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  transition: all 0.2s;
  cursor: pointer;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  }
  
  .icon {
    font-size: 32px;
    margin-bottom: 12px;
  }
  
  .title {
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 4px;
    font-size: 16px;
  }
  
  .desc {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 12px;
    line-height: 1.4;
  }
`

const Badge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 500;
`

const ComingSoon = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  
  .title {
    font-size: 24px;
    font-weight: 700;
    color: #1a1a1a;
  }
  
  .desc {
    font-size: 16px;
    color: #6b7280;
  }
`

const NavContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 200;
  
  /* Mobile-first: Always at bottom, no desktop centering */
`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
`

const Drawer = styled.div`
  width: 100%;
  background: white;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 20px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
`

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  
  strong {
    font-size: 18px;
    color: #1a1a1a;
  }
`

const CloseBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  color: #666;
  line-height: 1;
  padding: 0;
  margin: 0;
  
  /* Perfect centering for × symbol */
  text-align: center;
  vertical-align: middle;
`

const ProfileCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
`

const ProfilePhoto = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  overflow: hidden;
  background: ${props => props.$zodiacColor ? 
    `linear-gradient(135deg, ${props.$zodiacColor} 0%, ${props.$zodiacColor}dd 100%)` :
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };
  border: 4px solid ${props => props.$zodiacColor || '#667eea'};
  box-shadow: ${props => props.$zodiacColor ? 
    `0 0 0 2px rgba(255, 255, 255, 0.8), 0 4px 16px ${props.$zodiacColor}44` :
    'none'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 28px;
  }
  
  span {
    color: white;
    font-size: 24px;
  }
`

const ProfileInfo = styled.div``

const ProfileName = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
`

const ProfileMeta = styled.p`
  margin: 0;
  font-size: 14px;
  color: #6b7280;
`

const DrawerActions = styled.div`
  display: flex;
  gap: 12px;
  
  button {
    flex: 1;
    padding: 12px 20px;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    background: white;
    color: #1a1a1a;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background: #f3f4f6;
    }
  }
`

/* Remove desktop backdrop - Mobile only design */

