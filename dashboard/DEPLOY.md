# Deploy Dashboard to Vercel

## Quick Deploy

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy from the dashboard directory**:
   ```bash
   cd /workspaces/NFL-Teammates-Game/dashboard
   vercel --prod
   ```

3. **Or use the Vercel website**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Connect your GitHub repo
   - Set root directory to `dashboard`
   - Deploy!

## After Deployment

1. Once deployed, you'll get a URL like: `https://your-dashboard.vercel.app`
2. Open that URL in your browser
3. Enter your Railway backend URL: `https://your-backend.railway.app`
4. Click "Load Data"

## Benefits

✅ No CORS issues - dashboard is publicly accessible
✅ No localhost problems - works from anywhere
✅ Fast global CDN - Vercel's edge network
✅ Free hosting - no cost for static sites
✅ Auto-deploys on git push

## Your Backend URL

Since your backend is on Railway, your API URL will be something like:
- `https://[your-project-name].up.railway.app`

Make sure your backend has CORS enabled (it already does in the current setup).
