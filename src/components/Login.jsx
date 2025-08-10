import React, { useMemo, useState } from 'react'
import styled from 'styled-components'
import authService from '../services/auth'
import CubeLoader from './CubeLoader'

const Login = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [decoded, setDecoded] = useState(null) // { userId, memberID, ... }
  const [userDoc, setUserDoc] = useState(null)
  const [passArr, setPassArr] = useState(['', '', '', '', '', ''])
  const [passError, setPassError] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  const todayLabel = useMemo(() => {
    const now = new Date()
    const opt = { weekday: 'short', month: 'short', day: 'numeric' }
    return now.toLocaleDateString(undefined, opt)
  }, [])

  const decodeStegoFromImage = async (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      // Set preview when image is ready (avoid broken icon)
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight

          // Validate expected member card aspect ratio ~ 3:2
          const ratio = img.naturalWidth / img.naturalHeight
          const expected = 576 / 384 // 1.5
          if (Math.abs(ratio - expected) > 0.08) {
            throw new Error('Member Card အရွယ်အစားမမှန်ပါ')
          }

          // Show preview only after basic validation passed
          setPreviewUrl(url)
          ctx.drawImage(img, 0, 0)
          const { data: pixels } = ctx.getImageData(0, 0, canvas.width, canvas.height)

          // Helper to read one LSB bit from red channel and advance pointer
          let pixelPtr = 0 // points at red channel index in RGBA array
          const readBit = () => {
            const bit = pixels[pixelPtr] & 1
            pixelPtr += 4 // move to next pixel (skip G,B,A)
            return bit
          }

          // Read 4 bytes length (big-endian) exactly like the encoder wrote
          const lengthBytes = new Uint8Array(4)
          for (let b = 0; b < 4; b += 1) {
            let value = 0
            for (let k = 0; k < 8; k += 1) {
              value = (value << 1) | readBit()
            }
            lengthBytes[b] = value
          }
          const dataLen =
            (lengthBytes[0] << 24) |
            (lengthBytes[1] << 16) |
            (lengthBytes[2] << 8) |
            lengthBytes[3]

          if (!Number.isFinite(dataLen) || dataLen <= 0 || dataLen > 2_000_000) {
            throw new Error('Hidden data length မမှန်ကန်ပါ')
          }

          // Read payload bytes
          const bytes = new Uint8Array(dataLen)
          for (let i = 0; i < dataLen; i += 1) {
            let value = 0
            for (let k = 0; k < 8; k += 1) {
              value = (value << 1) | readBit()
            }
            bytes[i] = value
          }

          let raw = new TextDecoder().decode(bytes)
          // Fallback: trim to JSON braces if there is any prefix like 'p'
          const first = raw.indexOf('{')
          const last = raw.lastIndexOf('}')
          if (first !== -1 && last !== -1 && last > first) {
            raw = raw.slice(first, last + 1)
          }

          let payload = null
          try {
            payload = JSON.parse(raw)
          } catch (e) {
            throw new Error('Steganography data ကို decode မရခဲ့ပါ')
          }
          resolve(payload)
        } catch (e) {
          reject(e)
        }
      }
      img.onerror = () => {
        reject(new Error('Image ဖိုင် မဖတ်လို့ရပါ'))
      }
      img.src = url
    })
  }

  const handleCardUpload = async (file) => {
    setError('')
    setLoading(true)
    try {
      if (file.type !== 'image/png') {
        throw new Error('PNG Member Card ကိုသာ လက်ခံပါသည်')
      }
      const payload = await decodeStegoFromImage(file)
      setDecoded(payload)

      // Require BOTH email and memberID in DB and they must point to the same user
      const email = String(payload?.email || '').trim().toLowerCase()
      const memberId = String(payload?.memberId || payload?.memberID || '').trim()

      if (!email || !memberId) {
        throw new Error('Member Card တွင်လိုအပ်သော data မရှိပါ')
      }

      // 1) Lookup by email
      const emailRes = await authService.getUserByEmail(email)
      const userByEmail = emailRes.data

      // 2) Lookup by memberID
      let userById = null
      try {
        const idRes = await authService.getUserByMemberID(memberId)
        userById = idRes.data
      } catch (e) {
        // Member ID not found
        throw new Error('Member card အဟောင်း ဖြစ်နိုင်ပါသည် (Member ID DB တွင်မတွေ့)')
      }

      // 3) Cross-validate: must be the same user
      if (!userByEmail || !userById || userByEmail.$id !== userById.$id) {
        throw new Error('Member card အဟောင်း (Email/Member ID မကိုက်ညီ)')
      }

      setUserDoc(userByEmail)
    } catch (err) {
      const msg = String(err?.message || '')
      if (msg.includes('အဟောင်း')) {
        setError('Member card အဟောင်း ဖြစ်နိုင်ပါသည်')
      } else if (msg.includes('အရွယ်အစားမမှန်')) {
        setError('Member Card ကိုသာ လက်ခံပါသည်')
      } else if (msg.includes('PNG Member Card')) {
        setError('Member Card ကိုသာ လက်ခံပါသည်')
      } else if (msg.includes('Image')) {
        setError('ဓာတ်ပုံ ဖိုင်ကို ဖတ်မရပါ — PNG ကိုကြိုးစားပါ')
      } else {
        setError('Member Cardတွင် Userမရှိပါ')
      }
      setDecoded(null)
      setUserDoc(null)
      setPreviewUrl(null)
    } finally {
      setLoading(false)
    }
  }

  const tryVerify = async (code) => {
    if (!userDoc) return
    setLoading(true)
    setError('')
    try {
      await authService.verifyExistingUserPasscode(userDoc.$id, code)
      onSuccess?.({
        $id: userDoc.$id,
        memberID: userDoc.memberID,
        firstName: userDoc.fullName || userDoc.firstName,
        publicPhoto: userDoc.publicPhoto || null
      })
    } catch (err) {
      setPassError(true)
      setTimeout(()=>setPassError(false), 600)
      setError(err.message || 'Passcode မမှန်ကန်ပါ')
      setPassArr(['', '', '', '', '', ''])
    } finally {
      setLoading(false)
    }
  }

  const handleDigit = async (d) => {
    const next = [...passArr]
    const idx = next.findIndex(x => x === '')
    if (idx === -1) return
    next[idx] = d
    setPassArr(next)
    const code = next.join('')
    if (code.length === 6) {
      await tryVerify(code)
    }
  }

  const handleBackspace = () => {
    const next = [...passArr]
    let idx = next.length - 1
    while (idx >= 0 && next[idx] === '') idx--
    if (idx >= 0) next[idx] = ''
    setPassArr(next)
  }

  return (
    <Screen>
      <Header>
        <img src="/ucera-logo.png" alt="UC ERA" />
        <h1>UC ERA Login</h1>
        <p className="sub">Today • {todayLabel}</p>
      </Header>

      <Content>
        {!decoded && (
          <section>
            <label className="label">Member Card</label>
            <Dropzone htmlFor="member-card">
              {previewUrl ? (
                <img src={previewUrl} alt="preview" onError={(e)=>{ e.currentTarget.style.display='none' }} />
              ) : (
                <span>Put your UC ERA Member Card</span>
              )}
            </Dropzone>
            <input id="member-card" type="file" accept="image/png,image/*" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCardUpload(f) }} />
            {error && <ErrorMsg>{error}</ErrorMsg>}
          </section>
        )}

        {decoded && userDoc && (
          <section>
            <Summary>
              <div className="row"><span>Member</span><b>{userDoc.fullName || userDoc.firstName}</b></div>
              <div className="row"><span>Member ID</span><b>{userDoc.memberID}</b></div>
            </Summary>
            <label className="label">Passcode</label>
            <div className={`passcode-dots ${passError ? 'error shake' : ''}`}>
              {passArr.map((d, i) => (
                <div key={i} className={`passcode-circle ${d ? 'filled' : ''} ${passError ? 'error' : ''}`}></div>
              ))}
            </div>
            <div className="number-pad">
              <div className="number-row">
                {[1,2,3].map(n => (
                  <button key={n} type="button" className="number-button" onClick={()=>handleDigit(String(n))}>{n}</button>
                ))}
              </div>
              <div className="number-row">
                {[4,5,6].map(n => (
                  <button key={n} type="button" className="number-button" onClick={()=>handleDigit(String(n))}>{n}</button>
                ))}
              </div>
              <div className="number-row">
                {[7,8,9].map(n => (
                  <button key={n} type="button" className="number-button" onClick={()=>handleDigit(String(n))}>{n}</button>
                ))}
              </div>
              <div className="number-row">
                <button type="button" className="number-button invisible" aria-hidden="true">•</button>
                <button type="button" className="number-button" onClick={()=>handleDigit('0')}>0</button>
                <button type="button" className="number-button backspace" onClick={handleBackspace}>⌫</button>
              </div>
            </div>
            {error && <ErrorMsg>{error}</ErrorMsg>}
          </section>
        )}
      </Content>
      {loading && (
        <LoaderOverlay>
          <CubeLoader message="စစ်ဆေးနေပါသည်..." />
        </LoaderOverlay>
      )}
    </Screen>
  )
}

