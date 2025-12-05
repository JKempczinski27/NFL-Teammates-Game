# Enhanced Player Analytics Guide

## 🎯 Advanced Metrics You Can Track

Your current tracking system is already consent-aware and GDPR-compliant. Here are powerful enhancements you can add:

---

## 1. Player Skill & Performance Analytics

### Streak Tracking
Track winning/losing streaks to identify player engagement patterns:

```javascript
// Add to your component state
const [correctStreak, setCorrectStreak] = useState(0);
const [incorrectStreak, setIncorrectStreak] = useState(0);

// In handleSubmit:
if (wasCorrect) {
  const newStreak = correctStreak + 1;
  setCorrectStreak(newStreak);
  setIncorrectStreak(0);

  trackEvent('streak_update', {
    type: 'correct',
    streakLength: newStreak,
    questionIndex: currentIndex
  });

  // Milestone tracking
  if (newStreak === 5) {
    trackEvent('milestone_achieved', {
      type: 'hot_streak',
      value: 5
    });
  }
} else {
  setCorrectStreak(0);
  setIncorrectStreak(incorrectStreak + 1);
}
```

### Difficulty Analysis
Track which questions are too hard/easy:

```javascript
trackEvent('answer_submitted', {
  questionIndex: currentIndex,
  isCorrect: wasCorrect,
  attemptNumber: currentAttempt,
  timeToAnswer,
  // NEW: Add difficulty indicators
  answeredOnFirstTry: currentAttempt === 1 && wasCorrect,
  gaveUpWithoutAnswer: attemptsLeft === 0 && !wasCorrect,
  quickAnswer: timeToAnswer < 10, // Answered in under 10 seconds
  slowAnswer: timeToAnswer > 60,  // Took over 1 minute
});
```

### Player Confidence Tracking
Measure hesitation and confidence:

```javascript
// Track typing behavior
const [keystrokeCount, setKeystrokeCount] = useState(0);
const [backspaceCount, setBackspaceCount] = useState(0);

<TextField
  onChange={(e) => {
    setUserAnswer(e.target.value);
    setKeystrokeCount(prev => prev + 1);
  }}
  onKeyDown={(e) => {
    if (e.key === 'Backspace') {
      setBackspaceCount(prev => prev + 1);
    }
  }}
/>

// On submit:
trackEvent('answer_submitted', {
  // ... existing data
  keystrokeCount,
  backspaceCount,
  confidenceScore: backspaceCount === 0 ? 'high' : backspaceCount > 5 ? 'low' : 'medium',
  answerLength: userAnswer.length
});
```

---

## 2. Engagement & Retention Metrics

### Time-Based Engagement
Track when players are most engaged:

```javascript
// Track time between questions (pace)
const [previousQuestionTime, setPreviousQuestionTime] = useState(Date.now());

const handleNext = () => {
  const timeBetweenQuestions = Date.now() - previousQuestionTime;

  trackEvent('question_transition', {
    fromQuestion: currentIndex,
    toQuestion: currentIndex + 1,
    transitionTime: timeBetweenQuestions,
    pace: timeBetweenQuestions < 5000 ? 'fast' : 'normal'
  });

  setPreviousQuestionTime(Date.now());
  // ... rest of handleNext
};
```

### Rage Quit Detection
Identify frustration points:

```javascript
// Track repeated incorrect answers
if (!wasCorrect && currentAttempt === 3) {
  trackEvent('frustration_indicator', {
    questionIndex: currentIndex,
    consecutiveFailures: currentAttempt,
    timeSpent: timeToAnswer
  });
}

// Track tab visibility (did they switch tabs?)
useEffect(() => {
  let tabHiddenTime = 0;
  let lastHiddenAt = null;

  const handleVisibilityChange = () => {
    if (document.hidden) {
      lastHiddenAt = Date.now();
    } else if (lastHiddenAt) {
      const hiddenDuration = Date.now() - lastHiddenAt;
      tabHiddenTime += hiddenDuration;

      trackEvent('tab_returned', {
        hiddenDuration,
        totalHiddenTime: tabHiddenTime,
        questionIndex: currentIndex
      });
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [currentIndex]);
```

