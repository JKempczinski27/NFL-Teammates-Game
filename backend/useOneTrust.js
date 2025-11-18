/**
 * React Hook for OneTrust Consent Management
 * Use this in React components to check cookie consent status
 */

import { useState, useEffect } from 'react';

// Cookie category constants
export const COOKIE_CATEGORIES = {
  STRICTLY_NECESSARY: 'C0001',
  PERFORMANCE: 'C0002',
  FUNCTIONAL: 'C0003',
  TARGETING: 'C0004'
};

/**
 * Custom React Hook for OneTrust consent management
 * @returns {Object} Consent status and helper functions
 */
export function useOneTrust() {
  const [consentLoaded, setConsentLoaded] = useState(false);
  const [activeGroups, setActiveGroups] = useState('');

  useEffect(() => {
    // Check if OneTrust is loaded
    const checkOneTrust = () => {
      if (window.OneTrust && window.OnetrustActiveGroups) {
        setConsentLoaded(true);
        setActiveGroups(window.OnetrustActiveGroups);
      }
    };

    // Initial check
    checkOneTrust();

    // Listen for consent changes
    window.addEventListener('consent.onetrust', checkOneTrust);

    // Cleanup
    return () => {
      window.removeEventListener('consent.onetrust', checkOneTrust);
    };
  }, []);

  /**
   * Check if a specific category has consent
   */
  const hasConsent = (categoryId) => {
    return activeGroups.includes(categoryId);
  };

  /**
   * Get all consented categories
   */
  const getConsentedCategories = () => {
    const categories = [];
    if (hasConsent(COOKIE_CATEGORIES.STRICTLY_NECESSARY)) categories.push('necessary');
    if (hasConsent(COOKIE_CATEGORIES.PERFORMANCE)) categories.push('analytics');
    if (hasConsent(COOKIE_CATEGORIES.FUNCTIONAL)) categories.push('functional');
    if (hasConsent(COOKIE_CATEGORIES.TARGETING)) categories.push('targeting');
    return categories;
  };

  /**
   * Show OneTrust preference center
   */
  const showPreferenceCenter = () => {
    if (window.OneTrust) {
      window.OneTrust.ToggleInfoDisplay();
    }
  };

  return {
    // State
    consentLoaded,
    activeGroups,

    // Individual consent checks
    hasNecessaryConsent: hasConsent(COOKIE_CATEGORIES.STRICTLY_NECESSARY),
    hasAnalyticsConsent: hasConsent(COOKIE_CATEGORIES.PERFORMANCE),
    hasFunctionalConsent: hasConsent(COOKIE_CATEGORIES.FUNCTIONAL),
    hasTargetingConsent: hasConsent(COOKIE_CATEGORIES.TARGETING),

    // Helper functions
    hasConsent,
    getConsentedCategories,
    showPreferenceCenter
  };
}

/**
 * Example usage:
 *
 * import { useOneTrust } from './hooks/useOneTrust';
 *
 * function MyComponent() {
 *   const {
 *     consentLoaded,
 *     hasAnalyticsConsent,
 *     showPreferenceCenter
 *   } = useOneTrust();
 *
 *   useEffect(() => {
 *     if (hasAnalyticsConsent) {
 *       // Initialize analytics
 *       initializeGoogleAnalytics();
 *     }
 *   }, [hasAnalyticsConsent]);
 *
 *   return (
 *     <button onClick={showPreferenceCenter}>
 *       Cookie Settings
 *     </button>
 *   );
 * }
 */

export default useOneTrust;
