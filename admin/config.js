/**
 * Admin API Configuration
 * Dynamically determines the API base URL
 */

// Initialize API URL from window.location.origin (works for both localhost and production)
const API = window.location.origin;

// Make it available globally
window.API = API;