### Return Player Detection
Track returning vs new players:

```javascript
// In getSessionId function:
function getSessionId() {
  let id = localStorage.getItem('sessionId');
  const firstVisit = localStorage.getItem('firstVisit');
  const lastVisit = localStorage.getItem('lastVisit');
  const sessionCount = parseInt(localStorage.getItem('sessionCount') || '0');

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('sessionId', id);
    localStorage.setItem('firstVisit', new Date().toISOString());
    localStorage.setItem('sessionCount', '1');
  } else {
    // Returning player
    const daysSinceLastVisit = lastVisit
      ? (Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24)
      : 0;

    localStorage.setItem('sessionCount', (sessionCount + 1).toString());

    trackEvent('returning_player', {
      sessionNumber: sessionCount + 1,
      daysSinceLastVisit: Math.floor(daysSinceLastVisit),
      firstVisit,
      playerType: sessionCount > 10 ? 'veteran' : sessionCount > 3 ? 'regular' : 'casual'
    });
  }

  localStorage.setItem('lastVisit', new Date().toISOString());
  return id;
}
```

---

## 3. User Experience & Interaction Tracking

### Scroll & Mouse Movement (Attention Tracking)
```javascript
useEffect(() => {
  let mouseMovementCount = 0;
  let idleTime = 0;
  let lastMovement = Date.now();

  const handleMouseMove = () => {
    mouseMovementCount++;
    const timeSinceLastMove = Date.now() - lastMovement;

    if (timeSinceLastMove > 30000) {
      // User was idle for 30+ seconds
      trackEvent('idle_detected', {
        idleDuration: timeSinceLastMove,
        questionIndex: currentIndex
      });
    }

    lastMovement = Date.now();
  };

  window.addEventListener('mousemove', handleMouseMove);

  // Check for idle every 10 seconds
  const idleCheck = setInterval(() => {
    const idle = Date.now() - lastMovement;
    if (idle > 60000) { // 1 minute idle
      trackEvent('user_idle', {
        idleDuration: idle,
        questionIndex: currentIndex
      });
    }
  }, 10000);

  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    clearInterval(idleCheck);
  };
}, [currentIndex]);
```

### Device & Screen Analytics
```javascript
// Track on session start:
trackEvent('session_start', {
  // Device info
  screenWidth: window.screen.width,
  screenHeight: window.screen.height,
  viewportWidth: window.innerWidth,
  viewportHeight: window.innerHeight,
  devicePixelRatio: window.devicePixelRatio,
  isMobile: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent),
  isTablet: /iPad|Android/i.test(navigator.userAgent) && window.innerWidth > 768,

  // Browser info
  language: navigator.language,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

  // Connection info
  connectionType: navigator.connection?.effectiveType || 'unknown',
  downlink: navigator.connection?.downlink || 'unknown'
});
```

### Click/Touch Heatmap Data
```javascript
const [clickPositions, setClickPositions] = useState([]);

const handleClick = (e) => {
  const click = {
    x: e.clientX,
    y: e.clientY,
    target: e.target.tagName,
    questionIndex: currentIndex,
    timestamp: Date.now()
  };

  setClickPositions(prev => [...prev, click]);

  // Send batch every 10 clicks
  if (clickPositions.length >= 10) {
    trackEvent('click_heatmap', {
      clicks: clickPositions,
      questionIndex: currentIndex
    });
    setClickPositions([]);
  }
};

useEffect(() => {
  window.addEventListener('click', handleClick);
  return () => window.removeEventListener('click', handleClick);
}, [currentIndex, clickPositions]);
```

---

## 4. Social & Viral Metrics

