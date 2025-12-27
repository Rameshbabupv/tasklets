# Architecture

## Stack
- **Frontend:** React + Tailwind
- **Backend:** Node/Express
- **DB:** PostgreSQL
- **Auth:** JWT + bcrypt
- **Files:** S3/MinIO (screenshots)

## Multi-tenancy
- Column-based isolation (`tenant_id` on all tables)
- Tenant resolved via subdomain or header
- Per-tenant config (gatekeeper, tier)

## Ticket Flow

```
CLIENT SIDE                           OUR SIDE
─────────────────────────────────────────────────────
User creates ticket
    ↓
[Gatekeeper vets] (if enabled)
    ↓
    ──────── Ticket Submitted ────────►
                                      Integrator triages
                                          ↓
                                      Sets internal priority/severity
                                          ↓
                                      Support Team resolves
```

## Feature Request Flow

```
CLIENT SIDE                           OUR SIDE
─────────────────────────────────────────────────────
Anyone creates Feature Request
    │
    ──────── Request ─────────────────► CEO reviews
                                           │
                                       Creates Quote
                                       (scope + price + timeline)
                                           │
    ◄──────── Quote Sent ─────────────────┘
    │
Approver reviews
    │
    ├─► Revision requested ───────────► CEO revises
    │       ◄─────────────────────────────┘
    │         (back & forth)
    │
    ├─► Rejected → End
    │
    └─► Approved
            │
            ──────── Approved ────────► Creates Beads Epic
                                           │
                                       Dev/Support Sprint
                                           │
                                       Delivery
```

**Visibility Matrix:**

| Stage | Our Side | Client Side |
|-------|----------|-------------|
| Draft | CEO only | Requester only |
| Quoted | CEO only | Approver + Contact |
| Revision | CEO only | Approver + Contact |
| Approved | CEO + Dev Team | Approver + Contact |

**Access Control:** Explicit whitelist via `FeatureRequestAccess` table.

## Roles

| Role | Side | Permissions |
|------|------|-------------|
| `user` | Client | Create/view own tickets, request features |
| `gatekeeper` | Client | Vet/approve tickets before submission |
| `company_admin` | Client | Manage company users, view all company tickets |
| `approver` | Client | Approve/reject quotes for feature requests |
| `integrator` | Our side | Triage tickets, set internal priority/severity |
| `support` | Our side | Handle/resolve tickets |
| `ceo` | Our side | View all feature requests, create/revise quotes |
| `admin` | Our side | Full system access |

## Customer Tiers

| Tier | Gatekeeper | SLA Multiplier |
|------|------------|----------------|
| `enterprise` | Optional | 1x (fastest) |
| `business` | Optional | 1.5x |
| `starter` | Disabled | 2x |

## SLA Matrix (Enterprise baseline)

| Level | Severity | Priority | Response | Resolution |
|-------|----------|----------|----------|------------|
| S1/P1 | Critical - System down | Business blocked | 1 hr | 4 hrs |
| S2/P2 | High - Major feature broken | Major impact | 4 hrs | 24 hrs |
| S3/P3 | Medium - Feature degraded | Workaround exists | 8 hrs | 72 hrs |
| S4/P4 | Low - Minor/cosmetic | Enhancement | 24 hrs | 1 week |

**SLA by tier:** Multiply response/resolution by tier multiplier.

**SLA clock starts:** When integrator triages (not submission).

## App Architecture

```
┌──────────────────┐      ┌──────────────────┐
│   CLIENT PORTAL  │      │  INTERNAL PORTAL │
│   (Tenants)      │      │  (Our Team)      │
│   :3000          │      │  :3001           │
└────────┬─────────┘      └────────┬─────────┘
         │                         │
         └────────────┬────────────┘
                      │
               ┌──────▼──────┐
               │   REST API   │
               │   :4000      │
               └──────┬──────┘
                      │
               ┌──────▼──────┐
               │  PostgreSQL  │
               │   :5432      │
               └─────────────┘
```

**Why Two Portals:**
- Independent deployments
- Different release cycles
- Clean security boundary
- Different UX needs (power users vs simple UI)

## Monorepo Structure (npm workspaces)

```
customer-support/
├── apps/
│   ├── client-portal/        # Tenant-facing React app
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── internal-portal/      # Our team React app
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── api/                  # Express REST API
│       ├── src/
│       │   ├── routes/
│       │   ├── models/
│       │   ├── middleware/
│       │   └── services/
│       └── package.json
│
├── packages/
│   ├── ui/                   # Shared React components
│   │   ├── src/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── TicketCard.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── PriorityPill.tsx
│   │   │   └── index.ts
│   │   └── package.json      # name: "@repo/ui"
│   │
│   ├── types/                # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── ticket.ts
│   │   │   ├── user.ts
│   │   │   ├── tenant.ts
│   │   │   └── index.ts
│   │   └── package.json      # name: "@repo/types"
│   │
│   └── utils/                # Shared utilities
│       ├── src/
│       │   ├── formatDate.ts
│       │   ├── validators.ts
│       │   └── index.ts
│       └── package.json      # name: "@repo/utils"
│
├── package.json              # Workspaces config
└── .beads/                   # Issue tracking
```

