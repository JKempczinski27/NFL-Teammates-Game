# OneTrust Integration Setup Guide

This guide will help you complete the OneTrust cookie consent integration for your NFL Games platform. All the code is ready - you just need to add your OneTrust credentials.

## 🎯 What's Already Implemented

✅ OneTrust SDK integrated in all apps (nfl-teammates-game, landing-page, journeyman, nfl-trivia-game)
✅ Cookie consent banner configured with standard categories
✅ React hook (`useOneTrust`) for managing consent in components
✅ Automatic consent checking before analytics tracking
✅ Backend consent verification and audit logging
✅ Database migration for consent logs
✅ Environment variable configuration ready

## 📋 Prerequisites

Before you begin, make sure you have:

1. **OneTrust Account**: Sign up at https://my.onetrust.com/ if you don't have one
2. **Domain Script ID**: This is your unique OneTrust identifier (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
3. **Database Access**: PostgreSQL database for storing consent logs

## 🚀 Quick Start (5 Steps)

### Step 1: Get Your OneTrust Domain Script ID

1. Log in to OneTrust at https://my.onetrust.com/
2. Navigate to **Cookie Compliance** → **Scripts**
3. Find your **Domain Script ID** (it looks like a UUID)
4. Copy this ID - you'll need it for all apps

### Step 2: Configure Environment Variables

Create `.env` files for each app using the provided `.env.example` templates:

#### For nfl-teammates-game:
```bash
cd nfl-teammates-game
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID=your-domain-script-id-here
REACT_APP_ONETRUST_ENV=production
REACT_APP_API_URL=https://nfl-teammates-game-production.up.railway.app
```

#### For landing-page:
```bash
cd landing-page
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID=your-domain-script-id-here
REACT_APP_ONETRUST_ENV=production
```

#### For journeyman:
```bash
cd journeyman
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID=your-domain-script-id-here
REACT_APP_ONETRUST_ENV=production
REACT_APP_API_URL=http://localhost:8080
```

#### For nfl-trivia-game:
```bash
cd nfl-trivia-game
cp .env.example .env
```

Edit `.env`:
```env
VITE_ONETRUST_DOMAIN_SCRIPT_ID=your-domain-script-id-here
VITE_ONETRUST_ENV=production
```

**Important**: Replace `your-domain-script-id-here` with your actual OneTrust Domain Script ID in all files.

### Step 3: Set Up Database

Run the database migration to create the consent logging table:

```bash
# Connect to your PostgreSQL database
psql $DATABASE_URL -f backend/migrations/001_create_consent_log_table.sql
```

Or manually run the SQL:
```sql
CREATE TABLE IF NOT EXISTS consent_log (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  consent_timestamp TIMESTAMP NOT NULL,
  necessary BOOLEAN DEFAULT false,
  performance BOOLEAN DEFAULT false,
  functional BOOLEAN DEFAULT false,
  targeting BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_log_session_id ON consent_log(session_id);
CREATE INDEX IF NOT EXISTS idx_consent_log_timestamp ON consent_log(consent_timestamp);
```

### Step 4: Configure Cookie Categories in OneTrust

In your OneTrust dashboard, configure these standard cookie categories:

| Category ID | Category Name | Description |
|-------------|---------------|-------------|
| C0001 | Strictly Necessary | Required for basic site functionality (always active) |
| C0002 | Performance Cookies | Analytics and usage tracking |
| C0003 | Functional Cookies | Enhanced features and personalization |
| C0004 | Targeting Cookies | Advertising and marketing |

**Note**: The integration is already configured to use these standard category IDs.

### Step 5: Deploy Environment Variables

#### For Vercel (Frontend):
```bash
# Add environment variables to Vercel
vercel env add REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID
# Enter your Domain Script ID when prompted

vercel env add REACT_APP_ONETRUST_ENV
# Enter: production
```

Or add them via the Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add `REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID` with your Domain Script ID
3. Add `REACT_APP_ONETRUST_ENV` with value `production`

#### For Railway (Backend):
No backend environment variables needed for OneTrust - consent is handled client-side and validated on request.

## 🧪 Testing Your Integration

### Local Testing

1. **Start the development server**:
   ```bash
   cd nfl-teammates-game
   npm start
   ```

2. **Check the browser console** for OneTrust logs:
   - You should see the cookie consent banner appear
   - Console should show: `[OneTrust] Consent loaded`

3. **Test consent workflow**:
   - Accept cookies → Analytics should track events
   - Reject cookies → Console shows: `[OneTrust] Skipping event - no performance cookie consent`

4. **Verify database logging**:
   ```sql
   SELECT * FROM consent_log ORDER BY created_at DESC LIMIT 10;
   ```

### Production Testing

1. **Deploy all apps** with environment variables set
2. **Open browser DevTools** → Network tab
3. **Visit your site** and verify:
   - OneTrust SDK loads from `cdn.cookielaw.org`
   - Cookie banner appears
   - Consent choices are respected
   - Tracking endpoints receive consent data

## 📖 How It Works

### Cookie Consent Flow

```
User visits site
    ↓
OneTrust SDK loads
    ↓
Cookie banner displays
    ↓
User makes choice
    ↓
OptanonWrapper() callback fires
    ↓
window.oneTrustConsent object updated
    ↓
Custom event 'oneTrustConsentUpdate' dispatched
    ↓
React components listen via useOneTrust hook
    ↓
trackEvent() checks consent before sending data
    ↓
Backend verifies consent and logs to database
```

### React Component Usage

Use the `useOneTrust` hook in any component:

```jsx
import { useOneTrust } from './hooks/useOneTrust';

function MyComponent() {
  const consent = useOneTrust();

  // Check if analytics is allowed
  if (consent.performance) {
    trackEvent('page_view', { page: 'home' });
  }

  // Show cookie settings button
  return (
    <button onClick={consent.showPreferences}>
      Cookie Settings
    </button>
  );
}
```

### Helper Functions

```javascript
import { canTrackAnalytics, canShowAdvertising } from './hooks/useOneTrust';

// Quick check for analytics consent
if (canTrackAnalytics()) {
  trackAnalytics();
}

// Quick check for advertising consent
if (canShowAdvertising()) {
  loadAdvertising();
}
```

## 🔒 Privacy & Compliance

### GDPR Compliance

✅ **Consent Before Tracking**: No analytics run until user consents to performance cookies
✅ **Audit Trail**: All consent decisions logged in `consent_log` table
✅ **User Control**: Users can change preferences anytime via preference center
✅ **Transparency**: Clear cookie categories and descriptions

### Cookie Categories

| Category | What We Track | User Can Opt Out |
|----------|---------------|------------------|
| Strictly Necessary | Session IDs, game state | ❌ No (required) |
| Performance | Game analytics, user behavior | ✅ Yes |
| Functional | Preferences, settings | ✅ Yes |
| Targeting | (Not currently used) | ✅ Yes |

### Data Retention

Consent logs are stored indefinitely for compliance purposes. To implement data retention policies:

```sql
-- Delete consent logs older than 2 years
DELETE FROM consent_log WHERE created_at < NOW() - INTERVAL '2 years';
```

## 🛠️ Advanced Configuration

### Custom Cookie Categories

If your OneTrust account uses custom category IDs, update the HTML files:

```javascript
// In public/index.html OptanonWrapper()
const hasAnalytics = allowedGroups.includes("YOUR_CUSTOM_ID");
```

### Different Environments

Use different Domain Script IDs for staging vs production:

```env
# .env.development
REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID=staging-domain-script-id

# .env.production
REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID=production-domain-script-id
```

### Disable OneTrust for Development

To temporarily disable OneTrust during local development:

```env
# .env.local
REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID=
```

This will prevent the OneTrust SDK from loading.

## 🐛 Troubleshooting

### Cookie Banner Not Showing

**Problem**: OneTrust banner doesn't appear

**Solutions**:
1. Check browser console for errors
2. Verify Domain Script ID is correct
3. Check OneTrust dashboard - ensure script is published
4. Clear browser cookies and cache
5. Verify environment variable is set: `echo $REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID`

### Analytics Still Tracking After Rejecting Cookies

**Problem**: Events are tracked even when cookies are rejected

**Solutions**:
1. Check browser console for OneTrust consent state:
   ```javascript
   console.log(window.oneTrustConsent);
   ```
2. Verify `canTrackAnalytics()` returns false
3. Check backend logs for consent verification messages
4. Clear localStorage and cookies, then retry

### Environment Variables Not Working

**Problem**: `%REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID%` appears in HTML source

**Solutions**:
1. Ensure `.env` file is in the app root directory
2. Restart development server after adding `.env` file
3. Verify variable name starts with `REACT_APP_` (CRA) or `VITE_` (Vite)
4. Check build logs for environment variable warnings
5. For Vite apps, ensure `vite.config.js` has the `htmlEnvPlugin`

### Database Errors

**Problem**: Backend shows "consent_log table doesn't exist"

**Solutions**:
1. Run the migration: `psql $DATABASE_URL -f backend/migrations/001_create_consent_log_table.sql`
2. Verify database connection: `psql $DATABASE_URL -c "SELECT 1;"`
3. Check table exists: `psql $DATABASE_URL -c "\dt consent_log"`

## 📚 Files Modified/Created

### Environment Configuration
- `nfl-teammates-game/.env.example`
- `landing-page/.env.example`
- `journeyman/.env.example`
- `nfl-trivia-game/.env.example`

### HTML Entry Points
- `nfl-teammates-game/public/index.html` - OneTrust SDK added
- `landing-page/public/index.html` - OneTrust SDK added
- `journeyman/public/index.html` - OneTrust SDK + Adobe Analytics integration
- `nfl-trivia-game/index.html` - Updated to use env variables

### React Code
- `nfl-teammates-game/src/hooks/useOneTrust.js` - New React hook
- `nfl-teammates-game/src/App.js` - Consent checking integrated

### Backend
- `backend/routes/track.js` - Consent verification added
- `backend/migrations/001_create_consent_log_table.sql` - Database migration

### Configuration
- `nfl-trivia-game/vite.config.js` - HTML env variable plugin added

### Documentation
- `ONETRUST_SETUP.md` - This file

## 🎓 Next Steps

After completing the setup:

1. **Test thoroughly** in development and staging environments
2. **Monitor consent rates** via OneTrust dashboard
3. **Review consent logs** regularly for compliance
4. **Update privacy policy** to reflect cookie usage
5. **Train team** on how cookie consent works

## 📞 Support

### OneTrust Support
- Documentation: https://my.onetrust.com/s/support
- Support Portal: https://my.onetrust.com/s/contactsupport

### Code-Related Issues
- Check browser console for errors
- Review backend logs for consent verification messages
- Verify environment variables are set correctly
- Test with browser DevTools → Application → Cookies

## 🔗 Useful Links

- [OneTrust Developer Documentation](https://developer.onetrust.com/)
- [OneTrust Cookie Compliance](https://www.onetrust.com/products/cookie-consent/)
- [GDPR Compliance Checklist](https://gdpr.eu/checklist/)
- [React Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## ✅ Integration Checklist

Use this checklist to verify your OneTrust integration is complete:

- [ ] OneTrust account created
- [ ] Domain Script ID obtained
- [ ] `.env` files created for all 4 apps
- [ ] Environment variables set with Domain Script ID
- [ ] Database migration run (`consent_log` table created)
- [ ] Cookie categories configured in OneTrust dashboard
- [ ] Local testing completed (banner appears, consent works)
- [ ] Environment variables deployed to Vercel
- [ ] Production testing completed
- [ ] Consent logs verified in database
- [ ] Privacy policy updated
- [ ] Team trained on cookie consent workflow

---

**You're all set!** 🎉 Once you add your OneTrust credentials, the integration will be fully functional and GDPR-compliant.
