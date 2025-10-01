// UC ERA - Clean URL Routing System

export class UCERARouter {
  static updateURL(tab, chatId = null) {
    try {
      if (chatId) {
        // Clean chat URLs
        const cleanChatId = chatId.replace(/[^a-zA-Z0-9-]/g, '-')
        window.history.pushState(null, '', `/chat/${cleanChatId}`)
        document.title = `UC ERA - ${chatId.includes('group') ? 'Group Chat' : 'Chat'}`
      } else {
        // Clean tab URLs
        switch(tab) {
          case 'chat':
            window.history.pushState(null, '', '/chat')
            document.title = 'UC ERA - Messages'
            break
          case 'more':
            window.history.pushState(null, '', '/more')
            document.title = 'UC ERA - More Features'
            break
          case 'settings':
            window.history.pushState(null, '', '/settings')
            document.title = 'UC ERA - Settings'
            break
          default:
            window.history.pushState(null, '', '/chat')
            document.title = 'UC ERA - Myanmar Cultural Chat'
        }
      }
    } catch (error) {
      console.log('Routing error:', error)
    }
  }

  static getCurrentRoute() {
    const path = window.location.pathname
    if (path.startsWith('/chat/')) {
      return { tab: 'chat', chatId: path.split('/chat/')[1] }
    } else if (path === '/more') {
      return { tab: 'more' }
    } else if (path === '/settings') {
      return { tab: 'settings' }
    } else {
      return { tab: 'chat' }
    }
  }

  static handleBackButton(callback) {
    window.addEventListener('popstate', () => {
      const route = this.getCurrentRoute()
      callback(route)
    })
  }
}

// Clean URL patterns for UC ERA
export const URL_PATTERNS = {
  CHAT: '/chat',
  CHAT_CONVERSATION: '/chat/:chatId',
  MORE: '/more',
  SETTINGS: '/settings',
  HOME: '/chat' // Default
}
