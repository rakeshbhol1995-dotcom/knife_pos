# Quick Start Guide - Urmi Kitchen Android App

## ✅ Setup Complete!

Your Android app is ready! Here's what's been done:
- ✅ Capacitor installed and configured
- ✅ Android platform added
- ✅ Urmi Kitchen logo set as app icon
- ✅ Web app built and synced to Android
- ✅ All files ready for building

## 🚀 Build Your APK

### Method 1: Android Studio (RECOMMENDED - Easiest)

1. **Open Android Studio:**
   ```bash
   npx cap open android
   ```

2. **Wait for Gradle Sync** (happens automatically, takes 1-2 minutes first time)

3. **Build APK:**
   - Click: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - Wait for build to complete (you'll see a notification)
   - Click **"locate"** in the notification to find your APK

4. **APK Location:**
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Method 2: Command Line (Requires Java JDK 17)

```bash
cd android
gradlew assembleDebug
```

## 📱 Install on Your Phone

1. **Transfer APK** to your Android phone (via USB, email, or cloud)
2. **Enable Unknown Sources:**
   - Settings → Security → Install Unknown Apps
   - Allow installation from your file manager
3. **Install:** Tap the APK file and install

## 🔄 Update App After Changes

When you make changes to your POS system:

```bash
# 1. Build the web app
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Rebuild APK in Android Studio
# OR
cd android
gradlew assembleDebug
```

## 📋 App Details

- **App Name:** Urmi Kitchen POS
- **Package:** com.urmikitchen.pos
- **Icon:** Urmi Kitchen logo (already set!)
- **Min Android:** 5.1 (API 22)
- **Target Android:** 14 (API 34)

## ❓ Troubleshooting

### "Gradle sync failed"
- Make sure you have Java JDK 17 installed
- Restart Android Studio

### "Build failed"
- Clean project: Build → Clean Project
- Rebuild: Build → Rebuild Project

### "App crashes on launch"
- Make sure you ran `npm run build` before `npx cap sync`
- Clear app data on phone and reinstall

## 🎉 You're Done!

Your Urmi Kitchen POS is now a native Android app!
