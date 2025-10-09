# 🚨 URGENT: Google OAuth redirect_uri_mismatch Fix

## The Problem
You're getting `Error 400: redirect_uri_mismatch` because the redirect URI doesn't match what's configured in Google Cloud Console.

## What You Need to Do RIGHT NOW:

### 1. Update Render Environment Variables
Go to your Render dashboard and update these environment variables:

```
GOOGLE_CALLBACK_URL=https://memorify-backend-ik4b.onrender.com/api/auth/google/callback
FRONTEND_URL=https://memorify-nine.vercel.app
```

### 2. Update Google Cloud Console
Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials

1. Click on your OAuth 2.0 Client ID
2. In "Authorized redirect URIs", make sure you have EXACTLY:
   ```
   https://memorify-backend-ik4b.onrender.com/api/auth/google/callback
   ```
3. In "Authorized JavaScript origins", make sure you have:
   ```
   https://memorify-nine.vercel.app
   https://memorify-backend-ik4b.onrender.com
   ```

### 3. Restart Render Service
After updating environment variables, restart your Render service.

## The Fix is Already Applied
I've updated your `env-updated` file with the correct production URLs. You just need to update Render and Google Cloud Console.
