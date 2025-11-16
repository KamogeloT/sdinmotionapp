# TestFlight Deployment Guide - SDINMOTION iOS App

**⚠️ REQUIREMENT: This process can ONLY be done on a Mac with Xcode installed.**

This guide covers deploying the SDINMOTION iOS app to TestFlight for beta testing.

---

## 📋 Prerequisites

### Hardware & Software
- ✅ **Mac** with macOS 11.0 or later
- ✅ **Xcode 14.0+** installed ([Download](https://apps.apple.com/app/xcode/id497799835))
- ✅ **Apple Developer Account** ($99/year)
  - Enroll at: https://developer.apple.com/programs/enroll/
- ✅ **Xcode Command Line Tools** installed
  ```bash
  xcode-select --install
  ```

### Project Setup
- ✅ Code pushed to GitHub (`feature/iOS_App` branch)
- ✅ `.env` file configured with Bitrix24 webhook
- ✅ App tested and working in simulator/device

---

## 🚀 Quick Start (Automated Script)

### Option 1: Use Automated Script

```bash
# 1. Clone and setup (on Mac)
git clone https://github.com/KamogeloT/sdinmotionapp.git
cd sdinmotionapp
git checkout feature/iOS_App

# 2. Configure environment
cp .env.example .env
nano .env  # Add your Bitrix24 webhook

# 3. Run TestFlight deployment script
chmod +x testflight-deploy.sh
./testflight-deploy.sh
```

The script will:
- ✅ Install dependencies
- ✅ Build web app
- ✅ Sync with iOS
- ✅ Install pods
- ✅ Create Xcode archive
- ✅ Export for App Store
- ✅ Upload to App Store Connect

---

## 📱 TestFlight Setup (First Time Only)

### Step 1: Create App Store Connect Record

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Sign in with Apple Developer account
3. Click **My Apps** → **+** → **New App**

**Fill in details:**
- **Platforms:** ☑️ iOS
- **Name:** SDINMOTION
- **Primary Language:** English (U.S.)
- **Bundle ID:** Select `com.municipality.faultreporter`
  - If not available, you need to register it in Developer Portal first
- **SKU:** sdinmotion-fault-reporter-ios
- **User Access:** Full Access

4. Click **Create**

### Step 2: Register Bundle ID (if needed)

If Bundle ID not in dropdown:

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. **Certificates, Identifiers & Profiles**
3. **Identifiers** → **+** (Plus button)
4. Select **App IDs** → Continue
5. Select **App** → Continue
6. Fill in:
   - **Description:** SDINMOTION Fault Reporter
   - **Bundle ID:** Explicit → `com.municipality.faultreporter`
   - **Capabilities:** 
     - ☑️ Push Notifications (if needed later)
     - ☑️ App Groups (if needed later)
7. Click **Continue** → **Register**

### Step 3: Configure App Information

In App Store Connect:

1. Select your app (SDINMOTION)
2. Go to **App Information** tab

**General Information:**
- **Name:** SDINMOTION
- **Subtitle:** Municipal Fault Reporting (optional)
- **Privacy Policy URL:** https://your-domain.com/privacy (host from PRIVACY_POLICY.md)

**Category:**
- **Primary:** Utilities
- **Secondary:** Productivity (optional)

**Age Rating:**
- Click **Edit**
- Answer questions (all "No" for this app)
- Result: **4+**

---

## 🔨 Build & Archive Process

### Method 1: Using Xcode (Recommended for first time)

#### Step 1: Open Project

```bash
# In project directory
npx cap open ios
```

This opens `ios/App/App.xcworkspace` in Xcode.

#### Step 2: Configure Signing

1. Select **App** target (blue icon at top)
2. Select **Signing & Capabilities** tab
3. **Automatically manage signing:** ☑️ Checked
4. **Team:** Select your Apple Developer team
5. Xcode will automatically create provisioning profile

**Verify:**
- Status should show: ✅ "Signing Certificate: Apple Distribution"
- Profile should be created automatically

#### Step 3: Select Device

In Xcode toolbar:
- Click device selector (next to Run button)
- Select: **Any iOS Device (arm64)**
  - NOT a simulator!
  - NOT a specific device!
  - Must be "Any iOS Device" for App Store

#### Step 4: Archive

1. Menu: **Product** → **Archive**
2. Wait for archive to complete (2-5 minutes)
3. Organizer window opens automatically

**If archive fails:**
- Clean build folder: **Product** → **Clean Build Folder**
- Try again

#### Step 5: Distribute to App Store

In Organizer window:

1. Select your archive (should be selected)
2. Click **Distribute App** button
3. Choose **App Store Connect** → Next
4. Choose **Upload** → Next
5. **Distribution options:**
   - **App Thinning:** All compatible device variants
   - **Rebuild from Bitcode:** Yes (if available)
   - **Include symbols:** Yes (for crash reports)
   - **Manage Version and Build Number:** Automatically manage
6. Click **Next**
7. **Review signing:**
   - Automatic signing should be selected
   - Click **Next**
8. **Review archive contents:**
   - Verify SDINMOTION app is listed
   - Check version: 1.7.7 (17)
   - Click **Upload**
9. Wait for upload (2-10 minutes depending on connection)

**Success Message:**
"Upload Successful - Your app was successfully uploaded to App Store Connect"

#### Step 6: Wait for Processing

1. Close Organizer
2. Go to [App Store Connect](https://appstoreconnect.apple.com/)
3. Select your app → **TestFlight** tab
4. **iOS builds** section will show:
   - **Status:** "Processing" (⏳ 5-30 minutes)
   - **Version:** 1.7.7
   - **Build:** 17

**Email notification:** You'll receive email when processing completes.

---

### Method 2: Command Line (For CI/CD)

Use the automated script:

```bash
./testflight-deploy.sh
```

Or manually:

```bash
# 1. Build web app
npm install
npm run build

# 2. Sync with iOS
npx cap sync ios

# 3. Install pods
cd ios/App
pod install
cd ../..

# 4. Archive
xcodebuild -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath build/App.xcarchive \
  -destination 'generic/platform=iOS' \
  clean archive

# 5. Export for App Store
xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportPath build/ \
  -exportOptionsPlist ExportOptions.plist

# 6. Upload to App Store (requires valid credentials)
xcrun altool --upload-app \
  --type ios \
  --file build/SDINMOTION.ipa \
  --username "your-apple-id@email.com" \
  --password "@keychain:AC_PASSWORD"
```

---

## 📋 Export Options Configuration

Create `ExportOptions.plist` in project root:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <true/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <true/>
    <key>destination</key>
    <string>upload</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>stripSwiftSymbols</key>
    <true/>
</dict>
</plist>
```

**Find your Team ID:**
1. Go to [Apple Developer Account](https://developer.apple.com/account/)
2. **Membership** section
3. Copy **Team ID** (10 characters)

---

## 🧪 TestFlight Configuration

### Step 1: Add Build to TestFlight

Once processing completes (email notification):

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Select **SDINMOTION** app
3. **TestFlight** tab → **iOS builds**
4. Your build (1.7.7 - 17) should show: **Ready to Submit**

### Step 2: Export Compliance

1. Click on build **1.7.7 (17)**
2. **Export Compliance Information:**
   - **Is your app designed to use cryptography?**
     - Select: **No** (app uses standard HTTPS only)
   - If YES (don't select for this app):
     - Answer questions about encryption
3. Click **Start Internal Testing** (for immediate testing)

### Step 3: Add Internal Testers (Optional)

**Internal Testers** (up to 100, no review needed):

1. **TestFlight** tab → **Internal Group**
2. Click **Default** group or create new group
3. Click **+** to add testers
4. Enter tester's **Apple ID email address**
5. Click **Add**
6. Tester receives email invitation

**Testers can install via:**
- TestFlight app on iOS device
- Install TestFlight from App Store first
- Open invitation email → Install

### Step 4: Add External Testers (Optional)

**External Testers** (up to 10,000, requires Beta App Review):

1. **TestFlight** tab → **External Testing**
2. Click **+** (Create Group)
3. Group name: "Public Beta"
4. Add build: **1.7.7 (17)**
5. Add testers (email addresses or public link)
6. **Beta App Review Information:**
   - **Beta App Description:** Brief description of app
   - **Feedback Email:** support@municipality.gov.za
   - **Privacy Policy URL:** https://your-domain.com/privacy
7. Click **Submit for Review**

**Review time:** 1-2 days typically

---

## 📧 What Testers Receive

### Internal Testers (Immediate)
Email contains:
- App name: SDINMOTION
- Version: 1.7.7 (17)
- "View in TestFlight" button
- Installation instructions

### External Testers (After approval)
Same email format as internal testers.

### Public Link (If enabled)
You can generate a public link:
1. TestFlight → External Testing → Group
2. Enable **Public Link**
3. Share link: `https://testflight.apple.com/join/XXXXXX`
4. Anyone with link can join (up to 10,000)

---

## 📱 Testing on TestFlight

### For Testers:

1. **Install TestFlight app**
   - App Store → Search "TestFlight" → Install

2. **Accept Invitation**
   - Open email invitation
   - Tap "View in TestFlight" or "Start Testing"
   - TestFlight app opens

3. **Install SDINMOTION**
   - TestFlight shows app card
   - Tap **Install** button
   - App installs on home screen

4. **Provide Feedback**
   - Open TestFlight app
   - Select SDINMOTION
   - Tap "Send Beta Feedback"
   - Or take screenshot → Tap to annotate → Send

### For Developers:

**View Feedback:**
1. App Store Connect → TestFlight → Feedback
2. See crash logs, screenshots, feedback

**View Analytics:**
1. TestFlight → Builds → Select build
2. See: Installs, Sessions, Crashes

---

## 🔄 Updating TestFlight Build

### When to Upload New Build:

- Fixed bugs
- Added features
- Made changes to test

### Process:

1. **Update version in Xcode:**
   - Open `ios/App/App.xcodeproj/project.pbxproj`
   - Keep `MARKETING_VERSION = 1.7.7;` (same)
   - Increment `CURRENT_PROJECT_VERSION = 18;` (increment build number)
   
   **OR in Xcode:**
   - Select App target → General tab
   - Keep Version: 1.7.7
   - Increment Build: 18

2. **Commit changes:**
   ```bash
   git add ios/App/App.xcodeproj/project.pbxproj
   git commit -m "chore: Bump iOS build to 18 for TestFlight"
   git push
   ```

3. **Archive and upload** (same process as above)

4. **In App Store Connect:**
   - New build appears automatically
   - Add to TestFlight groups
   - Testers get update notification

**Note:** You can have multiple builds with same version but different build numbers.

---

## 🐛 Troubleshooting

### Error: "No signing certificate found"

**Solution:**
1. Xcode → Preferences → Accounts
2. Select Apple ID → Download Manual Profiles
3. Try archive again

### Error: "Failed to export archive"

**Solution:**
1. Product → Clean Build Folder
2. Delete `build/` directory
3. Try again

### Error: "Bundle ID not found"

**Solution:**
1. Register Bundle ID in Developer Portal (see above)
2. Wait 5 minutes
3. Try again

### Error: "Upload failed"

**Solution:**
1. Check internet connection
2. Verify Apple ID has admin access
3. Check App Store Connect status: https://developer.apple.com/system-status/
4. Try again later

### Build shows "Missing Compliance"

**Solution:**
1. Click on build in TestFlight
2. Answer Export Compliance questions
3. Usually "No" for apps using standard encryption

### Testers can't install

**Solution:**
1. Verify tester email matches Apple ID
2. Tester must have TestFlight app installed
3. Tester must accept invitation in email
4. Check tester's iOS version (must be 14.0+)

---

## 📊 TestFlight Best Practices

### 1. Version Numbering
- **Version (MARKETING_VERSION):** User-facing (1.7.7)
  - Increment for feature releases
- **Build (CURRENT_PROJECT_VERSION):** Internal (17, 18, 19...)
  - Increment for every upload
  - Must be unique and incrementing

### 2. Testing Groups
- **Internal Group:** Developers, QA team
- **External Group 1:** Beta testers
- **External Group 2:** Public beta (if needed)

### 3. Feedback Collection
- Enable screenshot feedback
- Monitor crash reports
- Respond to tester feedback
- Fix critical issues before App Store

### 4. Build Expiry
- TestFlight builds expire after **90 days**
- Upload new build before expiry
- Testers get notification to update

---

## 📈 TestFlight to App Store

### When Ready for App Store:

1. **Fix all critical issues** from TestFlight feedback
2. **Update version** if needed (e.g., 1.7.7 → 1.8.0)
3. **Create new archive** (same process)
4. **Distribute to App Store** (not TestFlight)
5. **Submit for App Store Review**

See `IOS_COMPLETE_SETUP.md` for full App Store submission process.

---

## ✅ TestFlight Deployment Checklist

### Prerequisites
- [ ] Mac with Xcode installed
- [ ] Apple Developer account ($99/year)
- [ ] Bundle ID registered
- [ ] App Store Connect record created
- [ ] Privacy policy hosted
- [ ] Export compliance determined

### Build & Upload
- [ ] Code synced from GitHub
- [ ] .env file configured
- [ ] App tested in simulator
- [ ] Dependencies installed (`npm install`, `pod install`)
- [ ] Web app built (`npm run build`)
- [ ] iOS synced (`npx cap sync ios`)
- [ ] Signing configured in Xcode
- [ ] Archive created (Product → Archive)
- [ ] Distributed to App Store Connect
- [ ] Upload successful

### TestFlight Configuration
- [ ] Build processed (email received)
- [ ] Export compliance answered
- [ ] Internal testers added
- [ ] Testers received invitation
- [ ] App installed via TestFlight
- [ ] All features tested
- [ ] Feedback collection enabled
- [ ] Crash reporting monitored

---

## 🔗 Useful Links

- **App Store Connect:** https://appstoreconnect.apple.com/
- **Apple Developer Portal:** https://developer.apple.com/account/
- **TestFlight Guide:** https://developer.apple.com/testflight/
- **System Status:** https://developer.apple.com/system-status/
- **TestFlight App:** https://apps.apple.com/app/testflight/id899247664

---

## 📞 Support

**Need Help?**
- Apple Developer Support: https://developer.apple.com/support/
- TestFlight Documentation: https://developer.apple.com/testflight/
- App Store Connect Help: https://help.apple.com/app-store-connect/

---

## 🎉 Summary

**TestFlight deployment process:**
1. ✅ Create App Store Connect record
2. ✅ Archive app in Xcode
3. ✅ Upload to App Store Connect
4. ✅ Wait for processing (~15 min)
5. ✅ Configure TestFlight
6. ✅ Add testers
7. ✅ Testers install via TestFlight app
8. ✅ Collect feedback
9. ✅ Upload fixes as new builds

**Ready to deploy to TestFlight! 📱✨**


