# Domain Knowledge

> Business logic and workflows from customer-support system

## Core Concept: Owner vs Tenant

```
┌─────────────────────────────────────────────────────────────┐
│  Tenant Table                                               │
├─────────────────────────────────────────────────────────────┤
│  id    name           is_owner   tier                       │
│  1     "SysTech"      true       -          ← US (owner)    │
│  2     "Acme Corp"    false      enterprise ← Client        │
│  3     "StartupXYZ"   false      starter    ← Client        │
└─────────────────────────────────────────────────────────────┘

- is_owner=true: SysTech (the company running the system)
- is_owner=false: Clients (tenants using the system)
```

## Ticket Flow

```
CLIENT SIDE                           OUR SIDE
─────────────────────────────────────────────────────────────
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

**Statuses**: `open` → `in_progress` → `resolved` → `closed`

## Feature Request Flow

```
CLIENT SIDE                           OUR SIDE
─────────────────────────────────────────────────────────────
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
    │
    ├─► Rejected → End
    │
    └─► Approved
            │
            ──────── Approved ────────► Creates Beads Epic
                                           │
                                       Dev Sprint
                                           │
                                       Delivery
```

**Statuses**: `draft` → `quoted` → `pending_approval` → `revision` → `approved`/`rejected`

## Roles

| Role | Side | Permissions |
|------|------|-------------|
| `user` | Client | Create/view own tickets, request features |
| `gatekeeper` | Client | Vet/approve tickets before submission |
| `company_admin` | Client | Manage company users, view all company tickets |
| `approver` | Client | Approve/reject quotes for feature requests |
| `integrator` | Owner | Triage tickets, set internal priority/severity |
| `support` | Owner | Handle/resolve tickets |
| `developer` | Owner | View Kanban, manage tasks, close tickets |
| `ceo` | Owner | View all feature requests, create/revise quotes |
| `admin` | Owner | Full system access |

## Customer Tiers & SLA

| Tier | Gatekeeper | SLA Multiplier |
|------|------------|----------------|
| `enterprise` | Optional | 1x (fastest) |
| `business` | Optional | 1.5x |
| `starter` | Disabled | 2x |

### SLA Matrix (Enterprise Baseline)

| Level | Severity | Priority | Response | Resolution |
|-------|----------|----------|----------|------------|
| S1/P1 | Critical - System down | Business blocked | 1 hr | 4 hrs |
| S2/P2 | High - Major feature broken | Major impact | 4 hrs | 24 hrs |
| S3/P3 | Medium - Feature degraded | Workaround exists | 8 hrs | 72 hrs |
| S4/P4 | Low - Minor/cosmetic | Enhancement | 24 hrs | 1 week |

**SLA clock starts**: When integrator triages (not submission).

## Dev Task Management (Internal)

### Hierarchy
```
Epic
  └── Feature
        └── Task/Bug

Example:
Epic: "Customer Support MVP"
  └── Feature: "Authentication System"
        ├── Task: "Setup User model"
        ├── Task: "Implement signup endpoint"
        └── Task: "Auth middleware"
```

### Task Types
- `task` - Normal development work
- `bug` - Defect to fix
- `spike` - Research/investigation

### Task Statuses
`backlog` → `ready` → `in_progress` → `review` → `done`

### Sprint Structure
- Sprints have: name, goal, start_date, end_date, velocity
- Tasks assigned to sprints via `sprint_id`
- Sprint capacity tracked per developer
- Retrospectives stored in `sprint_retros`

## Key Relationships

```
Tenant
  └── Users
  └── Clients (customer companies)
        └── Products (what they use)
  └── Tickets
        └── Comments
        └── Attachments
        └── Spawned Tasks (supportTicketTasks)
  └── Epics
        └── Features
              └── DevTasks
                    └── TaskAssignments (multi-dev)
  └── Sprints
        └── SprintCapacity
        └── SprintRetros
  └── Ideas
        └── IdeaComments
        └── IdeaReactions
```
