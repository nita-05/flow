// Dashboard JavaScript for Best of Us

// Global variables
let uploadedFiles = [];
let selectedFilesForStory = [];

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Initialize dashboard functionality
    initUpload();
    initSearch();
    initStoryGeneration();
    
    // Load user info
    loadUserInfo();
});

// Authentication check
function checkAuth() {
    const user = localStorage.getItem('bestOfUsUser');
    if (!user) {
        // Redirect to login if not authenticated
        window.location.href = 'index.html';
        return;
    }
    
    const userData = JSON.parse(user);
    console.log('User authenticated:', userData);
}

// Load user information
function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('bestOfUsUser'));
    if (user) {
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userName) {
            userName.textContent = user.name || 'User';
        }
        
        if (userAvatar && user.picture) {
            userAvatar.src = user.picture;
            userAvatar.alt = user.name || 'User Avatar';
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('bestOfUsUser');
    window.location.href = 'index.html';
}

// Upload functionality
function initUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (!uploadArea || !fileInput) return;
    
    // Drag and drop functionality
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        handleFiles(files);
    });
    
    // File input change
    fileInput.addEventListener('change', function(e) {
        handleFiles(e.target.files);
    });
    
    // Click to upload
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
}

function handleFiles(files) {
    const validFiles = Array.from(files).filter(file => {
        return file.type.startsWith('image/') || file.type.startsWith('video/');
    });
    
    if (validFiles.length === 0) {
        showNotification('Please select only image or video files.', 'error');
        return;
    }
    
    // Show progress
    const progressDiv = document.getElementById('uploadProgress');
    if (progressDiv) {
        progressDiv.classList.remove('hidden');
    }
    
    // Simulate upload process
    uploadFiles(validFiles);
}

function uploadFiles(files) {
    let completed = 0;
    const total = files.length;
    
    files.forEach((file, index) => {
        // Simulate upload delay
        setTimeout(() => {
            // Create file object with metadata
            const fileObj = {
                id: Date.now() + index,
                name: file.name,
                size: file.size,
                type: file.type,
                url: URL.createObjectURL(file),
                uploadedAt: new Date(),
                tags: [],
                transcript: null
            };
            
            uploadedFiles.push(fileObj);
            addFileToList(fileObj);
            
            completed++;
            const progress = (completed / total) * 100;
            
            const progressBar = document.getElementById('progressBar');
            const progressText = document.getElementById('progressText');
            
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
            
            if (progressText) {
                progressText.textContent = `Uploading ${completed}/${total} files...`;
            }
            
            if (completed === total) {
                setTimeout(() => {
                    const progressDiv = document.getElementById('uploadProgress');
                    if (progressDiv) {
                        progressDiv.classList.add('hidden');
                    }
                    
                    if (progressBar) {
                        progressBar.style.width = '0%';
                    }
                    
                    // Simulate AI processing
                    simulateAIProcessing();
                }, 500);
            }
        }, index * 200); // Stagger uploads
    });
}

function addFileToList(file) {
    const container = document.getElementById('uploadedFiles');
    if (!container) return;
    
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.id = `file-${file.id}`;
    
    const fileIcon = file.type.startsWith('image/') ? '🖼️' : '🎥';
    const fileSize = (file.size / 1024 / 1024).toFixed(1) + ' MB';
    
    fileItem.innerHTML = `
        <div class="file-info">
            <span class="file-icon">${fileIcon}</span>
            <div class="file-details">
                <h4>${file.name}</h4>
                <p>${fileSize} • ${file.uploadedAt.toLocaleDateString()}</p>
            </div>
        </div>
        <div class="file-status">
            <span id="status-${file.id}" class="status-badge status-processing">Processing...</span>
            <button onclick="removeFile(${file.id})" class="btn btn-outline btn-sm">Remove</button>
        </div>
    `;
    
    container.appendChild(fileItem);
}

function removeFile(fileId) {
    uploadedFiles = uploadedFiles.filter(file => file.id !== fileId);
    const fileElement = document.getElementById(`file-${fileId}`);
    if (fileElement) {
        fileElement.remove();
    }
}

