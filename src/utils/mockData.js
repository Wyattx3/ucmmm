// Mock data for development when Appwrite is not available

export const MOCK_USERS = [
  {
    $id: 'user1',
    firstName: 'Aung Aung',
    fullName: 'Aung Aung Myint',
    publicPhoto: null,
    hasMemberCard: true,
    zodiacSign: 'Aries'
  },
  {
    $id: 'user2', 
    firstName: 'Thida',
    fullName: 'Thida Win',
    publicPhoto: null,
    hasMemberCard: true,
    zodiacSign: 'Pisces'
  },
  {
    $id: 'user3',
    firstName: 'Kyaw Kyaw',
    fullName: 'Kyaw Kyaw Htun',
    publicPhoto: null,
    hasMemberCard: true,
    zodiacSign: 'Leo'
  },
  {
    $id: 'user4',
    firstName: 'Suu Suu',
    fullName: 'Suu Suu Khaing',
    publicPhoto: null,
    hasMemberCard: true,
    zodiacSign: 'Cancer'
  },
  {
    $id: 'user5',
    firstName: 'Zaw Zaw',
    fullName: 'Zaw Zaw Tun',
    publicPhoto: null,
    hasMemberCard: true,
    zodiacSign: 'Gemini'
  },
  {
    $id: 'user6',
    firstName: 'Moe Moe',
    fullName: 'Moe Moe Aye',
    publicPhoto: null,
    hasMemberCard: true,
    zodiacSign: 'Virgo'
  },
  {
    $id: 'user7',
    firstName: 'Nyan Nyan',
    fullName: 'Nyan Nyan Soe',
    publicPhoto: null,
    hasMemberCard: true,
    zodiacSign: 'Libra'
  },
  {
    $id: 'user8',
    firstName: 'Htun Htun',
    fullName: 'Htun Htun Lwin',
    publicPhoto: null,
    hasMemberCard: true,
    zodiacSign: 'Scorpio'
  },
  {
    $id: 'user9',
    firstName: 'Khin Khin',
    fullName: 'Khin Khin Maw',
    publicPhoto: null,
    hasMemberCard: true,
    zodiacSign: 'Sagittarius'
  },
  {
    $id: 'user10',
    firstName: 'Myint Myint',
    fullName: 'Myint Myint Thu',
    publicPhoto: null,
    hasMemberCard: true,
    zodiacSign: 'Capricorn'
  },
  {
    $id: 'user11',
    firstName: 'Phyu Phyu',
    fullName: 'Phyu Phyu Latt',
    publicPhoto: null,
    hasMemberCard: true,
    zodiacSign: 'Aquarius'
  },
  {
    $id: 'user12',
    firstName: 'Htet Htet',
    fullName: 'Htet Htet Oo',
    publicPhoto: null,
    hasMemberCard: true,
    zodiacSign: 'Taurus'
  }
]

// Zodiac color mapping
export const ZODIAC_COLORS = {
  'Aries': '#ef4444',        // Red
  'Taurus': '#22c55e',       // Green
  'Gemini': '#eab308',       // Yellow
  'Cancer': '#3b82f6',       // Blue
  'Leo': '#f97316',          // Orange
  'Virgo': '#8b5cf6',        // Purple
  'Libra': '#ec4899',        // Pink
  'Scorpio': '#dc2626',      // Dark Red
  'Sagittarius': '#059669',  // Emerald
  'Capricorn': '#7c3aed',    // Violet
  'Aquarius': '#0891b2',     // Cyan
  'Pisces': '#6366f1'        // Indigo
}

export const MOCK_MESSAGES = {
  'uc-main-group': [
    {
      $id: 'msg1',
      text: 'Welcome to Unbreakable Cube! 🎲✨',
      senderId: 'user1',
      senderName: 'Aung Aung',
      senderAvatar: null,
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      chatId: 'uc-main-group',
      isGroupMessage: true
    },
    {
      $id: 'msg2',
      text: 'This is our main discussion space for all UC ERA members!',
      senderId: 'user2',
      senderName: 'Thida',
      senderAvatar: null,
      createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
      chatId: 'uc-main-group',
      isGroupMessage: true
    }
  ],
  'uc-boy-group': [
    {
      $id: 'msg3',
      text: 'Boy group chat is active! 👥',
      senderId: 'user3',
      senderName: 'Kyaw Kyaw',
      senderAvatar: null,
      createdAt: new Date(Date.now() - 900000).toISOString(), // 15 mins ago
      chatId: 'uc-boy-group',
      isGroupMessage: true
    }
  ],
  'uc-girl-group': [
    {
      $id: 'msg4',
      text: 'Girl group discussion! 👭',
      senderId: 'user4',
      senderName: 'Suu Suu',
      senderAvatar: null,
      createdAt: new Date(Date.now() - 600000).toISOString(), // 10 mins ago
      chatId: 'uc-girl-group',
      isGroupMessage: true
    }
  ]
}

