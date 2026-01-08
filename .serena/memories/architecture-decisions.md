# Architecture Decisions

> Distilled from customer-support project (79 closed beads, 2 epics completed)

## Stack Choices

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend** | React + Vite + Tailwind | Fast builds, utility-first CSS, no config bloat |
| **Backend** | Node/Express + TypeScript | Same language across stack, type safety |
| **Database** | PostgreSQL (migrated from SQLite) | Production-ready, concurrent access, better tooling |
| **ORM** | Drizzle | Type-safe, lightweight, good DX vs Prisma bloat |
| **Auth** | JWT + bcrypt | Stateless, simple, works with multi-tenant |
| **Files** | S3/MinIO (planned) | Currently local disk, migrating to object storage |

## Multi-Tenancy (Column-Based)

**Decision**: `tenant_id` column on ALL tables, not schema-per-tenant.

```
WHY:
- Simpler queries (just add WHERE tenant_id = ?)
- Single schema to maintain
- Easier cross-tenant admin queries
- Lower DB overhead

TRADEOFF:
- Must be vigilant about tenant isolation in every query
- Middleware enforces tenant_id injection
```

**Implementation**:
- Tenant resolved via JWT payload (`tenant_id`, `is_owner`)
- `is_owner=true` = SysTech (owner), can see all tenants
- `is_owner=false` = clients, scoped to own tenant only

## Two Portals (Not One)

**Decision**: Separate `client-portal` and `internal-portal` apps.

```
WHY:
- Security boundary (clients don't know internal portal exists)
- Independent deployments
- Different UX needs (power users vs simple UI)
- Different release cycles

HOW:
- Layer 1: Obscurity (separate URLs)
- Layer 2: Domain separation (portal.app.com vs admin.app.com)
- Layer 3: Auth redirect (is_owner=false → redirect to client)
- Layer 4: API enforcement (even if UI bypassed, API rejects)
```

## Monorepo with npm Workspaces

**Decision**: Single repo with `apps/*` and `packages/*` (now `frontend-tsklets/*`, `backend-tsklets/*`).

```
WHY:
- Atomic commits across frontend/backend
- Shared types/utils without npm publish
- Single git history
- Easier refactoring

STRUCTURE:
- @repo/types: Shared TypeScript interfaces
- @repo/utils: Helper functions (formatDate, validators)
- @repo/ui: Shared React components
```

## Dual Priority/Severity

**Decision**: Separate client-reported vs internal priority/severity.

```
WHY:
- Clients always think their issue is P1
- Internal team needs to prioritize objectively
- Integrator role triages and sets internal values
- SLA calculated on internal values, not client-reported

FIELDS:
- client_priority, client_severity (user sets)
- internal_priority, internal_severity (integrator sets)
```

## Security Hardening (Phase 1 Complete)

**Implemented**:
- `helmet.js` - Security headers (XSS, clickjacking, etc.)
- CORS restrictions - Allowed origins whitelist
- Rate limiting - `express-rate-limit` on API
- JWT secret - Must be in env, no hardcoded fallback
- Input validation - Zod schemas (planned)

## PostgreSQL Migration (Phase 2 Complete)

**Migration path**:
1. Backup SQLite data to JSON
2. Switch Drizzle adapter (better-sqlite3 → pg)
3. Convert schema (`sqliteTable` → `pgTable`)
4. Run migrations
5. Restore data

**Key files**: `apps/api/src/db/schema.ts`, `scripts/restore-to-postgres.ts`
