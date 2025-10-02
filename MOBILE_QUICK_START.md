# 🚀 UC ERA Mobile App - Quick Start Guide

UC ERA ကို **iOS နဲ့ Android mobile apps** အဖြစ် အသုံးပြုနိုင်ပါပြီ! 

## ⚡ မြန်မြန်ဆန်ဆန် စတင်နည်း

### 1️⃣ Dependencies Install လုပ်ပါ

```bash
cd /Users/apple/Downloads/ucmmmm/ucmmm
npm install
```

### 2️⃣ Web Build လုပ်ပါ

```bash
npm run build
```

### 3️⃣ Platform ရွေးပါ

#### 🍎 iOS (macOS လိုပါတယ်)

```bash
# Xcode open လုပ်မယ်
npm run ios:open
```

**iOS Setup လုပ်ရမယ်:**
1. CocoaPods install လုပ်ပါ: `sudo gem install cocoapods`
2. Encoding fix: `echo 'export LANG=en_US.UTF-8' >> ~/.zshrc && source ~/.zshrc`
3. Dependencies install: `cd ios/App && pod install && cd ../..`
4. Xcode မှာ signing setup လုပ်ပါ
5. Simulator ရွေးပြီး Run နှိပ်ပါ

#### 🤖 Android

```bash
# Android Studio open လုပ်မယ်
npm run android:open
```

**Android Setup လုပ်ရမယ်:**
1. [Android Studio](https://developer.android.com/studio) download လုပ်ပါ
2. JDK 17 install လုပ်ပါ
3. Android SDK 33+ install လုပ်ပါ
4. Emulator create လုပ်ပါ (သို့) real device connect လုပ်ပါ
5. Run button နှိပ်ပါ

## 📱 Mobile Scripts

### တစ်ခါတည်း Build & Sync
```bash
npm run mobile:sync        # Build + Sync နှစ်ခုလုံး
```

### iOS Commands
```bash
npm run ios:open          # Xcode open
npm run ios:run           # Simulator မှာ run
npm run ios:build         # Production build
```

### Android Commands
```bash
npm run android:open      # Android Studio open
npm run android:run       # Emulator မှာ run
npm run android:build     # Production build
```

### Sync Commands
```bash
npm run cap:sync          # Native projects sync
npm run cap:copy          # Web files copy only
npm run cap:update        # Plugins update
```

## 🎯 Development Workflow

```bash
# 1. Web code ပြင်မယ်
# edit src/App.jsx, etc.

# 2. Build & sync လုပ်မယ်
npm run mobile:sync

# 3. Native app မှာ test လုပ်မယ်
npm run ios:run         # သို့
npm run android:run
```

## ⚠️ Common Issues

### iOS: CocoaPods Error
```bash
export LANG=en_US.UTF-8
cd ios/App && pod install && cd ../..
```

### Android: Java Not Found
Android Studio Settings → Build Tools → Gradle → JDK location check လုပ်ပါ

### Changes မပေါ်ဘူး
```bash
# Clean build လုပ်ပါ
npm run build
npx cap sync
# Native IDE မှာ clean build ပြန်လုပ်ပါ
```

## 📖 Full Documentation

အသေးစိတ် setup guide အတွက် [MOBILE_APP_SETUP.md](./MOBILE_APP_SETUP.md) ကို ဖတ်ပါ။

## ✨ Features

Mobile app မှာ web version က features အားလုံး ပါဝင်ပါတယ်:

- ✅ 7-step registration
- ✅ Real-time chat
- ✅ Member card generation
- ✅ Photo camera/upload
- ✅ Email OTP verification
- ✅ Myanmar cultural data
- ✅ Appwrite backend
- ✅ Native mobile features

---

**Happy Mobile Development! 🚀📱**

