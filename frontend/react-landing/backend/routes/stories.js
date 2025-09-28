const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Story = require('../models/Story');
const File = require('../models/File');
const aiService = require('../services/aiService');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

const router = express.Router();
const Usage = require('../models/Usage');

// Create a new story
router.post('/create', authenticateToken, [
  body('title').notEmpty().withMessage('Title is required'),
  body('prompt').notEmpty().withMessage('Prompt is required'),
  body('fileIds').isArray({ min: 1 }).withMessage('At least one file is required'),
  body('theme').optional().isIn(['happy', 'adventure', 'family', 'friends', 'travel', 'celebration', 'achievement', 'love', 'custom']),
  body('mood').optional().isIn(['uplifting', 'nostalgic', 'exciting', 'peaceful', 'romantic', 'inspiring', 'funny', 'dramatic'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, prompt, fileIds, theme = 'custom', mood = 'uplifting', description } = req.body;

    console.log('📖 Creating new story:', title);

    // Get files with AI processing completed
    const files = await File.find({
      _id: { $in: fileIds },
      userId: req.user._id,
      status: 'completed'
    });

    if (files.length === 0) {
      return res.status(400).json({
        message: 'No processed files found',
        code: 'NO_PROCESSED_FILES'
      });
    }

    // Generate story using AI
    const storyResult = await aiService.generateStory(files, prompt, {
      theme,
      mood,
      maxTokens: 1000,
      temperature: 0.7
    });

    // Create story record
    const story = new Story({
      userId: req.user._id,
      title,
      description,
      prompt,
      content: storyResult.content,
      files: fileIds.map((fileId, index) => ({
        fileId,
        order: index
      })),
      theme,
      mood,
      wordCount: storyResult.wordCount,
      aiModel: storyResult.model,
      generationSettings: {
        temperature: 0.7,
        maxTokens: 1000,
        style: 'narrative'
      },
      tags: extractTagsFromContent(storyResult.content),
      categories: [theme, mood]
    });

    await story.save();

    // Populate file details for response
    await story.populate('files.fileId', 'originalName fileType fileUrl thumbnailUrl');

    console.log('✅ Story created successfully');

    res.status(201).json({
      message: 'Story created successfully',
      story: {
        id: story._id,
        title: story.title,
        description: story.description,
        content: story.content,
        theme: story.theme,
        mood: story.mood,
        wordCount: story.wordCount,
        readingTime: story.estimatedReadingTime,
        files: story.files,
        createdAt: story.createdAt
      }
    });

  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({
      message: 'Failed to create story',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user's stories
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, theme, mood, search } = req.query;
    
    const query = { userId: req.user._id };
    
    if (theme) query.theme = theme;
    if (mood) query.mood = mood;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const stories = await Story.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('files.fileId', 'originalName fileType fileUrl thumbnailUrl')
      .select('-content'); // Don't send full content in list view

    const total = await Story.countDocuments(query);

    res.json({
      stories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({
      message: 'Failed to get stories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get single story
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const story = await Story.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('files.fileId', 'originalName fileType fileUrl thumbnailUrl aiDescription transcription');

    if (!story) {
      return res.status(404).json({
        message: 'Story not found',
        code: 'STORY_NOT_FOUND'
      });
    }

    // Increment views
    await story.incrementViews();

    res.json({ story });

  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({
      message: 'Failed to get story',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update story
router.put('/:id', authenticateToken, [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description too long'),
  body('theme').optional().isIn(['happy', 'adventure', 'family', 'friends', 'travel', 'celebration', 'achievement', 'love', 'custom']),
  body('mood').optional().isIn(['uplifting', 'nostalgic', 'exciting', 'peaceful', 'romantic', 'inspiring', 'funny', 'dramatic'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const story = await Story.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!story) {
      return res.status(404).json({
        message: 'Story not found',
        code: 'STORY_NOT_FOUND'
      });
    }

    const { title, description, theme, mood, isPublic } = req.body;
    const changes = [];

    if (title && title !== story.title) {
      changes.push(`Title changed from "${story.title}" to "${title}"`);
      story.title = title;
    }

    if (description !== undefined && description !== story.description) {
      changes.push('Description updated');
      story.description = description;
    }

    if (theme && theme !== story.theme) {
      changes.push(`Theme changed from "${story.theme}" to "${theme}"`);
      story.theme = theme;
    }

    if (mood && mood !== story.mood) {
      changes.push(`Mood changed from "${story.mood}" to "${mood}"`);
      story.mood = mood;
    }

    if (isPublic !== undefined && isPublic !== story.isPublic) {
      changes.push(`Visibility changed to ${isPublic ? 'public' : 'private'}`);
      story.isPublic = isPublic;
    }

    if (changes.length > 0) {
      story.version += 1;
      story.previousVersions.push({
        content: story.content,
        createdAt: new Date(),
        changes: changes.join(', ')
      });
    }

    await story.save();

    res.json({
      message: 'Story updated successfully',
      story: {
        id: story._id,
        title: story.title,
        description: story.description,
        theme: story.theme,
        mood: story.mood,
        isPublic: story.isPublic,
        version: story.version,
        updatedAt: story.updatedAt
      }
    });

  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({
      message: 'Failed to update story',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Regenerate story content
router.post('/:id/regenerate', authenticateToken, [
  body('prompt').optional().isLength({ min: 10 }).withMessage('Prompt too short'),
  body('theme').optional().isIn(['happy', 'adventure', 'family', 'friends', 'travel', 'celebration', 'achievement', 'love', 'custom']),
  body('mood').optional().isIn(['uplifting', 'nostalgic', 'exciting', 'peaceful', 'romantic', 'inspiring', 'funny', 'dramatic'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const story = await Story.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('files.fileId');

    if (!story) {
      return res.status(404).json({
        message: 'Story not found',
        code: 'STORY_NOT_FOUND'
      });
    }

    const { prompt = story.prompt, theme = story.theme, mood = story.mood } = req.body;

    console.log('🔄 Regenerating story:', story.title);

    // Get files
    const files = story.files.map(f => f.fileId).filter(f => f.status === 'completed');

    if (files.length === 0) {
      return res.status(400).json({
        message: 'No processed files available for regeneration',
        code: 'NO_PROCESSED_FILES'
      });
    }

    // Generate new story
    const storyResult = await aiService.generateStory(files, prompt, {
      theme,
      mood,
      maxTokens: 1000,
      temperature: 0.7
    });

    // Save previous version
    story.previousVersions.push({
      content: story.content,
      createdAt: new Date(),
      changes: 'Content regenerated'
    });

    // Update story
    story.content = storyResult.content;
    story.prompt = prompt;
    story.theme = theme;
    story.mood = mood;
    story.wordCount = storyResult.wordCount;
    story.version += 1;
    story.tags = extractTagsFromContent(storyResult.content);
    story.categories = [theme, mood];

    await story.save();

    console.log('✅ Story regenerated successfully');

    res.json({
      message: 'Story regenerated successfully',
      story: {
        id: story._id,
        title: story.title,
        content: story.content,
        theme: story.theme,
        mood: story.mood,
        wordCount: story.wordCount,
        version: story.version,
        updatedAt: story.updatedAt
      }
    });

  } catch (error) {
    console.error('Regenerate story error:', error);
    res.status(500).json({
      message: 'Failed to regenerate story',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete story
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const story = await Story.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!story) {
      return res.status(404).json({
        message: 'Story not found',
        code: 'STORY_NOT_FOUND'
      });
    }

    await Story.findByIdAndDelete(story._id);

    res.json({
      message: 'Story deleted successfully'
    });

  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({
      message: 'Failed to delete story',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Share story (make public and generate share token)
router.post('/:id/share', authenticateToken, async (req, res) => {
  try {
    const story = await Story.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!story) {
      return res.status(404).json({
        message: 'Story not found',
        code: 'STORY_NOT_FOUND'
      });
    }

    // Generate share token if not exists
    if (!story.shareToken) {
      await story.generateShareToken();
    }

    // Make story public
    story.isPublic = true;
    await story.save();

    const shareUrl = `${process.env.FRONTEND_URL}/story/${story.shareToken}`;

    res.json({
      message: 'Story shared successfully',
      shareUrl,
      shareToken: story.shareToken
    });

  } catch (error) {
    console.error('Share story error:', error);
    res.status(500).json({
      message: 'Failed to share story',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get public story by share token
router.get('/public/:shareToken', async (req, res) => {
  try {
    const story = await Story.findOne({
      shareToken: req.params.shareToken,
      isPublic: true
    }).populate('files.fileId', 'originalName fileType fileUrl thumbnailUrl')
      .populate('userId', 'name avatar');

    if (!story) {
      return res.status(404).json({
        message: 'Story not found or not public',
        code: 'STORY_NOT_FOUND'
      });
    }

    // Increment views
    await story.incrementViews();

    res.json({ story });

  } catch (error) {
    console.error('Get public story error:', error);
    res.status(500).json({
      message: 'Failed to get story',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get story templates
router.get('/templates/list', authenticateToken, async (req, res) => {
  try {
    const templates = [
      {
        id: 'family-moments',
        title: 'Family Moments',
        description: 'Celebrate precious family memories',
        theme: 'family',
        mood: 'nostalgic',
        prompt: 'Create a heartwarming story about family moments, focusing on love, connection, and shared experiences.',
        icon: '👨‍👩‍👧‍👦'
      },
      {
        id: 'adventure-time',
        title: 'Adventure Time',
        description: 'Capture exciting adventures and travels',
        theme: 'adventure',
        mood: 'exciting',
        prompt: 'Write an exciting story about adventures and travels, highlighting discovery, courage, and new experiences.',
        icon: '🗺️'
      },
      {
        id: 'celebration-joy',
        title: 'Celebration Joy',
        description: 'Document special celebrations and achievements',
        theme: 'celebration',
        mood: 'uplifting',
        prompt: 'Create an uplifting story about celebrations and achievements, emphasizing joy, success, and milestones.',
        icon: '🎉'
      },
      {
        id: 'friendship-bonds',
        title: 'Friendship Bonds',
        description: 'Honor meaningful friendships and connections',
        theme: 'friends',
        mood: 'inspiring',
        prompt: 'Write an inspiring story about friendship and connection, focusing on loyalty, support, and shared memories.',
        icon: '👫'
      },
      {
        id: 'love-story',
        title: 'Love Story',
        description: 'Romantic moments and relationships',
        theme: 'love',
        mood: 'romantic',
        prompt: 'Create a romantic story about love and relationships, highlighting intimacy, connection, and special moments.',
        icon: '💕'
      },
      {
        id: 'personal-growth',
        title: 'Personal Growth',
        description: 'Journey of self-discovery and achievement',
        theme: 'achievement',
        mood: 'inspiring',
        prompt: 'Write an inspiring story about personal growth and achievement, emphasizing transformation, learning, and success.',
        icon: '🌟'
      }
    ];

    res.json({ templates });

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      message: 'Failed to get templates',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get popular public stories
router.get('/public/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const stories = await Story.getPopularStories(parseInt(limit));

    res.json({ stories });

  } catch (error) {
    console.error('Get popular stories error:', error);
    res.status(500).json({
      message: 'Failed to get popular stories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Search public stories
router.post('/public/search', [
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

    const { query, theme, mood, limit = 20 } = req.body;

    const stories = await Story.searchStories(query, { theme, mood, limit });

    res.json({
      query,
      results: stories,
      count: stories.length
    });

  } catch (error) {
    console.error('Search public stories error:', error);
    res.status(500).json({
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get story statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const story = await Story.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).select('views likes createdAt updatedAt version');

    if (!story) {
      return res.status(404).json({
        message: 'Story not found',
        code: 'STORY_NOT_FOUND'
      });
    }

    const stats = {
      views: story.views,
      likes: story.likes,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      version: story.version,
      ageInDays: Math.floor((Date.now() - story.createdAt) / (1000 * 60 * 60 * 24))
    };

    res.json({ stats });

  } catch (error) {
    console.error('Get story stats error:', error);
    res.status(500).json({
      message: 'Failed to get story statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Generate animated film from story
router.post('/:id/generate-film', authenticateToken, [
  body('style').optional().isIn(['heartwarming', 'adventure', 'celebration', 'nostalgic', 'minimalist', 'cinematic']),
  body('duration').optional().isInt({ min: 15, max: 90 }),
  body('mood').optional().isLength({ min: 3, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const story = await Story.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!story) {
      return res.status(404).json({
        message: 'Story not found',
        code: 'STORY_NOT_FOUND'
      });
    }

    const { style = 'heartwarming', duration = 30, mood = 'uplifting' } = req.body;

    // Enforce daily generation cap per user
    const limit = parseInt(process.env.VIDEO_GEN_DAILY_LIMIT || '15');
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Find or create usage for today
    let usage = await Usage.findOne({ userId: req.user._id, date: { $gte: startOfDay, $lte: endOfDay } });
    if (!usage) {
      usage = await Usage.create({ userId: req.user._id, date: new Date(startOfDay), videoGenerations: 0 });
    }

    if (usage.videoGenerations >= limit) {
      return res.status(429).json({
        message: 'Daily video generation limit reached',
        code: 'DAILY_LIMIT_REACHED',
        limit,
        used: usage.videoGenerations
      });
    }

    console.log('🎬 Generating animated film for story:', story.title);

    // Initialize film generation
    story.animatedFilm = {
      status: 'generating',
      processingProgress: 0,
      style,
      duration,
      mood
    };
    await story.save();

    // Increment usage immediately to prevent racing multiple requests
    usage.videoGenerations += 1;
    await usage.save();

    // Start film generation in background
    generateAnimatedFilm(story._id, { style, duration, mood }).catch(console.error);

    res.json({
      message: 'Animated film generation started',
      film: {
        status: 'generating',
        progress: 0,
        style,
        duration,
        mood
      },
      usage: { used: usage.videoGenerations, limit }
    });

  } catch (error) {
    console.error('Generate film error:', error);
    res.status(500).json({
      message: 'Failed to start film generation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get animated film status
router.get('/:id/film-status', authenticateToken, async (req, res) => {
  try {
    const story = await Story.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).select('animatedFilm');

    if (!story) {
      return res.status(404).json({
        message: 'Story not found',
        code: 'STORY_NOT_FOUND'
      });
    }

    if (!story.animatedFilm) {
      return res.status(404).json({
        message: 'No animated film found',
        code: 'NO_FILM'
      });
    }

    res.json({
      film: story.animatedFilm
    });

  } catch (error) {
    console.error('Get film status error:', error);
    res.status(500).json({
      message: 'Failed to get film status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get available film styles
router.get('/film-styles/list', authenticateToken, async (req, res) => {
  try {
    const styles = aiService.getFilmStyles();
    const durations = aiService.getFilmDurations();

    res.json({
      styles,
      durations
    });

  } catch (error) {
    console.error('Get film styles error:', error);
    res.status(500).json({
      message: 'Failed to get film styles',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete animated film
router.delete('/:id/film', authenticateToken, async (req, res) => {
  try {
    const story = await Story.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!story) {
      return res.status(404).json({
        message: 'Story not found',
        code: 'STORY_NOT_FOUND'
      });
    }

    // Remove animated film data
    story.animatedFilm = undefined;
    await story.save();

    res.json({
      message: 'Animated film deleted successfully'
    });

  } catch (error) {
    console.error('Delete film error:', error);
    res.status(500).json({
      message: 'Failed to delete film',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update story content (inline editing)
router.put('/:id/content', authenticateToken, [
  body('content').notEmpty().withMessage('Content is required'),
  body('changes').optional().isLength({ max: 200 }).withMessage('Changes description too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { content, changes = 'Content manually edited' } = req.body;

    const story = await Story.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!story) {
      return res.status(404).json({
        message: 'Story not found',
        code: 'STORY_NOT_FOUND'
      });
    }

    // Create new version
    await story.createNewVersion(content, changes);

    console.log('✅ Story content updated successfully');

    res.json({
      message: 'Story content updated successfully',
      story: {
        id: story._id,
        content: story.content,
        wordCount: story.wordCount,
        version: story.version,
        updatedAt: story.updatedAt
      }
    });

  } catch (error) {
    console.error('Update story content error:', error);
    res.status(500).json({
      message: 'Failed to update story content',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update story structure (reorder files, add/remove files)
router.put('/:id/structure', authenticateToken, [
  body('files').isArray({ min: 1 }).withMessage('At least one file is required'),
  body('files.*.fileId').isMongoId().withMessage('Invalid file ID'),
  body('files.*.order').isInt({ min: 0 }).withMessage('Invalid file order')
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

    const story = await Story.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!story) {
      return res.status(404).json({
        message: 'Story not found',
        code: 'STORY_NOT_FOUND'
      });
    }

    // Validate that all files belong to the user
    const fileIds = files.map(f => f.fileId);
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

    // Update story structure
    story.files = files.map(file => ({
      fileId: file.fileId,
      order: file.order,
      timestamp: file.timestamp || null,
      caption: file.caption || null
    }));

    // Create new version
    story.previousVersions.push({
      content: story.content,
      createdAt: new Date(),
      changes: 'Story structure updated'
    });
    story.version += 1;

    await story.save();

    // Populate file details for response
    await story.populate('files.fileId', 'originalName fileType fileUrl thumbnailUrl');

    console.log('✅ Story structure updated successfully');

    res.json({
      message: 'Story structure updated successfully',
      story: {
        id: story._id,
        files: story.files,
        version: story.version,
        updatedAt: story.updatedAt
      }
    });

  } catch (error) {
    console.error('Update story structure error:', error);
    res.status(500).json({
      message: 'Failed to update story structure',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get story version history
router.get('/:id/versions', authenticateToken, async (req, res) => {
  try {
    const story = await Story.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).select('previousVersions version createdAt updatedAt');

    if (!story) {
      return res.status(404).json({
        message: 'Story not found',
        code: 'STORY_NOT_FOUND'
      });
    }

    const versions = [
      {
        version: story.version,
        content: story.content,
        createdAt: story.updatedAt,
        changes: 'Current version'
      },
      ...story.previousVersions.map(v => ({
        version: story.version - 1,
        content: v.content,
        createdAt: v.createdAt,
        changes: v.changes
      }))
    ].sort((a, b) => b.version - a.version);

    res.json({
      versions,
      currentVersion: story.version
    });

  } catch (error) {
    console.error('Get story versions error:', error);
    res.status(500).json({
      message: 'Failed to get story versions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Restore story to previous version
router.post('/:id/restore/:version', authenticateToken, async (req, res) => {
  try {
    const { version } = req.params;
    const targetVersion = parseInt(version);

    const story = await Story.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!story) {
      return res.status(404).json({
        message: 'Story not found',
        code: 'STORY_NOT_FOUND'
      });
    }

    if (targetVersion >= story.version) {
      return res.status(400).json({
        message: 'Cannot restore to current or future version',
        code: 'INVALID_VERSION'
      });
    }

    // Find the target version
    const versionIndex = story.version - 1 - targetVersion;
    if (versionIndex < 0 || versionIndex >= story.previousVersions.length) {
      return res.status(404).json({
        message: 'Version not found',
        code: 'VERSION_NOT_FOUND'
      });
    }

    const targetContent = story.previousVersions[versionIndex].content;

    // Create new version with restored content
    await story.createNewVersion(targetContent, `Restored to version ${targetVersion}`);

    console.log(`✅ Story restored to version ${targetVersion}`);

    res.json({
      message: `Story restored to version ${targetVersion}`,
      story: {
        id: story._id,
        content: story.content,
        version: story.version,
        updatedAt: story.updatedAt
      }
    });

  } catch (error) {
    console.error('Restore story version error:', error);
    res.status(500).json({
      message: 'Failed to restore story version',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Background animated film generation function
async function generateAnimatedFilm(storyId, options) {
  try {
    const story = await Story.findById(storyId);
    if (!story) return;

    console.log(`🎬 Starting animated film generation for: ${story.title}`);

    // Update progress
    story.animatedFilm.processingProgress = 10;
    await story.save();

    // Generate the film
    const filmResult = await aiService.generateAnimatedFilm(story, options);

    // Update story with film data
    story.animatedFilm = {
      ...story.animatedFilm,
      ...filmResult,
      status: 'completed',
      processingProgress: 100
    };

    await story.save();

    console.log(`✅ Animated film completed for: ${story.title}`);

  } catch (error) {
    console.error('Animated film generation error:', error);
    
    try {
      const story = await Story.findById(storyId);
      if (story && story.animatedFilm) {
        story.animatedFilm.status = 'failed';
        story.animatedFilm.processingProgress = 0;
        await story.save();
      }
    } catch (saveError) {
      console.error('Error saving failed film status:', saveError);
    }
  }
}

// Helper function to extract tags from content
function extractTagsFromContent(content) {
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use'];
  
  const wordCount = {};
  words.forEach(word => {
    if (!commonWords.includes(word)) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });
  
  return Object.keys(wordCount)
    .sort((a, b) => wordCount[b] - wordCount[a])
    .slice(0, 10);
}

module.exports = router;
