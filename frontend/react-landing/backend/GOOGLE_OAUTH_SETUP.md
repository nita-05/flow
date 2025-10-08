# Google OAuth Setup Guide

## The Problem
You're getting an "Unauthorized" error because the Google OAuth credentials are not configured in your environment variables.

## Quick Fix Steps

### 1. Set up Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.developers.google.com/
   - Sign in with your Google account

2. **Create or Select a Project**
   - Click "Select a project" dropdown
   - Click "New Project" if you don't have one
   - Name it "Memorify" or similar

3. **Enable Required APIs**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
   - Search for "Google OAuth2 API" and enable it

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Set name: "Memorify Web Client"
   - Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
   - Click "Create"

5. **Copy Your Credentials**
   - Copy the Client ID and Client Secret
   - Open your `.env` file in `frontend/react-landing/backend/.env`
   - Replace the placeholder values:
     ```
     GOOGLE_CLIENT_ID=your_actual_client_id_here
     GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
     ```

### 2. Set up MongoDB (if not already done)

1. **Get MongoDB Connection String**
   - Go to https://cloud.mongodb.com/
   - Create a free cluster
   - Get your connection string
   - Replace in `.env`:
     ```
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/memorify
     ```

### 3. Test the Setup

1. **Start the backend server:**
   ```bash
   cd frontend/react-landing/backend
   npm start
   ```

2. **Start the frontend:**
   ```bash
   cd frontend/react-landing
   npm start
   ```

3. **Test Google Login:**
   - Go to http://localhost:3000
   - Click "Login with Google"
   - You should be redirected to Google's OAuth page
   - After authorization, you should be redirected back to the dashboard

## Troubleshooting

### Still getting "Unauthorized"?
1. Check that your `.env` file has the correct values
2. Make sure the redirect URI in Google Console matches exactly: `http://localhost:5000/api/auth/google/callback`
3. Restart both frontend and backend servers after making changes
4. Check the browser console and server logs for specific error messages

### Common Issues:
- **Wrong redirect URI**: Must be exactly `http://localhost:5000/api/auth/google/callback`
- **Missing environment variables**: Make sure `.env` file exists and has all required values
- **CORS issues**: The server is already configured for CORS, but make sure both servers are running
- **Port conflicts**: Make sure ports 3000 and 5000 are available

## Security Notes
- Never commit your `.env` file to version control
- Use different credentials for production
- The JWT_SECRET and SESSION_SECRET are already generated securely
