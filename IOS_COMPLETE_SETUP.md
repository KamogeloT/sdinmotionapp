# Complete iOS Setup Guide for SDINMOTION App

This comprehensive guide covers everything needed to build and deploy the SDINMOTION app on iOS.

## 📋 Prerequisites

### Hardware
- **Mac computer** (macOS 11.0 or later)
- **iOS device** for testing (iPhone 6s or later, iOS 14.0+)
- **USB cable** for device connection

### Software
- **Xcode 14.0+** ([Download from Mac App Store](https://apps.apple.com/app/xcode/id497799835))
- **Node.js 18+** and npm
- **CocoaPods** (for iOS dependencies)
- **iOS Developer Account** (for App Store deployment)

### Install Required Tools

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install CocoaPods
sudo gem install cocoapods

# Verify installations
node --version   # Should be 18+
npm --version
pod --version
```

---

## 🔧 Project Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to project
cd fault-reporting-mobile-app

# Install npm packages
npm install

# Install iOS pods
cd ios/App
pod install
cd ../..
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy the example (if you haven't already)
touch .env

# Edit with your favorite editor
nano .env
```

Add your Bitrix24 configuration:
```bash
VITE_BITRIX24_WEBHOOK_URL=https://www.sdinmotion.co.za/rest/1/YOUR_WEBHOOK_CODE/
VITE_BITRIX24_USER_ID=1
VITE_BITRIX24_GROUP_WATER=5
VITE_BITRIX24_GROUP_ELECTRICITY=6
VITE_BITRIX24_GROUP_ROADS=7
VITE_BITRIX24_GROUP_WASTE=8
```

**See `ENV_SETUP.md` for full configuration details.**

### 3. Build Web Assets

```bash
# Build the web app (embeds environment variables)
npm run build

# Verify dist/ folder was created
ls -la dist/
```

### 4. Sync with iOS

```bash
# Copy web assets to iOS project
npx cap sync ios

# This will:
# - Copy dist/ to ios/App/App/public/
# - Update capacitor.config.json
# - Install/update Capacitor plugins
```

---

## 🏗️ Building in Xcode

### 1. Open Project

```bash
# Open Xcode
npx cap open ios

# OR manually:
# open ios/App/App.xcworkspace
```

**⚠️ Important:** Always open `App.xcworkspace`, NOT `App.xcodeproj`!

### 2. Configure Signing

1. Select **App** target in Xcode
2. Go to **Signing & Capabilities** tab
3. Check **Automatically manage signing**
4. Select your **Team** (Apple Developer Account)
5. Xcode will create provisioning profile automatically

### 3. Configure App Icon (Optional)

1. Navigate to `ios/App/App/Assets.xcassets/AppIcon.appiconset`
2. Replace icon images with your custom icons
3. Required sizes: 20pt, 29pt, 40pt, 60pt (all @2x and @3x)

### 4. Select Device

- For **testing**: Select your connected iPhone
- For **simulator**: Select any iPhone simulator

### 5. Build and Run

**Method 1: Xcode UI**
- Click ▶️ (Play) button in Xcode toolbar

**Method 2: Command Line**
```bash
# Build for simulator
xcodebuild -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 14' \
  build

# Build for device
xcodebuild -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  build
```

---

## 📱 Testing on Physical Device

### 1. Enable Developer Mode (iOS 16+)

On your iPhone:
1. Go to **Settings** → **Privacy & Security**
2. Scroll to **Developer Mode**
3. Turn it **ON**
4. Restart device

### 2. Trust Developer Certificate

1. Connect iPhone to Mac
2. Build and run from Xcode
3. On iPhone: Go to **Settings** → **General** → **VPN & Device Management**
4. Tap your Apple ID under **Developer App**
5. Tap **Trust**

### 3. Test All Features

**Camera:**
- ✅ Take photo of fault
- ✅ Select from gallery
- ✅ Photo preview displays

**GPS Location:**
- ✅ Grant location permission
- ✅ GPS coordinates captured
- ✅ Address reverse geocoding

**Network:**
- ✅ Submit report with photo
- ✅ Task created in Bitrix24
- ✅ Photo attached to task

**Offline:**
- ✅ App works offline
- ✅ Reports saved locally
- ✅ Sync when online

---

## 🚀 App Store Deployment

### 1. Create App Store Connect Record

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click **My Apps** → **+** → **New App**
3. Fill in details:
   - **Platform:** iOS
   - **Name:** SDINMOTION
   - **Bundle ID:** com.municipality.faultreporter
   - **SKU:** sdinmotion-fault-reporter
   - **User Access:** Full Access

### 2. Prepare App Information

**Required Assets:**
- App icon (1024×1024 px, PNG, no transparency)
- Screenshots (iPhone 6.7" and 5.5" required)
- Privacy policy URL (see `PRIVACY_POLICY.md`)

**App Description:**
```
Report municipal faults quickly and easily with SDINMOTION.

Features:
• Report water, electricity, road, and waste issues
• Take photos of faults
• GPS location tracking
• Real-time status updates
• Offline support
• Direct integration with municipal systems

Perfect for residents to report issues and help maintain their municipality.
```

**Keywords:**
```
municipal, fault reporting, public services, water, electricity, roads, waste, maintenance
```

### 3. Archive and Upload

**In Xcode:**

1. Select **Any iOS Device (arm64)** as destination
2. Go to **Product** → **Archive**
3. Wait for archive to complete
4. In **Organizer** window:
   - Select your archive
   - Click **Distribute App**
   - Choose **App Store Connect**
   - Click **Upload**
   - Wait for processing

**OR via Command Line:**

```bash
# Archive
xcodebuild -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath build/App.xcarchive \
  archive

# Export for App Store
xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportPath build/ \
  -exportOptionsPlist ExportOptions.plist
```

### 4. Submit for Review

1. In App Store Connect, select your app
2. Click **+** next to **iOS App**
3. Enter version: **1.7.7**
4. Fill in **What's New** (see `RELEASE_NOTES_v1.7.7.md`)
5. Upload screenshots
6. Add app preview video (optional but recommended)
7. Set pricing (Free)
8. Submit for review

**Review typically takes 1-3 days.**

---

## 🔧 iOS-Specific Features & Configurations

### Permissions Configured

All permissions are already configured in `Info.plist`:

```xml
<!-- Camera -->
<key>NSCameraUsageDescription</key>
<string>This app needs access to your camera to take photos of municipal faults.</string>

<!-- Photo Library -->
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to your photo library to select fault images.</string>

<!-- Location -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs your location to report fault locations accurately.</string>
```

### iOS-Specific Capacitor Plugins

```typescript
// capacitor.config.ts
{
  plugins: {
    Camera: {
      presentationStyle: 'popover'  // iOS-specific: Shows picker as popover on iPad
    },
    Geolocation: {}
  }
}
```

### Supported iOS Versions

- **Minimum:** iOS 14.0
- **Target:** iOS 17.0
- **Devices:** iPhone, iPad (Universal)

### iOS Build Settings

**Current Configuration:**
- **Version:** 1.7.7 (MARKETING_VERSION)
- **Build:** 17 (CURRENT_PROJECT_VERSION)
- **Bundle ID:** com.municipality.faultreporter
- **Deployment Target:** iOS 14.0
- **Swift Version:** 5.0
- **Device Family:** iPhone & iPad

---

## 🧪 Debugging on iOS

### Xcode Console

View logs in Xcode:
1. Run app from Xcode
2. Open **Debug Area** (Cmd+Shift+Y)
3. See console output with timestamps

### Safari Web Inspector

Debug web content:
1. On iPhone: **Settings** → **Safari** → **Advanced** → **Web Inspector** (ON)
2. On Mac: **Safari** → **Develop** → [Your iPhone] → SDINMOTION
3. Use Web Inspector like Chrome DevTools

### View Device Logs

```bash
# Install libimobiledevice
brew install libimobiledevice

# Stream logs
idevicesyslog | grep "capacitor"
```

---

## 🔄 Updating the App

### Code Changes

```bash
# 1. Make changes to src/
# 2. Rebuild
npm run build

# 3. Sync
npx cap sync ios

# 4. Build in Xcode
npx cap open ios
# Then click Run ▶️
```

### Version Updates

**Update version in `ios/App/App.xcodeproj/project.pbxproj`:**

```bash
# Find and update:
MARKETING_VERSION = 1.7.7;     # User-visible version
CURRENT_PROJECT_VERSION = 17;   # Build number (increment for each release)
```

**OR use Xcode:**
1. Select **App** target
2. **General** tab
3. Update **Version** and **Build**

---

## ⚠️ Common iOS Issues

### Issue: "Could not find module 'Capacitor'"

**Solution:**
```bash
cd ios/App
pod install
cd ../..
npx cap sync ios
```

### Issue: "Untrusted Developer"

**Solution:**
- Settings → General → VPN & Device Management
- Trust your developer certificate

### Issue: "Unable to install"

**Solution:**
- Increment build number in Xcode
- Clean build folder: Product → Clean Build Folder
- Delete app from device
- Rebuild and install

### Issue: Camera/Location not working

**Solution:**
- Check Info.plist has usage descriptions
- Grant permissions in Settings → SDINMOTION
- Reset permissions: Settings → General → Reset → Reset Location & Privacy

### Issue: Environment variables not working

**Solution:**
- Ensure `.env` exists
- Variables start with `VITE_`
- Rebuild: `npm run build`
- Re-sync: `npx cap sync ios`
- Clean build in Xcode

---

## 📚 Additional Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)

---

## ✅ iOS Deployment Checklist

- [ ] Xcode installed and updated
- [ ] Apple Developer account active
- [ ] Environment variables configured (`.env`)
- [ ] Web app built (`npm run build`)
- [ ] iOS synced (`npx cap sync ios`)
- [ ] Pods installed (`pod install`)
- [ ] App runs in simulator
- [ ] App runs on physical device
- [ ] All features tested (camera, GPS, network)
- [ ] App icon configured
- [ ] Screenshots captured
- [ ] Privacy policy hosted
- [ ] App Store Connect record created
- [ ] Archive created successfully
- [ ] App uploaded to App Store Connect
- [ ] Submitted for review

---

**Your iOS app is now ready to deploy! 🎉**

