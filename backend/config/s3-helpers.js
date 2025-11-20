/**
 * S3 Helper Utilities for NFL Games
 * Provides folder organization and file naming conventions
 */

const crypto = require('crypto');

// Game type constants
const GAME_TYPES = {
  TEAMMATES: 'teammates',
  JOURNEYMAN: 'journeyman',
  TRIVIA: 'trivia',
  SHARED: 'shared'
};

// Asset categories for each game
const ASSET_CATEGORIES = {
  teammates: {
    PLAYERS: 'players',
    TEAMS: 'teams',
    BADGES: 'badges',
    BACKGROUNDS: 'backgrounds',
    UI: 'ui-elements'
  },
  journeyman: {
    PLAYERS: 'players',
    TEAMS: 'teams',
    ROUTES: 'routes',
    BADGES: 'badges',
    BACKGROUNDS: 'backgrounds'
  },
  trivia: {
    QUESTIONS: 'questions',
    CATEGORIES: 'categories',
    REWARDS: 'rewards',
    BACKGROUNDS: 'backgrounds',
    UI: 'ui-elements'
  },
  shared: {
    BACKGROUNDS: 'backgrounds',
    UI: 'ui-elements',
    FONTS: 'fonts',
    ICONS: 'icons',
    TEMPLATES: 'templates'
  }
};

/**
 * Generate S3 key path for a file
 * @param {string} gameType - Game type (teammates, journeyman, trivia, shared)
 * @param {string} category - Asset category (players, teams, etc.)
 * @param {string} filename - Original filename
 * @param {object} options - Additional options
 * @returns {string} S3 key path
 */
function generateS3Key(gameType, category, filename, options = {}) {
  // Validate game type
  if (!Object.values(GAME_TYPES).includes(gameType)) {
    throw new Error(`Invalid game type: ${gameType}`);
  }

  // Validate category
  const validCategories = ASSET_CATEGORIES[gameType];
  if (!validCategories || !Object.values(validCategories).includes(category)) {
    throw new Error(`Invalid category '${category}' for game type '${gameType}'`);
  }

  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(filename);

  // Add timestamp prefix if requested
  let finalFilename = sanitizedFilename;
  if (options.addTimestamp) {
    const timestamp = Date.now();
    finalFilename = `${timestamp}-${sanitizedFilename}`;
  }

  // Add unique ID if requested
  if (options.addUniqueId) {
    const uniqueId = crypto.randomBytes(4).toString('hex');
    const ext = getFileExtension(finalFilename);
    const basename = finalFilename.replace(ext, '');
    finalFilename = `${basename}-${uniqueId}${ext}`;
  }

  // Construct full path
  return `${gameType}/${category}/${finalFilename}`;
}

/**
 * Sanitize filename for S3 storage
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  return filename
    .toLowerCase()
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/[^a-z0-9-_.]/g, '') // Remove special characters
    .replace(/-+/g, '-')          // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
}

/**
 * Get file extension including the dot
 * @param {string} filename - Filename
 * @returns {string} Extension (e.g., '.jpg')
 */
function getFileExtension(filename) {
  const match = filename.match(/\.[^.]+$/);
  return match ? match[0] : '';
}

/**
 * Parse S3 key to extract game type and category
 * @param {string} key - S3 key
 * @returns {object} Parsed components
 */
function parseS3Key(key) {
  const parts = key.split('/');

  if (parts.length < 2) {
    return { gameType: null, category: null, filename: key };
  }

  return {
    gameType: parts[0],
    category: parts[1],
    filename: parts.slice(2).join('/'),
    fullPath: key
  };
}

/**
 * Get folder prefix for listing files
 * @param {string} gameType - Game type
 * @param {string} category - Category (optional)
 * @returns {string} S3 prefix
 */
function getFolderPrefix(gameType, category = null) {
  if (!gameType) {
    return '';
  }

  if (!Object.values(GAME_TYPES).includes(gameType)) {
    throw new Error(`Invalid game type: ${gameType}`);
  }

  if (!category) {
    return `${gameType}/`;
  }

  return `${gameType}/${category}/`;
}

