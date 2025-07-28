# UC ERA - Registration Application

A modern, responsive web application built with React and Vite for UC ERA user registration with comprehensive 11-step form flow, Myanmar cultural integration, and advanced input handling.

## 🚀 Features

### Complete 11-Step Registration Flow
- **Welcome Screen** - UC ERA branding with massive logo display
- **Name Registration** - Smart name input with auto-capitalization
- **Date of Birth** - Dual input methods (manual typing + calendar picker)
- **Contact Information** - Email validation and international phone number input
- **Email Verification** - Personalized OTP verification with 6-digit input and spam protection
- **Success Confirmation** - "Great, that matches!" animated success page
- **Passcode Setup** - Secure 6-digit passcode creation with number pad
- **Passcode Confirmation** - Passcode verification with mismatch detection
- **Citizenship Selection** - Myanmar ethnic groups selector (max 3 selections)
- **Living City Selection** - Myanmar cities selection with Unicode support
- **Final Success** - "Thanks for that - We've verified your UC ERA account"

### Advanced Input Handling
- **Name Formatting**: Auto-capitalize, filter invalid characters, clean spacing
- **Date Input**: DD/MM/YYYY format with calendar picker option
- **Phone Numbers**: Country code selector with 10 international formats
- **Email Validation**: Standard email format checking
- **OTP Input**: Smart 6-digit verification with auto-focus navigation
- **Passcode Input**: Secure 6-digit passcode with visual dots and number pad

### Myanmar Cultural Integration
- **16 Ethnic Groups**: Comprehensive Myanmar ethnic minorities recognition
- **Unicode Text Support**: Proper Myanmar script display (ဗမာ, ရှမ်း, ကရင်, etc.)
- **16 Major Cities**: Complete Myanmar geographical coverage
- **Cultural Sensitivity**: Respectful naming and representation
- **Multi-Selection Support**: Up to 3 ethnic groups for dual/multiple heritage
- **Local Language Hints**: Myanmar text for user guidance

### Anti-Spam Protection System
- **60-Second Cooldown Timer**: Prevents rapid resend requests with real-time countdown
- **3-Attempt Limit**: Maximum 3 resend attempts per verification session
- **Smart Button States**: Dynamic text showing "Wait Xs", "Max attempts reached"
- **Progress Counter**: Shows "X/3 attempts used" to inform users
- **Session Reset**: Fresh 3 attempts when re-entering verification screen
- **Professional Error Handling**: Clear messages about limitations and timeouts

### International Phone Support
- **10 Countries Supported**: Myanmar, Thailand, USA, UK, Singapore, Malaysia, Indonesia, Vietnam, India, China
- **Country Flags & Names**: Visual country selector with flag emojis
- **Format-Specific Validation**: Each country has its own phone number format
- **Dynamic Placeholders**: Shows expected format based on selected country

### In-Website Notification System
- **Error Notifications**: Red themed with clear error messages
- **Success Notifications**: Green themed for positive feedback
- **Info Notifications**: Blue themed for informational messages
- **Auto-Hide Feature**: Notifications disappear after 5 seconds
- **Manual Close**: Users can manually close notifications with × button
- **Slide Animation**: Smooth slideDown animation for notification appearance

### Clean UI Experience
- **Hidden Scrollbars**: Cross-browser scrollbar hiding for clean interface
- **Scroll Functionality Preserved**: Users can still scroll with wheel/touch
- **Professional Appearance**: Mobile-app-like experience without visual clutter
- **Space Optimization**: More screen real estate for content

## 🛠️ Technology Stack

- **React 19.1.0** - Latest React with functional components
- **Vite 7.0.4** - Fast build tool and development server
- **CSS3** - Modern styling with flexbox, gradients, and animations
- **ES6+** - Modern JavaScript features
- **HTML5** - Semantic markup with native date picker integration

## 📱 Responsive Design

- **Mobile-First Approach** - Optimized for mobile devices
- **Adaptive Layout** - Scales beautifully from mobile to desktop
- **Touch-Friendly** - Large buttons and touch targets
- **Safe Areas** - Respects device safe areas and notches
- **Hidden Scrollbars** - Clean interface across all devices

## 🎨 UI/UX Features

### Visual Design
- **Modern Banking UI** - Clean, professional interface
- **UC ERA Branding** - Custom logo integration and theme
- **Gradient Buttons** - Eye-catching call-to-action elements
- **Smooth Animations** - Loading states, checkmark animations, and hover effects
- **Error States** - Visual feedback for validation errors
- **Success Animations** - Checkmark circle with scale-in and pop effects

