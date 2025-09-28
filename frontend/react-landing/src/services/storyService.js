const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class StoryService {
  // Get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  // Create a new story
  async createStory(storyData) {
    try {
      const response = await fetch(`${API_URL}/stories/create`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(storyData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create story');
      }

      return await response.json();
    } catch (error) {
      console.error('Create story error:', error);
      throw error;
    }
  }

  // Get user's stories
  async getStories(params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(`${API_URL}/stories?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get stories');
      }

      return await response.json();
    } catch (error) {
      console.error('Get stories error:', error);
      throw error;
    }
  }

  // Get single story
  async getStory(storyId) {
    try {
      const response = await fetch(`${API_URL}/stories/${storyId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get story');
      }

      return await response.json();
    } catch (error) {
      console.error('Get story error:', error);
      throw error;
    }
  }

  // Update story
  async updateStory(storyId, updateData) {
    try {
      const response = await fetch(`${API_URL}/stories/${storyId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update story');
      }

      return await response.json();
    } catch (error) {
      console.error('Update story error:', error);
      throw error;
    }
  }

  // Regenerate story
  async regenerateStory(storyId, regenerateData) {
    try {
      const response = await fetch(`${API_URL}/stories/${storyId}/regenerate`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(regenerateData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to regenerate story');
      }

      return await response.json();
    } catch (error) {
      console.error('Regenerate story error:', error);
      throw error;
    }
  }

  // Delete story
  async deleteStory(storyId) {
    try {
      const response = await fetch(`${API_URL}/stories/${storyId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete story');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete story error:', error);
      throw error;
    }
  }

  // Share story
  async shareStory(storyId) {
    try {
      const response = await fetch(`${API_URL}/stories/${storyId}/share`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to share story');
      }

      return await response.json();
    } catch (error) {
      console.error('Share story error:', error);
      throw error;
    }
  }

  // Get public story by share token
  async getPublicStory(shareToken) {
    try {
      const response = await fetch(`${API_URL}/stories/public/${shareToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get public story');
      }

      return await response.json();
    } catch (error) {
      console.error('Get public story error:', error);
      throw error;
    }
  }

  // Get story templates
  async getTemplates() {
    try {
      const response = await fetch(`${API_URL}/stories/templates/list`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get templates');
      }

      return await response.json();
    } catch (error) {
      console.error('Get templates error:', error);
      throw error;
    }
  }

  // Get popular public stories
  async getPopularStories(limit = 10) {
    try {
      const response = await fetch(`${API_URL}/stories/public/popular?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get popular stories');
      }

      return await response.json();
    } catch (error) {
      console.error('Get popular stories error:', error);
      throw error;
    }
  }

  // Search public stories
  async searchPublicStories(searchData) {
    try {
      const response = await fetch(`${API_URL}/stories/public/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to search stories');
      }

      return await response.json();
    } catch (error) {
      console.error('Search stories error:', error);
      throw error;
    }
  }

  // Get story statistics
  async getStoryStats(storyId) {
    try {
      const response = await fetch(`${API_URL}/stories/${storyId}/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get story stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Get story stats error:', error);
      throw error;
    }
  }

  // Helper method to format story for display
  formatStoryForDisplay(story) {
    return {
      ...story,
      readingTime: Math.ceil(story.wordCount / 200), // Average reading speed
      formattedDate: new Date(story.createdAt).toLocaleDateString(),
      shortDescription: story.description ? 
        story.description.substring(0, 100) + (story.description.length > 100 ? '...' : '') : 
        story.content.substring(0, 100) + '...'
    };
  }

  // Helper method to validate story data
  validateStoryData(storyData) {
    const errors = [];

    if (!storyData.title || storyData.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long');
    }

    if (!storyData.prompt || storyData.prompt.trim().length < 10) {
      errors.push('Prompt must be at least 10 characters long');
    }

    if (!storyData.fileIds || storyData.fileIds.length === 0) {
      errors.push('At least one file is required');
    }

    if (storyData.description && storyData.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Helper method to get story themes
  getStoryThemes() {
    return [
      { value: 'happy', label: 'Happy Moments', icon: '😊' },
      { value: 'adventure', label: 'Adventure', icon: '🗺️' },
      { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
      { value: 'friends', label: 'Friends', icon: '👫' },
      { value: 'travel', label: 'Travel', icon: '✈️' },
      { value: 'celebration', label: 'Celebration', icon: '🎉' },
      { value: 'achievement', label: 'Achievement', icon: '🏆' },
      { value: 'love', label: 'Love', icon: '💕' },
      { value: 'custom', label: 'Custom', icon: '✨' }
    ];
  }

  // Helper method to get story moods
  getStoryMoods() {
    return [
      { value: 'uplifting', label: 'Uplifting', icon: '🌟' },
      { value: 'nostalgic', label: 'Nostalgic', icon: '📸' },
      { value: 'exciting', label: 'Exciting', icon: '⚡' },
      { value: 'peaceful', label: 'Peaceful', icon: '🕊️' },
      { value: 'romantic', label: 'Romantic', icon: '💖' },
      { value: 'inspiring', label: 'Inspiring', icon: '💫' },
      { value: 'funny', label: 'Funny', icon: '😄' },
      { value: 'dramatic', label: 'Dramatic', icon: '🎭' }
    ];
  }

  // Generate animated film from story
  async generateAnimatedFilm(storyId, filmData) {
    try {
      const response = await fetch(`${API_URL}/stories/${storyId}/generate-film`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(filmData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate animated film');
      }

      return await response.json();
    } catch (error) {
      console.error('Generate animated film error:', error);
      throw error;
    }
  }

  // Get animated film status
  async getAnimatedFilmStatus(storyId) {
    try {
      const response = await fetch(`${API_URL}/stories/${storyId}/film-status`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get film status');
      }

      return await response.json();
    } catch (error) {
      console.error('Get film status error:', error);
      throw error;
    }
  }

  // Get available film styles
  async getFilmStyles() {
    try {
      const response = await fetch(`${API_URL}/stories/film-styles/list`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get film styles');
      }

      return await response.json();
    } catch (error) {
      console.error('Get film styles error:', error);
      throw error;
    }
  }

  // Delete animated film
  async deleteAnimatedFilm(storyId) {
    try {
      const response = await fetch(`${API_URL}/stories/${storyId}/film`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete animated film');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete animated film error:', error);
      throw error;
    }
  }

  // Helper method to get film styles (static)
  getFilmStylesStatic() {
    return [
      {
        id: 'heartwarming',
        name: 'Heartwarming Animation',
        description: 'Warm, cozy animation with soft colors and loving characters',
        icon: '💕',
        cost: 0.10
      },
      {
        id: 'adventure',
        name: 'Adventure Animation',
        description: 'Dynamic, exciting animation with vibrant colors and movement',
        icon: '🗺️',
        cost: 0.12
      },
      {
        id: 'celebration',
        name: 'Celebration Animation',
        description: 'Festive, joyful animation with bright, celebratory colors',
        icon: '🎉',
        cost: 0.10
      },
      {
        id: 'nostalgic',
        name: 'Nostalgic Animation',
        description: 'Warm, reflective animation with vintage-inspired visuals',
        icon: '📸',
        cost: 0.11
      },
      {
        id: 'minimalist',
        name: 'Minimalist Animation',
        description: 'Clean, simple animation with elegant, understated visuals',
        icon: '✨',
        cost: 0.08
      },
      {
        id: 'cinematic',
        name: 'Cinematic Animation',
        description: 'Professional, movie-quality animation with dramatic visuals',
        icon: '🎬',
        cost: 0.15
      }
    ];
  }

  // Helper method to get film durations (static)
  getFilmDurationsStatic() {
    return [
      { value: 15, label: '15 seconds', cost: 1.50, description: 'Quick highlight reel' },
      { value: 30, label: '30 seconds', cost: 3.00, description: 'Perfect story length' },
      { value: 60, label: '1 minute', cost: 6.00, description: 'Full narrative' },
      { value: 90, label: '1.5 minutes', cost: 9.00, description: 'Extended story' }
    ];
  }

  // Update story content (inline editing)
  async updateStoryContent(storyId, content, changes = 'Content manually edited') {
    try {
      const response = await fetch(`${API_URL}/stories/${storyId}/content`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ content, changes })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update story content');
      }

      return await response.json();
    } catch (error) {
      console.error('Update story content error:', error);
      throw error;
    }
  }

  // Update story structure (reorder files, add/remove files)
  async updateStoryStructure(storyId, files) {
    try {
      const response = await fetch(`${API_URL}/stories/${storyId}/structure`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ files })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update story structure');
      }

      return await response.json();
    } catch (error) {
      console.error('Update story structure error:', error);
      throw error;
    }
  }

  // Get story version history
  async getStoryVersions(storyId) {
    try {
      const response = await fetch(`${API_URL}/stories/${storyId}/versions`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get story versions');
      }

      return await response.json();
    } catch (error) {
      console.error('Get story versions error:', error);
      throw error;
    }
  }

  // Restore story to previous version
  async restoreStoryVersion(storyId, version) {
    try {
      const response = await fetch(`${API_URL}/stories/${storyId}/restore/${version}`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to restore story version');
      }

      return await response.json();
    } catch (error) {
      console.error('Restore story version error:', error);
      throw error;
    }
  }
}

export default new StoryService();
