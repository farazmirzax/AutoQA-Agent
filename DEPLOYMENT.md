# 🚀 Deployment Guide

## Backend Deployment (Render)

### 1. Prerequisites
- Render account: https://render.com
- Groq API key: https://console.groq.com

### 2. Deploy to Render

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the `backend` directory as root
5. Configure:
   - **Name**: `autoqa-backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && playwright install chromium`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add Environment Variables:
   - `GROQ_API_KEY`: Your Groq API key
   - `BASE_URL`: `https://your-app-name.onrender.com` (update after deployment)
7. Click "Create Web Service"

### 3. Note Your Backend URL
After deployment, copy your backend URL (e.g., `https://autoqa-backend.onrender.com`)

---

## Frontend Deployment (Vercel) ⚡ RECOMMENDED

### Why Vercel?
- ✅ Built for Next.js (by the Next.js team)
- ✅ Zero configuration needed
- ✅ Automatic deployments on git push
- ✅ Free SSL + custom domains
- ✅ Preview deployments for every PR
- ✅ Global edge network for best performance

### 1. Deploy to Vercel

1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Vercel auto-detects Next.js! Just configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

5. Add Environment Variable:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: Your Render backend URL (e.g., `https://autoqa-backend.onrender.com`)

6. Click "Deploy"

### 2. Done! 🎉
That's it! Your app is live in ~2 minutes.
- Every git push auto-deploys
- Pull requests get preview URLs
- No configuration files needed

### 3. Update Backend CORS

Go back to Render and update `BASE_URL` environment variable with your Vercel URL.

---

## Alternative: GitHub Pages (Static Export)

<details>
<summary>Click to expand GitHub Pages instructions</summary>

### 1. Update Next.js Config

Edit `frontend/next.config.ts` to enable static export:
```typescript
const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/your-repo-name', // Only if using user.github.io/repo-name
};
```

### 2. Update Environment Variables

Edit `frontend/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com
```

### 3. Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Build
        working-directory: ./frontend
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
        run: npm run build
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./frontend/out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 4. Configure GitHub Repository

1. Go to Settings → Pages
2. Source: "GitHub Actions"
3. Add Repository Secret: `NEXT_PUBLIC_API_URL`

### 5. Push to Deploy
```bash
git push origin main
```

</details>

---

## Post-Deployment Checklist

### 1. Update Backend Environment
Go to Render Dashboard → Your Service → Environment:
- ✅ `GROQ_API_KEY`: Your Groq API key
- ✅ `BASE_URL`: Your Render URL (e.g., `https://autoqa-backend.onrender.com`)

### 2. Test the Deployment
1. Visit your Vercel URL
2. Try: "Visit https://example.com and analyze the page"
3. Verify screenshots load correctly

### 3. Common Issues

**CORS Errors**:
- Ensure backend allows your Vercel domain
- Check browser console for exact error

**Screenshots Not Loading**:
- Verify `BASE_URL` is set on Render
- Check Render logs for Playwright installation

**API Connection Fails**:
- Verify `NEXT_PUBLIC_API_URL` in Vercel dashboard
- Check it doesn't have trailing slash

### 4. Performance Notes
- Render free tier: Cold starts after 15min inactivity (~30s delay)
- Solution: Upgrade to paid tier or use cron-job.org to ping every 10min

---

## Environment Variables Summary

### Backend (Render)
| Variable | Value | Required |
|----------|-------|----------|
| `GROQ_API_KEY` | Your Groq API key | ✅ Yes |
| `BASE_URL` | `https://your-app.onrender.com` | ✅ Yes |

### Frontend (Vercel)
| Variable | Value | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com` | ✅ Yes |

---

## Final URLs

After deployment, you'll have:
- 🖥️ **Frontend**: `https://your-app.vercel.app`
- 🔧 **Backend API**: `https://your-backend.onrender.com`
- 📚 **API Docs**: `https://your-backend.onrender.com/docs`

---

## Development vs Production

The app automatically detects the environment:
- **Development**: Uses `http://localhost:8000`
- **Production**: Uses `NEXT_PUBLIC_API_URL` from environment

No code changes needed! 🎉
