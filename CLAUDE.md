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

## Git Workflow (GitFlow)

We use **GitFlow** - a robust branching model for versioned releases.

### Branch Structure

- **`main`** - Production-ready code (tagged releases)
- **`develop`** - Integration branch for next release
- **`feature/*`** - New features (branch from `develop`, merge to `develop`)
- **`release/*`** - Release preparation (branch from `develop`, merge to `main` and `develop`)
- **`hotfix/*`** - Emergency fixes (branch from `main`, merge to `main` and `develop`)

### Rules

1. `main` contains only production releases (tagged)
2. `develop` is the main integration branch
3. Never commit directly to `main` or `develop`
4. Feature branches merge back to `develop` via PR
5. Releases merge to both `main` (tagged) and `develop`

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/description` | `feature/add-export-csv` |
| Bug fix | `fix/description` | `fix/login-redirect` |
| Release | `release/version` | `release/1.2.0` |
| Hotfix | `hotfix/description` | `hotfix/security-patch` |
| Refactor | `refactor/description` | `refactor/auth-middleware` |

### Workflows

#### Feature Development

```bash
# 1. Start from develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/add-new-feature

# 3. Make commits
git add .
git commit -m "Add new feature"

# 4. Push and create PR to develop
git push -u origin feature/add-new-feature
gh pr create --base develop --title "Add new feature" --body "Description..."

# 5. After merge, clean up
git checkout develop
git pull
git branch -d feature/add-new-feature
```

#### Release Process

```bash
# 1. Create release branch from develop
git checkout develop
git pull
git checkout -b release/1.2.0

# 2. Update version, changelog, final fixes
# Make any release-specific commits

# 3. Merge to main and tag
git checkout main
git pull
git merge --no-ff release/1.2.0
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin main --tags

# 4. Merge back to develop
git checkout develop
git merge --no-ff release/1.2.0
git push origin develop

# 5. Delete release branch
git branch -d release/1.2.0
```

#### Hotfix Process

```bash
# 1. Create hotfix from main
git checkout main
git pull
git checkout -b hotfix/critical-bug

# 2. Fix and commit
git add .
git commit -m "Fix critical bug"

# 3. Merge to main and tag
git checkout main
git merge --no-ff hotfix/critical-bug
git tag -a v1.2.1 -m "Hotfix 1.2.1"
git push origin main --tags

# 4. Merge to develop
git checkout develop
git merge --no-ff hotfix/critical-bug
git push origin develop

# 5. Delete hotfix branch
git branch -d hotfix/critical-bug
```

## Seed Commands

```bash
cd backend-tsklets/api
npm run db:push        # Push schema to DB
npm run db:seed:demo   # Seed demo data
```
