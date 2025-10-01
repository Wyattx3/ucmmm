// Development mode utilities for UC ERA

export const DEV_MODE = import.meta.env.DEV || import.meta.env.MODE === 'development'

// Suppress console errors in development
if (DEV_MODE) {
  const originalError = console.error
  console.error = (...args) => {
    // Filter out Appwrite network errors in development
    const message = args[0]?.toString?.() || ''
    if (
      message.includes('402') ||
      message.includes('Access-Control-Allow-Origin') ||
      message.includes('WebSocket') ||
      message.includes('Load failed')
    ) {
      // Suppress these errors in development
      return
    }
    originalError.apply(console, args)
  }
}

// Mock successful database operations
export const mockDatabaseOperation = (operation) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        $id: `mock_${Date.now()}`,
        ...operation
      })
    }, 500)
  })
}

// Simulate network delay
export const delay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms))
