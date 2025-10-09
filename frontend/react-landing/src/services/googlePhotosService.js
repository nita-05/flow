const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class GooglePhotosService {
  /**
   * Initiate Google Photos OAuth flow
   */
  async initiateAuth() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/google-photos/auth`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || 'Failed to initiate Google Photos authentication');
      }
    } catch (error) {
      console.error('Error initiating Google Photos auth:', error);
      throw error;
    }
  }

  /**
   * Check Google Photos connection status
   */
  async getConnectionStatus() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/google-photos/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to check Google Photos connection status');
      }
    } catch (error) {
      console.error('Error checking Google Photos status:', error);
      return { connected: false };
    }
  }

  /**
   * Get user's Google Photos media items
   */
  async getMediaItems(pageSize = 50, pageToken = null) {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        pageSize: pageSize.toString()
      });

      if (pageToken) {
        params.append('pageToken', pageToken);
      }

      const response = await fetch(`${API_BASE_URL}/google-photos/media?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch Google Photos media items');
      }
    } catch (error) {
      console.error('Error fetching Google Photos media:', error);
      throw error;
    }
  }

  /**
   * Import selected media items from Google Photos
   */
  async importMediaItems(mediaItemIds) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/google-photos/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mediaItemIds: mediaItemIds
        })
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to import Google Photos media items');
      }
    } catch (error) {
      console.error('Error importing Google Photos media:', error);
      throw error;
    }
  }

  /**
   * Disconnect Google Photos integration
   */
  async disconnect() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/google-photos/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        return data.message;
      } else {
        throw new Error(data.error || 'Failed to disconnect Google Photos');
      }
    } catch (error) {
      console.error('Error disconnecting Google Photos:', error);
      throw error;
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get file type icon based on MIME type
   */
  getFileTypeIcon(mimeType) {
    if (mimeType.startsWith('image/')) {
      return '🖼️';
    } else if (mimeType.startsWith('video/')) {
      return '🎥';
    } else {
      return '📄';
    }
  }

  /**
   * Check if file is supported for import
   */
  isFileSupported(mimeType) {
    const supportedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      'video/webm'
    ];
    
    return supportedTypes.includes(mimeType);
  }
}

const googlePhotosService = new GooglePhotosService();
export default googlePhotosService;