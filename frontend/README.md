# Best of Us - Professional Website

A modern, professional website for "Best of Us" - Humanity's Video Search Engine, inspired by Persist Ventures design with real Google OAuth integration.

## 🚀 Features

- **Professional Landing Page** - Modern design inspired by Persist Ventures
- **Google OAuth Integration** - Real Google Sign-In functionality
- **Responsive Design** - Works on all devices
- **Dashboard** - Complete video search and story generation platform
- **AI-Powered Features** - File upload, semantic search, story generation

## 📁 Project Structure

```
frontend/
├── index.html          # Landing page
├── dashboard.html      # User dashboard
├── css/
│   ├── styles.css      # Landing page styles
│   └── dashboard.css   # Dashboard styles
├── js/
│   ├── main.js         # Landing page functionality
│   └── dashboard.js    # Dashboard functionality
└── README.md          # This file
```

## 🔧 Setup Instructions

### 1. Google OAuth Setup

To enable Google Sign-In, you need to:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project**
   - Click "New Project"
   - Name it "Best of Us" or similar
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized origins:
     - `http://localhost:3000` (for local development)
     - `https://yourdomain.com` (for production)
   - Click "Create"

5. **Get Your Client ID**
   - Copy the Client ID from the credentials page

6. **Update the Code**
   - Open `frontend/js/main.js`
   - Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID
   - Also update the `data-client_id` in `frontend/index.html`

### 2. Local Development

1. **Serve the Files**
   ```bash
   # Using Python (if installed)
   python -m http.server 8000
   
   # Using Node.js (if installed)
   npx serve .
   
   # Or simply open index.html in your browser
   ```

2. **Access the Website**
   - Open: `http://localhost:8000`
   - Or double-click `index.html`

### 3. Production Deployment

For production deployment, you can use:

- **Netlify** (Recommended)
  - Drag and drop the `frontend` folder to Netlify
  - Add your domain to Google OAuth authorized origins

- **Vercel**
  - Connect your GitHub repository
  - Deploy automatically

- **GitHub Pages**
  - Push to GitHub repository
  - Enable GitHub Pages in settings

## 🎯 How It Works

### Landing Page (`index.html`)
- Professional design inspired by Persist Ventures
- Google OAuth integration
- Responsive navigation
- Call-to-action sections
- Modern animations and effects

### Dashboard (`dashboard.html`)
- **File Upload**: Drag & drop functionality
- **AI Processing**: Simulated GPT Vision tagging
- **Semantic Search**: Search by meaning, not keywords
- **Story Generation**: Create "Best of Us" narratives
- **User Management**: Profile and logout

### Authentication Flow
1. User clicks "Get Started" or "Login"
2. Modal opens with Google Sign-In button
3. User authenticates with Google
4. User data is stored in localStorage
5. Redirect to dashboard

## 🔑 Key Features

### Google OAuth Integration
- Real Google Sign-In button
- JWT token handling
- User profile extraction
- Secure authentication flow

### Professional Design
- Clean, modern interface
- Responsive layout
- Smooth animations
- Professional typography
- Consistent color scheme

### AI-Powered Platform
- File upload with progress tracking
- Intelligent tagging simulation
- Semantic search functionality
- Story generation with multiple styles
- Export and sharing capabilities

## 🛠️ Customization

### Colors
Edit CSS variables in `css/styles.css`:
```css
:root {
    --primary-color: #1a1a1a;
    --secondary-color: #f59e0b;
    --accent-color: #10b981;
    /* ... */
}
```

### Content
- Update text in `index.html`
- Modify company information
- Change feature descriptions
- Update contact information

### Functionality
- Extend search capabilities in `js/dashboard.js`
- Add more story templates
- Implement real AI APIs
- Add user management features

## 📱 Mobile Responsive

The website is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All screen sizes

## 🔒 Security Notes

- Google OAuth provides secure authentication
- User data is stored locally (localStorage)
- For production, implement proper backend security
- Use HTTPS in production
- Validate all user inputs

## 🚀 Next Steps

1. **Set up Google OAuth** (see instructions above)
2. **Test the authentication flow**
3. **Customize the content** for your brand
4. **Deploy to production**
5. **Add real AI APIs** for actual functionality
6. **Implement backend** for data persistence

## 📞 Support

For questions or issues:
1. Check the Google OAuth setup
2. Verify your Client ID is correct
3. Ensure authorized origins are set
4. Check browser console for errors

## 🎉 Ready to Launch!

Your professional "Best of Us" website is ready! Just add your Google Client ID and deploy to start attracting users and investors.

---

**Built with ❤️ for the Start-Upathon competition**
