# Building Urmi Kitchen Android APK

## Prerequisites
- Android Studio installed
- Java JDK 17 or higher

## Quick Build (Debug APK)

### Option 1: Using Gradle (Command Line)
```bash
cd android
./gradlew assembleDebug
```
The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option 2: Using Android Studio
```bash
npx cap open android
```
Then in Android Studio:
1. Wait for Gradle sync to complete
2. Build → Build Bundle(s) / APK(s) → Build APK(s)
3. APK will be in `android/app/build/outputs/apk/debug/`

## Building Release APK (For Production)

### 1. Generate Keystore (First Time Only)
```bash
keytool -genkey -v -keystore urmi-kitchen.keystore -alias urmikitchen -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configure Signing
Create `android/key.properties`:
```
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=urmikitchen
storeFile=../urmi-kitchen.keystore
```

### 3. Build Release APK
```bash
cd android
./gradlew assembleRelease
```

## Installing on Device

### Via USB
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Via File Transfer
1. Copy APK to phone
2. Enable "Install from Unknown Sources" in Settings
3. Open APK file and install

## App Details
- **App Name**: Urmi Kitchen POS
- **Package**: com.urmikitchen.pos
- **Min SDK**: 22 (Android 5.1)
- **Target SDK**: 34 (Android 14)

## Updating the App
After making changes to your web app:
```bash
npm run build
npx cap sync
cd android
./gradlew assembleDebug
```

## Troubleshooting

### Gradle Build Failed
- Make sure JAVA_HOME is set
- Update Android SDK in Android Studio

### App Crashes on Launch
- Check `npx cap sync` was run after build
- Verify `dist` folder has the latest build

### White Screen
- Clear app data and cache
- Rebuild with `npm run build && npx cap sync`
