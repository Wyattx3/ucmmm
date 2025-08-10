import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { setupViewportOffsets } from './lib/viewport.js'

// Randomize path to avoid stale caches on direct loads (simple heuristic)
try {
  const randomPath = '/' + Math.random().toString(36).slice(2)
  window.history.replaceState(null, '', randomPath)
} catch {}

// Initialize viewport offsets for mobile browsers so bottom buttons remain visible
try { setupViewportOffsets() } catch {}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