### User Experience
- **Multi-Step Navigation** - Clear progress through 11-step registration
- **Smart Input Focus** - Automatic input management and validation
- **Personalized Messages** - Dynamic content based on user input
- **Instant Feedback** - Real-time validation and error messages
- **Accessibility** - Keyboard navigation and screen reader support
- **Visual Dots** - Passcode progress indication with filled circles

### Advanced Passcode System
- **Number Pad Interface** - Touch-friendly 0-9 keypad with backspace
- **Visual Feedback** - Animated dots showing passcode progress
- **Secure Input** - Password-type inputs with visual masking
- **Smart Navigation** - Auto-advance and backspace handling
- **Validation Logic** - Real-time passcode matching verification
- **Error Handling** - Clear mismatch notifications with retry option

## 📁 Project Structure

```
src/
├── App.jsx          # Main application component with all logic
├── App.css          # Complete styling for all components
├── index.css        # Global styles and resets
└── main.jsx         # React application entry point

public/
└── ucera-logo.png   # UC ERA brand logo
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd ucera-registration
```

2. Install dependencies
```bash
npm install
```

3. Add UC ERA logo
```bash
# Copy your logo file to public/ucera-logo.png
cp /path/to/your/logo.png public/ucera-logo.png
```

4. Start development server
```bash
npm run dev
```

5. Open browser
```
http://localhost:5173
```

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔄 Complete 11-Step Registration Flow

### Step 1: Welcome Screen
- UC ERA branding and massive logo display (1200px)
- "Join UC Era" call-to-action button with loading animation
- "Log In" option (placeholder functionality)

### Step 2: Name Registration
- **First Name** (required) - Auto-capitalization, character filtering
- **Middle Name(s)** (optional) - Myanmar hint: "(ပြီမရှိရင်ထားခဲ့ပါ)"
- **Last Name** (required) - Auto-capitalization, character filtering
- **Navigation**: Back to welcome, Next to date of birth

### Step 3: Date of Birth
- **Personalized Question**: "When were you born, [Full Name]?"
- **Manual Input**: DD/MM/YYYY format with real-time validation
- **Calendar Picker**: Native HTML5 date picker option
- **Advanced Validation**: Leap year checking, valid date ranges, no future dates
- **Error Feedback**: Specific error messages for invalid dates

### Step 4: Contact Information
- **Email Address** - Standard email format validation
- **Phone Number** - International format with country selector
- **Country Selection** - 10 countries with flags and specific formats
- **Dynamic Formatting** - Auto-format based on selected country

### Step 5: Email Verification
- **Personalized Message**: "We sent it to [user's email]"
- **6-Digit OTP Input** - Individual input boxes with auto-focus
- **Smart Navigation** - Auto-advance and backspace handling
- **Resend Protection** - 60-second cooldown with 3-attempt limit
- **Spam Prevention** - Anti-abuse measures with clear feedback

### Step 6: Success Confirmation
- **Animated Checkmark** - Scale-in animation with pop effect
- **Success Message**: "Great, that matches!"
- **Visual Feedback** - Blue gradient circle with checkmark icon
- **Smooth Transition** - Animated progression to next step

### Step 7: Passcode Setup
- **Security Message**: "Please choose a 6-digit passcode"
- **Visual Dots** - 6 circles showing input progress
- **Number Pad** - Interactive 0-9 keypad with backspace
- **Touch Optimized** - Large buttons with hover/active states
- **Security Guidance** - "Don't share it with anyone" warning

### Step 8: Passcode Confirmation
- **Confirmation Request**: "Please enter your 6-digit passcode again"
- **Matching Validation** - Real-time comparison with original
- **Error Handling** - Clear mismatch messages with retry
- **Visual Feedback** - Same dot interface with validation

### Step 9: Citizenship Selection
- **Myanmar Ethnic Groups** - 16 comprehensive ethnic minorities
- **Multi-Selection** - Choose up to 3 citizenships
- **Unicode Support** - Proper Myanmar script (ဗမာ, ရှမ်း, ကရင်, etc.)
- **Visual Selection** - Checkboxes with blue highlight
- **Progress Counter** - "X/3 selected" feedback
- **Cultural Sensitivity** - Respectful representation

### Step 10: Living City Selection
- **Myanmar Cities** - 16 major cities with Unicode names
- **Single Selection** - Radio-button style selection
- **Geographic Coverage** - Yangon, Mandalay, Naypyidaw, etc.
- **"Other City" Option** - For unlisted locations
- **Visual Feedback** - Selected city highlighted

### Step 11: Final Success
- **Completion Message**: "Thanks for that"
- **Account Confirmation**: "We've verified your UC ERA account"
- **Animated Checkmark** - Same success animation as Step 6
- **Get Started Button** - Final call-to-action

