/**
 * A/B Testing Framework
 * Assigns users to experiment variants and tracks results
 * Integrates with OneTrust consent management
 */

import { canTrackAnalytics } from '../hooks/useOneTrust';

/**
 * Get or create a stable user ID for experiment assignment
 * Uses sessionId for consistency across page loads
 */
function getUserId() {
  let userId = localStorage.getItem('sessionId');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('sessionId', userId);
  }
  return userId;
}

/**
 * Hash function for consistent variant assignment
 * Same user always gets same variant for same experiment
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Assign user to experiment variant
 * @param {string} experimentName - Name of the experiment
 * @param {Array} variants - Array of variant configs: [{id: 'control', weight: 50}, ...]
 * @param {number} trafficAllocation - Percentage of users to include (0-100)
 * @returns {string|null} - Variant ID or null if not in experiment
 */
export function assignVariant(experimentName, variants = [], trafficAllocation = 100) {
  const userId = getUserId();
  const experimentKey = `experiment_${experimentName}`;

  // Check if already assigned
  const cached = localStorage.getItem(experimentKey);
  if (cached) {
    return cached;
  }

  // Check if user should be in experiment based on traffic allocation
  const trafficHash = hashString(userId + experimentName + 'traffic');
  const trafficBucket = trafficHash % 100;

  if (trafficBucket >= trafficAllocation) {
    // User not in experiment
    return null;
  }

  // Assign to variant based on weights
  const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 0), 0);
  const userHash = hashString(userId + experimentName);
  const bucket = userHash % totalWeight;

  let cumulativeWeight = 0;
  let assignedVariant = variants[0]?.id || 'control';

  for (const variant of variants) {
    cumulativeWeight += variant.weight || 0;
    if (bucket < cumulativeWeight) {
      assignedVariant = variant.id;
      break;
    }
  }

  // Cache assignment
  localStorage.setItem(experimentKey, assignedVariant);

  // Track assignment
  trackExperimentAssignment(experimentName, assignedVariant);

  return assignedVariant;
}

/**
 * Track experiment assignment to backend
 */
async function trackExperimentAssignment(experimentName, variantId) {
  if (!canTrackAnalytics()) return;

  try {
    await fetch('/api/experiments/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        experimentName,
        variantId,
        sessionId: getUserId(),
        userContext: {
          userAgent: navigator.userAgent,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          isMobile: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)
        },
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Error tracking experiment assignment:', error);
  }
}

/**
 * Track experiment event/metric
 * @param {string} experimentName - Name of the experiment
 * @param {string} eventType - Type of event (e.g., 'conversion', 'click', 'completion')
 * @param {object} eventData - Additional event data
 * @param {number} metricValue - Numeric value for the metric (optional)
 */
export async function trackExperimentEvent(experimentName, eventType, eventData = {}, metricValue = null) {
  if (!canTrackAnalytics()) return;

  const experimentKey = `experiment_${experimentName}`;
  const variantId = localStorage.getItem(experimentKey);

  if (!variantId) {
    // User not in this experiment
    return;
  }

  try {
    await fetch('/api/experiments/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        experimentName,
        variantId,
        sessionId: getUserId(),
        eventType,
        eventData,
        metricValue,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Error tracking experiment event:', error);
  }
}

/**
 * Get assigned variant for an experiment
 * @param {string} experimentName - Name of the experiment
 * @returns {string|null} - Variant ID or null if not assigned
 */
export function getVariant(experimentName) {
  return localStorage.getItem(`experiment_${experimentName}`);
}

/**
 * Check if user is in an experiment
 * @param {string} experimentName - Name of the experiment
 * @returns {boolean}
 */
export function isInExperiment(experimentName) {
  return getVariant(experimentName) !== null;
}

/**
 * Hook to use experiment in React components
 * @param {string} experimentName - Name of the experiment
 * @param {Array} variants - Array of variant configs
 * @param {number} trafficAllocation - Percentage of users to include
 * @returns {string|null} - Assigned variant ID
 */
export function useExperiment(experimentName, variants, trafficAllocation = 100) {
  const variant = assignVariant(experimentName, variants, trafficAllocation);
  return variant;
}

/**
 * Experiment configuration helper
 * Centralized place to define all active experiments
 */
export const EXPERIMENTS = {
  // Example: UI Layout Test
  UI_LAYOUT: {
    name: 'ui_layout_v2',
    variants: [
      { id: 'control', name: 'Original Layout', weight: 50 },
      { id: 'variant_a', name: 'New Layout', weight: 50 }
    ],
    trafficAllocation: 100,
    primaryMetric: 'completion_rate',
    description: 'Testing new UI layout for better engagement'
  },

  // Example: Question Difficulty
  QUESTION_ORDER: {
    name: 'question_difficulty_order',
    variants: [
      { id: 'control', name: 'Random Order', weight: 33 },
      { id: 'easy_first', name: 'Easy to Hard', weight: 33 },
      { id: 'hard_first', name: 'Hard to Easy', weight: 34 }
    ],
    trafficAllocation: 100,
    primaryMetric: 'completion_rate',
    description: 'Testing optimal question ordering strategy'
  },

  // Example: CTA Button Text
  SHARE_CTA: {
    name: 'share_button_text',
    variants: [
      { id: 'control', name: 'Share', weight: 50 },
      { id: 'variant_a', name: 'Challenge a Friend', weight: 50 }
    ],
    trafficAllocation: 50, // Only 50% of users in this test
    primaryMetric: 'share_rate',
    description: 'Testing different CTA copy for social sharing'
  }
};

/**
 * Initialize all active experiments for a user
 * Call this once on app load
 */
export function initializeExperiments() {
  const assignments = {};

  Object.entries(EXPERIMENTS).forEach(([key, config]) => {
    const variant = assignVariant(
      config.name,
      config.variants,
      config.trafficAllocation
    );

    if (variant) {
      assignments[config.name] = variant;
    }
  });

  return assignments;
}

/**
 * Helper to track goal conversion for experiments
 * @param {string} experimentName - Name of the experiment
 * @param {string} goalType - Type of goal: 'completion', 'share', 'return', etc.
 * @param {number} value - Numeric value (optional)
 */
export async function trackGoal(experimentName, goalType, value = 1) {
  await trackExperimentEvent(experimentName, `goal_${goalType}`, { goalType }, value);
}

/**
 * Helper functions for common experiment patterns
 */
export const ExperimentHelpers = {
  /**
   * Track button click with experiment context
   */
  trackButtonClick: (experimentName, buttonId) => {
    trackExperimentEvent(experimentName, 'button_click', { buttonId }, 1);
  },

  /**
   * Track page view with experiment context
   */
  trackPageView: (experimentName, pageName) => {
    trackExperimentEvent(experimentName, 'page_view', { pageName }, 1);
  },

  /**
   * Track conversion with experiment context
   */
  trackConversion: (experimentName, conversionType, revenue = 0) => {
    trackExperimentEvent(experimentName, 'conversion', { conversionType }, revenue);
  },

  /**
   * Track time-based metric
   */
  trackDuration: (experimentName, metricName, durationMs) => {
    trackExperimentEvent(experimentName, 'duration', { metricName }, durationMs);
  }
};

export default {
  assignVariant,
  trackExperimentEvent,
  getVariant,
  isInExperiment,
  useExperiment,
  EXPERIMENTS,
  initializeExperiments,
  trackGoal,
  ExperimentHelpers
};
