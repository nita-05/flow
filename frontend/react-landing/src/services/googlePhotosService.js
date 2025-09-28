// Lightweight Google Photos Picker integration for React apps
// Requires two env vars set in the frontend build env:
//   REACT_APP_GOOGLE_API_KEY
//   REACT_APP_GOOGLE_CLIENT_ID
//
// Notes:
// - This uses Google Picker (Photos view) which is quick to integrate for selection.
// - Selected items are returned with name and URL (may be a thumbnail URL for preview).
// - For full-resolution downloads you'd typically use the Google Photos Library API.

// Use environment variables or fallback to a working approach
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '724469503053-hdt6qkhvj8ussdvfgaqq7qj5374l279j.apps.googleusercontent.com';

// Request the minimum scope to avoid Google verification for production.
// For local testing, keeping only Photos Library read-only usually suffices.
const SCOPES = [
  'https://www.googleapis.com/auth/photoslibrary.readonly',
  'https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata'
].join(' ');


function injectScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}




export async function pickGooglePhotos(maxResults = 20) {
  // Google Photos integration permanently disabled due to persistent OAuth 403 errors
  // The regular file upload provides the same functionality without OAuth issues
  alert('Google Photos integration is currently unavailable due to OAuth configuration issues. Please use "Choose Files" to upload your photos from your computer - it works perfectly and provides the same AI story generation!');
  return [];
}

const googlePhotosService = {
  pickGooglePhotos
};

export default googlePhotosService;