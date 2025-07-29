import { useState, useEffect } from 'react'
import './App.css'
import { useRegistration } from './hooks/useRegistration'

function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome') // 'welcome', 'registration', 'dateOfBirth', 'contact', 'verification', 'success', 'passcode', 'passcodeConfirm', 'citizenship', 'city', 'finalSuccess'
  
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
    setError: setApiError
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
    phoneNumber: ''
  })

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

  // Show notification function
  const showNotification = (message, type = 'error') => {
    setNotification({ show: true, message, type })
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

  // Show API errors as notifications
  useEffect(() => {
    if (apiError) {
      showNotification(apiError, 'error')
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
    // Directly go to registration screen - no need for artificial loading
    setCurrentScreen('registration')
  }

  const handleLogIn = () => {
    showNotification('Log in feature coming soon.', 'info')
  }

  // Name formatting handler - capitalize first letter of each word
  const handleNameChange = (field, value) => {
    const formattedValue = value
      .replace(/[^a-zA-Z\s]/g, '') // Remove non-letters except spaces
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
    
    // Find first empty position
    const emptyIndex = targetArray.findIndex(digit => digit === '')
    if (emptyIndex !== -1) {
      const newCode = [...targetArray]
      newCode[emptyIndex] = number.toString()
      setTargetArray(newCode)
    }
  }

  const handlePasscodeBackspace = (isConfirm = false) => {
    const targetArray = isConfirm ? confirmPasscode : passcode
    const setTargetArray = isConfirm ? setConfirmPasscode : setPasscode
    
    // Find last filled position
    const lastFilledIndex = targetArray.map((digit, index) => digit !== '' ? index : -1).filter(index => index !== -1).pop()
    if (lastFilledIndex !== undefined) {
      const newCode = [...targetArray]
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
      
      // Increment resend count
      setResendCount(prev => prev + 1)
      
      // Set cooldown (60 seconds)
      setResendCooldown(60)
      
      // Send new OTP
      if (currentUserId && formData.email) {
        await sendOTPVerification(formData.email)
        showNotification(`New verification code sent to ${formData.email}`, 'success')
      } else {
        showNotification('Error: User session not found. Please start registration again.', 'error')
      }
    } catch (error) {
      console.error('❌ Resend Error:', error)
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

  const handleNext = async () => {
    try {
      if (currentScreen === 'registration') {
        if (formData.firstName && formData.lastName) {
          await registerNames({
            firstName: formData.firstName,
            middleName: formData.middleName,
            lastName: formData.lastName
          })
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
          // Convert DD/MM/YYYY to ISO format for database
          const [day, month, year] = formData.dateOfBirth.split('/')
          const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
          
          await registerDateOfBirth(isoDate)
          setCurrentScreen('contact')
        } else {
          showNotification('Please enter your complete date of birth (DD/MM/YYYY)', 'error')
        }
      } else if (currentScreen === 'contact') {
        if (formData.email && formData.phoneNumber) {
          if (!validateEmail(formData.email)) {
            showNotification('Please enter a valid email address', 'error')
            return
          }
          if (formData.phoneNumber.length < 6) {
            showNotification('Please enter a valid phone number', 'error')
            return
          }
          
          await registerContact({
            email: formData.email,
            phoneNumber: formData.phoneNumber,
            countryCode: selectedCountry.code
          })
          
          // Reset resend stats when entering verification
          setResendCount(0)
          setResendCooldown(0)
          
          // Send OTP automatically
          await sendOTPVerification(formData.email)
          setCurrentScreen('verification')
          showNotification(`Verification code sent to ${formData.email}`, 'success')
        } else {
          showNotification('Please fill in both email and phone number', 'error')
        }
      } else if (currentScreen === 'verification') {
        const code = verificationCode.join('')
        if (code.length === 6) {
          await verifyOTP(code)
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
            await setupPasscode(originalCode)
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
          await registerCitizenship(selectedCitizenships)
          setCurrentScreen('city')
        } else {
          showNotification('Please select at least one citizenship', 'error')
        }
      } else if (currentScreen === 'city') {
        if (selectedCity) {
          await registerCity(selectedCity)
          setCurrentScreen('finalSuccess')
        } else {
          showNotification('Please select your living city', 'error')
        }
      }
    } catch (error) {
      console.error('❌ API Error:', error)
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
            <button className="next-button" onClick={() => showNotification('Welcome to UC ERA! 🎉', 'success')}>
              Get Started
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
            <button className="next-button" onClick={handleNext}>
              Next
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
            <button className="next-button" onClick={handleNext}>
              Next
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
            <button className="next-button" onClick={handleNext}>
              Confirm
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
            <button className="next-button" onClick={handleNext}>
              Next
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
          
          <div className="success-screen">
            <div className="success-icon">
              <div className="checkmark-circle">
                <div className="checkmark">✓</div>
              </div>
            </div>
            
            <h2 className="success-title">Great, that matches!</h2>
          </div>

          <div className="form-footer">
            <button className="next-button" onClick={handleNext}>
              Next
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
            <button className="next-button" onClick={handleNext}>
              Verify
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
            <button className="next-button" onClick={handleNext}>
              Next
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
            <button className="next-button" onClick={handleNext}>
              Next
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
              <p className="form-hint">(ပြီမရှိရင်ထားခဲ့ပါ)</p>
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
            <button className="next-button" onClick={handleNext}>
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="container">
        {notification.show && (
          <div className={`notification ${notification.type}`}>
            <span className="notification-message">{notification.message}</span>
            <button className="notification-close" onClick={closeNotification}>×</button>
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
            {isLoading ? 'Please wait...' : 'Join UC Era'}
          </button>
          <p className="login-link" onClick={handleLogIn}>
            Log In
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
