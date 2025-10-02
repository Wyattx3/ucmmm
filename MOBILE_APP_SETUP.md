# UC ERA Mobile App Setup Guide

UC ERA React web application ကို **Capacitor** သုံးပြီး iOS နဲ့ Android mobile apps အဖြစ် ပြောင်းလဲထားပါတယ်။

## 📱 Setup ပြီးသား Features

### ✅ Installed Platforms
- **iOS Platform** - Xcode project ready
- **Android Platform** - Android Studio project ready
- **Capacitor Core** - Native bridge configured

### ✅ Native Plugins
- `@capacitor/app` - App state management
- `@capacitor/camera` - Camera and photo access
- `@capacitor/filesystem` - File storage access
- `@capacitor/keyboard` - Keyboard control
- `@capacitor/splash-screen` - Launch screen
- `@capacitor/status-bar` - Status bar styling

### ✅ Permissions Configured
#### Android (`AndroidManifest.xml`)
- Internet access
- Camera access
- Read/Write external storage
- Media images access

#### iOS (`Info.plist`)
- Camera usage permission
- Photo library access
- Photo library add permission

## 🚀 Development Commands

### Build & Sync
```bash
# Web build လုပ်ပြီး native projects sync လုပ်မယ်
npm run mobile:sync

# Native projects ကို update လုပ်မယ်
npm run mobile:update

# Sync only (without build)
npm run cap:sync
```

### iOS Development
```bash
# Xcode open လုပ်မယ်
npm run ios:open

# iOS simulator မှာ run မယ်
npm run ios:run

# iOS build လုပ်မယ်
npm run ios:build
```

### Android Development
```bash
# Android Studio open လုပ်မယ်
npm run android:open

# Android emulator မှာ run မယ်
npm run android:run

# Android build လုပ်မယ်
npm run android:build
```

## 📋 Requirements

### macOS (iOS development အတွက်)
- **Xcode 14+** - App Store ကနေ download လုပ်ပါ
- **CocoaPods** - iOS dependencies management
  ```bash
  sudo gem install cocoapods
  ```
- **Command Line Tools**
  ```bash
  xcode-select --install
  ```

### Android Development
- **Android Studio** - [Download here](https://developer.android.com/studio)
- **Java JDK 17** - Android Studio နဲ့ တူတူ install လုပ်ထားရမယ်
- **Android SDK 33+** - Android Studio မှာ install လုပ်ပါ

### General
- **Node.js 16+**
- **npm 7+**

## 🔧 First Time Setup

### 1. iOS Setup (macOS only)

```bash
# CocoaPods dependencies install လုပ်မယ်
cd ios/App
pod install
cd ../..

# Xcode open လုပ်မယ်
npm run ios:open
```

**Xcode မှာ:**
1. Signing & Capabilities tab ကို သွားပါ
2. Development Team ကို ရွေးပါ (Apple Developer Account လိုပါတယ်)
3. Bundle Identifier ကို unique လုပ်ပါ (e.g., `com.yourcompany.ucera`)
4. Run button ကို နှိပ်ပြီး simulator/device မှာ test လုပ်ပါ

### 2. Android Setup

```bash
# Android Studio open လုပ်မယ်
npm run android:open
```

**Android Studio မှာ:**
1. Project ကို sync လုပ်ပါ (Gradle sync အလိုအလျောက် run မယ်)
2. AVD Manager မှာ emulator create လုပ်ပါ (သို့) real device connect လုပ်ပါ
3. Run button ကို နှိပ်ပြီး test လုပ်ပါ

### 3. CocoaPods Encoding Issue Fix (iOS)

CocoaPods error ဖြစ်ရင် shell configuration file မှာ UTF-8 encoding set လုပ်ပါ:

```bash
# ~/.zshrc သို့ ~/.bash_profile မှာ ထည့်ပါ
echo 'export LANG=en_US.UTF-8' >> ~/.zshrc
source ~/.zshrc
```

ပြီးရင် pod install ပြန်လုပ်ပါ:
```bash
cd ios/App && pod install && cd ../..
```

## 📱 Configuration

### App Information
- **App Name:** UC ERA
- **Bundle ID:** com.ucera.app
- **Web Directory:** dist

### Capacitor Config (`capacitor.config.json`)
```json
{
  "appId": "com.ucera.app",
  "appName": "UC ERA",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https",
    "iosScheme": "https",
    "hostname": "app.ucera.com"
  }
}
```

## 🎨 Customization

### App Icon
1. Icon images တွေကို prepare လုပ်ပါ
2. အောက်ပါ tools တွေ သုံးပြီး generate လုပ်ပါ:
   - iOS: [MakeAppIcon](https://makeappicon.com/)
   - Android: Android Studio Image Asset Studio

### Splash Screen
```bash
# Splash screen plugin ကို configure လုပ်ပါ
# capacitor.config.json မှာ ပြင်ထားပြီးသားပါ
```

## 🔄 Update Workflow

Web app မှာ changes လုပ်ပြီးရင်:

```bash
# 1. Web build လုပ်မယ်
npm run build

# 2. Native projects sync လုပ်မယ်
npx cap sync

# 3. Native IDE မှာ run/build လုပ်မယ်
npm run ios:open    # သို့
npm run android:open
```

## 🐛 Troubleshooting

### iOS CocoaPods Error
```bash
# Shell encoding fix
export LANG=en_US.UTF-8

# CocoaPods reinstall
cd ios/App
pod deintegrate
pod install
```

### Android Gradle Error
```bash
# Gradle cache clean
cd android
./gradlew clean

# Rebuild
./gradlew assembleDebug
```

### Plugin Not Found
```bash
# Plugins reinstall
npm install
npx cap sync
```

## 📦 Production Build

### iOS (App Store)
```bash
# 1. Archive create လုပ်မယ်
npm run ios:open
# Xcode: Product → Archive

# 2. App Store Connect upload လုပ်မယ်
# Archive Organizer → Distribute App
```

### Android (Play Store)
```bash
# 1. Release APK/AAB build လုပ်မယ်
cd android
./gradlew assembleRelease  # APK
./gradlew bundleRelease    # AAB

# 2. Release file ကို sign လုပ်ပြီး upload လုပ်မယ်
```

## 📚 Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Design Guidelines](https://developer.android.com/design)
- [UC ERA Web Documentation](./README.md)

## ✨ Features ရှိပြီးသား

UC ERA mobile app မှာ web version က features အားလုံး ရှိပါတယ်:

- ✅ 7-step Myanmar cultural registration
- ✅ Real-time chat messaging
- ✅ Member card generation
- ✅ Photo upload/cropping
- ✅ Email verification with OTP
- ✅ Multi-user support
- ✅ Appwrite backend integration
- ✅ Native camera access
- ✅ File system access
- ✅ Offline capability ready

## 🎯 Next Steps

1. **App Icons & Splash Screens** - Generate and configure
2. **Deep Linking** - Configure URL schemes for app navigation
3. **Push Notifications** - Integrate Firebase Cloud Messaging
4. **Analytics** - Add Firebase Analytics or similar
5. **Store Listing** - Prepare screenshots and descriptions
6. **Beta Testing** - TestFlight (iOS) / Internal Testing (Android)
7. **Production Release** - Submit to App Store and Play Store

---

**UC ERA Development Team**  
Myanmar Cultural Registration System - Now on Mobile! 🇲🇲 📱

