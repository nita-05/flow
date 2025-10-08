const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class FileService {
  // Get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  // Get user's files
  async getFiles(params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(`${API_URL}/files?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get files');
      }

      return await response.json();
    } catch (error) {
      console.error('Get files error:', error);
      throw error;
    }
  }

  // Get single file
  async getFile(fileId) {
    try {
      const response = await fetch(`${API_URL}/files/${fileId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get file');
      }

      return await response.json();
    } catch (error) {
      console.error('Get file error:', error);
      throw error;
    }
  }

  // Update file metadata
  async updateFileMetadata(fileId, metadata) {
    try {
      const response = await fetch(`${API_URL}/files/${fileId}/metadata`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(metadata)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update file metadata');
      }

      return await response.json();
    } catch (error) {
      console.error('Update file metadata error:', error);
      throw error;
    }
  }

  // Batch update multiple files metadata
  async batchUpdateFileMetadata(files) {
    try {
      const response = await fetch(`${API_URL}/files/batch/metadata`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ files })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to batch update file metadata');
      }

      return await response.json();
    } catch (error) {
      console.error('Batch update file metadata error:', error);
      throw error;
    }
  }

  // Delete file
  async deleteFile(fileId) {
    try {
      const response = await fetch(`${API_URL}/files/${fileId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete file');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  }

  // Search files
  async searchFiles(searchData) {
    try {
      const response = await fetch(`${API_URL}/files/search`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(searchData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to search files');
      }

      return await response.json();
    } catch (error) {
      console.error('Search files error:', error);
      throw error;
    }
  }

  // Debug search readiness
  async debugSearchReadiness() {
    try {
      const response = await fetch(`${API_URL}/files/debug/search-readiness`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get debug info');
      }

      return await response.json();
    } catch (error) {
      console.error('Debug search readiness error:', error);
      throw error;
    }
  }

  // Reprocess embeddings for better search
  async reprocessEmbeddings() {
    try {
      const response = await fetch(`${API_URL}/files/reprocess-embeddings`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reprocess embeddings');
      }

      return await response.json();
    } catch (error) {
      console.error('Reprocess embeddings error:', error);
      throw error;
    }
  }

  // Get file processing status
  async getFileStatus(fileId) {
    try {
      const response = await fetch(`${API_URL}/files/${fileId}/status`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get file status');
      }

      return await response.json();
    } catch (error) {
      console.error('Get file status error:', error);
      throw error;
    }
  }

  // Get file transcription
  async getFileTranscription(fileId) {
    try {
      const response = await fetch(`${API_URL}/files/${fileId}/transcription`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get file transcription');
      }

      return await response.json();
    } catch (error) {
      console.error('Get file transcription error:', error);
      throw error;
    }
  }

  // Get file editing history
  async getFileHistory(fileId) {
    try {
      const response = await fetch(`${API_URL}/files/${fileId}/history`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get file history');
      }

      return await response.json();
    } catch (error) {
      console.error('Get file history error:', error);
      throw error;
    }
  }

  // Upload single file
  async uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload file');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(files) {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_URL}/files/upload-multiple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload files');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload multiple files error:', error);
      throw error;
    }
  }

  // Helper method to format file for display
  formatFileForDisplay(file) {
    return {
      ...file,
      fileSizeFormatted: this.formatFileSize(file.fileSize),
      durationFormatted: this.formatDuration(file.duration),
      formattedDate: new Date(file.createdAt).toLocaleDateString(),
      tags: file.visionTags?.map(t => t.tag) || [],
      hasTranscription: !!(file.transcription?.text),
      hasVisualAnalysis: !!(file.aiDescription)
    };
  }

  // Helper method to format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper method to format duration
  formatDuration(seconds) {
    if (!seconds) return null;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  // Helper method to validate file metadata
  validateFileMetadata(metadata) {
    const errors = [];

    if (metadata.tags && !Array.isArray(metadata.tags)) {
      errors.push('Tags must be an array');
    }

    if (metadata.description && metadata.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }

    if (metadata.categories && !Array.isArray(metadata.categories)) {
      errors.push('Categories must be an array');
    }

    if (metadata.keywords && !Array.isArray(metadata.keywords)) {
      errors.push('Keywords must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Helper method to get file type icon
  getFileTypeIcon(fileType) {
    const icons = {
      'image': '🖼️',
      'video': '🎥',
      'audio': '🎵'
    };
    return icons[fileType] || '📄';
  }

  // Helper method to get file type color
  getFileTypeColor(fileType) {
    const colors = {
      'image': 'text-green-400',
      'video': 'text-blue-400',
      'audio': 'text-purple-400'
    };
    return colors[fileType] || 'text-gray-400';
  }
}

const fileService = new FileService();
export default fileService;
