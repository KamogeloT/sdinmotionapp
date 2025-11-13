# Quick Start Guide - SDINMOTION on Mac 🚀

You've cloned the repo! Here's how to get the app running on your Mac.

---

## ✅ Step-by-Step Setup

### Step 1: Install Prerequisites

Open Terminal and run these commands:

#### Check if Node.js is installed:
```bash
node --version
```

**If not installed:**
```bash
# Install Homebrew first (if needed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verify
node --version  # Should show v18 or higher
npm --version   # Should show 9 or higher
```

#### Install CocoaPods:
```bash
sudo gem install cocoapods

# Verify
pod --version  # Should show 1.11 or higher
```

#### Install Xcode (if not already):
1. Open **App Store**
2. Search for **"Xcode"**
3. Click **Install** (it's FREE but large ~12GB)
4. Wait for installation (20-30 minutes)

#### Install Xcode Command Line Tools:
```bash
xcode-select --install
```

---

### Step 2: Navigate to Project

```bash
cd path/to/sdinmotionapp
git checkout feature/iOS_App
```

**Verify you're in the right place:**
```bash
ls -la
# You should see: package.json, ios/, src/, etc.
```

---

### Step 3: Create .env File

**Option A: Copy from example**
```bash
cp .env.example .env
nano .env
```

**Option B: Create from scratch**
```bash
nano .env
```

**Add your Bitrix24 configuration:**
```env
# Bitrix24 Configuration
VITE_BITRIX24_WEBHOOK_URL=https://your-domain.bitrix24.com/rest/123/your-webhook-key/
VITE_BITRIX24_USER_ID=123

# Group IDs
VITE_BITRIX24_GROUP_WATER=45
VITE_BITRIX24_GROUP_ELECTRICITY=46
VITE_BITRIX24_GROUP_ROADS=47
VITE_BITRIX24_GROUP_WASTE=48

# Optional: Drive Folder IDs (if you have them)
# VITE_BITRIX24_DRIVE_FOLDER_WATER=123
# VITE_BITRIX24_DRIVE_FOLDER_ELECTRICITY=124
# VITE_BITRIX24_DRIVE_FOLDER_ROADS=125
# VITE_BITRIX24_DRIVE_FOLDER_WASTE=126
```

**Save:** Press `Ctrl+O`, `Enter`, then `Ctrl+X`

---

### Step 4: Install Dependencies

```bash
# Install npm packages
npm install

# This will take 2-5 minutes
# You should see: "added XXX packages"
```

---

### Step 5: Install iOS Dependencies

```bash
cd ios/App
pod install

# This will take 2-5 minutes
# You should see: "Pod installation complete!"

cd ../..  # Go back to project root
```

---

### Step 6: Build Web App

```bash
npm run build

# This will take 1-2 minutes
# You should see: "dist" folder created
```

---

### Step 7: Sync with iOS

```bash
npx cap sync ios

# This copies web app to iOS project
# Should take ~30 seconds
```

---

### Step 8: Open in Xcode

```bash
npx cap open ios
```

**This will open Xcode automatically!**

---

## 🎯 In Xcode

### Step 9: Configure Signing

1. **Select the App target** (blue icon at top left)
2. **Click "Signing & Capabilities" tab**
3. **Check:** ☑️ "Automatically manage signing"
4. **Team:** Select your Apple Developer team from dropdown
   - If no team appears, click "Add Account" and sign in with your Apple ID
   - If you don't have a developer account yet, you can use personal team for testing

**You should see:** ✅ "Signing Certificate: Apple Development"

---

### Step 10: Select Simulator

1. **Click device selector** (next to Run button, top left)
2. **Select:** "iPhone 14 Pro" or any iPhone simulator
   - NOT "Any iOS Device" for testing
   - Use "Any iOS Device" only when building for TestFlight

---

### Step 11: Run the App! 🚀

1. **Click the Play button** (▶️) or press `Cmd+R`
2. **Wait for build** (2-5 minutes first time)
3. **Simulator opens** with your app!

**You should see:**
- ✅ Simulator launches
- ✅ App installs
- ✅ Login screen appears
- ✅ Map loads
- ✅ Everything works!

---

## 🧪 Testing the App

### Test Camera (in Simulator):
**Note:** Camera doesn't work in simulator, but you can:
1. Click camera button
2. Simulator will show photo picker
3. Select a sample image

### Test on Real iPhone (Recommended):
1. **Connect iPhone** via USB
2. **Trust this computer** on iPhone
3. **In Xcode:** Select your iPhone from device selector
4. **Click Run** (▶️)
5. **On iPhone:** Settings → General → VPN & Device Management → Trust your developer certificate
6. **App installs** on your iPhone!

---

## 🔧 Troubleshooting

### Error: "Command not found: npm"
**Solution:**
```bash
brew install node
```

### Error: "Command not found: pod"
**Solution:**
```bash
sudo gem install cocoapods
```

### Error: "No account found"
**Solution:**
1. Xcode → Preferences → Accounts
2. Click "+" → Add Apple ID
3. Sign in

### Error: "Failed to install pods"
**Solution:**
```bash
cd ios/App
pod repo update
pod install
cd ../..
```

### Error: "Module not found" when building
**Solution:**
```bash
npm install
npm run build
npx cap sync ios
```

### Build Failed in Xcode
**Solution:**
1. Product → Clean Build Folder (`Cmd+Shift+K`)
2. Close Xcode
3. Delete: `ios/App/Pods` and `ios/App/Podfile.lock`
4. Run: `cd ios/App && pod install && cd ../..`
5. Open Xcode again

---

## 🎯 Next Steps

### Option A: Keep Testing
- ✅ Test all features in simulator
- ✅ Test on physical iPhone
- ✅ Verify camera, GPS, file upload
- ✅ Check Bitrix24 integration

### Option B: Build for TestFlight
**When you're ready:**
```bash
./testflight-deploy.sh
```

See `TESTFLIGHT_DEPLOYMENT.md` for complete instructions.

---

## 📱 All Features to Test

- [ ] Login screen
- [ ] Map view (with GPS location)
- [ ] Select fault type (Water/Electricity/Roads/Waste)
- [ ] Take photo (camera)
- [ ] Select photo (gallery)
- [ ] Add description
- [ ] Submit fault report
- [ ] Task created in Bitrix24
- [ ] Photo attached to task
- [ ] GPS coordinates included
- [ ] View submitted faults
- [ ] Check debug logs (if needed)

---

## ⚡ Quick Reference

**Start development:**
```bash
npm run dev           # Start dev server
npx cap sync ios      # Sync changes
npx cap open ios      # Open Xcode
```

**After making changes:**
```bash
npm run build         # Build web app
npx cap sync ios      # Sync to iOS
# Then click Run in Xcode
```

**Clean everything:**
```bash
rm -rf node_modules dist
npm install
npm run build
cd ios/App && pod install && cd ../..
npx cap sync ios
```

---

## ✅ Summary

**You should now have:**
- ✅ All prerequisites installed
- ✅ Dependencies installed (npm + pods)
- ✅ .env file configured
- ✅ Web app built
- ✅ iOS project synced
- ✅ App running in simulator
- ✅ Ready to test or deploy!

---

**Need help? Check these docs:**
- `TESTFLIGHT_DEPLOYMENT.md` - Deploy to TestFlight
- `IOS_COMPLETE_SETUP.md` - Complete iOS guide
- `ENV_SETUP.md` - Environment variables
- `TROUBLESHOOTING.md` - Common issues

**Happy coding! 🚀**

