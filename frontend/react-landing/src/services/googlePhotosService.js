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
// const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || '';
// const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '724469503053-hdt6qkhvj8ussdvfgaqq7qj5374l279j.apps.googleusercontent.com';

// Request the minimum scope to avoid Google verification for production.
// For local testing, keeping only Photos Library read-only usually suffices.
// const SCOPES = [
//   'https://www.googleapis.com/auth/photoslibrary.readonly',
//   'https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata'
// ].join(' ');

// let gapiLoaded = false;
// let pickerLoaded = false;
// let gisLoaded = false;

// function injectScript(src) {
//   return new Promise((resolve, reject) => {
//     const existing = document.querySelector(`script[src="${src}"]`);
//     if (existing) {
//       existing.addEventListener('load', () => resolve());
//       resolve();
//       return;
//     }
//     const script = document.createElement('script');
//     script.src = src;
//     script.async = true;
//     script.defer = true;
//     script.onload = () => resolve();
//     script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
//     document.body.appendChild(script);
//   });
// }

// async function loadGapi() {
//   if (gapiLoaded) return;
//   await injectScript('https://apis.google.com/js/api.js');
//   await new Promise((resolve) => {
//     window.gapi.load('client', resolve);
//   });
//   gapiLoaded = true;
// }

// async function loadPicker() {
//   if (pickerLoaded) return;
//   await injectScript('https://apis.google.com/js/api.js');
//   await new Promise((resolve) => {
//     window.gapi.load('picker', resolve);
//   });
//   pickerLoaded = true;
// }

// async function loadGIS() {
//   if (gisLoaded) return;
//   await injectScript('https://accounts.google.com/gsi/client');
//   gisLoaded = true;
// }

// async function ensureAuth() {
//   await loadGIS();
//   // Try silent token first (no extra sign-in). If the user hasn't granted
//   // permission yet, fall back to an interactive consent prompt.
//   const getToken = (requestOptions) => new Promise((resolve, reject) => {
//     try {
//       const tc = window.google.accounts.oauth2.initTokenClient({
//         client_id: GOOGLE_CLIENT_ID,
//         scope: SCOPES,
//         callback: (response) => {
//           if (response && response.access_token) {
//             resolve(response.access_token);
//           } else if (response && response.error) {
//             reject(new Error(response.error));
//           } else {
//             reject(new Error('Failed to obtain Google access token'));
//           }
//         }
//       });
//       tc.requestAccessToken(requestOptions);
//     } catch (err) {
//       reject(err);
//     }
//   });

//   // 1) Silent (uses existing Google session/grant; no prompt)
//   try {
//     return await getToken({ prompt: '', use_fedcm_for_prompt: true });
//   } catch (_) {
//     // 2) Interactive (one-time consent). After this, future calls will be silent
//     try {
//       return await getToken({ prompt: 'consent' });
//     } catch (err) {
//       throw new Error(`Google authentication failed: ${err.message}`);
//     }
//   }
// }

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