function simulateAIProcessing() {
    // Simulate AI processing for uploaded files
    uploadedFiles.forEach((file, index) => {
        setTimeout(() => {
            // Simulate GPT Vision tagging
            const tags = generateRealisticTags(file);
            file.tags = tags;
            
            // Simulate transcription for videos
            if (file.type.startsWith('video/')) {
                file.transcript = generateRealisticTranscript();
            }
            
            // Update UI to show processing complete
            updateFileProcessingStatus(file.id, 'completed');
        }, index * 2000 + Math.random() * 3000); // More realistic timing
    });
}

function generateRealisticTags(file) {
    // Generate more realistic tags based on filename and type
    const filename = file.name.toLowerCase();
    let tags = [];
    
    // Analyze filename for context
    if (filename.includes('family') || filename.includes('mom') || filename.includes('dad')) {
        tags.push('family', 'loving', 'together');
    }
    if (filename.includes('beach') || filename.includes('ocean') || filename.includes('water')) {
        tags.push('beach', 'water', 'outdoor', 'relaxing');
    }
    if (filename.includes('food') || filename.includes('cooking') || filename.includes('meal')) {
        tags.push('food', 'cooking', 'delicious', 'indoor');
    }
    if (filename.includes('party') || filename.includes('birthday') || filename.includes('celebration')) {
        tags.push('party', 'celebration', 'fun', 'friends');
    }
    if (filename.includes('travel') || filename.includes('vacation') || filename.includes('trip')) {
        tags.push('travel', 'adventure', 'exploration', 'outdoor');
    }
    if (filename.includes('work') || filename.includes('office') || filename.includes('meeting')) {
        tags.push('work', 'professional', 'business', 'indoor');
    }
    if (filename.includes('pet') || filename.includes('dog') || filename.includes('cat')) {
        tags.push('pets', 'animals', 'cute', 'loving');
    }
    if (filename.includes('sport') || filename.includes('gym') || filename.includes('exercise')) {
        tags.push('sports', 'exercise', 'active', 'healthy');
    }
    
    // Add general tags based on file type
    if (file.type.startsWith('image/')) {
        tags.push('photo', 'image');
    } else if (file.type.startsWith('video/')) {
        tags.push('video', 'motion');
    }
    
    // Add emotional tags
    const emotionalTags = ['happy', 'joyful', 'peaceful', 'exciting', 'memorable', 'special'];
    tags.push(emotionalTags[Math.floor(Math.random() * emotionalTags.length)]);
    
    return tags.length > 0 ? tags : ['memory', 'moment', 'special'];
}

function generateRealisticTranscript() {
    const transcripts = [
        "This is such a beautiful moment. I'm so grateful to be here with the people I love.",
        "The weather is perfect today. I can't believe how lucky we are to experience this.",
        "We're having such a great time together. These are the moments that make life worth living.",
        "I love how everyone is smiling and laughing. This is what happiness looks like.",
        "This place is absolutely amazing. I wish I could stay here forever.",
        "We're making such wonderful memories today. I'll never forget this moment.",
        "Everyone looks so happy and relaxed. This is exactly what we needed.",
        "I'm so proud of what we've accomplished together. This is a special day."
    ];
    
    return transcripts[Math.floor(Math.random() * transcripts.length)];
}

function updateFileProcessingStatus(fileId, status) {
    const statusElement = document.getElementById(`status-${fileId}`);
    if (statusElement) {
        if (status === 'completed') {
            statusElement.textContent = 'Ready';
            statusElement.className = 'status-badge status-ready';
        } else if (status === 'processing') {
            statusElement.textContent = 'Processing...';
            statusElement.className = 'status-badge status-processing';
        }
    }
}

// Search functionality
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}

function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        showNotification('Please enter a search query', 'error');
        return;
    }
    
    if (uploadedFiles.length === 0) {
        showNotification('Please upload some files first to search through them', 'error');
        return;
    }
    
    // Show loading state
    showSearchLoading();
    
    // Simulate AI search processing
    setTimeout(() => {
        const results = semanticSearch(query, uploadedFiles);
        displaySearchResults(results, query);
    }, 1500);
}

