const express = require('express');
const router = express.Router();
const googlePhotosService = require('../services/googlePhotosService');
const auth = require('../middleware/auth');
const File = require('../models/File');
const aiService = require('../services/aiService');

/**
 * GET /api/google-photos/auth
 * Initiate Google Photos OAuth flow
 */
router.get('/auth', auth, async (req, res) => {
  try {
    const state = req.user._id.toString(); // Use user ID as state
    const authUrl = googlePhotosService.getAuthUrl(state);
    
    res.json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    console.error('Error initiating Google Photos auth:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate Google Photos authentication'
    });
  }
});

/**
 * GET /api/google-photos/callback
 * Handle Google Photos OAuth callback
 */
router.get('/callback', auth, async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code not provided'
      });
    }

    // Verify state matches user ID
    if (state !== req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid state parameter'
      });
    }

    // Exchange code for tokens
    const tokens = await googlePhotosService.exchangeCodeForToken(code);

    // Store tokens in user document (you might want to create a separate model for this)
    req.user.googlePhotosTokens = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + (tokens.expires_in * 1000))
    };
    
    await req.user.save();

    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?google-photos-connected=true`);
  } catch (error) {
    console.error('Error handling Google Photos callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?google-photos-error=true`);
  }
});

/**
 * GET /api/google-photos/media
 * Get user's Google Photos media items
 */
router.get('/media', auth, async (req, res) => {
  try {
    if (!req.user.googlePhotosTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google Photos not connected. Please authenticate first.'
      });
    }

    let accessToken = req.user.googlePhotosTokens.accessToken;
    
    // Check if token is expired and refresh if needed
    if (new Date() >= req.user.googlePhotosTokens.expiresAt) {
      const newTokens = await googlePhotosService.refreshAccessToken(
        req.user.googlePhotosTokens.refreshToken
      );
      
      accessToken = newTokens.access_token;
      req.user.googlePhotosTokens.accessToken = newTokens.access_token;
      req.user.googlePhotosTokens.expiresAt = new Date(Date.now() + (newTokens.expires_in * 1000));
      await req.user.save();
    }

    const { pageSize = 50, pageToken } = req.query;
    const mediaItems = await googlePhotosService.getMediaItems(accessToken, parseInt(pageSize), pageToken);

    res.json({
      success: true,
      data: mediaItems
    });
  } catch (error) {
    console.error('Error fetching Google Photos media:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Google Photos media items'
    });
  }
});

/**
 * POST /api/google-photos/import
 * Import selected media items from Google Photos
 */
router.post('/import', auth, async (req, res) => {
  try {
    if (!req.user.googlePhotosTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google Photos not connected. Please authenticate first.'
      });
    }

    const { mediaItemIds } = req.body;

    if (!mediaItemIds || !Array.isArray(mediaItemIds) || mediaItemIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Media item IDs are required'
      });
    }

    let accessToken = req.user.googlePhotosTokens.accessToken;
    
    // Check if token is expired and refresh if needed
    if (new Date() >= req.user.googlePhotosTokens.expiresAt) {
      const newTokens = await googlePhotosService.refreshAccessToken(
        req.user.googlePhotosTokens.refreshToken
      );
      
      accessToken = newTokens.access_token;
      req.user.googlePhotosTokens.accessToken = newTokens.access_token;
      req.user.googlePhotosTokens.expiresAt = new Date(Date.now() + (newTokens.expires_in * 1000));
      await req.user.save();
    }

    // Get media item details
    const mediaItems = [];
    for (const mediaItemId of mediaItemIds) {
      const mediaItem = await googlePhotosService.getMediaItem(accessToken, mediaItemId);
      mediaItems.push(mediaItem);
    }

    // Import media items
    const importResults = await googlePhotosService.importMultipleMediaItems(
      accessToken, 
      mediaItems, 
      req.user._id.toString()
    );

    // Create File documents for successful imports
    const createdFiles = [];
    for (const importResult of importResults.successful) {
      const file = new File({
        userId: req.user._id,
        filename: importResult.originalFilename,
        originalName: importResult.originalFilename,
        mimetype: importResult.mimeType,
        size: importResult.bytes,
        cloudinaryUrl: importResult.secure_url,
        cloudinaryPublicId: importResult.public_id,
        status: 'uploaded',
        source: 'google-photos',
        metadata: {
          googlePhotosId: importResult.googlePhotosId,
          creationTime: importResult.creationTime
        }
      });

      await file.save();
      createdFiles.push(file);

      // Start AI processing in background
      processFileAI(file._id).catch(console.error);
    }

    res.json({
      success: true,
      message: `Successfully imported ${importResults.successful.length} items`,
      data: {
        imported: createdFiles,
        failed: importResults.failed
      }
    });
  } catch (error) {
    console.error('Error importing Google Photos media:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import Google Photos media items'
    });
  }
});

