/**
 * OneTrust Configuration Module
 * Shared configuration for OneTrust cookie consent across all NFL Games Hub applications
 */

// OneTrust Domain Script ID (to be replaced with actual credentials)
const ONETRUST_DOMAIN_SCRIPT_ID = process.env.ONETRUST_DOMAIN_SCRIPT_ID || 'YOUR-DOMAIN-ID';

// OneTrust Cookie Categories
const COOKIE_CATEGORIES = {
  STRICTLY_NECESSARY: 'C0001', // Essential cookies required for basic site functionality
  PERFORMANCE: 'C0002',         // Analytics and performance tracking
  FUNCTIONAL: 'C0003',          // Enhanced functionality and personalization
  TARGETING: 'C0004'            // Marketing and advertising cookies
};

/**
 * OneTrust Configuration Object
 */
const oneTrustConfig = {
  domainScriptId: ONETRUST_DOMAIN_SCRIPT_ID,
  sdkStubUrl: 'https://cdn.cookielaw.org/scripttemplates/otSDKStub.js',

  // Cookie categories for consent checking
  categories: COOKIE_CATEGORIES,

  // Default configuration options
  options: {
    // Auto-show banner on first visit
    autoShow: true,

    // Show close button on banner
    showCloseButton: true,

    // Language (can be overridden)
    language: 'en',

    // Geolocation rules (OneTrust handles this automatically)
    geolocationEnabled: true
  }
};

/**
 * Helper function to check if a specific cookie category is consented
 * @param {string} categoryId - Cookie category ID (e.g., 'C0001')
 * @returns {boolean} - True if consented, false otherwise
 */
function hasConsentFor(categoryId) {
  if (typeof window === 'undefined' || !window.OnetrustActiveGroups) {
    return false;
  }
  return window.OnetrustActiveGroups.includes(categoryId);
}

/**
 * Helper function to check if strictly necessary cookies are consented
 * @returns {boolean}
 */
function hasNecessaryConsent() {
  return hasConsentFor(COOKIE_CATEGORIES.STRICTLY_NECESSARY);
}

/**
 * Helper function to check if analytics cookies are consented
 * @returns {boolean}
 */
function hasAnalyticsConsent() {
  return hasConsentFor(COOKIE_CATEGORIES.PERFORMANCE);
}

/**
 * Helper function to check if functional cookies are consented
 * @returns {boolean}
 */
function hasFunctionalConsent() {
  return hasConsentFor(COOKIE_CATEGORIES.FUNCTIONAL);
}

/**
 * Helper function to check if targeting/marketing cookies are consented
 * @returns {boolean}
 */
function hasTargetingConsent() {
  return hasConsentFor(COOKIE_CATEGORIES.TARGETING);
}

/**
 * Get all active consent groups
 * @returns {string} - Comma-separated list of active groups
 */
function getActiveGroups() {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.OnetrustActiveGroups || '';
}

/**
 * Initialize OneTrust consent callbacks
 * This should be called in the OptanonWrapper function
 */
function initializeConsentCallbacks(callbacks = {}) {
  const {
    onNecessary,
    onAnalytics,
    onFunctional,
    onTargeting
  } = callbacks;

  console.log('🍪 OneTrust consent initialized');
  console.log('Active groups:', getActiveGroups());

  if (hasNecessaryConsent()) {
    console.log('✅ Necessary cookies consented');
    if (typeof onNecessary === 'function') onNecessary();
  }

  if (hasAnalyticsConsent()) {
    console.log('📊 Analytics cookies consented');
    if (typeof onAnalytics === 'function') onAnalytics();
  }

  if (hasFunctionalConsent()) {
    console.log('⚙️  Functional cookies consented');
    if (typeof onFunctional === 'function') onFunctional();
  }

  if (hasTargetingConsent()) {
    console.log('📣 Targeting cookies consented');
    if (typeof onTargeting === 'function') onTargeting();
  }
}

module.exports = {
  oneTrustConfig,
  COOKIE_CATEGORIES,
  hasConsentFor,
  hasNecessaryConsent,
  hasAnalyticsConsent,
  hasFunctionalConsent,
  hasTargetingConsent,
  getActiveGroups,
  initializeConsentCallbacks
};
