# Tsklets - Customer Support System

## Fresh Install?

See `docs-tsklets/FRESH-INSTALL.md` for PostgreSQL setup and first-time configuration.

## Project Structure

```
tsklets/
├── frontend-tsklets/
│   ├── client/           # Client Portal (:4010)
│   ├── internal/         # Internal Portal (:4020)
│   └── shared/           # @tsklets/types, utils, ui
├── backend-tsklets/
│   └── api/              # Express API (:4030)
├── docs-tsklets/         # Documentation
└── infra-tsklets/        # Docker, nginx, scripts
```

## Database

- **Engine:** PostgreSQL 16 (via Podman)
- **Name:** tasklets
- **User:** postgres
- **Password:** change-this-secure-password
- **URL:** `postgresql://postgres:change-this-secure-password@localhost:5432/tasklets`

## Quick Start

```bash
npm install
npm run dev          # Start all services
```

## Test Users

**Password:** `Systech@123`

| Portal | Email | Role |
|--------|-------|------|
| Internal (:4020) | ramesh@systech.com | admin |
| Client (:4010) | john@acme.com | user |

## Guidelines

1. Read codebase before making changes
2. Keep changes simple - impact minimal code
3. Use Serena memories for context (`.serena/memories/`)
4. Track work with beads (`bd ready`, `bd show <id>`)

## Seed Commands

```bash
cd backend-tsklets/api
npm run db:push        # Push schema to DB
npm run db:seed:demo   # Seed demo data
```
