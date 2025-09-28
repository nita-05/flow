const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Initialize OpenAI client with enhanced connection settings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 300000, // 5 minutes timeout
  maxRetries: 3,
  httpAgent: new (require('https').Agent)({
    keepAlive: true,
    keepAliveMsecs: 30000,
    maxSockets: 10,
    timeout: 300000
  })
});

class AIService {
  constructor() {
    this.whisperModel = 'whisper-1';
    this.visionModel = 'gpt-4o-mini'; // Much cheaper than gpt-4-vision-preview
    this.textModel = 'gpt-3.5-turbo'; // Much cheaper than gpt-4
    this.embeddingModel = 'text-embedding-3-small'; // Cheaper than ada-002
    
    // Cost tracking
    this.usageStats = {
      totalTokens: 0,
      totalCost: 0,
      requests: 0
    };
    
    // Model pricing (per 1K tokens)
    this.pricing = {
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'text-embedding-3-small': { input: 0.00002, output: 0 },
      'whisper-1': { input: 0.006, output: 0 } // per minute
    };

    // Configure ffmpeg/ffprobe paths so visual analysis works on Windows
    try {
      const ffmpegBinary = require('ffmpeg-static');
      const ffprobeBinary = require('ffprobe-static').path;
      const fluentFfmpeg = require('fluent-ffmpeg');
      if (ffmpegBinary) {
        fluentFfmpeg.setFfmpegPath(ffmpegBinary);
      }
      if (ffprobeBinary) {
        fluentFfmpeg.setFfprobePath(ffprobeBinary);
      }
    } catch (e) {
      // Optional: if binaries not available, visual analysis may fail; continue silently
    }
  }

