# Tsklets Production Deployment

This directory contains production deployment configuration and documentation for the Tsklets application.

## Quick Start

```bash
# 1. Navigate to project root
cd /path/to/tsklets

# 2. Copy and configure environment variables
cp infra-tsklets/prod/.env.example .env
# Edit .env with production values

# 3. Start all services
podman-compose -f infra-tsklets/prod/docker-compose.prod.yml up -d

# 4. Initialize database (first time only)
podman exec tsklets-app npm run db:push
podman exec tsklets-app npm run db:seed:prod  # or seed:demo

# 5. Verify deployment
curl http://localhost:4030/health
```

## Files in This Directory

- **docker-compose.prod.yml** - Production Docker Compose configuration
- **.env.example** - Environment variables template
- **deployment-guide.md** - Detailed deployment instructions
- **backup-restore.md** - Database backup and restore procedures

## Architecture

```
┌─────────────────────────────────────────────┐
│  Podman Network (tsklets-network)          │
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │ PostgreSQL   │      │  Tsklets App    │ │
│  │ (postgres:18)│◄─────┤  (Node.js)      │ │
│  │              │      │                 │ │
│  │ Volume:      │      │  Ports:         │ │
│  │ postgres_data│      │  - 4010 Client  │ │
│  └──────────────┘      │  - 4020 Internal│ │
│                        │  - 4030 API     │ │
│                        └─────────────────┘ │
└─────────────────────────────────────────────┘
```

## Key Features

- **Docker Compose manages both database and application**
- **Persistent data** via named volumes
- **Health checks** ensure database is ready before app starts
- **Automatic restart** if containers crash
- **Environment-based configuration** via .env file
- **Easy backups and restores**

## Support

For detailed instructions, see:
- [Deployment Guide](./deployment-guide.md)
- [Backup & Restore](./backup-restore.md)