function quickSearch(query) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = query;
        performSearch();
    }
}

function showSearchLoading() {
    const resultsDiv = document.getElementById('searchResults');
    const resultsList = document.getElementById('resultsList');
    
    if (resultsDiv) {
        resultsDiv.classList.remove('hidden');
    }
    
    if (resultsList) {
        resultsList.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div class="spinner" style="margin: 0 auto 1rem;"></div>
                <p>AI is analyzing your memories...</p>
            </div>
        `;
    }
}

function semanticSearch(query, files) {
    // Advanced semantic search simulation
    const queryLower = query.toLowerCase();
    const results = [];
    
    // Define semantic mappings
    const semanticMappings = {
        'happy': ['happy', 'smiling', 'joy', 'laughing', 'fun', 'celebration', 'positive', 'joyful', 'memorable'],
        'family': ['family', 'parents', 'children', 'siblings', 'relatives', 'home', 'together', 'loving', 'mom', 'dad'],
        'travel': ['travel', 'vacation', 'beach', 'mountains', 'adventure', 'explore', 'journey', 'trip', 'outdoor'],
        'food': ['food', 'cooking', 'restaurant', 'meal', 'delicious', 'dinner', 'lunch', 'eat', 'kitchen'],
        'friends': ['friends', 'party', 'social', 'group', 'together', 'fun', 'celebration', 'birthday'],
        'work': ['work', 'office', 'meeting', 'professional', 'business', 'career', 'team'],
        'nature': ['nature', 'outdoor', 'sunny', 'beautiful', 'landscape', 'green', 'blue', 'water', 'beach'],
        'pets': ['pets', 'animals', 'dog', 'cat', 'cute', 'loving', 'companion', 'pet'],
        'sports': ['sports', 'exercise', 'active', 'healthy', 'fitness', 'running', 'gym', 'workout'],
        'video': ['video', 'motion', 'mp4', 'mov', 'avi'],
        'photo': ['photo', 'image', 'jpg', 'jpeg', 'png', 'picture']
    };
    
    files.forEach(file => {
        let relevanceScore = 0;
        let matchedTags = [];
        
        // Check tags for relevance
        if (file.tags && file.tags.length > 0) {
            file.tags.forEach(tag => {
                Object.keys(semanticMappings).forEach(concept => {
                    if (semanticMappings[concept].includes(tag.toLowerCase())) {
                        if (queryLower.includes(concept) || semanticMappings[concept].some(keyword => queryLower.includes(keyword))) {
                            relevanceScore += 10;
                            matchedTags.push(tag);
                        }
                    }
                });
            });
        }
        
        // Check transcript for videos
        if (file.transcript) {
            const transcriptLower = file.transcript.toLowerCase();
            Object.keys(semanticMappings).forEach(concept => {
                if (queryLower.includes(concept)) {
                    semanticMappings[concept].forEach(keyword => {
                        if (transcriptLower.includes(keyword)) {
                            relevanceScore += 5;
                        }
                    });
                }
            });
        }
        
        // Check filename
        const filenameLower = file.name.toLowerCase();
        Object.keys(semanticMappings).forEach(concept => {
            if (queryLower.includes(concept)) {
                semanticMappings[concept].forEach(keyword => {
                    if (filenameLower.includes(keyword)) {
                        relevanceScore += 2;
                    }
                });
            }
        });
        
        // Direct keyword matching in query
        const queryWords = queryLower.split(' ');
        queryWords.forEach(word => {
            if (file.tags && file.tags.some(tag => tag.toLowerCase().includes(word))) {
                relevanceScore += 3;
                matchedTags.push(word);
            }
            if (filenameLower.includes(word)) {
                relevanceScore += 1;
            }
        });
        
        // Add to results if relevant
        if (relevanceScore > 0) {
            results.push({
                file: file,
                score: relevanceScore,
                matchedTags: [...new Set(matchedTags)] // Remove duplicates
            });
        }
    });
    
    // Sort by relevance score
    results.sort((a, b) => b.score - a.score);
    return results;
}

function displaySearchResults(results, query) {
    const resultsDiv = document.getElementById('searchResults');
    const resultsList = document.getElementById('resultsList');
    const resultCount = document.getElementById('resultCount');
    
    if (!resultsDiv || !resultsList || !resultCount) return;
    
    if (results.length === 0) {
        resultsList.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                <p>No memories found for "${query}"</p>
                <p style="font-size: 0.875rem; color: var(--text-light);">Try different keywords or upload more files</p>
            </div>
        `;
        resultCount.textContent = '0 results';
    } else {
        resultCount.textContent = `${results.length} result${results.length !== 1 ? 's' : ''} found`;
        
        resultsList.innerHTML = results.map(result => {
            const file = result.file;
            const fileIcon = file.type.startsWith('image/') ? '🖼️' : '🎥';
            const fileSize = (file.size / 1024 / 1024).toFixed(1) + ' MB';
            const relevancePercent = Math.min(100, (result.score / 20) * 100);
            
            return `
                <div class="result-item">
                    <div class="result-info">
                        <span class="file-icon">${fileIcon}</span>
                        <div class="result-details">
                            <h4>${file.name}</h4>
                            <p>${fileSize} • ${file.uploadedAt.toLocaleDateString()}</p>
                            ${result.matchedTags.length > 0 ? `<p class="result-tags">Tags: ${result.matchedTags.join(', ')}</p>` : ''}
                        </div>
                    </div>
                    <div class="result-actions">
                        <div class="relevance-score">
                            <div class="relevance-percentage">${relevancePercent.toFixed(0)}% match</div>
                            <div class="relevance-bar">
                                <div class="relevance-fill" style="width: ${relevancePercent}%"></div>
                            </div>
                        </div>
                        <button onclick="selectForStory('${file.id}')" class="btn btn-primary btn-sm">
                            Select
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    resultsDiv.classList.remove('hidden');
}

// Story generation functionality
function initStoryGeneration() {
    // Initialize story generation UI
    updateSelectedFilesList();
    updateGenerateButton();
}

function selectForStory(fileId) {
    const file = uploadedFiles.find(f => f.id == fileId);
    if (file && !selectedFilesForStory.find(f => f.id == fileId)) {
        selectedFilesForStory.push(file);
        updateSelectedFilesList();
        updateGenerateButton();
        showNotification('File added to story selection', 'success');
    }
}

function removeFromStory(fileId) {
    selectedFilesForStory = selectedFilesForStory.filter(f => f.id != fileId);
    updateSelectedFilesList();
    updateGenerateButton();
}

function updateSelectedFilesList() {
    const container = document.getElementById('selectedFilesList');
    if (!container) return;
    
    if (selectedFilesForStory.length === 0) {
        container.innerHTML = '<p class="no-files">No files selected. Search and select files to create a story.</p>';
    } else {
        container.innerHTML = selectedFilesForStory.map(file => {
            const fileIcon = file.type.startsWith('image/') ? '🖼️' : '🎥';
            return `
                <div class="selected-file-item">
                    <div class="file-info">
                        <span class="file-icon">${fileIcon}</span>
                        <div class="file-details">
                            <h4>${file.name}</h4>
                        </div>
                    </div>
                    <button onclick="removeFromStory(${file.id})" class="btn btn-outline btn-sm">Remove</button>
                </div>
            `;
        }).join('');
    }
}

function updateGenerateButton() {
    const generateBtn = document.getElementById('generateBtn');
    if (!generateBtn) return;
    
    if (selectedFilesForStory.length === 0) {
        generateBtn.disabled = true;
        generateBtn.textContent = 'Select files to create story';
    } else {
        generateBtn.disabled = false;
        generateBtn.textContent = `✨ Generate "Best of Us" Story (${selectedFilesForStory.length} memories)`;
    }
}

function generateStory() {
    if (selectedFilesForStory.length === 0) {
        showNotification('Please select some files first', 'error');
        return;
    }
    
    const prompt = document.getElementById('storyPrompt').value.trim();
    const style = document.getElementById('storyStyle').value;
    
    // Show progress
    const progressDiv = document.getElementById('storyProgress');
    const storyDiv = document.getElementById('generatedStory');
    
    if (progressDiv) {
        progressDiv.classList.remove('hidden');
    }
    
    if (storyDiv) {
        storyDiv.classList.add('hidden');
    }
    
    // Simulate AI story generation
    setTimeout(() => {
        const story = createBestOfUsStory(selectedFilesForStory, prompt, style);
        displayGeneratedStory(story);
    }, 3000);
}

function createBestOfUsStory(files, prompt, style) {
    // Generate "Best of Us" story based on selected files
    const storyTemplates = {
        inspirational: {
            title: "The Light Within: A Journey of Joy",
            content: `In the tapestry of life, these moments stand as beacons of light, illuminating the path of human connection and joy. Each memory you've captured represents not just a moment in time, but a testament to the beauty that exists in our everyday experiences.

            ${files.map((file, index) => {
                const tags = file.tags ? file.tags.join(', ') : 'beautiful moment';
                return `The ${index + 1}${getOrdinalSuffix(index + 1)} memory, "${file.name}", captures the essence of ${tags}. This moment reminds us that happiness isn't found in grand gestures, but in the simple, authentic connections we share with others.`;
            }).join(' ')}

            These memories form a constellation of human experience, each one a star in the vast sky of our collective journey. They remind us that we are all connected by the universal language of joy, love, and shared experience. This is the "Best of Us" - not in our achievements, but in our capacity to find meaning and beauty in the moments that matter most.

            As we reflect on these captured memories, we see not just individual moments, but the threads that weave together the fabric of human connection. Each smile, each shared laugh, each quiet moment of understanding represents the best of what it means to be human.`
        },
        documentary: {
            title: "Moments in Time: A Documentary of Human Experience",
            content: `This collection of memories presents a thoughtful examination of human experience through the lens of everyday moments. Each captured memory offers insight into the patterns and rhythms that define our lives.

            ${files.map((file, index) => {
                const tags = file.tags ? file.tags.join(', ') : 'significant moment';
                return `Memory ${index + 1}, documented as "${file.name}", reveals aspects of ${tags}. This documentation serves as evidence of the rich tapestry of human experience that unfolds in our daily lives.`;
            }).join(' ')}

            Through careful observation of these moments, we can identify recurring themes of connection, growth, and meaning-making that characterize the human experience. These memories serve as data points in the larger story of what it means to live a meaningful life.

            The "Best of Us" emerges not from individual achievements, but from our collective ability to create, preserve, and share moments of genuine human connection.`
        },
        romantic: {
            title: "Love's Tapestry: A Romantic Journey Through Time",
            content: `In the gentle embrace of memory, we find the most tender expressions of human love and connection. These moments, captured like pressed flowers in the book of time, tell a story of hearts finding their way to one another.

            ${files.map((file, index) => {
                const tags = file.tags ? file.tags.join(', ') : 'tender moment';
                return `The ${index + 1}${getOrdinalSuffix(index + 1)} memory, "${file.name}", holds within it the warmth of ${tags}. Like a love letter written in light and shadow, this moment speaks to the eternal dance of human connection.`;
            }).join(' ')}

            These memories are love made visible - not just romantic love, but the love that flows between friends, family, and even strangers who share a moment of understanding. They are proof that love is not just an emotion, but a force that shapes our world.

            In the "Best of Us," we find love in its purest form: the willingness to be present, to care, and to celebrate the beauty of another soul. These memories are love's poetry, written in the language of shared experience.`
        },
        adventure: {
            title: "The Great Adventure: Tales of Discovery and Wonder",
            content: `Life is the greatest adventure of all, and these memories are the chapters of an epic tale written in moments of discovery, wonder, and bold exploration. Each memory represents a step into the unknown, a leap of faith into the possibilities of human experience.

            ${files.map((file, index) => {
                const tags = file.tags ? file.tags.join(', ') : 'adventurous moment';
                return `Adventure ${index + 1}, captured in "${file.name}", tells the story of ${tags}. This moment represents the spirit of exploration that drives us to seek new experiences and push beyond our comfort zones.`;
            }).join(' ')}

            These memories are the souvenirs of a life well-lived, collected not from distant lands, but from the uncharted territories of human connection and personal growth. They remind us that every day offers the opportunity for a new adventure.

            The "Best of Us" is found in our courage to embrace the unknown, to take risks in the name of love and connection, and to see every moment as an opportunity for discovery and wonder.`
        },
        family: {
            title: "The Bonds That Matter: A Family's Journey Through Time",
            content: `In the heart of every family lies a story of love, growth, and unbreakable bonds. These memories are the pages of that story, written in laughter, tears, and the quiet moments that define what it means to belong to something greater than ourselves.

            ${files.map((file, index) => {
                const tags = file.tags ? file.tags.join(', ') : 'family moment';
                return `The ${index + 1}${getOrdinalSuffix(index + 1)} memory, "${file.name}", captures the essence of ${tags}. This moment is a thread in the tapestry of family life, woven with love, understanding, and the shared experiences that create lasting bonds.`;
            }).join(' ')}

            These memories are the foundation upon which families are built - not grand gestures or perfect moments, but the everyday acts of love, support, and togetherness that create the strongest bonds. They are proof that family is not just about blood, but about the people who choose to love and support us through life's journey.

            In the "Best of Us," we find family in its purest form: the unconditional love, the shared laughter, the quiet support, and the knowledge that we are never alone in this world. These memories are the legacy we leave behind, the proof that love endures.`
        }
    };
    
    return storyTemplates[style] || storyTemplates.inspirational;
}

function getOrdinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    if (j == 1 && k != 11) return "st";
    if (j == 2 && k != 12) return "nd";
    if (j == 3 && k != 13) return "rd";
    return "th";
}

