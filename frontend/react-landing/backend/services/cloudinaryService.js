const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

class CloudinaryService {
  constructor() {
    this.setupStorage();
  }

  setupStorage() {
    // Configure Cloudinary storage
    this.storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'best-of-us',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'mkv', 'webm'],
        resource_type: 'auto',
        transformation: [
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      }
    });

    // Configure multer
    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
        files: 10
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|mkv|webm/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only images and videos are allowed.'));
        }
      }
    });
  }

  // Upload single file
  async uploadFile(file, options = {}) {
    try {
      console.log('☁️ Uploading file to Cloudinary...');
      
      const result = await cloudinary.uploader.upload(file.path, {
        folder: options.folder || 'best-of-us',
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
        ...options
      });

      console.log('✅ File uploaded successfully');
      
      return {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        duration: result.duration
      };
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  // Upload multiple files
  async uploadFiles(files, options = {}) {
    try {
      console.log(`☁️ Uploading ${files.length} files to Cloudinary...`);
      
      const uploadPromises = files.map(file => this.uploadFile(file, options));
      const results = await Promise.all(uploadPromises);
      
      console.log('✅ All files uploaded successfully');
      
      return results;
    } catch (error) {
      console.error('❌ Batch upload error:', error);
      throw new Error(`Batch upload failed: ${error.message}`);
    }
  }

  // Generate thumbnail
  async generateThumbnail(publicId, options = {}) {
    try {
      const transformation = {
        width: options.width || 300,
        height: options.height || 300,
        crop: 'fill',
        quality: 'auto',
        fetch_format: 'auto'
      };

      const thumbnailUrl = cloudinary.url(publicId, {
        ...transformation,
        secure: true
      });
      
      return thumbnailUrl;
    } catch (error) {
      console.error('❌ Thumbnail generation error:', error);
      throw new Error(`Thumbnail generation failed: ${error.message}`);
    }
  }

  // Generate video thumbnail (extract frame)
  async generateVideoThumbnail(publicId, options = {}) {
    try {
      const transformation = {
        width: options.width || 300,
        height: options.height || 300,
        crop: 'fill',
        quality: 'auto',
        fetch_format: 'auto',
        start_offset: options.startOffset || 'auto' // Extract frame at specified time or auto
      };

      const thumbnailUrl = cloudinary.url(publicId, {
        resource_type: 'video',
        ...transformation,
        secure: true
      });
      
      return thumbnailUrl;
    } catch (error) {
      console.error('❌ Video thumbnail generation error:', error);
      throw new Error(`Video thumbnail generation failed: ${error.message}`);
    }
  }

  // Generate video preview
  async generateVideoPreview(publicId, options = {}) {
    try {
      const transformation = {
        width: options.width || 640,
        height: options.height || 360,
        crop: 'fill',
        quality: 'auto',
        fetch_format: 'auto',
        video_sampling: 1
      };

      const previewUrl = cloudinary.url(publicId, transformation);
      
      return previewUrl;
    } catch (error) {
      console.error('❌ Video preview generation error:', error);
      throw new Error(`Video preview generation failed: ${error.message}`);
    }
  }

  // Delete file
  async deleteFile(publicId, resourceType = 'auto') {
    try {
      console.log('🗑️ Deleting file from Cloudinary...');
      
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });
      
      console.log('✅ File deleted successfully');
      
      return result;
    } catch (error) {
      console.error('❌ Delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  // Get file info
  async getFileInfo(publicId, resourceType = 'image') {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType === 'video' ? 'video' : 'image',
        type: 'upload'
      });
      
      return {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        duration: result.duration,
        createdAt: result.created_at
      };
    } catch (error) {
      console.error('❌ Get file info error:', error);
      throw new Error(`Get file info failed: ${error.message}`);
    }
  }

  // Transform image
  async transformImage(publicId, transformations) {
    try {
      const transformedUrl = cloudinary.url(publicId, transformations);
      
      return transformedUrl;
    } catch (error) {
      console.error('❌ Image transformation error:', error);
      throw new Error(`Image transformation failed: ${error.message}`);
    }
  }

  // Get upload widget config
  getUploadWidgetConfig(options = {}) {
    return {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      uploadPreset: options.uploadPreset || 'best-of-us-preset',
      folder: options.folder || 'best-of-us',
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'mkv', 'webm'],
      multiple: options.multiple || true,
      cropping: options.cropping || false,
      showAdvancedOptions: false,
      showPoweredBy: false
    };
  }

  // Get multer middleware
  getMulterMiddleware() {
    return this.upload;
  }

  // Get single file upload middleware
  getSingleUploadMiddleware() {
    return this.upload.single('file');
  }

  // Get multiple files upload middleware
  getMultipleUploadMiddleware() {
    return this.upload.array('files', 10);
  }

  // Upload base64 image data
  async uploadBase64Image(base64Data, prefix = 'ai-generated') {
    try {
      console.log(`🎨 Uploading base64 image to Cloudinary...`);
      
      // Remove data URL prefix if present
      const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const result = await cloudinary.uploader.upload(
        `data:image/png;base64,${base64String}`,
        {
          folder: `best-of-us/${prefix}`,
          resource_type: 'image',
          format: 'png',
          quality: 'auto',
          fetch_format: 'auto'
        }
      );
      
      console.log(`✅ Base64 image uploaded successfully: ${result.secure_url}`);
      return result.secure_url;
    } catch (error) {
      console.error('❌ Base64 image upload error:', error);
      return null;
    }
  }
}

module.exports = new CloudinaryService();
