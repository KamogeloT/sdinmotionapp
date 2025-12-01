#!/bin/bash

# SDINMOTION iOS Build Script
# ============================
# This script builds the iOS app for deployment

set -e  # Exit on error

echo "🚀 Starting iOS build process..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please create .env file with your Bitrix24 configuration."
    echo "See ENV_SETUP.md for instructions."
    exit 1
fi

echo -e "${BLUE}📦 Step 1: Installing npm dependencies...${NC}"
npm install

echo -e "${BLUE}🔨 Step 2: Building web app...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Error: dist/ directory not created!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Web app built successfully${NC}"

echo -e "${BLUE}📱 Step 3: Syncing with iOS...${NC}"
npx cap sync ios

echo -e "${BLUE}📦 Step 4: Installing iOS pods...${NC}"
cd ios/App
pod install
cd ../..

echo -e "${GREEN}✅ iOS project synced successfully${NC}"

echo ""
echo -e "${GREEN}🎉 Build complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Open Xcode: npx cap open ios"
echo "2. Select your signing team"
echo "3. Choose a device/simulator"
echo "4. Click Run ▶️ button"
echo ""
echo "Or run: npx cap open ios"