### Share Success Tracking
```javascript
function handleShare(platform) {
  const shareData = {
    platform,
    questionIndex: currentIndex,
    playerScore: totalCorrectAnswers,
    playerStreak: correctStreak,

    // Track what they're sharing
    shareContext: isCorrect ? 'celebrating_win' : 'challenging_friend',
    gameProgress: `${currentIndex + 1}/${gameData.length}`,

    // UTM tracking for attribution
    shareUrl: `${window.location.href}?utm_source=${platform}&utm_campaign=player_share&utm_content=question_${currentIndex}`
  };

  trackEvent('shared', shareData);

  // Track if they return after sharing (set flag)
  localStorage.setItem('lastShareTime', Date.now().toString());
  localStorage.setItem('lastSharePlatform', platform);
}

// Later, when they return:
if (localStorage.getItem('lastShareTime')) {
  const timeSinceShare = Date.now() - parseInt(localStorage.getItem('lastShareTime'));

  if (timeSinceShare < 3600000) { // Within 1 hour
    trackEvent('returned_after_share', {
      platform: localStorage.getItem('lastSharePlatform'),
      minutesSinceShare: Math.floor(timeSinceShare / 60000)
    });
  }
}
```

### Viral Loop Tracking
```javascript
// Check if user came from a share link
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const source = urlParams.get('utm_source');
  const referrer = document.referrer;

  if (source) {
    trackEvent('viral_acquisition', {
      source,
      campaign: urlParams.get('utm_campaign'),
      referrer,
      landingQuestion: urlParams.get('utm_content')
    });
  }
}, []);
```

---

## 5. Game-Specific Analytics

### Question Difficulty Auto-Adjustment
Track aggregate metrics per question:

```javascript
// Track question performance
trackEvent('question_completed', {
  questionIndex: currentIndex,
  isCorrect: wasCorrect,
  attemptNumber: currentAttempt,
  timeToAnswer,

  // NEW: Question metadata for difficulty calculation
  questionId: currentQuestion.id || `q_${currentIndex}`,
  questionType: currentQuestion.type || 'player_identification',
  playerCount: currentQuestion.images?.length || 0,

  // Player context
  playerSkillLevel: calculateSkillLevel(totalCorrectAnswers, totalQuestionsAnswered),
  consecutiveCorrect: correctStreak,
  consecutiveIncorrect: incorrectStreak
});

// Helper function
function calculateSkillLevel(correct, total) {
  if (total === 0) return 'beginner';
  const accuracy = correct / total;
  if (accuracy >= 0.8) return 'expert';
  if (accuracy >= 0.6) return 'intermediate';
  return 'beginner';
}
```

### Player Journey Mapping
```javascript
// Track the full player journey
const [playerJourney, setPlayerJourney] = useState([]);

useEffect(() => {
  const journey = {
    questionIndex: currentIndex,
    enteredAt: Date.now(),
    events: []
  };

  setPlayerJourney(prev => [...prev, journey]);

  return () => {
    // On question exit, track the journey
    trackEvent('question_journey', {
      questionIndex: currentIndex,
      durationMs: Date.now() - journey.enteredAt,
      interactionCount: journey.events.length,
      outcome: isCorrect ? 'success' : attemptsLeft === 0 ? 'failed' : 'skipped'
    });
  };
}, [currentIndex]);
```

---

## 6. A/B Testing & Experimentation

### Feature Flag Tracking
```javascript
// Assign players to experiment groups
const experimentGroup = sessionId.charAt(0) < '8' ? 'control' : 'variant';

trackEvent('experiment_assigned', {
  experimentName: 'new_ui_layout',
  group: experimentGroup
});

// Track experiment-specific metrics
trackEvent('answer_submitted', {
  // ... existing data
  experimentGroup,
  uiVariant: experimentGroup === 'variant' ? 'new_layout' : 'original'
});
```

---

## 7. Performance & Technical Metrics

