const API_BASE_URL = '/api';
console.log('🔍 API_BASE_URL:', API_BASE_URL);
console.log('🔍 REACT_APP_API_URL env var:', process.env.REACT_APP_API_URL);

class AuthService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  // Set token in localStorage and instance
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  // Remove token from localStorage and instance
  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Get stored token (always check localStorage for fresh tokens)
  getToken() {
    // Always check localStorage first to get the latest token
    const freshToken = localStorage.getItem('token');
    if (freshToken && freshToken !== this.token) {
      this.token = freshToken;
    }
    return this.token || localStorage.getItem('token');
  }

  // Get stored user data
  getUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  // Set user data in localStorage
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Check if user is authenticated
  isAuthenticated() {
    const hasToken = !!this.getToken();
    const hasUser = !!this.getUser();
    console.log('isAuthenticated check:', hasToken || hasUser, 'token:', hasToken, 'user:', hasUser);
    return hasToken || hasUser;
  }

  // Make authenticated API request
  async makeAuthenticatedRequest(url, options = {}) {
    const token = this.getToken();
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, config);
      
      // If token is invalid or expired, clear it
      if (response.status === 401) {
        this.removeToken();
        window.location.href = '/';
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Register new user
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store token and user data
      this.setToken(data.token);
      this.setUser(data.user);

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  async login(credentials) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user data
      this.setToken(data.token);
      this.setUser(data.user);

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout user
  async logout() {
    try {
      // Try session-based logout first (for Google OAuth users)
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local data
      this.removeToken();
    }
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      console.log('Getting current user...');
      // Try session-based authentication first (for Google OAuth users)
      const response = await fetch(`${API_BASE_URL}/auth/session`, {
        credentials: 'include'
      });
      
      console.log('Session response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Session data received:', data);
        this.setUser(data.user);
        return data.user;
      }
      
      console.log('Session failed, trying JWT...');
      // Fallback to JWT authentication
      const data = await this.makeAuthenticatedRequest('/auth/me');
      this.setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const data = await this.makeAuthenticatedRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      this.setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(passwordData) {
    try {
      const data = await this.makeAuthenticatedRequest('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(passwordData),
      });

      return data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // Verify token
  async verifyToken() {
    try {
      const data = await this.makeAuthenticatedRequest('/auth/verify');
      this.setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Token verification error:', error);
      this.removeToken();
      throw error;
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const data = await this.makeAuthenticatedRequest('/users/stats');
      return data.stats;
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  // Delete account
  async deleteAccount() {
    try {
      const data = await this.makeAuthenticatedRequest('/users/account', {
        method: 'DELETE',
      });

      this.removeToken();
      return data;
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;
