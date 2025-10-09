# 🔐 Google Console Production Setup Guide

## 📋 Your Production URLs
- **Frontend:** https://flow-jz5x64n7r-nita-barikis-projects.vercel.app
- **Backend:** https://memorify-studio-backend.onrender.com

## 🔧 Step-by-Step Google Console Configuration

### 1. Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (the one you used for development)
3. Navigate to **APIs & Services** → **Credentials**

### 2. Update OAuth 2.0 Client ID
1. Find your OAuth 2.0 Client ID in the credentials list
2. Click on it to edit
3. Update the following fields:

#### **Authorized JavaScript Origins**
Add these URLs:
```
https://flow-jz5x64n7r-nita-barikis-projects.vercel.app
https://flow-mnifvdz3z-nita-barikis-projects.vercel.app
https://flow-qahqmc61w-nita-barikis-projects.vercel.app
http://localhost:3000
```

#### **Authorized Redirect URIs**
Add these URLs:
```
https://memorify-studio-backend.onrender.com/api/auth/google/callback
http://localhost:5000/api/auth/google/callback
```

### 3. Update OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Update the following fields:

#### **Application Homepage**
```
https://flow-jz5x64n7r-nita-barikis-projects.vercel.app
```

#### **Application Privacy Policy Link**
```
https://flow-jz5x64n7r-nita-barikis-projects.vercel.app/privacy
```

#### **Application Terms of Service Link**
```
https://flow-jz5x64n7r-nita-barikis-projects.vercel.app/terms
```

#### **Authorized Domains**
Add these domains:
```
vercel.app
onrender.com
```

### 4. Add Test Users (if in Testing mode)
1. In **OAuth consent screen**
2. Scroll down to **Test users**
3. Click **+ ADD USERS**
4. Add your email: `nitabariki070@gmail.com`
5. Add any other test users you want

### 5. Publish Your App (Optional)
If you want to make it available to all users:
1. In **OAuth consent screen**
2. Click **PUBLISH APP**
3. Confirm the action

## 🔑 Environment Variables to Update

### In Render (Backend)
Make sure these are set in your Render environment variables:
```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### In Vercel (Frontend)
Make sure this is set in your Vercel environment variables:
```
REACT_APP_API_URL=https://memorify-studio-backend.onrender.com
```

## 🧪 Test Your Setup

### 1. Test Google Sign-In
1. Go to your frontend: https://flow-jz5x64n7r-nita-barikis-projects.vercel.app
2. Click "Sign in with Google"
3. You should see the Google OAuth consent screen
4. After signing in, you should be redirected back to your app

### 2. Test Google Photos Import
1. In your app, try the "Import from Google Photos" feature
2. It should work without security warnings

## 🚨 Common Issues & Solutions

### Issue: "This app isn't verified"
**Solution:** 
- Add your email as a test user
- Or publish your app (requires verification process)

### Issue: "Error 400: redirect_uri_mismatch"
**Solution:**
- Check that your redirect URI exactly matches what's in Google Console
- Make sure there are no trailing slashes

### Issue: "Error 403: access_denied"
**Solution:**
- Check that your JavaScript origins are correct
- Make sure your domain is in the authorized domains list

## 📝 Important Notes

1. **Development vs Production:** Keep both localhost and production URLs in your Google Console for testing
2. **Multiple Deployments:** Vercel creates new URLs for each deployment - you may need to add new ones
3. **Security:** Never commit your Google Client Secret to your code
4. **Testing:** Always test in incognito mode to avoid cached credentials

## 🎯 Next Steps After Setup

1. Test all authentication flows
2. Test Google Photos import
3. Test file uploads and AI analysis
4. Monitor your app for any errors
5. Consider setting up custom domain for cleaner URLs

## 🔗 Quick Links
- [Google Cloud Console](https://console.cloud.google.com)
- [Your Frontend](https://flow-jz5x64n7r-nita-barikis-projects.vercel.app)
- [Your Backend](https://memorify-studio-backend.onrender.com)
