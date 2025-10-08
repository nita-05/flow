// Google Photos Picker integration using Google Picker API
// Simplified implementation to avoid OAuth issues

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '724469503053-hdt6qkhvj8ussdvfgaqq7qj5374l279j.apps.googleusercontent.com';
const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || 'AlzaSyBLIEAs1N4ZVjVEK7hXHkXur9_HeBKuhl0';

// Use both scopes for comprehensive photo access
const SCOPES = [
  'https://www.googleapis.com/auth/photoslibrary.readonly',
  'https://www.googleapis.com/auth/drive.readonly'
].join(' ');

let apiLoaded = false;
let authInitialized = false;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    try {
      if (typeof document === 'undefined') {
        reject(new Error('Document not available'));
        return;
      }
      
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => {
        console.log(`Script loaded: ${src}`);
        resolve();
      };
      script.onerror = (error) => {
        console.error(`Failed to load script: ${src}`, error);
        reject(new Error(`Failed to load script: ${src}`));
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('Script loading error:', error);
      reject(error);
    }
  });
}

async function loadGoogleAPIs() {
  try {
    // Check if window is available
    if (typeof window === 'undefined') {
      throw new Error('Window object not available');
    }

    // Load Google Identity Services first (simpler approach)
    console.log('Loading Google Identity Services...');
    await loadScript('https://accounts.google.com/gsi/client');
    
    // Wait for google object to be available
    let attempts = 0;
    while (!window.google && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!window.google) {
      throw new Error('Google Identity Services failed to load');
    }
    
    console.log('Google Identity Services loaded successfully');

    // Load Google API and Picker (only if not already loaded)
    if (!apiLoaded) {
      console.log('Loading Google API...');
      await loadScript('https://apis.google.com/js/api.js');
      
      // Wait for gapi to be available
      attempts = 0;
      while (!window.gapi && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!window.gapi) {
        throw new Error('Google API failed to load');
      }
      
      await new Promise((resolve, reject) => {
        try {
          window.gapi.load('picker', {
            callback: resolve,
            onerror: reject
          });
        } catch (error) {
          reject(error);
        }
      });
      apiLoaded = true;
      console.log('Google API and Picker loaded successfully');
    }

    return true;
  } catch (error) {
    console.error('Failed to load Google APIs:', error);
    throw new Error(`Failed to load Google APIs: ${error.message}`);
  }
}

async function getAccessToken() {
  return new Promise((resolve, reject) => {
    try {
      console.log('Getting access token...');
      
      // Check if Google Identity Services is available
      if (!window.google || !window.google.accounts) {
        reject(new Error('Google Identity Services not loaded'));
        return;
      }

      // Use Google Identity Services for token
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          console.log('Token callback received:', response);
          if (response && response.access_token) {
            console.log('Access token obtained successfully');
            resolve(response.access_token);
          } else if (response && response.error) {
            console.error('OAuth error:', response.error);
            reject(new Error(`OAuth error: ${response.error}`));
          } else {
            console.error('Failed to obtain access token');
            reject(new Error('Failed to obtain access token'));
          }
        }
      });
      
      console.log('Requesting access token...');
      tokenClient.requestAccessToken({ prompt: 'consent' });

    } catch (error) {
      console.error('Authentication setup failed:', error);
      reject(new Error(`Authentication setup failed: ${error.message}`));
    }
  });
}

export async function pickGooglePhotos(maxResults = 20) {
  try {
    console.log('Starting Google Photos picker...');
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('Google Photos picker requires a browser environment');
    }
    
    // Load Google APIs
    await loadGoogleAPIs();
    console.log('Google APIs loaded successfully');
    
    // Get access token
    const accessToken = await getAccessToken();
    console.log('Access token obtained');
    
    // Check if Google Picker is available
    if (!window.google || !window.google.picker) {
      throw new Error('Google Picker API not loaded');
    }

    // Create picker with both Google Photos and Drive views
    const picker = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.PHOTOS) // Google Photos view
      .addView(window.google.picker.ViewId.DOCS_IMAGES) // Google Drive images
      .setOAuthToken(accessToken)
      .setOrigin(window.location.origin) // Set origin for better compatibility
      .setCallback((data) => {
        try {
          console.log('Picker callback:', data);
          if (data && data.action === window.google.picker.Action.PICKED) {
            const files = (data.docs || []).map(doc => ({
              id: doc.id || `file-${Date.now()}`,
              name: doc.name || 'Unknown file',
              url: doc.url || '',
              thumbnailUrl: doc.thumbnailUrl || doc.url || '',
              mimeType: doc.mimeType || 'image/jpeg',
              sizeBytes: doc.sizeBytes || 0
            }));
            
            console.log('Selected files:', files);
            if (window.googlePhotosPickerResolve) {
              window.googlePhotosPickerResolve(files);
              window.googlePhotosPickerResolve = null;
            }
          } else if (data && data.action === window.google.picker.Action.CANCEL) {
            console.log('Picker cancelled');
            if (window.googlePhotosPickerResolve) {
              window.googlePhotosPickerResolve([]);
              window.googlePhotosPickerResolve = null;
            }
          }
        } catch (callbackError) {
          console.error('Picker callback error:', callbackError);
          if (window.googlePhotosPickerResolve) {
            window.googlePhotosPickerResolve([]);
            window.googlePhotosPickerResolve = null;
          }
        }
      })
      .build();

    // Show picker and return promise
    return new Promise((resolve, reject) => {
      try {
        window.googlePhotosPickerResolve = resolve;
        
        // Set a timeout to prevent hanging
        const timeoutId = setTimeout(() => {
          if (window.googlePhotosPickerResolve === resolve) {
            window.googlePhotosPickerResolve = null;
            reject(new Error('Google Photos picker timed out'));
          }
        }, 60000); // 60 second timeout
        
        // Clear timeout if resolved
        const originalResolve = resolve;
        window.googlePhotosPickerResolve = (result) => {
          clearTimeout(timeoutId);
          originalResolve(result);
        };
        
        console.log('Showing picker...');
        picker.setVisible(true);
      } catch (promiseError) {
        console.error('Promise setup error:', promiseError);
        reject(new Error(`Failed to setup picker: ${promiseError.message}`));
      }
    });

  } catch (error) {
    console.error('Google Photos picker error:', error);
    throw new Error(`Failed to open Google Photos picker: ${error.message || 'Unknown error'}`);
  }
}

const googlePhotosService = {
  pickGooglePhotos
};

export default googlePhotosService;