/**
 * Validate file type
 * @param {string} mimetype - File mimetype
 * @param {array} allowedTypes - Allowed mimetypes
 * @returns {boolean} Is valid
 */
function isValidFileType(mimetype, allowedTypes = null) {
  const defaultAllowed = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'application/pdf'
  ];

  const allowed = allowedTypes || defaultAllowed;
  return allowed.includes(mimetype);
}

/**
 * Get content disposition for download
 * @param {string} filename - Original filename
 * @param {boolean} inline - Display inline (default: false)
 * @returns {string} Content-Disposition header value
 */
function getContentDisposition(filename, inline = false) {
  const sanitized = sanitizeFilename(filename);
  const disposition = inline ? 'inline' : 'attachment';
  return `${disposition}; filename="${sanitized}"`;
}

/**
 * Generate player image key
 * @param {string} playerName - Player name
 * @param {string} gameType - Game type
 * @param {object} options - Additional options
 * @returns {string} S3 key
 */
function generatePlayerImageKey(playerName, gameType, options = {}) {
  const category = ASSET_CATEGORIES[gameType].PLAYERS;
  const filename = `${sanitizeFilename(playerName)}.jpg`;
  return generateS3Key(gameType, category, filename, options);
}

/**
 * Generate team logo key
 * @param {string} teamName - Team name
 * @param {string} gameType - Game type
 * @returns {string} S3 key
 */
function generateTeamLogoKey(teamName, gameType) {
  const category = ASSET_CATEGORIES[gameType].TEAMS;
  const filename = `${sanitizeFilename(teamName)}-logo.png`;
  return generateS3Key(gameType, category, filename);
}

/**
 * Generate question image key
 * @param {number|string} questionId - Question ID
 * @returns {string} S3 key
 */
function generateQuestionImageKey(questionId) {
  const category = ASSET_CATEGORIES.trivia.QUESTIONS;
  const filename = `q${questionId}-image.jpg`;
  return generateS3Key(GAME_TYPES.TRIVIA, category, filename);
}

/**
 * Generate badge/achievement key
 * @param {string} badgeName - Badge name
 * @param {string} gameType - Game type
 * @returns {string} S3 key
 */
function generateBadgeKey(badgeName, gameType) {
  const category = ASSET_CATEGORIES[gameType].BADGES;
  const filename = `${sanitizeFilename(badgeName)}.png`;
  return generateS3Key(gameType, category, filename);
}

/**
 * Batch generate keys for multiple files
 * @param {array} files - Array of file objects {name, gameType, category}
 * @param {object} options - Options
 * @returns {array} Array of S3 keys
 */
function batchGenerateKeys(files, options = {}) {
  return files.map(file => {
    return generateS3Key(
      file.gameType,
      file.category,
      file.name,
      options
    );
  });
}

/**
 * Get file size formatted
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted size
 */
function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Generate URL-safe filename from original
 * @param {string} filename - Original filename
 * @returns {string} URL-safe filename
 */
function toUrlSafe(filename) {
  return encodeURIComponent(sanitizeFilename(filename));
}

/**
 * Validate S3 bucket name
 * @param {string} bucketName - Bucket name
 * @returns {boolean} Is valid
 */
function isValidBucketName(bucketName) {
  if (!bucketName || typeof bucketName !== 'string') {
    return false;
  }

  // S3 bucket naming rules
  const pattern = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;

  return (
    pattern.test(bucketName) &&
    !bucketName.includes('..') &&
    !bucketName.match(/^\d+\.\d+\.\d+\.\d+$/) // Not IP address format
  );
}

module.exports = {
  // Constants
  GAME_TYPES,
  ASSET_CATEGORIES,

  // Core functions
  generateS3Key,
  parseS3Key,
  getFolderPrefix,

  // Validation
  sanitizeFilename,
  isValidFileType,
  isValidBucketName,

  // Specialized generators
  generatePlayerImageKey,
  generateTeamLogoKey,
  generateQuestionImageKey,
  generateBadgeKey,
  batchGenerateKeys,

  // Utilities
  getFileExtension,
  getContentDisposition,
  formatFileSize,
  toUrlSafe
};