export default Login

const Screen = styled.div`
  /* Use mobile-safe viewport height to avoid hidden login button */
  min-height: 100vh;
  min-height: 100svh;
  min-height: 100dvh;
  background: radial-gradient(1200px 600px at 50% -10%, #dbeafe 0%, transparent 55%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  padding-bottom: calc(32px + env(safe-area-inset-bottom) + var(--bottom-ui-offset, 0px));
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const Header = styled.header`
  padding: 24px 16px 8px 16px; text-align: center;
  img { height: clamp(80px, 18vw, 140px); opacity: .95; }
  h1 { margin: 8px 0 4px 0; font-size: 20px; color: #0f172a; }
  .sub { margin: 0; color: #94a3b8; font-size: 12px; }
  @media (min-width: 480px) { h1 { font-size: 22px; } }
`

const Content = styled.main`
  width: 100%; max-width: 720px; margin: 0 auto; padding: 12px 16px 24px 16px; display: grid; gap: 14px;
  .label { font-size: 12px; color: #64748b; display: block; margin-bottom: 8px; }
`
const Field = styled.div`
  display: grid; gap: 6px; margin-bottom: 12px;
  label { font-size: 12px; color: #64748b; }
  input { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; outline: none; }
`

const Dropzone = styled.label`
  display: grid; place-items: center; width: 100%; aspect-ratio: 3 / 2; border: 1px dashed #94a3b8; border-radius: 14px; background: #f8fafc; color: #64748b; cursor: pointer; padding: 6px;
  img { width: 100%; height: 100%; object-fit: contain; border-radius: 10px; }
`
const ErrorMsg = styled.div`
  color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 8px 10px; margin-top: 12px; margin-bottom: 10px;
`
const Button = styled.button`
  width: 100%; background: #2563eb; color: white; border: none; border-radius: 10px; padding: 12px; cursor: pointer; font-weight: 700;
  &:disabled { opacity: .7; cursor: default; }
`

const Summary = styled.div`
  border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 12px; margin-bottom: 10px; background: #f8fafc;
  .row { display: flex; justify-content: space-between; gap: 8px; margin: 4px 0; }
  .row span { color: #64748b; }
`

const Hint = styled.div`
  text-align: center; color: #94a3b8; font-size: 12px;
`

const PasscodeDots = styled.div`
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin: 12px 0;
  .dot { width: 16px; height: 16px; border-radius: 9999px; border: 2px solid #94a3b8; margin: 0 auto; background: transparent; transition: .15s ease; }
  .dot.filled { background: #2563eb; border-color: #2563eb; }
  &.error .dot { border-color: #dc2626; }
`

const Keypad = styled.div`
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-width: 360px; margin: 0 auto 8px auto;
  .key { height: 52px; border-radius: 9999px; border: 1px solid #e2e8f0; background: #fff; font-size: 18px; cursor: pointer; }
  .key.ok { background: #2563eb; color: #fff; border-color: #2563eb; }
  .key.back { background: #f1f5f9; }
`

const LoaderOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
`

