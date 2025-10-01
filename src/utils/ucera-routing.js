// UC ERA - Complete Routing System

export const UCERA_ROUTES = {
  // Welcome & Authentication
  WELCOME: '/welcome',
  LOGIN: '/login',
  
  // Registration Process (7 steps)
  REGISTER: '/register',
  REGISTER_NAMES: '/register/names',
  REGISTER_DOB: '/register/date-of-birth',
  REGISTER_CONTACT: '/register/contact-info',
  REGISTER_VERIFY_EMAIL: '/register/verify-email',
  REGISTER_VERIFY_OTP: '/register/verify-otp',
  REGISTER_PASSCODE: '/register/create-passcode',
  REGISTER_CULTURAL: '/register/cultural-info',
  
  // Member Card System
  MEMBER_CARD: '/member-card',
  MEMBER_CARD_CREATE: '/member-card/create',
  MEMBER_CARD_COMPLETE: '/member-card/complete',
  
  // Main Application
  HOME: '/home',
  CHAT: '/chat',
  MORE: '/more',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  
  // Chat Conversations
  CHAT_UNBREAKABLE_CUBE: '/chat/unbreakable-cube',
  CHAT_BOY_GROUP: '/chat/boy-group',
  CHAT_GIRL_GROUP: '/chat/girl-group',
  CHAT_INDIVIDUAL: '/chat/user/:userId',
  
  // Additional Features
  UC_BANK: '/uc-bank',
  EVENTS: '/events',
  MARKETPLACE: '/marketplace',
  DOCUMENTS: '/documents',
  
  // User Management
  EDIT_PROFILE: '/profile/edit',
  CHANGE_PASSCODE: '/profile/change-passcode',
  PRIVACY_SETTINGS: '/profile/privacy'
}

export class UCERARouter {
  static updateRoute(route, params = {}) {
    try {
      let finalRoute = route
      
      // Replace parameters in route
      Object.keys(params).forEach(key => {
        finalRoute = finalRoute.replace(`:${key}`, params[key])
      })
      
      window.history.pushState(null, '', finalRoute)
      
      // Update document title based on route
      this.updateTitle(route, params)
      
    } catch (error) {
      console.log('Routing error:', error)
    }
  }
  
  static updateTitle(route, params = {}) {
    const titles = {
      [UCERA_ROUTES.WELCOME]: 'UC ERA - Myanmar Cultural Community',
      [UCERA_ROUTES.LOGIN]: 'UC ERA - Login',
      [UCERA_ROUTES.REGISTER]: 'UC ERA - Join Community',
      [UCERA_ROUTES.REGISTER_NAMES]: 'UC ERA - Your Names',
      [UCERA_ROUTES.REGISTER_DOB]: 'UC ERA - Date of Birth',
      [UCERA_ROUTES.REGISTER_CONTACT]: 'UC ERA - Contact Information',
      [UCERA_ROUTES.REGISTER_VERIFY_EMAIL]: 'UC ERA - Verify Email',
      [UCERA_ROUTES.REGISTER_VERIFY_OTP]: 'UC ERA - Enter OTP Code',
      [UCERA_ROUTES.REGISTER_PASSCODE]: 'UC ERA - Create Passcode',
      [UCERA_ROUTES.REGISTER_CULTURAL]: 'UC ERA - Cultural Information',
      [UCERA_ROUTES.MEMBER_CARD]: 'UC ERA - Member Card',
      [UCERA_ROUTES.HOME]: 'UC ERA - Home',
      [UCERA_ROUTES.CHAT]: 'UC ERA - Messages',
      [UCERA_ROUTES.MORE]: 'UC ERA - More Features',
      [UCERA_ROUTES.SETTINGS]: 'UC ERA - Settings',
      [UCERA_ROUTES.PROFILE]: 'UC ERA - Profile',
      [UCERA_ROUTES.CHAT_UNBREAKABLE_CUBE]: 'UC ERA - Unbreakable Cube',
      [UCERA_ROUTES.CHAT_BOY_GROUP]: 'UC ERA - Boy Group',
      [UCERA_ROUTES.CHAT_GIRL_GROUP]: 'UC ERA - Girl Group',
      [UCERA_ROUTES.UC_BANK]: 'UC ERA - UC Bank',
      [UCERA_ROUTES.EVENTS]: 'UC ERA - Events',
      [UCERA_ROUTES.MARKETPLACE]: 'UC ERA - Marketplace',
      [UCERA_ROUTES.DOCUMENTS]: 'UC ERA - Documents'
    }
    
    document.title = titles[route] || 'UC ERA - Myanmar Cultural Community'
  }
  
  static getCurrentRoute() {
    return window.location.pathname
  }
  
  static goTo(route, params = {}) {
    this.updateRoute(route, params)
  }
  
  static goBack() {
    window.history.back()
  }
  
  static handleBrowserNavigation(callback) {
    window.addEventListener('popstate', () => {
      const currentRoute = this.getCurrentRoute()
      callback(currentRoute)
    })
  }
}

// Navigation helpers for UC ERA
export const navigate = {
  toWelcome: () => UCERARouter.goTo(UCERA_ROUTES.WELCOME),
  toLogin: () => UCERARouter.goTo(UCERA_ROUTES.LOGIN),
  toRegister: (step = null) => {
    if (step) {
      const stepRoutes = {
        'names': UCERA_ROUTES.REGISTER_NAMES,
        'dateOfBirth': UCERA_ROUTES.REGISTER_DOB,
        'contact': UCERA_ROUTES.REGISTER_CONTACT,
        'emailVerification': UCERA_ROUTES.REGISTER_VERIFY_EMAIL,
        'otpVerification': UCERA_ROUTES.REGISTER_VERIFY_OTP,
        'passcode': UCERA_ROUTES.REGISTER_PASSCODE,
        'cultural': UCERA_ROUTES.REGISTER_CULTURAL
      }
      UCERARouter.goTo(stepRoutes[step] || UCERA_ROUTES.REGISTER)
    } else {
      UCERARouter.goTo(UCERA_ROUTES.REGISTER)
    }
  },
  toMemberCard: () => UCERARouter.goTo(UCERA_ROUTES.MEMBER_CARD),
  toHome: () => UCERARouter.goTo(UCERA_ROUTES.HOME),
  toChat: (chatId = null) => {
    if (chatId === 'uc-main-group') {
      UCERARouter.goTo(UCERA_ROUTES.CHAT_UNBREAKABLE_CUBE)
    } else if (chatId === 'uc-boy-group') {
      UCERARouter.goTo(UCERA_ROUTES.CHAT_BOY_GROUP)
    } else if (chatId === 'uc-girl-group') {
      UCERARouter.goTo(UCERA_ROUTES.CHAT_GIRL_GROUP)
    } else if (chatId) {
      UCERARouter.goTo(UCERA_ROUTES.CHAT_INDIVIDUAL, { userId: chatId })
    } else {
      UCERARouter.goTo(UCERA_ROUTES.CHAT)
    }
  },
  toMore: () => UCERARouter.goTo(UCERA_ROUTES.MORE),
  toSettings: () => UCERARouter.goTo(UCERA_ROUTES.SETTINGS),
  toProfile: () => UCERARouter.goTo(UCERA_ROUTES.PROFILE),
  toUCBank: () => UCERARouter.goTo(UCERA_ROUTES.UC_BANK),
  back: () => UCERARouter.goBack()
}
