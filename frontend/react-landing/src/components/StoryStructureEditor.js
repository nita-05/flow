import React, { useState, useEffect } from 'react';
import storyService from '../services/storyService';
import fileService from '../services/fileService';

const StoryStructureEditor = ({ story, onSave, onCancel }) => {
  const [files, setFiles] = useState([]);
  const [availableFiles, setAvailableFiles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (story && story.files) {
      setFiles([...story.files]);
    }
  }, [story]);

  useEffect(() => {
    loadAvailableFiles();
  }, []);

  const loadAvailableFiles = async () => {
    try {
      const response = await fileService.getFiles({ status: 'completed' });
      if (response.files) {
        setAvailableFiles(response.files);
      }
    } catch (error) {
      console.error('Failed to load available files:', error);
    }
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex !== dropIndex) {
      const newFiles = [...files];
      const draggedFile = newFiles[dragIndex];
      newFiles.splice(dragIndex, 1);
      newFiles.splice(dropIndex, 0, draggedFile);
      
      // Update order
      const updatedFiles = newFiles.map((file, index) => ({
        ...file,
        order: index
      }));
      
      setFiles(updatedFiles);
    }
  };

  const handleRemoveFile = (fileId) => {
    const newFiles = files.filter(f => f.fileId !== fileId);
    const updatedFiles = newFiles.map((file, index) => ({
      ...file,
      order: index
    }));
    setFiles(updatedFiles);
  };

  const handleAddFile = (file) => {
    const newFile = {
      fileId: file._id,
      order: files.length,
      timestamp: null,
      caption: null
    };
    setFiles([...files, newFile]);
  };

  const handleSave = async () => {
    if (files.length === 0) {
      alert('Story must have at least one file');
      return;
    }

    setIsSaving(true);
    try {
      const result = await storyService.updateStoryStructure(story._id, files);
      
      if (result.story) {
        onSave(result.story);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save story structure:', error);
      alert('Failed to save story structure: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFiles([...story.files]);
    setIsEditing(false);
    onCancel();
  };

  const filteredAvailableFiles = availableFiles.filter(file => 
    !files.some(f => f.fileId === file._id) &&
    (file.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
     file.visionTags?.some(tag => tag.tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  if (!story) return null;

  return (
    <div className="story-structure-editor bg-gray-900 rounded-2xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Edit Story Structure</h3>
        <div className="text-sm text-gray-400">
          {files.length} file{files.length !== 1 ? 's' : ''} in story
        </div>
      </div>

      {!isEditing ? (
        <div className="space-y-4">
          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={file.fileId} className="bg-gray-800 rounded-lg p-4 flex items-center space-x-3">
                <div className="text-2xl">{fileService.getFileTypeIcon(file.fileId.fileType)}</div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">{file.fileId.originalName}</h4>
                  <p className="text-sm text-gray-400">
                    {fileService.formatFileSize(file.fileId.fileSize)} • Order: {file.order + 1}
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(file.fileId.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-3">
            <button 
              onClick={() => setIsEditing(true)}
              className="btn-primary"
            >
              Edit Structure
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
          {/* Current Files */}
          <div>
            <h4 className="text-lg font-medium text-white mb-3">Story Files (Drag to reorder)</h4>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={file.fileId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className="bg-gray-800 rounded-lg p-4 flex items-center space-x-3 cursor-move hover:bg-gray-750 transition-colors"
                >
                  <div className="text-gray-400 text-sm font-mono w-8">
                    {index + 1}
                  </div>
                  <div className="text-2xl">{fileService.getFileTypeIcon(file.fileId.fileType)}</div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{file.fileId.originalName}</h4>
                    <p className="text-sm text-gray-400">
                      {fileService.formatFileSize(file.fileId.fileSize)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(file.fileId)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Files */}
          <div>
            <h4 className="text-lg font-medium text-white mb-3">Add Files to Story</h4>
            
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-900"
                placeholder="Search files..."
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredAvailableFiles.map((file) => (
                <div key={file._id} className="bg-gray-800 rounded-lg p-3 flex items-center space-x-3">
                  <div className="text-xl">{fileService.getFileTypeIcon(file.fileType)}</div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{file.originalName}</h4>
                    <p className="text-sm text-gray-400">
                      {fileService.formatFileSize(file.fileSize)} • {file.fileType}
                    </p>
                    {file.visionTags && file.visionTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {file.visionTags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="bg-gray-700 text-gray-300 px-1 py-0.5 rounded text-xs">
                            {tag.tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddFile(file)}
                    className="btn-secondary text-sm"
                  >
                    Add
                  </button>
                </div>
              ))}
              
              {filteredAvailableFiles.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  {searchQuery ? 'No files found matching your search' : 'No available files to add'}
                </div>
              )}
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
              disabled={isSaving || files.length === 0}
            >
              {isSaving ? 'Saving...' : 'Save Structure'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryStructureEditor;
