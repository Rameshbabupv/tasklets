# Component Map

> What each module does and how they connect

## System Architecture

```
┌──────────────────┐      ┌──────────────────┐
│   CLIENT PORTAL  │      │  INTERNAL PORTAL │
│   (Tenants)      │      │  (SysTech Team)  │
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

## Backend Components

### API Entry Point
**File**: `backend-tsklets/api/src/index.ts`
- Express app setup
- Middleware stack (helmet, CORS, rate limit, JSON, auth)
- Route mounting
- Error handling

### Routes

| Route File | Base Path | Purpose |
|------------|-----------|---------|
| `auth.ts` | `/api/v1/auth` | Signup, signin, logout |
| `tickets.ts` | `/api/v1/tickets` | User ticket CRUD |
| `admin.ts` | `/api/v1/admin` | Admin ticket management |
| `dev-tasks.ts` | `/api/v1/dev-tasks` | Epic/Feature/Task management |
| `sprints.ts` | `/api/v1/sprints` | Sprint management |
| `products.ts` | `/api/v1/products` | Product management |
 | `ideas.ts` | `/api/v1/ideas` | Idea/feature requests |
 | `requirements.ts` | `/api/requirements` | Requirement management with markdown support |


### Middleware

| File | Purpose |
|------|---------|
| `auth.ts` | JWT verification, user extraction |
| `tenant.ts` | Tenant ID extraction from JWT |
| `roles.ts` | `requireAdmin`, `requireDeveloper`, `requireOwner` |

### Database

| File | Purpose |
|------|---------|
| `schema.ts` | Drizzle table definitions |
| `index.ts` | DB connection, Drizzle instance |
| `seed.ts` | Sample data seeding |

### Key Tables

| Table | Purpose |
|-------|---------|
| `tenants` | Multi-tenant root |
| `users` | All users (tenant-scoped) |
| `clients` | Customer companies |
| `products` | Products clients use |
| `tickets` | Support tickets |
| `attachments` | Ticket file uploads |
| `epics` | Top-level dev work items |
| `features` | Epic children |
| `devTasks` | Feature children (actual work) |
| `taskAssignments` | Multi-dev assignment |
| `sprints` | Sprint definitions |
| `ideas` | Feature request submissions |

## Frontend Components

### Client Portal (frontend-tsklets/client)

| Page/Component | Purpose |
|----------------|---------|
| `Dashboard` | User's ticket overview |
| `TicketList` | List own tickets |
| `TicketDetail` | Single ticket view |
| `CreateTicket` | New ticket form |
| `Login/Signup` | Auth pages |

### Internal Portal (frontend-tsklets/internal)

| Page/Component | Purpose |
|----------------|---------|
| `AdminDashboard` | Overview stats, charts |
| `TicketQueue` | All tenant tickets |
| `DeveloperKanban` | My tasks board |
| `ProductDashboard` | Epic/Feature/Task tree |
| `SprintBoard` | Sprint management |
| `SprintPlanning` | Plan upcoming sprints |

### Shared UI (frontend-tsklets/shared/ui)
 
 | Component | Purpose |
 |-----------|---------|
 | `Button` | Standard button |
 | `Card` | Container card |
 | `StatusBadge` | Ticket/task status display |
 | `PriorityPill` | P1/P2/P3/P4 indicator |
 | `TicketCard` | Ticket summary card |
 | `Spinner` | Loading indicator |

### Internal Portal Components (frontend-tsklets/internal)
 
 | Component | Purpose |
 |-----------|---------|
 | `MarkdownEditor` | Rich text markdown editor with edit/preview toggle |


### Shared Types (frontend-tsklets/shared/types)

| Type | Fields |
|------|--------|
| `User` | id, email, name, role, tenantId |
| `Ticket` | id, title, description, status, priority, severity |
| `Epic` | id, title, status, priority, productId |
| `Feature` | id, title, status, epicId |
| `DevTask` | id, title, status, type, featureId, sprintId |
| `Sprint` | id, name, goal, startDate, endDate, status |

### Shared Utils (frontend-tsklets/shared/utils)

| Util | Purpose |
|------|---------|
| `formatDate` | Date formatting |
| `validators` | Input validation |
| `api` | Fetch wrapper with auth |

## Infrastructure

### Docker (infra-tsklets/docker)
- `Containerfile` - Multi-stage build
- `podman-compose.yml` - Full stack compose

### Nginx (infra-tsklets/nginx)
- `nginx.local.conf` - Local reverse proxy

### Scripts (infra-tsklets/scripts)
- `restore-to-postgres.ts` - Data migration
- Deployment scripts (TBD)

## Dependency Flow

```
@repo/types ◄─────┬─────────┐
                  │         │
@repo/utils ◄─────┤         │
                  │         │
@repo/ui ◄────────┤         │
      │           │         │
      ▼           ▼         ▼
client-portal  internal-portal  api
```
