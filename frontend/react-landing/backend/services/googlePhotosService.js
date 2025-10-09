const axios = require('axios');
const cloudinaryService = require('./cloudinaryService');

class GooglePhotosService {
  constructor() {
    this.clientId = process.env.GOOGLE_PHOTOS_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_PHOTOS_CLIENT_SECRET;
    this.redirectUri = process.env.GOOGLE_PHOTOS_REDIRECT_URI;
    this.scope = 'https://www.googleapis.com/auth/photoslibrary.readonly';
    this.apiBaseUrl = 'https://photoslibrary.googleapis.com/v1';
  }

  /**
   * Generate Google OAuth authorization URL
   */
  getAuthUrl(state = null) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    if (state) {
      params.append('state', state);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri
      });

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
        token_type: response.data.token_type
      };
    } catch (error) {
      console.error('Error exchanging code for token:', error.response?.data || error.message);
      throw new Error('Failed to exchange authorization code for access token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      });

      return {
        access_token: response.data.access_token,
        expires_in: response.data.expires_in,
        token_type: response.data.token_type
      };
    } catch (error) {
      console.error('Error refreshing access token:', error.response?.data || error.message);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Get user's Google Photos media items
   */
  async getMediaItems(accessToken, pageSize = 50, pageToken = null) {
    try {
      const params = new URLSearchParams({
        pageSize: pageSize.toString()
      });

      if (pageToken) {
        params.append('pageToken', pageToken);
      }

      const response = await axios.get(
        `${this.apiBaseUrl}/mediaItems?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching media items:', error.response?.data || error.message);
      throw new Error('Failed to fetch Google Photos media items');
    }
  }

  /**
   * Get specific media item details
   */
  async getMediaItem(accessToken, mediaItemId) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/mediaItems/${mediaItemId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching media item:', error.response?.data || error.message);
      throw new Error('Failed to fetch Google Photos media item');
    }
  }

  /**
   * Download media file from Google Photos
   */
  async downloadMediaFile(accessToken, mediaItem) {
    try {
      const downloadUrl = mediaItem.baseUrl;
      
      const response = await axios.get(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        responseType: 'stream'
      });

      return response.data;
    } catch (error) {
      console.error('Error downloading media file:', error.response?.data || error.message);
      throw new Error('Failed to download media file from Google Photos');
    }
  }

  /**
   * Import media item to your app (download and upload to Cloudinary)
   */
  async importMediaItem(accessToken, mediaItem, userId) {
    try {
      // Download the file from Google Photos
      const fileStream = await this.downloadMediaFile(accessToken, mediaItem);
      
      // Upload to Cloudinary
      const uploadResult = await cloudinaryService.uploadFromStream(fileStream, {
        folder: `users/${userId}/google-photos`,
        resource_type: 'auto',
        public_id: `google_photos_${mediaItem.id}`
      });

      return {
        ...uploadResult,
        googlePhotosId: mediaItem.id,
        originalFilename: mediaItem.filename,
        mimeType: mediaItem.mimeType,
        creationTime: mediaItem.mediaMetadata?.creationTime
      };
    } catch (error) {
      console.error('Error importing media item:', error);
      throw new Error('Failed to import media item from Google Photos');
    }
  }

  /**
   * Import multiple media items
   */
  async importMultipleMediaItems(accessToken, mediaItems, userId) {
    const results = [];
    const errors = [];

    for (const mediaItem of mediaItems) {
      try {
        const result = await this.importMediaItem(accessToken, mediaItem, userId);
        results.push(result);
      } catch (error) {
        errors.push({
          mediaItemId: mediaItem.id,
          error: error.message
        });
      }
    }

    return {
      successful: results,
      failed: errors
    };
  }

  /**
   * Search media items by date range or other criteria
   */
  async searchMediaItems(accessToken, filters = {}, pageSize = 50, pageToken = null) {
    try {
      const requestBody = {
        pageSize: pageSize,
        filters: filters
      };

      if (pageToken) {
        requestBody.pageToken = pageToken;
      }

      const response = await axios.post(
        `${this.apiBaseUrl}/mediaItems:search`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error searching media items:', error.response?.data || error.message);
      throw new Error('Failed to search Google Photos media items');
    }
  }
}

module.exports = new GooglePhotosService();
