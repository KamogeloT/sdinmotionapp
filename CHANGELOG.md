# Changelog

All notable changes to the Municipal Fault Reporting Mobile App.

## [1.8.0] - 2025-11-16

### 🚀 iOS Support & Production Improvements

#### Added
- ✅ **Complete iOS support with TestFlight deployment**
  - Full iOS app configuration and build setup
  - TestFlight deployment scripts and documentation
  - Xcode project configuration with proper versioning
  - iOS-specific permissions (Camera, Location, Photo Library)
- 📚 **Comprehensive iOS documentation**
  - `TESTFLIGHT_DEPLOYMENT.md` - Complete TestFlight guide
  - `MAC_QUICK_START.md` - Quick setup for Mac developers
  - `MACOS_ALTERNATIVES.md` - Options for Windows users
  - `IOS_COMPLETE_SETUP.md` - Full iOS development guide
  - `IOS_FEATURES_COMPATIBILITY.md` - Feature checklist
  - `ENV_SETUP.md` - Environment variables guide
- 🤖 **Automated deployment scripts**
  - `testflight-deploy.sh` - One-command TestFlight deployment
  - `build-ios.sh` - Automated iOS build process
  - `ExportOptions.plist.template` - App Store export configuration

#### Improved
- 🎨 **Updated app display name to SDINMOTION**
  - Consistent branding across iOS and Android
  - Professional app naming in stores and devices
- 🔧 **Enhanced Xcode scheme configuration**
  - Fixed archiving issues
  - Proper release build configuration
- 📦 **Maintained photo upload stability**
  - All 1.7.7 photo fixes included
  - Standardized image processing across platforms

#### Technical
- iOS version: 1.8.0 (build 18)
- Android version: 1.8.0 (versionCode: 18)
- Bundle ID: com.municipality.faultreporter
- Branch: feature/iOS_App merged to master

---

## [1.7.7] - 2025-11-12

### 🔥 Critical Fix - Photo Upload Issue Resolved

#### Fixed
- ✅ **Photos now successfully attach to Bitrix24 tasks**
  - Implemented correct `tasks.task.files.attach` API workflow
  - Added dual-method fallback (DISK_ID → FILE_ID)
  - Photos upload to task's group storage then attach properly

#### Improved
- 🎨 **Standardized photo format across ALL devices and sources**
  - Max resolution: 1600px (optimal for mobile networks)
  - Format: JPEG (60% quality)
  - Consistent ~500KB-1MB file sizes for fast, reliable uploads
  - Same processing for camera and gallery photos

#### Added
- 🔍 **Comprehensive debugging and logging**
  - New `debugLogger` service writes to device file
  - Logs location: `Documents/sdinmotion_debug.log`
  - Includes all API calls, responses, and errors
  - Pull logs via `get-phone-logs.ps1` script
- ⏱️ **Network timeout protection**
  - 60-second timeout for file uploads
  - Clear error messages on timeout

#### Technical
- Enhanced `bitrix24Service.ts` with proper file attachment flow
- Unified photo processing in `FaultReporting.tsx`
- Added `debugLogger.ts` for persistent logging
- Version: 1.7.7 (versionCode: 17)

---

## [1.7.0-1.7.6] - 2025-11-12

### Iterative Bug Fixes (Photo Upload)
- Various attempts to fix photo attachment issue
- Network optimization and error handling improvements
- Image quality adjustments

---

## [1.5.1] - 2025-11-11

### Fixed
- Minor bug fixes and performance improvements

---

## [1.5.0] - 2025-11-10

### Added
- Enhanced location services
- Improved GPS accuracy

---

## [1.4.0] - 2025-11-09

### Added
- Report history improvements
- Better offline support

---

## [1.3.1] - 2025-11-08

### Fixed
- UI/UX refinements
- Bug fixes

---

## [1.3.0] - 2025-11-07

### Added
- Enhanced user interface
- Better error messages

---

## [1.0.0] - 2025-10-20

### Added
- ✨ Mobile-first Progressive Web App (PWA)
- 📱 Four fault categories: Water, Electricity, Roads, Waste
- 📷 Photo capture and upload functionality
- 📍 GPS location detection
- 💾 Offline support with local storage
- 📋 Report history and tracking
- 🔄 Retry mechanism for failed submissions
- 🏢 Bitrix24 integration with automatic task creation
- 🎯 Department-based routing to workgroups
- 🔢 Reference number generation and tracking
- 📊 Status tracking (draft, pending, submitted, failed)
- 💾 Auto-save drafts functionality
- 🎨 Modern, mobile-optimized UI
- 🌐 Bottom navigation for easy access
- 🔔 Success and error notifications

### Fixed
- ✅ Configurable Group IDs (no longer hardcoded)
- ✅ Fixed Bitrix24 file upload with proper endpoints
- ✅ Proper error handling and user feedback
- ✅ File upload folder specification support
- ✅ Photo preview before upload
- ✅ Responsive design for all screen sizes
- ✅ Safe area support for notched devices

### Technical
- React 18 with TypeScript
- Vite for fast development and builds
- Tailwind CSS for styling
- Workbox for PWA functionality
- LocalStorage for offline data
- Service Worker for caching

### Security
- Environment variable configuration
- HTTPS requirement for PWA
- No hardcoded credentials
- Secure webhook handling

## Future Enhancements

### Planned for v1.1.0
- [ ] Push notifications for status updates
- [ ] Real-time status tracking from Bitrix24
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Voice input for descriptions
- [ ] Multiple photo uploads
- [ ] Map view for location selection
- [ ] Report statistics dashboard
- [ ] Share report functionality
- [ ] Biometric authentication option

### Under Consideration
- [ ] Chat support integration
- [ ] QR code scanning for asset reporting
- [ ] Video upload support
- [ ] Scheduled reports
- [ ] Anonymous reporting option
- [ ] Export reports to PDF
- [ ] Integration with other municipal systems

