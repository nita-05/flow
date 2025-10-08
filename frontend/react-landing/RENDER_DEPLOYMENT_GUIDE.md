# 🚀 Render.com Backend Deployment Guide

## 📋 Prerequisites
- GitHub repository: https://github.com/nita-05/flow.git
- Render.com account (free tier available)
- Environment variables ready

## 🔧 Step-by-Step Deployment

### 1. Create New Web Service on Render
1. Go to [Render.com](https://render.com)
2. Sign up/Login with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository: `nita-05/flow`

### 2. Configure Build Settings
- **Name**: `memorify-studio-backend`
- **Root Directory**: `frontend/react-landing/backend`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 3. Environment Variables
Add these in Render dashboard under "Environment":

```env
# Database
MONGODB_URI=your_mongodb_connection_string_here

# Security
SESSION_SECRET=your_production_session_secret_here
JWT_SECRET=your_production_jwt_secret_here

# APIs
OPENAI_API_KEY=your_openai_api_key_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# CORS (will be updated after frontend deployment)
CORS_ORIGIN=https://your-vercel-app.vercel.app

# Optional
NODE_ENV=production
PORT=10000
```

### 4. Deploy
1. Click **"Create Web Service"**
2. Wait for build to complete (5-10 minutes)
3. Note the backend URL: `https://memorify-studio-backend.onrender.com`

### 5. Update CORS After Frontend Deployment
Once you have your Vercel frontend URL, update the `CORS_ORIGIN` environment variable in Render.

## 🔗 Backend URL
Your backend will be available at:
`https://memorify-studio-backend.onrender.com`

## 📝 Important Notes
- Render free tier has cold starts (may take 30 seconds to wake up)
- Environment variables are secure and not visible in logs
- Automatic deployments on git push to main branch
- Logs available in Render dashboard

## 🚨 Troubleshooting
- If build fails, check the logs in Render dashboard
- Ensure all environment variables are set correctly
- Verify MongoDB connection string is correct
- Check that all dependencies are in package.json
