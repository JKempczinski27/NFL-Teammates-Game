# A/B Testing System - Complete Guide

## 🎯 Overview

Your NFL Games now include a comprehensive A/B testing framework that lets you run content experiments and view results in a beautiful dashboard. Test anything from button colors to complete UI redesigns!

**Features**:
- ✅ Easy experiment creation and management
- ✅ Automatic variant assignment with consistent user experience
- ✅ Statistical significance calculations (z-scores, p-values)
- ✅ Beautiful dashboard with real-time results
- ✅ OneTrust GDPR-compliant (respects cookie consent)
- ✅ Multiple experiments running simultaneously
- ✅ Support for all game types

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Setup](#setup)
3. [Creating Experiments](#creating-experiments)
4. [Using Experiments in Your Code](#using-experiments-in-your-code)
5. [Viewing Results](#viewing-results)
6. [API Reference](#api-reference)
7. [Best Practices](#best-practices)
8. [Statistical Analysis](#statistical-analysis)
9. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### 1. Run Database Migration

```bash
psql $DATABASE_URL -f backend/migrations/002_create_ab_testing_tables.sql
```

### 2. Create Your First Experiment

```javascript
import { useExperiment, trackGoal } from './utils/experiments';

function MyComponent() {
  // Assign user to experiment
  const variant = useExperiment(
    'button_color_test',
    [
      { id: 'control', name: 'Blue Button', weight: 50 },
      { id: 'green', name: 'Green Button', weight: 50 }
    ],
    100 // 100% of users
  );

  // Use variant to change UI
  const buttonColor = variant === 'green' ? 'green' : 'blue';

  // Track conversion
  const handleClick = () => {
    trackGoal('button_color_test', 'conversion', 1);
  };

  return (
    <button style={{ backgroundColor: buttonColor }} onClick={handleClick}>
      Click Me!
    </button>
  );
}
```

### 3. View Results

Visit: `https://your-backend-url.railway.app/experiments-dashboard.html`

---

## ⚙️ Setup

### Database Setup

Run the migration to create necessary tables:

```bash
# Production
psql $DATABASE_URL -f backend/migrations/002_create_ab_testing_tables.sql

# Local development
psql -U postgres -d nfl_games -f backend/migrations/002_create_ab_testing_tables.sql
```

**Tables created**:
- `experiments` - Experiment configurations
- `experiment_assignments` - User-variant assignments
- `experiment_events` - Event tracking for experiments
- `experiment_results` (materialized view) - Pre-calculated results

### Frontend Setup

The experiment utilities are already created at:
- `nfl-teammates-game/src/utils/experiments.js`

Import them in your components:

```javascript
import {
  useExperiment,
  trackGoal,
  trackExperimentEvent,
  ExperimentHelpers
} from './utils/experiments';
```

### Backend Setup

The API routes are already integrated. Available endpoints:
- `POST /api/experiments` - Create experiment
- `GET /api/experiments` - List experiments
- `GET /api/experiments/:id` - Get experiment details
- `GET /api/experiments/:id/results` - Get results with statistics
- `POST /api/experiments/assign` - Track assignment (auto-called)
- `POST /api/experiments/event` - Track event (auto-called)

---

## 📝 Creating Experiments

### Method 1: In-Code Definition (Recommended)

Edit `nfl-teammates-game/src/utils/experiments.js`:

```javascript
export const EXPERIMENTS = {
  // Add your experiment here
  MY_NEW_TEST: {
    name: 'my_new_test',
    variants: [
      { id: 'control', name: 'Original', weight: 50 },
      { id: 'variant_a', name: 'New Design', weight: 50 }
    ],
    trafficAllocation: 100, // 100% of users
    primaryMetric: 'completion_rate',
    description: 'Testing new design for better engagement'
  }
};
```

Then use in your component:

```javascript
const variant = useExperiment(
  EXPERIMENTS.MY_NEW_TEST.name,
  EXPERIMENTS.MY_NEW_TEST.variants,
  EXPERIMENTS.MY_NEW_TEST.trafficAllocation
);
```

### Method 2: Via API

Create experiment via API call:

```bash
curl -X POST https://your-api.railway.app/api/experiments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "button_size_test",
    "description": "Testing larger submit buttons",
    "hypothesis": "Larger buttons will increase completion rate",
    "game_type": "teammates",
    "variants": [
      {"id": "control", "name": "Normal Size", "weight": 50},
      {"id": "large", "name": "Large Size", "weight": 50}
    ],
    "traffic_allocation": 100,
    "primary_metric": "completion_rate",
    "status": "active",
    "tags": ["ui", "conversion"]
  }'
```

### Method 3: Inline (Quick Tests)

For quick experiments without configuration:

```javascript
const variant = useExperiment(
  'quick_test',
  [
    { id: 'control', weight: 50 },
    { id: 'variant_a', weight: 50 }
  ],
  100
);
```

---

## 💻 Using Experiments in Your Code

### Basic Usage

```javascript
import { useExperiment, trackGoal } from './utils/experiments';

function MyComponent() {
  // 1. Assign variant
  const variant = useExperiment(
    'test_name',
    [
      { id: 'control', weight: 50 },
      { id: 'variant_a', weight: 50 }
    ],
    100
  );

  // 2. Conditional rendering
  return variant === 'variant_a' ? (
    <NewComponent />
  ) : (
    <OldComponent />
  );
}
```

### Tracking Goals

```javascript
// Track when user completes desired action
const handleComplete = () => {
  trackGoal('test_name', 'completion', 1);
};

// Track with custom value
const handlePurchase = (amount) => {
  trackGoal('test_name', 'revenue', amount);
};
```

### Tracking Custom Events

```javascript
import { trackExperimentEvent } from './utils/experiments';

// Track any custom event
trackExperimentEvent(
  'test_name',
  'button_click',
  { buttonId: 'submit', page: 'question_3' },
  1
);
```

### Helper Functions

```javascript
import { ExperimentHelpers } from './utils/experiments';

// Track button click
ExperimentHelpers.trackButtonClick('test_name', 'submit_button');

// Track page view
ExperimentHelpers.trackPageView('test_name', 'question_page');

// Track conversion
ExperimentHelpers.trackConversion('test_name', 'game_complete', 0);

// Track duration
ExperimentHelpers.trackDuration('test_name', 'time_to_complete', 45000);
```

---

## 📊 Viewing Results

### Dashboard

Access the experiments dashboard at:
```
https://your-backend-url.railway.app/experiments-dashboard.html
```

**Features**:
- View all experiments (active, completed, draft)
- See participant counts and conversion rates
- Statistical significance badges
- Lift calculations (% improvement)
- Interactive charts
- Real-time refresh

### What You'll See

**For Each Variant**:
- Participants
- Completions
- Completion rate
- Shares per user
- Average scores
- Time to complete

**Statistical Analysis**:
- Lift percentage (% improvement vs control)
- Z-score
- P-value
- Confidence level
- Significance badge (significant / not significant)

### Example Dashboard View

```
Experiment: Button Color Test
Status: Active
Primary Metric: completion_rate

┌─────────────────────┬──────────────┬──────────────┐
│ Metric              │ Control      │ Green Button │
├─────────────────────┼──────────────┼──────────────┤
│ Participants        │ 1,247        │ 1,289        │
│ Completions         │ 856          │ 965          │
│ Completion Rate     │ 68.6%        │ 74.9%        │
│ Lift                │ --           │ ↑ 9.2% 🏆    │
│ Significance        │ --           │ Significant  │
│ P-value             │ --           │ 0.0034       │
│ Confidence          │ --           │ 99.66%       │
└─────────────────────┴──────────────┴──────────────┘

Winner: Green Button (9.2% lift with 99.66% confidence)
```

---

## 📚 API Reference

### Frontend API

#### `useExperiment(name, variants, trafficAllocation)`

Assigns user to experiment variant.

**Parameters**:
- `name` (string) - Experiment name
- `variants` (array) - Array of variant configs: `[{id, name?, weight}, ...]`
- `trafficAllocation` (number) - Percentage of users to include (0-100)

**Returns**: `string|null` - Variant ID or null if not in experiment

**Example**:
```javascript
const variant = useExperiment(
  'ui_test',
  [
    { id: 'control', weight: 50 },
    { id: 'variant_a', weight: 50 }
  ],
  100
);
```

#### `trackGoal(experimentName, goalType, value)`

Tracks goal conversion.

**Parameters**:
- `experimentName` (string) - Name of experiment
- `goalType` (string) - Type of goal: 'completion', 'share', 'click', etc.
- `value` (number) - Numeric value (default: 1)

**Example**:
```javascript
trackGoal('ui_test', 'conversion', 1);
trackGoal('ui_test', 'revenue', 29.99);
```

#### `trackExperimentEvent(experimentName, eventType, eventData, metricValue)`

Tracks custom event.

**Parameters**:
- `experimentName` (string)
- `eventType` (string)
- `eventData` (object) - Additional data
- `metricValue` (number) - Optional metric value

**Example**:
```javascript
trackExperimentEvent(
  'ui_test',
  'button_click',
  { buttonId: 'submit', page: 'home' },
  1
);
```

#### `getVariant(experimentName)`

Get assigned variant without triggering new assignment.

**Returns**: `string|null`

#### `isInExperiment(experimentName)`

Check if user is assigned to experiment.

**Returns**: `boolean`

#### `initializeExperiments()`

Initialize all experiments defined in `EXPERIMENTS` config.

**Returns**: `object` - Map of experiment names to assigned variants

**Example**:
```javascript
useEffect(() => {
  const assignments = initializeExperiments();
  console.log('Assigned to:', assignments);
  // { ui_test: 'control', button_test: 'variant_a' }
}, []);
```

### Backend API

#### `GET /api/experiments`

List all experiments.

**Query Parameters**:
- `status` - Filter by status: active, completed, draft, paused
- `game_type` - Filter by game: teammates, journeyman, trivia, all

**Response**:
```json
{
  "success": true,
  "experiments": [...],
  "count": 5
}
```

#### `GET /api/experiments/:id`

Get experiment details.

**Response**:
```json
{
  "success": true,
  "experiment": {...},
  "assignments": [...],
  "events": [...]
}
```

#### `GET /api/experiments/:id/results`

Get experiment results with statistical analysis.

**Response**:
```json
{
  "success": true,
  "results": [...],
  "statistics": [
    {
      "variant_id": "variant_a",
      "control_rate": 68.6,
      "variant_rate": 74.9,
      "lift": "9.2",
      "z_score": "2.9234",
      "p_value": "0.0034",
      "is_significant": true,
      "confidence_level": "99.66"
    }
  ]
}
```

#### `POST /api/experiments`

Create new experiment.

**Request Body**:
```json
{
  "name": "test_name",
  "description": "Test description",
  "hypothesis": "We believe...",
  "game_type": "teammates",
  "variants": [
    {"id": "control", "name": "Control", "weight": 50},
    {"id": "variant_a", "name": "Variant A", "weight": 50}
  ],
  "traffic_allocation": 100,
  "primary_metric": "completion_rate",
  "secondary_metrics": ["time_to_complete", "share_rate"],
  "status": "draft"
}
```

#### `PUT /api/experiments/:id`

Update experiment configuration.

#### `DELETE /api/experiments/:id`

Delete experiment (only if status is 'draft').

---

## 🎓 Best Practices

### 1. Start with a Hypothesis

✅ **Good**: "Larger submit buttons will increase completion rate by 10%"
❌ **Bad**: "Let's try a different button color"

### 2. Test One Thing at a Time

❌ **Bad**: Testing button color AND text AND size simultaneously
✅ **Good**: Test button color first, then test text, then test size

### 3. Sample Size Matters

Minimum recommended participants per variant:
- **Small effect** (2-5% lift): 1,000+ per variant
- **Medium effect** (5-10% lift): 500+ per variant
- **Large effect** (10%+ lift): 200+ per variant

### 4. Wait for Statistical Significance

Don't stop experiments early! Wait for:
- P-value < 0.05 (95% confidence)
- Sufficient sample size
- At least 1-2 weeks of data (capture weekly patterns)

### 5. Document Everything

```javascript
export const EXPERIMENTS = {
  UI_LAYOUT: {
    name: 'ui_layout_v2',
    // Always include description and hypothesis
    description: 'Testing new grid layout for player cards',
    hypothesis: 'Grid layout will improve completion rate by showing all players at once',
    variants: [...],
    primaryMetric: 'completion_rate',
    // Add tags for organization
    tags: ['ui', 'engagement', 'q4-2024']
  }
};
```

### 6. Clean Up Finished Experiments

After experiment concludes:
1. Implement winning variant for all users
2. Remove experiment code
3. Mark experiment as "completed" in database
4. Document learnings

---

## 📈 Statistical Analysis

### Understanding the Metrics

**Z-Score**: Measures how many standard deviations the variant is from the control
- |Z| > 1.96 → 95% confidence (significant)
- |Z| > 2.58 → 99% confidence (highly significant)

**P-Value**: Probability that the difference is due to chance
- P < 0.05 → Statistically significant (95% confidence)
- P < 0.01 → Highly significant (99% confidence)

**Lift**: Percentage improvement over control
- Positive lift = Variant is better
- Negative lift = Control is better

**Confidence Level**: (1 - P-value) × 100%
- 95%+ → Safe to make decisions
- < 95% → Need more data

### When to Call a Winner

✅ **Safe to implement**:
- P-value < 0.05
- Lift > 5%
- Sample size > 500 per variant
- Ran for at least 1 week

⚠️ **Needs more data**:
- P-value > 0.05
- Sample size < 200
- Ran for < 3 days

❌ **Inconclusive**:
- Lift < 2%
- P-value > 0.10
- No clear winner after 4 weeks

---

## 🔧 Troubleshooting

### Experiment not tracking data

**Check**:
1. Database migration ran successfully
2. OneTrust consent is given (performance cookies)
3. Backend API is accessible
4. Browser console for errors

### Users seeing inconsistent variants

**Cause**: User changing devices/browsers

**Solution**: Variants are assigned per sessionId (stored in localStorage). Different devices = different sessionIds = potentially different variants. This is expected behavior.

### Statistical significance not showing

**Possible causes**:
1. Not enough participants (need 100+ per variant minimum)
2. Variants performing identically
3. High variance in data

**Solution**: Wait for more data or increase traffic allocation.

### Dashboard not loading

**Check**:
1. Backend is running
2. Database tables exist
3. Network tab in browser DevTools for API errors
4. CORS is enabled on backend

### Experiment results seem wrong

**Debug steps**:
1. Check assignment counts: `SELECT variant_id, COUNT(*) FROM experiment_assignments WHERE experiment_id = X GROUP BY variant_id`
2. Check event counts: `SELECT event_type, variant_id, COUNT(*) FROM experiment_events WHERE experiment_id = X GROUP BY event_type, variant_id`
3. Refresh materialized view: `SELECT refresh_experiment_results()`

---

## 🎯 Example Use Cases

### 1. Test Question Difficulty Order

```javascript
const orderVariant = useExperiment(
  'question_order',
  [
    { id: 'random', weight: 33 },
    { id: 'easy_first', weight: 33 },
    { id: 'hard_first', weight: 34 }
  ],
  100
);

// Apply ordering
const orderedQuestions = orderQuestions(questions, orderVariant);

// Track completion
trackGoal('question_order', 'completion', 1);
```

### 2. Test Call-to-Action Text

```javascript
const ctaVariant = useExperiment('cta_text', [
  { id: 'control', weight: 50 },
  { id: 'urgent', weight: 50 }
], 100);

const buttonText = ctaVariant === 'urgent' ? 'Play Now!' : 'Start Game';

<Button onClick={() => trackGoal('cta_text', 'click', 1)}>
  {buttonText}
</Button>
```

### 3. Test Complete UI Redesign

```javascript
const uiVariant = useExperiment('ui_redesign', [
  { id: 'current', weight: 50 },
  { id: 'new', weight: 50 }
], 50); // Only 50% of users in experiment

return uiVariant === 'new' ? <NewUI /> : <CurrentUI />;
```

---

## 📖 Additional Resources

- **Database Schema**: `backend/migrations/002_create_ab_testing_tables.sql`
- **Frontend Utils**: `nfl-teammates-game/src/utils/experiments.js`
- **Backend API**: `backend/routes/experiments.js`
- **Dashboard**: `backend/public/experiments-dashboard.html`
- **Examples**: `nfl-teammates-game/src/App.example-experiments.js`

---

## ✅ Checklist

Before launching your first experiment:

- [ ] Database migration completed
- [ ] OneTrust consent integration working
- [ ] Experiment defined in code or via API
- [ ] Variant assignment working (check localStorage)
- [ ] Goal tracking implemented
- [ ] Dashboard accessible
- [ ] Hypothesis documented
- [ ] Success metrics defined
- [ ] Sample size calculated
- [ ] Experiment duration planned (minimum 1 week)

---

**Ready to start testing?** 🚀

Create your first experiment and start optimizing your game for better engagement!
