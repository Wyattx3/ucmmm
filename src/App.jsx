import { useState, useEffect, useRef } from 'react'
import './App.css'
import { useRegistration } from './hooks/useRegistration'
import CubeLoader from './components/CubeLoader'
import MemberCard from './components/MemberCard'
import EyeLoader from './components/EyeLoader'
import Home from './components/Home'
import authService from './services/auth.js'
import { databases, DATABASE_ID, COLLECTIONS, Query } from './lib/appwrite.js'
import Login from './components/Login.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
function App() {
  // COMPLETELY CLEAN START - No session validation, no database calls on init
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [currentScreen, setCurrentScreen] = useState('welcome')
  
  // Restore session on mount
  useEffect(() => {
    const savedUser = authService.loadSessionUser()
    if (savedUser) {
      console.log('✅ Session restored:', savedUser.full_name || savedUser.first_name)
      setLoggedInUser(savedUser)
      setCurrentScreen('home')
    } else {
      console.log('ℹ️ No saved session found')
    }
  }, [])
  // Force network for auth-sensitive requests (disable HTTP cache)
  useEffect(() => {
    try {
      // Vite/Fetch generally bypasses cache for Appwrite SDK, but enforce no-store via header fallback
      const origFetch = window.fetch
      window.fetch = (input, init = {}) => {
        const url = typeof input === 'string' ? input : input?.url
        if (url && url.includes('/databases/') && url.includes('/documents')) {
          init = { ...init, cache: 'no-store', headers: { ...(init.headers || {}), 'Cache-Control': 'no-store' } }
        }
        return origFetch(input, init)
      }
    } catch {}
  }, [])
  // Use registration hook for real API calls
  const {
    isLoading,
    error: apiError,
    currentUserId,
    registerNames,
    registerDateOfBirth,
    registerContact,
    sendOTPVerification,
    verifyOTP,
    setupPasscode,
    registerCitizenship,
    registerCity,
    setError: setApiError,
    completeMemberCard,
    checkDuplicateContact
  } = useRegistration()
  const [selectedCountry, setSelectedCountry] = useState({
    code: '+95',
    flag: '🇲🇲',
    name: 'Myanmar',
    format: 'xxx xxx xxxx'
  })
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [passcode, setPasscode] = useState(['', '', '', '', '', ''])
  const [confirmPasscode, setConfirmPasscode] = useState(['', '', '', '', '', ''])
  const [selectedCitizenships, setSelectedCitizenships] = useState([])
  const [selectedCity, setSelectedCity] = useState('')
  const [dateError, setDateError] = useState('')
  const [notification, setNotification] = useState({ show: false, message: '', type: '' })
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendCount, setResendCount] = useState(0)
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phoneNumber: '',
    relationshipStatus: '', // Added relationshipStatus
    favoriteFood: [], // Changed to array for multiple selection
    favoriteArtist: [], // Changed to array for multiple selection
    privatePhoto: null, // Private photo for personal verification
    publicPhoto: null // Public photo for member card display (2:3 ratio)
  })
  const [screenLoading, setScreenLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  // Auto-logout if session user no longer exists in DB + Refresh user data
  useEffect(() => {
    let cancelled = false
    const validateSessionUser = async () => {
      const sessionUser = authService.loadSessionUser()
      if (!sessionUser?.$id) return
      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.USERS,
          [Query.equal('$id', sessionUser.$id), Query.limit(1), Query.offset(0)]
        )
        if (!cancelled && !res.documents?.length) {
          await authService.hardLogout()
          setLoggedInUser(null)
          setCurrentScreen('welcome')
          setNotification({ show: true, type: 'info', message: 'Your session expired. Please log in again.' })
        } else if (!cancelled && res.documents?.length > 0) {
          // ✅ Refresh user data with latest from database (including date_of_birth!)
          const freshUserData = res.documents[0]
          authService.saveSessionUser(freshUserData)
          setLoggedInUser(freshUserData)
          console.log('🔄 User data refreshed from database')
        }
      } catch (e) {
      }
    }
    validateSessionUser()
    return () => { cancelled = true }
  }, [currentScreen])
  const [contactButtonClicked, setContactButtonClicked] = useState(false)
  const [passcodeError, setPasscodeError] = useState(false)
  const [editingNames, setEditingNames] = useState(false)
  const [tempFormData, setTempFormData] = useState({})
  const [customFood, setCustomFood] = useState('')
  const [customArtist, setCustomArtist] = useState('')
  const [cropData, setCropData] = useState({ x: 0, y: 0, width: 200, height: 300 })
  const [showCropper, setShowCropper] = useState(false)
  const [originalImage, setOriginalImage] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [imageDisplaySize, setImageDisplaySize] = useState({ width: 0, height: 0 })
  const [memberCardGenerating, setMemberCardGenerating] = useState(false)
  const [generatedMemberCard, setGeneratedMemberCard] = useState(null)
  const passcodeInputRefs = useRef([])
  const canvasRef = useRef(null)
  // Steganography functions
  const embedDataInImage = (imageData, data) => {
    try {
      const dataBytes = new TextEncoder().encode(data);
      const dataLength = dataBytes.length;
      // Convert data length to 32-bit array for embedding
      const lengthBytes = new Uint8Array(4);
      lengthBytes[0] = (dataLength >>> 24) & 0xFF;
      lengthBytes[1] = (dataLength >>> 16) & 0xFF;
      lengthBytes[2] = (dataLength >>> 8) & 0xFF;
      lengthBytes[3] = dataLength & 0xFF;
      // Combine length and data
      const fullData = new Uint8Array(4 + dataLength);
      fullData.set(lengthBytes, 0);
      fullData.set(dataBytes, 4);
      const pixels = imageData.data;
      let dataIndex = 0;
      let bitIndex = 0;
      // Embed data in LSB of red channel
      for (let i = 0; i < pixels.length && dataIndex < fullData.length; i += 4) {
        if (dataIndex < fullData.length) {
          const bit = (fullData[dataIndex] >>> (7 - bitIndex)) & 1;
          // Modify LSB of red channel
          pixels[i] = (pixels[i] & 0xFE) | bit;
          bitIndex++;
          if (bitIndex === 8) {
            bitIndex = 0;
            dataIndex++;
          }
        }
      }
      return imageData;
    } catch (error) {
      throw error;
    }
  };
  // Function to create member card with PNG template using Canvas
  const createMemberCardWithPngTemplate = async (templateData) => {
    try {
      // Create canvas with template dimensions
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = templateData.canvasSize.width
      canvas.height = templateData.canvasSize.height
      // Load the template image
      const templateImg = new Image()
      templateImg.crossOrigin = 'anonymous'
      return new Promise((resolve) => {
        templateImg.onload = async () => {
          // Draw the template background
          ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height)
          // Load and draw user photo if available
          if (templateData.photoUrl) {
            try {
              const userImg = new Image()
              userImg.crossOrigin = 'anonymous'
              await new Promise((photoResolve) => {
                userImg.onload = () => {
                  // Draw user photo with rounded corners
                  const photo = templateData.positions.photo
                  // Save context for rounded rectangle
                  ctx.save()
                  // Create rounded rectangle path for clipping (manual implementation)
                  ctx.beginPath()
                  const r = photo.borderRadius
                  ctx.moveTo(photo.x + r, photo.y)
                  ctx.arcTo(photo.x + photo.width, photo.y, photo.x + photo.width, photo.y + r, r)
                  ctx.arcTo(photo.x + photo.width, photo.y + photo.height, photo.x + photo.width - r, photo.y + photo.height, r)
                  ctx.arcTo(photo.x, photo.y + photo.height, photo.x, photo.y + photo.height - r, r)
                  ctx.arcTo(photo.x, photo.y, photo.x + r, photo.y, r)
                  ctx.closePath()
                  ctx.clip()
                  // Draw user photo to fit the rectangle
                  ctx.drawImage(userImg, photo.x, photo.y, photo.width, photo.height)
                  // Restore context
                  ctx.restore()
                  photoResolve()
                }
                userImg.onerror = () => {
                  // Try to use fallback image or skip photo
                  photoResolve()
                }
                // Check if it's a base64 data URL or needs to be converted
                if (templateData.photoUrl.startsWith('data:')) {
                  userImg.src = templateData.photoUrl
                } else if (templateData.photoUrl.startsWith('http')) {
                  // Try with proxy or CORS settings
                  userImg.src = templateData.photoUrl
                } else {
                  photoResolve()
                }
              })
            } catch (photoError) {
            }
          }
          // Draw member name (use the exact same logic as test)
          const namePos = templateData.positions.name
          ctx.fillStyle = namePos.color
          ctx.font = `${namePos.fontWeight || 'normal'} ${namePos.fontSize}px ${namePos.fontFamily}, Arial, sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          const centerX = namePos.x + (namePos.width / 2)
          ctx.fillText(templateData.userName, centerX, namePos.y)
          // Draw member ID with your exact specifications  
          const idPos = templateData.positions.memberId
          ctx.fillStyle = idPos.color
          ctx.font = `${idPos.fontWeight || 'normal'} ${idPos.fontSize}px ${idPos.fontFamily}, Arial, sans-serif`
          ctx.textAlign = 'left'
          ctx.fillText(templateData.memberId, idPos.x, idPos.y)
          // Add steganography if data is provided
          if (templateData.steganographyData) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const hiddenData = JSON.stringify(templateData.steganographyData);
            // Embed steganography data
            embedDataInImage(imageData, hiddenData);
            // Put modified image data back to canvas
            ctx.putImageData(imageData, 0, 0);
          }
          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/png', 0.9)
          resolve(dataUrl)
        }
        templateImg.onerror = () => {
          resolve(null)
        }
        // Load template from local templates folder
        templateImg.src = `/templates/${templateData.templateFile}`
      })
    } catch (error) {
      return null
    }
  }
  // Function to convert HTML to image using canvas
  const convertHtmlToImage = async (htmlString) => {
    try {
      // Create a temporary div to render the HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlString
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '576px'
      tempDiv.style.height = '384px'
      document.body.appendChild(tempDiv)
      // Wait for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 3000))
      // Use html2canvas to convert to image
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(tempDiv, {
        width: 576,
        height: 384,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false
      })
      // Clean up
      document.body.removeChild(tempDiv)
      // Convert canvas to blob URL
      const dataUrl = canvas.toDataURL('image/png', 0.9)
      return dataUrl
    } catch (error) {
      return null
    }
  }
  // Interactive Crop Effect (MUST be at top level for React Rules of Hooks)
  useEffect(() => {
    // Only run if we're on photoUpload screen and actively dragging/resizing
    if (currentScreen !== 'photoUpload' || (!isDragging && !isResizing)) {
      return
    }
          // console.log('🎯 Setting up move handlers:', { isDragging, isResizing })
    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      if (isDragging) {
        const newX = clientX - dragStart.x
        const newY = clientY - dragStart.y
        // Constrain to image bounds
        const maxX = imageDisplaySize.width - cropData.width
        const maxY = imageDisplaySize.height - cropData.height
        const constrainedX = Math.max(0, Math.min(newX, maxX))
        const constrainedY = Math.max(0, Math.min(newY, maxY))
        setCropData(prev => ({
          ...prev,
          x: constrainedX,
          y: constrainedY
        }))
      }
      if (isResizing) {
        // console.log('🔍 Resizing...', { clientX, clientY, resizeStart, corner: isResizing })
        const deltaX = clientX - resizeStart.mouseX
        const deltaY = clientY - resizeStart.mouseY
        let newWidth = resizeStart.width
        let newHeight = resizeStart.height
        let newX = cropData.x
        let newY = cropData.y
        // console.log('📏 Deltas:', { deltaX, deltaY })
        // Calculate new dimensions while maintaining 2:3 ratio
        if (isResizing.includes('right')) {
          newWidth = resizeStart.width + deltaX
        } else if (isResizing.includes('left')) {
          newWidth = resizeStart.width - deltaX
          newX = resizeStart.x - deltaX // Use resizeStart position reference
        }
        if (isResizing.includes('bottom')) {
          // For bottom edges, use deltaY to determine width change (maintain ratio)
          const heightChange = deltaY
          const widthChange = heightChange * (2/3) // width = height * ratio
          newWidth = resizeStart.width + widthChange
        } else if (isResizing.includes('top')) {
          // For top edges, use deltaY to determine width change (maintain ratio)
          const heightChange = -deltaY // Negative because top moves opposite to mouse
          const widthChange = heightChange * (2/3)
          newWidth = resizeStart.width + widthChange
          // Don't adjust Y here, do it after width/height calculation
        }
        // Maintain 2:3 ratio (width:height = 2:3)
        newHeight = newWidth / (2/3)
        // Adjust position for top edges after calculating new dimensions
        if (isResizing.includes('top')) {
          newY = resizeStart.y - (newHeight - resizeStart.height)
        }
        if (isResizing.includes('left')) {
          newX = resizeStart.x - (newWidth - resizeStart.width)
        }
        // console.log('📐 Before constraints:', { newWidth, newHeight, newX, newY })
        // Constrain to image bounds
        const minSize = 50
        const maxWidth = imageDisplaySize.width
        const maxHeight = imageDisplaySize.height
        // Apply size constraints
        newWidth = Math.max(minSize, Math.min(newWidth, maxWidth))
        newHeight = newWidth / (2/3)
        // Ensure height doesn't exceed image bounds
        if (newHeight > maxHeight) {
          newHeight = maxHeight
          newWidth = newHeight * (2/3)
        }
        // Adjust position if size changed due to constraints
        newX = Math.max(0, Math.min(newX, imageDisplaySize.width - newWidth))
        newY = Math.max(0, Math.min(newY, imageDisplaySize.height - newHeight))
        // console.log('✅ Final dimensions:', { newWidth, newHeight, newX, newY })
        setCropData({
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight
        })
      }
    }
    const handleEnd = () => {
              // console.log('🏁 Drag/resize ended')
      setIsDragging(false)
      setIsResizing(false)
    }
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleEnd)
    document.addEventListener('touchmove', handleMove)
    document.addEventListener('touchend', handleEnd)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('touchend', handleEnd)
    }
  }, [currentScreen, isDragging, isResizing, dragStart, resizeStart, cropData, imageDisplaySize])
  // Interactive Crop Handlers (Moved to top level for proper scope)
  const handleCropMouseDown = (e) => {
    if (e.target.classList.contains('crop-resize-handle')) {
      return
    }
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - cropData.x,
      y: e.clientY - cropData.y
    })
  }
  const handleCropTouchStart = (e) => {
    if (e.target.classList.contains('crop-resize-handle')) return
    e.preventDefault()
    setIsDragging(true)
    const touch = e.touches[0]
    setDragStart({
      x: touch.clientX - cropData.x,
      y: touch.clientY - cropData.y
    })
  }
  const handleResizeStart = (e, corner) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(corner)
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    setResizeStart({
      x: cropData.x, // Use crop position, not mouse position
      y: cropData.y, // Use crop position, not mouse position
      mouseX: clientX, // Store mouse position separately
      mouseY: clientY, // Store mouse position separately
      width: cropData.width,
      height: cropData.height
    })
  }
  const handleCropComplete = () => {
    if (!originalImage) return
    // Create a temporary canvas for cropping
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      // Set canvas size to 2:3 ratio (fixed dimensions)
      const outputWidth = 200
      const outputHeight = 300
      canvas.width = outputWidth
      canvas.height = outputHeight
      // Get the image element for actual display dimensions
      const displayImg = document.querySelector('.crop-image')
      if (!displayImg) return
      // Calculate scale factors between display and natural image
      const scaleX = img.naturalWidth / displayImg.offsetWidth
      const scaleY = img.naturalHeight / displayImg.offsetHeight
      // Apply scaling to crop coordinates
      const sourceX = cropData.x * scaleX
      const sourceY = cropData.y * scaleY
      const sourceWidth = cropData.width * scaleX
      const sourceHeight = cropData.height * scaleY
      // Draw the cropped image
      ctx.drawImage(
        img,
        sourceX,      // Source X
        sourceY,      // Source Y  
        sourceWidth,  // Source Width
        sourceHeight, // Source Height
        0,            // Destination X
        0,            // Destination Y
        outputWidth,  // Destination Width
        outputHeight  // Destination Height
      )
      const croppedImage = canvas.toDataURL('image/jpeg', 0.9)
      setFormData({...formData, publicPhoto: croppedImage})
      setShowCropper(false)
      setOriginalImage(null)
      setCropData({ x: 0, y: 0, width: 200, height: 300 }) // Reset crop data
      // Reset interaction states
      setIsDragging(false)
      setIsResizing(false)
      setImageDisplaySize({ width: 0, height: 0 })
    }
    img.src = originalImage
  }
  const countries = [
    { code: '+95', flag: '🇲🇲', name: 'Myanmar', format: 'xxx xxx xxxx' },
    { code: '+66', flag: '🇹🇭', name: 'Thailand', format: 'xx xxx xxxx' },
    { code: '+1', flag: '🇺🇸', name: 'United States', format: '(xxx) xxx-xxxx' },
    { code: '+44', flag: '🇬🇧', name: 'United Kingdom', format: 'xxxx xxx xxxx' },
    { code: '+65', flag: '🇸🇬', name: 'Singapore', format: 'xxxx xxxx' },
    { code: '+60', flag: '🇲🇾', name: 'Malaysia', format: 'xx-xxx xxxx' },
    { code: '+62', flag: '🇮🇩', name: 'Indonesia', format: 'xxx-xxxx-xxxx' },
    { code: '+84', flag: '🇻🇳', name: 'Vietnam', format: 'xxx xxx xxxx' },
    { code: '+91', flag: '🇮🇳', name: 'India', format: 'xxxxx xxxxx' },
    { code: '+86', flag: '🇨🇳', name: 'China', format: 'xxx xxxx xxxx' }
  ]
  const myanmarEthnicGroups = [
    { name: 'Bamar (ဗမာ)', flag: '🇲🇲' },
    { name: 'Shan (ရှမ်း)', flag: '🇲🇲' },
    { name: 'Karen (ကရင်)', flag: '🇲🇲' },
    { name: 'Rakhine (ရခိုင်)', flag: '🇲🇲' },
    { name: 'Mon (မွန်)', flag: '🇲🇲' },
    { name: 'Chin (ချင်း)', flag: '🇲🇲' },
    { name: 'Kachin (ကချင်)', flag: '🇲🇲' },
    { name: 'Kayah (ကယား)', flag: '🇲🇲' },
    { name: 'Wa (ဝ)', flag: '🇲🇲' },
    { name: 'Palaung (ပလောင်)', flag: '🇲🇲' },
    { name: 'Lahu (လဟူ)', flag: '🇲🇲' },
    { name: 'Lisu (လီဆူ)', flag: '🇲🇲' },
    { name: 'Akha (အခါ)', flag: '🇲🇲' },
    { name: 'Naga (နာဂါ)', flag: '🇲🇲' },
    { name: 'Danu (ဒဂုံ)', flag: '🇲🇲' },
    { name: 'Other Myanmar Ethnic Group', flag: '🇲🇲' }
  ]
  const myanmarCities = [
    'Yangon (ရန်ကုန်)',
    'Mandalay (မန္တလေး)',
    'Naypyidaw (နေပြည်တော်)',
    'Bagan (ပုဂံ)',
    'Mawlamyine (မော်လမြိုင်)',
    'Taunggyi (တောင်ကြီး)',
    'Meiktila (မိတ္ထီလာ)',
    'Myitkyina (မြစ်ကြီးနား)',
    'Pathein (ပုသိမ်)',
    'Monywa (မုံရွာ)',
    'Sittwe (စစ်တွေ)',
    'Lashio (လားရှိုး)',
    'Pyay (ပြည်)',
    'Hpa-An (ဘားအံ)',
    'Loikaw (လွိုင်ကေါ်)',
    'Other City'
  ]
  const myanmarFoods = [
    'မုန့်ဟင်းခါး', 'အုန်းနို့ခေါက်ဆွဲ', 'အကြော်စုံ', 'ထမင်းသုပ်', 'ငါးဖယ်လုံးမုန့်ဟင်းခါး',
    'ရှမ်းခေါက်ဆွဲ', 'နန်းကြီးသုပ်', 'မုန့်တီ', 'တို့ဟူးနွေး', 'မုံဖယ်', 'ခေါက်ဆွဲ', 'အုန်းထမင်း',
    'ဆီထမင်း', 'ဂျုံမုန့်လုံးကြော်', 'မုန့်လုံးရေပေါ်', 'ဆန်ပြုတ်', 'လက်ဖက်သုပ်', 'အသားကြီးသုပ်',
    'ကြက်ဥသုပ်', 'ခရမ်းချဉ်သီးသုပ်', 'ပဲကြီးသုပ်', 'ပဲပြုတ်သုပ်', 'ခေါက်ဆွဲသုပ်', 'မြှီးရှည်',
    'ငါးဖယ်သုပ်', 'မြိတ်ကတ်ကြေးကိုက်', 'မုန့်လက်ဆောင်း', 'ကြာဇံသုပ်', 'ရှမ်းတို့ဟူးသုပ်',
    'ကြက်သားဟင်း', 'ဝက်သားဟင်း', 'အမဲသားဟင်း', 'ငါးဆီပြန်ဟင်း', 'ပုစွန်ဆီပြန်ဟင်း',
    'ချဉ်စပ်ဟင်း', 'ပဲဟင်း', 'ဟင်းချို', 'ဆိတ်သားဟင်း', 'ငါးပေါင်း', 'ဟင်းနုနွယ်ဟင်း',
    'ပဲကုလားဟင်း', 'ဂျူးမြစ်ဟင်း', 'ရွှေရင်အေး', 'ဆနွင်းမကင်း', 'ဘိန်းမုန့်', 'မုန့်ပြားသလပ်',
    'သရက်သီးထမင်းချို', 'ထန်းလျက်', 'မုန့်ဖတ်ဆီ', 'ဒိန်ခဲ', 'ကောက်ညှင်းပေါင်း', 'ပဲဆုပ်',
    'ပဲကြော်', 'ဘူးသီးကြော်', 'ဖရုံသီးကြော်', 'အာလူးချောင်းကြော်', 'ငါးခြောက်ကြော်',
    'ပုစွန်ခြောက်ကြော်', 'ငါးပိရည်', 'ငါးပိထောင်း', 'တို့စရာမျိုးစုံ', 'ချဉ်ပေါင်ကြော်',
    'ကန်စွန်းရွက်ကြော်', 'မုန်လာဥချဉ်', 'သရက်သီးချဉ်', 'ဇီးသီးချဉ်', 'မန်ကျည်းသီးချဉ်',
    'ပဲလှော်', 'ကန်စွန်းဥပြုတ်', 'ပြောင်းဖူးပြုတ်', 'မြေပဲပြုတ်', 'ပြောင်းဖူးကင်',
    'အသားကင်မျိုးစုံ', 'ကြက်ကင်', 'ဝက်ကင်', 'ငါးကင်', 'ထမင်းပေါင်း', 'ခေါက်ဆွဲပေါင်း',
    'ကြက်သွန်ဖြူဆီချက်', 'မြေပဲဆီချက်', 'ငါးခြောက်ထောင်း', 'ငါးပိကြော်', 'ရခိုင်မုန့်တီ',
    'မွန်မုန့်ဟင်းခါး', 'ကရင်ခေါက်ဆွဲ', 'ရှမ်းထမင်းချဉ်', 'တီးတိန်ခေါက်ဆွဲ', 'လက်ခမန်း',
    'ခေါက်ဆွဲကြော်', 'ကြေးအိုး', 'ကြေးအိုးဆီချက်', 'အကြော်စုံသုပ်', 'ထမင်းဆီဆမ်း',
    'အသီးစုံယို', 'ကော်ရည်', 'ခေါပုတ်', 'ငါးပတ်', 'ဝက်သားနှပ်', 'ဆိတ်သားနှပ်', 'Others'
  ]
  const myanmarArtists = [
    'စိုင်းထီးဆိုင်', 'မင်းဦး', 'ခိုင်ထူး', 'ကိုင်ဇာ', 'ထူးအိမ်သင်', 'ဇော်ဝင်းထွဋ်', 'မျိုးကြီး',
    'Raymond', 'R Zarni', 'L ဆိုင်းဇီ', 'စိုးသူ', 'ဖြိုးကြီး', 'R ဂျေ', 'မို့မို့ဇော်ဝင်း',
    'မီမီဝင်းဖေ', 'တင်ဇာမော်', 'ခင်မြတ်မွန်', 'ချမ်းချမ်း', 'နီနီခင်ဇော်', 'ဝိုင်းစုခိုင်သိန်း',
    'အိမ့်ချစ်', 'လွှမ်းပိုင်', 'ကျားပေါက်', 'စောလားထော်ဝါး', 'အောင်လ', 'လေးဖြူ', 'အငဲ',
    'ကော်နီ', 'မာမာအေး', 'ခင်မောင်တိုး', 'စံလင်း', 'ဂျီလတ်', 'ဝိုင်ဝိုင်း', 'ရဲလေး',
    'ဘန်နီဖြိုး', 'G Fatt', 'X-Box', 'နောနော်', 'စိုင်းစိုင်းခမ်းလှိုင်', 'Bobby Soxer', 'နီတာ',
    'အေးမြတ်သူ', 'ငယ်ငယ်', 'သအို', 'ယုန်လေး', 'စန္ဒီမြင့်လွင်', 'စိုးမြတ်သူဇာ (အဆိုတော်ဘက်)',
    'မေခလာ', 'ရတနာဦး', 'အေးချမ်းမေ', 'ကျော်ဆွေ', 'ရာဇာ', 'ထွန်းဝေ', 'မြင့်အောင်',
    'ကောလိပ်ဂျင်နေဝင်း', 'ရဲအောင်', 'ညွန့်ဝင်း', 'ကျော်သူ', 'လွင်မိုး', 'လူမင်း', 'နေတိုး',
    'ပြေတီဦး', 'အောင်ရဲလင်း', 'နေမင်း', 'ဇေရဲထက်', 'ခန့်စည်သူ', 'ဒွေး', 'မင်းမော်ကွန်း',
    'မြင့်မြတ်', 'စိုးမြတ်သူဇာ', 'မို့မို့မြင့်အောင်', 'ခင်သန်းနု', 'ချိုပြုံး', 'ပိုးမီ',
    'မေသန်းနု', 'အိန္ဒြာကျော်ဇင်', 'မိုးဒီ', 'မိုးဟေကို', 'သက်မွန်မြင့်', 'ခင်ဝင့်ဝါ',
    'ရွှေမှုန်ရတီ', 'စိုးပြည့်သဇင်', 'ပိုင်တံခွန်', 'နိုင်းနိုင်း', 'သူရိယ', 'ထွန်းထွန်း',
    'မိုးယံဇွန်', 'မေကဗျာ', 'တင်ဇာဝင်းကျော်', 'ပန်းဖြူ', 'ဝါဝါအောင်', 'ခင်ဇာခြည်ကျော်',
    'မင်းအုပ်စိုး', 'ညီထွဋ်ခေါင်', 'မေသဉ္ဇာဦး', 'Others'
  ]
  // Show notification function
  const showNotification = (message, type = 'error') => {
    setNotification({ show: true, message, type })
  }
  // Backup member card to storage
  const backupMemberCardToStorage = async (userId, memberCardImageUrl) => {
    try {
      // Don't backup if no imageUrl or if it's not a base64 data URL
      if (!memberCardImageUrl || !memberCardImageUrl.startsWith('data:image/')) {
        return null
      }
      const backupResult = await storageService.uploadMemberCard(userId, memberCardImageUrl)
      return backupResult
    } catch (error) {
      // Don't throw error to avoid interrupting the main flow
      // Just log the error - backup is optional
      return null
    }
  }
  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification.show])
  // Show API errors as notifications with user-friendly messages
  useEffect(() => {
    if (apiError) {
      // Parse JSON error messages for EXISTING_USER type
      let userFriendlyMessage = apiError
      try {
        const errorObj = JSON.parse(apiError)
        if (errorObj.type === 'EXISTING_USER') {
          if (errorObj.hasMemberCard) {
            userFriendlyMessage = '🔐 ဒီအီးမေးလ်/ဖုန်းနံပါတ်နဲ့ Member Card ရှိပြီးသား အကောင့်ရှိပါသည်။ Login လုပ်ပါ။'
          } else {
            userFriendlyMessage = '📱 ဒီအီးမေးလ်/ဖုန်းနံပါတ်နဲ့ အကောင့်ရှိပြီးသားပါ။ Passcode ဖြင့် အတည်ပြုပါ။'
          }
        }
      } catch (e) {
        // If not JSON or parsing fails, use original message
        userFriendlyMessage = apiError
      }
      showNotification(userFriendlyMessage, 'error')
      setApiError(null) // Clear the error after showing
    }
  }, [apiError, setApiError])
  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])
  const handleJoinUCEra = () => {
    // Directly go to registration screen with clean URL
    setCurrentScreen('registration')
  }
  const handleLogIn = () => {
    setCurrentScreen('home')
  }
  // Name formatting handler - English only, capitalize first letter of each word
  const handleNameChange = (field, value) => {
    const formattedValue = value
      .replace(/[^\u0000-\u007F\s]/g, '') // Remove non-ASCII characters (Myanmar, Arabic, Chinese, etc.)
      .replace(/[^a-zA-Z\s]/g, '') // Remove non-letters except spaces (numbers, symbols)
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .split(' ')
      .map(word => {
        if (word.length > 0) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        }
        return word
      })
      .join(' ')
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }))
  }
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  // Perfect Date Validation Functions
  const isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
  }
  const getDaysInMonth = (month, year) => {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    if (month === 2 && isLeapYear(year)) {
      return 29
    }
    return daysInMonth[month - 1] || 31
  }
  const validateDate = (day, month, year) => {
    // Current date for validation
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    // Basic range validation
    if (year < 1900 || year > currentYear) {
      return `Year must be between 1900 and ${currentYear}`
    }
    if (month < 1 || month > 12) {
      return 'Month must be between 01 and 12'
    }
    const maxDays = getDaysInMonth(month, year)
    if (day < 1 || day > maxDays) {
      return `Day must be between 01 and ${maxDays} for ${month}/${year}`
    }
    // Check if date is in the future
    const inputDate = new Date(year, month - 1, day)
    if (inputDate > currentDate) {
      return 'Date cannot be in the future'
    }
    return null // No error
  }
  const handleDateChange = (value) => {
    // Clear previous error
    setDateError('')
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '')
    // Format as DD/MM/YYYY with validation
    let formattedValue = ''
    let day = '', month = '', year = ''
    if (numericValue.length > 0) {
      // Day part (max 31)
      day = numericValue.substring(0, 2)
      if (day.length === 2) {
        const dayNum = parseInt(day)
        if (dayNum > 31) {
          day = '31'
        } else if (dayNum < 1 && day !== '0') {
          day = '01'
        }
      }
      formattedValue = day
      if (numericValue.length > 2) {
        // Month part (max 12)
        month = numericValue.substring(2, 4)
        if (month.length === 2) {
          const monthNum = parseInt(month)
          if (monthNum > 12) {
            month = '12'
          } else if (monthNum < 1 && month !== '0') {
            month = '01'
          }
        }
        formattedValue += '/' + month
        if (numericValue.length > 4) {
          // Year part (max current year)
          year = numericValue.substring(4, 8)
          const currentYear = new Date().getFullYear()
          if (year.length === 4) {
            const yearNum = parseInt(year)
            if (yearNum > currentYear) {
              year = currentYear.toString()
            } else if (yearNum < 1900) {
              year = '1900'
            }
          }
          formattedValue += '/' + year
        }
      }
    }
    setFormData(prev => ({
      ...prev,
      dateOfBirth: formattedValue
    }))
    // Validate complete date
    if (day.length === 2 && month.length === 2 && year.length === 4) {
      const dayNum = parseInt(day)
      const monthNum = parseInt(month)
      const yearNum = parseInt(year)
      const error = validateDate(dayNum, monthNum, yearNum)
      if (error) {
        setDateError(error)
      }
    }
  }
  const handleDatePickerChange = (event) => {
    setDateError('')
    const selectedDate = new Date(event.target.value)
    const day = selectedDate.getDate().toString().padStart(2, '0')
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0')
    const year = selectedDate.getFullYear()
    setFormData(prev => ({
      ...prev,
      dateOfBirth: `${day}/${month}/${year}`
    }))
    setShowDatePicker(false)
  }
  // Phone Number Handler with Country Code
  const handlePhoneChange = (value) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '')
    // Format based on selected country
    let formattedValue = ''
    if (numericValue.length > 0) {
      if (selectedCountry.code === '+95') {
        // Myanmar: xxx xxx xxxx
        formattedValue = numericValue.substring(0, 3)
        if (numericValue.length > 3) {
          formattedValue += ' ' + numericValue.substring(3, 6)
          if (numericValue.length > 6) {
            formattedValue += ' ' + numericValue.substring(6, 10)
          }
        }
      } else if (selectedCountry.code === '+1') {
        // US: (xxx) xxx-xxxx
        if (numericValue.length > 0) {
          formattedValue = '(' + numericValue.substring(0, 3)
          if (numericValue.length > 3) {
            formattedValue += ') ' + numericValue.substring(3, 6)
            if (numericValue.length > 6) {
              formattedValue += '-' + numericValue.substring(6, 10)
            }
          } else {
            formattedValue = numericValue
          }
        }
      } else {
        // Default format: xxx xxx xxxx
        formattedValue = numericValue.substring(0, 3)
        if (numericValue.length > 3) {
          formattedValue += ' ' + numericValue.substring(3, 6)
          if (numericValue.length > 6) {
            formattedValue += ' ' + numericValue.substring(6, 10)
          }
        }
      }
    }
    setFormData(prev => ({
      ...prev,
      phoneNumber: formattedValue
    }))
  }
  // Auto-focus first OTP input when verification screen loads
  useEffect(() => {
    if (currentScreen === 'verification') {
      // Small delay to ensure DOM is ready, then focus first input
      setTimeout(() => {
        const firstInput = document.querySelector('#otp-0')
        if (firstInput) {
          firstInput.focus()
        }
      }, 100)
    }
  }, [currentScreen])
  // Verification Code Handler
  const handleVerificationCodeChange = (index, value) => {
    // Only allow single digit
    if (value.length > 1) return
    if (value && !/^\d$/.test(value)) return
    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`#otp-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }
  const handleVerificationKeyDown = (index, event) => {
    // Handle backspace
    if (event.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.querySelector(`#otp-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }
  // Passcode Handlers
  const handlePasscodeChange = (index, value, isConfirm = false) => {
    // Only allow single digit
    if (value.length > 1) return
    if (value && !/^\d$/.test(value)) return
    const targetArray = isConfirm ? confirmPasscode : passcode
    const setTargetArray = isConfirm ? setConfirmPasscode : setPasscode
    const newCode = [...targetArray]
    newCode[index] = value
    setTargetArray(newCode)
    // Auto-focus next input
    if (value && index < 5) {
      const prefix = isConfirm ? 'confirm-passcode' : 'passcode'
      const nextInput = document.querySelector(`#${prefix}-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }
  const handlePasscodeKeyDown = (index, event, isConfirm = false) => {
    // Handle backspace
    const targetArray = isConfirm ? confirmPasscode : passcode
    if (event.key === 'Backspace' && !targetArray[index] && index > 0) {
      const prefix = isConfirm ? 'confirm-passcode' : 'passcode'
      const prevInput = document.querySelector(`#${prefix}-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }
  const handleNumberPadClick = (number, isConfirm = false) => {
    const targetArray = isConfirm ? confirmPasscode : passcode
    const setTargetArray = isConfirm ? setConfirmPasscode : setPasscode
    // Ensure targetArray is an array
    const safeArray = Array.isArray(targetArray) ? targetArray : ['', '', '', '', '', '']
    // Find first empty position
    const emptyIndex = safeArray.findIndex(digit => digit === '')
    if (emptyIndex !== -1) {
      const newCode = [...safeArray]
      newCode[emptyIndex] = number.toString()
      setTargetArray(newCode)
    }
  }
  const handlePasscodeBackspace = (isConfirm = false) => {
    const targetArray = isConfirm ? confirmPasscode : passcode
    const setTargetArray = isConfirm ? setConfirmPasscode : setPasscode
    // Ensure targetArray is an array
    const safeArray = Array.isArray(targetArray) ? targetArray : ['', '', '', '', '', '']
    // Find last filled position
    const lastFilledIndex = safeArray.map((digit, index) => digit !== '' ? index : -1).filter(index => index !== -1).pop()
    if (lastFilledIndex !== undefined) {
      const newCode = [...safeArray]
      newCode[lastFilledIndex] = ''
      setTargetArray(newCode)
    }
  }
  // Citizenship Handlers
  const toggleCitizenship = (citizenship) => {
    setSelectedCitizenships(prev => {
      if (prev.includes(citizenship)) {
        return prev.filter(c => c !== citizenship)
      } else if (prev.length < 3) {
        return [...prev, citizenship]
      } else {
        showNotification('You can select maximum 3 citizenships', 'error')
        return prev
      }
    })
  }
  const resendCode = async () => {
    try {
      // Check if cooldown is active
      if (resendCooldown > 0) {
        showNotification(`Please wait ${resendCooldown} seconds before requesting another code`, 'error')
        return
      }
      // Check resend limit (max 3 times)
      if (resendCount >= 3) {
        showNotification('Maximum resend attempts reached. Please try again later or contact support.', 'error')
        return
      }
      // Clear verification code
      setVerificationCode(['', '', '', '', '', ''])
      // Focus first input after clearing
      setTimeout(() => {
        const firstInput = document.querySelector('#otp-0')
        if (firstInput) {
          firstInput.focus()
        }
      }, 100)
      // Increment resend count
      setResendCount(prev => prev + 1)
      // Set cooldown (60 seconds)
      setResendCooldown(60)
      // Send new OTP using stored userId
      if (formData.userId && formData.email) {
        await authService.sendOTPVerification(formData.userId, formData.email)
        showNotification(`New verification code sent to ${formData.email}`, 'success')
      } else {
        showNotification('Error: User session not found. Please start registration again.', 'error')
      }
    } catch (error) {
      showNotification(error.message || 'Failed to resend verification code', 'error')
    }
  }
  const selectCountry = (country) => {
    setSelectedCountry(country)
    setShowCountryDropdown(false)
    // Clear phone number when country changes
    setFormData(prev => ({
      ...prev,
      phoneNumber: ''
    }))
  }
  const getFullName = () => {
    const { firstName, middleName, lastName } = formData
    let fullName = firstName
    if (middleName.trim()) {
      fullName += ' ' + middleName
    }
    if (lastName.trim()) {
      fullName += ' ' + lastName
    }
    return fullName || 'there'
  }
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  const convertToDateInput = (ddmmyyyy) => {
    if (ddmmyyyy.length === 10) {
      const [day, month, year] = ddmmyyyy.split('/')
      return `${year}-${month}-${day}`
    }
    return ''
  }
  // Screen loading helper
  const showScreenLoading = (message) => {
    setScreenLoading(true)
    setLoadingMessage(message)
  }
  const hideScreenLoading = (immediate = false) => {
    if (immediate) {
      // Immediate hide for OTP sending to prevent delay
      setScreenLoading(false)
      setLoadingMessage('')
    } else {
      // Add small delay to ensure loading animation is visible for other operations
      setTimeout(() => {
        setScreenLoading(false)
        setLoadingMessage('')
      }, 1000) // 1 second minimum display time
    }
  }
  const handleNext = async () => {
    // Prevent double-clicks by checking if already processing
    if (screenLoading) {
      return
    }
    try {
      if (currentScreen === 'registration') {
        if (formData.firstName && formData.lastName) {
          // Skip name registration for now - go to contact first for duplicate check
          setCurrentScreen('dateOfBirth')
        } else {
          showNotification('Please fill in required fields (First name and Last name)', 'error')
        }
      } else if (currentScreen === 'dateOfBirth') {
        if (formData.dateOfBirth && formData.dateOfBirth.length === 10) {
          if (dateError) {
            showNotification(`Please enter a valid date: ${dateError}`, 'error')
            return
          }
          // Just validate and proceed - don't save to DB yet
          setCurrentScreen('contact')
        } else {
          showNotification('Please enter your complete date of birth (DD/MM/YYYY)', 'error')
        }
      } else if (currentScreen === 'contact') {
        // Special protection for contact screen - only allow one click
        if (contactButtonClicked) {
          return
        }
        if (formData.email && formData.phoneNumber) {
          if (!validateEmail(formData.email)) {
            showNotification('Please enter a valid email address', 'error')
            return
          }
          if (formData.phoneNumber.length < 6) {
            showNotification('Please enter a valid phone number', 'error')
            return
          }
          // Mark button as clicked immediately to prevent any duplicate
          setContactButtonClicked(true)
          try {
            showScreenLoading('Contact information ကို စိစစ်နေပါသည်...')
            // First check for duplicates WITHOUT creating/updating user
            await checkDuplicateContact({
              email: formData.email,
              phoneNumber: formData.phoneNumber,
              countryCode: selectedCountry.code
            })
            // If no duplicates, register all data together (names + date + contact)
            showScreenLoading('အမည်နဲ့ အချက်အလက်များ သိမ်းဆည်းနေပါသည်...')
            // Register names first and get userId from result
            const namesResult = await registerNames({
              firstName: formData.firstName,
              middleName: formData.middleName,
              lastName: formData.lastName
            })
            const userId = namesResult.data.userId
            // Store userId in formData for later use (resend, etc.)
            setFormData(prev => ({ ...prev, userId: userId }))
            // Convert DD/MM/YYYY to ISO format for database
            const [day, month, year] = formData.dateOfBirth.split('/')
            const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
            // Register date of birth using direct authService with userId
            await authService.registerDateOfBirth(userId, isoDate)
            // Register contact using direct authService with userId
            await authService.registerContact(userId, {
              email: formData.email,
              phoneNumber: formData.phoneNumber,
              countryCode: selectedCountry.code
            })
            hideScreenLoading()
          // Reset resend stats when entering verification
          setResendCount(0)
          setResendCooldown(0)
          setLoadingMessage('Verification code ပို့နေပါသည်...')
          // Send OTP automatically using direct authService with userId
          await authService.sendOTPVerification(userId, formData.email)
          setCurrentScreen('verification')
          showNotification(`Verification code sent to ${formData.email}`, 'success')
          // Hide loading after notification shows for smooth UX
          setTimeout(() => hideScreenLoading(true), 800)
          } catch (error) {
            hideScreenLoading()
            // Check if it's an existing user error
            try {
              const errorData = JSON.parse(error.message)
              if (errorData.type === 'EXISTING_USER') {
                // Store existing user data
                setFormData({
                  ...formData,
                  existingUserId: errorData.userId,
                  hasMemberCard: errorData.hasMemberCard
                })
                if (errorData.hasMemberCard) {
                  // User has member card - redirect to login
                  showNotification('ဒီအီးမေးလ်/ဖုန်းနံပါတ်ဖြင့် အကောင့်ရှိပြီးပါပြီး။ Login လုပ်ပါ။', 'info')
                  setCurrentScreen('existingUserLogin')
                } else {
                  // User exists but no member card - verify passcode first
                  showNotification('အကောင့်ရှိပြီးပါပြီး။ Member Card မရှိသေးပါ။ Passcode ဖြင့် အတည်ပြုပါ။', 'info')
                  setCurrentScreen('existingUserPasscode')
                }
                return
              }
            } catch (parseError) {
              // Not a JSON error, treat as regular error
            }
            showNotification(error.message || 'Contact information သိမ်းဆည်းရာတွင် အမှားတစ်ခု ဖြစ်ပွားခဲ့သည်', 'error')
            // Reset button click state on error so user can try again
            setContactButtonClicked(false)
          }
        } else {
          showNotification('Please fill in both email and phone number', 'error')
        }
      } else if (currentScreen === 'verification') {
        const code = verificationCode.join('')
        if (code.length === 6) {
          showScreenLoading('OTP ကို စိစစ်နေပါသည်...')
          await authService.verifyOTP(formData.userId, code)
          hideScreenLoading(true) // Immediate hide for smooth transition
          setCurrentScreen('success')
        } else {
          showNotification('Please enter the complete 6-digit verification code', 'error')
        }
      } else if (currentScreen === 'success') {
        setCurrentScreen('passcode')
      } else if (currentScreen === 'passcode') {
        const code = passcode.join('')
        if (code.length === 6) {
          setCurrentScreen('passcodeConfirm')
        } else {
          showNotification('Please create a complete 6-digit passcode', 'error')
        }
      } else if (currentScreen === 'passcodeConfirm') {
        const originalCode = passcode.join('')
        const confirmCode = confirmPasscode.join('')
        if (confirmCode.length === 6) {
          if (originalCode === confirmCode) {
            showScreenLoading('Passcode ကို setup လုပ်နေပါသည်...')
            await authService.setupPasscode(formData.userId, originalCode)
            hideScreenLoading(true) // Immediate hide for smooth transition
            setCurrentScreen('citizenship')
          } else {
            showNotification('Passcodes do not match. Please try again.', 'error')
            setConfirmPasscode(['', '', '', '', '', ''])
          }
        } else {
          showNotification('Please confirm your complete 6-digit passcode', 'error')
        }
      } else if (currentScreen === 'citizenship') {
        if (selectedCitizenships.length > 0) {
          showScreenLoading('Citizenship information ကို save လုပ်နေပါသည်...')
          await authService.registerCitizenship(formData.userId, selectedCitizenships)
          hideScreenLoading(true) // Immediate hide for smooth transition
          setCurrentScreen('city')
        } else {
          showNotification('Please select at least one citizenship', 'error')
        }
      } else if (currentScreen === 'city') {
        if (selectedCity) {
          showScreenLoading('Registration ပြီးဆုံးအောင် လုပ်နေပါသည်...')
          await authService.registerCity(formData.userId, selectedCity)
          hideScreenLoading(true) // Immediate hide for smooth transition
          setCurrentScreen('finalSuccess')
        } else {
          showNotification('Please select your living city', 'error')
        }
      }
    } catch (error) {
      hideScreenLoading()
      showNotification(error.message || 'Something went wrong. Please try again.', 'error')
    }
  }
  const goBack = () => {
    if (currentScreen === 'finalSuccess') {
      setCurrentScreen('city')
    } else if (currentScreen === 'city') {
      setCurrentScreen('citizenship')
    } else if (currentScreen === 'citizenship') {
      setCurrentScreen('passcodeConfirm')
    } else if (currentScreen === 'passcodeConfirm') {
      setCurrentScreen('passcode')
    } else if (currentScreen === 'passcode') {
      setCurrentScreen('success')
    } else if (currentScreen === 'success') {
      setCurrentScreen('verification')
    } else if (currentScreen === 'verification') {
      setCurrentScreen('contact')
    } else if (currentScreen === 'contact') {
      setCurrentScreen('dateOfBirth')
    } else if (currentScreen === 'dateOfBirth') {
      setCurrentScreen('registration')
    } else {
      setCurrentScreen('welcome')
    }
  }
  const closeNotification = () => {
    setNotification({ show: false, message: '', type: '' })
  }
  const getResendButtonText = () => {
    if (resendCooldown > 0) {
      return `Wait ${resendCooldown}s`
    }
    if (resendCount >= 3) {
      return 'Max attempts reached'
    }
    return 'Need another code?'
  }
    // Handle existing user passcode verification
  const handleExistingUserPasscodeVerify = async () => {
    try {
      // Check if all 6 digits are filled
      const passcodeString = passcode.join('')
      if (passcodeString.length !== 6 || passcode.some(digit => digit === '')) {
        // Trigger shake animation for incomplete passcode
        setPasscodeError(true)
        setTimeout(() => {
          setPasscodeError(false)
        }, 600)
        return
      }
      // No loading animation - directly verify passcode
      const result = await authService.verifyExistingUserPasscode(formData.existingUserId, passcodeString)
      // Update formData with original account information from database
      setFormData({
        ...formData,
        firstName: result.user.firstName,
        middleName: result.user.middleName || '',
        lastName: result.user.lastName,
        dateOfBirth: result.user.dateOfBirth,
        userId: formData.existingUserId,
        // Keep the contact info from current attempt for verification
        email: formData.email,
        phone: formData.phone,
        phoneNumber: formData.phoneNumber,
        country: formData.country
      })
      // Go to name confirmation with original user data
      setCurrentScreen('nameConfirmation')
      showNotification('Passcode အတည်ပြုပြီးပါပြီး! နာမည်အတည်ပြုပါ။', 'success')
    } catch (error) {
      // Immediately trigger shake animation and red color
      setPasscodeError(true)
      // Clear passcode and reset error state after animation
      setTimeout(() => {
        setPasscode(['', '', '', '', '', ''])
        setPasscodeError(false)
      }, 600)
    }
  }
  // Calculate zodiac sign from date of birth
  const calculateZodiacFromDOB = (dateOfBirth) => {
    if (!dateOfBirth) return 'Aries';
    
    const date = new Date(dateOfBirth);
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();
    
    if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return 'Aries';
    if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return 'Taurus';
    if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return 'Gemini';
    if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return 'Cancer';
    if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return 'Leo';
    if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return 'Virgo';
    if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return 'Libra';
    if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return 'Scorpio';
    if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return 'Sagittarius';
    if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return 'Capricorn';
    if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return 'Aquarius';
    if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return 'Pisces';
    
    return 'Aries'; // Default
  };
  
  // Render member card on canvas with zodiac template
  const renderMemberCardOnCanvas = async (cardData) => {
    return new Promise((resolve, reject) => {
      try {
        console.log('🎨 Starting canvas rendering with template:', cardData.templateFile);
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = cardData.canvasSize.width;
        canvas.height = cardData.canvasSize.height;
        const ctx = canvas.getContext('2d');
        
        // Enable high-quality rendering for HD member cards
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Load zodiac template image
        const templateImg = new Image();
        templateImg.crossOrigin = 'anonymous';
        
        templateImg.onload = () => {
          console.log('✅ Zodiac template loaded:', cardData.zodiacSign);
          
          // Draw template background
          ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
          
          // Draw user photo if available
          if (cardData.photoUrl) {
            const userPhotoImg = new Image();
            
            userPhotoImg.onload = () => {
              console.log('✅ User photo loaded');
              
              const photoPos = cardData.positions.photo;
              
              // Save context for rounded corners
              ctx.save();
              
              // Create rounded rectangle path for photo
              const drawRoundedRect = (x, y, width, height, radius) => {
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + width - radius, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                ctx.lineTo(x + width, y + height - radius);
                ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                ctx.lineTo(x + radius, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.closePath();
              };
              
              drawRoundedRect(photoPos.x, photoPos.y, photoPos.width, photoPos.height, photoPos.borderRadius);
              ctx.clip();
              
              // Draw user photo
              ctx.drawImage(userPhotoImg, photoPos.x, photoPos.y, photoPos.width, photoPos.height);
              
              // Restore context
              ctx.restore();
              
              // Draw text elements
              drawTextOnCard(ctx, cardData);
              
              // Embed steganography data for login verification
              console.log('🔐 Embedding steganography data...');
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const steganographyData = {
                email: cardData.userEmail,
                memberId: cardData.memberId,
                userId: cardData.userId,
                timestamp: new Date().toISOString(),
                version: "1.0"
              };
              const hiddenData = JSON.stringify(steganographyData);
              embedDataInImage(imageData, hiddenData);
              ctx.putImageData(imageData, 0, 0);
              console.log('✅ Steganography data embedded successfully!');
              
              // Convert to base64 with maximum quality for HD member card
              const imageUrl = canvas.toDataURL('image/png', 1.0);
              setGeneratedMemberCard({
                imageUrl: imageUrl,
                userId: cardData.userId,
                userName: cardData.userName,
                zodiacSign: cardData.zodiacSign,
                memberId: cardData.memberId,
                generatedAt: new Date().toISOString()
              });
              
              console.log('✅ Member card with zodiac template + steganography rendered!');
              resolve();
            };
            
            userPhotoImg.onerror = () => {
              console.warn('⚠️ User photo load failed, continuing without photo');
              drawTextOnCard(ctx, cardData);
              
              // Embed steganography even without photo
              console.log('🔐 Embedding steganography data (no photo)...');
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const steganographyData = {
                email: cardData.userEmail,
                memberId: cardData.memberId,
                userId: cardData.userId,
                timestamp: new Date().toISOString(),
                version: "1.0"
              };
              const hiddenData = JSON.stringify(steganographyData);
              embedDataInImage(imageData, hiddenData);
              ctx.putImageData(imageData, 0, 0);
              console.log('✅ Steganography embedded (no photo)!');
              
              const imageUrl = canvas.toDataURL('image/png', 1.0);
              setGeneratedMemberCard({
                imageUrl: imageUrl,
                userId: cardData.userId,
                userName: cardData.userName,
                zodiacSign: cardData.zodiacSign
              });
              resolve();
            };
            
            // Set photo source (base64 string)
            userPhotoImg.src = cardData.photoUrl;
            
          } else {
            // No photo - just template and text
            drawTextOnCard(ctx, cardData);
            
            // Embed steganography data
            console.log('🔐 Embedding steganography data (no photo URL)...');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const steganographyData = {
              email: cardData.userEmail,
              memberId: cardData.memberId,
              userId: cardData.userId,
              timestamp: new Date().toISOString(),
              version: "1.0"
            };
            const hiddenData = JSON.stringify(steganographyData);
            embedDataInImage(imageData, hiddenData);
            ctx.putImageData(imageData, 0, 0);
            console.log('✅ Steganography embedded!');
            
            const imageUrl = canvas.toDataURL('image/png', 1.0);
            setGeneratedMemberCard({
              imageUrl: imageUrl,
              userId: cardData.userId,
              userName: cardData.userName,
              zodiacSign: cardData.zodiacSign
            });
            resolve();
          }
        };
        
        templateImg.onerror = () => {
          console.error('❌ Template load failed for:', cardData.zodiacSign);
          reject(new Error('Template load failed'));
        };
        
        // Load template from public folder
        templateImg.src = `/templates/${cardData.templateFile}`;
        
      } catch (error) {
        console.error('❌ Canvas rendering error:', error);
        reject(error);
      }
    });
  };
  
  // Helper to draw text elements on member card
  const drawTextOnCard = (ctx, cardData) => {
    // Draw name (center aligned as per original design)
    const namePos = cardData.positions.name;
    ctx.font = `${namePos.fontWeight} ${namePos.fontSize}px ${namePos.fontFamily}`;
    ctx.fillStyle = namePos.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const nameCenterX = namePos.x + (namePos.width / 2);
    ctx.fillText(cardData.userName, nameCenterX, namePos.y);
    
    // Draw member ID (left aligned as per original design)
    const idPos = cardData.positions.memberId;
    ctx.font = `${idPos.fontWeight} ${idPos.fontSize}px ${idPos.fontFamily}`;
    ctx.fillStyle = idPos.color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(cardData.memberId, idPos.x, idPos.y);
    
    console.log('✅ Text elements drawn on card (original positions)');
  };
  
  // Handle member card completion
  const handleCompleteMemberCard = async () => {
    try {
      // Validation checks
      if (!formData.loveLanguage) {
        showNotification('Love Language ရွေးချယ်ပါ', 'error')
        return
      }
      if (!formData.privatePhoto || !formData.publicPhoto) {
        showNotification('ဓာတ်ပုံ နှစ်ပုံလုံး ထည့်ပါ', 'error')
        return
      }
      // Use currentUserId from hook, fallback to formData.userId
      const userId = currentUserId || formData.userId
      if (!userId) {
        showNotification('❌ User ID not found. Please restart registration.', 'error')
        return
      }
      showScreenLoading('Member Card ပြုလုပ်နေပါသည်...')
      const memberCardData = {
        relationshipStatus: formData.relationshipStatus,
        gender: formData.gender,
        favoriteFood: Array.isArray(formData.favoriteFood) ? formData.favoriteFood.join(', ') : formData.favoriteFood,
        favoriteArtist: Array.isArray(formData.favoriteArtist) ? formData.favoriteArtist.join(', ') : formData.favoriteArtist,
        loveLanguage: formData.loveLanguage,
        privatePhoto: formData.privatePhoto,
        publicPhoto: formData.publicPhoto,
        // Include names for database update (especially for existing users who edited names)
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName
      }
      const result = await completeMemberCard(userId, memberCardData)
      hideScreenLoading(true) // Immediate hide for smooth transition
      
      // Generate professional member card with zodiac template
      setMemberCardGenerating(true)
      setCurrentScreen('memberCardSuccess')
      
      try {
        console.log('🎴 Generating professional member card with zodiac template...');
        
        // Calculate zodiac sign from date of birth
        const zodiacSign = calculateZodiacFromDOB(result.data.date_of_birth || formData.dateOfBirth);
        console.log('♌ Zodiac sign:', zodiacSign);
        
        // Prepare member card data
        const memberCardTemplate = {
          templateFile: `${zodiacSign}.png`,
          zodiacSign: zodiacSign,
          userName: result.data.full_name || `${formData.firstName} ${formData.lastName}`,
          memberId: result.data.member_id,
          userEmail: result.data.email,
          photoUrl: formData.publicPhoto, // Use base64 photo
          positions: {
            photo: { x: 39, y: 39, width: 203, height: 305, borderRadius: 15 },
            name: { x: 270, y: 295, width: 284, height: 36, fontSize: 30, fontWeight: 'bold', fontFamily: 'Arial', color: '#000000' },
            memberId: { x: 462, y: 355, width: 70, height: 13, fontSize: 13, fontWeight: 'normal', fontFamily: 'Arial', color: '#000000' }
          },
          canvasSize: { width: 576, height: 384 },
          userId: userId
        };
        
        // Render member card on canvas
        await renderMemberCardOnCanvas(memberCardTemplate);
        console.log('✅ Member card generated successfully with zodiac template!');
        
      } catch (cardError) {
        console.error('❌ Member card generation failed:', cardError);
        // Fallback: Use public photo as preview
        setGeneratedMemberCard({
          imageUrl: formData.publicPhoto,
          userId: userId,
          userName: result.data.full_name,
          fallbackMode: true
        });
      } finally {
        setMemberCardGenerating(false);
      }
    } catch (error) {
      hideScreenLoading()
      setMemberCardGenerating(false)
      // Check if it's a duplicate contact error
      if (error.message && error.message.includes('duplicate')) {
        setCurrentScreen('existingUserLogin')
        return
      }
      let errorMessage = '❌ Member Card ပြုလုပ်ရာတွင် အမှားရှိပါသည်'
      if (error.message.includes('Photo upload')) {
        errorMessage = '📸 ဓာတ်ပုံ upload ပြဿနာရှိပါသည်'
      } else if (error.message.includes('User not found')) {
        errorMessage = '👤 အသုံးပြုသူ မတွေ့ရှိပါ။ ပြန်လည် စတင်ပါ။'
      }
      showNotification(errorMessage, 'error')
    }
  }
  // Existing User Passcode Verification Screen
  if (currentScreen === 'existingUserPasscode') {
    return (
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          {screenLoading && (
            <div className="screen-loading-overlay">
              <CubeLoader message={loadingMessage} />
          </div>
          )}
          <div className="form-header">
            <button className="back-button" onClick={() => setCurrentScreen('contact')}>
              ←
              </button>
            <span className="help-link">Help</span>
          </div>
          <div className="form-content">
            <div className="welcome-logo">
              <div className="logo-text">🔐</div>
            </div>
            <h2 className="form-title">Passcode အတည်ပြုခြင်း</h2>
            <p className="form-subtitle">
              သင်၏ UC ERA အကောင့်၏ passcode ကို ထည့်ပါ
            </p>
            <div className="existing-user-info">
              <p>အီးမေးလ်: <strong>{formData.email}</strong></p>
              <p>ဖုန်းနံပါတ်: <strong>{formData.phoneNumber}</strong></p>
            </div>
            <div className={`passcode-dots ${passcodeError ? 'error shake' : ''}`}>
              {(passcode || ['', '', '', '', '', '']).map((digit, index) => (
                <input
                  key={index}
                  id={`passcode-${index}`}
                  ref={(el) => passcodeInputRefs.current[index] = el}
                  type="password"
                  className="passcode-dot"
                  value={digit || ''}
                  onChange={(e) => handlePasscodeChange(index, e.target.value)}
                  onKeyDown={(e) => handlePasscodeKeyDown(index, e)}
                  maxLength="1"
                  style={{ display: 'none' }}
                />
              ))}
              {(passcode || ['', '', '', '', '', '']).map((digit, index) => (
                <div key={`dot-${index}`} className={`passcode-circle ${digit ? 'filled' : ''} ${passcodeError ? 'error' : ''}`}></div>
              ))}
          </div>
            <div className="number-pad">
              <div className="number-row">
                <button className="number-button" onClick={() => handleNumberPadClick(1)}>1</button>
                <button className="number-button" onClick={() => handleNumberPadClick(2)}>2</button>
                <button className="number-button" onClick={() => handleNumberPadClick(3)}>3</button>
                  </div>
              <div className="number-row">
                <button className="number-button" onClick={() => handleNumberPadClick(4)}>4</button>
                <button className="number-button" onClick={() => handleNumberPadClick(5)}>5</button>
                <button className="number-button" onClick={() => handleNumberPadClick(6)}>6</button>
                    </div>
              <div className="number-row">
                <button className="number-button" onClick={() => handleNumberPadClick(7)}>7</button>
                <button className="number-button" onClick={() => handleNumberPadClick(8)}>8</button>
                <button className="number-button" onClick={() => handleNumberPadClick(9)}>9</button>
                  </div>
              <div className="number-row">
                <button className="number-button invisible"></button>
                <button className="number-button" onClick={() => handleNumberPadClick(0)}>0</button>
                <button className="number-button backspace" onClick={() => handlePasscodeBackspace()}>⌫</button>
                </div>
              </div>
            </div>
          <div className="form-footer">
              <button 
              className={`next-button ${screenLoading ? 'loading' : ''}`} 
              onClick={handleExistingUserPasscodeVerify}
              disabled={screenLoading || passcode.length !== 6}
              >
              <span className="button-text">
                {screenLoading ? 'Verifying...' : 'Verify & Continue'}
              </span>
              </button>
          </div>
        </div>
      </div>
    )
  }
  // Final Success Screen
  if (currentScreen === 'finalSuccess') {
    return (
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          {screenLoading && (
            <div className="screen-loading-overlay">
              <CubeLoader message={loadingMessage} />
            </div>
          )}
          <div className="success-screen">
            <div className="success-icon">
              <div className="checkmark-circle">
                <div className="checkmark">✓</div>
              </div>
            </div>
            <h2 className="success-title">Thanks for that</h2>
            <p className="success-subtitle">We've verified your UC ERA account.</p>
          </div>
          <div className="form-footer">
            <button 
              className="next-button" 
              onClick={() => setCurrentScreen('memberCardApplication')}
            >
              <span className="button-text">Get Started</span>
            </button>
          </div>
        </div>
      </div>
    )
  }
  // Living City Screen
  if (currentScreen === 'city') {
    return (
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          {screenLoading && (
            <div className="screen-loading-overlay">
              <CubeLoader message={loadingMessage} />
            </div>
          )}
          <div className="form-header">
            <button className="back-button" onClick={goBack}>
              ←
            </button>
            <span className="help-link">Help</span>
          </div>
          <div className="form-content">
            <h2 className="form-title">What's your living city?</h2>
            <div className="city-selection">
              {myanmarCities.map((city) => (
                <div
                  key={city}
                  className={`city-option ${selectedCity === city ? 'selected' : ''}`}
                  onClick={() => setSelectedCity(city)}
                >
                  <span className="city-name">{city}</span>
                  <div className="city-checkbox">
                    {selectedCity === city && '✓'}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="form-footer">
            <button 
              className={`next-button ${screenLoading ? 'loading' : ''}`} 
              onClick={handleNext}
              disabled={screenLoading}
            >
              {screenLoading ? 'Please wait...' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    )
  }
  // Citizenship Screen
  if (currentScreen === 'citizenship') {
    return (
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          {screenLoading && (
            <div className="screen-loading-overlay">
              <CubeLoader message={loadingMessage} />
            </div>
          )}
          <div className="form-header">
            <button className="back-button" onClick={goBack}>
              ←
            </button>
            <span className="help-link">Help</span>
          </div>
          <div className="form-content">
            <h2 className="form-title">What's your citizenship?</h2>
            <p className="form-subtitle">
              If you have dual or multiple citizenships, please choose all that apply.
            </p>
            <div className="citizenship-selection">
              {myanmarEthnicGroups.map((group) => (
                <div
                  key={group.name}
                  className={`citizenship-option ${selectedCitizenships.includes(group.name) ? 'selected' : ''}`}
                  onClick={() => toggleCitizenship(group.name)}
                >
                  <span className="citizenship-flag">{group.flag}</span>
                  <span className="citizenship-name">{group.name}</span>
                  <div className="citizenship-checkbox">
                    {selectedCitizenships.includes(group.name) && '✓'}
                  </div>
                </div>
              ))}
            </div>
            <div className="selection-counter">
              {selectedCitizenships.length}/3 selected
            </div>
          </div>
          <div className="form-footer">
            <button 
              className={`next-button ${screenLoading ? 'loading' : ''}`} 
              onClick={handleNext}
              disabled={screenLoading}
            >
              {screenLoading ? 'Please wait...' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    )
  }
  // Confirm Passcode Screen
  if (currentScreen === 'passcodeConfirm') {
    return (
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          {screenLoading && (
            <div className="screen-loading-overlay">
              <CubeLoader message={loadingMessage} />
            </div>
          )}
          <div className="form-header">
            <button className="back-button" onClick={goBack}>
              ←
            </button>
            <span className="help-link">Help</span>
          </div>
          <div className="form-content">
            <h2 className="form-title">Confirm your passcode</h2>
            <p className="form-subtitle">
              Please enter your 6-digit passcode again to confirm.
            </p>
            <div className="passcode-dots">
              {confirmPasscode.map((digit, index) => (
                <input
                  key={index}
                  id={`confirm-passcode-${index}`}
                  type="password"
                  className="passcode-dot"
                  value={digit}
                  onChange={(e) => handlePasscodeChange(index, e.target.value, true)}
                  onKeyDown={(e) => handlePasscodeKeyDown(index, e, true)}
                  maxLength="1"
                  style={{ display: 'none' }}
                />
              ))}
              {confirmPasscode.map((digit, index) => (
                <div key={`dot-${index}`} className={`passcode-circle ${digit ? 'filled' : ''}`}></div>
              ))}
            </div>
            <div className="number-pad">
              <div className="number-row">
                <button className="number-button" onClick={() => handleNumberPadClick(1, true)}>1</button>
                <button className="number-button" onClick={() => handleNumberPadClick(2, true)}>2</button>
                <button className="number-button" onClick={() => handleNumberPadClick(3, true)}>3</button>
              </div>
              <div className="number-row">
                <button className="number-button" onClick={() => handleNumberPadClick(4, true)}>4</button>
                <button className="number-button" onClick={() => handleNumberPadClick(5, true)}>5</button>
                <button className="number-button" onClick={() => handleNumberPadClick(6, true)}>6</button>
              </div>
              <div className="number-row">
                <button className="number-button" onClick={() => handleNumberPadClick(7, true)}>7</button>
                <button className="number-button" onClick={() => handleNumberPadClick(8, true)}>8</button>
                <button className="number-button" onClick={() => handleNumberPadClick(9, true)}>9</button>
              </div>
              <div className="number-row">
                <div className="number-button invisible"></div>
                <button className="number-button" onClick={() => handleNumberPadClick(0, true)}>0</button>
                <button className="number-button backspace" onClick={() => handlePasscodeBackspace(true)}>⌫</button>
              </div>
            </div>
          </div>
          <div className="form-footer">
            <button 
              className={`next-button ${isLoading ? 'loading' : ''}`}
              onClick={handleNext}
              disabled={isLoading}
            >
              <span className="button-text">Confirm</span>
            </button>
          </div>
        </div>
      </div>
    )
  }
  // Passcode Setup Screen
  if (currentScreen === 'passcode') {
    return (
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          {screenLoading && (
            <div className="screen-loading-overlay">
              <CubeLoader message={loadingMessage} />
            </div>
          )}
          <div className="form-header">
            <button className="back-button" onClick={goBack}>
              ←
            </button>
            <span className="help-link">Help</span>
          </div>
          <div className="form-content">
            <h2 className="form-title">Please choose a 6-digit passcode</h2>
            <p className="form-subtitle">
              You'll use it to securely unlock and access your app, so please don't share it with anyone.
            </p>
            <div className="passcode-dots">
              {passcode.map((digit, index) => (
                <input
                  key={index}
                  id={`passcode-${index}`}
                  type="password"
                  className="passcode-dot"
                  value={digit}
                  onChange={(e) => handlePasscodeChange(index, e.target.value)}
                  onKeyDown={(e) => handlePasscodeKeyDown(index, e)}
                  maxLength="1"
                  style={{ display: 'none' }}
                />
              ))}
              {passcode.map((digit, index) => (
                <div key={`dot-${index}`} className={`passcode-circle ${digit ? 'filled' : ''}`}></div>
              ))}
            </div>
            <div className="number-pad">
              <div className="number-row">
                <button className="number-button" onClick={() => handleNumberPadClick(1)}>1</button>
                <button className="number-button" onClick={() => handleNumberPadClick(2)}>2</button>
                <button className="number-button" onClick={() => handleNumberPadClick(3)}>3</button>
              </div>
              <div className="number-row">
                <button className="number-button" onClick={() => handleNumberPadClick(4)}>4</button>
                <button className="number-button" onClick={() => handleNumberPadClick(5)}>5</button>
                <button className="number-button" onClick={() => handleNumberPadClick(6)}>6</button>
              </div>
              <div className="number-row">
                <button className="number-button" onClick={() => handleNumberPadClick(7)}>7</button>
                <button className="number-button" onClick={() => handleNumberPadClick(8)}>8</button>
                <button className="number-button" onClick={() => handleNumberPadClick(9)}>9</button>
              </div>
              <div className="number-row">
                <div className="number-button invisible"></div>
                <button className="number-button" onClick={() => handleNumberPadClick(0)}>0</button>
                <button className="number-button backspace" onClick={() => handlePasscodeBackspace()}>⌫</button>
              </div>
            </div>
          </div>
          <div className="form-footer">
            <button 
              className={`next-button ${screenLoading ? 'loading' : ''}`} 
              onClick={handleNext}
              disabled={screenLoading}
            >
              {screenLoading ? 'Please wait...' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    )
  }
  // Success Screen
  if (currentScreen === 'success') {
  return (
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          {screenLoading && (
            <div className="screen-loading-overlay">
              <CubeLoader message={loadingMessage} />
            </div>
          )}
          <div className="success-screen">
            <div className="success-icon">
              <div className="checkmark-circle">
                <div className="checkmark">✓</div>
              </div>
            </div>
            <h2 className="success-title">Great, that matches!</h2>
          </div>
          <div className="form-footer">
            <button 
              className={`next-button ${screenLoading ? 'loading' : ''}`} 
              onClick={handleNext}
              disabled={screenLoading}
            >
              {screenLoading ? 'Please wait...' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    )
  }
  if (currentScreen === 'verification') {
    return (
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          {screenLoading && (
            <div className="screen-loading-overlay">
              <CubeLoader message={loadingMessage} />
            </div>
          )}
          <div className="form-header">
            <button className="back-button" onClick={goBack}>
              ←
            </button>
            <span className="help-link">Help</span>
          </div>
          <div className="form-content">
            <div className="verification-section">
              <h2 className="verification-title">
                Please enter the verification code
              </h2>
              <p className="verification-subtitle">
                We sent it to <span className="email-highlight">{formData.email}</span>
              </p>
            </div>
            <div className="otp-container">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  className="otp-input"
                  value={digit}
                  onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleVerificationKeyDown(index, e)}
                  maxLength="1"
                />
              ))}
            </div>
            <div className="resend-section">
              <button 
                className={`resend-button ${(resendCooldown > 0 || resendCount >= 3) ? 'disabled' : ''}`}
                onClick={resendCode}
                disabled={resendCooldown > 0 || resendCount >= 3}
              >
                {getResendButtonText()}
        </button>
              {resendCount > 0 && resendCount < 3 && (
                <p className="resend-info">
                  {resendCount}/3 attempts used
                </p>
              )}
            </div>
          </div>
          <div className="form-footer">
            <button 
              className={`next-button ${isLoading ? 'loading' : ''}`}
              onClick={handleNext}
              disabled={isLoading}
            >
              <span className="button-text">Verify</span>
            </button>
          </div>
        </div>
      </div>
    )
  }
  if (currentScreen === 'contact') {
    return (
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          {screenLoading && (
            <div className="screen-loading-overlay">
              <CubeLoader message={loadingMessage} />
            </div>
          )}
          <div className="form-header">
            <button className="back-button" onClick={goBack}>
              ←
            </button>
            <span className="help-link">Help</span>
          </div>
          <div className="form-content">
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder=""
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone number</label>
              <p className="form-hint">Select your country code and enter your phone number</p>
              <div className="phone-input-container">
                <div 
                  className="country-selector"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                >
                  <span className="country-flag">{selectedCountry.flag}</span>
                  <span className="country-code">{selectedCountry.code}</span>
                  <span className="dropdown-arrow">▼</span>
                </div>
                {showCountryDropdown && (
                  <div className="country-dropdown">
                    {countries.map((country) => (
                      <div
                        key={country.code}
                        className="country-option"
                        onClick={() => selectCountry(country)}
                      >
                        <span className="country-flag">{country.flag}</span>
                        <span className="country-name">{country.name}</span>
                        <span className="country-code">{country.code}</span>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  className="phone-input"
                  value={formData.phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder={selectedCountry.format}
                  maxLength="15"
                />
              </div>
            </div>
          </div>
          <div className="form-footer">
            <button 
              className={`next-button ${screenLoading ? 'loading' : ''}`} 
              onClick={handleNext}
              disabled={screenLoading || contactButtonClicked}
            >
              {screenLoading ? 'Please wait...' : contactButtonClicked ? 'Processing...' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    )
  }
  if (currentScreen === 'dateOfBirth') {
    return (
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          {screenLoading && (
            <div className="screen-loading-overlay">
              <CubeLoader message={loadingMessage} />
            </div>
          )}
          <div className="form-header">
            <button className="back-button" onClick={goBack}>
              ←
            </button>
            <span className="help-link">Help</span>
          </div>
          <div className="form-content">
            <div className="birth-question">
              <h2 className="birth-title">
                When were you born, {getFullName()}?
              </h2>
            </div>
            <div className="form-group">
              <label className="form-label">Date of birth</label>
              <p className="form-hint">DD/MM/YYYY or select from calendar</p>
              <div className="date-input-container">
                <input
                  type="text"
                  className={`form-input focused ${dateError ? 'error' : ''}`}
                  value={formData.dateOfBirth}
                  onChange={(e) => handleDateChange(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  maxLength="10"
                />
                <button 
                  type="button"
                  className="calendar-button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  📅
                </button>
              </div>
              {dateError && (
                <p className="error-message">{dateError}</p>
              )}
              {showDatePicker && (
                <input
                  type="date"
                  className="date-picker"
                  value={convertToDateInput(formData.dateOfBirth)}
                  onChange={handleDatePickerChange}
                  max={new Date().toISOString().split('T')[0]}
                />
              )}
            </div>
          </div>
          <div className="form-footer">
            <button 
              className={`next-button ${screenLoading ? 'loading' : ''}`} 
              onClick={handleNext}
              disabled={screenLoading}
            >
              {screenLoading ? 'Please wait...' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    )
  }
  if (currentScreen === 'registration') {
    return (
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          {screenLoading && (
            <div className="screen-loading-overlay">
              <CubeLoader message={loadingMessage} />
            </div>
          )}
          <div className="form-header">
            <button className="back-button" onClick={goBack}>
              ←
            </button>
            <span className="help-link">Help</span>
          </div>
          <div className="form-content">
            <div className="form-group">
              <label className="form-label">First name</label>
              <input
                type="text"
                className="form-input"
                value={formData.firstName}
                onChange={(e) => handleNameChange('firstName', e.target.value)}
                placeholder=""
              />
            </div>
            <div className="form-group">
              <label className="form-label">Middle name(s)</label>
              <p className="form-hint">[မရှိရင်ထားခဲ့ပါ]</p>
              <input
                type="text"
                className="form-input"
                value={formData.middleName}
                onChange={(e) => handleNameChange('middleName', e.target.value)}
                placeholder=""
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last name</label>
              <input
                type="text"
                className="form-input focused"
                value={formData.lastName}
                onChange={(e) => handleNameChange('lastName', e.target.value)}
                placeholder=""
              />
            </div>
          </div>
          <div className="form-footer">
            <button 
              className={`next-button ${screenLoading ? 'loading' : ''}`} 
              onClick={handleNext}
              disabled={screenLoading}
            >
              {screenLoading ? 'Please wait...' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    )
  }
  // Member Card Application Screen
  if (currentScreen === 'memberCardApplication') {
  return (
    <div className="app">
      <div className="container">
        {notification.show && (
          <div className={`notification ${notification.type}`}>
            <span className="notification-message">{notification.message}</span>
            <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          {screenLoading && (
            <div className="screen-loading-overlay">
              <CubeLoader message={loadingMessage} />
            </div>
          )}
          <div className="member-card-header">
            <button className="back-button" onClick={() => setCurrentScreen('finalSuccess')}>
              ←
            </button>
            <span className="help-link">Help</span>
          </div>
          <div className="member-card-content">
            <div className="card-icon">
              <MemberCard />
            </div>
            <h2 className="member-card-title">Verify Your Member Card</h2>
            <p className="member-card-description">
              UC ERA ၏ feature များအားလုံးကို အသုံးပြုနိုင်ရန် သင်၏ Member Card ကို အရင်ဆုံးပြုလုပ်ရန် လိုအပ်ပါသည်။
            </p>
            <p className="member-card-description">
              ဤ Card သည် app သို့ဝင်ရောက်ရန် သင်၏လုံခြုံသော Digital သော့ချက်ဖြစ်ပါသည်။
            </p>
            <p className="member-card-description">
              သင်၏အချက်အလက်များဖြင့် Card ကိုပြုလုပ်မည်ဖြစ်ကြောင်း အောက်တွင် အတည်ပြုပါ။
            </p>
            <div className="confirmation-section">
              <div className="confirmation-title">
                <h3>သင်၏ Digital Identity ကို အတည်ပြုပါ</h3>
              </div>
              <div className="confirmation-item">
                <div className="checkbox-container">
                  <div className="checkbox">✓</div>
                </div>
                <div className="confirmation-text">
                  UC ERA သို့ လုံခြုံစွာဝင်ရောက်ရန် သင်၏ Digital Member Card ကို အရင်ဆုံးပြုလုပ်ပါ။
                </div>
              </div>
              <div className="confirmation-item">
                <div className="checkbox-container">
                  <div className="checkbox">✓</div>
                </div>
                <div className="confirmation-text">
                  ဤ Card သည် သင်၏အချက်အလက်များကို အဆင့်မြင့်နည်းပညာဖြင့် ကာကွယ်ပေးမည်ဖြစ်ပါသည်။
                </div>
              </div>
              <div className="confirmation-item">
                <div className="checkbox-container">
                  <div className="checkbox">✓</div>
                </div>
                <div className="confirmation-text">
                  Card ကို မိမိတစ်ဦးတည်းအတွက်သာ အသုံးပြုမည်ဖြစ်ကြောင်း အတည်ပြုပေးပါ။
                </div>
              </div>
            </div>
          </div>
          <div className="form-footer">
            <button 
              className="member-card-button"
              onClick={() => setCurrentScreen('nameConfirmation')}
            >
              <span className="button-text">Get Member Card</span>
            </button>
          </div>
        </div>
      </div>
    )
  }
  // Name Confirmation Screen
  if (currentScreen === 'nameConfirmation') {
    return (
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          {screenLoading && (
            <div className="screen-loading-overlay">
              <CubeLoader message={loadingMessage} />
            </div>
          )}
          <div className="form-header">
            <button className="back-button" onClick={() => setCurrentScreen('memberCardApplication')}>
              ←
            </button>
            <span className="help-link">Help</span>
          </div>
          <div className="form-content">
            <div className="welcome-logo">
              <div className="logo-text"></div>
            </div>
            <h2 className="form-title">နာမည်အတည်ပြုခြင်း</h2>
            <p className="form-subtitle">
              အောက်တွင်ပြထားသော နာမည်များသည် သင်၏နာမည်အရင်းများ ဖြစ်ပါသလား?
            </p>
            <div className="name-display-section">
              <div className="name-display-card">
                {editingNames ? (
                  <>
                    <div className="name-field">
                      <label>First Name</label>
                      <input
                        type="text"
                        className="name-input"
                        value={tempFormData.firstName || formData.firstName || ''}
                        onChange={(e) => {
                          const englishOnly = e.target.value
                            .replace(/[^\u0000-\u007F\s]/g, '') // Remove non-ASCII characters (Myanmar, etc.)
                            .replace(/[^a-zA-Z\s]/g, '') // Keep only English letters and spaces
                            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                            .split(' ')
                            .map(word => {
                              if (word.length > 0) {
                                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                              }
                              return word
                            })
                            .join(' ')
                          setTempFormData({...tempFormData, firstName: englishOnly})
                        }}
                        placeholder="Enter first name (English only)"
                      />
                    </div>
                    <div className="name-field">
                      <label>Middle Name</label>
                      <input
                        type="text"
                        className="name-input"
                        value={tempFormData.middleName || formData.middleName || ''}
                        onChange={(e) => {
                          const englishOnly = e.target.value
                            .replace(/[^\u0000-\u007F\s]/g, '') // Remove non-ASCII characters (Myanmar, etc.)
                            .replace(/[^a-zA-Z\s]/g, '') // Keep only English letters and spaces
                            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                            .split(' ')
                            .map(word => {
                              if (word.length > 0) {
                                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                              }
                              return word
                            })
                            .join(' ')
                          setTempFormData({...tempFormData, middleName: englishOnly})
                        }}
                        placeholder="Enter middle name (English only, optional)"
                      />
                    </div>
                    <div className="name-field">
                      <label>Last Name</label>
                      <input
                        type="text"
                        className="name-input"
                        value={tempFormData.lastName || formData.lastName || ''}
                        onChange={(e) => {
                          const englishOnly = e.target.value
                            .replace(/[^\u0000-\u007F\s]/g, '') // Remove non-ASCII characters (Myanmar, etc.)
                            .replace(/[^a-zA-Z\s]/g, '') // Keep only English letters and spaces
                            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                            .split(' ')
                            .map(word => {
                              if (word.length > 0) {
                                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                              }
                              return word
                            })
                            .join(' ')
                          setTempFormData({...tempFormData, lastName: englishOnly})
                        }}
                        placeholder="Enter last name (English only)"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="name-field">
                      <label>First Name</label>
                      <div className="name-value">{formData.firstName || 'မရှိပါ'}</div>
                    </div>
                    {formData.middleName && (
                      <div className="name-field">
                        <label>Middle Name</label>
                        <div className="name-value">{formData.middleName}</div>
                      </div>
                    )}
                    <div className="name-field">
                      <label>Last Name</label>
                      <div className="name-value">{formData.lastName || 'မရှိပါ'}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="confirmation-buttons">
              {editingNames ? (
                <>
                                  <button 
                  className="confirm-button correct"
                  onClick={async () => {
                    try {
                      showScreenLoading('နာမည်အပြောင်းအလဲများ သိမ်းနေပါသည်...')
                      // Update database immediately with new names
                      const updateData = {
                        firstName: tempFormData.firstName || formData.firstName,
                        middleName: tempFormData.middleName || formData.middleName,
                        lastName: tempFormData.lastName || formData.lastName
                      }
                      const updatedUser = await authService.updateUserNames(formData.userId, updateData)
                      // Update formData with saved names
                      setFormData({
                        ...formData,
                        firstName: updateData.firstName,
                        middleName: updateData.middleName,
                        lastName: updateData.lastName
                      })
                      setEditingNames(false)
                      setTempFormData({})
                      hideScreenLoading()
                      showNotification('✅ နာမည်များ အောင်မြင်စွာ ပြောင်းလဲပြီးပါပြီ!', 'success')
                    } catch (error) {
                      hideScreenLoading()
                      showNotification('❌ နာမည်ပြောင်းလဲခြင်း မအောင်မြင်ပါ: ' + error.message, 'error')
                    }
                  }}
                >
                  <span className="button-text">✓ သိမ်းမည်</span>
                </button>
                  <button 
                    className="confirm-button incorrect"
                    onClick={() => {
                      setEditingNames(false)
                      setTempFormData({})
                    }}
                  >
                    <span className="button-text">✗ ပယ်ဖျက်မည်</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="confirm-button correct"
                    onClick={() => setCurrentScreen('relationshipStatus')}
                  >
                    <span className="button-text">✓ မှန်ကန်ပါသည်</span>
                  </button>
                  <button 
                    className="confirm-button incorrect"
                    onClick={() => {
                      setEditingNames(true)
                      setTempFormData({
                        firstName: formData.firstName,
                        middleName: formData.middleName,
                        lastName: formData.lastName
                      })
                    }}
                  >
                    <span className="button-text">✗ ပြန်ပြင်ချင်ပါသည်</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
  // Relationship Status Screen
  if (currentScreen === 'relationshipStatus') {
    return (
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          {screenLoading && (
            <div className="screen-loading-overlay">
              <CubeLoader message={loadingMessage} />
            </div>
          )}
          <div className="form-header">
            <button className="back-button" onClick={() => setCurrentScreen('nameConfirmation')}>
              ←
            </button>
            <span className="help-link">Help</span>
          </div>
          <div className="form-content">
            <div className="welcome-logo">
              <div className="logo-text">💕</div>
            </div>
            <h2 className="form-title">ရေးရာဆက်ဆံရေး အခြေအနေ</h2>
            <p className="form-subtitle">
              သင်၏လက်ရှိ ရေးရာဆက်ဆံရေး အခြေအနေကို ရွေးချယ်ပါ
            </p>
            <div className="selection-grid">
              <button 
                className={`selection-item ${formData.relationshipStatus === 'single' ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, relationshipStatus: 'single'})}
              >
                <div className="selection-icon">💔</div>
                <span>လွတ်လပ်သူ</span>
              </button>
              <button 
                className={`selection-item ${formData.relationshipStatus === 'in_relationship' ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, relationshipStatus: 'in_relationship'})}
              >
                <div className="selection-icon">💑</div>
                <span>ချစ်သူရှိသူ</span>
              </button>
              <button 
                className={`selection-item ${formData.relationshipStatus === 'married' ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, relationshipStatus: 'married'})}
              >
                <div className="selection-icon">💍</div>
                <span>လက်ထပ်ပြီးသူ</span>
              </button>
              <button 
                className={`selection-item ${formData.relationshipStatus === 'complicated' ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, relationshipStatus: 'complicated'})}
              >
                <div className="selection-icon">🤔</div>
                <span>ရှုပ်ထွေးနေတယ်</span>
              </button>
              <button 
                className={`selection-item ${formData.relationshipStatus === 'not_specified' ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, relationshipStatus: 'not_specified'})}
              >
                <div className="selection-icon">🤐</div>
                <span>မပြောချင်ပါ</span>
              </button>
            </div>
          </div>
          <div className="form-footer">
            <button 
              className="next-button" 
              onClick={() => setCurrentScreen('genderSelection')}
              disabled={!formData.relationshipStatus}
            >
              <span className="button-text">Next</span>
            </button>
          </div>
        </div>
      </div>
    )
  }
  // Gender Selection Screen
  if (currentScreen === 'genderSelection') {
    return (
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          {screenLoading && (
            <div className="screen-loading-overlay">
              <CubeLoader message={loadingMessage} />
            </div>
          )}
          <div className="form-header">
            <button className="back-button" onClick={() => setCurrentScreen('relationshipStatus')}>
              ←
            </button>
            <span className="help-link">Help</span>
          </div>
          <div className="form-content">
            <div className="welcome-logo">
              <div className="logo-text">⚧️</div>
            </div>
            <h2 className="form-title">လိင်ပိုင်းဆိုင်ရာ</h2>
            <p className="form-subtitle">
              သင်၏လိင်ပိုင်းဆိုင်ရာ ပုံစံကို ရွေးချယ်ပါ
            </p>
            <div className="selection-grid">
              <button 
                className={`selection-item ${formData.gender === 'male' ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, gender: 'male'})}
              >
                <div className="selection-icon">👨</div>
                <span>ယောက်ျား</span>
              </button>
              <button 
                className={`selection-item ${formData.gender === 'female' ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, gender: 'female'})}
              >
                <div className="selection-icon">👩</div>
                <span>မိန်းမ</span>
              </button>
              <button 
                className={`selection-item ${formData.gender === 'lgbtq' ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, gender: 'lgbtq'})}
              >
                <div className="selection-icon">🏳️‍🌈</div>
                <span>LGBTQ+</span>
              </button>
              <button 
                className={`selection-item ${formData.gender === 'prefer_not_to_say' ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, gender: 'prefer_not_to_say'})}
              >
                <div className="selection-icon">🤐</div>
                <span>မပြောချင်ပါ</span>
              </button>
            </div>
          </div>
          <div className="form-footer">
            <button 
              className="next-button" 
              onClick={() => setCurrentScreen('favoriteFood')}
              disabled={!formData.gender}
            >
              <span className="button-text">Next</span>
            </button>
          </div>
        </div>
      </div>
    )
  }
  // Favorite Food Screen
  if (currentScreen === 'favoriteFood') {
    return (
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          {screenLoading && (
            <div className="screen-loading-overlay">
              <CubeLoader message={loadingMessage} />
            </div>
          )}
          <div className="form-header">
            <button className="back-button" onClick={() => setCurrentScreen('genderSelection')}>
              ←
            </button>
            <span className="help-link">Help</span>
          </div>
          <div className="form-content">
            <div className="welcome-logo">
              <div className="logo-text">Food</div>
            </div>
            <h2 className="form-title">နှစ်သက်ရာ အစားအစာများ</h2>
            <p className="form-subtitle">
              သင်အကြိုက်ဆုံး မြန်မာ့ရိုးရာ အစားအစာများကို ရွေးချယ်ပါ (တစ်ခုထက်ပိုရွေးနိုင်ပါသည်)
            </p>
            <div className="custom-input-section">
              <div className="form-input-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="စာရင်းမှာ မပါရင် ကိုယ်တိုင်ရေးပါ..."
                  value={customFood}
                  onChange={(e) => setCustomFood(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && customFood.trim()) {
                      const currentFoods = Array.isArray(formData.favoriteFood) ? formData.favoriteFood : []
                      if (!currentFoods.includes(customFood.trim())) {
                        setFormData({
                          ...formData, 
                          favoriteFood: [...currentFoods, customFood.trim()]
                        })
                      }
                      setCustomFood('')
                    }
                  }}
                />
                <button
                  type="button"
                  className="add-custom-button"
                  onClick={() => {
                    if (customFood.trim()) {
                      const currentFoods = Array.isArray(formData.favoriteFood) ? formData.favoriteFood : []
                      if (!currentFoods.includes(customFood.trim())) {
                        setFormData({
                          ...formData, 
                          favoriteFood: [...currentFoods, customFood.trim()]
                        })
                      }
                      setCustomFood('')
                    }
                  }}
                  disabled={!customFood.trim()}
                >
                  ထည့်မယ်
                </button>
              </div>
            </div>
            <div className="selected-items-section">
              {Array.isArray(formData.favoriteFood) && formData.favoriteFood.length > 0 && (
                <div className="selected-items">
                  <h4>ရွေးချယ်ထားသော အစားအစာများ:</h4>
                  <div className="selected-tags">
                    {formData.favoriteFood.map((food, index) => (
                      <span key={index} className="selected-tag">
                        {food}
                        <button
                          className="remove-tag"
                          onClick={() => {
                            const updatedFoods = formData.favoriteFood.filter((_, i) => i !== index)
                            setFormData({...formData, favoriteFood: updatedFoods})
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="selection-grid">
              {myanmarFoods.map((food, index) => (
                <button
                  key={index}
                  className={`selection-item ${
                    Array.isArray(formData.favoriteFood) && formData.favoriteFood.includes(food) ? 'selected' : ''
                  }`}
                  onClick={() => {
                    const currentFoods = Array.isArray(formData.favoriteFood) ? formData.favoriteFood : []
                    if (currentFoods.includes(food)) {
                      // Remove if already selected
                      setFormData({
                        ...formData, 
                        favoriteFood: currentFoods.filter(f => f !== food)
                      })
                    } else {
                      // Add if not selected
                      setFormData({
                        ...formData, 
                        favoriteFood: [...currentFoods, food]
                      })
                    }
                  }}
                >
                  <span>{food}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="form-footer">
            <button 
              className="next-button" 
              onClick={() => setCurrentScreen('favoriteArtist')}
              disabled={!Array.isArray(formData.favoriteFood) || formData.favoriteFood.length === 0}
            >
              <span className="button-text">Next</span>
            </button>
          </div>
        </div>
      </div>
    )
  }
  // Favorite Artist Screen
  if (currentScreen === 'favoriteArtist') {
    return (
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          {screenLoading && (
            <div className="screen-loading-overlay">
              <CubeLoader message={loadingMessage} />
            </div>
          )}
          <div className="form-header">
            <button className="back-button" onClick={() => setCurrentScreen('favoriteFood')}>
              ←
            </button>
            <span className="help-link">Help</span>
          </div>
          <div className="form-content">
            <div className="welcome-logo">
              <div className="logo-text">Artist</div>
            </div>
            <h2 className="form-title">နှစ်သက်ရာ အနုပညာရှင်များ</h2>
            <p className="form-subtitle">
              သင်အကြိုက်ဆုံး မြန်မာ့ အဆိုတော်/အနုပညာရှင်များကို ရွေးချယ်ပါ (တစ်ယောက်ထက်ပိုရွေးနိုင်ပါသည်)
            </p>
            <div className="custom-input-section">
              <div className="form-input-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="စာရင်းမှာ မပါရင် ကိုယ်တိုင်ရေးပါ..."
                  value={customArtist}
                  onChange={(e) => setCustomArtist(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && customArtist.trim()) {
                      const currentArtists = Array.isArray(formData.favoriteArtist) ? formData.favoriteArtist : []
                      if (!currentArtists.includes(customArtist.trim())) {
                        setFormData({
                          ...formData, 
                          favoriteArtist: [...currentArtists, customArtist.trim()]
                        })
                      }
                      setCustomArtist('')
                    }
                  }}
                />
                <button
                  type="button"
                  className="add-custom-button"
                  onClick={() => {
                    if (customArtist.trim()) {
                      const currentArtists = Array.isArray(formData.favoriteArtist) ? formData.favoriteArtist : []
                      if (!currentArtists.includes(customArtist.trim())) {
                        setFormData({
                          ...formData, 
                          favoriteArtist: [...currentArtists, customArtist.trim()]
                        })
                      }
                      setCustomArtist('')
                    }
                  }}
                  disabled={!customArtist.trim()}
                >
                  ထည့်မယ်
                </button>
              </div>
            </div>
            <div className="selected-items-section">
              {Array.isArray(formData.favoriteArtist) && formData.favoriteArtist.length > 0 && (
                <div className="selected-items">
                  <h4>ရွေးချယ်ထားသော အနုပညာရှင်များ:</h4>
                  <div className="selected-tags">
                    {formData.favoriteArtist.map((artist, index) => (
                      <span key={index} className="selected-tag">
                        {artist}
                        <button
                          className="remove-tag"
                          onClick={() => {
                            const updatedArtists = formData.favoriteArtist.filter((_, i) => i !== index)
                            setFormData({...formData, favoriteArtist: updatedArtists})
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="selection-grid">
              {myanmarArtists.map((artist, index) => (
                <button
                  key={index}
                  className={`selection-item ${
                    Array.isArray(formData.favoriteArtist) && formData.favoriteArtist.includes(artist) ? 'selected' : ''
                  }`}
                  onClick={() => {
                    const currentArtists = Array.isArray(formData.favoriteArtist) ? formData.favoriteArtist : []
                    if (currentArtists.includes(artist)) {
                      // Remove if already selected
                      setFormData({
                        ...formData, 
                        favoriteArtist: currentArtists.filter(a => a !== artist)
                      })
                    } else {
                      // Add if not selected
                      setFormData({
                        ...formData, 
                        favoriteArtist: [...currentArtists, artist]
                      })
                    }
                  }}
                >
                  <span>{artist}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="form-footer">
            <button 
              className="next-button" 
              onClick={() => setCurrentScreen('loveLanguage')}
              disabled={!Array.isArray(formData.favoriteArtist) || formData.favoriteArtist.length === 0}
            >
              <span className="button-text">Next</span>
            </button>
          </div>
        </div>
      </div>
    )
  }
  // Love Language Screen
  if (currentScreen === 'loveLanguage') {
    return (
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          {screenLoading && (
            <div className="screen-loading-overlay">
              <CubeLoader message={loadingMessage} />
            </div>
          )}
          <div className="form-header">
            <button className="back-button" onClick={() => setCurrentScreen('favoriteArtist')}>
              ←
            </button>
            <span className="help-link">Help</span>
          </div>
          <div className="form-content">
            <div className="welcome-logo">
              <div className="logo-text">💝</div>
            </div>
            <h2 className="form-title">My Love Language</h2>
            <p className="form-subtitle">
              သင်၏ချစ်ခြင်းမေတ္တာ ဖော်ပြပုံကို ရွေးချယ်ပါ
            </p>
            <div className="love-language-grid">
              <button 
                className={`love-language-item ${formData.loveLanguage === 'words_of_affirmation' ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, loveLanguage: 'words_of_affirmation'})}
              >
                <div className="love-icon">💬</div>
                <div className="love-title">Words of Affirmation</div>
                <div className="love-description">ချီးမြှင့်စကားများ</div>
              </button>
              <button 
                className={`love-language-item ${formData.loveLanguage === 'acts_of_service' ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, loveLanguage: 'acts_of_service'})}
              >
                <div className="love-icon">🤝</div>
                <div className="love-title">Acts of Service</div>
                <div className="love-description">အကူအညီများ</div>
              </button>
              <button 
                className={`love-language-item ${formData.loveLanguage === 'receiving_gifts' ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, loveLanguage: 'receiving_gifts'})}
              >
                <div className="love-icon">🎁</div>
                <div className="love-title">Receiving Gifts</div>
                <div className="love-description">လက်ဆောင်များ</div>
              </button>
              <button 
                className={`love-language-item ${formData.loveLanguage === 'quality_time' ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, loveLanguage: 'quality_time'})}
              >
                <div className="love-icon">⏰</div>
                <div className="love-title">Quality Time</div>
                <div className="love-description">အချိန်ပေးခြင်း</div>
              </button>
              <button 
                className={`love-language-item ${formData.loveLanguage === 'physical_touch' ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, loveLanguage: 'physical_touch'})}
              >
                <div className="love-icon">🤗</div>
                <div className="love-title">Physical Touch</div>
                <div className="love-description">ထိတွေ့မှုများ</div>
              </button>
            </div>
          </div>
          <div className="form-footer">
            <button 
              className="next-button" 
              onClick={() => setCurrentScreen('photoUpload')}
              disabled={!formData.loveLanguage}
            >
              <span className="button-text">Next</span>
            </button>
          </div>
        </div>
      </div>
    )
  }
  // Photo Upload Screen
  if (currentScreen === 'photoUpload') {
    const handlePrivatePhotoUpload = (event) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFormData({...formData, privatePhoto: e.target.result})
        }
        reader.readAsDataURL(file)
      }
    }
    const handlePublicPhotoUpload = (event) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setOriginalImage(e.target.result)
          setShowCropper(true)
        }
        reader.readAsDataURL(file)
      }
    }
    // Crop handlers moved to top level for proper scope access
    return (
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          {screenLoading && (
            <div className="screen-loading-overlay">
              <CubeLoader message={loadingMessage} />
            </div>
          )}
          <div className="form-header">
            <button className="back-button" onClick={() => setCurrentScreen('loveLanguage')}>
              ←
            </button>
            <span className="help-link">Help</span>
          </div>
          <div className="form-content">
            <div className="welcome-logo">
              <div className="logo-text">Photo</div>
            </div>
            <h2 className="form-title">ဓာတ်ပုံများ ထည့်ပါ</h2>
            <p className="form-subtitle">
              Member Card အတွက် သင်၏ဓာတ်ပုံများကို ထည့်သွင်းပါ
            </p>
            <div className="photo-upload-section">
              {/* Private Photo Section */}
              <div className="photo-group">
                <h3 className="photo-title">Private Photo (ကိုယ်ပိုင်ဓာတ်ပုံ)</h3>
                <p className="photo-description">အမှန်တကယ်ကိုယ့်ပုံ - လုံခြုံရေးအတွက်သာ</p>
                <div className="photo-upload-area">
                  {formData.privatePhoto ? (
                    <div className="photo-preview">
                      <img src={formData.privatePhoto} alt="Private" className="preview-image" />
                      <button 
                        className="change-photo-btn"
                        onClick={() => document.getElementById('private-photo-input').click()}
                      >
                        ပြောင်းမယ်
                      </button>
                    </div>
                  ) : (
                    <label className="photo-upload-label" htmlFor="private-photo-input">
                      <div className="upload-icon">+</div>
                      <div className="upload-text">Private Photo ထည့်ပါ</div>
                    </label>
                  )}
                  <input
                    id="private-photo-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePrivatePhotoUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              {/* Public Photo Section */}
              <div className="photo-group">
                <h3 className="photo-title">Public Photo (Member Card ပုံ)</h3>
                <p className="photo-description">Member Card မှာ ပြမယ့်ပုံ - 2:3 ratio</p>
                <div className="photo-upload-area">
                  {formData.publicPhoto ? (
                    <div className="photo-preview">
                                              <img src={formData.publicPhoto} alt="Public" className="preview-image member-card-ratio" style={{imageRendering: 'crisp-edges'}} />
                      <button 
                        className="change-photo-btn"
                        onClick={() => document.getElementById('public-photo-input').click()}
                      >
                        ပြောင်းမယ်
                      </button>
                    </div>
                  ) : (
                    <label className="photo-upload-label member-card-format" htmlFor="public-photo-input">
                      <div className="upload-icon">+</div>
                      <div className="upload-text">Public Photo ထည့်ပါ</div>
                      <div className="ratio-info">2:3 ratio</div>
                    </label>
                  )}
                  <input
                    id="public-photo-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePublicPhotoUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>
            {/* Image Cropper Modal */}
            {showCropper && originalImage && (
              <div className="cropper-modal">
                <div className="cropper-content">
                  <h3>ပုံကို 2:3 ratio ဖြင့် ညှိပါ</h3>
                  <div className="crop-container">
                    <img 
                      src={originalImage} 
                      alt="Crop preview"
                      className="crop-image"
                      onLoad={(e) => {
                        const img = e.target
                        const displayWidth = img.offsetWidth
                        const displayHeight = img.offsetHeight
                        setImageDisplaySize({ width: displayWidth, height: displayHeight })
                        // Calculate 2:3 ratio crop area (width:height = 2:3)
                        const targetRatio = 2/3 // width/height ratio
                        let cropWidth, cropHeight
                        if (displayWidth / displayHeight > targetRatio) {
                          // Image is wider than 2:3, limit by height
                          cropHeight = displayHeight * 0.6 // Use 60% of height for better interaction
                          cropWidth = cropHeight * targetRatio
                        } else {
                          // Image is taller than 2:3, limit by width  
                          cropWidth = displayWidth * 0.6 // Use 60% of width for better interaction
                          cropHeight = cropWidth / targetRatio
                        }
                        // Center the crop area
                        const cropX = (displayWidth - cropWidth) / 2
                        const cropY = (displayHeight - cropHeight) / 2
                        setCropData({
                          x: cropX,
                          y: cropY,
                          width: cropWidth,
                          height: cropHeight
                        })
                      }}
                    />
                    {/* Interactive Crop Overlay */}
                    <div 
                      className="crop-overlay"
                      style={{
                        left: `${cropData.x}px`,
                        top: `${cropData.y}px`,
                        width: `${cropData.width}px`,
                        height: `${cropData.height}px`,
                        cursor: isDragging ? 'grabbing' : 'grab'
                      }}
                      onMouseDown={handleCropMouseDown}
                      onTouchStart={handleCropTouchStart}
                    >
                      {/* Drag Handle */}
                      <div className="crop-drag-handle">
                        <span>⋮⋮</span>
                      </div>
                      {/* Resize Handles */}
                      <div 
                        className="crop-resize-handle top-left"
                        onMouseDown={(e) => handleResizeStart(e, 'top-left')}
                        onTouchStart={(e) => handleResizeStart(e, 'top-left')}
                      />
                      <div 
                        className="crop-resize-handle top-right"
                        onMouseDown={(e) => handleResizeStart(e, 'top-right')}
                        onTouchStart={(e) => handleResizeStart(e, 'top-right')}
                      />
                      <div 
                        className="crop-resize-handle bottom-left"
                        onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
                        onTouchStart={(e) => handleResizeStart(e, 'bottom-left')}
                      />
                      <div 
                        className="crop-resize-handle bottom-right"
                        onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
                        onTouchStart={(e) => handleResizeStart(e, 'bottom-right')}
                      />
                    </div>
                  </div>
                  <div className="crop-controls">
                    <button className="crop-btn cancel" onClick={() => {
                      setShowCropper(false)
                      setOriginalImage(null)
                    }}>
                      ပယ်ဖျက်မယ်
                    </button>
                    <button className="crop-btn confirm" onClick={handleCropComplete}>
                      အတည်ပြုမယ်
                    </button>
                  </div>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
          <div className="form-footer">
            <button 
              className="next-button" 
              onClick={handleCompleteMemberCard}
              disabled={!formData.privatePhoto || !formData.publicPhoto}
            >
              <span className="button-text">Complete Member Card</span>
            </button>
          </div>
        </div>
      </div>
    )
  }
  // Member Card Success Screen
  if (currentScreen === 'memberCardSuccess') {
    return (
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          <div className="member-card-success-content">
            <h2 className="success-title">Your UC ERA Member Card</h2>
            {/* Member Card Container - 576:384 ratio */}
            <div className="member-card-container">
              <div className="member-card-inner">
                {memberCardGenerating ? (
                  <div className="card-generating">
                    <EyeLoader />
                  </div>
                ) : (
                  <div className="generated-card">
                    {generatedMemberCard?.imageUrl ? (
                      <img 
                        src={generatedMemberCard.imageUrl} 
                        alt="UC ERA Member Card" 
                        className="member-card-image"
                      />
                    ) : (
                      <div className="card-placeholder">
                        <p>Member Card ပြုလုပ်ပြီးပါပြီ!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Action Buttons */}
            {!memberCardGenerating && (
              <div className="card-actions">
                <button 
                  className="save-card-button"
                  onClick={async () => {
                    try {
                      if (generatedMemberCard?.imageUrl) {
                        // Create a temporary link element for download
                        const link = document.createElement('a')
                        // For data URLs (base64), use directly
                        if (generatedMemberCard.imageUrl.startsWith('data:')) {
                          link.href = generatedMemberCard.imageUrl
                          link.download = `UC-ERA-Member-Card-${formData.firstName || 'User'}.png`
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        } else {
                          // For external URLs, fetch and convert to blob
                          const response = await fetch(generatedMemberCard.imageUrl)
                          const blob = await response.blob()
                          const url = window.URL.createObjectURL(blob)
                          link.href = url
                          link.download = `UC-ERA-Member-Card-${formData.firstName || 'User'}.png`
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                          // Clean up the object URL
                          window.URL.revokeObjectURL(url)
                        }
                        showNotification('Member Card ကို Download ပြီးပါပြီ! 💾', 'success')
                      } else {
                        showNotification('❌ Member Card မတွေ့ပါ။ ပြန်လည်ကြိုးစားပါ။', 'error')
                      }
                    } catch (error) {
                      showNotification('❌ Download မအောင်မြင်ပါ။ ပြန်လည်ကြိုးစားပါ။', 'error')
                    }
                  }}
                >
                  Save Card
                </button>
                <button 
                  className="go-home-button"
                  onClick={() => {
                    setCurrentScreen('home')
                  }}
                >
                  Go to Home
                </button>
              </div>
            )}
            {/* Footer */}
            <div className="member-card-footer">
              <div className="footer-content">
                <img src="/ucm-logo.png" alt="UCM Logo" className="footer-logo" />
                <div className="footer-text">
                  <span className="powered-by">Powered by Team UCM</span>
                  <span className="copyright">© 2024 All Rights Reserved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  // Existing User Login Screen
  if (currentScreen === 'existingUserLogin') {
    return (
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          <div className="form-header">
            <button className="back-button" onClick={() => setCurrentScreen('contact')}>
              ←
            </button>
            <span className="help-link">Help</span>
          </div>
          <div className="form-content">
            <div className="welcome-logo">
              <div className="logo-text">🔑</div>
            </div>
            <h2 className="form-title">အကောင့်ရှိပြီးပါပြီး</h2>
            <p className="form-subtitle">
              ဒီအီးမေးလ်/ဖုန်းနံပါတ်ဖြင့် အကောင့်ရှိပြီး Member Card လဲ ပြုလုပ်ပြီးပါပြီး
            </p>
            <div className="existing-user-card">
              <div className="user-info">
                <h3>Account Information</h3>
                <p>📧 {formData.email}</p>
                <p>📱 {formData.phoneNumber}</p>
                <div className="status-badge">
                  <span className="badge completed">✓ Member Card Completed</span>
                </div>
              </div>
            </div>
            <div className="login-options">
              <p className="login-instruction">
                UC ERA app တွင် login လုပ်ရန် သင်၏ UC ERA mobile app ကို အသုံးပြုပါ။
              </p>
            </div>
          </div>
          <div className="form-footer">
            <button 
              className="next-button" 
              onClick={() => showNotification('UC ERA Mobile App ကို download လုပ်ပြီး login လုပ်ပါ! 📱', 'info')}
            >
              <span className="button-text">Go to Login</span>
            </button>
            <button 
              className="secondary-button" 
              onClick={() => setCurrentScreen('welcome')}
            >
              <span className="button-text">နောက်အကောင့်ဖွင့်မယ်</span>
            </button>
          </div>
        </div>
      </div>
    )
  }
  // Home Screen with login guard
  if (currentScreen === 'home') {
      if (!loggedInUser) {
    return (
      <ErrorBoundary>
        <Login onSuccess={(user) => { authService.saveSessionUser(user); setLoggedInUser(user) }} />
      </ErrorBoundary>
    )
  }
  return (
    <ErrorBoundary>
      <div className="app">
        <Home
          formData={formData}
          notification={notification}
          closeNotification={closeNotification}
          loggedInUser={loggedInUser}
        />
      </div>
    </ErrorBoundary>
  )
  }
  // Add debug logging
  return (
    <ErrorBoundary>
      <div className="app">
        <div className="container">
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close" onClick={closeNotification}>×</button>
            </div>
          )}
          {screenLoading && (
            <div className="screen-loading-overlay">
              <CubeLoader message={loadingMessage} />
            </div>
          )}
          <div className="welcome-section">
            <h1 className="welcome-text">
              Welcome to<br />
              UC ERA
            </h1>
          </div>
          {/* Logo positioned in absolute center of entire app */}
          <div className="logo-center">
            <img 
              src="/ucera-logo.png" 
              alt="UC ERA Logo" 
              className="ucera-logo"
            />
          </div>
          <div className="background-design">
            <div className="curve-shape"></div>
          </div>
          <div className="action-section">
            <button 
              className={`join-button ${isLoading ? 'loading' : ''}`}
              onClick={handleJoinUCEra}
              disabled={isLoading}
            >
                <span className="button-text">
              {isLoading ? 'Please wait...' : 'Join UC Era'}
                </span>
            </button>
            <p className="login-link" onClick={handleLogIn}>
              Log In
            </p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
export default App