/**
 * POST /api/google-photos/disconnect
 * Disconnect Google Photos integration
 */
router.post('/disconnect', auth, async (req, res) => {
  try {
    req.user.googlePhotosTokens = undefined;
    await req.user.save();

    res.json({
      success: true,
      message: 'Google Photos disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting Google Photos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect Google Photos'
    });
  }
});

/**
 * GET /api/google-photos/status
 * Check Google Photos connection status
 */
router.get('/status', auth, (req, res) => {
  try {
    const isConnected = !!req.user.googlePhotosTokens;
    
    res.json({
      success: true,
      data: {
        connected: isConnected,
        expiresAt: isConnected ? req.user.googlePhotosTokens.expiresAt : null
      }
    });
  } catch (error) {
    console.error('Error checking Google Photos status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check Google Photos connection status'
    });
  }
});

// Helper function for AI processing (reuse existing logic)
async function processFileAI(fileId) {
  try {
    const file = await File.findById(fileId);
    if (!file) {
      console.error('File not found:', fileId);
      return;
    }

    // Update processing status
    file.status = 'processing';
    file.processingProgress = { step: 'Starting AI processing...', percentage: 0 };
    await file.save();

    // Get file info
    file.processingProgress = { step: 'Getting file info...', percentage: 10 };
    await file.save();

    const fileInfo = await aiService.getFileInfo(file.cloudinaryUrl);
    file.duration = fileInfo.duration;
    file.width = fileInfo.width;
    file.height = fileInfo.height;
    file.size = fileInfo.size;

    // Generate thumbnail
    file.processingProgress = { step: 'Generating thumbnail...', percentage: 20 };
    await file.save();

    const thumbnailResult = await aiService.generateThumbnail(file.cloudinaryUrl);
    file.thumbnailUrl = thumbnailResult.secure_url;

    // Transcribe audio
    file.processingProgress = { step: 'Transcribing audio...', percentage: 40 };
    await file.save();

    const transcriptionResult = await aiService.transcribeAudio(file.cloudinaryUrl);
    file.transcription = transcriptionResult.text;
    file.language = transcriptionResult.language;

    // Analyze visual content
    file.processingProgress = { step: 'Analyzing visual content...', percentage: 60 };
    await file.save();

    const visionResult = await aiService.analyzeVisualContent(file.cloudinaryUrl);
    file.visionTags = visionResult.tags;
    file.aiDescription = visionResult.description;
    file.emotions = visionResult.emotions;
    file.objects = visionResult.objects;
    file.faces = visionResult.faces;

    // Generate searchable text
    file.processingProgress = { step: 'Generating searchable text...', percentage: 80 };
    await file.save();

    const searchableTextResult = await aiService.generateSearchableText(file);
    file.searchableText = searchableTextResult.text;
    file.keywords = searchableTextResult.keywords;

    // Generate embedding
    file.processingProgress = { step: 'Generating embeddings...', percentage: 90 };
    await file.save();

    const embedding = await aiService.generateEmbedding(file.searchableText);
    file.embedding = embedding;

    // Mark as completed
    file.status = 'completed';
    file.processingProgress = { step: 'Completed!', percentage: 100 };
    await file.save();

    console.log('AI processing completed for file:', fileId);
  } catch (error) {
    console.error('Error in AI processing for file:', fileId, error);
    
    // Update file status to failed
    try {
      const file = await File.findById(fileId);
      if (file) {
        file.status = 'failed';
        file.processingProgress = { step: 'Processing failed', percentage: 0 };
        await file.save();
      }
    } catch (updateError) {
      console.error('Error updating file status to failed:', updateError);
    }
  }
}

module.exports = router;
