const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  prompt: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  // Files used in this story
  files: [{
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: true
    },
    order: Number,
    timestamp: String, // For video files
    caption: String
  }],
  // Story metadata
  theme: {
    type: String,
    enum: ['happy', 'adventure', 'family', 'friends', 'travel', 'celebration', 'achievement', 'love', 'custom'],
    default: 'custom'
  },
  mood: {
    type: String,
    enum: ['uplifting', 'nostalgic', 'exciting', 'peaceful', 'romantic', 'inspiring', 'funny', 'dramatic'],
    default: 'uplifting'
  },
  // AI Generation details
  aiModel: {
    type: String,
    default: 'gpt-4'
  },
  generationSettings: {
    temperature: {
      type: Number,
      default: 0.7
    },
    maxTokens: {
      type: Number,
      default: 2000
    },
    style: {
      type: String,
      default: 'narrative'
    }
  },
  // Story statistics
  wordCount: {
    type: Number,
    default: 0
  },
  readingTime: {
    type: Number, // in minutes
    default: 0
  },
  // Sharing and visibility
  isPublic: {
    type: Boolean,
    default: false
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  // Tags for organization
  tags: [String],
  categories: [String],
  // Export options
  exportFormats: [{
    format: {
      type: String,
      enum: ['pdf', 'docx', 'txt', 'html']
    },
    url: String,
    createdAt: Date
  }],
  // Animated Film
  animatedFilm: {
    videoUrl: String,
    thumbnailUrl: String,
    duration: Number,
    style: {
      type: String,
      enum: ['heartwarming', 'adventure', 'celebration', 'nostalgic', 'minimalist', 'cinematic']
    },
    mood: String,
    cost: Number,
    prompt: String,
    generatedAt: Date,
    status: {
      type: String,
      enum: ['generating', 'completed', 'failed'],
      default: 'generating'
    },
    processingProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  // Audio Generation
  audioGeneration: {
    audioUrl: String,
    duration: Number,
    voice: String,
    format: String,
    size: Number,
    status: {
      type: String,
      enum: ['generating', 'completed', 'failed'],
      default: 'generating'
    },
    processingProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    errorMessage: String,
    generatedAt: Date
  },
  // Version control
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    content: String,
    createdAt: Date,
    changes: String
  }]
}, {
  timestamps: true
});

// Indexes for better performance
storySchema.index({ userId: 1, createdAt: -1 });
storySchema.index({ isPublic: 1, createdAt: -1 });
storySchema.index({ shareToken: 1 });
storySchema.index({ tags: 1 });
storySchema.index({ theme: 1, mood: 1 });
storySchema.index({ title: 'text', content: 'text' });

// Virtual for reading time calculation
storySchema.virtual('estimatedReadingTime').get(function() {
  const wordsPerMinute = 200; // Average reading speed
  return Math.ceil(this.wordCount / wordsPerMinute);
});

// Method to generate share token
storySchema.methods.generateShareToken = function() {
  const crypto = require('crypto');
  this.shareToken = crypto.randomBytes(16).toString('hex');
  return this.save();
};

// Method to increment views
storySchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to add like
storySchema.methods.addLike = function() {
  this.likes += 1;
  return this.save();
};

// Method to remove like
storySchema.methods.removeLike = function() {
  if (this.likes > 0) {
    this.likes -= 1;
  }
  return this.save();
};

// Method to create new version
storySchema.methods.createNewVersion = function(newContent, changes) {
  // Save current version to history
  this.previousVersions.push({
    content: this.content,
    createdAt: new Date(),
    changes: changes || 'Content updated'
  });
  
  // Update current content
  this.content = newContent;
  this.version += 1;
  this.wordCount = newContent.split(' ').length;
  
  return this.save();
};

// Method to get story summary
storySchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    theme: this.theme,
    mood: this.mood,
    wordCount: this.wordCount,
    readingTime: this.estimatedReadingTime,
    fileCount: this.files.length,
    views: this.views,
    likes: this.likes,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static method to get popular stories
storySchema.statics.getPopularStories = function(limit = 10) {
  return this.find({ isPublic: true })
    .sort({ views: -1, likes: -1 })
    .limit(limit)
    .populate('userId', 'name avatar')
    .select('title description theme mood views likes createdAt');
};

// Static method to search stories
storySchema.statics.searchStories = function(query, options = {}) {
  const searchQuery = {
    isPublic: true,
    $text: { $search: query }
  };
  
  if (options.theme) {
    searchQuery.theme = options.theme;
  }
  
  if (options.mood) {
    searchQuery.mood = options.mood;
  }
  
  return this.find(searchQuery)
    .sort({ score: { $meta: 'textScore' } })
    .limit(options.limit || 20)
    .populate('userId', 'name avatar')
    .select('title description theme mood views likes createdAt');
};

// Ensure virtual fields are serialized
storySchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Story', storySchema);
