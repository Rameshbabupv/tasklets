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

## Git Workflow (GitHub Flow)

We use **GitHub Flow** - a simple branch-based workflow.

### Rules

1. `main` is always deployable
2. Create a feature branch for each task
3. Open a Pull Request to merge to `main`
4. Merge after review, delete the branch

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/description` | `feature/add-export-csv` |
| Bug fix | `fix/description` | `fix/login-redirect` |
| Refactor | `refactor/description` | `refactor/auth-middleware` |

### Workflow

```bash
# 1. Create feature branch
git checkout -b feature/add-new-feature

# 2. Make commits
git add .
git commit -m "Add new feature"

# 3. Push and create PR
git push -u origin feature/add-new-feature
gh pr create --title "Add new feature" --body "Description..."

# 4. After merge, clean up
git checkout main
git pull
git branch -d feature/add-new-feature
```

## Seed Commands

```bash
cd backend-tsklets/api
npm run db:push        # Push schema to DB
npm run db:seed:demo   # Seed demo data
```