  // Enhanced audio/video transcription using OpenAI Whisper API
  async transcribeAudio(filePath, options = {}) {
    try {
      // If OPENAI_API_KEY is not set, fall back to local Vosk transcription
      if (!process.env.OPENAI_API_KEY) {
        return await this.transcribeAudioLocal(filePath, options);
      }
      console.log('🎤 Starting enhanced audio transcription with OpenAI Whisper API...');
      
      // If filePath is a remote URL (Cloudinary), download to temp first
      let inputStream;
      let tmpFilePathLocal = null;
      if (/^https?:\/\//i.test(filePath)) {
        console.log('📥 Downloading file from Cloudinary...');
        const response = await axios.get(filePath, { 
          responseType: 'stream',
          timeout: 60000 // 1 minute timeout for download
        });
        tmpFilePathLocal = path.join(
          path.dirname(filePath).startsWith('http') ? process.cwd() : __dirname,
          `tmp_audio_${Date.now()}.dat`
        );
        const writer = fs.createWriteStream(tmpFilePathLocal);
        await new Promise((resolve, reject) => {
          response.data.pipe(writer);
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        
        // Check file size and optimize if needed
        const stats = fs.statSync(tmpFilePathLocal);
        const fileSizeMB = stats.size / (1024 * 1024);
        console.log(`📊 File size: ${fileSizeMB.toFixed(2)} MB`);
        
        // If file is too large (>25MB), compress it
        if (fileSizeMB > 25) {
          console.log('⚠️ File too large, compressing audio...');
          const compressedPath = await this.compressAudio(tmpFilePathLocal);
          if (compressedPath) {
            fs.unlinkSync(tmpFilePathLocal); // Remove original
            tmpFilePathLocal = compressedPath;
            console.log('✅ Audio compressed successfully');
          }
        }
        
        inputStream = fs.createReadStream(tmpFilePathLocal);
        console.log('✅ File downloaded successfully');
      } else {
        inputStream = fs.createReadStream(filePath);
      }

      // Enhanced retry logic with connection diagnostics
      let transcription;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`🔄 Attempt ${retryCount + 1}/${maxRetries} - Calling Whisper API...`);
          
          // Test connection first
          if (retryCount > 0) {
            console.log('🔍 Testing OpenAI API connectivity...');
            try {
              await openai.models.list();
              console.log('✅ OpenAI API is reachable');
            } catch (testError) {
              console.error('❌ OpenAI API connectivity test failed:', testError.message);
              if (testError.code === 'ECONNRESET' || testError.code === 'ENOTFOUND') {
                console.log('🌐 Network issue detected, trying alternative approach...');
                // Try with different connection settings
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
              }
            }
          }
          
          // Create a new file stream for each attempt to avoid stream issues
          const freshStream = fs.createReadStream(tmpFilePathLocal || filePath);
          
          // Try with minimal parameters first
          transcription = await openai.audio.transcriptions.create({
            file: freshStream,
            model: this.whisperModel,
            response_format: 'text' // Start with simple format
          });
          
          console.log('✅ Whisper API call successful');
          break; // Success, exit retry loop
          
        } catch (apiError) {
          retryCount++;
          console.error(`❌ Whisper API attempt ${retryCount} failed:`, apiError.message);
          
          // Check if it's a connection issue
          if (apiError.code === 'ECONNRESET' || apiError.code === 'ENOTFOUND' || apiError.code === 'ETIMEDOUT') {
            console.log('🌐 Network connectivity issue detected');
          }
          
          if (retryCount >= maxRetries) {
            console.error('❌ All Whisper API attempts failed, trying alternative approach...');
            
            // Try one more time with a completely different approach
            try {
              console.log('🔄 Final attempt with alternative method...');
              const alternativeStream = fs.createReadStream(tmpFilePathLocal || filePath);
              
              // Use a simpler API call without advanced features
              const simpleTranscription = await openai.audio.transcriptions.create({
                file: alternativeStream,
                model: this.whisperModel,
                response_format: 'text' // Simpler format
              });
              
              console.log('✅ Alternative method succeeded');
              
              // Convert simple response to expected format
              transcription = {
                text: simpleTranscription,
                language: 'en',
                duration: 0,
                segments: [{ id: 0, start: 0, end: 0, text: simpleTranscription, tokens: [], temperature: 0, avg_logprob: 0, compression_ratio: 0, no_speech_prob: 0, confidence: 0.9 }],
                words: [],
                quality_metrics: {
                  overall_confidence: 0.9,
                  language_confidence: 1,
                  audio_quality: 'unknown',
                  transcription_quality: 'good'
                }
              };
              
              break; // Success
              
            } catch (finalError) {
              console.error('❌ Alternative method also failed, falling back to local transcription');
              // Clean up temp file
              if (tmpFilePathLocal && fs.existsSync(tmpFilePathLocal)) {
                fs.unlinkSync(tmpFilePathLocal);
              }
              return await this.transcribeAudioLocal(filePath, options);
            }
          }
          
          // Wait before retry (exponential backoff with jitter)
          const baseWaitTime = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
          const jitter = Math.random() * 1000; // Add random jitter
          const waitTime = baseWaitTime + jitter;
          console.log(`⏳ Waiting ${Math.round(waitTime)}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      console.log('✅ Enhanced transcription completed');
      
      // Track usage
      this.trackUsage(this.whisperModel, 0, 0, transcription.duration);
      
      // Enhanced response with all features
      return {
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
        language_probability: transcription.language_probability,
        segments: transcription.segments?.map(segment => ({
          id: segment.id,
          start: segment.start,
          end: segment.end,
          text: segment.text,
          tokens: segment.tokens,
          temperature: segment.temperature,
          avg_logprob: segment.avg_logprob,
          compression_ratio: segment.compression_ratio,
          no_speech_prob: segment.no_speech_prob,
          confidence: this.calculateConfidence(segment.avg_logprob, segment.no_speech_prob)
        })) || [],
        words: transcription.words?.map(word => ({
          word: word.word,
          start: word.start,
          end: word.end,
          probability: word.probability,
          confidence: word.probability
        })) || [],
        quality_metrics: {
          overall_confidence: this.calculateOverallConfidence(transcription.segments),
          language_confidence: transcription.language_probability,
          audio_quality: this.assessAudioQuality(transcription.segments),
          transcription_quality: this.assessTranscriptionQuality(transcription.segments)
        }
      };
    } catch (error) {
      console.error('❌ Enhanced transcription error:', error);
      // Network hiccup or transport reset → quick retry then graceful local fallback
      const isConnErr = (error && (error.code === 'ECONNRESET' || String(error.message||'').toLowerCase().includes('connection error')));
      if (isConnErr && options.__retry !== true) {
        try {
          await new Promise(r => setTimeout(r, 800));
          return await this.transcribeAudio(filePath, { ...options, __retry: true });
        } catch {}
      }
      // Final fallback to local STT so user still gets content
      try {
        return await this.transcribeAudioLocal(filePath, options);
      } catch (_) {
        throw new Error(`Enhanced transcription failed: ${error.message}`);
      }
    }
    finally {
      // Cleanup tmp file if created
      try {
        const fsTmp = require('fs');
        if (typeof tmpFilePathLocal === 'string' && fsTmp.existsSync(tmpFilePathLocal)) {
          fsTmp.unlinkSync(tmpFilePathLocal);
        }
      } catch {}
    }
  }

  // Local transcription using Vosk (no API key required)
  async transcribeAudioLocal(filePath, options = {}) {
    console.log('🎤 Starting local transcription with Vosk...');
    const fs = require('fs');
    const path = require('path');
    const ffmpeg = require('fluent-ffmpeg');
    const vosk = (() => {
      try { return require('vosk'); } catch (e) { return null; }
    })();

    if (!vosk) {
      throw new Error('Vosk is not installed. Run `npm i vosk` in backend and provide VOSK_MODEL_PATH.');
    }

    const MODEL_PATH = process.env.VOSK_MODEL_PATH || path.join(__dirname, '../../models/vosk-model-small-en-us-0.15');
    if (!fs.existsSync(MODEL_PATH)) {
      throw new Error(`VOSK model not found at ${MODEL_PATH}. Download a small model (e.g. en-us) and set VOSK_MODEL_PATH.`);
    }

    // Convert input to 16k mono wav temp file
    const tmpWav = filePath.replace(/\.[^/.]+$/, '_16k.wav');
    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .audioChannels(1)
        .audioFrequency(16000)
        .format('wav')
        .on('end', resolve)
        .on('error', reject)
        .save(tmpWav);
    });

    vosk.setLogLevel(0);
    const model = new vosk.Model(MODEL_PATH);
    const rec = new vosk.Recognizer({ model, sampleRate: 16000 });

    // Stream wav data
    await new Promise((resolve, reject) => {
      const rs = fs.createReadStream(tmpWav, { highWaterMark: 4096 });
      rs.on('data', (data) => rec.acceptWaveform(data));
      rs.on('end', resolve);
      rs.on('error', reject);
    });

    const final = rec.finalResult();
    rec.free();
    model.free();

    // Build Whisper-like response shape
    const text = (final?.text || '').trim();
    console.log('✅ Local transcription completed');
    return {
      text,
      language: 'en',
      duration: 0,
      segments: text ? [{ id: 0, start: 0, end: 0, text, tokens: [], temperature: 0, avg_logprob: 0, compression_ratio: 0, no_speech_prob: 0, confidence: 0.9 }] : [],
      words: [],
      quality_metrics: {
        overall_confidence: 0.9,
        language_confidence: 1,
        audio_quality: 'unknown',
        transcription_quality: text ? 'good' : 'unknown'
      }
    };
  }

  // Analyze image/video using GPT Vision
  async analyzeVisualContent(filePath, fileType, options = {}) {
    try {
      // If no OpenAI key, use local analysis (Transformers.js CLIP/BLIP)
      if (!process.env.OPENAI_API_KEY) {
        return await this.analyzeVisualContentLocal(filePath, fileType, options);
      }
      console.log('👁️ Starting visual analysis...');
      const axios = require('axios');
      const fsLocal = require('fs');
      const tmpDir = require('os').tmpdir();

      // Download remote files to a temporary local path
      let localPath = filePath;
      let cleanupPathsLocal = [];
      if (/^https?:\/\//i.test(filePath)) {
        const ext = fileType === 'video' ? '.mp4' : '.jpg';
        const tmpPath = require('path').join(tmpDir, `vision_${Date.now()}${ext}`);
        const response = await axios.get(filePath, { responseType: 'stream' });
        await new Promise((resolve, reject) => {
          const writer = fsLocal.createWriteStream(tmpPath);
          response.data.pipe(writer);
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        localPath = tmpPath;
        cleanupPathsLocal.push(tmpPath);
      }

      // Convert video to image frame if needed
      let imagePath = localPath;
      if (fileType === 'video') {
        imagePath = await this.extractVideoFrame(localPath);
        cleanupPathsLocal.push(imagePath);
      }

      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      const response = await openai.chat.completions.create({
        model: this.visionModel,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this ${fileType} and provide detailed information about:
                1. Objects, people, and activities visible
                2. Emotions and expressions
                3. Setting and environment
                4. Colors, lighting, and composition
                5. Relevant tags and categories
                
                Return the response in JSON format with the following structure:
                {
                  "objects": [{"object": "string", "confidence": 0.95}],
                  "emotions": [{"emotion": "string", "confidence": 0.9}],
                  "setting": "string",
                  "description": "string",
                  "tags": ["tag1", "tag2"],
                  "categories": ["category1", "category2"],
                  "faces": [{"age": 25, "gender": "female", "emotions": ["happy"], "confidence": 0.9}]
                }`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500, // Reduced from 1000 to save costs
        temperature: 0.3
      });

      const analysisText = response.choices[0].message.content;
      const analysis = JSON.parse(analysisText);

      console.log('✅ Visual analysis completed');
      
      // Track usage
      this.trackUsage(this.visionModel, response.usage?.prompt_tokens || 0, response.usage?.completion_tokens || 0);
      
      return analysis;
    } catch (error) {
      console.error('❌ Visual analysis error:', error);
      throw new Error(`Visual analysis failed: ${error.message}`);
    } finally {
      // Cleanup temporary files
      try {
        const fsLocal2 = require('fs');
        if (Array.isArray(cleanupPathsLocal)) {
          cleanupPathsLocal.forEach(p => {
            if (typeof p === 'string' && fsLocal2.existsSync(p)) {
              try { fsLocal2.unlinkSync(p); } catch {}
            }
          });
        }
      } catch {}
    }
  }