## 🔧 Advanced Form Validation

### Name Inputs
- Remove non-alphabetic characters
- Auto-capitalize first letter of each word
- Clean multiple spaces
- Real-time formatting

### Date of Birth
- DD/MM/YYYY format enforcement
- Day validation (1-31 based on month/year)
- Month validation (1-12)
- Year validation (1900-current year)
- Leap year calculations
- Future date prevention
- Real-time error display

### Email Validation
- Standard regex pattern matching
- Real-time validation feedback
- Clear error messages

### Phone Number
- Country-specific formatting
- Numeric input only
- Length validation
- Dynamic placeholders

### OTP Verification
- 6-digit numeric input only
- Auto-focus management
- Smart backspace handling
- Complete code validation
- Resend spam protection

### Passcode System
- 6-digit secure input with visual masking
- Number pad interface with touch optimization
- Real-time validation and matching
- Error handling with retry capability

### Myanmar Selections
- Multi-citizenship validation (max 3)
- Single city selection validation
- Required field enforcement
- Cultural name handling

## 🎯 Key Components & Functions

### State Management
- `currentScreen` - Controls 11-step navigation flow
- `formData` - Stores all user input across steps
- `isLoading` - Loading states for buttons
- `selectedCountry` - Phone number country selection
- `verificationCode` - 6-digit OTP array
- `passcode` - 6-digit passcode array
- `confirmPasscode` - 6-digit confirmation array
- `selectedCitizenships` - Array of selected ethnic groups (max 3)
- `selectedCity` - Single selected Myanmar city
- `dateError` - Date validation error display
- `notification` - In-website notification system
- `resendCooldown` - Anti-spam timer for resend button
- `resendCount` - Tracks resend attempts (max 3)

### Validation Functions
- `validateDate()` - Comprehensive date validation
- `validateEmail()` - Email format checking
- `isLeapYear()` - Leap year calculation
- `getDaysInMonth()` - Dynamic month day calculation

### Input Handlers
- `handleNameChange()` - Name formatting and validation
- `handleDateChange()` - Date input formatting and validation
- `handlePhoneChange()` - Phone number formatting by country
- `handleVerificationCodeChange()` - OTP input management
- `handlePasscodeChange()` - Passcode input with auto-focus
- `handleNumberPadClick()` - Number pad interaction
- `handlePasscodeBackspace()` - Smart backspace for passcode
- `toggleCitizenship()` - Multi-selection for ethnic groups
- `resendCode()` - Spam-protected code resend functionality

### Utility Functions
- `getFullName()` - Dynamic name concatenation
- `convertToDateInput()` - Date format conversion
- `showNotification()` - In-website notification display
- `getResendButtonText()` - Dynamic resend button states

### Myanmar Integration Functions
- `myanmarEthnicGroups` - 16 ethnic groups with Unicode names
- `myanmarCities` - 16 major cities with bilingual names

## 🎨 Styling Features

### CSS Architecture
- Mobile-first responsive design
- Flexbox layouts for form components
- CSS Grid for complex layouts
- Custom animations and transitions
- Cross-browser scrollbar hiding

### Color Scheme
- Primary: #2563eb (Blue)
- Success: #16a34a (Green)
- Error: #dc2626 (Red)
- Warning: #f59e0b (Yellow)
- Gray scale: #f8f9fa to #1f2937

### Interactive Elements
- Hover effects on buttons with scale transforms
- Focus states for inputs with blue highlighting
- Loading animations with spinner effects
- Smooth transitions for all state changes
- Visual feedback for all user interactions

### Advanced Animations
- **Success Checkmark**: Scale-in + pop animation sequence
- **Passcode Dots**: Fill animation with blue gradient
- **Number Pad**: Scale effects on touch with smooth transitions
- **Selection Items**: Hover states with background color transitions

### Scrollbar Management
- **Cross-Browser Hiding**: Firefox (`scrollbar-width: none`), Chrome/Safari (`::-webkit-scrollbar`), IE/Edge (`-ms-overflow-style`)
- **Functionality Preserved**: Users can still scroll with mouse wheel and touch
- **Clean Interface**: No visual scrollbar clutter across all screens

## 🚀 User Experience Enhancements

### Smart Input Features
- Auto-capitalization for names
- Real-time formatting for phone and date
- Auto-focus for OTP and passcode inputs
- Dynamic placeholders
- Clear error messaging

### Visual Feedback
- Loading states during transitions
- Error highlighting with colors
- Success confirmations with animations
- Progress indicators for multi-step process
- Smooth animations throughout

