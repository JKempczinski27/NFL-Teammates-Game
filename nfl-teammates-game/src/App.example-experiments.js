/**
 * Example: How to integrate A/B testing into your NFL Teammates Game
 *
 * This file shows real-world examples of using the experiments framework
 * Copy these patterns into your actual App.js file
 */

import React, { useState, useEffect } from 'react';
import { initializeExperiments, useExperiment, trackGoal, ExperimentHelpers, EXPERIMENTS } from './utils/experiments';

function CommonPlayerGame() {
  // ... existing state

  // EXAMPLE 1: Initialize all experiments on component mount
  useEffect(() => {
    const assignments = initializeExperiments();
    console.log('User assigned to experiments:', assignments);
  }, []);

  // EXAMPLE 2: Use experiment to change UI layout
  const uiLayoutVariant = useExperiment(
    EXPERIMENTS.UI_LAYOUT.name,
    EXPERIMENTS.UI_LAYOUT.variants,
    EXPERIMENTS.UI_LAYOUT.trafficAllocation
  );

  // EXAMPLE 3: Use experiment to change button text
  const shareCTAVariant = useExperiment(
    EXPERIMENTS.SHARE_CTA.name,
    EXPERIMENTS.SHARE_CTA.variants,
    EXPERIMENTS.SHARE_CTA.trafficAllocation
  );

  // Determine button text based on variant
  const shareButtonText = shareCTAVariant === 'variant_a' ? 'Challenge a Friend' : 'Share';

  // EXAMPLE 4: Track goal conversion when user completes game
  const handleGameComplete = () => {
    // ... existing game completion logic

    // Track conversion for UI layout experiment
    trackGoal(EXPERIMENTS.UI_LAYOUT.name, 'completion', 1);
  };

  // EXAMPLE 5: Track experiment-specific button clicks
  const handleShareClick = (platform) => {
    // Track share for share CTA experiment
    trackGoal(EXPERIMENTS.SHARE_CTA.name, 'share', 1);

    // Also track which platform
    ExperimentHelpers.trackButtonClick(EXPERIMENTS.SHARE_CTA.name, `share_${platform}`);

    // ... rest of share logic
  };

  // EXAMPLE 6: Conditional rendering based on experiment variant
  return (
    <Box sx={{ /* ... */ }}>
      {/* Render different layouts based on variant */}
      {uiLayoutVariant === 'variant_a' ? (
        <NewLayoutComponent onComplete={handleGameComplete} />
      ) : (
        <OriginalLayoutComponent onComplete={handleGameComplete} />
      )}

      {/* Render different button text based on variant */}
      <Button onClick={handleShareClick}>
        {shareButtonText}
      </Button>
    </Box>
  );
}

// EXAMPLE 7: Testing question difficulty ordering
function GameWithQuestionOrdering() {
  const [questions, setQuestions] = useState([]);

  const questionOrderVariant = useExperiment(
    EXPERIMENTS.QUESTION_ORDER.name,
    EXPERIMENTS.QUESTION_ORDER.variants,
    100
  );

  useEffect(() => {
    // Reorder questions based on experiment variant
    let orderedQuestions = [...gameData];

    if (questionOrderVariant === 'easy_first') {
      // Sort easy to hard
      orderedQuestions.sort((a, b) => a.difficulty - b.difficulty);
    } else if (questionOrderVariant === 'hard_first') {
      // Sort hard to easy
      orderedQuestions.sort((a, b) => b.difficulty - a.difficulty);
    } else {
      // Random order (control)
      orderedQuestions = shuffleArray(orderedQuestions);
    }

    setQuestions(orderedQuestions);
  }, [questionOrderVariant]);

  // Track time to complete for experiment
  const handleQuestionComplete = (timeSpent) => {
    ExperimentHelpers.trackDuration(
      EXPERIMENTS.QUESTION_ORDER.name,
      'time_to_complete',
      timeSpent
    );
  };

  return (
    <div>
      {/* Render questions */}
    </div>
  );
}

// EXAMPLE 8: Creating a custom experiment on the fly
function CustomExperiment() {
  // Define experiment inline
  const buttonColorVariant = useExperiment(
    'button_color_test',
    [
      { id: 'control', name: 'Blue Button', weight: 50 },
      { id: 'variant_a', name: 'Green Button', weight: 50 }
    ],
    100
  );

  const buttonColor = buttonColorVariant === 'variant_a' ? 'green' : 'blue';

  const handleClick = () => {
    // Track conversion
    trackGoal('button_color_test', 'click', 1);
  };

  return (
    <button style={{ backgroundColor: buttonColor }} onClick={handleClick}>
      Submit Answer
    </button>
  );
}

// EXAMPLE 9: Testing multiple things at once
function MultipleExperiments() {
  // User can be in multiple experiments simultaneously
  const headerTextVariant = useExperiment('header_text', [
    { id: 'control', weight: 50 },
    { id: 'variant_a', weight: 50 }
  ], 100);

  const imageStyleVariant = useExperiment('image_style', [
    { id: 'control', weight: 33 },
    { id: 'rounded', weight: 33 },
    { id: 'shadow', weight: 34 }
  ], 100);

  return (
    <div>
      <h1>{headerTextVariant === 'variant_a' ? 'Who Played Together?' : 'Who is the Common Player?'}</h1>
      <img
        src="..."
        style={{
          borderRadius: imageStyleVariant === 'rounded' ? '50%' : '0',
          boxShadow: imageStyleVariant === 'shadow' ? '0 5px 15px rgba(0,0,0,0.3)' : 'none'
        }}
      />
    </div>
  );
}

// EXAMPLE 10: Advanced - Track detailed metrics
function AdvancedMetricsTracking() {
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    // Initialize experiment
    const variant = useExperiment('detailed_metrics_test', [
      { id: 'control', weight: 50 },
      { id: 'variant_a', weight: 50 }
    ], 100);

    if (variant) {
      // Track page view
      ExperimentHelpers.trackPageView('detailed_metrics_test', 'game_page');
    }

    return () => {
      // Track time on page when component unmounts
      const timeOnPage = Date.now() - startTime;
      ExperimentHelpers.trackDuration('detailed_metrics_test', 'time_on_page', timeOnPage);
    };
  }, []);

  const handleCorrectAnswer = (revenue = 0) => {
    // Track conversion with optional revenue
    ExperimentHelpers.trackConversion('detailed_metrics_test', 'correct_answer', revenue);
  };

  return <div>{/* ... */}</div>;
}

export default CommonPlayerGame;
