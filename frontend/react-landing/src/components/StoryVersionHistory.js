import React, { useState, useEffect, useCallback } from 'react';
import storyService from '../services/storyService';

const StoryVersionHistory = ({ story, onRestore, onClose }) => {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    loadVersions();
  }, [story._id]);

  const loadVersions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await storyService.getStoryVersions(story._id);
      if (response.versions) {
        setVersions(response.versions);
        setSelectedVersion(response.versions[0]); // Select current version by default
      }
    } catch (error) {
      console.error('Failed to load story versions:', error);
      alert('Failed to load version history: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [story._id]);

  const handleRestoreVersion = async (version) => {
    if (version.version === story.version) {
      alert('This is already the current version');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to restore to version ${version.version}? This will create a new version with the restored content.`
    );

    if (!confirmed) return;

    setIsRestoring(true);
    try {
      const result = await storyService.restoreStoryVersion(story._id, version.version);
      
      if (result.story) {
        alert(`Successfully restored to version ${version.version}`);
        onRestore(result.story);
        loadVersions(); // Reload versions
      }
    } catch (error) {
      console.error('Failed to restore version:', error);
      alert('Failed to restore version: ' + error.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getVersionBadgeColor = (version, currentVersion) => {
    if (version.version === currentVersion) {
      return 'bg-green-900 text-green-300';
    }
    return 'bg-gray-700 text-gray-300';
  };

  if (isLoading) {
    return (
      <div className="story-version-history bg-gray-900 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-300">Loading version history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="story-version-history bg-gray-900 rounded-2xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Version History</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Version List */}
        <div>
          <h4 className="text-lg font-medium text-white mb-4">Versions</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {versions.map((version) => (
              <div
                key={version.version}
                onClick={() => setSelectedVersion(version)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedVersion?.version === version.version
                    ? 'bg-primary-900 border border-primary-700'
                    : 'bg-gray-800 hover:bg-gray-750'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getVersionBadgeColor(version, story.version)}`}>
                    Version {version.version}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(version.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-2">
                  {version.changes}
                </p>
                <div className="text-xs text-gray-400">
                  {version.content.split(' ').length} words
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Version Content */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-white">Content Preview</h4>
            {selectedVersion && selectedVersion.version !== story.version && (
              <button
                onClick={() => handleRestoreVersion(selectedVersion)}
                disabled={isRestoring}
                className="btn-primary text-sm"
              >
                {isRestoring ? 'Restoring...' : 'Restore This Version'}
              </button>
            )}
          </div>

          {selectedVersion ? (
            <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="mb-3 text-sm text-gray-400">
                <strong>Version {selectedVersion.version}</strong> • {formatDate(selectedVersion.createdAt)}
                <br />
                <em>{selectedVersion.changes}</em>
              </div>
              <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                {selectedVersion.content}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
              Select a version to preview its content
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {versions.length} version{versions.length !== 1 ? 's' : ''} total
          </div>
          <button onClick={onClose} className="btn-outline">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryVersionHistory;
