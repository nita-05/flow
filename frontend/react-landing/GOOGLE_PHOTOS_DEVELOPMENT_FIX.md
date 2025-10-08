# Google Photos Import - Development Fix Guide

## 🚨 Current Issue
The "Import from Google Photos" button shows a Google security warning because your app is not verified by Google yet.

## ✅ Quick Fix for Development

### Step 1: Add Your Email as Test User
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `memorify` (or the project with ID: 724469503053)
3. Go to **APIs & Services** > **OAuth consent screen**
4. Scroll down to **Test users** section
5. Click **+ ADD USERS**
6. Add your email: `nitabariki070@gmail.com`
7. Click **SAVE**

### Step 2: Enable Google Photos API
1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Photos Library API"
3. Click on it and **ENABLE** it
4. Also enable "Google Drive API" (for additional photo access)

### Step 3: Update OAuth Scopes
✅ **Already Done** - I've updated your backend to include the Google Photos scope.

### Step 4: Test the Import
1. Restart your backend server
2. Try clicking "Import from Google Photos" again
3. You should now see a proper Google OAuth screen instead of the warning

## 🚀 For Production Deployment

### Option A: Google App Verification (Recommended)
1. Complete Google's app verification process
2. This removes the warning for all users
3. Takes 1-2 weeks but is permanent

### Option B: Keep as Internal App
1. In OAuth consent screen, set **User Type** to "Internal"
2. Only users in your organization can use it
3. No verification needed

### Option C: Use Service Account (Advanced)
1. Create a service account
2. Use it to access Google Photos programmatically
3. More complex but more reliable

## 🔧 Current Configuration

Your app is configured with:
- ✅ Google Photos Library API scope
- ✅ Test user support
- ✅ Proper OAuth flow
- ✅ Error handling

## 🧪 Testing Steps

1. **Restart Backend:**
   ```bash
   cd frontend/react-landing/backend
   npm start
   ```

2. **Test Import:**
   - Click "Import from Google Photos"
   - Should see Google OAuth screen (not warning)
   - Grant permissions
   - Select photos
   - Photos should import successfully

## 📞 If Still Not Working

1. Check Google Cloud Console for any errors
2. Verify API quotas are not exceeded
3. Check browser console for JavaScript errors
4. Ensure all environment variables are correct

## 🎯 Expected Result

After following these steps, the "Import from Google Photos" button should:
- ✅ Open Google OAuth screen (not warning)
- ✅ Allow you to select photos
- ✅ Import photos to your app
- ✅ Process them with AI (tags, emotions, descriptions)