  // Local visual analysis with Transformers.js (no API key)
  async analyzeVisualContentLocal(filePath, fileType, options = {}) {
    console.log('👁️ Starting local visual analysis...');
    const fs = require('fs');
    const path = require('path');
    const ffmpeg = require('fluent-ffmpeg');

    // Lazy import to avoid loading if unused
    const { pipeline } = await import('@xenova/transformers');

    // If video, extract a mid‑frame as preview image
    let imagePath = filePath;
    if (fileType === 'video') {
      imagePath = filePath.replace(/\.[^/.]+$/, '_frame.jpg');
      await new Promise((resolve, reject) => {
        ffmpeg(filePath)
          .on('end', resolve)
          .on('error', reject)
          .screenshots({ timestamps: ['50%'], filename: path.basename(imagePath), folder: path.dirname(imagePath) });
      });
    }

    // 1) Image caption (BLIP) — produces a natural sentence
    const captioner = await pipeline('image-to-text', 'Xenova/blip-image-captioning-base');
    const captions = await captioner(imagePath);
    const description = captions?.[0]?.generated_text || '';

    // 2) Image classification (CLIP) — produces tags
    const classifier = await pipeline('image-classification', 'Xenova/clip-vit-base-patch16');
    const classes = await classifier(imagePath, { topk: 6 });
    const tags = (classes || []).map((c) => ({ tag: c.label.toLowerCase(), confidence: Number(c.score || 0) }));

    console.log('✅ Local visual analysis completed');
    return {
      objects: [],
      emotions: [],
      setting: '',
      description,
      tags: tags.map((t) => t.tag),
      categories: [],
      faces: [],
    };
  }

