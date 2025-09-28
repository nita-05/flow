const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['image', 'video', 'audio']
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // in seconds for videos/audio
    default: null
  },
  dimensions: {
    width: Number,
    height: Number
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'completed', 'failed'],
    default: 'uploading'
  },
  processingProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Enhanced AI Processing Results
  transcription: {
    text: String,
    language: String,
    language_probability: Number,
    duration: Number,
    segments: [{
      id: Number,
      start: Number,
      end: Number,
      text: String,
      tokens: [Number],
      temperature: Number,
      avg_logprob: Number,
      compression_ratio: Number,
      no_speech_prob: Number,
      confidence: Number
    }],
    words: [{
      word: String,
      start: Number,
      end: Number,
      probability: Number,
      confidence: Number
    }],
    quality_metrics: {
      overall_confidence: Number,
      language_confidence: Number,
      audio_quality: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'unknown']
      },
      transcription_quality: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'unknown']
      }
    }
  },
  visionTags: [{
    tag: String,
    confidence: Number,
    category: String
  }],
  aiDescription: String,
  emotions: [{
    emotion: String,
    confidence: Number
  }],
  objects: [{
    object: String,
    confidence: Number,
    boundingBox: {
      x: Number,
      y: Number,
      width: Number,
      height: Number
    }
  }],
  faces: [{
    age: Number,
    gender: String,
    emotions: [String],
    confidence: Number
  }],
  // Search and Organization
  searchableText: String, // Combined text for search
  keywords: [String],
  categories: [String],
  // Metadata
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  deviceInfo: {
    make: String,
    model: String,
    software: String
  },
  // Thumbnails and Previews
  thumbnailUrl: String,
  previewUrl: String,
  // Processing History
  processingHistory: [{
    step: String,
    status: String,
    timestamp: Date,
    error: String
  }]
}, {
  timestamps: true
});

// Indexes for better performance
fileSchema.index({ userId: 1, createdAt: -1 });
fileSchema.index({ status: 1 });
fileSchema.index({ fileType: 1 });
fileSchema.index({ 'visionTags.tag': 1 });
fileSchema.index({ searchableText: 'text' });
fileSchema.index({ keywords: 1 });

// Virtual for file size in human readable format
fileSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for duration in human readable format
fileSchema.virtual('durationFormatted').get(function() {
  if (!this.duration) return null;
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = Math.floor(this.duration % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Method to update processing status
fileSchema.methods.updateProcessingStatus = function(step, status, error = null) {
  this.processingHistory.push({
    step,
    status,
    timestamp: new Date(),
    error
  });
  
  if (status === 'completed') {
    this.processingProgress = 100;
  } else if (status === 'failed') {
    this.status = 'failed';
  }
  
  return this.save();
};

// Method to get processing summary
fileSchema.methods.getProcessingSummary = function() {
  const completed = this.processingHistory.filter(h => h.status === 'completed').length;
  const total = this.processingHistory.length;
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0
  };
};

// Ensure virtual fields are serialized
fileSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('File', fileSchema);
