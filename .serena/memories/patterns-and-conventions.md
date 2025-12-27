# Patterns and Conventions

> Code patterns established in customer-support project

## File Naming

- **Lowercase, hyphenated**: `user-products.ts`, `ticket-comments.ts`
- **Living docs**: No date suffix (`architecture.md`, `api.md`)
- **Versioned docs**: Date suffix (`adr-001-2024-dec-22.md`)

## Directory Structure (New)

```
frontend-tsklets/     # cd f<tab>
backend-tsklets/      # cd b<tab>
infra-tsklets/        # cd i<tab>
docs-tsklets/         # cd d<tab>
testing-tsklets/      # cd t<tab>
```

## API Patterns

### Route Organization
```
backend-tsklets/api/src/
├── routes/
│   ├── auth.ts        # /api/v1/auth/*
│   ├── tickets.ts     # /api/v1/tickets/*
│   ├── admin.ts       # /api/v1/admin/*
│   └── dev-tasks.ts   # /api/v1/dev-tasks/*
├── middleware/
│   ├── auth.ts        # JWT verification
│   ├── tenant.ts      # Tenant isolation
│   └── roles.ts       # requireAdmin, requireDeveloper
└── services/          # Business logic
```

### Middleware Stack
```typescript
// Order matters
app.use(helmet());           // Security headers
app.use(cors(corsOptions));  // CORS
app.use(rateLimiter);        // Rate limiting
app.use(express.json());     // Body parsing
app.use(tenantMiddleware);   // Tenant extraction
app.use(authMiddleware);     // JWT verification (on protected routes)
```

### Response Format
```typescript
// Success
res.json({ user, token })
res.json({ tickets: [...] })

// Error
res.status(401).json({ error: 'Unauthorized' })
res.status(403).json({ error: 'Forbidden' })
res.status(404).json({ error: 'Not found' })
```

## Database Patterns

### Schema Definition (Drizzle + PostgreSQL)
```typescript
import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const tickets = pgTable('tickets', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),  // ALWAYS include
  title: text('title').notNull(),
  status: text('status').default('open'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Relations
```typescript
export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  user: one(users, { fields: [tickets.userId], references: [users.id] }),
  comments: many(ticketComments),
}));
```

### Tenant-Scoped Queries
```typescript
// ALWAYS filter by tenantId
const myTickets = await db.query.tickets.findMany({
  where: eq(tickets.tenantId, req.tenantId),
});
```

## Frontend Patterns

### Component Organization
```
frontend-tsklets/shared/ui/
├── Button.tsx
├── Card.tsx
├── StatusBadge.tsx
├── PriorityPill.tsx
└── index.ts           # Re-exports
```

### Import Pattern
```typescript
// From shared packages
import { Button, Card } from '@repo/ui';
import { Ticket, User } from '@repo/types';
import { formatDate } from '@repo/utils';
```

### Page Structure
```typescript
// pages/TicketDetail.tsx
export function TicketDetail() {
  const { id } = useParams();
  const { data, isLoading } = useQuery(['ticket', id], () => fetchTicket(id));

  if (isLoading) return <Spinner />;
  return <TicketCard ticket={data} />;
}
```

## Naming Conventions

| Entity | Convention | Example |
|--------|------------|---------|
| Tables | snake_case, plural | `dev_tasks`, `ticket_comments` |
| Columns | snake_case | `tenant_id`, `created_at` |
| TS types | PascalCase | `Ticket`, `DevTask` |
| Functions | camelCase | `createTicket`, `fetchUser` |
| Components | PascalCase | `TicketCard`, `StatusBadge` |
| Routes | kebab-case | `/dev-tasks`, `/sprint-capacity` |

## Issue Key Pattern

```
Format: {PRODUCT_CODE}-{TYPE_PREFIX}{NUMBER}

Types:
- E = Epic    (CSUP-E001)
- F = Feature (CSUP-F001)
- T = Task    (CSUP-T001)
- B = Bug     (CSUP-B001)

Per-product sequence via product_sequences table.
```
