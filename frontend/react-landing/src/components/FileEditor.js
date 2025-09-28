import React, { useState, useEffect } from 'react';
import fileService from '../services/fileService';

const FileEditor = ({ file, onSave, onCancel }) => {
  const [tags, setTags] = useState([]);
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    if (file) {
      setTags(file.visionTags?.map(t => t.tag) || []);
      setDescription(file.aiDescription || '');
      setCategories(file.categories || []);
      setKeywords(file.keywords || []);
    }
  }, [file]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddCategory = () => {
    if (categoryInput.trim() && !categories.includes(categoryInput.trim())) {
      setCategories([...categories, categoryInput.trim()]);
      setCategoryInput('');
    }
  };

  const handleRemoveCategory = (categoryToRemove) => {
    setCategories(categories.filter(category => category !== categoryToRemove));
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove) => {
    setKeywords(keywords.filter(keyword => keyword !== keywordToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const metadata = {
        tags,
        description,
        categories,
        keywords
      };

      const validation = fileService.validateFileMetadata(metadata);
      if (!validation.isValid) {
        alert('Validation errors: ' + validation.errors.join(', '));
        return;
      }

      const result = await fileService.updateFileMetadata(file._id, metadata);
      
      if (result.file) {
        onSave(result.file);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save file metadata:', error);
      alert('Failed to save file metadata: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTags(file.visionTags?.map(t => t.tag) || []);
    setDescription(file.aiDescription || '');
    setCategories(file.categories || []);
    setKeywords(file.keywords || []);
    setIsEditing(false);
    onCancel();
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  if (!file) return null;

  return (
    <div className="file-editor bg-gray-900 rounded-2xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{fileService.getFileTypeIcon(file.fileType)}</div>
          <div>
            <h3 className="text-lg font-semibold text-white">{file.originalName}</h3>
            <p className="text-sm text-gray-400">
              {fileService.formatFileSize(file.fileSize)} • {file.fileType}
            </p>
          </div>
        </div>
        <div className="text-sm text-gray-400">
          {new Date(file.createdAt).toLocaleDateString()}
        </div>
      </div>

      {!isEditing ? (
        <div className="space-y-6">
          {/* Current Tags */}
          {tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span key={index} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Current Description */}
          {description && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Description</h4>
              <p className="text-gray-300 text-sm bg-gray-800 rounded p-3">
                {description}
              </p>
            </div>
          )}

          {/* Current Categories */}
          {categories.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Categories</h4>
              <div className="flex flex-wrap gap-2">
                {categories.map((category, index) => (
                  <span key={index} className="bg-blue-900 text-blue-300 px-2 py-1 rounded text-sm">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Current Keywords */}
          {keywords.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <span key={index} className="bg-green-900 text-green-300 px-2 py-1 rounded text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button 
              onClick={() => setIsEditing(true)}
              className="btn-primary"
            >
              Edit Metadata
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
        <div className="space-y-6">
          {/* Tags Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag, index) => (
                <span key={index} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm flex items-center">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleAddTag)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-900"
                placeholder="Add a tag..."
              />
              <button onClick={handleAddTag} className="btn-secondary">
                Add
              </button>
            </div>
          </div>

          {/* Description Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-900 resize-none"
              placeholder="Describe this file..."
            />
          </div>

          {/* Categories Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Categories
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {categories.map((category, index) => (
                <span key={index} className="bg-blue-900 text-blue-300 px-2 py-1 rounded text-sm flex items-center">
                  {category}
                  <button
                    onClick={() => handleRemoveCategory(category)}
                    className="ml-2 text-blue-400 hover:text-blue-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleAddCategory)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-900"
                placeholder="Add a category..."
              />
              <button onClick={handleAddCategory} className="btn-secondary">
                Add
              </button>
            </div>
          </div>

          {/* Keywords Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Keywords
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {keywords.map((keyword, index) => (
                <span key={index} className="bg-green-900 text-green-300 px-2 py-1 rounded text-sm flex items-center">
                  {keyword}
                  <button
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="ml-2 text-green-400 hover:text-green-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleAddKeyword)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-900"
                placeholder="Add a keyword..."
              />
              <button onClick={handleAddKeyword} className="btn-secondary">
                Add
              </button>
            </div>
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
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileEditor;