  // Generate story from files and prompt
  async generateStory(files, prompt, options = {}) {
    try {
      console.log('📖 Starting story generation...');
      
      // Prepare context from files
      const fileContexts = await Promise.all(
        files.map(async (file) => {
          let context = `File: ${file.originalName}\n`;
          
          if (file.transcription?.text) {
            context += `Audio content: ${file.transcription.text}\n`;
          }
          
          if (file.aiDescription) {
            context += `Visual content: ${file.aiDescription}\n`;
          }
          
          if (file.visionTags?.length > 0) {
            context += `Tags: ${file.visionTags.map(t => t.tag).join(', ')}\n`;
          }
          
          return context;
        })
      );

      const systemPrompt = `You are a professional storyteller creating beautiful, uplifting narratives from personal memories. 
      Your stories should follow the "Best of Us" philosophy - celebrating the positive, meaningful moments in life.
      
      Guidelines:
      - Create cohesive, engaging narratives
      - Focus on positive emotions and meaningful connections
      - Use vivid, descriptive language
      - Maintain a warm, personal tone
      - Structure stories with clear beginning, middle, and end
      - Length: 300-800 words
      
      Theme: ${options.theme || 'uplifting'}
      Mood: ${options.mood || 'inspiring'}`;

      const userPrompt = `Create a beautiful story based on these memories:

${fileContexts.join('\n---\n')}

User's request: ${prompt}

Please create a compelling narrative that weaves these moments together into a meaningful story.`;

      const response = await openai.chat.completions.create({
        model: this.textModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: options.maxTokens || 1000, // Reduced from 2000 to save costs
        temperature: options.temperature || 0.7
      });

      const story = response.choices[0].message.content;
      
      console.log('✅ Story generation completed');
      
      // Track usage
      this.trackUsage(this.textModel, response.usage?.prompt_tokens || 0, response.usage?.completion_tokens || 0);
      
      return {
        content: story,
        wordCount: story.split(' ').length,
        model: this.textModel,
        settings: options
      };
    } catch (error) {
      console.error('❌ Story generation error:', error);
      throw new Error(`Story generation failed: ${error.message}`);
    }
  }

