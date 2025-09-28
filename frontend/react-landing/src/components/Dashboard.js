import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import storyService from '../services/storyService';
import { pickGooglePhotos } from '../services/googlePhotosService';
import fileService from '../services/fileService';
import StoryEditor from './StoryEditor';
import FileEditor from './FileEditor';
import StoryStructureEditor from './StoryStructureEditor';
import StoryVersionHistory from './StoryVersionHistory';

const Dashboard = () => {
  console.log('Dashboard component loaded');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upload');
  const [stories, setStories] = useState([]);
  const [files, setFiles] = useState([]);
  const [, setIsCreatingStory] = useState(false);
  const [isGeneratingFilm, setIsGeneratingFilm] = useState(false);
  const [, setGeneratedFilm] = useState(null);
  const [, setFilmStyles] = useState([]);
  const [, setFilmDurations] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedStory, setGeneratedStory] = useState('');
  
  // Editing states
  const [editingStory, setEditingStory] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [editingStructure, setEditingStructure] = useState(null);
  const [viewingVersions, setViewingVersions] = useState(null);

  useEffect(() => {
    console.log('Dashboard useEffect running');
    
    // First, try to get user from session (for Google OAuth users)
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');
        const userData = await authService.getCurrentUser();
        console.log('User authenticated successfully:', userData);
        console.log('Profile picture URLs:', {
          avatar: userData.avatar,
          picture: userData.picture,
          imageUrl: userData.imageUrl
        });
        
        // Debug: Show which URL will be used
        const profilePicUrl = userData.avatar || userData.picture || userData.imageUrl;
        console.log('Using profile picture URL:', profilePicUrl);
        setUser(userData);
        // Load user's files and stories
        await loadUserData();
        setIsLoading(false);
      } catch (error) {
        console.log('Authentication failed:', error);
        // If session-based auth fails, check localStorage
        const localUser = authService.getUser();
        if (localUser) {
          console.log('Using local user data:', localUser);
          setUser(localUser);
          // Load user's files and stories
          await loadUserData();
          setIsLoading(false);
        } else {
          console.log('No authentication found, redirecting to home');
          setIsLoading(false);
          window.history.pushState({}, '', '/');
          window.location.reload();
        }
      }
    };

    checkAuth();
  }, []);

  const loadUserData = async () => {
    try {
      // Load files and stories in parallel
      const [filesResponse, storiesResponse] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/files`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        storyService.getStories()
      ]);

      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        setFiles(filesData.files || []);
      }

      if (storiesResponse.stories) {
        setStories(storiesResponse.stories);
      }

      // Load film styles and durations
      // setFilmStyles(storyService.getFilmStylesStatic());
      // setFilmDurations(storyService.getFilmDurationsStatic());
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const filesToUpload = Array.from(event.target.files || []);
    if (filesToUpload.length === 0) return;

    try {
      setIsProcessing(true);

      // Upload files sequentially to show clearer progress
      for (const file of filesToUpload) {
        await fileService.uploadFile(file);
      }

      // After upload, refresh list and poll until processing completes
      await loadUserData();

      // Poll processing status for a short period so the user sees real results
      const pollUntil = Date.now() + 90_000; // up to 90 seconds
      while (Date.now() < pollUntil) {
        const refreshed = await fileService.getFiles();
        const items = (refreshed.files || []);
        const hasProcessing = items.some(f => f.status !== 'completed');
        setFiles(items);
        if (!hasProcessing) break;
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (error) {
      console.error('Upload handling failed:', error);
      alert(error.message || 'Upload failed');
    } finally {
      setIsProcessing(false);
      // Clear the input value so selecting the same file again re-triggers change
      if (event.target) event.target.value = '';
    }
  };

  // Removed mock tag/transcript generators. Results now come from backend processing.

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    // Simulate AI search
    const results = uploadedFiles.filter(file => 
      file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      file.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setSearchResults(results);
  };

  const _generateStory = async () => {
    if (searchResults.length === 0) {
      alert('Please search for memories first to generate a story!');
      return;
    }
    
    setIsCreatingStory(true);
    
    try {
      const storyData = {
        title: `My Story - ${new Date().toLocaleDateString()}`,
        prompt: `Create a beautiful story from these ${searchResults.length} memories. Focus on the positive moments and meaningful connections.`,
        fileIds: searchResults.map(file => file._id),
        theme: 'custom',
        mood: 'uplifting',
        description: 'A beautiful story generated from my memories'
      };

      const result = await storyService.createStory(storyData);
      
      if (result.story) {
        setGeneratedStory(result.story.content);
        // Refresh stories list
        await loadUserData();
        alert('Story created successfully!');
      }
    } catch (error) {
      console.error('Story generation failed:', error);
      alert('Failed to generate story: ' + error.message);
    } finally {
      setIsCreatingStory(false);
    }
  };

  const generateAnimatedFilm = async (storyId, style = 'heartwarming', duration = 30) => {
    try {
      setIsGeneratingFilm(true);
      
      const filmData = {
        style,
        duration,
        mood: 'uplifting'
      };

      const result = await storyService.generateAnimatedFilm(storyId, filmData);
      
      if (result.film) {
        alert('Animated film generation started! Check back in a few minutes.');
        // Refresh stories to show updated film status
        await loadUserData();
      }
    } catch (error) {
      console.error('Film generation failed:', error);
      alert('Failed to generate animated film: ' + error.message);
    } finally {
      setIsGeneratingFilm(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Navigate back to home page
      window.history.pushState({}, '', '/');
      window.location.reload(); // Reload to trigger route change
    }
  };

  // Editing handlers
  const handleEditStory = (story) => {
    setEditingStory(story);
  };

  const _handleEditFile = (file) => {
    setEditingFile(file);
  };

  const handleEditStructure = (story) => {
    setEditingStructure(story);
  };

  const handleViewVersions = (story) => {
    setViewingVersions(story);
  };

  const handleStorySaved = (updatedStory) => {
    setStories(stories.map(s => s._id === updatedStory.id ? { ...s, ...updatedStory } : s));
    setEditingStory(null);
  };

  const handleFileSaved = (updatedFile) => {
    setFiles(files.map(f => f._id === updatedFile.id ? { ...f, ...updatedFile } : f));
    setEditingFile(null);
  };

  const handleStructureSaved = (updatedStory) => {
    setStories(stories.map(s => s._id === updatedStory.id ? { ...s, ...updatedStory } : s));
    setEditingStructure(null);
  };

  const handleVersionRestored = (updatedStory) => {
    setStories(stories.map(s => s._id === updatedStory.id ? { ...s, ...updatedStory } : s));
    setViewingVersions(null);
  };

  const handleCloseEditor = () => {
    setEditingStory(null);
    setEditingFile(null);
    setEditingStructure(null);
    setViewingVersions(null);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Redirecting...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-white text-[#0D1B2A]">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#E9F1FA] to-white border-b border-[#DDEBFA]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#00ABE4] rounded-lg flex items-center justify-center ring-2 ring-white">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="4" y="6" width="10" height="9" rx="2" />
                  <path d="M16 8l5 2.8L16 13.6V8z" />
                  <path d="M6 18c3 0 4.5-1.5 6.5-1.5S16 18 19 18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </div>
              <h1 className="text-xl font-bold">Footage Flow Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* User Profile Section */}
              <div className="flex items-center space-x-3">
                {(() => {
                  const src = user.avatar || user.picture || user.imageUrl;
                  if (src) {
                    return (
                      <img
                        src={src.startsWith('http') ? src : `https:${src}`}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full border-2 border-[#DDEBFA]"
                        onError={(e) => {
                          console.log('Image failed to load:', e.target.src);
                          const currentSrc = e.target.src;
                          if (currentSrc.includes('=s128-c')) {
                            e.target.src = currentSrc.replace('=s128-c', '=s96-c');
                          } else if (currentSrc.includes('=s96-c')) {
                            e.target.src = currentSrc.replace('=s96-c', '=s64-c');
                          } else {
                            // Fallback to initials badge
                            e.target.replaceWith(
                              Object.assign(document.createElement('div'), {
                                className: 'w-8 h-8 rounded-full border-2 border-[#DDEBFA] bg-[#00ABE4] text-white flex items-center justify-center text-xs font-bold',
                                innerText: (user.name || '?').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
                              })
                            );
                          }
                        }}
                      />
                    );
                  }
                  // No image: show initials directly
                  return (
                    <div className="w-8 h-8 rounded-full border-2 border-[#DDEBFA] bg-[#00ABE4] text-white flex items-center justify-center text-xs font-bold">
                      {(user.name || '?').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                    </div>
                  );
                })()}
                <div className="flex flex-col">
                  <span className="text-[#0D1B2A]/70 text-sm">Welcome, {user.name}</span>
                </div>
              </div>
              <button onClick={logout} className="btn-outline text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gradient-to-b from-[#E9F1FA] to-white border-b border-[#DDEBFA]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'upload'
                  ? 'border-[#00ABE4] text-[#0D1B2A]'
                  : 'border-transparent text-[#0D1B2A]/50 hover:text-[#0D1B2A]'
              }`}
            >
              Upload Memories
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'search'
                  ? 'border-[#00ABE4] text-[#0D1B2A]'
                  : 'border-transparent text-[#0D1B2A]/50 hover:text-[#0D1B2A]'
              }`}
            >
              Search & Explore
            </button>
            <button
              onClick={() => setActiveTab('stories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'stories'
                  ? 'border-[#00ABE4] text-[#0D1B2A]'
                  : 'border-transparent text-[#0D1B2A]/50 hover:text-[#0D1B2A]'
              }`}
            >
              My Stories ({stories.length})
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-8">
            <div className="text-center bg-gradient-to-b from-[#E9F1FA] to-white rounded-2xl py-8 border border-[#DDEBFA]">
              <h2 className="text-3xl font-extrabold mb-2 text-[#0D1B2A]">Upload Your Memories</h2>
              <p className="text-lg text-[#0D1B2A]/70">Upload your entire phone gallery and let AI process everything automatically</p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-[#DDEBFA] shadow">
              <div className="border-2 border-dashed border-[#00ABE4]/40 rounded-lg p-12 text-center hover:border-[#00ABE4]/70 transition-colors">
                <svg className="w-16 h-16 mx-auto mb-4 text-[#00ABE4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <h3 className="text-xl font-semibold mb-2">Drop your files here</h3>
                <p className="text-[#0D1B2A]/60 mb-4">or click to browse your device</p>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="btn-primary cursor-pointer">
                  Choose Files
                </label>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setIsProcessing(true);
                        const items = await pickGooglePhotos(50);
                        if (items && items.length > 0) {
                          const mapped = items.map((item, index) => ({
                            id: `${Date.now()}-${index}`,
                            name: item.name,
                            type: item.mimeType || 'image/jpeg',
                            size: item.size || 0,
                            uploadDate: new Date().toISOString(),
                            status: 'processed',
                            tags: ['google', 'photos', 'memory'],
                            transcript: '',
                            previewUrl: item.thumbnailUrl || item.url,
                            sourceUrl: item.url,
                            source: 'google_photos'
                          }));
                          setUploadedFiles(prev => [...prev, ...mapped]);
                        }
                      } catch (err) {
                        console.error('Google Photos import error:', err);
                        alert(err.message || 'Failed to import from Google Photos');
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    className="btn-outline"
                  >
                    Import from Google Photos
                  </button>
                </div>
              </div>
            </div>

            {isProcessing && (
              <div className="bg-white rounded-2xl p-8 border border-[#DDEBFA] text-center">
                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-300">Processing your memories with AI...</p>
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="bg-white rounded-2xl p-8 border border-[#DDEBFA]">
                <h3 className="text-xl font-semibold mb-6">Uploaded Files ({uploadedFiles.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="bg-white rounded-lg p-4 border border-[#DDEBFA]">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-primary-900 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-gray-400 text-xs">{file.type}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-[#0D1B2A]/60">Tags:</p>
                          <div className="flex flex-wrap gap-1">
                            {file.tags.map((tag, index) => (
                              <span key={index} className="bg-[#E9F1FA] text-[#0D1B2A] text-xs px-2 py-1 rounded border border-[#DDEBFA]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-[#0D1B2A]/60">Transcript:</p>
                          <p className="text-xs text-[#0D1B2A]/70">{file.transcript}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-8">
            <div className="text-center bg-gradient-to-b from-[#E9F1FA] to-white rounded-2xl py-8 border border-[#DDEBFA]">
              <h2 className="text-3xl font-extrabold mb-2 text-[#0D1B2A]">Search Your Memories</h2>
              <p className="text-lg text-[#0D1B2A]/70">Search by meaning, emotions, or concepts - not just keywords</p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-[#DDEBFA]">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., 'show me all the times I was happy' or 'find my beach memories'"
                  className="flex-1 px-4 py-3 bg-white border border-[#DDEBFA] rounded-lg text-[#0D1B2A] placeholder-[#0D1B2A]/40 focus:outline-none focus:ring-2 focus:ring-[#00ABE4]"
                />
                <button onClick={handleSearch} className="btn-primary">
                  Search
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="bg-white rounded-2xl p-8 border border-[#DDEBFA]">
                <h3 className="text-xl font-semibold mb-6">Search Results ({searchResults.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((file) => (
                    <div key={file.id} className="bg-white rounded-lg p-4 border border-[#DDEBFA]">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-[#00ABE4] rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-gray-400 text-xs">{file.type}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-[#0D1B2A]/60">Tags:</p>
                          <div className="flex flex-wrap gap-1">
                            {file.tags.map((tag, index) => (
                              <span key={index} className="bg-[#E9F1FA] text-[#0D1B2A] text-xs px-2 py-1 rounded border border-[#DDEBFA]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-[#0D1B2A]/60">Transcript:</p>
                          <p className="text-xs text-[#0D1B2A]/70">{file.transcript}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* My Stories Tab */}
        {activeTab === 'stories' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-gradient-to-b from-[#E9F1FA] to-white rounded-2xl py-6 px-6 border border-[#DDEBFA]">
              <div>
                <h2 className="text-3xl font-extrabold mb-2 text-[#0D1B2A]">My Stories</h2>
                <p className="text-[#0D1B2A]/70 text-lg">
                  {stories.length > 0 
                    ? `You have ${stories.length} beautiful stories created from your memories`
                    : 'Create your first story from your memories'
                  }
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('search')}
                className="btn-primary"
              >
                Create New Story
              </button>
            </div>

            {stories.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📖</div>
                <h3 className="text-xl font-semibold text-[#0D1B2A] mb-2">No Stories Yet</h3>
                <p className="text-[#0D1B2A]/70 mb-6">
                  Upload some memories and create your first AI-generated story!
                </p>
                <button 
                  onClick={() => setActiveTab('upload')}
                  className="btn-primary"
                >
                  Upload Memories
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <div key={story._id} className="bg-white rounded-2xl p-6 border border-[#DDEBFA] hover:shadow transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-[#0D1B2A] line-clamp-2">
                        {story.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        story.theme === 'family' ? 'bg-pink-100 text-pink-800' :
                        story.theme === 'adventure' ? 'bg-green-100 text-green-800' :
                        story.theme === 'celebration' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {story.theme}
                      </span>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                      {story.description || story.content.substring(0, 150) + '...'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                      <span>{story.wordCount} words</span>
                      <span>{story.estimatedReadingTime} min read</span>
                      <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setGeneratedStory(story.content);
                          setActiveTab('search');
                        }}
                        className="flex-1 btn-secondary text-sm"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleEditStory(story)}
                        className="flex-1 btn-primary text-sm"
                      >
                        Edit
                      </button>
                    </div>
                    
                    <div className="flex space-x-2 mt-2">
                      <button 
                        onClick={() => handleEditStructure(story)}
                        className="flex-1 btn-outline text-sm"
                      >
                        Structure
                      </button>
                      <button 
                        onClick={() => handleViewVersions(story)}
                        className="flex-1 btn-outline text-sm"
                      >
                        Versions
                      </button>
                    </div>
                    
                    <div className="mt-2">
                      <button 
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: story.title,
                              text: story.description || story.content.substring(0, 100),
                              url: window.location.href
                            });
                          } else {
                            navigator.clipboard.writeText(window.location.href);
                            alert('Story link copied to clipboard!');
                          }
                        }}
                        className="w-full btn-outline text-sm"
                      >
                        Share Story
                      </button>
                    </div>

                    {/* Animated Film Section */}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      {story.animatedFilm ? (
                        <div className="space-y-3">
                          {story.animatedFilm.status === 'generating' ? (
                            <div className="text-center">
                              <div className="text-2xl mb-2">🎬</div>
                              <p className="text-sm text-gray-400 mb-2">
                                Generating animated film... {story.animatedFilm.processingProgress}%
                              </p>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${story.animatedFilm.processingProgress}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : story.animatedFilm.status === 'completed' ? (
                            <div className="space-y-3">
                              <div className="text-center">
                                <div className="text-2xl mb-2">🎬</div>
                                <p className="text-sm text-gray-400 mb-3">
                                  Your animated film is ready!
                                </p>
                                <div className="bg-gray-800 rounded-lg p-3">
                                  <video 
                                    src={story.animatedFilm.videoUrl}
                                    poster={story.animatedFilm.thumbnailUrl}
                                    controls
                                    className="w-full rounded-lg"
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                                <div className="flex space-x-2 mt-3">
                                  <button 
                                    onClick={() => {
                                      if (navigator.share) {
                                        navigator.share({
                                          title: `${story.title} - Animated Film`,
                                          text: 'Check out my animated story!',
                                          url: story.animatedFilm.videoUrl
                                        });
                                      } else {
                                        navigator.clipboard.writeText(story.animatedFilm.videoUrl);
                                        alert('Film link copied to clipboard!');
                                      }
                                    }}
                                    className="flex-1 btn-outline text-sm"
                                  >
                                    Share Film
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = story.animatedFilm.videoUrl;
                                      link.download = `${story.title}-film.mp4`;
                                      link.click();
                                    }}
                                    className="flex-1 btn-secondary text-sm"
                                  >
                                    Download
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : story.animatedFilm.status === 'failed' ? (
                            <div className="text-center">
                              <div className="text-2xl mb-2">❌</div>
                              <p className="text-sm text-red-400 mb-3">
                                Film generation failed. Please try again.
                              </p>
                              <button 
                                onClick={() => generateAnimatedFilm(story._id)}
                                className="btn-primary text-sm"
                              >
                                Retry Generation
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-2xl mb-2">🎬</div>
                          <p className="text-sm text-gray-400 mb-3">
                            Turn your story into an animated film!
                          </p>
                          <button 
                            onClick={() => generateAnimatedFilm(story._id)}
                            disabled={isGeneratingFilm}
                            className="btn-primary text-sm disabled:opacity-50"
                          >
                            {isGeneratingFilm ? 'Generating...' : 'Create Animated Film'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {generatedStory && (
              <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700">
                <h3 className="text-xl font-semibold mb-6">Story Preview</h3>
                <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {generatedStory}
                  </p>
                </div>
                <div className="mt-6 flex space-x-4">
                  <button 
                    onClick={() => setGeneratedStory('')}
                    className="btn-secondary"
                  >
                    Close Preview
                  </button>
                  <button 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'My Footage Flow Story',
                          text: generatedStory.substring(0, 100),
                          url: window.location.href
                        });
                      } else {
                        navigator.clipboard.writeText(generatedStory);
                        alert('Story copied to clipboard!');
                      }
                    }}
                    className="btn-outline"
                  >
                    Share Story
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Editing Modals */}
      {editingStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <StoryEditor
              story={editingStory}
              onSave={handleStorySaved}
              onCancel={handleCloseEditor}
            />
          </div>
        </div>
      )}

      {editingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <FileEditor
              file={editingFile}
              onSave={handleFileSaved}
              onCancel={handleCloseEditor}
            />
          </div>
        </div>
      )}

      {editingStructure && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <StoryStructureEditor
              story={editingStructure}
              onSave={handleStructureSaved}
              onCancel={handleCloseEditor}
            />
          </div>
        </div>
      )}

      {viewingVersions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <StoryVersionHistory
              story={viewingVersions}
              onRestore={handleVersionRestored}
              onClose={handleCloseEditor}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
