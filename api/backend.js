/**
 * Vercel Serverless Function Wrapper for Backend
 *
 * This file wraps the main backend Express app for Vercel's serverless environment.
 * It exports the app as a serverless function handler.
 */

// Import the backend app
const app = require('../backend/index.js');

// Export as Vercel serverless function
module.exports = app;