### Accessibility
- Keyboard navigation support
- Screen reader friendly
- High contrast ratios
- Touch-friendly sizing (44px minimum)
- Semantic HTML structure

### Cultural Sensitivity
- Respectful Myanmar ethnic group representation
- Proper Unicode text handling
- Cultural naming conventions
- Multi-heritage recognition (up to 3 citizenships)

## 🌍 Myanmar Cultural Integration

### Ethnic Groups Recognition (16 Groups)
- **Major Groups**: Bamar (ဗမာ), Shan (ရှမ်း), Karen (ကရင်), Rakhine (ရခိုင်)
- **Hill Tribes**: Mon (မွန်), Chin (ချင်း), Kachin (ကချင်), Kayah (ကယား)
- **Border Groups**: Wa (ဝ), Palaung (ပလောင်), Lahu (လဟူ), Lisu (လီဆူ)
- **Smaller Groups**: Akha (အခါ), Naga (နာဂါ), Danu (ဒဂုံ)
- **Inclusive Option**: "Other Myanmar Ethnic Group"

### Geographic Coverage (16 Cities)
- **Major Cities**: Yangon (ရန်ကုန်), Mandalay (မန္တလေး), Naypyidaw (နေပြည်တော်)
- **Historical**: Bagan (ပုဂံ), Mawlamyine (မော်လမြိုင်)
- **Regional Capitals**: Taunggyi (တောင်ကြီး), Myitkyina (မြစ်ကြီးနား), Sittwe (စစ်တွေ)
- **Commercial Centers**: Pathein (ပုသိမ်), Monywa (မုံရွာ), Lashio (လားရှိုး)
- **State Capitals**: Hpa-An (ဘားအံ), Loikaw (လွိုင်ကေါ်)
- **Other Cities**: Meiktila (မိတ္ထီလာ), Pyay (ပြည်), plus "Other City" option

### Technical Implementation
- **Unicode Support**: Proper Myanmar script rendering
- **Multi-Selection Logic**: Citizenship array management (max 3)
- **Single Selection**: City radio-button implementation
- **Validation**: Required field enforcement
- **Cultural Respect**: Sensitive naming and representation

## ⚡ Performance Optimizations

### React Optimizations
- Functional components with hooks
- Efficient state management
- Minimal re-renders
- Event handler optimization

### CSS Optimizations
- Efficient selectors
- Hardware-accelerated animations
- Minimal layout thrashing
- Optimized media queries
- Hidden scrollbars for cleaner performance

### User Experience
- Instant feedback on interactions
- Preloaded states
- Smooth transitions
- Progressive enhancement

## 🔮 Future Enhancements

### Planned Features
- **Backend Integration** - API endpoints for registration
- **Database Storage** - User data persistence
- **Email Service** - Real OTP sending via email
- **SMS Verification** - Phone number verification option
- **Social Login** - OAuth integration (Google, Facebook)
- **Progressive Web App** - Offline capability and app-like experience

### Technical Improvements
- **TypeScript Migration** - Type safety and better developer experience
- **Testing Suite** - Unit tests and integration tests
- **Performance Monitoring** - Analytics and performance tracking
- **Error Boundary** - Better error handling and recovery
- **Internationalization** - Multi-language support beyond Myanmar
- **Accessibility Audit** - WCAG compliance improvements

### Security Enhancements
- **Rate Limiting** - Server-side spam protection
- **CAPTCHA Integration** - Bot protection
- **Email Verification** - Real email confirmation
- **Phone Verification** - SMS OTP verification
- **Data Encryption** - Secure data transmission
- **Input Sanitization** - XSS protection
- **Passcode Security** - Encrypted storage and transmission

## 🔒 Security Features

### Client-Side Security
- Input validation and sanitization
- XSS prevention through React's built-in protections
- No sensitive data stored in localStorage
- Secure form handling
- Passcode masking with password inputs

### Anti-Spam Measures
- Resend cooldown timer (60 seconds)
- Maximum attempt limits (3 per session)
- Button state management
- User feedback for limitations

### Data Protection
- No persistent storage of sensitive data
- Secure state management
- Clean session handling
- Privacy-conscious design
- Passcode validation without storage

## 📱 Mobile Experience

### Touch Optimization
- Large touch targets (44px minimum)
- Swipe-friendly navigation
- Mobile keyboard optimization
- Responsive touch feedback
- Number pad optimized for mobile interaction

### Performance
- Fast loading times
- Smooth animations
- Efficient scrolling with hidden scrollbars
- Battery-conscious design

### Layout
- Mobile-first design approach
- Safe area considerations
- Orientation support
- Flexible layouts

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email support@ucera.com or create an issue in this repository.

---

**Built with ❤️ for UC ERA by the development team**