function displayGeneratedStory(story) {
    const progressDiv = document.getElementById('storyProgress');
    const storyDiv = document.getElementById('generatedStory');
    const storyContent = document.getElementById('storyContent');
    
    if (progressDiv) {
        progressDiv.classList.add('hidden');
    }
    
    if (storyDiv) {
        storyDiv.classList.remove('hidden');
    }
    
    if (storyContent) {
        storyContent.innerHTML = `
            <h2>${story.title}</h2>
            <div class="story-text">
                ${story.content.split('\n\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
            </div>
            <div style="margin-top: 2rem; padding: 1rem; background: var(--bg-primary); border-radius: 0.5rem; border: 1px solid var(--border-color);">
                <p style="font-size: 0.875rem; color: var(--text-light); margin: 0;">
                    ✨ Generated by "Best of Us" AI • ${selectedFilesForStory.length} memories • ${new Date().toLocaleDateString()}
                </p>
            </div>
        `;
    }
}

function shareStory() {
    const storyContent = document.getElementById('storyContent');
    if (storyContent) {
        const text = storyContent.textContent;
        if (navigator.share) {
            navigator.share({
                title: 'My "Best of Us" Story',
                text: text,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(text).then(() => {
                showNotification('Story copied to clipboard!', 'success');
            });
        }
    }
}

function downloadStory() {
    const storyContent = document.getElementById('storyContent');
    if (storyContent) {
        const text = storyContent.textContent;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'best-of-us-story.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Story downloaded!', 'success');
    }
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 3000;
            max-width: 400px;
            border-radius: 0.5rem;
            box-shadow: var(--shadow-lg);
            animation: slideIn 0.3s ease;
        }
        
        .notification-info {
            background: #3b82f6;
            color: white;
        }
        
        .notification-success {
            background: #10b981;
            color: white;
        }
        
        .notification-error {
            background: #ef4444;
            color: white;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: inherit;
            font-size: 1.25rem;
            cursor: pointer;
            margin-left: 1rem;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    
    if (!document.querySelector('#notification-styles')) {
        style.id = 'notification-styles';
        document.head.appendChild(style);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
    
    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}

// Export functions for global access
window.removeFile = removeFile;
window.selectForStory = selectForStory;
window.removeFromStory = removeFromStory;
window.performSearch = performSearch;
window.quickSearch = quickSearch;
window.generateStory = generateStory;
window.shareStory = shareStory;
window.downloadStory = downloadStory;
window.logout = logout;