export const MOCK_LAST_MESSAGES = {
  'uc-main-group': {
    text: 'Welcome to Unbreakable Cube! 🎲✨',
    time: new Date(Date.now() - 1800000).toISOString(),
    senderName: 'Thida',
    isFromMe: false,
    isUnread: true
  },
  'uc-boy-group': {
    text: 'Boy group chat is active! 👥',
    time: new Date(Date.now() - 900000).toISOString(),
    senderName: 'Kyaw Kyaw',
    isFromMe: false,
    isUnread: true
  },
  'uc-girl-group': {
    text: 'Girl group discussion! 👭',
    time: new Date(Date.now() - 600000).toISOString(),
    senderName: 'Suu Suu',
    isFromMe: false,
    isUnread: false
  },
  // Add individual chat messages for testing
  'user1_current': {
    text: 'Hey! How are you doing?',
    time: new Date(Date.now() - 3600000).toISOString(),
    senderName: 'Aung Aung',
    senderZodiac: 'Aries',
    isFromMe: false,
    isUnread: true
  },
  'user2_current': {
    text: 'Good morning! Ready for today?',
    time: new Date(Date.now() - 7200000).toISOString(),
    senderName: 'Thida',
    senderZodiac: 'Pisces',
    isFromMe: false,
    isUnread: false
  },
  'user3_current': {
    text: 'See you at the meeting!',
    time: new Date(Date.now() - 1800000).toISOString(),
    senderName: 'Kyaw Kyaw',
    senderZodiac: 'Leo',
    isFromMe: false,
    isUnread: true
  },
  'user5_current': {
    text: 'Thanks for your help yesterday 🙏',
    time: new Date(Date.now() - 900000).toISOString(),
    senderName: 'Zaw Zaw',
    senderZodiac: 'Gemini',
    isFromMe: false,
    isUnread: false
  },
  'user7_current': {
    text: 'Can we discuss the project tomorrow?',
    time: new Date(Date.now() - 2700000).toISOString(),
    senderName: 'Nyan Nyan',
    senderZodiac: 'Libra',
    isFromMe: false,
    isUnread: true
  },
  'user9_current': {
    text: 'Happy birthday! 🎉🎂',
    time: new Date(Date.now() - 5400000).toISOString(),
    senderName: 'Khin Khin',
    senderZodiac: 'Sagittarius',
    isFromMe: false,
    isUnread: false
  }
}

export const MOCK_MEMBER_STATUS = {
  'user1': {
    isOnline: true,
    lastSeen: new Date(),
    status: 'Active now'
  },
  'user2': {
    isOnline: false,
    lastSeen: new Date(Date.now() - 300000),
    status: 'Last seen 5 mins ago'
  },
  'user3': {
    isOnline: true,
    lastSeen: new Date(),
    status: 'Active now'  
  },
  'user4': {
    isOnline: false,
    lastSeen: new Date(Date.now() - 600000),
    status: 'Last seen 10 mins ago'
  },
  'user5': {
    isOnline: true,
    lastSeen: new Date(),
    status: 'Active now'
  },
  'user6': {
    isOnline: false,
    lastSeen: new Date(Date.now() - 1800000),
    status: 'Last seen 30 mins ago'
  },
  'user7': {
    isOnline: true,
    lastSeen: new Date(),
    status: 'Active now'
  },
  'user8': {
    isOnline: false,
    lastSeen: new Date(Date.now() - 900000),
    status: 'Last seen 15 mins ago'
  },
  'user9': {
    isOnline: false,
    lastSeen: new Date(Date.now() - 1200000),
    status: 'Last seen 20 mins ago'
  },
  'user10': {
    isOnline: true,
    lastSeen: new Date(),
    status: 'Active now'
  },
  'user11': {
    isOnline: false,
    lastSeen: new Date(Date.now() - 2700000),
    status: 'Last seen 45 mins ago'
  },
  'user12': {
    isOnline: true,
    lastSeen: new Date(),
    status: 'Active now'
  }
}
