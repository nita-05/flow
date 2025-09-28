import React, { useState, useEffect } from 'react';
import storyService from '../services/storyService';

const StoryEditor = ({ story, onSave, onCancel }) => {
  const [content, setContent] = useState(story.content || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [changes, setChanges] = useState('');
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    setContent(story.content || '');
    setWordCount(story.content ? story.content.split(' ').length : 0);
  }, [story.content]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setWordCount(newContent.split(' ').length);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      alert('Story content cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const result = await storyService.updateStoryContent(
        story._id, 
        content, 
        changes || 'Content manually edited'
      );
      
      if (result.story) {
        onSave(result.story);
        setIsEditing(false);
        setChanges('');
      }
    } catch (error) {
      console.error('Failed to save story:', error);
      alert('Failed to save story: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setContent(story.content || '');
    setChanges('');
    setIsEditing(false);
    onCancel();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="story-editor bg-gray-900 rounded-2xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">Edit Story Content</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>Version {story.version}</span>
        </div>
      </div>

      {!isEditing ? (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
              {content}
            </p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setIsEditing(true)}
              className="btn-primary"
            >
              Edit Content
            </button>
            <button 
              onClick={onCancel}
              className="btn-outline"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Story Content
            </label>
            <textarea
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              className="w-full h-64 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-900 resize-none"
              placeholder="Write your story content here..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Change Description (Optional)
            </label>
            <input
              type="text"
              value={changes}
              onChange={(e) => setChanges(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-900"
              placeholder="Describe what you changed..."
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {wordCount} words • {Math.ceil(wordCount / 200)} min read
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={handleCancel}
                className="btn-outline"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="btn-primary"
                disabled={isSaving || !content.trim()}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryEditor;
