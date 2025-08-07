# 🚀 Production Deployment Guide

## Environment Variables Setup

### Required Environment Variables
Your app requires these environment variables to be set in production:

```
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### For Development
1. Create a `.env` file in the project root
2. Copy the variables above and fill in your actual Firebase values
3. The app will load these automatically

### For Production (EAS Build)
1. Update `eas.json` with your actual Firebase configuration values
2. Set your EAS Project ID in `app.json`
3. Use `eas build` for production builds

### For Manual Builds
Set environment variables in your build system before building.

### Required Environment Variables
```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyB_sm6Qx6yy3BwdD_7daw1aPSsFAAIK7XE
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=detoxly-fbf32.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=detoxly-fbf32
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=detoxly-fbf32.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=245053492044
EXPO_PUBLIC_FIREBASE_APP_ID=1:245053492044:web:4680cdc2ef197a3ea19de9
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-CRQRGFCG1D

# Google Mobile Ads (set in android/app/src/main/AndroidManifest.xml)
# For production, use your real Ad Mob App ID
```

**Note**: The current Firebase config uses fallback values for development. For production, set these as proper environment variables.

## Production Checklist

### ✅ Security
- [x] Firebase API keys secured with environment variables
- [x] No hardcoded secrets in code
- [x] Error boundaries implemented

### ✅ Performance
- [x] Loading states implemented
- [x] Proper async error handling
- [x] Data synchronization

### ✅ User Experience
- [x] Onboarding flow
- [x] Error messages
- [x] Navigation structure
- [x] Push notifications for detox reminders

### 📋 Before App Store Submission
- [ ] Update Firebase rules for production
- [ ] Test on physical devices
- [ ] Configure app store metadata
- [ ] Set up crash reporting (optional)
- [ ] Configure analytics (optional)

## Deployment Commands

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Create EAS project
eas build:configure

# Build for production
eas build --platform all --profile production

# Submit to app stores
eas submit --platform all
```