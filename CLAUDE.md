# Tsklets - Customer Support System

## Project Structure

```
tsklets/
├── frontend-tsklets/     # cd f<tab>
│   ├── client/           # Tenant-facing portal (:3000)
│   ├── internal/         # Internal team portal (:3001)
│   └── shared/           # Shared packages
│       ├── types/        # @tsklets/types
│       ├── utils/        # @tsklets/utils
│       └── ui/           # @tsklets/ui
├── backend-tsklets/      # cd b<tab>
│   └── api/              # Express REST API (:4000)
├── infra-tsklets/        # cd i<tab>
│   ├── docker/
│   ├── nginx/
│   └── scripts/
├── docs-tsklets/         # cd d<tab>
└── testing-tsklets/      # cd t<tab>
```

## Quick Start

```bash
npm install
npm run dev          # Start all services
npm run dev:api      # API only
npm run dev:client   # Client portal only
npm run dev:internal # Internal portal only
```

## Guidelines

1. Read codebase before making changes
2. Keep changes simple - impact minimal code
3. Use Serena memories for context (`.serena/memories/`)
4. Track work with beads (`bd ready`, `bd show <id>`)

## Serena Memories

Check `.serena/memories/` for:
- `architecture-decisions.md` - Stack choices, rationale
- `patterns-and-conventions.md` - Code patterns
- `lessons-learned.md` - What worked, what to avoid
- `domain-knowledge.md` - Flows, roles, SLA
- `component-map.md` - Module map

## Old Project Reference

If you need history or context from the original project:
`/Users/rameshbabu/data/projects/systech/customer-support`
