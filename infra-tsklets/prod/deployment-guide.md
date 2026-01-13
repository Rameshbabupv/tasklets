# Tsklets Production Deployment Guide

Complete guide for deploying Tsklets application to production using Podman.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [First Time Deployment](#first-time-deployment)
3. [Application Updates](#application-updates)
4. [Database Management](#database-management)
5. [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)
6. [Security Best Practices](#security-best-practices)

---

## Prerequisites

### Required Software

- Podman (rootless container runtime)
- podman-compose
- Git
- Server with ports 4010, 4020, 4030, 5432 available

### Install Podman (if needed)

```bash
# On RHEL/CentOS/Fedora
sudo dnf install podman podman-compose

# On Ubuntu/Debian
sudo apt-get install podman podman-compose

# On macOS
brew install podman podman-compose
```

---

## First Time Deployment

### Step 1: Clone Repository

```bash
# Clone the repository
git clone <repository-url> /opt/tsklets
cd /opt/tsklets

# Checkout main branch
git checkout main
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp infra-tsklets/prod/.env.example .env

# Edit with production values
vi .env
```

**Required Changes:**
- `DB_PASSWORD` - Strong password (min 16 chars, mixed case, numbers, symbols)
- `JWT_SECRET` - Random secret key (min 32 chars)

**Generate Strong Secrets:**
```bash
# Generate DB password
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 48
```

### Step 3: Start Services

```bash
# Start all services in detached mode
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml up -d

# View logs
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml logs -f
```

### Step 4: Initialize Database

```bash
# Wait for containers to be healthy (30-60 seconds)
podman ps

# Push database schema
podman exec tsklets-app npm run db:push

# Seed initial data (choose one):
# For demo data:
podman exec tsklets-app npm run db:seed:demo

# For production data (minimal):
podman exec tsklets-app npm run db:seed:prod
```

### Step 5: Verify Deployment

```bash
# Check container status
podman ps

# Test API health endpoint
curl http://localhost:4030/health
# Expected: {"status":"ok"}

# Test Client Portal
curl -I http://localhost:4010
# Expected: HTTP/1.1 200 OK

# Test Internal Portal
curl -I http://localhost:4020
# Expected: HTTP/1.1 200 OK
```

### Step 6: Access Applications

- **Client Portal**: http://your-server:4010
- **Internal Portal**: http://your-server:4020
- **API Server**: http://your-server:4030

**Default Users** (if using demo seed):
- Internal: `ramesh@systech.com` / `Systech@123`
- Client: `john@acme.com` / `Systech@123`

---

## Application Updates

### Deploy Code Updates

```bash
cd /opt/tsklets

# 1. Pull latest code
git pull origin main

# 2. Rebuild and restart app (database keeps running)
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml up -d --build app

# 3. Run migrations if schema changed
podman exec tsklets-app npm run db:push

# 4. Verify
curl http://localhost:4030/health
```

### Rolling Back

```bash
# Checkout previous version
git checkout <previous-commit-hash>

# Rebuild
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml up -d --build app
```

---

## Database Management

### Migrations

```bash
# Push schema changes
podman exec tsklets-app npm run db:push

# Generate migration (if using drizzle-kit generate)
podman exec tsklets-app npm run db:generate
```

### Database Access

```bash
# Connect to PostgreSQL
podman exec -it tsklets-db psql -U postgres -d tasklets

# List tables
\dt

# Query example
SELECT email, role FROM users LIMIT 5;

# Exit
\q
```

### Database Backup

```bash
# Create backup directory
mkdir -p /opt/tsklets/backups

# Backup database
podman exec tsklets-db pg_dump -U postgres tasklets > \
  /opt/tsklets/backups/tasklets-$(date +%Y%m%d-%H%M%S).sql

# Or backup entire volume
podman volume export postgres_data -o \
  /opt/tsklets/backups/postgres_data-$(date +%Y%m%d-%H%M%S).tar
```

### Database Restore

```bash
# From SQL dump
cat /opt/tsklets/backups/tasklets-20260112.sql | \
  podman exec -i tsklets-db psql -U postgres -d tasklets

# From volume backup
podman volume import postgres_data \
  /opt/tsklets/backups/postgres_data-20260112.tar
```

### Automated Backups

Create a cron job:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/tsklets/infra-tsklets/prod/scripts/backup-db.sh
```

---

## Monitoring and Troubleshooting

### View Logs

```bash
# All services
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml logs -f

# Specific service
podman logs -f tsklets-app
podman logs -f tsklets-db

# Last 100 lines
podman logs --tail 100 tsklets-app
```

### Check Container Status

```bash
# List running containers
podman ps

# Container stats (CPU, memory)
podman stats

# Inspect container
podman inspect tsklets-app
```

### Restart Services

```bash
# Restart app only
podman restart tsklets-app

# Restart all services
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml restart

# Stop all services
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml stop

# Start all services
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml start
```

### Common Issues

**Issue: Port already in use**
```bash
# Find what's using the port
sudo lsof -i :4030

# Or check with netstat
netstat -tuln | grep 4030
```

**Issue: Database connection failed**
```bash
# Check if database is healthy
podman exec tsklets-db pg_isready -U postgres

# Check network connectivity
podman exec tsklets-app ping postgres

# Verify DATABASE_URL
podman exec tsklets-app printenv DATABASE_URL
```

**Issue: Container keeps restarting**
```bash
# Check logs for errors
podman logs --tail 50 tsklets-app

# Check health status
podman inspect tsklets-app | grep -A 10 Health
```

---

## Security Best Practices

### 1. Use Strong Secrets

```bash
# Never use default passwords in production
# Generate strong random secrets
openssl rand -base64 32
```

### 2. Limit Port Exposure

```bash
# Only expose necessary ports
# Consider using reverse proxy (nginx) in front
```

### 3. Regular Updates

```bash
# Update base images regularly
podman pull postgres:18
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml up -d --build
```

### 4. Database Access

```bash
# Don't expose PostgreSQL port 5432 to public internet
# Use SSH tunnel or VPN for remote access
ssh -L 5432:localhost:5432 user@server
```

### 5. Environment Variables

```bash
# Never commit .env file
# Keep it secure with proper file permissions
chmod 600 .env
```

### 6. Regular Backups

```bash
# Automate database backups
# Store backups off-server
# Test restore procedures regularly
```

### 7. Monitoring

```bash
# Set up monitoring for:
# - Container health
# - Disk usage
# - Database connections
# - Application errors
```

---

## Production Workflow Summary

### Initial Setup
```bash
cd /opt/tsklets
cp infra-tsklets/prod/.env.example .env
# Edit .env
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml up -d
podman exec tsklets-app npm run db:push
podman exec tsklets-app npm run db:seed:prod
```

### Regular Updates
```bash
git pull
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml up -d --build app
podman exec tsklets-app npm run db:push
```

### Daily Operations
```bash
# Check status
podman ps

# View logs
podman logs -f tsklets-app

# Backup (automated via cron)
/opt/tsklets/infra-tsklets/prod/scripts/backup-db.sh
```

---

## Support

For issues or questions:
1. Check logs: `podman logs tsklets-app`
2. Review this guide
3. Contact DevOps team