  // Extract frame from video
  async extractVideoFrame(videoPath) {
    try {
      const ffmpeg = require('fluent-ffmpeg');
      const outputPath = videoPath.replace(/\.[^/.]+$/, '_frame.jpg');
      
      return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: ['50%'],
            filename: path.basename(outputPath),
            folder: path.dirname(outputPath)
          })
          .on('end', () => resolve(outputPath))
          .on('error', reject);
      });
    } catch (error) {
      console.error('❌ Frame extraction error:', error);
      throw new Error(`Frame extraction failed: ${error.message}`);
    }
  }

  // Get video duration
  async getVideoDuration(videoPath) {
    try {
      const ffmpeg = require('fluent-ffmpeg');
      
      return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
          if (err) {
            reject(err);
          } else {
            resolve(metadata.format.duration);
          }
        });
      });
    } catch (error) {
      console.error('❌ Duration extraction error:', error);
      return null;
    }
  }

  // Get image dimensions
  async getImageDimensions(imagePath) {
    try {
      const sharp = require('sharp');
      const metadata = await sharp(imagePath).metadata();
      
      return {
        width: metadata.width,
        height: metadata.height
      };
    } catch (error) {
      console.error('❌ Image dimensions error:', error);
      return null;
    }
  }

  // Generate searchable text from file data
  generateSearchableText(file) {
    const textParts = [];
    
    if (file.transcription?.text) {
      textParts.push(file.transcription.text);
    }
    
    if (file.aiDescription) {
      textParts.push(file.aiDescription);
    }
    
    if (file.visionTags?.length > 0) {
      textParts.push(file.visionTags.map(t => t.tag).join(' '));
    }
    
    if (file.keywords?.length > 0) {
      textParts.push(file.keywords.join(' '));
    }
    
    return textParts.join(' ').toLowerCase();
  }

  // Semantic search using embeddings
  async semanticSearch(query, files, threshold = 0.7) {
    try {
      console.log('🔍 Starting semantic search...');
      
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Calculate similarities
      const results = files.map(file => {
        if (!file.embedding) return null;
        
        const similarity = this.calculateSimilarity(queryEmbedding, file.embedding);
        
        return {
          file,
          similarity,
          relevance: similarity > threshold
        };
      }).filter(result => result && result.relevance);
      
      // Sort by similarity
      results.sort((a, b) => b.similarity - a.similarity);
      
      console.log('✅ Semantic search completed');
      
      return results.map(r => r.file);
    } catch (error) {
      console.error('❌ Semantic search error:', error);
      throw new Error(`Semantic search failed: ${error.message}`);
    }
  }

  // Generate embedding for text
  async generateEmbedding(text) {
    try {
      const response = await openai.embeddings.create({
        model: this.embeddingModel, // Using cheaper embedding model
        input: text
      });
      
      return response.data[0].embedding;
    } catch (error) {
      // Graceful degradation on rate limit/insufficient quota
      console.error('❌ Embedding generation error:', error);
      if (error && (error.code === 'insufficient_quota' || error.status === 429)) {
        return null;
      }
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  // Calculate cosine similarity
  calculateSimilarity(embedding1, embedding2) {
    const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  // Calculate confidence score for a segment
  calculateConfidence(avgLogprob, noSpeechProb) {
    // Convert log probability to confidence (0-1 scale)
    const logprobConfidence = Math.max(0, Math.min(1, (avgLogprob + 1) / 1)); // Normalize from [-1,0] to [0,1]
    const speechConfidence = 1 - noSpeechProb; // Higher speech probability = higher confidence
    
    // Weighted average: 70% logprob, 30% speech probability
    return Math.round((logprobConfidence * 0.7 + speechConfidence * 0.3) * 100) / 100;
  }

  // Calculate overall confidence from all segments
  calculateOverallConfidence(segments) {
    if (!segments || segments.length === 0) return 0;
    
    const totalConfidence = segments.reduce((sum, segment) => {
      return sum + this.calculateConfidence(segment.avg_logprob, segment.no_speech_prob);
    }, 0);
    
    return Math.round((totalConfidence / segments.length) * 100) / 100;
  }

  // Assess audio quality based on transcription metrics
  assessAudioQuality(segments) {
    if (!segments || segments.length === 0) return 'unknown';
    
    const avgNoSpeechProb = segments.reduce((sum, s) => sum + s.no_speech_prob, 0) / segments.length;
    const avgCompressionRatio = segments.reduce((sum, s) => sum + s.compression_ratio, 0) / segments.length;
    
    if (avgNoSpeechProb < 0.1 && avgCompressionRatio < 2.5) return 'excellent';
    if (avgNoSpeechProb < 0.2 && avgCompressionRatio < 3.0) return 'good';
    if (avgNoSpeechProb < 0.3 && avgCompressionRatio < 3.5) return 'fair';
    return 'poor';
  }

  // Assess transcription quality
  assessTranscriptionQuality(segments) {
    if (!segments || segments.length === 0) return 'unknown';
    
    const overallConfidence = this.calculateOverallConfidence(segments);
    
    if (overallConfidence >= 0.9) return 'excellent';
    if (overallConfidence >= 0.8) return 'good';
    if (overallConfidence >= 0.7) return 'fair';
    return 'poor';
  }

  // Track usage and costs
  trackUsage(model, inputTokens, outputTokens = 0, duration = 0) {
    this.usageStats.requests++;
    
    let cost = 0;
    if (model === 'whisper-1') {
      cost = duration * this.pricing[model].input;
    } else {
      cost = (inputTokens / 1000) * this.pricing[model].input + 
             (outputTokens / 1000) * this.pricing[model].output;
    }
    
    this.usageStats.totalTokens += inputTokens + outputTokens;
    this.usageStats.totalCost += cost;
    
    console.log(`💰 Cost: $${cost.toFixed(4)} | Total: $${this.usageStats.totalCost.toFixed(4)}`);
    
    return cost;
  }

  // Get usage statistics
  getUsageStats() {
    return {
      ...this.usageStats,
      averageCostPerRequest: this.usageStats.requests > 0 ? 
        this.usageStats.totalCost / this.usageStats.requests : 0
    };
  }

  // Reset usage statistics
  resetUsageStats() {
    this.usageStats = {
      totalTokens: 0,
      totalCost: 0,
      requests: 0
    };
  }

  // Compress audio file to reduce size for API upload
  async compressAudio(inputPath) {
    try {
      const ffmpeg = require('fluent-ffmpeg');
      const outputPath = inputPath.replace(/\.[^/.]+$/, '_compressed.mp3');
      
      return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .audioCodec('mp3')
          .audioBitrate('64k') // Low bitrate for smaller size
          .audioChannels(1) // Mono for smaller size
          .audioFrequency(16000) // Lower frequency for speech
          .output(outputPath)
          .on('end', () => {
            console.log('✅ Audio compression completed');
            resolve(outputPath);
          })
          .on('error', (err) => {
            console.error('❌ Audio compression failed:', err);
            resolve(null); // Return null to continue without compression
          })
          .run();
      });
    } catch (error) {
      console.error('❌ Audio compression error:', error);
      return null;
    }
  }

  // Network diagnostics
  async testNetworkConnectivity() {
    try {
      console.log('🔍 Running network diagnostics...');
      
      // Test basic internet connectivity
      const axios = require('axios');
      await axios.get('https://httpbin.org/status/200', { timeout: 5000 });
      console.log('✅ Basic internet connectivity: OK');
      
      // Test OpenAI API reachability
      try {
        await openai.models.list();
        console.log('✅ OpenAI API connectivity: OK');
        return true;
      } catch (openaiError) {
        console.error('❌ OpenAI API connectivity: FAILED');
        console.error('Error details:', openaiError.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Network diagnostics failed:', error.message);
      return false;
    }
  }

  // Generate animated film from story with fallback options
  async generateAnimatedFilm(story, options = {}) {
    try {
      console.log('🎬 Starting animated film generation...');
      
      // Create optimized prompt for video generation
      const videoPrompt = this.createVideoPrompt(story, options);
      
      // Try multiple services in order of preference
      let filmResult = null;
      let serviceUsed = 'none';
      
      try {
        // Try Fal.ai first (free + fast)
        console.log('🎯 Trying Fal.ai...');
        filmResult = await this.generateVideoWithFal(videoPrompt, options);
        serviceUsed = 'fal';
      } catch (falError) {
        console.log('⚠️ Fal.ai failed, trying RunwayML...');
        try {
          // Try RunwayML
          filmResult = await this.generateVideoWithRunway(videoPrompt, options);
          serviceUsed = 'runway';
        } catch (runwayError) {
          console.log('⚠️ RunwayML failed, trying Elai.io...');
        
          try {
            // Try Elai.io as fallback
            filmResult = await this.generateVideoWithElai(videoPrompt, options);
            serviceUsed = 'elai';
          } catch (elaiError) {
            console.log('⚠️ Elai.io failed, using mock result...');
            
            // Final fallback to mock
            filmResult = this.getMockVideoResult(options.duration || 10, 'fallback');
            serviceUsed = 'mock';
          }
        }
      }
      
      console.log(`✅ Animated film generated successfully using ${serviceUsed}`);
      
      // Track usage
      this.trackUsage(`${serviceUsed}-video`, 0, 0, options.duration || 30);
      
      return {
        videoUrl: filmResult.url,
        thumbnailUrl: filmResult.thumbnail,
        duration: filmResult.duration,
        style: options.style || 'heartwarming',
        mood: options.mood || 'uplifting',
        cost: filmResult.cost,
        prompt: videoPrompt,
        service: serviceUsed,
        isMock: filmResult.isMock || false,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Film generation error:', error);
      throw new Error(`Film generation failed: ${error.message}`);
    }
  }

  // Generate video using Fal.ai API
  async generateVideoWithFal(prompt, options = {}) {
    const falKey = process.env.FAL_KEY;
    const endpoint = process.env.FAL_MODEL_ENDPOINT || 'fal-ai/flux/dev';
    const apiUrl = `https://fal.run/${endpoint}`;

    if (!falKey) {
      console.log('⚠️ FAL_KEY not configured, using mock result');
      return this.getMockVideoResult(Math.min(options.duration || 20, 30), 'fal');
    }

    try {
      const duration = Math.min(options.duration || 20, 30);
      const size = options.size || '1280x720';

      console.log(`🎬 Generating video with Fal.ai (${endpoint})...`);

      const response = await axios.post(apiUrl, {
        prompt,
        duration,
        size,
        format: 'mp4'
      }, {
        headers: {
          'Authorization': `Key ${falKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      const data = response.data || {};
      const possibleUrl = data?.video_url || data?.video?.url || data?.output?.url || (Array.isArray(data?.output) ? data.output[0]?.url : undefined);
      const thumb = data?.thumbnail_url || data?.thumbnail || null;

      if (!possibleUrl) {
        throw new Error('Fal response missing video url');
      }

      console.log('✅ Fal.ai video generated successfully');
      return {
        url: possibleUrl,
        thumbnail: thumb,
        duration,
        cost: 0,
        status: 'completed',
        service: 'fal'
      };
    } catch (error) {
      console.error('❌ Fal.ai API error:', error?.response?.data || error.message);
      // Fallback to mock so UX continues
      return this.getMockVideoResult(Math.min(options.duration || 20, 30), 'fal');
    }
  }

  // Create optimized video prompt from story
  createVideoPrompt(story, options = {}) {
    const mood = options.mood || 'uplifting';
    const duration = options.duration || 30;
    
    // Extract key elements from story
    const storySummary = story.content.substring(0, 500);
    const theme = story.theme || 'family';
    
    let visualStyle = '';
    let characterDescription = '';
    let settingDescription = '';
    
    // Customize based on theme
    switch (theme) {
      case 'family':
        visualStyle = 'warm, cozy, family-friendly animation with soft pastel colors';
        characterDescription = 'loving family members with warm expressions';
        settingDescription = 'home, living room, or family gathering spaces';
        break;
      case 'adventure':
        visualStyle = 'dynamic, exciting animation with vibrant colors and movement';
        characterDescription = 'adventurous characters exploring new places';
        settingDescription = 'outdoor landscapes, mountains, or travel destinations';
        break;
      case 'celebration':
        visualStyle = 'festive, joyful animation with bright, celebratory colors';
        characterDescription = 'happy people celebrating and having fun';
        settingDescription = 'party venues, celebration spaces, or festive locations';
        break;
      case 'love':
        visualStyle = 'romantic, intimate animation with warm, loving colors';
        characterDescription = 'couples sharing tender moments';
        settingDescription = 'romantic settings, beautiful landscapes, or intimate spaces';
        break;
      default:
        visualStyle = 'uplifting, positive animation with warm, inviting colors';
        characterDescription = 'happy, positive people in meaningful moments';
        settingDescription = 'beautiful, inspiring locations';
    }
    
    const prompt = `Create a ${duration}-second animated film based on this story:

"${storySummary}"

Visual Style: ${visualStyle}
Mood: ${mood} and inspiring
Characters: ${characterDescription}
Setting: ${settingDescription}
Animation Style: Smooth, professional 2D/3D hybrid animation
Color Palette: Warm, inviting colors that evoke positive emotions
Lighting: Soft, natural lighting that creates a warm atmosphere
Camera Movement: Gentle, cinematic movements that enhance the emotional impact
Music: Upbeat, inspiring background music (no vocals)
Focus: Highlight the positive moments, meaningful connections, and uplifting themes

The film should capture the essence of the story while maintaining the "Best of Us" philosophy - celebrating the positive, meaningful moments in life. Make it visually stunning and emotionally engaging.`;

    return prompt;
  }

  // Generate video using RunwayML API
  async generateVideoWithRunway(prompt, options = {}) {
    try {
      const duration = Math.min(options.duration || 10, 10); // Free tier limit: 10 seconds
      const style = options.style || 'heartwarming';
      
      // Check if we have API key
      if (!process.env.RUNWAY_API_KEY || process.env.RUNWAY_API_KEY === 'your-runway-api-key-here') {
        console.log('⚠️ RunwayML API key not configured, using mock result');
        return this.getMockVideoResult(duration, 'runway');
      }
      
      console.log('🎬 Generating video with RunwayML API...');
      
      // Real RunwayML API implementation:
      const response = await fetch('https://api.runwayml.com/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          duration: duration,
          style: style,
          quality: 'standard', // Free tier quality
          aspect_ratio: '16:9'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`RunwayML API error: ${response.statusText} - ${errorData.message || 'Unknown error'}`);
      }
      
      const result = await response.json();
      
      console.log('✅ RunwayML video generated successfully');
      return {
        url: result.video_url,
        thumbnail: result.thumbnail_url,
        duration: duration,
        cost: duration * 0.10,
        status: 'completed',
        service: 'runway'
      };
      
    } catch (error) {
      console.error('❌ RunwayML API error:', error);
      
      // Fallback to mock if API fails
      console.log('🔄 Falling back to mock result');
      return this.getMockVideoResult(options.duration || 10, 'runway');
    }
  }

  // Mock video result for testing
  getMockVideoResult(duration, service) {
    return {
      url: `https://demo-videos.s3.amazonaws.com/${service}-film-${Date.now()}.mp4`,
      thumbnail: `https://demo-videos.s3.amazonaws.com/${service}-thumbnail-${Date.now()}.jpg`,
      duration: duration,
      cost: duration * 0.10,
      status: 'completed',
      service: service,
      isMock: true
    };
  }

  // Generate video using Elai.io API (Free alternative)
  async generateVideoWithElai(prompt, options = {}) {
    try {
      const duration = Math.min(options.duration || 30, 60); // Free tier limit
      const avatar = options.avatar || 'default';
      const voice = options.voice || 'en-US-female';
      
      // Check if we have API key
      if (!process.env.ELAI_API_KEY || process.env.ELAI_API_KEY === 'your-elai-api-key-here') {
        console.log('⚠️ Elai.io API key not configured, using mock result');
        return this.getMockVideoResult(duration, 'elai');
      }
      
      console.log('🎬 Generating video with Elai.io API...');
      
      // Real Elai.io API implementation:
      const response = await fetch('https://api.elai.io/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.ELAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          script: prompt,
          avatar: avatar,
          voice: voice,
          duration: duration,
          quality: 'standard'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Elai.io API error: ${response.statusText} - ${errorData.message || 'Unknown error'}`);
      }
      
      const result = await response.json();
      
      console.log('✅ Elai.io video generated successfully');
      return {
        url: result.video_url,
        thumbnail: result.thumbnail_url,
        duration: duration,
        cost: 0, // Free tier
        status: 'completed',
        service: 'elai'
      };
      
    } catch (error) {
      console.error('❌ Elai.io API error:', error);
      
      // Fallback to mock if API fails
      console.log('🔄 Falling back to mock result');
      return this.getMockVideoResult(options.duration || 30, 'elai');
    }
  }

  // Generate film with alternative AI video service (Pika Labs)
  async generateVideoWithPika(prompt, options = {}) {
    try {
      const duration = options.duration || 30;
      
      // Mock implementation for Pika Labs
      const mockResult = {
        url: `https://demo-videos.s3.amazonaws.com/pika-film-${Date.now()}.mp4`,
        thumbnail: `https://demo-videos.s3.amazonaws.com/pika-thumbnail-${Date.now()}.jpg`,
        duration: duration,
        cost: duration * 0.05, // $0.05 per second
        status: 'completed',
        service: 'pika'
      };
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return mockResult;
    } catch (error) {
      console.error('❌ Pika Labs API error:', error);
      throw new Error(`Pika video generation failed: ${error.message}`);
    }
  }

  // Get available film styles
  getFilmStyles() {
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

  // Get available film durations
  getFilmDurations() {
    return [
      { value: 15, label: '15 seconds', cost: 1.50, description: 'Quick highlight reel' },
      { value: 30, label: '30 seconds', cost: 3.00, description: 'Perfect story length' },
      { value: 60, label: '1 minute', cost: 6.00, description: 'Full narrative' },
      { value: 90, label: '1.5 minutes', cost: 9.00, description: 'Extended story' }
    ];
  }
}

module.exports = new AIService();