### Load Time & Performance
```javascript
useEffect(() => {
  // Track initial load performance
  if (window.performance) {
    const perfData = window.performance.timing;
    const loadTime = perfData.loadEventEnd - perfData.navigationStart;

    trackEvent('page_performance', {
      loadTime,
      domReady: perfData.domContentLoadedEventEnd - perfData.navigationStart,
      firstPaint: perfData.responseStart - perfData.navigationStart,

      // Resource timing
      resourceCount: window.performance.getEntriesByType('resource').length
    });
  }
}, []);

// Track image load times
const trackImageLoad = (imageSrc, loadTime) => {
  trackEvent('image_loaded', {
    src: imageSrc,
    loadTime,
    questionIndex: currentIndex,
    cached: loadTime < 100
  });
};
```

### Error Tracking
```javascript
useEffect(() => {
  const handleError = (error) => {
    trackEvent('error_occurred', {
      message: error.message,
      stack: error.stack?.substring(0, 500),
      questionIndex: currentIndex,
      userAction: 'unknown'
    });
  };

  window.addEventListener('error', handleError);
  return () => window.removeEventListener('error', handleError);
}, [currentIndex]);
```

---

## 8. Advanced Analytics - Cohort & Funnel Analysis

### Funnel Tracking
```javascript
// Track the conversion funnel
const funnelSteps = [
  'page_load',
  'first_question_viewed',
  'first_answer_submitted',
  'first_correct_answer',
  'completed_game',
  'shared_result'
];

const trackFunnelStep = (step) => {
  const currentFunnel = JSON.parse(localStorage.getItem('funnel') || '{}');

  if (!currentFunnel[step]) {
    currentFunnel[step] = {
      timestamp: new Date().toISOString(),
      sessionId
    };

    localStorage.setItem('funnel', JSON.stringify(currentFunnel));

    trackEvent('funnel_step_completed', {
      step,
      stepNumber: funnelSteps.indexOf(step) + 1,
      timeSinceStart: Date.now() - new Date(currentFunnel.page_load?.timestamp).getTime()
    });
  }
};

// Use throughout your app
trackFunnelStep('first_question_viewed');
trackFunnelStep('first_answer_submitted');
```

### Cohort Tracking
```javascript
// Assign cohort on first visit
if (!localStorage.getItem('cohort')) {
  const cohort = {
    id: `cohort_${new Date().toISOString().split('T')[0]}`, // Daily cohorts
    joinDate: new Date().toISOString(),
    acquisitionSource: new URLSearchParams(window.location.search).get('utm_source') || 'direct'
  };

  localStorage.setItem('cohort', JSON.stringify(cohort));
}

// Include cohort in all events
trackEvent('any_event', {
  // ... event data
  cohortId: JSON.parse(localStorage.getItem('cohort')).id
});
```

---

## 9. Real-Time Behavior Signals

### Attention Span Tracking
```javascript
const [attentionScore, setAttentionScore] = useState(100);

useEffect(() => {
  let score = 100;

  const checkAttention = setInterval(() => {
    // Decrease attention score over time
    score = Math.max(0, score - 1);

    // Increase on interaction
    const handleInteraction = () => {
      score = Math.min(100, score + 10);
      setAttentionScore(score);
    };

    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    if (score < 30) {
      trackEvent('low_attention_detected', {
        attentionScore: score,
        questionIndex: currentIndex,
        timeSinceLastInteraction: Date.now() - lastActivityTime
      });
    }
  }, 5000);

  return () => clearInterval(checkAttention);
}, [currentIndex]);
```

---

## 10. Privacy-Conscious Analytics

### Anonymized Player Profiles
```javascript
// Create hashed player profiles without PII
const createPlayerProfile = () => {
  const profile = {
    playerId: sessionId, // Already anonymous UUID

    // Aggregate metrics (no PII)
    totalGames: parseInt(localStorage.getItem('sessionCount') || '0'),
    averageScore: parseFloat(localStorage.getItem('avgScore') || '0'),
    favoriteGameMode: localStorage.getItem('favoriteMode') || 'unknown',

    // Behavioral segments
    playerSegment: calculateSegment(),
    engagementLevel: calculateEngagement(),

    // Privacy-safe demographics
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    deviceType: /Mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
  };

  return profile;
};

function calculateSegment() {
  const sessionCount = parseInt(localStorage.getItem('sessionCount') || '0');
  const avgScore = parseFloat(localStorage.getItem('avgScore') || '0');

  if (sessionCount >= 10 && avgScore >= 0.8) return 'power_user';
  if (sessionCount >= 5) return 'regular';
  if (sessionCount === 1) return 'first_time';
  return 'casual';
}
```

