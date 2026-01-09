# Lessons Learned

> What worked, what broke, what to avoid (from customer-support project)

## What Worked Well

### 1. Start with SQLite, Migrate to PostgreSQL Later
- MVP speed: No DB server setup, single file
- Migration was clean with Drizzle (schema change was mechanical)
- Backup script made data migration safe

### 2. Column-Based Multi-Tenancy
- Simple to implement
- Query patterns consistent
- No schema duplication overhead

### 3. Dual Portal Architecture
- Clean security boundary
- Independent deployments worked well
- Different UX for different users

### 4. Beads for Issue Tracking
- Session-persistent context for Claude
- Dependencies tracked (blocks/blocked-by)
- Better than TODOs in code

### 5. Phased Production Hardening
- Phase 1: Security (helmet, CORS, rate limiting)
- Phase 2: PostgreSQL
- Phase 3: S3 (in progress)

### 6. Rich Text Editor Implementation (2026-01-08)
- **Always remove old code when replacing**: Left duplicate textarea when adding MarkdownEditor, causing UI confusion
- **Test immediately after implementation**: Browser behavior differs from curl - need user testing
- **Drizzle ORM query patterns**: Chained `.where()` doesn't work the same as initial query - use conditional construction
- **Markdown libraries**: `react-markdown` + `remark-gfm` work well for GFM support
- **GitFlow**: Feature → develop → main workflow keeps branches clean
- **Component reusability**: Created MarkdownEditor as reusable component with edit/preview toggle
- Phase 4: Deployment infra
- Incremental, not big-bang

## What Broke / Bugs Fixed

### 1. Theme Toggle Cross-Portal (csup-oxx)
**Problem**: Theme state not syncing between client and internal portals.
**Root Cause**: Each portal had its own localStorage key.
**Fix**: Shared theme context in @repo/ui or consistent key.

### 2. JWT Secret Hardcoded Fallback (csup-996)
**Problem**: Code had `process.env.JWT_SECRET || 'fallback-secret'`
**Root Cause**: Developer convenience became security hole.
**Fix**: Fail fast if JWT_SECRET not in env. No fallback.

```typescript
// BAD
const secret = process.env.JWT_SECRET || 'fallback';

// GOOD
const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET required');
```

## What to Avoid

### 1. Don't Skip Tenant Isolation
Every query MUST include `tenant_id`. No exceptions.
```typescript
// WRONG - leaks data across tenants
const all = await db.query.tickets.findMany();

// RIGHT
const mine = await db.query.tickets.findMany({
  where: eq(tickets.tenantId, req.tenantId),
});
```

### 2. Don't Trust Client Priority/Severity
Clients always report P1/S1. Use internal values for SLA.

### 3. Don't Hardcode Secrets
Even for "local dev convenience". Use `.env` always.

### 4. Don't Skip Rate Limiting
Add early, not after getting hit.

### 5. Don't Over-Engineer Initially
Started with SQLite, not Kubernetes. Scale when needed.

## Decisions We'd Make Again

1. **Monorepo**: Atomic commits, shared types, single history
2. **TypeScript everywhere**: Caught bugs at compile time
3. **Drizzle over Prisma**: Lighter, faster, less magic
4. **npm workspaces**: Simple, works, no extra tooling
5. **Beads over Jira**: Context stays with Claude

## Decisions We Might Reconsider

1. **Express vs Fastify**: Fastify is faster, better validation
2. **Local file uploads**: Should have started with S3/MinIO
3. **No test setup early**: Would add Vitest from day 1 next time
