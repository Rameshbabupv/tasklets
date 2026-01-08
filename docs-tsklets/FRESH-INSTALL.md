# Fresh Install Guide

## 1. PostgreSQL (Podman)

```bash
podman run -d \
  --name tsklets-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=change-this-secure-password \
  -e POSTGRES_DB=tasklets \
  -p 5432:5432 \
  postgres:16
```

## 2. Environment

Create `.env` in project root:
```
NODE_ENV=development
PORT=4030
HOST=0.0.0.0
JWT_SECRET=dev-secret-change-in-production
DATABASE_URL=postgresql://postgres:change-this-secure-password@localhost:5432/tasklets
```

## 3. Install & Setup

```bash
npm install
cd backend-tsklets/api
npm run db:push
npm run db:seed:demo
cd ../..
```

## 4. Run

```bash
npm run dev
```

## URLs

| Service | URL |
|---------|-----|
| Client Portal | http://localhost:4010 |
| Internal Portal | http://localhost:4020 |
| API | http://localhost:4030 |

## Test Login

**Password for all users:** `Systech@123`

| Portal | Email | Role |
|--------|-------|------|
| Internal | ramesh@systech.com | admin |
| Internal | mohan@systech.com | support |
| Client | john@acme.com | user |
| Client | latha@acme.com | company_admin |

## Reset Database

```bash
podman exec tsklets-db psql -U postgres -c "DROP DATABASE tasklets; CREATE DATABASE tasklets;"
cd backend-tsklets/api
npm run db:push
npm run db:seed:demo
```
