import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../../lib/appwrite'
import { ZODIAC_COLORS } from '../../utils/mockData'

const SeenByList = ({ message, onClose }) => {
  const [seenByUsers, setSeenByUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSeenByUsers = async () => {
      if (!message.readBy || message.readBy.length === 0) {
        setLoading(false)
        return
      }

      try {
        // Fetch user details for all users who have read the message
        const userPromises = message.readBy.map(userId =>
          databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.USERS,
            [Query.equal('$id', userId)]
          ).then(res => res.documents[0]).catch(() => null)
        )

        const users = await Promise.all(userPromises)
        
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
        
        const validUsers = users.filter(u => u).map(u => ({
          id: u.$id,
          name: u.full_name || u.first_name || 'Member',
          photo: u.public_photo,
          zodiac: calculateZodiac(u.date_of_birth)
        }))

        setSeenByUsers(validUsers)
      } catch (error) {
        console.error('Failed to load seen by users:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSeenByUsers()
  }, [message.readBy])

  return (
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <Modal
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Header>
            <Title>👁️ Seen By</Title>
            <CloseButton onClick={onClose}>✕</CloseButton>
          </Header>

          <Content>
            {loading ? (
              <LoadingText>Loading...</LoadingText>
            ) : seenByUsers.length === 0 ? (
              <EmptyText>No one has seen this message yet</EmptyText>
            ) : (
              seenByUsers.map(user => (
                <UserItem key={user.id}>
                  <UserAvatar $zodiacColor={ZODIAC_COLORS[user.zodiac] || '#667eea'}>
                    {user.photo ? (
                      <img src={user.photo} alt={user.name} />
                    ) : (
                      <AvatarIcon>👤</AvatarIcon>
                    )}
                  </UserAvatar>
                  <UserName>{user.name}</UserName>
                  <SeenIcon>✓✓</SeenIcon>
                </UserItem>
              ))
            )}
          </Content>
        </Modal>
      </Overlay>
    </AnimatePresence>
  )
}

export default SeenByList

// Styled Components
const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
`

const Modal = styled(motion.div)`
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 400px;
  max-height: 500px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e4e6eb;
`

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #050505;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #65676b;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  
  &:hover {
    color: #050505;
  }
`

const Content = styled.div`
  padding: 12px 0;
  overflow-y: auto;
  flex: 1;
`

const UserItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 24px;
  gap: 12px;
  transition: background 0.2s;
  
  &:hover {
    background: #f0f2f5;
  }
`

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: ${props => props.$zodiacColor ? 
    `linear-gradient(135deg, ${props.$zodiacColor} 0%, ${props.$zodiacColor}dd 100%)` :
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };
  border: 2px solid ${props => props.$zodiacColor || '#667eea'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const AvatarIcon = styled.span`
  font-size: 20px;
  color: white;
`

const UserName = styled.div`
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #050505;
`

const SeenIcon = styled.div`
  font-size: 14px;
  color: #4ade80;
  font-weight: 600;
`

const LoadingText = styled.div`
  text-align: center;
  padding: 32px;
  color: #65676b;
  font-size: 14px;
`

const EmptyText = styled.div`
  text-align: center;
  padding: 32px;
  color: #65676b;
  font-size: 14px;
`