---

## 📊 Database Views for Advanced Analytics

Create these views in PostgreSQL to analyze the new metrics:

### Player Skill Distribution
\`\`\`sql
CREATE VIEW player_skill_distribution AS
SELECT
  session_id,
  COUNT(*) FILTER (WHERE (event_data->>'isCorrect')::boolean = true) as correct_answers,
  COUNT(*) as total_answers,
  ROUND(COUNT(*) FILTER (WHERE (event_data->>'isCorrect')::boolean = true)::numeric /
        NULLIF(COUNT(*), 0), 2) as accuracy,
  CASE
    WHEN ROUND(COUNT(*) FILTER (WHERE (event_data->>'isCorrect')::boolean = true)::numeric /
         NULLIF(COUNT(*), 0), 2) >= 0.8 THEN 'expert'
    WHEN ROUND(COUNT(*) FILTER (WHERE (event_data->>'isCorrect')::boolean = true)::numeric /
         NULLIF(COUNT(*), 0), 2) >= 0.6 THEN 'intermediate'
    ELSE 'beginner'
  END as skill_level
FROM events
WHERE event_type = 'answer_submitted'
GROUP BY session_id;
\`\`\`

### Engagement Heatmap
\`\`\`sql
CREATE VIEW hourly_engagement AS
SELECT
  EXTRACT(HOUR FROM timestamp) as hour_of_day,
  EXTRACT(DOW FROM timestamp) as day_of_week,
  COUNT(*) as event_count,
  COUNT(DISTINCT session_id) as unique_players,
  AVG(EXTRACT(EPOCH FROM (
    SELECT MAX(timestamp) - MIN(timestamp)
    FROM events e2
    WHERE e2.session_id = e1.session_id
  ))) as avg_session_duration
FROM events e1
GROUP BY EXTRACT(HOUR FROM timestamp), EXTRACT(DOW FROM timestamp)
ORDER BY day_of_week, hour_of_day;
\`\`\`

---

## 🎯 Implementation Priority

### Phase 1 (Quick Wins - 1 day)
1. ✅ Player skill levels
2. ✅ Streak tracking
3. ✅ Return player detection
4. ✅ Device/screen analytics

### Phase 2 (Engagement - 2-3 days)
1. ✅ Attention tracking
2. ✅ Frustration indicators
3. ✅ Tab visibility
4. ✅ Funnel analysis

### Phase 3 (Advanced - 1 week)
1. ✅ A/B testing framework
2. ✅ Cohort analysis
3. ✅ Click heatmaps
4. ✅ Player journey mapping

---

## ⚠️ Important Notes

### OneTrust Compliance
All these new metrics work with your existing OneTrust integration! They will:
- ✅ Only track when performance cookies are consented
- ✅ Include consent data in all tracking calls
- ✅ Be logged in the consent audit trail

### Performance Considerations
- Use throttling/debouncing for high-frequency events (mouse moves, scrolls)
- Batch small events together before sending
- Use localStorage wisely to avoid hitting 5-10MB limits

### Privacy Best Practices
- Never track PII (names, emails, IP addresses directly)
- Use hashed/anonymized identifiers
- Aggregate data where possible
- Provide opt-out mechanisms

---

## 📈 Expected Impact

Implementing these metrics will give you insights like:

- **Player Retention**: Who comes back and why?
- **Difficulty Tuning**: Which questions need adjustment?
- **Engagement Optimization**: When do players lose interest?
- **Viral Growth**: What drives sharing?
- **Conversion Funnels**: Where do players drop off?
- **Skill Progression**: How do players improve over time?

---

Want me to implement any of these enhancements for you? Just let me know which metrics are most valuable for your game!
