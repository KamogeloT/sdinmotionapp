# Android Release v1.8.0 - SDINMOTION

## 📱 Version Information

- **Version Name:** 1.8.0
- **Version Code:** 18
- **Release Date:** November 16, 2025
- **Platform:** Android
- **Bundle ID:** com.municipality.faultreporter

---

## 🚀 What's New in v1.8.0

### Major Updates

#### ✅ iOS Platform Support
- Complete iOS app implementation with TestFlight deployment
- Cross-platform feature parity between iOS and Android
- Consistent user experience across all devices

#### 🎨 Branding Improvements
- Updated app display name to **SDINMOTION**
- Professional branding across all platforms
- Improved app store presence

#### 📚 Enhanced Documentation
- Complete TestFlight deployment guide
- Mac quick start guide for developers
- Comprehensive iOS setup documentation
- Environment variables configuration guide

#### 🤖 Automated Deployment
- TestFlight deployment scripts
- iOS build automation
- Streamlined release process

### Maintained Stability

#### ✅ Photo Upload Reliability (from v1.7.7)
- All photo uploads successfully attach to Bitrix24 tasks
- Standardized image format (JPEG, 60% quality, max 1600px)
- Consistent file sizes (500KB-1MB) for reliable uploads
- Works for both camera and gallery photos

#### 🔍 Debug Logging
- Comprehensive logging to device file
- Easy log retrieval via PowerShell script
- Detailed API call tracking

#### ⏱️ Network Resilience
- 60-second timeout for uploads
- Clear error messages
- Robust error handling

---

## 📦 Build Instructions

### Prerequisites

- ✅ Android Studio installed
- ✅ JDK 11 or higher
- ✅ Node.js 18+ installed
- ✅ Project dependencies installed

### Build APK (Debug)

```bash
# Build web app
npm run build

# Sync with Android
npx cap sync android

# Open in Android Studio
npx cap open android

# In Android Studio:
# Build > Build Bundle(s) / APK(s) > Build APK(s)
```

**Output:** `android/app/build/outputs/apk/debug/app-debug.apk`

---

### Build AAB (Release - Google Play)

#### Step 1: Create Keystore (First time only)

```bash
keytool -genkey -v -keystore sdinmotion-release.keystore -alias sdinmotion -keyalg RSA -keysize 2048 -validity 10000
```

**Save the passwords securely!**

#### Step 2: Configure Gradle Properties

Create `android/gradle.properties` (or edit existing):

```properties
MYAPP_UPLOAD_STORE_FILE=../sdinmotion-release.keystore
MYAPP_UPLOAD_KEY_ALIAS=sdinmotion
MYAPP_UPLOAD_STORE_PASSWORD=your-keystore-password
MYAPP_UPLOAD_KEY_PASSWORD=your-key-password
```

**⚠️ Never commit this file to Git!** (Already in .gitignore)

#### Step 3: Build Release AAB

```bash
# In project root
npm run build
npx cap sync android

# Build AAB
cd android
./gradlew bundleRelease

# Or on Windows:
gradlew.bat bundleRelease
```

**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

---

## 📤 Deployment

### Google Play Store

1. **Go to:** https://play.google.com/console/
2. **Select your app** (SDINMOTION)
3. **Production > Create new release**
4. **Upload** `app-release.aab`
5. **Release name:** 1.8.0 (18)
6. **Release notes:**

```
What's new in v1.8.0:

✅ iOS Support - Now available on iPhone via TestFlight
🎨 Improved app branding and naming
📦 Enhanced stability and reliability
🔍 Better error logging and debugging
⚡ All photo upload fixes from v1.7.7 included

Bug Fixes:
- Maintained photo upload reliability
- Standardized image processing
- Improved network timeout handling
```

7. **Review and rollout**

---

## ✅ Testing Checklist

Before deploying, verify:

### Core Features
- [ ] App launches successfully
- [ ] Login screen displays
- [ ] Map loads with user location
- [ ] All fault types selectable (Water/Electricity/Roads/Waste)

### Photo Upload
- [ ] Camera capture works
- [ ] Gallery selection works
- [ ] Photos compress to ~500KB-1MB
- [ ] Photos attach to Bitrix24 tasks
- [ ] Task created with correct group

### Location & GPS
- [ ] GPS location detected
- [ ] Location permissions requested
- [ ] Coordinates included in task

### Error Handling
- [ ] Network errors show user-friendly messages
- [ ] Upload failures display error popup
- [ ] Debug logs written to file
- [ ] Logs retrievable via script

### Performance
- [ ] App loads in < 3 seconds
- [ ] Map renders smoothly
- [ ] Photo upload completes in < 30 seconds
- [ ] No crashes or ANR (App Not Responding)

---

## 🐛 Known Issues

None reported in v1.8.0

---

## 🔄 Upgrade from v1.7.7

### Breaking Changes
None - fully backward compatible

### Migration Steps
No migration needed - users can update directly from v1.7.7

### Data Compatibility
- All existing data preserved
- No database changes
- Environment variables unchanged

---

## 📊 Version Comparison

| Feature | v1.7.7 | v1.8.0 |
|---------|--------|--------|
| **Android Support** | ✅ | ✅ |
| **iOS Support** | ❌ | ✅ |
| **Photo Upload** | ✅ Fixed | ✅ Maintained |
| **Debug Logging** | ✅ | ✅ |
| **App Name** | App | SDINMOTION |
| **TestFlight** | ❌ | ✅ |
| **Documentation** | Basic | Comprehensive |
| **Build Scripts** | Manual | Automated |

---

## 🔗 Related Documentation

- **CHANGELOG.md** - Complete version history
- **TESTFLIGHT_DEPLOYMENT.md** - iOS TestFlight guide
- **MAC_QUICK_START.md** - Mac setup instructions
- **ENV_SETUP.md** - Environment configuration
- **IOS_COMPLETE_SETUP.md** - Full iOS guide

---

## 📞 Support

**Issues?**
- Check `TROUBLESHOOTING.md`
- Review debug logs: `get-phone-logs.ps1`
- Check Bitrix24 API configuration

**Technical Details:**
- Minimum Android: 5.0 (API 21)
- Target Android: 14 (API 34)
- Capacitor: 6.x
- React: 18.x
- TypeScript: 5.x

---

## 🎉 Release Summary

**Version 1.8.0 brings iOS support to SDINMOTION!**

This release focuses on:
- ✅ Complete iOS platform support with TestFlight
- ✅ Professional app branding
- ✅ Comprehensive documentation
- ✅ Automated deployment workflows
- ✅ Maintained stability from v1.7.7

**All features from v1.7.7 are preserved and working:**
- Photo uploads
- GPS location
- Task creation
- Debug logging
- Error handling

**Ready for production deployment on both Android and iOS! 🚀**

---

## 📝 Build Files

### For Google Play Store
- **File:** `android/app/build/outputs/bundle/release/app-release.aab`
- **Format:** Android App Bundle (AAB)
- **Size:** ~15-20 MB
- **Upload to:** Google Play Console

### For Direct Distribution
- **File:** `android/app/build/outputs/apk/release/app-release.apk`
- **Format:** Android Package (APK)
- **Size:** ~20-25 MB
- **Note:** For testing only, Play Store requires AAB

---

**Build Date:** November 16, 2025  
**Build Status:** ✅ Ready for Production  
**Platforms:** Android ✅ | iOS ✅

