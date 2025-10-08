const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const File = require('../models/File');
const Story = require('../models/Story');
const aiService = require('../services/aiService');
const cloudinaryService = require('../services/cloudinaryService');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Get multer middleware
const upload = cloudinaryService.getMulterMiddleware();

// Upload single file
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    console.log('📁 Processing file upload:', req.file.originalname);

    // Create file record (multer-storage-cloudinary provides cloud URL in req.file.path)
    const file = new File({
      userId: req.user._id,
      originalName: req.file.originalname,
      fileName: req.file.filename, // cloudinary public_id
      filePath: req.file.path,     // cloud URL
      fileUrl: req.file.path,      // store URL as fileUrl
      fileType: req.file.mimetype.startsWith('video') ? 'video' : 
                req.file.mimetype.startsWith('image') ? 'image' : 'audio',
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      status: 'processing'
    });

    await file.save();

    // Start AI processing in background
    processFileAI(file._id).catch(console.error);

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: file._id,
        originalName: file.originalName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        status: file.status,
        url: file.fileUrl
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      message: 'Upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Upload multiple files
router.post('/upload-multiple', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: 'No files uploaded',
        code: 'NO_FILES'
      });
    }

    console.log(`📁 Processing ${req.files.length} file uploads`);

    const files = [];
    
    for (const uploadedFile of req.files) {
      const file = new File({
        userId: req.user._id,
        originalName: uploadedFile.originalname,
        fileName: uploadedFile.filename,
        filePath: uploadedFile.path,
        fileUrl: uploadedFile.path,
        fileType: uploadedFile.mimetype.startsWith('video') ? 'video' : 
                  uploadedFile.mimetype.startsWith('image') ? 'image' : 'audio',
        mimeType: uploadedFile.mimetype,
        fileSize: uploadedFile.size,
        status: 'processing'
      });

      await file.save();
      files.push(file);

      // Start AI processing in background
      processFileAI(file._id).catch(console.error);
    }

    res.status(201).json({
      message: `${files.length} files uploaded successfully`,
      files: files.map(file => ({
        id: file._id,
        originalName: file.originalName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        status: file.status,
        url: file.fileUrl
      }))
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      message: 'Upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user's files
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, search } = req.query;
    
    const query = { userId: req.user._id };
    
    if (type) query.fileType = type;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { searchableText: { $regex: search, $options: 'i' } },
        { 'visionTags.tag': { $regex: search, $options: 'i' } }
      ];
    }

    const files = await File.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-filePath -processingHistory');

    const total = await File.countDocuments(query);

    res.json({
      files,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      message: 'Failed to get files',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get single file
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).select('-filePath');

    if (!file) {
      return res.status(404).json({
        message: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    res.json({ file });

  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      message: 'Failed to get file',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete file
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!file) {
      return res.status(404).json({
        message: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Delete from Cloudinary
    await cloudinaryService.deleteFile(file.fileName);

    // Delete from database
    await File.findByIdAndDelete(file._id);

    res.json({
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      message: 'Failed to delete file',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Search files with AI-powered semantic search
router.post('/search', authenticateToken, [
  body('query').notEmpty().withMessage('Search query is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { query, type, limit = 20 } = req.body;
    console.log(`🔍 Starting AI-powered search for: "${query}"`);

    // First, try AI-powered semantic search
    try {
      // Generate embedding for the search query
      const queryEmbedding = await aiService.generateSearchEmbedding(query);
      
      if (queryEmbedding && queryEmbedding.length > 0) {
        console.log('🤖 Using AI semantic search...');
        
        // Get all user files with embeddings
        const baseQuery = { userId: req.user._id, status: 'completed' };
        if (type) baseQuery.fileType = type;
        
        const allFiles = await File.find(baseQuery)
          .select('-filePath')
          .lean();

        // Filter files that have embeddings
        const filesWithEmbeddings = allFiles.filter(file => file.embedding && file.embedding.length > 0);
        
        if (filesWithEmbeddings.length > 0) {
          console.log(`🤖 Found ${filesWithEmbeddings.length} files with embeddings for semantic search`);
          
          // Calculate similarity scores
          const filesWithScores = filesWithEmbeddings.map(file => {
            const similarity = aiService.calculateCosineSimilarity(queryEmbedding, file.embedding);
            return {
              ...file,
              similarity
            };
          });

          // Sort by similarity score (highest first) and filter by minimum threshold
          const threshold = 0.2; // Lowered threshold for better results
          const semanticResults = filesWithScores
            .filter(file => file.similarity >= threshold)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);

          console.log(`🤖 AI search found ${semanticResults.length} semantically similar results`);
          
          if (semanticResults.length > 0) {
            return res.json({
              query,
              results: semanticResults,
              count: semanticResults.length,
              searchType: 'ai_semantic'
            });
          }
        } else {
          console.log('⚠️ No files with embeddings found, falling back to text search');
        }
      } else {
        console.log('⚠️ Could not generate query embedding, falling back to text search');
      }
    } catch (aiError) {
      console.log('⚠️ AI search failed, falling back to text search:', aiError.message);
    }

    // Fallback to enhanced text-based search
    console.log('📝 Using enhanced text search as fallback...');
    
    const searchQuery = {
      userId: req.user._id,
      status: 'completed',
      $or: [
        { originalName: { $regex: query, $options: 'i' } },
        { searchableText: { $regex: query, $options: 'i' } },
        { aiDescription: { $regex: query, $options: 'i' } },
        { 'visionTags.tag': { $regex: query, $options: 'i' } },
        { 'transcription.text': { $regex: query, $options: 'i' } },
        { keywords: { $regex: query, $options: 'i' } },
        { categories: { $regex: query, $options: 'i' } }
      ]
    };

    if (type) {
      searchQuery.fileType = type;
    }

    let files = await File.find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-filePath');

    // If no results found, try a broader search including processing files
    if (files.length === 0) {
      console.log('🔍 No completed files found, trying broader search...');
      const broaderSearchQuery = {
        userId: req.user._id,
        $or: [
          { originalName: { $regex: query, $options: 'i' } },
          { searchableText: { $regex: query, $options: 'i' } },
          { aiDescription: { $regex: query, $options: 'i' } },
          { 'visionTags.tag': { $regex: query, $options: 'i' } },
          { 'transcription.text': { $regex: query, $options: 'i' } },
          { keywords: { $regex: query, $options: 'i' } },
          { categories: { $regex: query, $options: 'i' } }
        ]
      };
      
      if (type) {
        broaderSearchQuery.fileType = type;
      }
      
      files = await File.find(broaderSearchQuery)
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('-filePath');
    }

    console.log(`📝 Text search for "${query}" found ${files.length} results`);

    res.json({
      query,
      results: files,
      count: files.length,
      searchType: 'text_fallback'
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get file processing status
router.get('/:id/status', authenticateToken, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).select('status processingProgress processingHistory');

    if (!file) {
      return res.status(404).json({
        message: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    res.json({
      status: file.status,
      progress: file.processingProgress,
      history: file.processingHistory
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      message: 'Failed to get status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get enhanced transcription details
router.get('/:id/transcription', authenticateToken, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).select('transcription fileType originalName');

    if (!file) {
      return res.status(404).json({
        message: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    if (!file.transcription || !file.transcription.text) {
      return res.status(404).json({
        message: 'No transcription available',
        code: 'NO_TRANSCRIPTION'
      });
    }

    res.json({
      transcription: {
        text: file.transcription.text,
        language: file.transcription.language,
        language_probability: file.transcription.language_probability,
        duration: file.transcription.duration,
        segments: file.transcription.segments,
        words: file.transcription.words,
        quality_metrics: file.transcription.quality_metrics
      },
      file: {
        id: file._id,
        originalName: file.originalName,
        fileType: file.fileType
      }
    });

  } catch (error) {
    console.error('Get transcription error:', error);
    res.status(500).json({
      message: 'Failed to get transcription',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update file metadata (tags, description, etc.)
router.put('/:id/metadata', authenticateToken, [
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description too long'),
  body('categories').optional().isArray().withMessage('Categories must be an array'),
  body('keywords').optional().isArray().withMessage('Keywords must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { tags, description, categories, keywords } = req.body;

    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!file) {
      return res.status(404).json({
        message: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Update metadata
    if (tags !== undefined) {
      file.visionTags = tags.map(tag => ({ 
        tag: tag, 
        confidence: 1.0,
        category: 'user_defined'
      }));
    }

    if (description !== undefined) {
      file.aiDescription = description;
    }

    if (categories !== undefined) {
      file.categories = categories;
    }

    if (keywords !== undefined) {
      file.keywords = keywords;
    }

    // Regenerate searchable text with updated metadata
    file.searchableText = aiService.generateSearchableText(file);

    await file.save();

    console.log('✅ File metadata updated successfully');

    res.json({
      message: 'File metadata updated successfully',
      file: {
        id: file._id,
        originalName: file.originalName,
        visionTags: file.visionTags,
        aiDescription: file.aiDescription,
        categories: file.categories,
        keywords: file.keywords,
        searchableText: file.searchableText
      }
    });

  } catch (error) {
    console.error('Update file metadata error:', error);
    res.status(500).json({
      message: 'Failed to update file metadata',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Batch update multiple files metadata
router.put('/batch/metadata', authenticateToken, [
  body('files').isArray({ min: 1 }).withMessage('Files array is required'),
  body('files.*.id').isMongoId().withMessage('Invalid file ID'),
  body('files.*.tags').optional().isArray(),
  body('files.*.description').optional().isLength({ max: 1000 }),
  body('files.*.categories').optional().isArray(),
  body('files.*.keywords').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { files } = req.body;
    const fileIds = files.map(f => f.id);

    // Get all files that belong to the user
    const userFiles = await File.find({
      _id: { $in: fileIds },
      userId: req.user._id
    });

    if (userFiles.length !== fileIds.length) {
      return res.status(400).json({
        message: 'Some files not found or do not belong to user',
        code: 'INVALID_FILES'
      });
    }

    const updatedFiles = [];

    // Update each file
    for (const fileUpdate of files) {
      const file = userFiles.find(f => f._id.toString() === fileUpdate.id);
      
      if (fileUpdate.tags !== undefined) {
        file.visionTags = fileUpdate.tags.map(tag => ({ 
          tag: tag, 
          confidence: 1.0,
          category: 'user_defined'
        }));
      }

      if (fileUpdate.description !== undefined) {
        file.aiDescription = fileUpdate.description;
      }

      if (fileUpdate.categories !== undefined) {
        file.categories = fileUpdate.categories;
      }

      if (fileUpdate.keywords !== undefined) {
        file.keywords = fileUpdate.keywords;
      }

      // Regenerate searchable text
      file.searchableText = aiService.generateSearchableText(file);
      
      await file.save();
      updatedFiles.push({
        id: file._id,
        originalName: file.originalName,
        visionTags: file.visionTags,
        aiDescription: file.aiDescription,
        categories: file.categories,
        keywords: file.keywords
      });
    }

    console.log(`✅ Batch updated ${updatedFiles.length} files metadata`);

    res.json({
      message: `Successfully updated ${updatedFiles.length} files`,
      files: updatedFiles
    });

  } catch (error) {
    console.error('Batch update file metadata error:', error);
    res.status(500).json({
      message: 'Failed to batch update file metadata',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get file editing history
router.get('/:id/history', authenticateToken, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).select('processingHistory originalName createdAt updatedAt');

    if (!file) {
      return res.status(404).json({
        message: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    res.json({
      file: {
        id: file._id,
        originalName: file.originalName,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      },
      history: file.processingHistory
    });

  } catch (error) {
    console.error('Get file history error:', error);
    res.status(500).json({
      message: 'Failed to get file history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Debug endpoint to check search readiness
router.get('/debug/search-readiness', authenticateToken, async (req, res) => {
  try {
    const files = await File.find({ userId: req.user._id })
      .select('originalName status embedding aiDescription transcription searchableText processingProgress')
      .lean();

    const stats = {
      totalFiles: files.length,
      completedFiles: files.filter(f => f.status === 'completed').length,
      filesWithEmbeddings: files.filter(f => f.embedding && f.embedding.length > 0).length,
      filesWithTranscription: files.filter(f => f.transcription && f.transcription.text).length,
      filesWithDescription: files.filter(f => f.aiDescription).length,
      filesWithSearchableText: files.filter(f => f.searchableText).length,
      processingFiles: files.filter(f => f.status === 'processing').length,
      failedFiles: files.filter(f => f.status === 'failed').length
    };

    // Sample of files for debugging
    const sampleFiles = files.slice(0, 5).map(file => ({
      id: file._id,
      originalName: file.originalName,
      status: file.status,
      hasEmbedding: !!(file.embedding && file.embedding.length > 0),
      hasTranscription: !!(file.transcription && file.transcription.text),
      hasDescription: !!file.aiDescription,
      hasSearchableText: !!file.searchableText,
      searchableTextPreview: file.searchableText ? file.searchableText.substring(0, 100) + '...' : null
    }));

    res.json({
      message: 'Search readiness debug info',
      stats,
      sampleFiles,
      recommendations: {
        needMoreFiles: stats.totalFiles === 0 ? 'Upload some files first' : null,
        needProcessing: stats.processingFiles > 0 ? `${stats.processingFiles} files still processing` : null,
        needEmbeddings: stats.filesWithEmbeddings === 0 ? 'No files have embeddings yet - they will be generated during processing' : null,
        readyForSearch: stats.filesWithEmbeddings > 0 || stats.completedFiles > 0 ? 'Search should work with text fallback' : 'Need completed files first'
      }
    });

  } catch (error) {
    console.error('Debug search readiness error:', error);
    res.status(500).json({
      message: 'Failed to get debug info',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Reprocess files to generate embeddings
router.post('/reprocess-embeddings', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 Starting embedding reprocessing for user:', req.user._id);
    
    // Find completed files without embeddings
    const filesNeedingEmbeddings = await File.find({
      userId: req.user._id,
      status: 'completed',
      $or: [
        { embedding: { $exists: false } },
        { embedding: { $size: 0 } },
        { embedding: null }
      ]
    });

    console.log(`📊 Found ${filesNeedingEmbeddings.length} files needing embeddings`);

    if (filesNeedingEmbeddings.length === 0) {
      return res.json({
        message: 'All files already have embeddings',
        processed: 0,
        total: 0
      });
    }

    // Process files in batches to avoid rate limits
    const batchSize = 3;
    let processed = 0;

    for (let i = 0; i < filesNeedingEmbeddings.length; i += batchSize) {
      const batch = filesNeedingEmbeddings.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (file) => {
        try {
          console.log(`🔍 Processing embeddings for: ${file.originalName}`);
          
          // Generate embedding for the file's searchable text
          if (file.searchableText) {
            const embedding = await aiService.generateEmbedding(file.searchableText);
            if (embedding && embedding.length > 0) {
              file.embedding = embedding;
              await file.save();
              processed++;
              console.log(`✅ Generated embedding for: ${file.originalName}`);
            } else {
              console.log(`⚠️ Failed to generate embedding for: ${file.originalName}`);
            }
          } else {
            console.log(`⚠️ No searchable text for: ${file.originalName}`);
          }
        } catch (error) {
          console.error(`❌ Error processing ${file.originalName}:`, error.message);
        }
      }));

      // Wait between batches to avoid rate limits
      if (i + batchSize < filesNeedingEmbeddings.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`✅ Embedding reprocessing completed. Processed: ${processed}/${filesNeedingEmbeddings.length}`);

    res.json({
      message: 'Embedding reprocessing completed',
      processed,
      total: filesNeedingEmbeddings.length
    });

  } catch (error) {
    console.error('Reprocess embeddings error:', error);
    res.status(500).json({
      message: 'Failed to reprocess embeddings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Background AI processing function
async function processFileAI(fileId) {
  try {
    const file = await File.findById(fileId);
    if (!file) return;

    console.log(`🤖 Starting AI processing for: ${file.originalName}`);

    // Update status to processing
    file.status = 'processing';
    file.processingProgress = 10;
    await file.save();

    // Step 1: Get file info
    await file.updateProcessingStatus('file_info', 'processing');
    // Detect correct resource type for Cloudinary lookup
    const resourceType = file.fileType === 'video' ? 'video' : (file.fileType === 'image' ? 'image' : 'raw');
    const fileInfo = await cloudinaryService.getFileInfo(file.fileName, resourceType);
    
    if (fileInfo.duration) {
      file.duration = fileInfo.duration;
    }
    
    if (fileInfo.width && fileInfo.height) {
      file.dimensions = {
        width: fileInfo.width,
        height: fileInfo.height
      };
    }
    
    file.processingProgress = 20;
    await file.save();
    await file.updateProcessingStatus('file_info', 'completed');

    // Step 2: Generate thumbnail (for image/video)
    if (file.fileType === 'image' || file.fileType === 'video') {
      await file.updateProcessingStatus('thumbnail', 'processing');
      file.processingProgress = 30;
      await file.save();

      try {
        let thumbnailUrl;
        if (file.fileType === 'image') {
          // For images, create a thumbnail using Cloudinary
          thumbnailUrl = await cloudinaryService.generateThumbnail(file.fileName, 'image');
        } else if (file.fileType === 'video') {
          // For videos, extract a frame as thumbnail
          thumbnailUrl = await cloudinaryService.generateVideoThumbnail(file.fileName);
        }
        
        if (thumbnailUrl) {
          file.thumbnailUrl = thumbnailUrl;
          file.processingProgress = 40;
          await file.save();
          await file.updateProcessingStatus('thumbnail', 'completed');
        } else {
          await file.updateProcessingStatus('thumbnail', 'failed', 'thumbnail generation failed');
        }
      } catch (error) {
        console.error('Thumbnail generation error:', error);
        await file.updateProcessingStatus('thumbnail', 'failed', error.message);
      }
    }

    // Step 3: Transcription (for video/audio)
    if (file.fileType === 'video' || file.fileType === 'audio') {
      await file.updateProcessingStatus('transcription', 'processing');
      file.processingProgress = 50;
      await file.save();

      try {
        const transcription = await aiService.transcribeAudio(file.filePath);
        file.transcription = transcription;
        file.processingProgress = 60;
        await file.save();
        await file.updateProcessingStatus('transcription', 'completed');
      } catch (error) {
        console.error('Transcription error:', error);
        await file.updateProcessingStatus('transcription', 'failed', error.message);
      }
    }

    // Step 4: Visual analysis (for image/video)
    if (file.fileType === 'image' || file.fileType === 'video') {
      await file.updateProcessingStatus('vision_analysis', 'processing');
      file.processingProgress = file.fileType === 'video' ? 70 : 50;
      await file.save();

      try {
        const analysis = await aiService.analyzeVisualContent(file.filePath, file.fileType);
        
        // Map AI response to database schema
        file.visionTags = (analysis.objects || []).map(obj => ({
          tag: obj.object,
          confidence: obj.confidence,
          category: 'ai_detected'
        }));
        
        file.aiDescription = analysis.description;
        
        // Store emotions with confidence filtering (only high-confidence emotions)
        file.emotions = (analysis.emotions || [])
          .filter(emotion => emotion.confidence > 0.6) // Only emotions with >60% confidence
          .map(emotion => ({
            emotion: emotion.emotion,
            confidence: emotion.confidence
          }));
        file.objects = analysis.objects || [];
        file.faces = analysis.faces || [];
        file.processingProgress = file.fileType === 'video' ? 80 : 70;
        await file.save();
        await file.updateProcessingStatus('vision_analysis', 'completed');
      } catch (error) {
        console.error('Vision analysis error:', error);
        await file.updateProcessingStatus('vision_analysis', 'failed', error.message);
      }
    }

    // Step 5: Generate searchable text and keywords
    await file.updateProcessingStatus('text_processing', 'processing');
    file.searchableText = aiService.generateSearchableText(file);
    file.keywords = [
      ...(file.visionTags?.map(t => t.tag) || []),
      ...(file.transcription?.text?.split(' ').slice(0, 10) || [])
    ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

    file.processingProgress = 85;
    await file.save();
    await file.updateProcessingStatus('text_processing', 'completed');

    // Step 6: Generate embedding for semantic search
    try {
      await file.updateProcessingStatus('embedding', 'processing');
      console.log('🔍 Generating embedding for searchable text:', file.searchableText.substring(0, 100) + '...');
      
      const embedding = await aiService.generateEmbedding(file.searchableText);
      if (embedding && embedding.length > 0) {
        file.embedding = embedding;
        console.log('✅ Embedding generated successfully, length:', embedding.length);
        await file.updateProcessingStatus('embedding', 'completed');
      } else {
        console.log('⚠️ Embedding generation returned null/empty, using fallback');
        await file.updateProcessingStatus('embedding', 'failed', 'embedding skipped due to rate limit or API issue');
      }
    } catch (error) {
      console.error('❌ Embedding error:', error);
      await file.updateProcessingStatus('embedding', 'failed', error.message);
    }

    // Complete processing
    file.status = 'completed';
    file.processingProgress = 100;
    await file.save();
    await file.updateProcessingStatus('complete', 'completed');

    console.log(`✅ AI processing completed for: ${file.originalName}`);

  } catch (error) {
    console.error('AI processing error:', error);
    
    try {
      const file = await File.findById(fileId);
      if (file) {
        file.status = 'failed';
        await file.updateProcessingStatus('error', 'failed', error.message);
        await file.save();
      }
    } catch (saveError) {
      console.error('Error saving failed status:', saveError);
    }
  }
}

module.exports = router;