## Shared Packages

| Package | Purpose | Example |
|---------|---------|---------|
| `@repo/ui` | React components | `import { Button, TicketCard } from '@repo/ui'` |
| `@repo/types` | TypeScript interfaces | `import { Ticket, User } from '@repo/types'` |
| `@repo/utils` | Helper functions | `import { formatDate } from '@repo/utils'` |

## npm Workspaces Config

**Root `package.json`:**
```json
{
  "name": "customer-support",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "npm run dev --workspaces --if-present",
    "dev:client": "npm run dev -w apps/client-portal",
    "dev:internal": "npm run dev -w apps/internal-portal",
    "dev:api": "npm run dev -w apps/api",
    "build": "npm run build --workspaces --if-present"
  }
}
```

## Owner vs Tenant (JWT-based)

```
┌─────────────────────────────────────────────────────────────┐
│  Tenant Table                                               │
├─────────────────────────────────────────────────────────────┤
│  id    name           is_owner   tier                       │
│  1     "SysTech"      true       -          ← US (owner)    │
│  2     "Acme Corp"    false      enterprise ← Client        │
│  3     "StartupXYZ"   false      starter    ← Client        │
└─────────────────────────────────────────────────────────────┘
```

**JWT Payload:**
```json
{
  "user_id": "123",
  "tenant_id": "2",
  "is_owner": false,
  "role": "user"
}
```

**API Middleware Logic:**
```
if (jwt.is_owner) {
  // Can query ALL tenants
  // Access internal-portal features
} else {
  // Scoped to own tenant_id only
  // Access client-portal features
}
```

## Security (Defense in Depth)

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: Obscurity                                         │
│  └── Clients don't know internal portal URL exists          │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: Domain Separation                                 │
│  └── portal.app.com (client) vs admin.app.com (internal)    │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3: Auth + Redirect                                   │
│  └── If is_owner=false hits internal → redirect to client   │
├─────────────────────────────────────────────────────────────┤
│  LAYER 4: API Enforcement                                   │
│  └── Even if UI bypassed, API rejects non-owner requests    │
└─────────────────────────────────────────────────────────────┘
```

**Internal Portal Guard:**
```ts
// internal-portal/middleware/ownerGuard.ts
export function ownerGuard(jwt: JWTPayload) {
  if (!jwt.is_owner) {
    redirect('https://portal.app.com')  // send to client portal
  }
}
```

**API Route Protection:**
```ts
// api/middleware/requireOwner.ts
export function requireOwner(req, res, next) {
  if (!req.jwt.is_owner) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  next()
}

// Usage
router.get('/admin/all-tenants', requireOwner, getAllTenants)
```

**Additional Hardening (Optional):**
- Internal portal behind VPN or IP whitelist
- Rate limiting on login attempts
- Audit logging for all internal portal access

## Data Models

### Tenant
`id, name, subdomain, is_owner, tier (enterprise|business|starter), gatekeeper_enabled, created_at`
- `is_owner: boolean` - TRUE for us (owner), FALSE for clients

### User
`id, email, password_hash, role, tenant_id, created_at`

### Product
`id, name, tenant_id, created_at`

### Ticket
`id, title, description, product_id, status, user_id, tenant_id, created_at, updated_at`
- `client_priority (1-4)` - Client-reported
- `client_severity (1-4)` - Client-reported
- `internal_priority (1-4)` - Set by integrator
- `internal_severity (1-4)` - Set by integrator
- `assigned_to` - Support user
- `integrator_id` - Who triaged

### Attachment
`id, ticket_id, file_url, file_name, created_at`

### CompanyContact
`id, tenant_id, integrator_id, sales_person, notes, created_at`

### FeatureRequest
`id, title, description, requester_id, tenant_id, status, created_at, updated_at`
- Status: `draft | quoted | pending_approval | revision | approved | rejected`
- `beads_epic_id` - Linked epic after approval

### Quote
`id, feature_request_id, version, scope, price, timeline, created_by, created_at`
- Version increments on each revision

### QuoteComment
`id, quote_id, user_id, comment, created_at`
- Negotiation thread between CEO and approver

### FeatureRequestAccess
`id, feature_request_id, user_id, created_at`
- Explicit whitelist for visibility
