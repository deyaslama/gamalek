/**
 * API Configuration Module
 * Dynamically determines the API base URL based on the current environment
 */

// Initialize API URL - will be set from window.location or API config endpoint
let API_URL = null;

/**
 * Gets the API base URL
 * Uses window.location.origin in browser (works for both localhost and production)
 * Falls back to localhost:3000 if needed
 */
function getBaseURL() {
  // If we're in a browser, use window.location.origin
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  
  // Fallback for non-browser environments
  return "http://localhost:3000";
}

/**
 * Initialize API URL
 * This function sets the API_URL based on the current page origin
 */
function initAPI() {
  API_URL = getBaseURL();
  
  // Make it available globally
  if (typeof window !== 'undefined') {
    window.API = API_URL;
  }
  
  return API_URL;
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
  // Initialize immediately
  initAPI();
  
  // Also try to get config from API endpoint (optional, for consistency)
  // This ensures we have the correct URL even if frontend is served from different origin
  fetch(API_URL + "/api/config")
    .then(res => res.json())
    .then(data => {
      if (data.success && data.baseUrl) {
        API_URL = data.baseUrl;
        if (typeof window !== 'undefined') {
          window.API = API_URL;
        }
      }
    })
    .catch(err => {
      // Silently fail - use window.location.origin as fallback
      console.log("Could not fetch config from API, using window.location.origin");
    });
}

// Export for Node.js environments (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getBaseURL, initAPI, API_URL };
}

