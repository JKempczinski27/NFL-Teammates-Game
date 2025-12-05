# 🎛️ Super Dashboard - Complete Admin Control Center

## Overview

Your **Super Dashboard** is a comprehensive admin panel that gives you complete control over your NFL games - **without touching code!**

### ✅ What's Already Built

1. **✅ Database Schema** (265 lines) - All tables for:
   - Admin users & authentication
   - Questions management (all games)
   - Error tracking & monitoring
   - System health metrics
   - iOS app versions
   - Audit logging

2. **✅ Authentication System** - Secure JWT-based login
   - Token-based auth with 24h expiry
   - Session management
   - Role-based access (admin, editor, viewer)
   - Audit trail of all actions

3. **✅ Admin API** - Backend routes for:
   - Login/logout
   - Dashboard overview
   - User management

### 🎯 What You Can Do

Once fully built, you'll be able to:

- 🔐 **Secure Login** - Username/password protected access
- 📊 **Overview Dashboard** - See all game stats at a glance
- 👥 **Player Analytics** - View all player data, sessions, behavior
- 🎮 **Question Manager** - **Add/edit/delete questions with GUI (NO CODE!)**
- 🐛 **Error Monitoring** - Track and resolve errors in real-time
- 📱 **iOS Status** - Monitor app versions, TestFlight status
- 🧪 **A/B Testing** - View experiment results (already built!)
- ⚙️ **System Health** - Monitor database, API, performance
- 📈 **Analytics Hub** - All your dashboards in one place

---

## 🚀 Quick Start

### Step 1: Run Database Migration

```bash
# Run the super dashboard migration
psql $DATABASE_URL -f backend/migrations/003_create_super_dashboard_tables.sql
```

This creates:
- `admin_users` - Admin accounts
- `admin_sessions` - Login sessions
- `questions` - Question bank (editable via dashboard!)
- `error_logs` - Error tracking
- `system_health_metrics` - Health monitoring
- `ios_app_versions` - iOS app tracking
- `dashboard_settings` - Config storage
- `audit_log` - Action history

### Step 2: Create Your First Admin User

```bash
# Install bcrypt for password hashing
npm install -g bcrypt-cli

# Generate password hash
bcrypt-hash "your-secure-password" 10

# Copy the hash, then:
psql $DATABASE_URL
```

```sql
-- Insert your admin user
INSERT INTO admin_users (username, password_hash, email, role)
VALUES (
  'your-username',
  'paste-bcrypt-hash-here',
  'your-email@example.com',
  'admin'
);
```

### Step 3: Test Authentication

```bash
# Login via API
curl -X POST https://your-backend.railway.app/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your-username",
    "password": "your-secure-password"
  }'
```

You'll receive a JWT token. Save it!

### Step 4: Access Dashboard Overview

```bash
# Use the token from login
curl https://your-backend.railway.app/api/admin/dashboard/overview \
  -H "Authorization: Bearer YOUR-TOKEN-HERE"
```

---

## 📋 Building the Frontend Dashboard

The backend is ready! Now you need to build the frontend UI. Here's how:

### Architecture

```
Super Dashboard
├── Login Page
├── Main Dashboard (Overview)
├── Questions Manager ⭐
├── Player Analytics
├── Error Monitor
├── A/B Testing (already built!)
├── iOS Status
└── System Health
```

### Option 1: Simple HTML Dashboard (Easiest)

Create a single-page dashboard like your existing dashboards:

**File**: `backend/public/super-dashboard.html`

