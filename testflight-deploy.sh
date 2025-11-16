#!/bin/bash

# SDINMOTION TestFlight Deployment Script
# =========================================
# This script automates the TestFlight deployment process
# REQUIREMENT: Must be run on a Mac with Xcode installed

set -e  # Exit on error

echo "🚀 Starting TestFlight deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
WORKSPACE="ios/App/App.xcworkspace"
SCHEME="App"
CONFIGURATION="Release"
ARCHIVE_PATH="build/App.xcarchive"
EXPORT_PATH="build"
IPA_PATH="build/SDINMOTION.ipa"

# Check if running on Mac
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ Error: This script must be run on macOS!${NC}"
    echo "iOS builds can only be created on a Mac with Xcode installed."
    exit 1
fi

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please create .env file with your Bitrix24 configuration."
    echo "See ENV_SETUP.md for instructions."
    exit 1
fi

if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ Error: Xcode not installed!${NC}"
    echo "Install Xcode from the Mac App Store:"
    echo "https://apps.apple.com/app/xcode/id497799835"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js not installed!${NC}"
    echo "Install Node.js: brew install node"
    exit 1
fi

if ! command -v pod &> /dev/null; then
    echo -e "${RED}❌ Error: CocoaPods not installed!${NC}"
    echo "Install CocoaPods: sudo gem install cocoapods"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"

# Get current version info
echo -e "${BLUE}📋 Checking version...${NC}"
VERSION=$(grep -m 1 "MARKETING_VERSION" ios/App/App.xcodeproj/project.pbxproj | sed 's/.*= \(.*\);/\1/' | tr -d ' ')
BUILD=$(grep -m 1 "CURRENT_PROJECT_VERSION" ios/App/App.xcodeproj/project.pbxproj | sed 's/.*= \(.*\);/\1/' | tr -d ' ')
echo -e "${GREEN}Version: $VERSION ($BUILD)${NC}"

# Install dependencies
echo -e "${BLUE}📦 Step 1/8: Installing npm dependencies...${NC}"
npm install

# Build web app
echo -e "${BLUE}🔨 Step 2/8: Building web app...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Error: dist/ directory not created!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Web app built successfully${NC}"

# Sync with iOS
echo -e "${BLUE}📱 Step 3/8: Syncing with iOS...${NC}"
npx cap sync ios

# Install pods
echo -e "${BLUE}📦 Step 4/8: Installing iOS pods...${NC}"
cd ios/App
pod install
cd ../..

# Clean build folder
echo -e "${BLUE}🧹 Step 5/8: Cleaning build folder...${NC}"
rm -rf build
mkdir -p build

# Check if ExportOptions.plist exists
if [ ! -f ExportOptions.plist ]; then
    echo -e "${YELLOW}⚠️  Warning: ExportOptions.plist not found!${NC}"
    echo "Creating template ExportOptions.plist..."
    echo "You'll need to edit it with your Team ID before uploading."
    
    cat > ExportOptions.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID_HERE</string>
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
EOF
    
    echo -e "${YELLOW}Find your Team ID at: https://developer.apple.com/account/#!/membership${NC}"
    echo -e "${YELLOW}Then edit ExportOptions.plist and re-run this script.${NC}"
    exit 1
fi

# Archive
echo -e "${BLUE}📦 Step 6/8: Creating archive (this may take 5-10 minutes)...${NC}"
xcodebuild -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration "$CONFIGURATION" \
  -archivePath "$ARCHIVE_PATH" \
  -destination 'generic/platform=iOS' \
  clean archive \
  | grep -E '^(=|Build|Archive)' || true

if [ ! -d "$ARCHIVE_PATH" ]; then
    echo -e "${RED}❌ Error: Archive creation failed!${NC}"
    echo "Check Xcode for signing issues or build errors."
    echo "Try: open ios/App/App.xcworkspace"
    exit 1
fi

echo -e "${GREEN}✅ Archive created successfully!${NC}"

# Export for App Store
echo -e "${BLUE}📦 Step 7/8: Exporting for App Store...${NC}"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist ExportOptions.plist \
  | grep -E '^(=|Export)' || true

if [ ! -f "$IPA_PATH" ]; then
    echo -e "${RED}❌ Error: IPA export failed!${NC}"
    echo "Check ExportOptions.plist configuration."
    exit 1
fi

echo -e "${GREEN}✅ IPA exported successfully!${NC}"

# Upload to App Store Connect
echo -e "${BLUE}📤 Step 8/8: Ready to upload to App Store Connect${NC}"
echo ""
echo -e "${GREEN}🎉 Build ready for TestFlight!${NC}"
echo ""
echo "📦 IPA Location: $IPA_PATH"
echo "📊 Version: $VERSION"
echo "🔢 Build: $BUILD"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Open Xcode: npx cap open ios"
echo "2. Window → Organizer"
echo "3. Select the archive (version $VERSION build $BUILD)"
echo "4. Click 'Distribute App'"
echo "5. Choose 'App Store Connect' → Upload"
echo "6. Wait for processing (~15 minutes)"
echo "7. Go to App Store Connect → TestFlight"
echo "8. Add your build to a test group"
echo "9. Add testers via email"
echo ""
echo -e "${BLUE}OR upload via command line:${NC}"
echo "xcrun altool --upload-app --type ios --file $IPA_PATH \\"
echo "  --username \"your-apple-id@email.com\" \\"
echo "  --password \"@keychain:AC_PASSWORD\""
echo ""
echo -e "${GREEN}See TESTFLIGHT_DEPLOYMENT.md for complete instructions.${NC}"


