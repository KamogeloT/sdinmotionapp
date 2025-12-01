#!/bin/bash
# Prepare everything for APK build - just needs Java installed

set -e

echo "🔧 Preparing Android APK build environment..."
echo ""

# Step 1: Build web assets
echo "📦 Step 1: Building web assets..."
npm run build

# Step 2: Sync to Android
echo ""
echo "📱 Step 2: Syncing to Android..."
npx cap sync android

# Step 3: Check for keystore
KEYSTORE_PATH="android/app/upload-keystore.jks"
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo ""
    echo "🔑 Step 3: Creating keystore..."
    echo "⚠️  Note: This requires Java to be installed"
    echo ""
    
    # Check if Java is available
    if ! command -v keytool &> /dev/null; then
        echo "❌ Error: Java/keytool not found"
        echo ""
        echo "Please install Java first:"
        echo "  brew install --cask temurin"
        echo ""
        echo "Then run this script again."
        exit 1
    fi
    
    cd android/app
    keytool -genkey -v -keystore upload-keystore.jks \
        -keyalg RSA -keysize 2048 -validity 10000 \
        -alias upload \
        -storepass android123 \
        -keypass android123 \
        -dname "CN=SDINMOTION, OU=Mobile App, O=JBmarks Municipality, L=Potchefstroom, ST=North West, C=ZA"
    cd ../..
    
    echo "✅ Keystore created successfully!"
else
    echo ""
    echo "✅ Step 3: Keystore already exists"
fi

# Step 4: Make gradlew executable
echo ""
echo "🔧 Step 4: Setting up Gradle..."
cd android
chmod +x gradlew

# Check Java
if ! command -v java &> /dev/null; then
    echo ""
    echo "❌ Error: Java not found in PATH"
    echo ""
    echo "Please install Java:"
    echo "  brew install --cask temurin"
    echo ""
    echo "Or set JAVA_HOME:"
    echo "  export JAVA_HOME=\$(/usr/libexec/java_home -v 11)"
    exit 1
fi

echo ""
echo "✅ Java found: $(java -version 2>&1 | head -1)"
echo ""

# Step 5: Build APK
echo "🔨 Step 5: Building signed APK..."
echo "This may take a few minutes on first build..."
echo ""

./gradlew clean assembleRelease

cd ..

# Check if APK was created
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "           ✅ SIGNED APK BUILT SUCCESSFULLY!"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "📦 APK Location: $APK_PATH"
    echo "📏 Size: $APK_SIZE"
    echo ""
    echo "🚀 Ready for Google Play Store upload!"
    echo ""
else
    echo ""
    echo "❌ Error: APK not found. Check build output above for errors."
    exit 1
fi