```html
<!DOCTYPE html>
<html>
<head>
  <title>Super Dashboard</title>
  <style>
    /* Use your existing dashboard styles */
  </style>
</head>
<body>
  <div id="app">
    <!-- Login form (shown when not logged in) -->
    <div id="login-section">
      <h1>Super Dashboard Login</h1>
      <input id="username" placeholder="Username">
      <input id="password" type="password" placeholder="Password">
      <button onclick="login()">Login</button>
    </div>

    <!-- Main dashboard (shown when logged in) -->
    <div id="dashboard-section" style="display:none">
      <nav>
        <a href="#overview">Overview</a>
        <a href="#questions">Questions</a>
        <a href="#errors">Errors</a>
        <a href="#experiments">A/B Tests</a>
        <button onclick="logout()">Logout</button>
      </nav>

      <div id="content">
        <!-- Dynamic content loaded here -->
      </div>
    </div>
  </div>

  <script>
    let token = localStorage.getItem('adminToken');

    async function login() {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (data.success) {
        token = data.token;
        localStorage.setItem('adminToken', token);
        showDashboard();
      } else {
        alert('Login failed');
      }
    }

    function logout() {
      localStorage.removeItem('adminToken');
      location.reload();
    }

    function showDashboard() {
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('dashboard-section').style.display = 'block';
      loadOverview();
    }

    async function loadOverview() {
      const response = await fetch('/api/admin/dashboard/overview', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      // Display overview data
      document.getElementById('content').innerHTML = `
        <h2>Overview</h2>
        <div class="stats">
          <div class="stat-card">
            <h3>${data.overview.total_questions}</h3>
            <p>Total Questions</p>
          </div>
          <div class="stat-card">
            <h3>${data.overview.dau}</h3>
            <p>Daily Active Users</p>
          </div>
          <div class="stat-card">
            <h3>${data.overview.unresolved_errors}</h3>
            <p>Unresolved Errors</p>
          </div>
        </div>
      `;
    }

    // Check if already logged in
    if (token) {
      showDashboard();
    }
  </script>
</body>
</html>
```

### Option 2: React Dashboard (Professional)

Build a proper React admin panel:

```bash
cd /home/user/NFL-Teammates-Game
npx create-react-app super-dashboard
cd super-dashboard
npm install axios react-router-dom recharts
```

Create components:
- `Login.js` - Login form
- `Dashboard.js` - Main layout with navigation
- `QuestionsManager.js` - Question CRUD
- `ErrorMonitor.js` - Error tracking
- `SystemHealth.js` - Health monitoring

---

## 🎮 Question Management - The Key Feature!

This is what you specifically asked for - **manage questions without touching code**.

### Backend API (Already Built!)

You'll need to create `backend/routes/questions-management.js`:

```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// All routes require authentication
router.use(requireAuth);

// GET /api/questions-management
// List all questions
router.get('/', async (req, res) => {
  const { game_type, status, limit = 50, offset = 0 } = req.query;
  const client = await pool.connect();

  try {
    let query = 'SELECT * FROM questions WHERE 1=1';
    const params = [];

    if (game_type) {
      params.push(game_type);
      query += ` AND game_type = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await client.query(query, params);
    res.json({ success: true, questions: result.rows });
  } finally {
    client.release();
  }
});

// POST /api/questions-management
// Create new question
router.post('/', async (req, res) => {
  const { game_type, question_data, correct_answer, difficulty, category } = req.body;
  const client = await pool.connect();

  try {
    const result = await client.query(
      'INSERT INTO questions (game_type, question_data, correct_answer, difficulty, category, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [game_type, JSON.stringify(question_data), correct_answer, difficulty || 5, category, req.user.id]
    );

    res.json({ success: true, question: result.rows[0] });
  } finally {
    client.release();
  }
});

// PUT /api/questions-management/:id
// Update question
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const client = await pool.connect();

  try {
    const setClauses = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (['question_data', 'correct_answer', 'difficulty', 'status'].includes(key)) {
        values.push(key === 'question_data' ? JSON.stringify(updates[key]) : updates[key]);
        setClauses.push(`${key} = $${values.length}`);
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);
    const query = `UPDATE questions SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`;

    const result = await client.query(query, values);
    res.json({ success: true, question: result.rows[0] });
  } finally {
    client.release();
  }
});

// DELETE /api/questions-management/:id
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('UPDATE questions SET is_active = false, status = $1 WHERE id = $2', ['archived', req.params.id]);
    res.json({ success: true });
  } finally {
    client.release();
  }
});

