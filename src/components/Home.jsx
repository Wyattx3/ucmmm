import React, { useEffect, useMemo, useRef, useState } from 'react'
import client, { databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../lib/appwrite.js'
import './Home.css'
import styled from 'styled-components'
import BottomNav from './BottomNav'

const Home = ({ formData, notification, closeNotification, loggedInUser }) => {
  const [activeTab, setActiveTab] = useState('chat')
  const [showProfile, setShowProfile] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [openChat, setOpenChat] = useState(null)
  const [messagesByChat, setMessagesByChat] = useState({})
  const [composerText, setComposerText] = useState('')
  const [composerImage, setComposerImage] = useState(null)
  const todayLabel = useMemo(() => {
    const now = new Date()
    const options = { weekday: 'short', month: 'short', day: 'numeric' }
    return `Today • ${now.toLocaleDateString(undefined, options)}`
  }, [])
  const [pinnedMemberIds, setPinnedMemberIds] = useState(() => {
    try {
      const saved = localStorage.getItem('ucera_pinned_members')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('ucera_pinned_members', JSON.stringify(pinnedMemberIds))
    } catch {}
  }, [pinnedMemberIds])

  // Load messages from DB on chat open
  useEffect(() => {
    (async () => {
      if (!openChat) return
      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.MESSAGES,
          [Query.equal('chatId', openChat.id), Query.orderAsc('createdAt'), Query.limit(200)]
        )
        setMessagesByChat(prev => ({ 
          ...prev, 
          [openChat.id]: res.documents.map(d => ({ 
            id: d.$id, 
            text: d.text, 
            imageUrl: null, 
            from: d.senderId === loggedInUser?.$id ? 'me' : 'other',
            senderId: d.senderId,
            senderName: d.senderName,
            senderAvatar: d.senderAvatar,
            time: new Date(d.createdAt || d.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          })) 
        }))
        
        // Auto scroll to latest message after loading
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
          }
        }, 100)
      } catch (e) {
        console.warn('Load messages failed:', e.message)
      }
    })()
  }, [openChat])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (openChat && messagesByChat[openChat.id]?.length > 0) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }, 50)
    }
  }, [messagesByChat, openChat])

  // Load real members from database (groups collection or users)
  const [allMembers, setAllMembers] = useState([])
  const [lastMsgByChat, setLastMsgByChat] = useState({})
  useEffect(() => {
    (async () => {
      try {
        // Prefer users collection
        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.USERS,
          [Query.limit(50)]
        )
        const mapped = res.documents
          .filter(d => d.$id !== loggedInUser?.$id) // Exclude logged in user
          .map((d, idx) => ({ id: d.$id || `u-${idx}`, name: d.fullName || d.firstName || 'Member', publicPhoto: d.publicPhoto || null }))
        setAllMembers(mapped)
      } catch (e) {
        console.warn('Could not load members from DB:', e.message)
        setAllMembers([])
      }
    })()
  }, [loggedInUser])

  // Load last message per chat from DB
  useEffect(() => {
    (async () => {
      if (!allMembers.length) return
      console.log(`🔍 Loading last messages for ${allMembers.length} members`)
      try {
        const results = await Promise.all(
          allMembers.slice(0, 50).map(async (m) => {
            try {
              // Use consistent chat ID (sorted user IDs)
              const chatId = [loggedInUser?.$id, m.id].sort().join('_')
              const r = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.MESSAGES,
                [Query.equal('chatId', chatId), Query.orderDesc('createdAt'), Query.limit(1)]
              )
              const d = r.documents[0]
              if (!d) {
                console.log(`📭 No messages found for member ${m.name} (chatId: ${chatId})`)
                return [chatId, null]
              }
              const when = new Date(d.createdAt || d.$createdAt)
              const lastMsg = { text: d.text, time: when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
              console.log(`📬 Last message for ${m.name} (chatId: ${chatId}):`, lastMsg)
              return [chatId, lastMsg]
            } catch (e) {
              console.warn(`❌ Failed to load last message for ${m.name}:`, e.message)
              const chatId = [loggedInUser?.$id, m.id].sort().join('_')
              return [chatId, null]
            }
          })
        )
        const map = {}
        results.forEach(([id, v]) => { map[id] = v })
        setLastMsgByChat(map)
        console.log(`✅ Last messages loaded:`, map)
      } catch (e) {
        console.warn('Load last messages failed:', e.message)
        if (e.message.includes('Collection with the requested ID could not be found')) {
          console.warn('⚠️ Messages collection missing. See MESSAGES_COLLECTION_SETUP.md for setup instructions.')
        }
      }
    })()
  }, [allMembers])

  const pinnedMembers = useMemo(
    () => allMembers.filter(m => pinnedMemberIds.includes(m.id)),
    [allMembers, pinnedMemberIds]
  )
  const otherMembers = useMemo(
    () => allMembers.filter(m => !pinnedMemberIds.includes(m.id)),
    [allMembers, pinnedMemberIds]
  )

  const togglePin = (memberId) => {
    setPinnedMemberIds(prev => (
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    ))
  }
  const [chatFullscreen, setChatFullscreen] = useState(false)
  const [chatTheme, setChatTheme] = useState('classic') // 'classic' | 'ocean' | 'midnight'
  const messagesEndRef = useRef(null)
  const messagesAreaRef = useRef(null)
  const [keyboardOffset, setKeyboardOffset] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const composerRef = useRef(null)

  // Dynamic text truncation based on screen size
  const [screenWidth, setScreenWidth] = useState(window.innerWidth)
  
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const truncateText = (text) => {
    if (!text) return text
    const limit = screenWidth <= 360 ? 15 : screenWidth <= 480 ? 20 : 25
    return text.length > limit ? text.substring(0, limit) + '...' : text
  }
  const [seenByChat, setSeenByChat] = useState(() => {
    try {
      const raw = localStorage.getItem('ucera_seen')
      return raw ? JSON.parse(raw) : {}
    } catch { return {} }
  })

  const palette = useMemo(() => {
    const themes = {
      classic: {
        meBg: '#2563eb', meColor: '#ffffff', otherBg: '#ffffff', otherColor: '#0f172a', areaBg: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)'
      },
      ocean: {
        meBg: '#0ea5e9', meColor: '#052e49', otherBg: '#e0f2fe', otherColor: '#052e49', areaBg: 'linear-gradient(180deg,#e0f2fe 0%, #ffffff 100%)'
      },
      midnight: {
        meBg: '#1f2937', meColor: '#e5e7eb', otherBg: '#111827', otherColor: '#e5e7eb', areaBg: 'linear-gradient(180deg,#0f172a 0%, #111827 100%)'
      }
    }
    return themes[chatTheme] || themes.classic
  }, [chatTheme])

  // group members (from DB users)
  const groupMembers = useMemo(() => allMembers.map(m => ({ name: m.name, avatar: '👤' })), [allMembers])

  // Helper: always keep latest messages visible
  const scrollToBottom = (smooth = false) => {
    const el = messagesAreaRef.current
    if (!el) return
    requestAnimationFrame(() => {
      try {
        el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
      } catch {
        el.scrollTop = el.scrollHeight
      }
    })
  }

  useEffect(() => {
    scrollToBottom(true)
  }, [messagesByChat, openChat])

  // Load messages for open chat from DB
  useEffect(() => {
    if (!openChat) return
    
    const loadMessages = async () => {
      try {
        console.log(`🔍 Loading messages for chat: ${openChat.id}`)
        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.MESSAGES,
          [Query.equal('chatId', openChat.id), Query.orderAsc('createdAt')]
        )
        console.log(`📝 Found ${res.documents.length} messages for chat ${openChat.id}`)
        const messages = res.documents.map(d => ({
          id: d.$id,
          text: d.text,
          from: d.from || (d.senderId === loggedInUser?.$id ? 'me' : 'other'),
          time: new Date(d.createdAt || d.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          senderName: d.senderName,
          senderAvatar: d.senderAvatar
        }))
        setMessagesByChat(prev => ({ ...prev, [openChat.id]: messages }))
        console.log(`✅ Messages loaded for chat ${openChat.id}:`, messages)
      } catch (e) {
        console.warn('Failed to load messages:', e.message)
        if (e.message.includes('Collection with the requested ID could not be found')) {
          console.warn('⚠️ Messages collection not found. Please create it using MESSAGES_COLLECTION_SETUP.md')
        }
      }
    }
    
    loadMessages()
  }, [openChat, loggedInUser])

  // Create ref for openChat to avoid re-subscriptions
  const openChatRef = useRef(openChat)
  openChatRef.current = openChat

  // Global realtime subscription for all messages (separate from chat opening)
  useEffect(() => {
    if (!loggedInUser) return
    
    console.log(`🔔 Setting up global realtime subscription for user ${loggedInUser.firstName}`)
    const unsubscribe = client.subscribe(
      [`databases.${DATABASE_ID}.collections.${COLLECTIONS.MESSAGES}.documents`],
      (response) => {
        console.log('📡 Global realtime event received:', response.events)
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          const newMessage = response.payload
          console.log('💬 New message received globally:', newMessage)
          console.log(`🔍 Current user ID: ${loggedInUser?.$id}, Message sender ID: ${newMessage.senderId}`)
          
          // Update last message for all chats (this always happens)
          setLastMsgByChat(prev => ({
            ...prev,
            [newMessage.chatId]: {
              text: newMessage.text,
              time: new Date(newMessage.createdAt || newMessage.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          }))
          console.log(`📬 Updated last message for chat ${newMessage.chatId}`)
          
          // Get current openChat from ref to avoid stale closure
          const currentOpenChat = openChatRef.current
          
          // If it's for the currently open chat and NOT from current user, add to messages
          if (currentOpenChat && newMessage.chatId === currentOpenChat.id && newMessage.senderId !== loggedInUser?.$id) {
            const message = {
              id: newMessage.$id,
              text: newMessage.text,
              from: 'other',
              time: new Date(newMessage.createdAt || newMessage.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              senderName: newMessage.senderName,
              senderAvatar: newMessage.senderAvatar
            }
            console.log('➕ Adding received message to current chat:', message)
            setMessagesByChat(prev => ({
              ...prev,
              [currentOpenChat.id]: [...(prev[currentOpenChat.id] || []), message]
            }))
            
            // Auto-scroll to bottom when new message arrives
            setTimeout(() => {
              if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
              }
            }, 100)
          } else if (newMessage.senderId === loggedInUser?.$id) {
            console.log('🚫 Ignoring own message to prevent duplication')
          } else if (!currentOpenChat) {
            console.log('📝 No chat open, only updating last message')
          } else if (newMessage.chatId !== currentOpenChat.id) {
            console.log(`📝 Message for different chat (${newMessage.chatId}), only updating last message`)
          }
        }
      }
    )
    
    return () => {
      console.log('🔌 Unsubscribing from global realtime')
      unsubscribe()
    }
  }, [loggedInUser]) // Only depend on loggedInUser, not openChat

  useEffect(() => {
    try { localStorage.setItem('ucera_seen', JSON.stringify(seenByChat)) } catch {}
  }, [seenByChat])

  // Keep composer above mobile keyboard (iOS/Android) using VisualViewport
  useEffect(() => {
    const vv = window.visualViewport
    if (!openChat) { setKeyboardOffset(0); return }

    let rafId = 0
    const smoothSet = (value) => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => setKeyboardOffset(value))
    }

    const handleResize = () => {
      if (!vv) { smoothSet(0); return }
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      smoothSet(offset > 0 ? Math.min(offset + 8, 320) : 0)
    }

    // First apply synchronously to prevent slow animate on second focus
    handleResize()

    // Debounced updates while resizing
    vv?.addEventListener('resize', handleResize, { passive: true })
    vv?.addEventListener('scroll', handleResize, { passive: true })
    const onFocus = () => setTimeout(handleResize, 0)
    document.addEventListener('focusin', onFocus, { passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      vv?.removeEventListener('resize', handleResize)
      vv?.removeEventListener('scroll', handleResize)
      document.removeEventListener('focusin', onFocus)
    }
  }, [openChat])

  // Ensure last message and composer stay visible without zoom
  useEffect(() => {
    if (!openChat) return
    // Avoid iOS auto-zoom by keeping input font-size >= 16px
    const inputEl = composerRef.current?.querySelector('input.text')
    if (inputEl) inputEl.style.fontSize = '16px'
    scrollToBottom(false)
  }, [keyboardOffset, openChat])

  const isKeyboardOpen = keyboardOffset > 0
  
  // Mock helper: simulate other user seeing your last msg and replying (1-1 chat only)
  const simulateOtherReply = null

  // Mock helper: simulate random group member replying
  const simulateGroupReply = null
  const navPad = (isKeyboardOpen || isTyping) ? 0 : 12

  return (
    <Screen>
      <BgGrad />
      <div className="home-container">
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          <span className="notification-message">{notification.message}</span>
          <button className="notification-close" onClick={closeNotification}>×</button>
        </div>
      )}
      
      {/* Header */}
      <Header>
        <LiquidBanner aria-hidden="true" />
        <HeaderLeft>
          <ProfileButton aria-label="Profile" onClick={() => setShowProfile(true)}>
            {formData.publicPhoto ? (
              <img src={formData.publicPhoto} alt="Profile" />
            ) : (
              <span className="fallback">👤</span>
            )}
          </ProfileButton>
          <UserMeta>
            <div className="name">{formData.firstName || 'Member'}</div>
            <div className="date">{todayLabel}</div>
          </UserMeta>
        </HeaderLeft>
        <div />
        <SearchButton onClick={() => setShowSearch(true)} aria-label="Search">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="6" stroke="#2563eb" strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </SearchButton>
      </Header>

      {/* Main Content */}
      <div className="home-content">
        {activeTab === 'chat' && (
          <ChatSection>
            {!openChat && (
              <GroupHero onClick={() => setOpenChat({ id: 'group', name: 'UC ERA Group', isGroup: true, avatar: '/ucera-logo.png' })}>
                <img src="/ucera-logo.png" alt="UC ERA" />
              </GroupHero>
            )}

            {openChat && (
              chatFullscreen ? (
                <ChatFullscreen>
                  <ChatThreadFull>
                    <ThreadHeader>
                      <BackBtn onClick={() => setOpenChat(null)} aria-label="Back">←</BackBtn>
                      <div className="meta">
                        <div className="name">{openChat.name}</div>
                        <div className="sub">{openChat.isGroup ? 'Group' : 'Online'}</div>
                      </div>
                      <HeaderActions>
                        <ThemeSelect value={chatTheme} onChange={(e)=>setChatTheme(e.target.value)} aria-label="Theme">
                          <option value="classic">Classic</option>
                          <option value="ocean">Ocean</option>
                          <option value="midnight">Midnight</option>
                        </ThemeSelect>
                        <FullBtn onClick={() => setChatFullscreen(false)} aria-label="Exit fullscreen">🗗</FullBtn>
                      </HeaderActions>
                    </ThreadHeader>

                    <MessagesArea ref={messagesAreaRef} $areaBg={palette.areaBg} $bottomPad={keyboardOffset} $navPad={navPad}>
                      {(messagesByChat[openChat.id] || []).map((m, index) => (
                        <MessageRow 
                          key={`${openChat.id}-${m.id}-${index}`} 
                          $me={m.from === 'me'} 
                          $meBg={palette.meBg} 
                          $meColor={palette.meColor} 
                          $otherBg={palette.otherBg} 
                          $otherColor={palette.otherColor}
                        >
                          <div className="message-container">
                          {openChat.isGroup && m.from !== 'me' && (
                              <div className="sender" style={{display:'flex',alignItems:'center',gap:8}}>
                                <div style={{width:26,height:26,borderRadius:'9999px',overflow:'hidden',background:'#eef2ff',display:'grid',placeItems:'center',fontSize:14}}>
                                  {m.senderAvatar ? (
                                    <img src={m.senderAvatar} alt={m.senderName} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                                  ) : '👤'}
                                </div>
                                <div style={{fontWeight:700,color:'#0f172a'}}>{m.senderName || 'Member'}</div>
                              </div>
                            )}
                            {!openChat.isGroup && m.from === 'other' && (
                              <div className="sender" style={{display:'flex',alignItems:'center',gap:8}}>
                                <div style={{width:24,height:24,borderRadius:'50%',overflow:'hidden',background:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>
                                  {m.senderAvatar ? (
                                    <img src={m.senderAvatar} alt={m.senderName} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                                  ) : '👤'}
                                </div>
                                <div style={{fontWeight:600,color:'#475569',fontSize:13}}>{m.senderName || openChat.name}</div>
                              </div>
                          )}
                          {m.text && <div className="bubble text">{m.text}</div>}
                          {m.imageUrl && (
                            <div className="bubble image"><img src={m.imageUrl} alt="sent" /></div>
                          )}
                          <div className="time">{m.time}</div>
                          </div>
                        </MessageRow>
                      ))}
                      <div ref={messagesEndRef} />
                    </MessagesArea>

                    <Composer ref={composerRef} $offset={keyboardOffset} $navPad={navPad}>
                      <AttachLabel htmlFor="chat-image">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 8a2 2 0 0 1 2-2h2l1.2-1.8A2 2 0 0 1 10.9 3h2.2a2 2 0 0 1 1.7 1.2L16 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" stroke="#0f172a" strokeWidth="1.5"/>
                          <circle cx="12" cy="12" r="3.5" stroke="#0f172a" strokeWidth="1.5"/>
                        </svg>
                      </AttachLabel>
                      <input id="chat-image" type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const url = URL.createObjectURL(file)
                          setComposerImage(url)
                        }} />
                      <input className="text" placeholder="Message..." value={composerText}
                        onChange={(e) => setComposerText(e.target.value)}
                        onFocus={() => setIsTyping(true)}
                        onBlur={() => setIsTyping(false)}
                        onKeyDown={(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); document.getElementById('send-btn')?.click(); } }} />
                      {composerImage && (
                        <PreviewThumb onClick={()=> setComposerImage(null)}>
                          <img src={composerImage} alt="preview" />
                        </PreviewThumb>
                      )}
                      <SendBtn
                        disabled={!composerText && !composerImage}
                        id="send-btn"
                        onClick={() => {
                          if (!openChat) return
                          const entry = {
                            id: `${Date.now()}`,
                            text: composerText || null,
                            imageUrl: composerImage || null,
                            from: 'me',
                            senderId: loggedInUser?.$id,
                            senderName: loggedInUser?.firstName,
                            senderAvatar: loggedInUser?.publicPhoto,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          }
                          setMessagesByChat(prev => ({
                            ...prev,
                            [openChat.id]: [...(prev[openChat.id] || []), entry]
                          }))
                          // Persist to DB (production)
                          try {
                            databases.createDocument(
                              DATABASE_ID,
                              COLLECTIONS.MESSAGES,
                              ID.unique(),
                              {
                                chatId: openChat.id,
                                from: 'me',
                                text: entry.text,
                                createdAt: new Date().toISOString(),
                                senderId: loggedInUser?.$id,
                                senderName: loggedInUser?.firstName,
                                senderAvatar: loggedInUser?.publicPhoto
                              }
                            ).catch(()=>{})
                          } catch (e) { console.warn('DB create message failed:', e.message) }
                          setComposerText('')
                          setComposerImage(null)
                        }}
                      >Send</SendBtn>
                    </Composer>
                  </ChatThreadFull>
                </ChatFullscreen>
              ) : (
                <ChatThread>
                  <ThreadHeader>
                    <BackBtn onClick={() => setOpenChat(null)} aria-label="Back">←</BackBtn>
                    <div className="meta">
                      <div className="name">{openChat.name}</div>
                      <div className="sub">{openChat.isGroup ? 'Group' : 'Online'}</div>
                    </div>
                    <HeaderActions>
                      <ThemeSelect value={chatTheme} onChange={(e)=>setChatTheme(e.target.value)} aria-label="Theme">
                        <option value="classic">Classic</option>
                        <option value="ocean">Ocean</option>
                        <option value="midnight">Midnight</option>
                      </ThemeSelect>
                      <FullBtn onClick={() => setChatFullscreen(true)} aria-label="Enter fullscreen">🗖</FullBtn>
                    </HeaderActions>
                  </ThreadHeader>

                   <MessagesArea ref={messagesAreaRef} $areaBg={palette.areaBg} $bottomPad={keyboardOffset} $navPad={navPad}>
                    {(messagesByChat[openChat.id] || []).map((m, index) => (
                      <MessageRow 
                        key={`${openChat.id}-${m.id}-${index}`} 
                        $me={m.from === 'me'} 
                        $meBg={palette.meBg} 
                        $meColor={palette.meColor} 
                        $otherBg={palette.otherBg} 
                        $otherColor={palette.otherColor}
                      >
                        <div className="message-container">
                        {openChat.isGroup && m.from !== 'me' && (
                            <div className="sender" style={{display:'flex',alignItems:'center',gap:8}}>
                              <div style={{width:26,height:26,borderRadius:'9999px',overflow:'hidden',background:'#eef2ff',display:'grid',placeItems:'center',fontSize:14}}>
                                {m.senderAvatar ? (
                                  <img src={m.senderAvatar} alt={m.senderName} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                                ) : '👤'}
                              </div>
                              <div style={{fontWeight:700,color:'#0f172a'}}>{m.senderName || 'Member'}</div>
                            </div>
                          )}
                          {/* 1-on-1 chat: Show sender info for 'other' messages */}
                          {!openChat.isGroup && m.from === 'other' && (
                            <div className="sender" style={{display:'flex',alignItems:'center',gap:8}}>
                              <div style={{width:24,height:24,borderRadius:'50%',overflow:'hidden',background:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>
                                {m.senderAvatar ? (
                                  <img src={m.senderAvatar} alt={m.senderName} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                                ) : '👤'}
                              </div>
                              <div style={{fontWeight:600,color:'#475569',fontSize:13}}>{m.senderName || openChat.name}</div>
                            </div>
                          )}
                          {m.text && (
                            <div className="bubble text">{m.text}</div>
                          )}
                        {m.imageUrl && (
                          <div className="bubble image"><img src={m.imageUrl} alt="sent" /></div>
                        )}
                        <div className="time">{m.time}</div>
                        </div>
                      </MessageRow>
                    ))}
                    <div ref={messagesEndRef} />
                  </MessagesArea>

                   <Composer ref={composerRef} $offset={keyboardOffset} $navPad={navPad}>
                    <AttachLabel htmlFor="chat-image">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 8a2 2 0 0 1 2-2h2l1.2-1.8A2 2 0 0 1 10.9 3h2.2a2 2 0 0 1 1.7 1.2L16 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" stroke="#0f172a" strokeWidth="1.5"/>
                        <circle cx="12" cy="12" r="3.5" stroke="#0f172a" strokeWidth="1.5"/>
                      </svg>
                    </AttachLabel>
                    <input id="chat-image" type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const url = URL.createObjectURL(file)
                        setComposerImage(url)
                      }} />
                    <input className="text" placeholder="Message..." value={composerText}
                      onChange={(e) => setComposerText(e.target.value)}
                      onFocus={() => setIsTyping(true)}
                      onBlur={() => setIsTyping(false)}
                      onKeyDown={(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); document.getElementById('send-btn')?.click(); } }} />
                    {composerImage && (
                      <PreviewThumb onClick={()=> setComposerImage(null)}>
                        <img src={composerImage} alt="preview" />
                      </PreviewThumb>
                    )}
                    <SendBtn
                      disabled={!composerText && !composerImage}
                      id="send-btn"
                      onClick={() => {
                        if (!openChat) return
                        
                        const messageText = composerText?.trim()
                        if (!messageText && !composerImage) return
                        
                        const entry = {
                          id: `temp_${Date.now()}`,
                          text: messageText || null,
                          imageUrl: composerImage || null,
                          from: 'me',
                          senderId: loggedInUser?.$id,
                          senderName: loggedInUser?.firstName,
                          senderAvatar: loggedInUser?.publicPhoto,
                          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }
                        
                        // 1. Immediate UI update for instant feedback
                        setMessagesByChat(prev => ({
                          ...prev,
                          [openChat.id]: [...(prev[openChat.id] || []), entry]
                        }))
                        
                        // 2. Clear composer immediately
                        setComposerText('')
                        setComposerImage(null)
                        
                        // 3. Update last message cache immediately
                        setLastMsgByChat(prev => ({
                          ...prev,
                          [openChat.id]: {
                            text: entry.text,
                            time: entry.time
                          }
                        }))
                        
                        // 4. Auto-scroll immediately
                        setTimeout(() => {
                          if (messagesEndRef.current) {
                            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
                          }
                        }, 50)
                        
                        // 5. Background database save (non-blocking)
                        setTimeout(async () => {
                          try {
                            console.log(`📤 Sending message to chat ${openChat.id}:`, entry.text)
                            const newDoc = await databases.createDocument(
                              DATABASE_ID,
                              COLLECTIONS.MESSAGES,
                              ID.unique(),
                              {
                                chatId: openChat.id,
                                from: 'me',
                                text: entry.text,
                                createdAt: new Date().toISOString(),
                                senderId: loggedInUser?.$id,
                                senderName: loggedInUser?.firstName,
                                senderAvatar: loggedInUser?.publicPhoto
                              }
                            )
                            console.log('✅ Message sent to database successfully:', newDoc.$id)
                            
                            // Update the temp message with real ID
                            setMessagesByChat(prev => ({
                              ...prev,
                              [openChat.id]: (prev[openChat.id] || []).map(msg => 
                                msg.id === entry.id ? { ...msg, id: newDoc.$id } : msg
                              )
                            }))
                            
                          } catch (e) { 
                            console.warn('❌ DB create message failed:', e.message)
                            if (e.message.includes('Collection with the requested ID could not be found')) {
                              console.error('🚨 SETUP REQUIRED: Messages collection not found!')
                              console.info('📋 Run: See MESSAGES_COLLECTION_SETUP.md for production setup')
                            }
                            // Keep message in UI even if DB fails (offline-first approach)
                          }
                        }, 0)
                      }}
                    >Send</SendBtn>
                  </Composer>
                </ChatThread>
              )
            )}

            {pinnedMembers.length > 0 && (
              <>
                <ListHeader>Pinned</ListHeader>
                <PinnedScroller>
                  {pinnedMembers.map(m => (
                    <PinnedChip key={m.id} onClick={() => togglePin(m.id)}>
                      <span className="avatar">{m.avatar}</span>
                      <span className="label">{m.name}</span>
                      <span className="pin">★</span>
                    </PinnedChip>
                  ))}
                </PinnedScroller>
              </>
            )}

            <ListHeader>Members</ListHeader>
            {!openChat && (
            <ChatsGrid>
              {otherMembers.map(m => {
                // Create consistent chat ID for 1-on-1 conversations
                const chatId = [loggedInUser?.$id, m.id].sort().join('_')
                return (
                <ChatTile key={m.id} onClick={() => {
                  console.log(`🔄 Opening chat with ${m.name}. ChatID: ${chatId} (User A: ${loggedInUser?.$id}, User B: ${m.id})`)
                  setOpenChat({ id: chatId, name: m.name, isGroup: false, otherUserId: m.id })
                }}>
                  <div className="avatar" style={{width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', fontSize: '20px'}}>
                    {m.publicPhoto ? (
                      <img src={m.publicPhoto} alt={m.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    ) : '👤'}
                  </div>
                  <div className="center">
                    <div className="name">{m.name}</div>
                    <div className="sub">{truncateText(lastMsgByChat[chatId]?.text) || 'No message yet'} • {lastMsgByChat[chatId]?.time || '—'}</div>
                  </div>
                  <RightMeta>
                    <span className="time">{lastMsgByChat[chatId]?.time || ''}</span>
                    {/* badge removed in prod unless unread calc available */}
                  </RightMeta>
                  <PinIcon
                    aria-label={pinnedMemberIds.includes(m.id) ? 'Unpin' : 'Pin'}
                    onClick={() => togglePin(m.id)}
                    title={pinnedMemberIds.includes(m.id) ? 'Unpin' : 'Pin'}
                  >
                    {pinnedMemberIds.includes(m.id) ? '★' : '☆'}
                  </PinIcon>
                </ChatTile>
                )
               })}
            </ChatsGrid>
            )}
          </ChatSection>
        )}

        {activeTab === 'more' && (
          <MoreGrid>
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
        )}

        {activeTab === 'settings' && (
          <ComingSoon>
            <div className="title">Settings</div>
            <div className="desc">App preferences and configurations</div>
            <Badge>Coming soon</Badge>
          </ComingSoon>
        )}
      </div>

      {/* Profile Drawer */}
      {showProfile && (
        <Overlay role="dialog" aria-modal="true" onClick={() => setShowProfile(false)}>
          <Drawer onClick={(e) => e.stopPropagation()}>
            <DrawerHeader>
              <strong>Profile</strong>
              <CloseBtn onClick={() => setShowProfile(false)}>×</CloseBtn>
            </DrawerHeader>
            <ProfileCard>
              <div className="photo">
                {formData.publicPhoto ? (
                  <img src={formData.publicPhoto} alt="Profile" />
                ) : (
                  <span>👤</span>
                )}
              </div>
              <div className="info">
                <div className="name">{formData.firstName || 'UC ERA Member'}</div>
                <div className="meta">Member</div>
              </div>
            </ProfileCard>
            <DrawerActions>
              <button type="button" onClick={() => alert('Edit profile coming soon')}>Edit Profile</button>
            </DrawerActions>
          </Drawer>
        </Overlay>
      )}

      {/* Search Modal */}
      {showSearch && (
        <Overlay role="dialog" aria-modal="true" onClick={() => setShowSearch(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <SearchField>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="6" stroke="#64748b" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input placeholder="Search members, groups" disabled />
            </SearchField>
            <div className="title" style={{ marginTop: 8 }}>Search</div>
            <div className="desc">Find members and groups</div>
            <Badge>Coming soon</Badge>
            <ModalClose onClick={() => setShowSearch(false)}>Close</ModalClose>
          </Modal>
        </Overlay>
      )}

      {/* Bottom Navigation (controlled) */}
      <FooterDock $hidden={isKeyboardOpen || isTyping} aria-hidden={isKeyboardOpen || isTyping}>
        <BottomNav value={activeTab} onChange={setActiveTab} />
      </FooterDock>
      </div>
    </Screen>
  )
}

export default Home

// Styled header
const Header = styled.div`
  position: sticky;
  top: 0;
  width: 100%;
  height: 78px; /* taller to host liquid banner */
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  padding: calc(env(safe-area-inset-top) + 6px) 14px 0 14px;
  background: transparent; /* Glass lives in LiquidBanner */
  color: #0f172a;
  z-index: 20;
  border-bottom: none;
  position: sticky;
  isolation: isolate; /* Create stacking context for glass */

  @media (min-width: 480px) {
    height: 86px;
    padding-left: 18px;
    padding-right: 18px;
  }

  @media (min-width: 768px) {
    height: 92px;
    padding-left: 22px;
    padding-right: 22px;
  }

  @media (min-width: 1024px) {
    height: 96px;
    padding-left: 28px;
    padding-right: 28px;
  }
`

// iOS-like liquid glass banner background for header
const LiquidBanner = styled.div`
  position: absolute;
  z-index: 0;
  inset: calc(env(safe-area-inset-top) + 4px) 10px 10px 10px; /* bigger banner */
  border-radius: 20px;
  pointer-events: none;
  transform: translateY(4px); /* lower the banner slightly to align with profile center */

  /* Glass look */
  background: linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.48) 100%);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  border: 1px solid rgba(255,255,255,0.38);
  box-shadow: 0 16px 28px rgba(30,58,138,0.16), inset 0 1px 0 rgba(255,255,255,0.65), 0 0 0 1px rgba(2,6,23,0.04);

  /* Liquid accents */
  &::before, &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    filter: blur(22px);
  }
  &::before {
    width: 220px;
    height: 220px;
    top: -60px;
    left: -28px;
    background: radial-gradient(circle at 50% 50%, rgba(59,130,246,0.35), rgba(59,130,246,0) 65%);
  }
  &::after {
    width: 240px;
    height: 240px;
    right: -40px;
    bottom: -90px;
    background: radial-gradient(circle at 50% 50%, rgba(99,102,241,0.28), rgba(99,102,241,0) 70%);
  }

  @media (min-width: 480px) {
    transform: translateY(6px);
  }
`

const ProfileButton = styled.button`
  width: 46px;
  height: 46px;
  border-radius: 9999px;
  border: 2px solid transparent; /* ring animation will live in this border area */
  background: rgba(255, 255, 255, 0.15);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative; /* for light ring */
  cursor: pointer;
  transition: transform 0.12s ease, background-color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 1px 2px rgba(2,6,23,0.06);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .fallback {
    font-size: 16px;
    color: #fff;
  }

  &:hover { box-shadow: 0 2px 6px rgba(2,6,23,0.12); }
  &:active { transform: scale(0.96); }

  /* Soft outer glow */
  &::before {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: inherit;
    background: radial-gradient(closest-side, rgba(59,130,246,0.45), rgba(147,197,253,0.0));
    filter: blur(8px);
    z-index: 0;
    pointer-events: none;
  }

  /* Animated light ring like member card */
  &::after {
    content: '';
    position: absolute;
    inset: 0; /* align exactly with border */
    border-radius: inherit;
    padding: 2px; /* ring thickness equals previous white border */
    background: conic-gradient(
      from 0deg,
      rgba(255,255,255,0.95) 0deg,
      rgba(96,165,250,0.85) 60deg,
      rgba(167,139,250,0.85) 150deg,
      rgba(34,211,238,0.85) 240deg,
      rgba(255,255,255,0.95) 360deg
    );
    -webkit-mask: 
      linear-gradient(#000 0 0) content-box, 
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
            mask-composite: exclude;
    animation: spin 8s linear infinite;
    opacity: 1;
    z-index: 1;
    pointer-events: none;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @media (min-width: 480px) {
    width: 50px;
    height: 50px;
  }
`

const HeaderLeft = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  z-index: 2;
`

const UserMeta = styled.div`
  display: grid;
  line-height: 1.1;
  .name { font-weight: 700; color: #0f172a; font-size: 14px; }
  .date { font-size: 11px; color: #94a3b8; }
  @media (min-width: 480px) {
    .name { font-size: 15px; }
  }
`

const LogoCenter = styled.div`
  display: grid;
  place-items: center;
  pointer-events: none;
  img { height: 24px; opacity: 0.95; }
  @media (min-width: 480px) { img { height: 26px; } }
`

const Screen = styled.div`
  min-height: 100vh;
  width: 100vw;
  position: relative;
  display: flex;
  align-items: stretch;
  justify-content: center;
  background: transparent;
  padding: 0;
  overflow-x: hidden;
`

const BgGrad = styled.div`
  position: fixed;
  inset: 0;
  background: radial-gradient(1200px 600px at 50% -10%, #dbeafe 0%, transparent 55%),
              linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  z-index: 0;
  pointer-events: none;
`

const FooterDock = styled.div`
  position: fixed;
  bottom: calc(12px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  z-index: 100;
  display: ${props => (props.$hidden ? 'none' : 'flex')};
  justify-content: center;
`

const SearchButton = styled.button`
  width: 46px;
  height: 46px;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  box-shadow: 0 1px 2px rgba(2,6,23,0.06), inset 0 0 0 6px rgba(37,99,235,0.04);
  margin-left: auto;
  margin-right: 6px;
  z-index: 2;

  &:hover { box-shadow: 0 4px 10px rgba(2,6,23,0.12), inset 0 0 0 6px rgba(37,99,235,0.06); }
  &:active { transform: scale(0.96); }

  @media (min-width: 480px) {
    width: 50px;
    height: 50px;
  }
`

const ChatSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (min-width: 480px) { gap: 14px; }
  @media (min-width: 768px) { gap: 16px; }
  @media (min-width: 1024px) { gap: 18px; }
`

const GroupTile = styled.div``

const GroupHero = styled.div`
  display: grid;
  place-items: center;
  padding: 28px;
  border: 1px solid #dbeafe;
  border-radius: 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #eef2ff 100%);
  box-shadow: inset 0 6px 24px rgba(2, 6, 23, 0.06), 0 8px 20px rgba(2, 6, 23, 0.04);
  img { height: 144px; filter: drop-shadow(0 6px 10px rgba(2,6,23,0.1)); }
  @media (min-width: 480px) { img { height: 168px; } }
  @media (min-width: 768px) { img { height: 192px; } }
`

const ListHeader = styled.div`
  margin-top: 4px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #94a3b8;
`

const ChatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;

  @media (max-width: 480px) {
    gap: 8px;
  }

  @media (max-width: 360px) {
    gap: 6px;
  }
`

// Thread view styles
const ChatThread = styled.div`
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: calc(100vh - 160px);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #ffffff;
  overflow: hidden;
`

const ThreadHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  .meta { flex: 1; min-width: 0; }
  .meta .name { font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .meta .name { font-weight: 700; color: #0f172a; }
  .meta .sub { font-size: 12px; color: #94a3b8; }
`

const BackBtn = styled.button`
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
`

const MessagesArea = styled.div`
  background: ${props => props.$areaBg || 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)'};
  overflow-y: auto;
  padding: 12px;
  padding-bottom: ${props => (props.$bottomPad ? `${props.$bottomPad + 72}px` : `${(props.$navPad || 12) + 72}px`)};
  display: grid;
  gap: 6px;
  align-content: start;
  grid-auto-rows: min-content;
  max-height: calc(100vh - 200px); /* larger auto-slide frame */
  @media (min-width: 480px) { max-height: calc(100vh - 210px); }
  @media (min-width: 768px) { max-height: calc(100vh - 220px); }
  /* Prevent content from being hidden behind sticky composer when bottom nav hides */
  @supports (padding: max(0px)) {
    padding-bottom: ${props => (props.$bottomPad ? `max(${props.$bottomPad + 72}px, env(safe-area-inset-bottom))` : `max(${(props.$navPad || 12) + 72}px, env(safe-area-inset-bottom))`)};
  }
`

const MessageRow = styled.div.attrs(props => ({
  'data-from': props.$me ? 'me' : 'other'
}))`
  /* Simple Flexbox: Stable & Smooth like Messenger */
  display: flex;
  width: 100%;
  margin-bottom: 8px;
  padding: 0 8px;
  
  /* Mobile responsiveness */
  @media (max-width: 480px) {
    padding: 0 12px;
    margin-bottom: 6px;
  }
  
  /* Message positioning by flex direction */
  ${props => !props.$me ? `
    justify-content: flex-start;
  ` : `
    justify-content: flex-end;
  `}
  
  .message-container {
    display: flex;
    flex-direction: column;
    max-width: 85%;
    min-width: 60px;
    position: relative;
    word-wrap: break-word;
    overflow-wrap: break-word;
    
    /* Mobile responsiveness */
    @media (max-width: 480px) {
      max-width: 90%;
    }
    
    /* Align message content based on sender */
    ${props => !props.$me ? `
      align-items: flex-start;
    ` : `
      align-items: flex-end;
    `}
  }
  
  .sender { 
    font-size: 11px; 
    color: #94a3b8; 
    margin-bottom: 4px;
    ${props => props.$me ? `text-align: right;` : `text-align: left;`}
  }
  
  .bubble { 
    display: inline-block; 
    border-radius: 18px; 
    padding: 10px 14px; 
    box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
    word-break: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
    max-width: 100%;
    box-sizing: border-box;
    transition: all 0.2s ease;
    ${props => props.$me ? `
      background: ${props.$meBg};
      color: ${props.$meColor};
      border-bottom-right-radius: 6px;
    ` : `
      background: ${props.$otherBg};
      color: ${props.$otherColor};
      border-bottom-left-radius: 6px;
    `}
  }
  
  .bubble.text { 
    border: none; 
    white-space: pre-wrap; 
    line-height: 1.4; 
    font-size: 15px;
  }
  
  .bubble.image { 
    background: transparent; 
    padding: 0; 
    border: none; 
    border-radius: 18px;
    overflow: hidden;
  }
  
  .bubble.image img { 
    width: 100%; 
    max-width: 240px; 
    height: auto; 
    border-radius: 18px; 
    display: block; 
  }
  
  .time { 
    font-size: 11px; 
    color: #64748b; 
    margin-top: 3px; 
    opacity: 0.8;
    ${props => props.$me ? `text-align: right;` : `text-align: left;`}
  }
`

const Composer = styled.div`
  position: sticky;
  bottom: ${props => (props.$offset ? `${props.$offset}px` : `${props.$navPad || 12}px`)};
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 6px 10px; /* reduce overall frame height */
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
  will-change: bottom;
  .text { 
    border: 1px solid #e2e8f0; 
    border-radius: 9999px; 
    padding: 8px 12px; 
    height: 40px; /* tighter input height */
    outline: none; 
    transition: box-shadow .15s ease; 
    font-size: 16px; 
  }
  .text:focus { box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
`

const AttachLabel = styled.label`
  cursor: pointer;
  font-size: 18px;
`

const SendBtn = styled.button`
  background: #2563eb; color: #fff; border: none; border-radius: 9999px; padding: 8px 12px; min-height: 40px; cursor: pointer;
  opacity: ${props => (props.disabled ? 0.6 : 1)};
`

const PreviewThumb = styled.div`
  margin-left: 6px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  width: 36px; height: 36px;
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
`

const ThemeSelect = styled.select`
  /* Reset native select look */
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  /* Layout */
  padding: 8px 34px 8px 12px;
  margin-right: 8px;
  border-radius: 9999px; /* pill */
  border: 1px solid #e2e8f0;

  /* Visuals */
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 2px rgba(2,6,23,0.06);
  color: #0f172a;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;

  /* Custom caret */
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="%2362748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 14px;

  /* States */
  &:hover { box-shadow: 0 2px 6px rgba(2,6,23,0.08), inset 0 1px 0 rgba(255,255,255,0.8); }
  &:active { transform: translateY(1px); }
  &:focus { outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,0.15), inset 0 1px 0 rgba(255,255,255,0.8); }

  /* Dark theme readability when used over dark backgrounds */
  @media (prefers-color-scheme: dark) {
    background: linear-gradient(180deg, #0b1220 0%, #0f172a 100%);
    color: #e5e7eb;
    border-color: #1f2937;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="%23a1a1aa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  }
`

// Fullscreen chat overlay
const ChatFullscreen = styled.div`
  position: fixed;
  inset: 0;
  background: #fff;
  z-index: 1000;
  display: grid;
  place-items: center;
`

const ChatThreadFull = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
`

const HeaderActions = styled.div`
  margin-left: auto;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
`

const FullBtn = styled.button`
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 8px;
  padding: 6px 8px;
  cursor: pointer;
`

const ChatTile = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(226, 232, 240, 0.7);
  border-radius: 14px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  position: relative;
  
  .avatar { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 9999px; background: #eef2ff; }
  .center { 
    flex: 1; 
    min-width: 0; 
    margin-right: 100px;
    max-width: calc(100% - 150px);
  }
  .name { 
    color: #0f172a; 
    font-weight: 600; 
    white-space: nowrap; 
    overflow: hidden; 
    text-overflow: ellipsis;
    max-width: 100%;
  }
  .sub { 
    font-size: 12px; 
    color: #64748b; 
    white-space: nowrap; 
    overflow: hidden; 
    text-overflow: ellipsis;
    max-width: 100%;
  }

  @media (max-width: 480px) {
    padding: 8px 10px;
    gap: 8px;
    .avatar { width: 32px; height: 32px; }
    .name { font-size: 14px; }
    .sub { font-size: 11px; }
    .center { 
      margin-right: 75px;
      max-width: calc(100% - 105px);
    }
  }

  @media (max-width: 360px) {
    padding: 6px 8px;
    gap: 6px;
    .avatar { width: 30px; height: 30px; }
    .name { font-size: 13px; }
    .sub { font-size: 10px; }
    .center { 
      margin-right: 70px;
      max-width: calc(100% - 95px);
    }
  }

  @media (min-width: 480px) {
    padding: 12px 14px;
    .name { font-size: 16px; }
    .center { 
      margin-right: 110px;
      max-width: calc(100% - 160px);
    }
  }
`

const PinButton = styled.button`
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #2563eb;
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 12px;
  cursor: pointer;
  &:disabled { opacity: .6; cursor: default; }
`

const RightMeta = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: grid;
  justify-items: end;
  gap: 4px;
  
  .time { font-size: 11px; color: #94a3b8; }
  .badge { 
    display: inline-block; 
    min-width: 18px; 
    height: 18px; 
    padding: 0 6px; 
    border-radius: 9999px; 
    background: #2563eb; 
    color: #fff; 
    font-size: 11px; 
    display: grid; 
    place-items: center; 
  }

  @media (max-width: 360px) {
    right: 10px;
  }

  @media (min-width: 480px) {
    right: 14px;
    .time { font-size: 12px; }
    .badge { min-width: 20px; height: 20px; font-size: 12px; }
  }
`

const PinIcon = styled.button`
  position: absolute;
  right: 50px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  cursor: pointer;
  color: #f59e0b;
  font-size: 16px;
  padding: 4px;
  line-height: 1;
  border-radius: 6px;
  z-index: 10;
  
  &:active { transform: translateY(-50%) scale(0.98); }

  @media (max-width: 360px) {
    right: 45px;
    font-size: 14px;
  }

  @media (min-width: 480px) {
    right: 55px;
    font-size: 18px;
  }
`

const ComingSoon = styled.div`
  display: grid;
  place-items: center;
  gap: 8px;
  height: 100%;
  .title { font-size: 18px; font-weight: 700; color: #0f172a; }
  .desc { font-size: 14px; color: #64748b; }
`

const MoreGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (min-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }

  @media (min-width: 640px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
  }
`

const MoreCard = styled.div`
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  text-align: center;
  .icon { font-size: 22px; }
  .title { font-weight: 700; color: #0f172a; margin-top: 6px; }
  .desc { font-size: 12px; color: #64748b; margin-top: 2px; margin-bottom: 6px; }

  @media (min-width: 480px) {
    padding: 16px;
    .icon { font-size: 24px; }
  }
`

const Badge = styled.span`
  display: inline-block;
  padding: 6px 10px;
  border-radius: 9999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
`



// Overlays and drawers
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.5);
  display: grid;
  place-items: end center;
  z-index: 200;
`

const Drawer = styled.div`
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  padding: 12px 12px 16px 12px;
  box-shadow: 0 -10px 24px rgba(2, 6, 23, 0.2);

  @media (min-width: 480px) { 
    max-width: 480px;
    padding: 16px 16px 20px 16px;
  }
  @media (min-width: 640px) { max-width: 560px; }
  @media (min-width: 768px) { 
    max-width: 720px;
    padding: 20px 20px 24px 20px;
  }
  @media (min-width: 1024px) { max-width: 840px; }
  @media (min-width: 1280px) { max-width: 960px; }
  @media (min-width: 1440px) { max-width: 1120px; }
`

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
  color: #0f172a;
`

const CloseBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  cursor: pointer;
`

const ProfileCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;

  .photo {
    width: 56px;
    height: 56px;
    border-radius: 9999px;
    overflow: hidden;
    display: grid;
    place-items: center;
    background: #f1f5f9;
  }
  .photo img { width: 100%; height: 100%; object-fit: cover; }
  .info .name { font-weight: 700; color: #0f172a; }
  .info .meta { font-size: 12px; color: #64748b; }
`

const DrawerActions = styled.div`
  display: flex;
  gap: 8px;
  button {
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #0f172a;
    cursor: pointer;
  }
`

const Modal = styled.div`
  width: 100%;
  max-width: 380px;
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 80px;
  text-align: center;
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.2);

  .title { font-size: 18px; font-weight: 700; color: #0f172a; }
  .desc { font-size: 14px; color: #64748b; margin-top: 4px; margin-bottom: 8px; }

  @media (min-width: 480px) {
    max-width: 420px;
    margin-bottom: 100px;
    padding: 20px;
    .title { font-size: 20px; }
    .desc { font-size: 15px; }
  }
  
  @media (min-width: 768px) {
    max-width: 480px;
    padding: 24px;
    .title { font-size: 22px; }
    .desc { font-size: 16px; }
  }

  @media (min-width: 1024px) {
    max-width: 520px;
  }
`

const SearchField = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px 10px;
  background: #f8fafc;
  input {
    border: none;
    outline: none;
    flex: 1;
    background: transparent;
    color: #0f172a;
    font-size: 14px;
  }

  @media (min-width: 480px) {
    padding: 10px 12px;
    input { font-size: 15px; }
  }
`

const PinnedScroller = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 8px;
  padding: 2px 2px 6px 2px;
  &::-webkit-scrollbar { display: none; }

  @media (min-width: 480px) {
    gap: 10px;
    padding-bottom: 8px;
  }
`

const PinnedChip = styled.button`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 9999px;
  background: #ffffff;
  cursor: pointer;
  .avatar { width: 20px; height: 20px; display: grid; place-items: center; background: #eef2ff; border-radius: 9999px; }
  .label { font-size: 12px; color: #0f172a; font-weight: 600; }
  .pin { color: #f59e0b; font-size: 14px; }

  @media (max-width: 360px) {
    gap: 6px;
    padding: 6px 8px;
    .label { display: none; }
  }

  @media (min-width: 480px) {
    padding: 9px 12px;
  }
`

const ModalClose = styled.button`
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #0f172a;
  cursor: pointer;
`