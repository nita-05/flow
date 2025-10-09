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
  console.log('Dashboard component loaded - CACHE BUST v2');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upload');
  const [stories, setStories] = useState([]);
  const [files, setFiles] = useState([]);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isStoryMode, setIsStoryMode] = useState(false);
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaKey, setMediaKey] = useState(0); // For forcing re-render
  
  // Story creation modal states
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyPrompt, setStoryPrompt] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [storyTheme, setStoryTheme] = useState('adventure');
  const [storyMood, setStoryMood] = useState('uplifting');
  
  // Story view modal states
  const [showStoryViewModal, setShowStoryViewModal] = useState(false);
  const [viewingStory, setViewingStory] = useState(null);
  const [loadingStory, setLoadingStory] = useState(false);
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
        console.log('Current token:', authService.getToken() ? 'Present' : 'Missing');
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
        console.log('Error details:', error.message);
        // If session-based auth fails, check localStorage
        const localUser = authService.getUser();
        if (localUser) {
          console.log('Using local user data:', localUser);
          setUser(localUser);
          // Load user's files and stories
          await loadUserData();
          setIsLoading(false);
        } else {
          console.log('No authentication found, checking if we have a token in URL...');
          // Check if there's a JWT in the URL that we missed
          const params = new URLSearchParams(window.location.search);
          const jwt = params.get('jwt');
          if (jwt) {
            console.log('Found JWT in URL, setting token and retrying auth...');
            authService.setToken(jwt);
            // Clear URL and retry authentication
            window.history.replaceState({}, '', '/dashboard');
            // Retry authentication
            setTimeout(() => {
              checkAuth();
            }, 100);
            return;
          }
          
          // Check if we have a test token (for testing purposes)
          const token = authService.getToken();
          if (token && token.includes('test-jwt-token')) {
            console.log('Using test token for dashboard access');
            setUser({
              id: 'test-user',
              name: 'Test User',
              email: 'test@example.com',
              avatar: 'https://via.placeholder.com/150'
            });
            setIsLoading(false);
            return;
          }
          
          // Check if we have a real JWT token but authentication failed
          if (token && !token.includes('test-jwt-token')) {
            console.log('Real JWT token found but auth failed, trying to decode...');
            try {
              // Try to decode JWT to get user info
              const payload = JSON.parse(atob(token.split('.')[1]));
              console.log('JWT payload:', payload);
              if (payload.userId) {
                console.log('Using JWT token for dashboard access');
                setUser({
                  id: payload.userId,
                  name: 'Google User',
                  email: 'user@google.com',
                  avatar: 'https://via.placeholder.com/150'
                });
                setIsLoading(false);
                return;
              }
            } catch (e) {
              console.log('Failed to decode JWT:', e);
            }
          }
          
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
      console.log('🔄 Loading user data...');
      
      // Load files and stories in parallel
      const [filesData, storiesResponse] = await Promise.all([
        fileService.getFiles(),
        storyService.getStories()
      ]);

        console.log('📁 Files data received:', filesData);
        console.log('📁 First file transcription:', filesData.files?.[0]?.transcription);
        setFiles(filesData.files || []);
        console.log('📁 Files set in state:', filesData.files?.length || 0);

      if (storiesResponse.stories) {
        setStories(storiesResponse.stories);
        console.log('📖 Stories loaded:', storiesResponse.stories.length);
      }
      
      // Clear any uploaded files to prevent duplicates
      setUploadedFiles([]);

      // Load film styles and durations
      // setFilmStyles(storyService.getFilmStylesStatic());
      // setFilmDurations(storyService.getFilmDurationsStatic());
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleGooglePhotosImport = async () => {
    try {
      setIsProcessing(true);
      console.log('Starting Google Photos import...');
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Google Photos import timed out. Please try again or use "Choose Files" to upload your photos instead.')), 60000);
      });
      
      const importPromise = pickGooglePhotos(50);
      const items = await Promise.race([importPromise, timeoutPromise]);
      
      if (items && items.length > 0) {
        console.log('Google Photos items received:', items.length);
        const mapped = items.map((item, index) => ({
          id: `${Date.now()}-${index}`,
          name: item.name || `Google Photo ${index + 1}`,
          type: item.mimeType || 'image/jpeg',
          size: item.size || 0,
          uploadDate: new Date().toISOString(),
          status: 'processed',
          tags: ['google', 'photos', 'memory'],
          transcript: '',
                            previewUrl: item.thumbnailUrl || item.url || '',
                            sourceUrl: item.url || '',
                            url: item.url || '',
          source: 'google_photos'
        }));
        setUploadedFiles(prev => [...prev, ...mapped]);
        console.log('Google Photos files added to upload list');
      } else {
        console.log('No Google Photos items selected');
      }
    } catch (err) {
      console.error('Google Photos import error:', err);
      alert(`Google Photos import failed: ${err.message || 'Unknown error'}. Please try using "Choose Files" to upload your photos instead.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMediaClick = (file) => {
    console.log('🎯 MEDIA CLICKED:', file);
    console.log('🎯 FILE TYPE:', file.fileType || file.type);
    console.log('🎯 FILE ID:', file._id || file.id);
    console.log('🎯 FILE NAME:', file.originalName || file.name);
    console.log('🎯 FILE URLS:', {
      fileUrl: file.fileUrl,
      thumbnailUrl: file.thumbnailUrl,
      previewUrl: file.previewUrl,
      sourceUrl: file.sourceUrl,
      url: file.url
    });
    console.log('🎯 FILE STATUS:', {
      status: file.status,
      processingStatus: file.processingStatus,
      processingProgress: file.processingProgress
    });
    
    // Check if file has valid URL for modal
    const validUrl = file.fileUrl || file.thumbnailUrl || file.previewUrl || file.sourceUrl || file.url;
    if (!validUrl || validUrl === 'undefined' || validUrl === 'null') {
      console.error('❌ NO VALID URL FOUND FOR FILE:', file);
      alert('This file cannot be displayed. It may still be processing or the URL is invalid.');
      return;
    }
    
    setSelectedMedia(file);
    setMediaKey(prev => prev + 1); // Force re-render
    setIsMediaModalOpen(true);
  };

  const handleReplay = () => {
    setMediaKey(prev => prev + 1); // Force re-render to reset media
    console.log('🔄 REPLAY CLICKED - Resetting media');
  };

  const closeMediaModal = () => {
    setSelectedMedia(null);
    setIsMediaModalOpen(false);
  };

  const handleFileUpload = async (event) => {
    const filesToUpload = Array.from(event.target.files || []);
    if (filesToUpload.length === 0) return;

    try {
      setIsProcessing(true);

      // Add files to uploadedFiles immediately for better UX
      const newUploadedFiles = filesToUpload.map((file, index) => ({
        id: `upload-${Date.now()}-${index}`,
        name: file.name,
        type: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'audio',
        size: file.size,
        uploadDate: new Date().toISOString(),
        status: 'uploading',
        tags: [],
        transcript: '',
        previewUrl: URL.createObjectURL(file), // Create object URL for immediate preview
        sourceUrl: URL.createObjectURL(file),
        url: URL.createObjectURL(file),
        source: 'device'
      }));
      
      setUploadedFiles(prev => [...prev, ...newUploadedFiles]);

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
        
        // Update uploadedFiles with real data from backend
        setUploadedFiles(prev => {
          return prev.map(uploadedFile => {
            if (uploadedFile.source === 'device') {
              const realFile = items.find(f => f.originalName === uploadedFile.name);
              if (realFile) {
                console.log('Mapping file data:', {
                  originalName: realFile.originalName,
                  fileType: realFile.fileType,
                  fileUrl: realFile.fileUrl,
                  thumbnailUrl: realFile.thumbnailUrl,
                  previewUrl: realFile.previewUrl
                });
                
                return {
                  ...uploadedFile,
                  id: realFile._id,
                  name: realFile.originalName,
                  type: realFile.fileType,
                  fileType: realFile.fileType, // Ensure both are set
                  size: realFile.fileSize,
                  status: realFile.status,
                  tags: realFile.visionTags?.map(t => t.tag) || [],
                  transcript: realFile.transcription?.text || '',
                  fileUrl: realFile.fileUrl || '',
                  previewUrl: realFile.thumbnailUrl || realFile.previewUrl || realFile.fileUrl || '',
                  sourceUrl: realFile.fileUrl || '',
                  url: realFile.fileUrl || '',
                  thumbnailUrl: realFile.thumbnailUrl || '',
                  aiDescription: realFile.aiDescription || '',
                  emotions: realFile.emotions?.map(e => e.emotion) || []
                };
              }
            }
            return uploadedFile;
          });
        });
        
        if (!hasProcessing) {
          // Clear uploadedFiles once processing is complete to prevent duplicates
          setUploadedFiles([]);
          break;
        }
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      console.log('🔍 Starting AI search for:', searchQuery);
      
      // Call backend AI search API using the proper service
      const data = await fileService.searchFiles({
        query: searchQuery,
        limit: 50
      });
      
      console.log('✅ AI search results:', data);
      console.log('🔍 Search type used:', data.searchType);
      console.log('📊 Results count:', data.count);
      
      setSearchResults(data.results || []);
      
      // Show user feedback about search type
      if (data.searchType === 'ai_semantic') {
        console.log('🤖 Used AI semantic search successfully!');
      } else if (data.searchType === 'text_fallback') {
        console.log('📝 Used text-based search fallback');
      }
      
    } catch (error) {
      console.error('❌ AI search error:', error);
      
      // Fallback to basic text matching if AI search fails
      console.log('🔄 Falling back to basic text matching...');
      
    const searchWords = searchQuery.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    
    const results = files.filter(file => {
      return searchWords.some(query => {
        // Search in file name
        if (file.originalName && file.originalName.toLowerCase().includes(query)) {
          return true;
        }
        
        // Search in AI description
        if (file.aiDescription && file.aiDescription.toLowerCase().includes(query)) {
          return true;
        }
        
        // Search in vision tags
        if (file.visionTags && file.visionTags.some(tag => {
          const tagText = typeof tag === 'string' ? tag : (tag.tag || tag.object || '');
          return tagText.toLowerCase().includes(query);
        })) {
          return true;
        }
        
        // Search in transcription
        if (file.transcription && file.transcription.text && 
            file.transcription.text.toLowerCase().includes(query)) {
          return true;
        }
        
        // Search in keywords
        if (file.keywords && file.keywords.some(keyword => 
          keyword.toLowerCase().includes(query)
        )) {
          return true;
        }
        
        // Search in emotions
        if (file.emotions && file.emotions.some(emotion => 
          emotion.emotion.toLowerCase().includes(query)
        )) {
          return true;
        }
        
        return false;
      });
    });
    
    setSearchResults(results);
    }
  };

  const toggleFileSelection = (file) => {
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f._id === file._id);
      if (isSelected) {
        return prev.filter(f => f._id !== file._id);
      } else {
        return [...prev, file];
      }
    });
  };

  const selectAllFiles = () => {
    const currentFiles = searchQuery ? searchResults : files;
    setSelectedFiles(currentFiles);
  };

  const clearSelection = () => {
    setSelectedFiles([]);
  };

  const startStoryCreation = () => {
    setShowStoryModal(true);
    setSelectedFiles([]);
    setStoryPrompt('');
    setStoryTitle('');
    setStoryTheme('adventure');
    setStoryMood('uplifting');
  };

  const generateStoryFromSelection = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file to create a story.');
      return;
    }

    if (!storyPrompt.trim()) {
      alert('Please enter a story prompt.');
      return;
    }

    try {
      setIsCreatingStory(true);
      
      const storyData = {
        title: storyTitle || `Story from ${selectedFiles.length} memories`,
        prompt: storyPrompt,
        fileIds: selectedFiles.map(f => f._id),
        theme: storyTheme,
        mood: storyMood,
        description: 'A beautiful story generated from my memories'
      };

      const result = await storyService.createStory(storyData);
      console.log('📖 Story creation result:', result);
      
      if (result.story) {
        console.log('📖 Story content:', result.story.content);
        setGeneratedStory(result.story.content);
        alert('Story created successfully!');
        setShowStoryModal(false);
        setSelectedFiles([]);
        setStoryPrompt('');
        setStoryTitle('');
        // Refresh the stories list to show the new story
        await loadUserData();
      }
    } catch (error) {
      console.error('Story generation failed:', error);
      alert('Failed to generate story: ' + error.message);
    } finally {
      setIsCreatingStory(false);
    }
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


  const generateAudio = async (storyId) => {
    try {
      setIsGeneratingAudio(true);
      
      const result = await storyService.generateAudio(storyId);
      
      if (result.audio) {
        // Audio generation started - no notification needed
        
        // Start polling for status updates
        const pollInterval = setInterval(async () => {
          try {
            // First try to get audio status
            try {
              const audioStatus = await storyService.getAudioStatus(storyId);
              
              if (audioStatus.audio) {
                if (audioStatus.audio.status === 'completed' || 
                    audioStatus.audio.status === 'failed') {
                  clearInterval(pollInterval);
                  
                  // Update the specific story in the stories array
                  setStories(prevStories => 
                    prevStories.map(story => 
                      story._id === storyId 
                        ? { ...story, audioGeneration: audioStatus.audio }
                        : story
                    )
                  );
                  
                  if (audioStatus.audio.status === 'completed') {
                    // Show success notification
                    const successNotification = document.createElement('div');
                    successNotification.style.cssText = `
                      position: fixed;
                      top: 20px;
                      right: 20px;
                      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                      color: white;
                      padding: 20px;
                      border-radius: 10px;
                      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                      z-index: 10000;
                      max-width: 350px;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    `;
                    successNotification.innerHTML = `
                      <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <div style="font-size: 24px; margin-right: 10px;">🎵</div>
                        <div style="font-weight: bold; font-size: 16px;">Audio Ready!</div>
                      </div>
                      <div style="font-size: 14px; line-height: 1.4; opacity: 0.9;">
                        Your story audio is now available below.
                      </div>
                    `;
                    document.body.appendChild(successNotification);
                    setTimeout(() => {
                      if (successNotification.parentNode) {
                        successNotification.parentNode.removeChild(successNotification);
                      }
                    }, 5000);
                  } else {
                    // Show error notification
                    const errorNotification = document.createElement('div');
                    errorNotification.style.cssText = `
                      position: fixed;
                      top: 20px;
                      right: 20px;
                      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
                      color: white;
                      padding: 20px;
                      border-radius: 10px;
                      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                      z-index: 10000;
                      max-width: 350px;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    `;
                    errorNotification.innerHTML = `
                      <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <div style="font-size: 24px; margin-right: 10px;">❌</div>
                        <div style="font-weight: bold; font-size: 16px;">Audio Generation Failed</div>
                      </div>
                      <div style="font-size: 14px; line-height: 1.4; opacity: 0.9;">
                        ${audioStatus.audio.errorMessage || 'Unknown error occurred. Please try again.'}
                      </div>
                    `;
                    document.body.appendChild(errorNotification);
                    setTimeout(() => {
                      if (errorNotification.parentNode) {
                        errorNotification.parentNode.removeChild(errorNotification);
                      }
                    }, 8000);
                  }
                }
              }
            } catch (statusError) {
              // If audio status endpoint doesn't exist, fall back to refreshing stories
              console.log('Audio status endpoint not available, refreshing stories...');
              const storiesData = await storyService.getStories();
              const updatedStory = storiesData.stories.find(s => s._id === storyId);
              
              if (updatedStory && updatedStory.audioGeneration) {
                if (updatedStory.audioGeneration.status === 'completed' || 
                    updatedStory.audioGeneration.status === 'failed') {
                  clearInterval(pollInterval);
                  
                  setStories(storiesData.stories);
                  
                  if (updatedStory.audioGeneration.status === 'completed') {
                    // Show success notification
                    const successNotification = document.createElement('div');
                    successNotification.style.cssText = `
                      position: fixed;
                      top: 20px;
                      right: 20px;
                      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                      color: white;
                      padding: 20px;
                      border-radius: 10px;
                      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                      z-index: 10000;
                      max-width: 350px;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    `;
                    successNotification.innerHTML = `
                      <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <div style="font-size: 24px; margin-right: 10px;">🎵</div>
                        <div style="font-weight: bold; font-size: 16px;">Audio Ready!</div>
                      </div>
                      <div style="font-size: 14px; line-height: 1.4; opacity: 0.9;">
                        Your story audio is now available below.
                      </div>
                    `;
                    document.body.appendChild(successNotification);
                    setTimeout(() => {
                      if (successNotification.parentNode) {
                        successNotification.parentNode.removeChild(successNotification);
                      }
                    }, 5000);
                  }
                }
              }
            }
          } catch (pollError) {
            console.error('Error polling audio status:', pollError);
          }
        }, 3000); // Poll every 3 seconds
        
        // Also refresh the full data after a delay
        setTimeout(async () => {
          console.log('🔄 Auto-refreshing after 5 seconds...');
          await loadUserData();
        }, 5000);
        
        // Additional refresh after 15 seconds
        setTimeout(async () => {
          console.log('🔄 Auto-refreshing after 15 seconds...');
          await loadUserData();
        }, 15000);
      }
    } catch (error) {
      console.error('Audio generation failed:', error);
      alert('Failed to generate audio: ' + error.message);
    } finally {
      setIsGeneratingAudio(false);
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

  // Story view functions
  const handleViewStory = async (story) => {
    try {
      setLoadingStory(true);
      setShowStoryViewModal(true);
      
      // Fetch full story content
      const fullStory = await storyService.getStory(story._id);
      setViewingStory(fullStory.story);
    } catch (error) {
      console.error('Failed to load story:', error);
      alert('Failed to load story: ' + error.message);
      setShowStoryViewModal(false);
    } finally {
      setLoadingStory(false);
    }
  };

  const handleCloseStoryView = () => {
    setShowStoryViewModal(false);
    setViewingStory(null);
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-900 text-xl font-semibold">Loading your memories...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-full animate-pulse mx-auto mb-4"></div>
          <div className="text-gray-900 text-xl font-semibold">Redirecting to login...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Memorify Studio</h1>
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
                        className="w-10 h-10 rounded-full border-2 border-gray-200 shadow-lg"
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
                                className: 'w-10 h-10 rounded-full border-2 border-gray-200 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-lg',
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
                    <div className="w-10 h-10 rounded-full border-2 border-gray-200 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-lg">
                      {(user.name || '?').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                    </div>
                  );
                })()}
                <div className="flex flex-col">
                  <span className="text-gray-700 text-sm">Welcome, {user.name}</span>
                </div>
              </div>
              <button onClick={logout} className="px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all duration-300 text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                activeTab === 'upload'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-purple-600 hover:border-purple-400'
              }`}
            >
              Upload Memories
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                activeTab === 'search'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-purple-600 hover:border-purple-400'
              }`}
            >
              Search & Explore
            </button>
            <button
              onClick={() => setActiveTab('stories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                activeTab === 'stories'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-purple-600 hover:border-purple-400'
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
            <div className="text-center bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl py-12 border border-purple-100 shadow-lg">
              <h2 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Upload Your Memories</h2>
              <p className="text-lg text-gray-600">Upload your entire phone gallery and let AI process everything automatically</p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-lg">
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-purple-400 transition-all duration-300">
                <svg className="w-16 h-16 mx-auto mb-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Drop your files here</h3>
                <p className="text-gray-600 mb-4">or click to browse your device</p>
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
                    onClick={() => {
                      console.log('Google Photos button clicked');
                      handleGooglePhotosImport();
                    }}
                    className="btn-outline"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Importing...' : 'Import from Google Photos'}
                  </button>
                </div>
              </div>
            </div>

            {isProcessing && (
              <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Processing your memories with AI...</p>
              </div>
            )}

            {uploadedFiles.length > 0 && uploadedFiles.some(f => f.status === 'processing') && (
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h3 className="text-xl font-semibold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Processing Files ({uploadedFiles.filter(f => f.status === 'processing').length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadedFiles.filter(f => f.status === 'processing').map((file) => (
                    <div key={file.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center relative">
                          {/* Processing overlay */}
                          {file.status === 'processing' && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                          {/* Display actual image using direct img tag approach */}
                          {(() => {
                            const fileType = file.fileType || file.type;
                            let fileUrl = '';
                            
                            if (fileType === 'image') {
                              fileUrl = file.fileUrl || file.thumbnailUrl || file.previewUrl || file.sourceUrl || file.url;
                            } else if (fileType === 'video') {
                              fileUrl = file.fileUrl || file.thumbnailUrl || file.previewUrl || file.sourceUrl || file.url;
                            } else if (fileType === 'audio') {
                              fileUrl = file.fileUrl || file.sourceUrl || file.url;
                            }
                            
                            console.log('🔍 UPLOADED FILES - File:', file.originalName, 'Type:', fileType);
                            console.log('🔍 UPLOADED FILES - All URLs:', {
                              fileUrl: file.fileUrl,
                              thumbnailUrl: file.thumbnailUrl,
                              previewUrl: file.previewUrl,
                              sourceUrl: file.sourceUrl,
                              url: file.url,
                              finalUrl: fileUrl
                            });
                            
                            if (fileUrl && fileUrl !== 'undefined' && fileUrl !== 'null') {
                              if (fileType === 'image') {
                                return (
                                  <div className="w-full h-full relative overflow-hidden rounded-lg">
                                    <img 
                                      src={fileUrl}
                              alt={file.originalName || file.name}
                              className="w-full h-full object-cover"
                                      onLoad={() => console.log('✅ UPLOADED IMAGE LOADED:', fileUrl)}
                              onError={(e) => {
                                        console.log('❌ UPLOADED IMAGE ERROR:', fileUrl);
                                        console.log('❌ UPLOADED IMAGE ERROR - File data:', file);
                                        // Try alternative URLs
                                        const altUrl = file.thumbnailUrl || file.previewUrl || file.sourceUrl || file.url;
                                        if (altUrl && altUrl !== fileUrl) {
                                          console.log('🔄 TRYING ALTERNATIVE URL:', altUrl);
                                          e.target.src = altUrl;
                                        } else {
                                e.target.style.display = 'none';
                                        }
                                      }}
                                    />
                                  </div>
                                );
                              } else if (fileType === 'video') {
                                // Get all possible URLs for this video
                                const allUrls = [
                                  file.fileUrl,
                                  file.thumbnailUrl,
                                  file.previewUrl,
                                  file.sourceUrl,
                                  file.url
                                ].filter(Boolean);
                                
                                const mediaUrl = allUrls[0] || '';
                                
                                console.log('🎬 SEARCH VIDEO DEBUG - File:', file.originalName);
                                console.log('🎬 SEARCH VIDEO DEBUG - All URLs:', allUrls);
                                console.log('🎬 SEARCH VIDEO DEBUG - Media URL:', mediaUrl);
                                
                                if (!mediaUrl) {
                                  return (
                                    <div className="relative w-full h-full bg-gray-200 flex items-center justify-center">
                                      <div className="text-gray-500 text-center">
                                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2 mx-auto">
                                          <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                                          </svg>
                                        </div>
                                        <div className="text-xs">No Media URL</div>
                                        <button 
                                          onClick={() => {
                                            console.log('🔄 RETRYING VIDEO LOAD');
                                            setFiles([...files]); // Force re-render
                                          }}
                                          className="mt-2 px-2 py-1 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30"
                                        >
                                          Retry
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }
                                
                                return (
                                  <div className="relative w-full h-full group">
                                    {/* Try thumbnail first, then video frame */}
                                    {file.thumbnailUrl ? (
                                      <img 
                                        src={`${file.thumbnailUrl}?t=${Date.now()}&f_auto,q_auto`}
                                        alt={file.originalName || file.name}
                                        className="w-full h-full object-cover"
                                        crossOrigin="anonymous"
                                        onLoad={() => console.log('✅ SEARCH VIDEO THUMBNAIL LOADED:', file.thumbnailUrl)}
                                        onError={(e) => {
                                          console.log('❌ SEARCH THUMBNAIL ERROR, trying video frame');
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'block';
                                        }}
                                      />
                                    ) : null}
                                    
                                    {/* Video element for frame preview */}
                              <video 
                                className="w-full h-full object-cover"
                                      preload="metadata"
                                      controls={false}
                                      playsInline
                                      muted={true}
                                      crossOrigin="anonymous"
                                      style={{ display: file.thumbnailUrl ? 'none' : 'block' }}
                                      onLoadStart={() => console.log('🎬 SEARCH VIDEO LOAD START:', mediaUrl)}
                                      onLoadedData={(e) => {
                                        console.log('🎬 SEARCH VIDEO DATA LOADED:', mediaUrl);
                                        // Hide thumbnail, show video frame
                                        const img = e.target.previousElementSibling;
                                        if (img && img.tagName === 'IMG') {
                                          img.style.display = 'none';
                                        }
                                        e.target.style.display = 'block';
                                      }}
                                      onCanPlay={() => console.log('🎬 SEARCH VIDEO CAN PLAY:', mediaUrl)}
                                onError={(e) => {
                                        console.log('❌ SEARCH VIDEO ERROR:', mediaUrl);
                                        console.log('❌ SEARCH VIDEO ERROR DETAILS:', e);
                                        // Try next URL
                                        if (allUrls.length > 1) {
                                          console.log('🔄 TRYING NEXT URL:', allUrls[1]);
                                          e.target.src = `${allUrls[1]}?t=${Date.now()}&f_auto,q_auto`;
                                        } else {
                                          // Show error state
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                        }
                                      }}
                                      ref={(el) => {
                                        if (el && !el.src) {
                                          // Load video source after component mounts
                                          setTimeout(() => {
                                            el.src = `${mediaUrl}?t=${Date.now()}&f_auto,q_auto`;
                                          }, 100);
                                        }
                                      }}
                                    />
                                    
                                    {/* Play button overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:bg-opacity-40 transition-all duration-200">
                                      <div className="w-16 h-16 bg-white bg-opacity-95 rounded-full flex items-center justify-center shadow-xl hover:bg-opacity-100 transition-all duration-200 hover:scale-110 cursor-pointer">
                                        <svg className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                                  </svg>
                                </div>
                              </div>
                                    
                                    {/* Video duration badge */}
                                    {file.duration && (
                                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                        {file.duration}
                            </div>
                                    )}
                                    
                                    {/* Error fallback with video icon */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900" style={{ display: 'none' }}>
                                      <div className="text-white text-center">
                                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2 mx-auto">
                                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                                          </svg>
                                        </div>
                                        <div className="text-xs">Video Preview</div>
                                        <div className="text-xs opacity-75">Click to play</div>
                                        <button 
                                          onClick={() => {
                                            console.log('🔄 RETRYING SEARCH VIDEO LOAD');
                                            setFiles([...files]); // Force re-render
                                          }}
                                          className="mt-2 px-2 py-1 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30"
                                        >
                                          Retry
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              } else if (fileType === 'audio') {
                                return (
                                  <div className="relative w-full h-full bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex flex-col items-center justify-center p-2">
                                    {/* Animated waveform */}
                                    <div className="flex items-center space-x-1 mb-2">
                                      <div className="w-1 h-2 bg-white bg-opacity-60 rounded-full animate-pulse"></div>
                                      <div className="w-1 h-4 bg-white bg-opacity-80 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                                      <div className="w-1 h-3 bg-white bg-opacity-70 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                      <div className="w-1 h-5 bg-white bg-opacity-90 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                                      <div className="w-1 h-2 bg-white bg-opacity-60 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                                      <div className="w-1 h-4 bg-white bg-opacity-75 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                                      <div className="w-1 h-3 bg-white bg-opacity-65 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                                    </div>
                                    
                                    {/* Audio icon */}
                                    <div className="w-6 h-6 bg-white bg-opacity-90 rounded-full flex items-center justify-center mb-1">
                                      <svg className="w-3 h-3 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                              </svg>
                            </div>
                                    
                                    {/* Duration if available */}
                                    {file.duration && (
                                      <div className="text-white text-xs bg-black bg-opacity-30 px-2 py-1 rounded">
                                        {Math.floor(file.duration / 60)}:{(file.duration % 60).toString().padStart(2, '0')}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                            }
                            
                            // Fallback icon
                            return (
                              <div className="w-full h-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                                {(() => {
                                  const fileType = file.fileType || file.type;
                                  if (fileType === 'image') {
                                    return (
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                                    );
                                  } else if (fileType === 'video') {
                                    return (
                              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                              </svg>
                              </div>
                                    );
                                  } else {
                                    return (
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                              </svg>
                                    );
                                  }
                                })()}
                          </div>
                            );
                          })()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm truncate">{file.originalName || file.name}</p>
                          <p className="text-gray-400 text-xs">{file.fileType || file.type} • {file.status}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-600">Tags:</p>
                          <div className="flex flex-wrap gap-1">
                            {file.tags.map((tag, index) => (
                              <span key={index} className="bg-purple-50 text-purple-800 text-xs px-2 py-1 rounded border border-purple-200">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Transcript:</p>
                          <p className="text-xs text-gray-700">{file.transcript}</p>
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
            <div className="text-center bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl py-8 border border-purple-100">
              <h2 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Search Your Memories</h2>
              <p className="text-lg text-gray-600">Search by meaning, emotions, or concepts - not just keywords</p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g., 'show me all the times I was happy' or 'find my beach memories'"
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button onClick={handleSearch} className="btn-primary">
                  Search
                </button>
                {searchQuery && (
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="btn-secondary"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Show search results if searching, otherwise show all files */}
            {files.length > 0 && (
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {searchQuery ? `Search Results (${searchResults.length})` : `All Your Files (${files.length})`}
                  </h3>
                  
                  {(isStoryMode || showStoryModal) && (
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                      </span>
                      <button
                        onClick={selectAllFiles}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearSelection}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                      >
                        Clear
                      </button>
                      {!showStoryModal && (
                        <button
                          onClick={generateStoryFromSelection}
                          disabled={selectedFiles.length === 0 || isCreatingStory}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCreatingStory ? 'Creating...' : `Create Story (${selectedFiles.length})`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(searchQuery ? searchResults : files).map((file) => {
                    const isSelected = selectedFiles.some(f => f._id === file._id);
                    return (
                    <div 
                      key={file._id || file.id} 
                      className={`bg-white rounded-lg p-4 border transition-all duration-200 cursor-pointer hover:scale-105 hover:border-blue-400 ${isSelected ? 'border-purple-500 bg-purple-50 shadow-lg' : 'border-gray-200 hover:shadow-md'}`}
                      onClick={(e) => {
                        console.log('🎯 CONTAINER CLICKED:', file.originalName);
                        console.log('🎯 FILE DATA:', file);
                        handleMediaClick(file);
                      }}
                      title="Click to view in full size"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        {(isStoryMode || showStoryModal) && (
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleFileSelection(file);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                            />
                          </div>
                        )}
                        {/* File Status Indicator - Only show processing status, filename is in preview */}
                        <div className="flex-1">
                          <div className="flex items-center justify-end">
                            <div className="flex items-center gap-1">
                              {(() => {
                                const validUrl = file.fileUrl || file.thumbnailUrl || file.previewUrl || file.sourceUrl || file.url;
                                if (!validUrl || validUrl === 'undefined' || validUrl === 'null') {
                                  return (
                                    <span className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded">
                                      Processing...
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                          {(() => {
                            const fileType = file.fileType || file.type;
                            let fileUrl = '';
                            
                            if (fileType === 'image') {
                              fileUrl = file.fileUrl || file.thumbnailUrl || file.previewUrl || file.sourceUrl || file.url;
                            } else if (fileType === 'video') {
                              fileUrl = file.fileUrl || file.thumbnailUrl || file.previewUrl || file.sourceUrl || file.url;
                            } else if (fileType === 'audio') {
                              fileUrl = file.fileUrl || file.sourceUrl || file.url;
                            }
                            
                            console.log('🔍 SEARCH FILES - File:', file.originalName, 'Type:', fileType);
                            console.log('🔍 SEARCH FILES - All URLs:', {
                              fileUrl: file.fileUrl,
                              thumbnailUrl: file.thumbnailUrl,
                              previewUrl: file.previewUrl,
                              sourceUrl: file.sourceUrl,
                              url: file.url,
                              finalUrl: fileUrl
                            });
                            console.log('🔍 SEARCH FILES - Full file object:', file);
                            
                            if (fileUrl && fileUrl !== 'undefined' && fileUrl !== 'null' && fileUrl.trim() !== '') {
                              if (fileType === 'image') {
                                return (
                                  <div className="w-full h-full relative overflow-hidden rounded-lg">
                                    <img 
                                      src={fileUrl}
                              alt={file.originalName || file.name}
                              className="w-full h-full object-cover"
                                      onLoad={() => console.log('✅ SEARCH IMAGE LOADED:', fileUrl)}
                              onError={(e) => {
                                        console.log('❌ SEARCH IMAGE ERROR:', fileUrl);
                                        console.log('❌ SEARCH IMAGE ERROR - File data:', file);
                                        // Try alternative URLs
                                        const altUrl = file.thumbnailUrl || file.previewUrl || file.sourceUrl || file.url;
                                        if (altUrl && altUrl !== fileUrl) {
                                          console.log('🔄 TRYING ALTERNATIVE URL:', altUrl);
                                          e.target.src = altUrl;
                                        } else {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                                        }
                                      }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200" style={{ display: 'none' }}>
                                      <div className="text-gray-500 text-xs">Image Error</div>
                                    </div>
                                  </div>
                                );
                              } else if (fileType === 'video') {
                                // Get all possible URLs for this video
                                const allUrls = [
                                  file.fileUrl,
                                  file.thumbnailUrl,
                                  file.previewUrl,
                                  file.sourceUrl,
                                  file.url
                                ].filter(Boolean);
                                
                                const mediaUrl = allUrls[0] || '';
                                
                                console.log('🎬 SEARCH VIDEO DEBUG - File:', file.originalName);
                                console.log('🎬 SEARCH VIDEO DEBUG - All URLs:', allUrls);
                                console.log('🎬 SEARCH VIDEO DEBUG - Media URL:', mediaUrl);
                                
                                if (!mediaUrl) {
                                  return (
                                    <div className="relative w-full h-full bg-gray-200 flex items-center justify-center">
                                      <div className="text-gray-500 text-center">
                                        <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2 mx-auto">
                                          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                                          </svg>
                                        </div>
                                        <div className="text-xs">No Media URL</div>
                                      </div>
                                    </div>
                                  );
                                }
                                
                                return (
                                  <div className="relative w-full h-full group">
                                    {/* Try thumbnail first, then video frame */}
                                    {file.thumbnailUrl ? (
                                      <img 
                                        src={`${file.thumbnailUrl}?t=${Date.now()}&f_auto,q_auto`}
                                alt={file.originalName || file.name}
                                className="w-full h-full object-cover"
                                        crossOrigin="anonymous"
                                        onLoad={() => console.log('✅ SEARCH VIDEO THUMBNAIL LOADED:', file.thumbnailUrl)}
                                onError={(e) => {
                                          console.log('❌ SEARCH THUMBNAIL ERROR, trying video frame');
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'block';
                                        }}
                                      />
                                    ) : null}
                                    
                                    {/* Video element for frame preview */}
                                    <video 
                                      className="w-full h-full object-cover"
                                      preload="metadata"
                                      controls={false}
                                      playsInline
                                      muted={true}
                                      crossOrigin="anonymous"
                                      style={{ display: file.thumbnailUrl ? 'none' : 'block' }}
                                      onLoadStart={() => console.log('🎬 SEARCH VIDEO LOAD START:', mediaUrl)}
                                      onLoadedData={(e) => {
                                        console.log('🎬 SEARCH VIDEO DATA LOADED:', mediaUrl);
                                        // Hide thumbnail, show video frame
                                        const img = e.target.previousElementSibling;
                                        if (img && img.tagName === 'IMG') {
                                          img.style.display = 'none';
                                        }
                                        e.target.style.display = 'block';
                                      }}
                                      onCanPlay={() => console.log('🎬 SEARCH VIDEO CAN PLAY:', mediaUrl)}
                                      onError={(e) => {
                                        console.log('❌ SEARCH VIDEO ERROR:', mediaUrl);
                                        console.log('❌ SEARCH VIDEO ERROR DETAILS:', e);
                                        // Try next URL
                                        if (allUrls.length > 1) {
                                          console.log('🔄 TRYING NEXT URL:', allUrls[1]);
                                          e.target.src = `${allUrls[1]}?t=${Date.now()}&f_auto,q_auto`;
                                        } else {
                                          // Show error state
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                        }
                                      }}
                                      ref={(el) => {
                                        if (el && !el.src) {
                                          // Load video source after component mounts
                                          setTimeout(() => {
                                            el.src = `${mediaUrl}?t=${Date.now()}&f_auto,q_auto`;
                                          }, 100);
                                        }
                                      }}
                                    />
                                    
                                    {/* Play button overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:bg-opacity-40 transition-all duration-200">
                                      <div className="w-8 h-8 bg-white bg-opacity-95 rounded-full flex items-center justify-center shadow-xl hover:bg-opacity-100 transition-all duration-200 hover:scale-110 cursor-pointer">
                                        <svg className="w-4 h-4 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                                        </svg>
                                      </div>
                                    </div>
                                    
                                    {/* Video duration badge */}
                                    {file.duration && (
                                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded">
                                        {file.duration}
                                      </div>
                                    )}
                                    
                                    {/* Error fallback with video icon */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900" style={{ display: 'none' }}>
                                      <div className="text-white text-center">
                                        <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-1 mx-auto">
                                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                          </svg>
                                        </div>
                                        <div className="text-xs">Video Preview</div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              } else if (fileType === 'audio') {
                                return (
                                  <div className="relative w-full h-full bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex flex-col items-center justify-center p-2">
                                    {/* Animated waveform */}
                                    <div className="flex items-center space-x-1 mb-2">
                                      <div className="w-1 h-2 bg-white bg-opacity-60 rounded-full animate-pulse"></div>
                                      <div className="w-1 h-4 bg-white bg-opacity-80 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                                      <div className="w-1 h-3 bg-white bg-opacity-70 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                      <div className="w-1 h-5 bg-white bg-opacity-90 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                                      <div className="w-1 h-2 bg-white bg-opacity-60 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                                      <div className="w-1 h-4 bg-white bg-opacity-75 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                                      <div className="w-1 h-3 bg-white bg-opacity-65 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                                    </div>
                                    
                                    {/* Audio icon */}
                                    <div className="w-6 h-6 bg-white bg-opacity-90 rounded-full flex items-center justify-center mb-1">
                                      <svg className="w-3 h-3 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                              </svg>
                                    </div>
                                    
                                    {/* Duration if available */}
                                    {file.duration && (
                                      <div className="text-white text-xs bg-black bg-opacity-30 px-2 py-1 rounded">
                                        {Math.floor(file.duration / 60)}:{(file.duration % 60).toString().padStart(2, '0')}
                                      </div>
                            )}
                          </div>
                                );
                              }
                            }
                            
                            // Force real media display - try all possible URLs
                            console.log('🔍 FORCING REAL MEDIA - File:', file.originalName, 'Type:', fileType);
                            
                            // Try to get ANY valid URL
                            const allUrls = [
                              file.fileUrl,
                              file.thumbnailUrl, 
                              file.previewUrl,
                              file.sourceUrl,
                              file.url,
                              fileUrl
                            ].filter(url => url && url !== 'undefined' && url !== 'null' && url.trim() !== '');
                            
                            console.log('🔍 AVAILABLE URLs:', allUrls);
                            
                            if (allUrls.length > 0) {
                              const mediaUrl = allUrls[0];
                              console.log('🔍 USING URL:', mediaUrl);
                              
                              if (fileType === 'image') {
                                return (
                                  <div className="w-full h-full relative overflow-hidden rounded-lg bg-gray-100">
                                    <img 
                                      src={mediaUrl}
                                      alt={file.originalName || file.name}
                                      className="w-full h-full object-cover"
                                      onLoad={() => console.log('✅ REAL IMAGE LOADED:', mediaUrl)}
                                      onError={(e) => {
                                        console.log('❌ IMAGE ERROR, trying next URL');
                                        if (allUrls.length > 1) {
                                          e.target.src = allUrls[1];
                                        } else {
                                          // Show error state
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }
                                      }}
                                    />
                                    {/* Error fallback */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200" style={{ display: 'none' }}>
                                      <div className="text-gray-500 text-xs text-center">
                                        <div>Image Error</div>
                                        <div className="text-xs opacity-75">Check console</div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              } else if (fileType === 'video') {
                                return (
                                  <div className="relative w-full h-full group">
                                    {/* Try thumbnail first, then video frame */}
                                    {file.thumbnailUrl ? (
                                      <img 
                                        src={`${file.thumbnailUrl}?t=${Date.now()}&f_auto,q_auto`}
                                        alt={file.originalName || file.name}
                                        className="w-full h-full object-cover"
                                        crossOrigin="anonymous"
                                        onLoad={() => console.log('✅ VIDEO THUMBNAIL LOADED:', file.thumbnailUrl)}
                                        onError={(e) => {
                                          console.log('❌ THUMBNAIL ERROR, trying video frame');
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'block';
                                        }}
                                      />
                                    ) : null}
                                    
                                    {/* Video element for frame preview */}
                                    <video 
                                      className="w-full h-full object-cover"
                                      preload="metadata"
                                      controls={false}
                                      playsInline
                                      muted={true}
                                      crossOrigin="anonymous"
                                      style={{ display: file.thumbnailUrl ? 'none' : 'block' }}
                                      onLoadStart={() => console.log('🎬 VIDEO LOAD START:', mediaUrl)}
                                      onLoadedData={(e) => {
                                        console.log('🎬 VIDEO DATA LOADED:', mediaUrl);
                                        // Hide thumbnail, show video frame
                                        const img = e.target.previousElementSibling;
                                        if (img && img.tagName === 'IMG') {
                                          img.style.display = 'none';
                                        }
                                        e.target.style.display = 'block';
                                      }}
                                      onCanPlay={() => console.log('🎬 VIDEO CAN PLAY:', mediaUrl)}
                                      onError={(e) => {
                                        console.log('❌ VIDEO ERROR:', mediaUrl);
                                        console.log('❌ VIDEO ERROR DETAILS:', e);
                                        // Try next URL
                                        if (allUrls.length > 1) {
                                          console.log('🔄 TRYING NEXT URL:', allUrls[1]);
                                          e.target.src = `${allUrls[1]}?t=${Date.now()}&f_auto,q_auto`;
                                        } else {
                                          // Show error state
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }
                                      }}
                                      ref={(el) => {
                                        if (el && !el.src) {
                                          // Load video source after component mounts
                                          setTimeout(() => {
                                            el.src = `${mediaUrl}?t=${Date.now()}&f_auto,q_auto`;
                                          }, 100);
                                        }
                                      }}
                                    />
                                    
                                    {/* Play button overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:bg-opacity-40 transition-all duration-200">
                                      <div className="w-16 h-16 bg-white bg-opacity-95 rounded-full flex items-center justify-center shadow-xl hover:bg-opacity-100 transition-all duration-200 hover:scale-110 cursor-pointer">
                                        <svg className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                                        </svg>
                                      </div>
                                    </div>
                                    
                                    {/* Video duration badge */}
                                    {file.duration && (
                                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                        {file.duration}
                                      </div>
                                    )}
                                    
                                    {/* Error fallback with video icon */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900" style={{ display: 'none' }}>
                                      <div className="text-white text-center">
                                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2 mx-auto">
                                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                                          </svg>
                                        </div>
                                        <div className="text-xs">Video Preview</div>
                                        <div className="text-xs opacity-75">Click to play</div>
                                        <button 
                                          onClick={() => {
                                            console.log('🔄 RETRYING VIDEO LOAD');
                                            setFiles([...files]); // Force re-render
                                          }}
                                          className="mt-2 px-2 py-1 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30"
                                        >
                                          Retry
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              } else if (fileType === 'audio') {
                                return (
                                  <div className="relative w-full h-full bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex flex-col items-center justify-center p-2">
                                    <audio 
                                      src={mediaUrl}
                                      controls={true}
                                      className="w-full"
                                      onLoadStart={() => console.log('🎵 REAL AUDIO LOAD START:', mediaUrl)}
                                      onCanPlay={() => console.log('🎵 REAL AUDIO CAN PLAY:', mediaUrl)}
                                      onError={(e) => {
                                        console.log('❌ AUDIO ERROR, trying next URL');
                                        if (allUrls.length > 1) {
                                          e.target.src = allUrls[1];
                                        }
                                      }}
                                    />
                                    <div className="text-white text-xs mt-2 text-center">
                                      {file.originalName || file.name}
                                    </div>
                                  </div>
                                );
                              }
                            }
                            
                            // Only show fallback if absolutely no URLs work
                            console.log('❌ NO VALID URLs FOUND - showing fallback');
                            return (
                              <div className="w-full h-full bg-gradient-to-r from-red-600 to-orange-600 flex items-center justify-center">
                                <div className="text-white text-xs text-center">
                                  <div>No Media URL</div>
                                  <div className="text-xs opacity-75">Check console</div>
                                  <div className="mt-2">
                                    <button 
                                      onClick={() => {
                                        console.log('🔄 RETRYING MEDIA LOAD');
                                        setFiles([...files]); // Force re-render
                                      }}
                                      className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30"
                                    >
                                      Retry
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">{file.fileType || file.type} • {file.status}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {file.visionTags && file.visionTags.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <h4 className="text-sm font-semibold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">AI Tags</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {file.visionTags.slice(0, 4).map((tag, index) => (
                                <span key={index} className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 text-xs font-medium px-3 py-1.5 rounded-full border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                  {typeof tag === 'string' ? tag : (tag.tag || tag.object || 'Unknown')}
                              </span>
                            ))}
                          </div>
                        </div>
                        )}
                        {file.emotions && file.emotions.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                                </svg>
                        </div>
                              <h4 className="text-sm font-semibold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">AI Emotions</h4>
                      </div>
                            <div className="flex flex-wrap gap-2">
                              {file.emotions.slice(0, 3).map((emotion, index) => (
                                <span key={index} className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-800 text-xs font-medium px-3 py-1.5 rounded-full border border-orange-200 shadow-sm hover:shadow-md transition-all duration-200">
                                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                  {emotion.emotion}
                                </span>
                  ))}
                </div>
                          </div>
                        )}
                        {file.aiDescription && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <h4 className="text-sm font-semibold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">AI Description</h4>
                            </div>
                            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-3 border border-green-200">
                              <p className="text-sm text-gray-700 leading-relaxed">{file.aiDescription}</p>
                            </div>
                          </div>
                        )}
                        {file.transcription && file.transcription.text && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <h4 className="text-sm font-semibold text-gray-800">Transcript</h4>
                            </div>
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
                              <p className="text-sm text-gray-700 leading-relaxed font-mono">{file.transcription.text}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
                
                {/* Show message if no search results */}
                {searchQuery && searchResults.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
                    <p className="text-gray-600 mb-6">
                      Try searching with different keywords or check your spelling.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="btn-secondary"
                    >
                      Clear Search
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Show message if no files */}
            {files.length === 0 && !searchQuery && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Files Yet</h3>
                <p className="text-gray-600 mb-6">
                  Upload some memories to get started with AI-powered search!
                </p>
                <button 
                  onClick={() => setActiveTab('upload')}
                  className="btn-primary"
                >
                  Upload Memories
                </button>
              </div>
            )}
          </div>
        )}

        {/* My Stories Tab */}
        {activeTab === 'stories' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl py-6 px-6 border border-purple-100">
              <div>
                <h2 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">My Stories</h2>
                <p className="text-gray-600 text-lg">
                  {stories.length > 0 
                    ? `You have ${stories.length} beautiful stories created from your memories`
                    : 'Create your first story from your memories'
                  }
                </p>
              </div>
              <button 
                onClick={() => setShowStoryModal(true)}
                className="btn-primary"
              >
                Create New Story
              </button>
            </div>

            {stories.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📖</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Stories Yet</h3>
                <p className="text-gray-600 mb-6">
                  Upload some memories and create your first AI-generated story!
                </p>
                <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => setActiveTab('upload')}
                  className="btn-primary"
                >
                  Upload Memories
                </button>
             <button
               onClick={startStoryCreation}
               className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 transition-all duration-200"
             >
               Start Creating Story
                </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <div key={story._id} className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
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
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {story.description || story.content.substring(0, 150) + '...'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{story.wordCount} words</span>
                      <span>{story.estimatedReadingTime} min read</span>
                      <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewStory(story)}
                        className="flex-1 btn-primary text-sm"
                      >
                        View Story
                      </button>
                    </div>
                    
                    <div className="mt-2">
         <div className="space-y-2">
           <button 
             onClick={async () => {
               try {
                 setIsGeneratingAudio(true);
                 await generateAudio(story._id);
               } catch (error) {
                 console.error('Audio generation error:', error);
                 alert('Failed to generate audio: ' + error.message);
               } finally {
                 setIsGeneratingAudio(false);
               }
             }}
             disabled={isGeneratingAudio}
             className="w-full btn-outline text-sm disabled:opacity-50"
           >
             {isGeneratingAudio ? 'Generating Audio...' : 'Generate Audio'}
           </button>
           
         </div>
                    </div>

                    {/* Audio Player Section */}
                    {story.audioGeneration && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        {story.audioGeneration.status === 'generating' ? (
                          <div className="text-center">
                            <div className="text-2xl mb-2">🎵</div>
                            <p className="text-sm text-gray-400 mb-2">
                              Generating audio... {story.audioGeneration.processingProgress}%
                            </p>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${story.audioGeneration.processingProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : story.audioGeneration.status === 'completed' ? (
                          <div className="space-y-3">
                            <div className="text-center">
                              <div className="text-2xl mb-2">🎵</div>
                              <p className="text-sm text-gray-400 mb-3">
                                Your story audio is ready!
                              </p>
                              <div className="bg-gray-800 rounded-lg p-3">
                                <audio 
                                  controls
                                  className="w-full"
                                  preload="metadata"
                                >
                                  <source src={story.audioGeneration.audioUrl} type="audio/mpeg" />
                                  Your browser does not support the audio element.
                                </audio>
                              </div>
                              <div className="flex space-x-2 mt-3">
                                <button 
                                  onClick={() => {
                                    if (navigator.share) {
                                      navigator.share({
                                        title: `${story.title} - Audio Story`,
                                        text: 'Listen to my story!',
                                        url: story.audioGeneration.audioUrl
                                      });
                                    } else {
                                      navigator.clipboard.writeText(story.audioGeneration.audioUrl);
                                      alert('Audio link copied to clipboard!');
                                    }
                                  }}
                                  className="flex-1 btn-outline text-sm"
                                >
                                  Share Audio
                                </button>
                                <button 
                                  onClick={async () => {
                                    try {
                                      const audioUrl = story.audioGeneration.audioUrl;
                                      console.log('Downloading audio from:', audioUrl);
                                      
                                      // Try to fetch the audio file and create a blob download
                                      try {
                                        const response = await fetch(audioUrl);
                                        if (!response.ok) {
                                          throw new Error('Failed to fetch audio file');
                                        }
                                        
                                        const blob = await response.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.download = `${story.title.replace(/[^a-z0-9]/gi, '_')}-audio.mp3`;
                                        
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        
                                        // Clean up the blob URL
                                        window.URL.revokeObjectURL(url);
                                        
                                        // Show success message
                                        const notification = document.createElement('div');
                                        notification.style.cssText = `
                                          position: fixed;
                                          top: 20px;
                                          right: 20px;
                                          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                                          color: white;
                                          padding: 12px 20px;
                                          border-radius: 8px;
                                          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                                          z-index: 1000;
                                          font-family: system-ui, -apple-system, sans-serif;
                                        `;
                                        notification.textContent = '📥 Download started!';
                                        document.body.appendChild(notification);
                                        setTimeout(() => {
                                          if (notification.parentNode) {
                                            notification.parentNode.removeChild(notification);
                                          }
                                        }, 3000);
                                      } catch (fetchError) {
                                        console.log('Fetch failed, trying direct link method:', fetchError);
                                        
                                        // Fallback: Direct link method
                                        const link = document.createElement('a');
                                        link.href = audioUrl;
                                        link.download = `${story.title.replace(/[^a-z0-9]/gi, '_')}-audio.mp3`;
                                        link.target = '_blank';
                                        
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        
                                        // Show success message
                                        const notification = document.createElement('div');
                                        notification.style.cssText = `
                                          position: fixed;
                                          top: 20px;
                                          right: 20px;
                                          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                                          color: white;
                                          padding: 12px 20px;
                                          border-radius: 8px;
                                          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                                          z-index: 1000;
                                          font-family: system-ui, -apple-system, sans-serif;
                                        `;
                                        notification.textContent = '📥 Download started!';
                                        document.body.appendChild(notification);
                                        setTimeout(() => {
                                          if (notification.parentNode) {
                                            notification.parentNode.removeChild(notification);
                                          }
                                        }, 3000);
                                      }
                                    } catch (error) {
                                      console.error('Download error:', error);
                                      alert('Download failed. Please try right-clicking the audio player and selecting "Save audio as..."');
                                    }
                                  }}
                                  className="flex-1 btn-secondary text-sm"
                                >
                                  Download
                                </button>
                              </div>
                            </div>
                          </div>
             ) : story.audioGeneration.status === 'failed' ? (
               <div className="text-center">
                 <div className="text-2xl mb-2">❌</div>
                 <p className="text-sm text-red-400 mb-2">
                   Audio generation failed.
                 </p>
                 {story.audioGeneration.errorMessage && (
                   <p className="text-xs text-red-300 mb-3">
                     {story.audioGeneration.errorMessage}
                   </p>
                 )}
                 <button 
                   onClick={() => generateAudio(story._id)}
                   className="btn-primary text-sm"
                 >
                   Try Again
                 </button>
               </div>
             ) : null}
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}

            {generatedStory && (
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700 shadow-2xl">
                {/* Header with title and metadata */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">✨ Your Story</h3>
                      <p className="text-sm text-gray-400">Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full text-xs font-medium text-white">
                      {generatedStory.split(' ').length} words
                    </div>
                    <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-teal-600 rounded-full text-xs font-medium text-white">
                      ~{Math.ceil(generatedStory.split(' ').length / 200)} min read
                    </div>
                  </div>
                </div>

                {/* Story content */}
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 max-h-96 overflow-y-auto shadow-inner border border-gray-200">
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-line text-base font-medium">
                    {generatedStory}
                  </p>
                </div>
                </div>

                {/* Action buttons */}
                <div className="mt-8 flex flex-wrap gap-3 justify-center">
                  <button 
                    onClick={() => setGeneratedStory('')}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-medium hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
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
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                    Share Story
                  </button>
                  
                  <button 
                    onClick={() => {
                      const element = document.createElement('a');
                      const file = new Blob([generatedStory], { type: 'text/plain' });
                      element.href = URL.createObjectURL(file);
                      element.download = `my_story_${new Date().toISOString().split('T')[0]}.txt`;
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Story Creation Modal */}
      {showStoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Create New Story</h2>
                <button
                  onClick={() => setShowStoryModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Form */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <label className="text-sm font-semibold text-gray-800">
                        Story Title (Optional)
                      </label>
                    </div>
                    
                    <div className="relative">
                      <input
                        type="text"
                        value={storyTitle}
                        onChange={(e) => setStoryTitle(e.target.value)}
                        placeholder="📖 My Amazing Adventure Story..."
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-400 transition-all duration-300 bg-gradient-to-br from-gray-50 to-white shadow-sm hover:shadow-md"
                      />
                      
                      {/* Character counter */}
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                        {storyTitle.length}/100
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Leave blank for auto-generated title based on your files
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <label className="text-sm font-semibold text-gray-800">
                        Custom Story Prompt *
                      </label>
                    </div>
                    
                    <div className="relative">
                      <textarea
                        value={storyPrompt}
                        onChange={(e) => setStoryPrompt(e.target.value)}
                        placeholder="✨ Create a magical story about our adventures..."
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all duration-300 h-32 resize-none bg-gradient-to-br from-gray-50 to-white shadow-sm hover:shadow-md"
                        rows={4}
                      />
                      
                      {/* Character counter */}
                      <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                        {storyPrompt.length}/500
                      </div>
                    </div>
                    
                    {/* Prompt suggestions */}
                    <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-blue-800">💡 Prompt Ideas</span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          type="button"
                          onClick={() => setStoryPrompt("Create a funny and lighthearted story about our vacation adventures with humor and joy")}
                          className="text-left text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                        >
                          🎭 "Create a funny and lighthearted story about our vacation adventures with humor and joy"
                        </button>
                        <button
                          type="button"
                          onClick={() => setStoryPrompt("Write a romantic and nostalgic story focusing on our special moments together")}
                          className="text-left text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                        >
                          💕 "Write a romantic and nostalgic story focusing on our special moments together"
                        </button>
                        <button
                          type="button"
                          onClick={() => setStoryPrompt("Tell an exciting adventure story with suspense and thrilling moments")}
                          className="text-left text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                        >
                          🚀 "Tell an exciting adventure story with suspense and thrilling moments"
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <label className="text-sm font-semibold text-gray-800">
                          Theme
                        </label>
                      </div>
                      <select
                        value={storyTheme}
                        onChange={(e) => setStoryTheme(e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-400 transition-all duration-300 bg-gradient-to-br from-gray-50 to-white shadow-sm hover:shadow-md"
                      >
                        <option value="adventure">🏔️ Adventure</option>
                        <option value="family">👨‍👩‍👧‍👦 Family</option>
                        <option value="friends">👥 Friends</option>
                        <option value="travel">✈️ Travel</option>
                        <option value="celebration">🎉 Celebration</option>
                        <option value="achievement">🏆 Achievement</option>
                        <option value="love">💕 Love</option>
                        <option value="happy">😊 Happy</option>
                        <option value="custom">🎨 Custom</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <label className="text-sm font-semibold text-gray-800">
                          Mood
                        </label>
                      </div>
                      <select
                        value={storyMood}
                        onChange={(e) => setStoryMood(e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-pink-100 focus:border-pink-400 transition-all duration-300 bg-gradient-to-br from-gray-50 to-white shadow-sm hover:shadow-md"
                      >
                        <option value="uplifting">🌟 Uplifting</option>
                        <option value="nostalgic">📸 Nostalgic</option>
                        <option value="exciting">⚡ Exciting</option>
                        <option value="peaceful">🕊️ Peaceful</option>
                        <option value="romantic">💖 Romantic</option>
                        <option value="inspiring">💪 Inspiring</option>
                        <option value="funny">😂 Funny</option>
                        <option value="dramatic">🎭 Dramatic</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right Column - File Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Files ({selectedFiles.length} selected)
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedFiles(files)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setSelectedFiles([])}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="border border-gray-300 rounded-lg p-4 h-96 overflow-y-auto bg-gray-50">
                    {files.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <div className="text-4xl mb-2">📁</div>
                        <p>No files uploaded yet</p>
                        <p className="text-sm">Upload some memories first to create a story</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {files.map((file) => {
                          const isSelected = selectedFiles.some(f => f._id === file._id);
                          return (
                            <div
                              key={file._id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedFiles(prev => prev.filter(f => f._id !== file._id));
                                } else {
                                  setSelectedFiles(prev => [...prev, file]);
                                }
                              }}
                              className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                                isSelected 
                                  ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-400 shadow-lg shadow-purple-100' 
                                  : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md'
                              }`}
                            >
                              {/* Selection indicator */}
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="w-5 h-5 text-purple-600 bg-white border-2 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                                  />
                                </div>
                                
                                 <div className={`w-12 h-12 rounded-xl overflow-hidden transition-colors ${
                                   isSelected 
                                     ? 'ring-2 ring-purple-500' 
                                     : 'group-hover:ring-2 group-hover:ring-blue-500'
                                 }`}>
                                   {(() => {
                                     // Get the best available URL for the file
                                     const fileType = file.fileType || file.type;
                                     let fileUrl = '';
                                     
                                     if (fileType === 'image') {
                                       fileUrl = file.thumbnailUrl || file.previewUrl || file.fileUrl || file.sourceUrl || file.url;
                                     } else if (fileType === 'video') {
                                       fileUrl = file.thumbnailUrl || file.previewUrl || file.fileUrl || file.sourceUrl || file.url;
                                     } else if (fileType === 'audio') {
                                       fileUrl = file.fileUrl || file.sourceUrl || file.url;
                                     }
                                     
                                     console.log('All Files display debug:', {
                                       name: file.originalName || file.name,
                                       type: fileType,
                                       status: file.status,
                                       fileUrl: file.fileUrl,
                                       thumbnailUrl: file.thumbnailUrl,
                                       previewUrl: file.previewUrl,
                                       sourceUrl: file.sourceUrl,
                                       url: file.url,
                                       finalUrl: fileUrl,
                                       hasUrl: !!fileUrl,
                                       allFileData: file
                                     });
                                     
                                     // Force show original file URL if no thumbnail available
                                     if (!fileUrl && file.fileUrl) {
                                       fileUrl = file.fileUrl;
                                       console.log('All Files using original fileUrl as fallback:', fileUrl);
                                     }
                                     
                                     if (fileType === 'image') {
                                       // Prioritize HTTPS URLs to avoid mixed content issues
                                       let imageUrl = file.fileUrl || file.sourceUrl || file.url || fileUrl;
                                       
                                       // If thumbnailUrl is HTTPS, use it; otherwise use the main fileUrl
                                       if (file.thumbnailUrl && file.thumbnailUrl.startsWith('https://')) {
                                         imageUrl = file.thumbnailUrl;
                                       }
                                       
                                       // Convert HTTP to HTTPS if needed
                                       if (imageUrl && imageUrl.startsWith('http://')) {
                                         imageUrl = imageUrl.replace('http://', 'https://');
                                       }
                                       
                                       console.log('🖼️ ALL FILES IMAGE DEBUG - Attempting to display image with URL:', imageUrl);
                                       console.log('🖼️ ALL FILES IMAGE DEBUG - All available URLs:', {
                                         fileUrl: file.fileUrl,
                                         thumbnailUrl: file.thumbnailUrl,
                                         previewUrl: file.previewUrl,
                                         sourceUrl: file.sourceUrl,
                                         url: file.url,
                                         fileUrl2: fileUrl,
                                         finalImageUrl: imageUrl
                                       });
                                       
                                       if (imageUrl && imageUrl !== 'undefined' && imageUrl !== 'null') {
                                         return (
                                           <div className="relative w-full h-full group overflow-hidden">
                                             {(() => {
                                               const fileType = file.fileType || file.type;
                                               let fileUrl = '';
                                               
                                               if (fileType === 'image') {
                                                 fileUrl = file.thumbnailUrl || file.previewUrl || file.fileUrl || file.sourceUrl || file.url;
                                               } else if (fileType === 'video') {
                                                 fileUrl = file.thumbnailUrl || file.previewUrl || file.fileUrl || file.sourceUrl || file.url;
                                               } else if (fileType === 'audio') {
                                                 fileUrl = file.fileUrl || file.sourceUrl || file.url;
                                               }
                                               
                                               if (fileUrl && fileUrl !== 'undefined' && fileUrl !== 'null') {
                                                 if (fileType === 'image') {
                                                   return (
                                                     <div className="w-full h-full relative overflow-hidden rounded-lg">
                                                       <img 
                                                         src={fileUrl}
                                       alt={file.originalName || file.name}
                                       className="w-full h-full object-cover"
                                                         onLoad={() => console.log('✅ ALL FILES IMAGE LOADED:', fileUrl)}
                                       onError={(e) => {
                                                           console.log('❌ ALL FILES IMAGE ERROR:', fileUrl);
                                                           // Try alternative URLs
                                                           const altUrl = file.thumbnailUrl || file.previewUrl || file.sourceUrl || file.url;
                                                           if (altUrl && altUrl !== fileUrl) {
                                                             console.log('🔄 TRYING ALTERNATIVE URL:', altUrl);
                                                             e.target.src = altUrl;
                                                           } else {
                                         e.target.style.display = 'none';
                                         e.target.nextSibling.style.display = 'flex';
                                                           }
                                                         }}
                                                       />
                                                       <div className="absolute inset-0 flex items-center justify-center bg-gray-200" style={{ display: 'none' }}>
                                                         <div className="text-gray-500 text-xs">Image Error</div>
                                                       </div>
                                                     </div>
                                                   );
                              } else if (fileType === 'video') {
                                // Simple approach - just show thumbnail with play button like Search & Explore
                                const thumbnailUrl = file.thumbnailUrl || file.previewUrl || file.fileUrl;
                                
                                console.log('🎬 STORY MODAL VIDEO - File:', file.originalName);
                                console.log('🎬 STORY MODAL VIDEO - Thumbnail URL:', thumbnailUrl);
                                
                                return (
                                  <div className="relative w-full h-full group cursor-pointer" onClick={() => handleMediaClick(file)}>
                                    {/* Show thumbnail image */}
                                    {thumbnailUrl ? (
                                      <img 
                                        src={thumbnailUrl}
                                         alt={file.originalName || file.name}
                                        className="w-full h-full object-cover rounded-lg"
                                        onLoad={() => console.log('✅ STORY MODAL THUMBNAIL LOADED:', thumbnailUrl)}
                                         onError={(e) => {
                                          console.log('❌ STORY MODAL THUMBNAIL ERROR:', thumbnailUrl);
                                           e.target.style.display = 'none';
                                           e.target.nextSibling.style.display = 'flex';
                                         }}
                                       />
                                    ) : null}
                                    
                                    {/* Fallback video icon */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg" style={{ display: thumbnailUrl ? 'none' : 'flex' }}>
                                      <div className="text-center">
                                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2">
                                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                                          </svg>
                                        </div>
                                        <div className="text-white text-xs font-medium">Video</div>
                                        <div className="text-white text-xs opacity-75">Click to view</div>
                                      </div>
                                    </div>
                                    
                                    {/* Play button overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg">
                                      <div className="w-8 h-8 bg-white bg-opacity-95 rounded-full flex items-center justify-center shadow-xl hover:bg-opacity-100 transition-all duration-200 hover:scale-110 cursor-pointer">
                                        <svg className="w-4 h-4 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M8 5v10l8-5-8-5z" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                );
                                                 } else if (fileType === 'audio') {
                                                   return (
                                                     <div className="relative w-full h-full bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
                                                       <div className="flex items-center space-x-1">
                                                         <div className="w-1 h-3 bg-white bg-opacity-60 rounded-full animate-pulse"></div>
                                                         <div className="w-1 h-4 bg-white bg-opacity-80 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                                                         <div className="w-1 h-2 bg-white bg-opacity-60 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                                         <div className="w-1 h-5 bg-white bg-opacity-90 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                                                         <div className="w-1 h-3 bg-white bg-opacity-60 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                                                       </div>
                                                       <div className="absolute inset-0 flex items-center justify-center">
                                                         <div className="w-6 h-6 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                                                           <svg className="w-3 h-3 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                             <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                                           </svg>
                                                         </div>
                                                       </div>
                                                     </div>
                                                   );
                                                 }
                                               }
                                               
                                               // Fallback icon
                                               return (
                                                 <div className="w-full h-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                                                   {(() => {
                                                     const fileType = file.fileType || file.type;
                                                     if (fileType === 'image') {
                                                       return (
                                                         <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                           <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                         </svg>
                                                       );
                                                     } else if (fileType === 'video') {
                                                       return (
                                                         <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                                           <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                             <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                                                           </svg>
                                                         </div>
                                                       );
                                                     } else {
                                                       return (
                                                         <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                           <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                                         </svg>
                                                       );
                                                     }
                                                   })()}
                                                 </div>
                                               );
                                             })()}
                                           </div>
                                         );
                                       } else {
                                         console.log('❌ ALL FILES NO IMAGE URL FOUND - Showing fallback');
                                         return (
                                           <div className="relative w-full h-full group bg-red-100 flex items-center justify-center">
                                             <div className="text-center">
                                               <div className="text-red-600 text-xs">No URL</div>
                                               <div className="text-red-500 text-xs">{file.originalName || file.name}</div>
                                             </div>
                                           </div>
                                         );
                                       }
                                     } else if (fileType === 'video') {
                                       // Simple approach - just show thumbnail with play button like Search & Explore
                                       const thumbnailUrl = file.thumbnailUrl || file.previewUrl || file.fileUrl;
                                       
                                       console.log('🎬 STORY MODAL VIDEO - File:', file.originalName);
                                       console.log('🎬 STORY MODAL VIDEO - Thumbnail URL:', thumbnailUrl);
                                       
                                       return (
                                         <div className="relative w-full h-full group cursor-pointer" onClick={() => handleMediaClick(file)}>
                                           {/* Show thumbnail image */}
                                           {thumbnailUrl ? (
                                             <img 
                                               src={thumbnailUrl}
                                               alt={file.originalName || file.name}
                                               className="w-full h-full object-cover rounded-lg"
                                               onLoad={() => console.log('✅ STORY MODAL THUMBNAIL LOADED:', thumbnailUrl)}
                                               onError={(e) => {
                                                 console.log('❌ STORY MODAL THUMBNAIL ERROR:', thumbnailUrl);
                                                 e.target.style.display = 'none';
                                                 e.target.nextSibling.style.display = 'flex';
                                               }}
                                             />
                                           ) : null}
                                           
                                           {/* Fallback video icon */}
                                           <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg" style={{ display: thumbnailUrl ? 'none' : 'flex' }}>
                                             <div className="text-center">
                                               <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2">
                                                 <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                   <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                                                 </svg>
                                               </div>
                                               <div className="text-white text-xs font-medium">Video</div>
                                               <div className="text-white text-xs opacity-75">Click to view</div>
                                             </div>
                                           </div>
                                           
                                           {/* Play button overlay */}
                                           <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg">
                                             <div className="w-8 h-8 bg-white bg-opacity-95 rounded-full flex items-center justify-center shadow-xl hover:bg-opacity-100 transition-all duration-200 hover:scale-110 cursor-pointer">
                                               <svg className="w-4 h-4 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                 <path d="M8 5v10l8-5-8-5z" />
                                               </svg>
                                             </div>
                                           </div>
                                           
                                           {/* Video duration badge */}
                                           {file.duration && (
                                             <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded">
                                               {Math.floor(file.duration / 60)}:{(file.duration % 60).toString().padStart(2, '0')}
                                             </div>
                                           )}
                                         </div>
                                       );
                                     }
                                     return null;
                                   })()}
                                   <div className={`w-full h-full flex items-center justify-center ${
                                     (() => {
                                       const fileType = file.fileType || file.type;
                                       const fileUrl = fileType === 'image' 
                                         ? (file.thumbnailUrl || file.previewUrl || file.fileUrl || file.sourceUrl || file.url)
                                         : fileType === 'video' 
                                         ? (file.thumbnailUrl || file.previewUrl || file.fileUrl || file.sourceUrl || file.url)
                                         : (file.fileUrl || file.sourceUrl || file.url);
                                       return fileUrl ? 'hidden' : 'flex';
                                     })()
                                   } ${
                                     isSelected 
                                       ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
                                       : 'bg-gradient-to-br from-blue-500 to-indigo-600 group-hover:from-blue-600 group-hover:to-indigo-700'
                                   }`}>
                                     {file.fileType === 'image' ? (
                                       <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                         <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                       </svg>
                                     ) : file.fileType === 'video' ? (
                                       <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                         <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                       </svg>
                                     ) : (
                                       <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                         <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                       </svg>
                                     )}
                                   </div>
                                 </div>
                                
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-semibold truncate transition-colors ${
                                    isSelected ? 'text-purple-900' : 'text-gray-900'
                                  }`}>
                                    {file.originalName || file.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      file.status === 'completed' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {file.status}
                                    </span>
                                    <span className="text-xs text-gray-500 capitalize">
                                      {file.fileType}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowStoryModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                 <button
                   onClick={generateStoryFromSelection}
                   disabled={selectedFiles.length === 0 || !storyPrompt.trim() || isCreatingStory}
                   className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isCreatingStory ? 'Generating...' : `Generate Story (${selectedFiles.length} files)`}
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Story View Modal */}
      {showStoryViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl">
            <div className="p-6">
              {loadingStory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading story...</p>
                  </div>
                </div>
              ) : viewingStory ? (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">{viewingStory.title}</h2>
                        <p className="text-sm text-gray-500">Created on {new Date(viewingStory.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full text-xs font-medium text-white">
                        {viewingStory.wordCount || viewingStory.content.split(' ').length} words
                      </div>
                      <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-teal-600 rounded-full text-xs font-medium text-white">
                        ~{Math.ceil((viewingStory.wordCount || viewingStory.content.split(' ').length) / 200)} min read
                      </div>
                      <button
                        onClick={handleCloseStoryView}
                        className="text-gray-400 hover:text-gray-600 text-2xl ml-2"
                      >
                        ×
                      </button>
                    </div>
                  </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Story Content */}
                <div className="lg:col-span-2">
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">✨ Generated Story</h3>
                    </div>
                    <div className="prose prose-lg max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
                        {viewingStory.content}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column - Source Files & AI Insights */}
                <div className="space-y-6">
                  {/* Source Files */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-semibold text-blue-800">📁 Source Files ({viewingStory.files?.length || 0})</h4>
                    </div>
                    
                    {viewingStory.files && viewingStory.files.length > 0 ? (
                      <div className="space-y-2">
                        {viewingStory.files.map((fileRef, index) => {
                          const file = fileRef.fileId; // fileRef.fileId is already populated
                          if (!file) return null;
                          
                          return (
                            <div key={file._id} className="bg-white rounded-lg p-3 border border-blue-200">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                                  {file.thumbnailUrl ? (
                                    <img 
                                      src={file.thumbnailUrl} 
                                      alt={file.originalName || file.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        // Fallback to icon if thumbnail fails to load
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : (
                                    // For existing files without thumbnails, show the original file as thumbnail
                                    file.fileType === 'image' ? (
                                      <img 
                                        src={file.fileUrl} 
                                        alt={file.originalName || file.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          // Fallback to icon if image fails to load
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null
                                  )}
                                  <div className={`w-full h-full flex items-center justify-center ${file.thumbnailUrl || (file.fileType === 'image' && file.fileUrl) ? 'hidden' : 'flex'} bg-blue-500`}>
                                    {file.fileType === 'image' ? (
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                      </svg>
                                    ) : file.fileType === 'video' ? (
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                      </svg>
                                    ) : (
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                                <span className="text-xs font-medium text-gray-700">{file.originalName || file.name}</span>
                              </div>
                              
                              {/* AI Description */}
                              {file.aiDescription && (
                                <p className="text-xs text-gray-600 mb-2">{file.aiDescription}</p>
                              )}
                              
                              {/* AI Tags */}
                              {file.visionTags && file.visionTags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {file.visionTags.slice(0, 3).map((tag, tagIndex) => (
                                    <span key={tagIndex} className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      {typeof tag === 'string' ? tag : (tag.tag || tag.object || 'Unknown')}
                                    </span>
                                  ))}
                                  {file.visionTags.length > 3 && (
                                    <span className="text-xs text-gray-500">+{file.visionTags.length - 3} more</span>
                                  )}
                                </div>
                              )}
                              
                              {/* AI Emotions */}
                              {file.emotions && file.emotions.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {file.emotions.slice(0, 2).map((emotion, emotionIndex) => (
                                    <span key={emotionIndex} className="inline-flex items-center px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                      {emotion.emotion}
                                    </span>
                                  ))}
                                  {file.emotions.length > 2 && (
                                    <span className="text-xs text-gray-500">+{file.emotions.length - 2} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No source files available</p>
                    )}
                  </div>

                  {/* AI Insights Summary */}
                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-4 border border-green-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-semibold text-green-800">🎯 AI Insights</h4>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Theme & Mood */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-600">Theme:</span>
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full capitalize">
                            {viewingStory.theme}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-600">Mood:</span>
                          <span className="px-2 py-0.5 bg-pink-100 text-pink-800 text-xs rounded-full capitalize">
                            {viewingStory.mood}
                          </span>
                        </div>
                      </div>
                      
                      {/* Combined Tags */}
                      {viewingStory.files && viewingStory.files.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-gray-600 block mb-1">Key Elements:</span>
                          <div className="flex flex-wrap gap-1">
                            {(() => {
                              const allTags = [];
                              viewingStory.files.forEach(fileRef => {
                                const file = fileRef.fileId; // fileRef.fileId is already populated
                                if (file && file.visionTags) {
                                  file.visionTags.forEach(tag => {
                                    const tagText = typeof tag === 'string' ? tag : (tag.tag || tag.object || '');
                                    if (tagText && !allTags.includes(tagText)) {
                                      allTags.push(tagText);
                                    }
                                  });
                                }
                              });
                              return allTags.slice(0, 6).map((tag, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                  {tag}
                                </span>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                <button 
                  onClick={handleCloseStoryView}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-medium hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Close
                </button>
                
                <button 
                  onClick={() => {
                    handleCloseStoryView();
                    handleEditStory(viewingStory);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit Story
                </button>
                
                <button 
                  onClick={async () => {
                    try {
                      const result = await storyService.shareStory(viewingStory._id);
                      if (navigator.share) {
                        navigator.share({
                          title: viewingStory.title,
                          text: viewingStory.description || viewingStory.content.substring(0, 100),
                          url: result.shareUrl
                        });
                      } else {
                        navigator.clipboard.writeText(result.shareUrl);
                        alert('Story link copied to clipboard!');
                      }
                    } catch (error) {
                      console.error('Share error:', error);
                      alert('Failed to share story: ' + error.message);
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  Share Story
                </button>
                
                <button 
                  onClick={() => {
                    const element = document.createElement('a');
                    const file = new Blob([viewingStory.content], { type: 'text/plain' });
                    element.href = URL.createObjectURL(file);
                    element.download = `${viewingStory.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download
                </button>
              </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <p className="text-gray-600">Failed to load story</p>
                    <button
                      onClick={handleCloseStoryView}
                      className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
      
      {/* Media Modal */}
      {isMediaModalOpen && selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {selectedMedia.originalName}
              </h3>
              <div className="flex items-center gap-2">
                {(selectedMedia.fileType === 'video' || selectedMedia.fileType === 'audio') && (
                  <button
                    onClick={handleReplay}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                    title="Replay from beginning"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Replay
                  </button>
                )}
                <button
                  onClick={closeMediaModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-4">
              {selectedMedia.fileType === 'video' ? (
                <div className="relative">
                  <video
                    key={`${selectedMedia._id || selectedMedia.id}-${mediaKey}`} // Force re-render when different video or replay
                    src={`${selectedMedia.fileUrl}?t=${Date.now()}`}
                    poster={selectedMedia.thumbnailUrl ? `${selectedMedia.thumbnailUrl}?t=${Date.now()}` : undefined}
                    className="w-full h-auto max-h-[60vh] object-contain rounded"
                    controls={true}
                    playsInline
                    preload="metadata"
                    crossOrigin="anonymous"
                    controlsList="nodownload nofullscreen noremoteplayback"
                    disablePictureInPicture
                    onLoadStart={() => console.log('🎬 MODAL VIDEO LOAD START')}
                    onCanPlay={() => console.log('🎬 MODAL VIDEO CAN PLAY')}
                    onEnded={() => {
                      console.log('🎬 MODAL VIDEO ENDED - Ready for replay');
                      // Video ended, user can click play again
                    }}
                    onPlay={() => console.log('🎬 MODAL VIDEO PLAYING')}
                    onPause={() => console.log('🎬 MODAL VIDEO PAUSED')}
                    onError={(e) => {
                      console.log('❌ MODAL VIDEO ERROR:', e);
                      console.log('❌ Video src:', selectedMedia.fileUrl);
                    }}
                  />
                  {selectedMedia.duration && (
                    <div className="mt-2 text-sm text-gray-600">
                      Duration: {Math.floor(selectedMedia.duration / 60)}:{(selectedMedia.duration % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    Click the play button to start or restart the video
                  </div>
                </div>
              ) : selectedMedia.fileType === 'audio' ? (
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <audio
                    key={`${selectedMedia._id || selectedMedia.id}-${mediaKey}`} // Force re-render when different audio or replay
                    src={selectedMedia.fileUrl}
                    className="w-full max-w-md mx-auto"
                    controls
                    preload="metadata"
                    onLoadStart={() => console.log('🎵 MODAL AUDIO LOAD START')}
                    onCanPlay={() => console.log('🎵 MODAL AUDIO CAN PLAY')}
                    onEnded={() => {
                      console.log('🎵 MODAL AUDIO ENDED - Ready for replay');
                      // Audio ended, user can click play again
                    }}
                    onPlay={() => console.log('🎵 MODAL AUDIO PLAYING')}
                    onPause={() => console.log('🎵 MODAL AUDIO PAUSED')}
                    onError={(e) => {
                      console.log('❌ MODAL AUDIO ERROR:', e);
                      console.log('❌ Audio src:', selectedMedia.fileUrl);
                    }}
                  />
                  {selectedMedia.duration && (
                    <div className="mt-2 text-sm text-gray-600">
                      Duration: {Math.floor(selectedMedia.duration / 60)}:{(selectedMedia.duration % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    Click the play button to start or restart the audio
                  </div>
                </div>
              ) : selectedMedia.fileType === 'image' ? (
                <div className="text-center">
                  <img
                    src={selectedMedia.fileUrl}
                    alt={selectedMedia.originalName}
                    className="max-w-full max-h-[60vh] object-contain mx-auto rounded"
                  />
                </div>
              ) : null}
              
              {/* File Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">File Name:</span>
                    <p className="text-gray-600 truncate">{selectedMedia.originalName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">File Type:</span>
                    <p className="text-gray-600 capitalize">{selectedMedia.fileType}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">File Size:</span>
                    <p className="text-gray-600">
                      {selectedMedia.fileSize ? (selectedMedia.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <p className="text-gray-600 capitalize">{selectedMedia.status || 'Unknown'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