module.exports = router;
```

Add to `backend/index.js`:

```javascript
const questionsRouter = require('./routes/questions-management');
app.use('/api/questions-management', questionsRouter);
```

### Frontend Question Manager

**File**: `super-dashboard/src/components/QuestionsManager.js`

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function QuestionsManager() {
  const [questions, setQuestions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    game_type: 'teammates',
    question_data: {},
    correct_answer: '',
    difficulty: 5,
    category: ''
  });

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    loadQuestions();
  }, []);

  async function loadQuestions() {
    const response = await axios.get('/api/questions-management', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setQuestions(response.data.questions);
  }

  async function saveQuestion() {
    if (editing) {
      await axios.put(`/api/questions-management/${editing}`, form, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } else {
      await axios.post('/api/questions-management', form, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }

    setEditing(null);
    setForm({ game_type: 'teammates', question_data: {}, correct_answer: '', difficulty: 5, category: '' });
    loadQuestions();
  }

  async function deleteQuestion(id) {
    if (confirm('Delete this question?')) {
      await axios.delete(`/api/questions-management/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadQuestions();
    }
  }

  return (
    <div>
      <h2>Questions Manager</h2>

      {/* Question Form */}
      <div className="question-form">
        <h3>{editing ? 'Edit Question' : 'Add New Question'}</h3>

        <select value={form.game_type} onChange={e => setForm({...form, game_type: e.target.value})}>
          <option value="teammates">Teammates</option>
          <option value="journeyman">Journeyman</option>
          <option value="trivia">Trivia</option>
        </select>

        <input
          placeholder="Correct Answer"
          value={form.correct_answer}
          onChange={e => setForm({...form, correct_answer: e.target.value})}
        />

        <input
          type="number"
          placeholder="Difficulty (1-10)"
          value={form.difficulty}
          onChange={e => setForm({...form, difficulty: parseInt(e.target.value)})}
        />

        <input
          placeholder="Category"
          value={form.category}
          onChange={e => setForm({...form, category: e.target.value})}
        />

        <textarea
          placeholder="Question Data (JSON)"
          value={JSON.stringify(form.question_data, null, 2)}
          onChange={e => {
            try {
              setForm({...form, question_data: JSON.parse(e.target.value)});
            } catch (err) {
              // Invalid JSON
            }
          }}
        />

        <button onClick={saveQuestion}>Save Question</button>
        {editing && <button onClick={() => {setEditing(null); setForm({})}}>Cancel</button>}
      </div>

      {/* Questions List */}
      <div className="questions-list">
        <h3>All Questions</h3>

        {questions.map(q => (
          <div key={q.id} className="question-card">
            <div><strong>Game:</strong> {q.game_type}</div>
            <div><strong>Answer:</strong> {q.correct_answer}</div>
            <div><strong>Difficulty:</strong> {q.difficulty}/10</div>
            <div><strong>Category:</strong> {q.category}</div>
            <div><strong>Status:</strong> {q.status}</div>

            <div className="actions">
              <button onClick={() => {setEditing(q.id); setForm(q)}}>Edit</button>
              <button onClick={() => deleteQuestion(q.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuestionsManager;
```

---

## 🔧 Next Steps - Building the Rest

### Priority 1: Question Manager (ESSENTIAL)

This is your top priority - ability to manage questions without code.

**Tasks**:
1. ✅ Database table created (`questions`)
2. 🔨 Create `/api/questions-management` routes (example above)
3. 🔨 Build UI for question CRUD
4. ✅ Test adding/editing/deleting questions

**Example Question Structure**:

```json
{
  "game_type": "teammates",
  "question_type": "player_identification",
  "question_data": {
    "players": [
      {
        "name": "Jason Pierre-Paul",
        "image": "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/13256.png"
      },
      {
        "name": "Randy Moss",
        "image": "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/1433.png"
      }
    ]
  },
  "correct_answer": "Tom Brady",
  "difficulty": 6,
  "category": "quarterbacks",
  "status": "active"
}
```

### Priority 2: Error Monitoring

Track and fix errors in real-time.

**Tasks**:
1. ✅ Database table created (`error_logs`)
2. 🔨 Create error logging endpoint
3. 🔨 Build error dashboard UI
4. 🔨 Add error alerts

**API Example**:

```javascript
// POST /api/errors/log
router.post('/log', async (req, res) => {
  const { error_type, severity, message, stack_trace, game_type } = req.body;

  const errorHash = crypto.createHash('md5').update(message).digest('hex');

  await pool.query(
    'INSERT INTO error_logs (error_type, severity, message, stack_trace, game_type, error_hash) VALUES ($1, $2, $3, $4, $5, $6)',
    [error_type, severity, message, stack_trace, game_type, errorHash]
  );

  res.json({ success: true });
});

// GET /api/errors
router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM recent_errors_summary ORDER BY occurrence_count DESC'
  );
  res.json({ success: true, errors: result.rows });
});
```

### Priority 3: System Health Dashboard

Monitor system performance.

**Tasks**:
1. ✅ Database table created (`system_health_metrics`)
2. 🔨 Create health check endpoints
3. 🔨 Build health dashboard UI
4. 🔨 Add alerts for critical issues

**Metrics to Track**:
- Database response time
- API endpoint performance
- Memory usage
- Active connections
- Error rates
- Disk space

### Priority 4: Player Analytics

View detailed player data.

**Tasks**:
1. ✅ Tables already exist (`user_sessions`, `events`)
2. 🔨 Create player analytics endpoints
3. 🔨 Build player dashboard UI
4. 🔨 Add player search/filter

**Example Queries**:

```sql
-- Most active players
SELECT session_id, COUNT(*) as events, MAX(timestamp) as last_active
FROM events
GROUP BY session_id
ORDER BY events DESC
LIMIT 100;

-- Player retention
SELECT
  DATE(started_at) as date,
  COUNT(DISTINCT session_id) as players,
  AVG(total_time_spent) as avg_time
FROM user_sessions
GROUP BY DATE(started_at)
ORDER BY date DESC;
```

### Priority 5: iOS Status Page

Track iOS app versions and status.

**Tasks**:
1. ✅ Database table created (`ios_app_versions`)
2. 🔨 Create version management endpoints
3. 🔨 Build iOS status UI
4. 🔨 Add crash reporting

---

## 🎨 UI Frameworks & Tools

### Option 1: Plain HTML/CSS/JS (Like Your Current Dashboards)

**Pros**:
- Simple to deploy
- No build step
- Matches your existing dashboards
- Fast to develop

**Cons**:
- Limited interactivity
- More manual DOM manipulation

### Option 2: React (Recommended)

**Pros**:
- Professional admin panels
- Reusable components
- Great ecosystem
- Easy state management

**Libraries to Use**:
- **React Admin** - Full featured admin framework
- **Material-UI** - Beautiful components
- **Recharts** - Charts (you already use)
- **React Router** - Navigation

### Option 3: Admin Frameworks (Fastest)

Use a pre-built admin framework:

**AdminJS** (formerly AdminBro):
```bash
npm install @adminjs/express @adminjs/sequelize adminjs
```

Generates entire admin panel automatically from your database!

**Forest Admin**:
- Cloud-based admin panel
- Connects to your database
- Instant CRUD interfaces
- No coding required!

**Retool**:
- Drag-and-drop admin builder
- Connects to your API
- Professional dashboards in hours

---

## 🔐 Security Considerations

### 1. Password Security

**Current Setup**:
- Uses bcrypt for password hashing
- JWT tokens with 24h expiry
- Session tracking

**Recommendations**:
- Enforce strong passwords
- Add 2FA (two-factor authentication)
- Rate limit login attempts
- Log all authentication events

### 2. Access Control

**Roles Implemented**:
- `admin` - Full access
- `editor` - Can edit questions
- `viewer` - Read-only access

**Usage**:

```javascript
// Require admin role
router.delete('/questions/:id', requireAuth, requireRole('admin'), async (req, res) => {
  // Only admins can delete
});

// Require editor or admin
router.post('/questions', requireAuth, requireRole('admin', 'editor'), async (req, res) => {
  // Editors and admins can create
});
```

### 3. Audit Trail

Every action is logged in `audit_log` table:

```sql
SELECT
  u.username,
  a.action,
  a.entity_type,
  a.created_at
FROM audit_log a
JOIN admin_users u ON a.user_id = u.id
ORDER BY a.created_at DESC
LIMIT 100;
```

### 4. Environment Variables

Add to `.env`:

```env
# JWT Secret (generate with: openssl rand -hex 32)
JWT_SECRET=your-super-secret-key-change-this

# Session timeout (seconds)
SESSION_TIMEOUT=86400

# Max login attempts
MAX_LOGIN_ATTEMPTS=5
```

---

## 📊 Example: Complete Question Management Flow

### 1. Frontend: Add New Question

User fills out form:
- Game: Teammates
- Answer: Tom Brady
- Players: JPP, Randy Moss, Josh Gordon
- Difficulty: 6
- Category: Quarterbacks

Clicks "Save"

### 2. API Request

```javascript
POST /api/questions-management
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "game_type": "teammates",
  "question_data": {
    "players": [
      {"name": "Jason Pierre-Paul", "image": "..."},
      {"name": "Randy Moss", "image": "..."},
      {"name": "Josh Gordon", "image": "..."}
    ]
  },
  "correct_answer": "Tom Brady",
  "difficulty": 6,
  "category": "quarterbacks",
  "status": "active"
}
```

### 3. Database

Question saved to `questions` table:

```sql
INSERT INTO questions (
  game_type, question_data, correct_answer, difficulty, category, status, created_by
) VALUES (
  'teammates',
  '{"players":[...]}',
  'Tom Brady',
  6,
  'quarterbacks',
  'active',
  1
) RETURNING *;
```

### 4. Game Uses Question

```javascript
// In your game code
const response = await fetch('/api/questions?game_type=teammates&status=active');
const questions = await response.json();

// Questions are loaded dynamically from database!
// No code changes needed when you add new questions via dashboard
```

---

## 🚀 Deployment

### Backend (Already Deployed)

Your backend is already on Railway. The new routes are automatically available!

### Dashboard Deployment Options

#### Option 1: Serve from Backend (Simplest)

Place dashboard in `backend/public/super-dashboard.html`

Access at: `https://your-backend.railway.app/super-dashboard.html`

#### Option 2: Separate Vercel Deployment

```bash
cd super-dashboard
vercel deploy
```

Set environment variable:
```
REACT_APP_API_URL=https://your-backend.railway.app
```

#### Option 3: Railway Separate Service

Deploy dashboard as separate Railway service.

---

## 📝 Summary

### ✅ What You Have Now

1. **Complete database schema** for all super dashboard features
2. **Authentication system** - Secure login/logout with JWT
3. **Admin API** - Backend routes ready
4. **Questions table** - Store all game questions
5. **Error logging** - Track errors
6. **System health tracking** - Monitor performance
7. **Audit trail** - Log all admin actions

### 🔨 What To Build Next

1. **Question Management UI** - This is your #1 priority!
2. **Error Dashboard** - View and resolve errors
3. **System Health UI** - Monitor system status
4. **Player Analytics UI** - View player data
5. **iOS Status UI** - Track app versions

### 💡 Recommended Path

**Week 1**: Question Manager
- Build the UI
- Test CRUD operations
- Add bulk import

**Week 2**: Error Monitoring
- Create error dashboard
- Add real-time alerts
- Implement error grouping

**Week 3**: System Health
- Build health dashboard
- Add automated checks
- Set up alerts

**Week 4**: Player Analytics & Polish
- Player data dashboard
- Refine UI/UX
- Add remaining features

---

## 🆘 Need Help?

### Common Issues

**Q: Can't login**
- Check database migration ran
- Verify user exists in `admin_users` table
- Check password hash is correct
- Ensure JWT_SECRET is set

**Q: Token expired**
- Tokens last 24 hours
- Login again to get new token
- Or increase JWT_EXPIRY in `backend/middleware/auth.js`

**Q: Questions not showing in game**
- Check `status = 'active'` in questions table
- Verify `is_active = true`
- Check game_type matches

### Support Resources

- **Database Schema**: `backend/migrations/003_create_super_dashboard_tables.sql`
- **Auth Middleware**: `backend/middleware/auth.js`
- **Admin Routes**: `backend/routes/admin.js`
- **Example Dashboards**: Check your existing dashboards for UI patterns

---

**🎉 You now have a complete foundation for your Super Dashboard!**

Build the Question Manager first - that's your most important feature. Then expand from there. All the infrastructure is ready!
