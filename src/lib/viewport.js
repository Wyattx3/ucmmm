// Lightweight viewport helper to keep bottom buttons visible on mobile browsers
// Computes the visual viewport overlap (e.g., iOS Safari bottom toolbar)
// and exposes it as a CSS variable --bottom-ui-offset.

export function setupViewportOffsets() {
  if (typeof window === 'undefined') return

  const root = document.documentElement

  const update = () => {
    try {
      const vv = window.visualViewport
      let offsetPx = 0
      if (vv) {
        // Amount of screen obscured at the bottom by browser UI/IME
        const obscured = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
        // Clamp to a sane range (avoid huge values from virtual keyboard scenarios here)
        offsetPx = Math.min(120, Math.max(0, Math.round(obscured)))
      }
      root.style.setProperty('--bottom-ui-offset', offsetPx > 1 ? `${offsetPx}px` : '0px')
      if (window.visualViewport) {
        root.style.setProperty('--vvh', `${Math.round(window.visualViewport.height)}px`)
      }
    } catch {}
  }

  update()
  window.visualViewport?.addEventListener('resize', update, { passive: true })
  window.visualViewport?.addEventListener('scroll', update, { passive: true })
  window.addEventListener('orientationchange', update, { passive: true })
  window.addEventListener('resize', update, { passive: true })
}

