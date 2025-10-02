import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/mobile-responsive.css'
import './utils/devMode.js'
import App from './App.jsx'
import { setupViewportOffsets } from './lib/viewport.js'

// UC ERA - Clean URL Routing System
try {
  // Clean up random paths and set proper initial route
  const currentPath = window.location.pathname
  
  // If random path or root, redirect to welcome
  if (currentPath === '/' || currentPath.match(/^\/[a-z0-9]+$/) || currentPath.match(/^\/[a-z0-9]{10,}$/)) {
    window.history.replaceState(null, '', '/welcome')
    document.title = 'UC ERA - Myanmar Cultural Community'
  }
} catch {}

// Initialize viewport offsets for mobile browsers so bottom buttons remain visible
try { setupViewportOffsets() } catch {}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
