# Testing Production Builds Locally

This guide explains how to test production builds on your local machine before deploying.

## Quick Start (Recommended)

Use Vite's built-in preview server - it includes the proxy configuration:

```bash
# 1. Build all apps
npm run build:local

# 2. Start API server (in another terminal)
npm run dev:api

# 3. Serve production builds with proxy
npm run serve:local
```

Then open:
- Client Portal: http://localhost:3000
- Internal Portal: http://localhost:3001

**This works because** `vite preview` uses the same proxy config as `vite dev`.

---

## Alternative Methods

### Option 1: Manual Steps

```bash
# Build frontend apps
cd apps/client-portal
npm run build

cd ../internal-portal
npm run build

# Start API
cd ../api
npm run dev

# Serve builds (in separate terminals)
cd apps/client-portal
npx vite preview --port 3000

cd apps/internal-portal
npx vite preview --port 3001
```

### Option 2: Using nginx (Production-like)

**Install nginx** (if not already):
```bash
# macOS
brew install nginx

# Ubuntu/Debian
sudo apt install nginx

# Windows
# Download from nginx.org
```

**Run with local config:**
```bash
# 1. Build apps
npm run build

# 2. Start API
npm run dev:api

# 3. Start nginx (in another terminal)
nginx -c $(pwd)/nginx.local.conf -p $(pwd)
```

Then open:
- Client Portal: http://localhost:3000
- Internal Portal: http://localhost:3001

**Stop nginx:**
```bash
nginx -s stop
```

### Option 3: Simple HTTP Server (WITHOUT Proxy - Won't Work for API calls)

⚠️ **This won't work** for testing API functionality:

```bash
# Build
npm run build

# Serve (but API calls will fail)
cd apps/client-portal/dist
npx serve -p 3000
```

**Why it fails:** No proxy to forward `/api/*` to port 4000.

---

## Comparison

| Method | Pros | Cons | Best For |
|--------|------|------|----------|
| **vite preview** | ✅ Easy, built-in proxy<br>✅ Same as dev<br>✅ No extra setup | ⚠️ Still uses Node.js | Quick local testing |
| **nginx** | ✅ Production-like<br>✅ Tests real nginx config<br>✅ Fast | ❌ Requires nginx install | Pre-deployment testing |
| **serve/http-server** | ✅ Simple | ❌ No proxy support | Static files only |

---

## Troubleshooting

### API calls fail (404)

**Problem:** Frontend can't reach API

**Check:**
1. Is API running on port 4000?
   ```bash
   curl http://localhost:4000/health
   ```
2. Are you using a preview server with proxy support?
   - ✅ `vite preview` - has proxy
   - ✅ `nginx` - has proxy config
   - ❌ `serve` - no proxy

### Port already in use

```bash
# Check what's using the port
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)
```

### Build fails

```bash
# Clean node_modules and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Production Deployment

For actual production deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md).

Key differences:
- Production uses Docker/K8s
- Static files served by nginx/apache
- API runs as separate service
- Environment variables for secrets
- Database on persistent storage
