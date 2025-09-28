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
      .select('-filePath');

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

// Search files
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

    const searchQuery = {
      userId: req.user._id,
      status: 'completed',
      $or: [
        { originalName: { $regex: query, $options: 'i' } },
        { searchableText: { $regex: query, $options: 'i' } },
        { 'visionTags.tag': { $regex: query, $options: 'i' } },
        { 'transcription.text': { $regex: query, $options: 'i' } }
      ]
    };

    if (type) {
      searchQuery.fileType = type;
    }

    const files = await File.find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-filePath');

    res.json({
      query,
      results: files,
      count: files.length
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

    // Step 2: Transcription (for video/audio)
    if (file.fileType === 'video' || file.fileType === 'audio') {
      await file.updateProcessingStatus('transcription', 'processing');
      file.processingProgress = 30;
      await file.save();

      try {
        const transcription = await aiService.transcribeAudio(file.filePath);
        file.transcription = transcription;
        file.processingProgress = 50;
        await file.save();
        await file.updateProcessingStatus('transcription', 'completed');
      } catch (error) {
        console.error('Transcription error:', error);
        await file.updateProcessingStatus('transcription', 'failed', error.message);
      }
    }

    // Step 3: Visual analysis (for image/video)
    if (file.fileType === 'image' || file.fileType === 'video') {
      await file.updateProcessingStatus('vision_analysis', 'processing');
      file.processingProgress = file.fileType === 'video' ? 60 : 40;
      await file.save();

      try {
        const analysis = await aiService.analyzeVisualContent(file.filePath, file.fileType);
        file.visionTags = analysis.objects || [];
        file.aiDescription = analysis.description;
        file.emotions = analysis.emotions || [];
        file.objects = analysis.objects || [];
        file.faces = analysis.faces || [];
        file.processingProgress = file.fileType === 'video' ? 80 : 60;
        await file.save();
        await file.updateProcessingStatus('vision_analysis', 'completed');
      } catch (error) {
        console.error('Vision analysis error:', error);
        await file.updateProcessingStatus('vision_analysis', 'failed', error.message);
      }
    }

    // Step 4: Generate searchable text and keywords
    await file.updateProcessingStatus('text_processing', 'processing');
    file.searchableText = aiService.generateSearchableText(file);
    file.keywords = [
      ...(file.visionTags?.map(t => t.tag) || []),
      ...(file.transcription?.text?.split(' ').slice(0, 10) || [])
    ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

    file.processingProgress = 90;
    await file.save();
    await file.updateProcessingStatus('text_processing', 'completed');

    // Step 5: Generate embedding for semantic search
    try {
      await file.updateProcessingStatus('embedding', 'processing');
      const embedding = await aiService.generateEmbedding(file.searchableText);
      if (embedding) {
        file.embedding = embedding;
        await file.updateProcessingStatus('embedding', 'completed');
      } else {
        await file.updateProcessingStatus('embedding', 'failed', 'embedding skipped due to rate limit');
      }
    } catch (error) {
      console.error('Embedding error:', error);
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
