# Tsklets Migration Plan

## Project References

| Project | Path | Purpose |
|---------|------|---------|
| **Old** | `/Users/rameshbabu/data/projects/systech/customer-support` | Source - extract knowledge from here |
| **New** | `/Users/rameshbabu/data/projects/systech/tsklets` | Target - refactored structure |

> **Note for Claude**: If you need code, patterns, or history from old project, navigate to customer-support path above. Use Read tool with absolute paths.

---

## New Project Structure (tsklets)

```
tsklets/
├── frontend-tsklets/
│   ├── client/          <- from apps/client-portal
│   ├── internal/        <- from apps/internal-portal
│   └── shared/
│       ├── ui/          <- from packages/ui
│       ├── types/       <- from packages/types
│       └── utils/       <- from packages/utils
│
├── backend-tsklets/
│   └── api/             <- from apps/api
│
├── infra-tsklets/
│   ├── docker/          <- Containerfile, compose
│   ├── nginx/           <- nginx.local.conf
│   └── scripts/         <- deployment scripts
│
├── docs-tsklets/        <- from docs-cs
│
└── testing-tsklets/
    ├── e2e/
    └── integration/
```

---

## Migration Phases

### Phase 1: Extract Knowledge from Beads (in old project)

**Goal**: Identify valuable insights from 158 closed tickets

**Steps**:
1. Categorize closed tickets:
   - Architecture decisions
   - Bug patterns (root causes)
   - Feature implementations
   - Dead ends / what didn't work

2. Key commands (run in old project):
   ```bash
   cd /Users/rameshbabu/data/projects/systech/customer-support
   bd list --status=closed
   bd show <id>   # for detailed view
   ```

### Phase 2: Create Curated Memories in tsklets

**Goal**: Distill beads knowledge into focused Serena memories

| Memory File | Content |
|-------------|---------|
| `architecture-decisions.md` | Stack choices, PostgreSQL rationale, monorepo design, multi-tenancy |
| `patterns-and-conventions.md` | Code patterns, naming, folder structure, API design |
| `lessons-learned.md` | Bugs fixed, root causes, what to avoid |
| `domain-knowledge.md` | Ticket flow, roles, SLA logic, feature request workflow |
| `component-map.md` | Module responsibilities, dependencies |

### Phase 3: Copy Code Incrementally

Order of migration:
1. `packages/types` -> `frontend-tsklets/shared/types`
2. `packages/utils` -> `frontend-tsklets/shared/utils`
3. `packages/ui` -> `frontend-tsklets/shared/ui`
4. `apps/api` -> `backend-tsklets/api`
5. `apps/client-portal` -> `frontend-tsklets/client`
6. `apps/internal-portal` -> `frontend-tsklets/internal`
7. Infrastructure files -> `infra-tsklets/`
8. Documentation -> `docs-tsklets/`

---

## Key Docs in Old Project

Reference these for domain knowledge:
- `docs-cs/architecture.md` - Stack, flows, roles, data models
- `docs-cs/product.md` - Personas, user stories, MVP scope
- `docs-cs/api.md` - API endpoints
- `CLAUDE.md` - Project instructions (adapt for tsklets)

---

## Status Tracking

- [x] Phase 1: Extract knowledge from beads (79 closed tickets analyzed)
- [x] Phase 2: Create curated memories (5 memories created)
- [x] Phase 3: Copy code incrementally (all packages, apps, infra, docs copied)
