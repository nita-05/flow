# Best of Us Backend API

A comprehensive Node.js/Express backend for the Best of Us AI Video Search Platform.

## 🚀 Features

- **User Authentication** - JWT-based authentication with registration and login
- **Google OAuth** - Sign in with Google integration
- **Password Security** - bcrypt password hashing
- **Data Validation** - Express-validator for input validation
- **Security** - Helmet for security headers, rate limiting
- **Database** - MongoDB with Mongoose ODM
- **CORS** - Cross-origin resource sharing configuration

## 🔴 IMPORTANT: OAuth Error Fix

If you're seeing **"Unauthorized"** errors with Google OAuth, see:
- **[FIX_OAUTH_ERROR.md](./FIX_OAUTH_ERROR.md)** - Complete fix guide
- **[GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)** - Detailed OAuth setup

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## 🛠️ Installation

1. **Navigate to backend directory:**
   ```bash
   cd frontend/react-landing/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   **Option A - Quick Setup (Recommended):**
   ```bash
   node setup-env.js
   ```
   This will automatically create a `.env` file with secure JWT and session secrets.
   
   **Option B - Manual Setup:**
   ```bash
   cp env.example .env
   ```

4. **Configure Google OAuth (Required for Google Sign-In):**
   ```bash
   node update-google-credentials.js
   ```
   Or manually edit `.env` and add your Google OAuth credentials.
   
   See [FIX_OAUTH_ERROR.md](./FIX_OAUTH_ERROR.md) for detailed setup instructions.

5. **Update MongoDB connection:**
   Edit `.env` and set your MongoDB connection string:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/memorify
   ```

## 🏃‍♂️ Running the Server

### Development Mode:
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/register`
Register a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### POST `/api/auth/login`
Login user
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/me`
Get current user profile (requires authentication)

#### PUT `/api/auth/profile`
Update user profile (requires authentication)

#### PUT `/api/auth/change-password`
Change user password (requires authentication)

#### POST `/api/auth/logout`
Logout user (requires authentication)

#### GET `/api/auth/verify`
Verify JWT token (requires authentication)

### User Routes (`/api/users`)

#### GET `/api/users/stats`
Get user statistics (requires authentication)

#### DELETE `/api/users/account`
Delete user account (requires authentication)

### File Routes (`/api/files`)

#### GET `/api/files/upload`
File upload endpoint (requires authentication) - Coming soon

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String (required, 2-50 chars),
  email: String (required, unique, valid email),
  password: String (required, min 6 chars, hashed),
  avatar: String (optional),
  isEmailVerified: Boolean (default: false),
  preferences: {
    theme: String (enum: ['light', 'dark']),
    notifications: {
      email: Boolean,
      push: Boolean
    }
  },
  subscription: {
    plan: String (enum: ['free', 'premium', 'enterprise']),
    startDate: Date,
    endDate: Date
  },
  lastLogin: Date,
  loginCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## 🛡️ Security Features

- **Password Hashing** - bcrypt with salt rounds of 12
- **JWT Tokens** - 7-day expiration
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Input Validation** - Express-validator for all inputs
- **Security Headers** - Helmet middleware
- **CORS Protection** - Configured for frontend domain

## 🧪 Testing the API

### Using curl:

#### Register a new user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

#### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

#### Get user profile (with token):
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/memorify` |
| `JWT_SECRET` | Secret key for JWT signing | Required |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## 📝 Error Handling

The API returns consistent error responses:

```json
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": [] // Validation errors if applicable
}
```

## 🚀 Deployment

### MongoDB Atlas Setup:
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in your `.env` file

### Environment Variables for Production:
- Set `NODE_ENV=production`
- Use a strong, random `JWT_SECRET`
- Configure proper `FRONTEND_URL`
- Set up proper MongoDB Atlas connection

## 📞 Support

For issues or questions, please check the API health endpoint:
```
GET /api/health
```

This will return the server status and timestamp.

---

**Built with ❤️ for Best of Us Platform**
