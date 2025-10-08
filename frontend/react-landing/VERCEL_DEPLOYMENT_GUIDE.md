# 🚀 Vercel.com Frontend Deployment Guide

## 📋 Prerequisites
- GitHub repository: https://github.com/nita-05/flow.git
- Vercel account (free tier available)
- Backend deployed on Render (for API URL)

## 🔧 Step-by-Step Deployment

### 1. Connect Repository to Vercel
1. Go to [Vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click **"New Project"**
4. Import repository: `nita-05/flow`

### 2. Configure Build Settings
- **Framework Preset**: `Create React App`
- **Root Directory**: `frontend/react-landing`
- **Build Command**: `npm run build`
- **Output Directory**: `build`

### 3. Environment Variables
Add these in Vercel dashboard under "Environment Variables":

```env
# Backend API URL (update after Render deployment)
REACT_APP_API_URL=https://memorify-studio-backend.onrender.com

# Optional
REACT_APP_ENVIRONMENT=production
```

**Note:** Make sure to set `REACT_APP_API_URL` in your Vercel environment variables to point to your Render backend URL.

### 4. Deploy
1. Click **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Get your frontend URL: `https://memorify-studio.vercel.app`

### 5. Update Backend CORS
1. Go to Render dashboard
2. Update `CORS_ORIGIN` environment variable to your Vercel URL
3. Redeploy backend

## 🔗 Frontend URL
Your frontend will be available at:
`https://memorify-studio.vercel.app`

## 📝 Important Notes
- Vercel provides instant deployments
- Automatic deployments on git push to main branch
- Global CDN for fast loading
- Custom domain available (optional)

## 🔄 Update API URL
After deployment, update the API URL in your code:

1. In Vercel dashboard, go to Environment Variables
2. Update `REACT_APP_API_URL` to your Render backend URL
3. Redeploy (or it will auto-deploy on next push)

## 🚨 Troubleshooting
- If build fails, check the build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify the backend URL is correct
- Check that all dependencies are in package.json

## 🎯 Next Steps
1. Test the frontend at your Vercel URL
2. Test API calls to your Render backend
3. Update Google OAuth redirect URLs
4. Test all features end-to-end
