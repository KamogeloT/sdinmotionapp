# Environment Variables Setup Guide

This guide explains how to set up environment variables for both iOS and Android builds.

## 📝 Required Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Bitrix24 Configuration
# ======================

# Bitrix24 Webhook URL
# Get this from: Bitrix24 → Settings → Integrations → Webhooks
# Format: https://your-domain.bitrix24.com/rest/1/YOUR_WEBHOOK_CODE/
VITE_BITRIX24_WEBHOOK_URL=https://www.sdinmotion.co.za/rest/1/YOUR_WEBHOOK_CODE/

# Default User ID for task assignment
# Get this from: Bitrix24 → User Profile → ID
VITE_BITRIX24_USER_ID=1

# Workgroup IDs for each department
# Get these from: Bitrix24 → Workgroups → Group Settings → ID
VITE_BITRIX24_GROUP_WATER=5
VITE_BITRIX24_GROUP_ELECTRICITY=6
VITE_BITRIX24_GROUP_ROADS=7
VITE_BITRIX24_GROUP_WASTE=8

# Optional: Direct Drive Folder IDs (for faster uploads)
# Get these from: Bitrix24 → Drive → Folder → Properties → ID
# If not provided, the app will automatically detect the correct folder
# VITE_BITRIX24_DRIVE_FOLDER_WATER=61
# VITE_BITRIX24_DRIVE_FOLDER_ELECTRICITY=63
# VITE_BITRIX24_DRIVE_FOLDER_ROADS=65
# VITE_BITRIX24_DRIVE_FOLDER_WASTE=67
```

## 🔐 Security Notes

1. **Never commit `.env` to git** - It's already in `.gitignore`
2. **Keep your webhook URL secure** - Anyone with this can access your Bitrix24 data
3. **Rotate webhooks** if compromised
4. **Use different webhooks** for dev/staging/production

## 📱 Platform-Specific Configuration

### iOS

Environment variables are bundled into the app during build time via Vite.

**Build Process:**
```bash
# 1. Ensure .env file exists with correct values
# 2. Build the web app (embeds env vars)
npm run build

# 3. Sync with iOS
npx cap sync ios

# 4. Open in Xcode
npx cap open ios
```

**Runtime Access:**
The app reads env vars through `src/config.ts`:
- `import.meta.env.VITE_BITRIX24_WEBHOOK_URL`
- `import.meta.env.VITE_BITRIX24_USER_ID`
- etc.

### Android

Same process as iOS - env vars are bundled during build:

```bash
# 1. Ensure .env file exists
# 2. Build
npm run build

# 3. Sync with Android
npx cap sync android

# 4. Open in Android Studio
npx cap open android
```

## 🧪 Development vs Production

### Development
Use a test Bitrix24 webhook for development:
```bash
VITE_BITRIX24_WEBHOOK_URL=https://test.sdinmotion.co.za/rest/1/TEST_WEBHOOK/
```

### Production
Use production webhook:
```bash
VITE_BITRIX24_WEBHOOK_URL=https://www.sdinmotion.co.za/rest/1/PROD_WEBHOOK/
```

## 🔄 Updating Environment Variables

If you change `.env` values:

1. **Re-build** the web app: `npm run build`
2. **Re-sync** with platform: `npx cap sync ios` or `npx cap sync android`
3. **Clean build** in Xcode/Android Studio (recommended)

## ✅ Verification

### Check if env vars are loaded:

1. Build the app
2. Open browser dev tools (web) or use console logging
3. Check `src/config.ts` values:
   ```typescript
   console.log('Webhook URL:', config.bitrix24.webhookUrl);
   ```

**Important:** Don't log sensitive values in production!

## 🆘 Troubleshooting

### Problem: Env vars showing as undefined
**Solution:**
- Ensure `.env` file exists in project root
- Ensure variable names start with `VITE_`
- Rebuild: `npm run build`
- Re-sync: `npx cap sync`

### Problem: Old values still being used
**Solution:**
- Clear build cache: `rm -rf dist`
- Rebuild: `npm run build`
- Clean build in Xcode/Android Studio
- Re-sync: `npx cap sync`

### Problem: Webhook not working
**Solution:**
- Verify webhook URL format (should end with `/`)
- Check Bitrix24 webhook is active
- Test webhook in browser: `${WEBHOOK_URL}tasks.task.list.json`
- Check webhook permissions (needs tasks and disk access)

## 📚 References

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Capacitor Configuration](https://capacitorjs.com/docs/config)
- [Bitrix24 Webhook Documentation](https://dev.bitrix24.com/rest_help/)

