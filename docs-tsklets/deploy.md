# AWS Deployment Guide

## Stack

- **Monorepo**: 3 Node.js apps (API, Client Portal, Internal Portal)
- **Database**: SQLite (file-based, local)
- **Runtime**: Node.js 18+
- **Package Manager**: npm workspaces

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Client Portal   │    │ Internal Portal  │    │ API Server       │
│ (Vite/React)    │───▶│ (Vite/React)     │───▶│ (Express)        │
│ Port: 3000      │    │ Port: 3003       │    │ Port: 4000       │
└─────────────────┘    └──────────────────┘    └──────────────────┘
                                                        │
                                                        ▼
                                                ┌──────────────┐
                                                │ SQLite DB    │
                                                │ (file-based) │
                                                └──────────────┘
```

## Environment Variables

### API Server (`apps/api/.env`)
```bash
JWT_SECRET=<generate-secure-secret>
PORT=4000
NODE_ENV=production
```

### Client Portal (`apps/client-portal/.env`)
```bash
VITE_API_URL=http://localhost:4000
```

### Internal Portal (`apps/internal-portal/.env`)
```bash
VITE_API_URL=http://localhost:4000
```

## Build & Deploy

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
```bash
cd apps/api
npm run db:push    # Create schema
npm run db:seed    # Seed initial data (optional)
```

### 3. Build Applications
```bash
# Build all apps
npm run build:api
npm run build:client
npm run build:internal

# Or build individually
cd apps/api && npm run build
cd apps/client-portal && npm run build
cd apps/internal-portal && npm run build
```

### 4. Start Production
```bash
# Start all services
npm run start:api &
npm run start:client &
npm run start:internal &

# Or use PM2/systemd for process management
```

## AWS Deployment Options

### Option 1: EC2 (Simplest)
- Single EC2 instance
- Install Node.js 18+
- Clone repo, build, run with PM2
- Nginx reverse proxy for routing
- Elastic IP for static IP

### Option 2: ECS/Fargate
- 3 containers (API, Client, Internal)
- Shared EFS for SQLite DB file + uploads
- Application Load Balancer
- Path-based routing

### Option 3: Elastic Beanstalk
- Node.js environment
- Multi-container Docker configuration
- RDS migration needed (SQLite → PostgreSQL)

## Critical: Persistent Storage

**Database File**: `apps/api/src/db/data.db`
**Uploads**: `apps/api/uploads/`

These MUST be on persistent storage:
- EC2: EBS volume
- ECS: EFS mount
- Beanstalk: EFS mount

## Networking

| Service          | Port | Public | Purpose               |
|------------------|------|--------|-----------------------|
| API              | 4000 | No     | Backend API           |
| Client Portal    | 3000 | Yes    | Customer portal       |
| Internal Portal  | 3003 | Yes    | Internal staff portal |

## Production Checklist

- [ ] Set `JWT_SECRET` to secure random value
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS for production domains
- [ ] Set up HTTPS/SSL (ALB or nginx)
- [ ] Mount persistent volumes for DB + uploads
- [ ] Configure health checks (GET `/api/health`)
- [ ] Set up log aggregation (CloudWatch)
- [ ] Database backups (snapshot data.db daily)

## Scaling Considerations

⚠️ **SQLite Limitation**: Single-writer, file-based database
- Not suitable for multi-instance deployments
- For horizontal scaling, migrate to PostgreSQL/MySQL
- Current setup: single instance only

## Default Credentials (Change in Production!)

All users: `systech@123`

**Internal Portal** (Systech staff):
- ramesh@systech.com (admin)
- mohan@systech.com (support)

**Client Portal** (Customer companies):
- john@acme.com
- jane@acme.com
- alex@techcorp.com

## Health Check Endpoint

```bash
curl http://localhost:4000/api/health
# Expected: {"status":"ok"}
```

## Common Issues

**Database locked**: SQLite doesn't support concurrent writes
- Solution: Single API instance OR migrate to PostgreSQL

**File uploads not persisting**: Container restarts lose data
- Solution: Mount EFS/EBS to `apps/api/uploads/`

**CORS errors**: Frontend can't reach API
- Solution: Update CORS config in `apps/api/src/index.ts`

## Sample nginx.conf (EC2 deployment)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Client Portal
    location / {
        proxy_pass http://localhost:3000;
    }

    # Internal Portal
    location /internal {
        proxy_pass http://localhost:3003;
    }

    # API
    location /api {
        proxy_pass http://localhost:4000;
    }

    location /uploads {
        proxy_pass http://localhost:4000;
    }
}
```

## Support

For deployment issues, contact DevOps lead or raise issue in GitHub repo.
