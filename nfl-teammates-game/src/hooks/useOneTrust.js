import { useState, useEffect } from 'react';

/**
 * Custom React hook for managing OneTrust cookie consent
 *
 * @returns {Object} Consent state object
 * @returns {boolean} consent.necessary - Strictly necessary cookies consent
 * @returns {boolean} consent.performance - Performance/analytics cookies consent
 * @returns {boolean} consent.functional - Functional cookies consent
 * @returns {boolean} consent.targeting - Targeting/advertising cookies consent
 * @returns {boolean} consent.isLoaded - Whether OneTrust has loaded
 * @returns {string|null} consent.timestamp - ISO timestamp of last consent update
 * @returns {Function} consent.showPreferences - Function to display OneTrust preference center
 *
 * @example
 * const consent = useOneTrust();
 *
 * if (consent.performance) {
 *   // Track analytics event
 *   trackEvent('page_view', data);
 * }
 *
 * // Show preference center
 * <button onClick={consent.showPreferences}>Cookie Settings</button>
 */
export const useOneTrust = () => {
  const [consent, setConsent] = useState({
    necessary: false,
    performance: false,
    functional: false,
    targeting: false,
    isLoaded: false,
    timestamp: null,
  });

  useEffect(() => {
    // Function to update consent state from window.oneTrustConsent
    const updateConsent = () => {
      if (window.oneTrustConsent) {
        setConsent({
          necessary: window.oneTrustConsent.necessary || false,
          performance: window.oneTrustConsent.performance || false,
          functional: window.oneTrustConsent.functional || false,
          targeting: window.oneTrustConsent.targeting || false,
          isLoaded: true,
          timestamp: window.oneTrustConsent.timestamp || null,
        });
      }
    };

    // Initial check
    updateConsent();

    // Listen for consent updates
    const handleConsentUpdate = (event) => {
      setConsent({
        necessary: event.detail.necessary || false,
        performance: event.detail.performance || false,
        functional: event.detail.functional || false,
        targeting: event.detail.targeting || false,
        isLoaded: true,
        timestamp: event.detail.timestamp || null,
      });
    };

    window.addEventListener('oneTrustConsentUpdate', handleConsentUpdate);

    // Fallback: Check if OneTrust is available and update after a short delay
    const timer = setTimeout(() => {
      if (window.OneTrust && !consent.isLoaded) {
        updateConsent();
      }
    }, 1000);

    return () => {
      window.removeEventListener('oneTrustConsentUpdate', handleConsentUpdate);
      clearTimeout(timer);
    };
  }, []);

  // Function to show OneTrust preference center
  const showPreferences = () => {
    if (window.OneTrust) {
      window.OneTrust.ToggleInfoDisplay();
    } else {
      console.warn('OneTrust is not loaded yet');
    }
  };

  return {
    ...consent,
    showPreferences,
  };
};

/**
 * Helper function to check if analytics tracking is allowed
 * @returns {boolean} Whether performance cookies are consented
 */
export const canTrackAnalytics = () => {
  return window.oneTrustConsent?.performance || false;
};

/**
 * Helper function to check if advertising is allowed
 * @returns {boolean} Whether targeting cookies are consented
 */
export const canShowAdvertising = () => {
  return window.oneTrustConsent?.targeting || false;
};

/**
 * Helper function to get all consent preferences
 * @returns {Object|null} Consent object or null if not loaded
 */
export const getConsentPreferences = () => {
  return window.oneTrustConsent || null;
};
