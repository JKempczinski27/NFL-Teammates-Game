# OneTrust Cookie Consent Integration

This document explains the OneTrust cookie consent integration across all applications in the NFL Games Hub monorepo.

## Overview

OneTrust is a cookie consent management platform that helps ensure compliance with privacy regulations like GDPR and CCPA. It allows users to control which types of cookies they consent to, and applications can respond accordingly.

## Cookie Categories

OneTrust uses standardized cookie categories:

- **C0001 - Strictly Necessary**: Essential cookies required for the application to function. These cannot be disabled.
- **C0002 - Performance/Analytics**: Cookies that help us understand how users interact with our applications (e.g., Google Analytics).
- **C0003 - Functional**: Cookies that enable enhanced functionality and personalization.
- **C0004 - Targeting/Marketing**: Cookies used for advertising and marketing purposes.

## Getting Your OneTrust Credentials

1. Log in to your [OneTrust account](https://my.onetrust.com/)
2. Navigate to **Cookie Compliance** > **Scripts**
3. Find your **Domain Script ID** (format: `01234567-89ab-cdef-0123-456789abcdef`)
4. Copy this ID - you'll need it for configuration

If you don't have an OneTrust account, you can:
- Sign up at [OneTrust](https://www.onetrust.com/)
- Use OneTrust's free tier for development/testing
- Contact your organization's privacy/legal team if OneTrust is already in use

## Configuration

### 1. Landing Page (Create React App)

**File**: `landing-page/.env`

```bash
REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID=your-domain-script-id-here
```

Copy from `landing-page/.env.example` and replace with your actual Domain Script ID.

### 2. NFL Teammates Game (Create React App)

**File**: `games/nfl-teammates-game/.env`

```bash
REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID=your-domain-script-id-here
REACT_APP_API_URL=http://localhost:3001
```

Copy from `games/nfl-teammates-game/.env.example` and replace with your values.

### 3. Journeyman Game (Create React App)

**File**: `games/journeyman/.env`

```bash
REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID=your-domain-script-id-here
REACT_APP_ADOBE_REPORT_SUITE_ID=your-rsid-here
REACT_APP_ADOBE_TRACKING_SERVER=your-tracking-server-here
REACT_APP_API_URL=http://localhost:3001
```

Copy from `games/journeyman/.env.example` and replace with your values.

### 4. NFL Trivia Game (Vite)

**File**: `games/nfl-trivia-game/.env`

```bash
# Note: Vite uses VITE_ prefix instead of REACT_APP_
VITE_ONETRUST_DOMAIN_SCRIPT_ID=your-domain-script-id-here
VITE_API_URL=http://localhost:3001
```

Copy from `games/nfl-trivia-game/.env.example` and replace with your values.

**Important**: The Vite app uses `VITE_` prefix for environment variables, not `REACT_APP_`.

## HTML Integration

OneTrust is integrated in all HTML files via two scripts:

1. **OneTrust SDK Stub**: Loads the OneTrust SDK
2. **OptanonWrapper Function**: Callback that executes when consent is loaded

Example from `landing-page/public/index.html`:

```html
<!-- OneTrust Cookies Consent Notice -->
<script src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"
        type="text/javascript"
        charset="UTF-8"
        data-domain-script="%REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID%"></script>
<script type="text/javascript">
  function OptanonWrapper() {
    console.log("🍪 OneTrust consent loaded");

    const allowedGroups = window.OnetrustActiveGroups || "";

    const hasNecessary = allowedGroups.includes("C0001");
    const hasAnalytics = allowedGroups.includes("C0002");

    if (hasNecessary) {
      console.log("✅ Necessary cookies consented");
      window.canStartGame = true;
    }

    if (hasAnalytics) {
      console.log("📊 Analytics cookies consented");
      // Initialize analytics here
    }
  }
</script>
```

## Using OneTrust in React Components

### Shared Configuration Module

The `backend/onetrust-config.js` file provides shared constants and helper functions:

```javascript
import { COOKIE_CATEGORIES, hasConsentFor } from '../backend/onetrust-config';

// Check if user has consented to analytics
if (hasConsentFor(COOKIE_CATEGORIES.PERFORMANCE)) {
  initializeAnalytics();
}
```

### React Hook

The `backend/useOneTrust.js` file provides a custom React hook for consent management:

```javascript
import { useOneTrust } from '../backend/useOneTrust';

function MyComponent() {
  const {
    consentLoaded,
    hasAnalyticsConsent,
    hasFunctionalConsent,
    showPreferenceCenter,
    getConsentedCategories
  } = useOneTrust();

  useEffect(() => {
    if (hasAnalyticsConsent) {
      // Initialize analytics
      initializeGoogleAnalytics();
    }
  }, [hasAnalyticsConsent]);

  return (
    <div>
      <button onClick={showPreferenceCenter}>
        Cookie Settings
      </button>

      {consentLoaded && (
        <p>Consented to: {getConsentedCategories().join(', ')}</p>
      )}
    </div>
  );
}
```

### Available Hook Properties

The `useOneTrust()` hook returns:

- `consentLoaded` (boolean): Whether OneTrust has finished loading
- `activeGroups` (string): Raw string of active consent groups
- `hasNecessaryConsent` (boolean): C0001 consent status
- `hasAnalyticsConsent` (boolean): C0002 consent status
- `hasFunctionalConsent` (boolean): C0003 consent status
- `hasTargetingConsent` (boolean): C0004 consent status
- `hasConsent(categoryId)` (function): Check specific category
- `getConsentedCategories()` (function): Get array of consented category names
- `showPreferenceCenter()` (function): Show OneTrust preference dialog

## Testing the Integration

### 1. Start the Applications

```bash
# Terminal 1: Start backend
npm run start:backend

# Terminal 2: Start landing page
npm run start:landing

# Terminal 3: Start any game
npm run start:teammates
# or
npm run start:journeyman
# or
npm run start:trivia
```

### 2. Check Browser Console

When you load any application, you should see:

```
🍪 OneTrust consent loaded
Active consent groups: ,C0001,C0002,
✅ Necessary cookies consented
📊 Analytics cookies consented
```

### 3. Test Preference Center

If OneTrust is configured correctly:
1. A cookie consent banner should appear on first visit
2. You can accept/reject specific categories
3. The preference center can be opened programmatically

### 4. Development Mode (Without Credentials)

If you don't have OneTrust credentials yet:
- The scripts will fail silently (expected behavior)
- Applications will still function normally
- Console will show OneTrust-related errors (safe to ignore)
- Once you add credentials, OneTrust will activate automatically

## Integration with Analytics

### Google Analytics Example

```javascript
import { useOneTrust, COOKIE_CATEGORIES } from '../backend/useOneTrust';

function App() {
  const { hasAnalyticsConsent } = useOneTrust();

  useEffect(() => {
    if (hasAnalyticsConsent) {
      // Initialize Google Analytics
      window.gtag('config', 'GA_MEASUREMENT_ID');
    }
  }, [hasAnalyticsConsent]);
}
```

### Adobe Analytics Example (Journeyman)

The Journeyman game includes Adobe Analytics integration. OneTrust gates the analytics tracking:

```javascript
// In OptanonWrapper function
if (hasAnalytics) {
  console.log("📊 Analytics cookies consented");
  // Gate Adobe Analytics initialization based on consent
  if (window.s) {
    window.s.t(); // Track page view
  }
}
```

## Troubleshooting

### OneTrust Banner Doesn't Appear

1. Check that your Domain Script ID is correct in `.env`
2. Verify the environment variable is loaded (check browser console for the script URL)
3. Make sure you're accessing via `localhost` or a proper domain (not `file://`)
4. Check OneTrust admin panel to ensure the domain is whitelisted

### Environment Variables Not Working

**Create React App** (teammates, journeyman, landing):
- Variables must start with `REACT_APP_`
- Restart the dev server after changing `.env`
- Clear cache: `rm -rf node_modules/.cache`

**Vite** (trivia):
- Variables must start with `VITE_`
- Restart the dev server after changing `.env`
- Check `import.meta.env.VITE_ONETRUST_DOMAIN_SCRIPT_ID` in code

### Consent Not Persisting

OneTrust stores consent in browser cookies/localStorage. If consent isn't persisting:
1. Check browser privacy settings (cookies must be enabled)
2. Check OneTrust admin panel configuration
3. Try clearing browser cookies and testing again

## Production Deployment

### Environment Variables

Set these environment variables in your production environment:

**Vercel/Netlify**:
1. Go to project settings
2. Add environment variables:
   - `REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID` (for Create React App projects)
   - `VITE_ONETRUST_DOMAIN_SCRIPT_ID` (for Vite projects)
3. Redeploy the application

**Railway/Heroku**:
```bash
# For backend (if needed)
railway variables set ONETRUST_DOMAIN_SCRIPT_ID=your-id

# Frontend variables are injected at build time
```

### Domain Whitelisting

In OneTrust admin panel:
1. Navigate to **Cookie Compliance** > **Domains**
2. Add your production domains (e.g., `yourgame.com`)
3. Save and publish changes

## Additional Resources

- [OneTrust Developer Docs](https://developer.onetrust.com/)
- [OneTrust Cookie Compliance Guide](https://my.onetrust.com/s/article/UUID-7e26f9e3-e16b-3d06-3e4c-77e151c9da3f)
- [GDPR Compliance Overview](https://gdpr.eu/)
- [CCPA Compliance Overview](https://oag.ca.gov/privacy/ccpa)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review OneTrust documentation
3. Contact your organization's privacy/legal team
4. Open an issue in the repository
