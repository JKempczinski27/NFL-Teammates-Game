# OneTrust Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Get OneTrust Domain Script ID
1. Go to https://my.onetrust.com/
2. Navigate to **Cookie Compliance** → **Scripts**
3. Copy your **Domain Script ID** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Step 2: Add to Environment Variables

Create `.env` files in each app directory:

**nfl-teammates-game/.env**
```env
REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID=your-domain-script-id-here
REACT_APP_ONETRUST_ENV=production
```

**landing-page/.env**
```env
REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID=your-domain-script-id-here
REACT_APP_ONETRUST_ENV=production
```

**journeyman/.env**
```env
REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID=your-domain-script-id-here
REACT_APP_ONETRUST_ENV=production
```

**nfl-trivia-game/.env**
```env
VITE_ONETRUST_DOMAIN_SCRIPT_ID=your-domain-script-id-here
VITE_ONETRUST_ENV=production
```

### Step 3: Run Database Migration

```bash
psql $DATABASE_URL -f backend/migrations/001_create_consent_log_table.sql
```

### Step 4: Deploy Environment Variables

**Vercel:**
```bash
vercel env add REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID
# Enter your Domain Script ID when prompted
```

Or via Vercel Dashboard:
1. Project → Settings → Environment Variables
2. Add `REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID`
3. Set value to your Domain Script ID

### Step 5: Test

```bash
npm start
```

Visit your app - you should see the OneTrust cookie banner!

## ✅ Verification Checklist

- [ ] OneTrust banner appears on page load
- [ ] Accepting cookies allows analytics tracking
- [ ] Rejecting cookies blocks analytics (check console)
- [ ] Database has `consent_log` table
- [ ] Consent data appears in `consent_log` table

## 📖 Full Documentation

See `ONETRUST_SETUP.md` for complete details.

## 🆘 Common Issues

**Banner not showing?**
- Check Domain Script ID is correct
- Verify environment variable is set
- Restart development server

**Analytics still tracking?**
- Check browser console for OneTrust logs
- Clear cookies and localStorage
- Verify consent state: `console.log(window.oneTrustConsent)`

**Environment variables not working?**
- Ensure `.env` file is in app root directory
- Restart development server
- Verify variable starts with `REACT_APP_` or `VITE_`
