import React from 'react'
import styled from 'styled-components'

const BottomNav = ({ value, onChange }) => {
  return (
    <NavWrapper>
      <div id="navbody" role="tablist" aria-label="Bottom navigation">
        <button
          type="button"
          className={`nav-item ${value === 'chat' ? 'active' : ''}`}
          aria-selected={value === 'chat'}
          onClick={() => onChange?.('chat')}
        >
          <img src="/icons/chat.png" alt="Chat" className="icon-img" />
          <span className="label">Chat</span>
        </button>

        <button
          type="button"
          className={`nav-item ${value === 'more' ? 'active' : ''}`}
          aria-selected={value === 'more'}
          onClick={() => onChange?.('more')}
        >
          <img src="/icons/more.png" alt="More" className="icon-img" />
          <span className="label">More</span>
        </button>

        <button
          type="button"
          className={`nav-item ${value === 'settings' ? 'active' : ''}`}
          aria-selected={value === 'settings'}
          onClick={() => onChange?.('settings')}
        >
          <img src="/icons/settings.png" alt="Settings" className="icon-img" />
          <span className="label">Settings</span>
        </button>
      </div>
    </NavWrapper>
  )
}

const NavWrapper = styled.nav`
  width: 100%;
  max-width: 100vw;
  margin: 0 auto;

  #navbody {
    width: 90%;
    max-width: 400px;
    height: 60px;
    background-color: rgba(255, 255, 255, 0.92);
    backdrop-filter: saturate(180%) blur(20px);
    border-radius: 40px;
    box-shadow: 0 10px 20px rgba(2, 6, 23, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-around;
    border: 1px solid rgba(226, 232, 240, 0.8);
    padding: 6px 8px;
    margin: 0 auto;
  }

  .nav-item {
    background: transparent;
    border: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 9999px;
    color: #0f172a;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  .nav-item.active {
    background: #eff6ff;
    color: #2563eb;
  }

  .icon { opacity: 0.95; }
  .label { font-size: 13px; font-weight: 600; }
  .icon-img { width: 22px; height: 22px; object-fit: contain; opacity: .9; }

  @media (max-width: 480px) {
    #navbody { height: 56px; width: 85%; }
    .label { font-size: 12px; }
  }

  /* Match container scaling */
  @media (min-width: 480px) { 
    #navbody { max-width: 450px; }
  }
  @media (min-width: 640px) { 
    #navbody { max-width: 520px; }
  }
  @media (min-width: 768px) { 
    #navbody { max-width: 600px; }
  }
  @media (min-width: 1024px) { 
    #navbody { max-width: 700px; }
  }
  @media (min-width: 1280px) { 
    #navbody { max-width: 800px; }
  }
`

export default BottomNav

