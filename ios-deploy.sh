#!/bin/bash

# SDINMOTION iOS Deployment Script
# =================================
# This script prepares the iOS app for App Store deployment

set -e  # Exit on error

echo "🚀 Starting iOS deployment preparation..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
WORKSPACE="ios/App/App.xcworkspace"
SCHEME="App"
CONFIGURATION="Release"
ARCHIVE_PATH="build/App.xcarchive"

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    exit 1
fi

if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ Error: Xcode Command Line Tools not installed!${NC}"
    echo "Install with: xcode-select --install"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"

# Build web app
echo -e "${BLUE}🔨 Step 1: Building web app...${NC}"
npm install
npm run build

# Sync with iOS
echo -e "${BLUE}📱 Step 2: Syncing with iOS...${NC}"
npx cap sync ios

# Install pods
echo -e "${BLUE}📦 Step 3: Installing pods...${NC}"
cd ios/App
pod install
cd ../..

# Clean build folder
echo -e "${BLUE}🧹 Step 4: Cleaning build folder...${NC}"
rm -rf build
mkdir -p build

# Archive
echo -e "${BLUE}📦 Step 5: Creating archive...${NC}"
xcodebuild -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration "$CONFIGURATION" \
  -archivePath "$ARCHIVE_PATH" \
  clean archive

if [ ! -d "$ARCHIVE_PATH" ]; then
    echo -e "${RED}❌ Error: Archive creation failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Archive created successfully!${NC}"

echo ""
echo -e "${GREEN}🎉 iOS app ready for App Store deployment!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Open Xcode Organizer: xcodebuild -list"
echo "2. Or open Xcode → Window → Organizer"
echo "3. Select the archive"
echo "4. Click 'Distribute App'"
echo "5. Choose 'App Store Connect'"
echo "6. Follow the upload wizard"
echo ""
echo "Archive location: $ARCHIVE_PATH"

