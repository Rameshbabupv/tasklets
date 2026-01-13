# LAN Deployment Guide - Simple IP:Port Access

Quick guide for deploying Tsklets on internal LAN using IP:port access.

## Prerequisites

- Production server with Podman installed
- Server connected to your LAN
- Ports 4010, 4020, 4030 available

---

## Step 1: Get Your Server IP Address

On your production server, run:

```bash
hostname -I | awk '{print $1}'
```

Example output: `192.168.1.100`

**Write down this IP - you'll need it!**

---

## Step 2: Configure Environment Variables

```bash
# Navigate to project directory
cd /opt/tsklets  # or wherever you cloned the repo

# Copy LAN template
cp infra-tsklets/prod/.env.lan.example .env

# Edit the file
nano .env  # or vi .env
```

**Update these values:**

1. **DB_PASSWORD** - Set a strong password
   ```bash
   # Generate one:
   openssl rand -base64 32
   ```

2. **JWT_SECRET** - Set a random secret
   ```bash
   # Generate one:
   openssl rand -base64 48
   ```

3. **ALLOWED_ORIGINS** - Replace `YOUR_SERVER_IP` with your actual IP
   ```
   # If your IP is 192.168.1.100:
   ALLOWED_ORIGINS=http://192.168.1.100:4010,http://192.168.1.100:4020,http://localhost:4010,http://localhost:4020
   ```

Save and exit (Ctrl+X, Y, Enter in nano)

---

## Step 3: Open Firewall Ports

### On RHEL/CentOS/Fedora:

```bash
sudo firewall-cmd --permanent --add-port=4010/tcp
sudo firewall-cmd --permanent --add-port=4020/tcp
sudo firewall-cmd --permanent --add-port=4030/tcp
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-ports
```

### On Ubuntu/Debian:

```bash
sudo ufw allow 4010/tcp
sudo ufw allow 4020/tcp
sudo ufw allow 4030/tcp

# Verify
sudo ufw status
```

---

## Step 4: Deploy Application

```bash
# Pull latest image
podman pull ghcr.io/rameshbabupv/tasklets:latest

# Start services
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml up -d

# Check status
podman ps

# View logs
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml logs -f
```

Wait for containers to be healthy (30-60 seconds).

---

## Step 5: Initialize Database

```bash
# Push database schema
podman exec tsklets-app npm run db:push

# Seed demo data
podman exec tsklets-app npm run db:seed:demo
```

---

## Step 6: Test Access

### From the server itself:

```bash
# Test API health
curl http://localhost:4030/health
# Should return: {"status":"ok"}

# Test Client Portal
curl http://localhost:4010
# Should return HTML
```

### From another computer on your LAN:

Open browser and navigate to:

- **Client Portal:** `http://YOUR_SERVER_IP:4010`
- **Internal Portal:** `http://YOUR_SERVER_IP:4020`

Example (if IP is 192.168.1.100):
- Client: `http://192.168.1.100:4010`
- Internal: `http://192.168.1.100:4020`

**Default credentials:**
- Email: `ramesh@systech.com` (internal) or `john@acme.com` (client)
- Password: `Systech@123`

---

## Troubleshooting

### Can't access from other computers?

**Check 1: Firewall**
```bash
# Test if port is open from another machine
telnet 192.168.1.100 4010

# If connection refused, firewall is blocking
```

**Check 2: Container is running**
```bash
podman ps
# Should show tsklets-app with ports 0.0.0.0:4010->4010
```

**Check 3: CORS configuration**
```bash
# Verify .env file
cat .env | grep ALLOWED_ORIGINS
# Should include your server IP
```

**Check 4: Container logs**
```bash
podman logs tsklets-app
# Look for errors
```

### Icons not showing?

The app self-hosts Material Symbols font, so this should work offline. If icons still show as text:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check browser console for 404 errors on `/fonts/MaterialSymbolsOutlined.woff2`

### Need to update the app?

```bash
# Pull latest image
podman pull ghcr.io/rameshbabupv/tasklets:latest

# Restart
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml restart app
```

---

## Quick Reference

### Application URLs (replace with your IP)

| Service | URL | Description |
|---------|-----|-------------|
| Client Portal | http://192.168.1.100:4010 | Customer support portal |
| Internal Portal | http://192.168.1.100:4020 | Team dashboard |
| API | http://192.168.1.100:4030 | Backend API |
| API Health Check | http://192.168.1.100:4030/health | Health status |

### Common Commands

```bash
# View logs
podman logs tsklets-app

# Restart app
podman restart tsklets-app

# Stop everything
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml down

# Start everything
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml up -d

# Database backup
podman exec tsklets-db pg_dump -U postgres tasklets > backup.sql

# Database restore
cat backup.sql | podman exec -i tsklets-db psql -U postgres tasklets
```

---

## Security Notes for LAN Deployment

✅ **Good practices:**
- Application is only accessible on your LAN (not internet)
- Use strong DB password and JWT secret
- Keep the image updated regularly
- Regular database backups

⚠️ **Important:**
- This setup uses HTTP (not HTTPS)
- Acceptable for internal LAN use
- Do NOT expose these ports to the internet
- If you need internet access, set up Nginx with SSL

---

## Need Help?

Check the main deployment guide: `deployment-guide.md`
