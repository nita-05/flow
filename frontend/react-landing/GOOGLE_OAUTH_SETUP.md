# Google OAuth Setup Guide for Best of Us

This guide will help you set up Google OAuth authentication using your existing Google Cloud Console.

## 🚀 Step 1: Google Cloud Console Setup

### 1.1 Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Select your existing project or create a new one

### 1.2 Enable Google+ API
1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for "Google+ API" or "Google Identity"
3. Click on **Google+ API** and click **Enable**
4. Also enable **Google Identity** if available

### 1.3 Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Choose **External** user type
   - Fill in required fields:
     - **App name**: Best of Us
     - **User support email**: Your email
     - **Developer contact information**: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (your email for testing)

### 1.4 Configure OAuth Client
1. **Application type**: Choose **Web application**
2. **Name**: Best of Us OAuth Client
3. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   http://localhost:5000
   https://yourdomain.com (for production)
   ```
4. **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/google/callback
   http://localhost:5000/api/auth/google/callback
   https://yourdomain.com/auth/google/callback (for production)
   ```

### 1.5 Get Your Credentials
After creating, you'll get:
- **Client ID**: `your-client-id.apps.googleusercontent.com`
- **Client Secret**: `your-client-secret`

## 🔧 Step 2: Backend Configuration

### 2.1 Install Google OAuth Dependencies
```bash
cd frontend/react-landing/backend
npm install passport passport-google-oauth20 express-session
```

### 2.2 Update Environment Variables
Add to your `.env` file:
```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Session Secret (generate a random string)
SESSION_SECRET=your-session-secret-key-here
```

### 2.3 Update User Model
The User model will be updated to support Google OAuth fields.

## 🎨 Step 3: Frontend Configuration

### 3.1 Install Google OAuth Library
```bash
cd frontend/react-landing
npm install @google-cloud/oauth2
```

### 3.2 Update Environment Variables
Create `.env` file in frontend:
```env
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
REACT_APP_API_URL=http://localhost:5000/api
```

## 📱 Step 4: Implementation Files

The following files will be created/updated:

### Backend Files:
- `backend/config/passport.js` - Passport configuration
- `backend/routes/auth.js` - Updated with Google OAuth routes
- `backend/middleware/auth.js` - Updated for Google OAuth
- `backend/models/User.js` - Updated for Google OAuth fields

### Frontend Files:
- `src/components/LoginModal.js` - Updated with Google OAuth button
- `src/services/authService.js` - Updated for Google OAuth
- `src/components/GoogleAuth.js` - New Google OAuth component

## 🔄 Step 5: Authentication Flow

### Google OAuth Flow:
1. User clicks "Sign in with Google"
2. Redirected to Google OAuth consent screen
3. User grants permissions
4. Google redirects back with authorization code
5. Backend exchanges code for user info
6. Backend creates/updates user in database
7. Backend creates session and redirects to dashboard

## 🧪 Step 6: Testing

### Test the OAuth Flow:
1. Start backend: `npm run dev` (in backend folder)
2. Start frontend: `npm start` (in frontend folder)
3. Click "Sign in with Google" button
4. Complete Google OAuth flow
5. Verify user is created in database
6. Verify dashboard access

## 🚀 Step 7: Production Deployment

### Update OAuth Settings for Production:
1. In Google Cloud Console, update **Authorized JavaScript origins**:
   ```
   https://yourdomain.com
   ```
2. Update **Authorized redirect URIs**:
   ```
   https://yourdomain.com/auth/google/callback
   https://yourdomain.com/api/auth/google/callback
   ```
3. Update environment variables with production URLs

## 🔒 Security Considerations

- ✅ **HTTPS Required** - Google OAuth requires HTTPS in production
- ✅ **Secure Session Storage** - Use secure session configuration
- ✅ **CSRF Protection** - Implement CSRF tokens
- ✅ **Rate Limiting** - Already implemented in backend
- ✅ **Input Validation** - Validate all Google OAuth responses

## 📞 Troubleshooting

### Common Issues:
1. **"redirect_uri_mismatch"** - Check authorized redirect URIs
2. **"invalid_client"** - Verify Client ID and Secret
3. **"access_denied"** - Check OAuth consent screen configuration
4. **CORS errors** - Verify frontend URL in CORS settings

### Debug Steps:
1. Check Google Cloud Console logs
2. Verify environment variables
3. Test with different browsers
4. Check network tab in browser dev tools

---

**Ready to implement Google OAuth! Follow the steps above to get started.** 🎉
