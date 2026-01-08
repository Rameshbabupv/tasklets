import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import { eq } from 'drizzle-orm'
import * as schema from '../apps/api/src/db/schema.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const dbPath = join(__dirname, '../apps/api/src/db/data.db')

const client = createClient({ url: `file:${dbPath}` })
const db = drizzle(client, { schema })

async function syncBeadsTickets() {
  // Get SysTech tenant and Tasklets product
  const [tenant] = await db.select().from(schema.tenants).where(eq(schema.tenants.name, 'SysTech')).limit(1)
  const [product] = await db.select().from(schema.products).where(eq(schema.products.name, 'Tasklets')).limit(1)
  const [internalClient] = await db.select().from(schema.clients).where(eq(schema.clients.name, 'Internal')).limit(1)

  if (!tenant || !product) {
    console.error('Missing tenant or Tasklets product')
    return
  }

  // Use Internal client or first client
  let clientId = internalClient?.id
  if (!clientId) {
    const [anyClient] = await db.select().from(schema.clients).limit(1)
    clientId = anyClient?.id
  }

  if (!clientId) {
    console.error('No client found')
    return
  }

  const beadsTickets = [
    {
      beadsId: 'customer-support-dto',
      title: 'SQLite Backup & Data Migration Script',
      description: `Create intelligent SQLite backup that reads data and inserts according to current architecture.

Requirements:
- NOT a raw dump/restore - must be schema-aware
- Read existing SQLite data programmatically
- Map to current schema (handle any schema drift)
- Preserve all content without data loss
- Development-friendly: can restore to fresh DB

Approach:
- Export each table to JSON/TypeScript objects
- Validate against current Drizzle schema
- Import script that uses Drizzle ORM (not raw SQL)
- Handle foreign key relationships correctly`,
      clientPriority: 1,
    },
    {
      beadsId: 'customer-support-bw9',
      title: 'PostgreSQL Migration with Stored Procedures',
      description: `Migrate from SQLite to PostgreSQL with backend optimizations.

Scope:
- Switch Drizzle adapter from SQLite to PostgreSQL
- Implement stored procedures for heavy operations
- Connection pooling setup
- Migration scripts (Drizzle migrate)

Stored Procedures Candidates:
- Bulk ticket operations
- Report aggregations
- Search/filtering with complex joins
- Audit log writes

Environment:
- Local: Docker PostgreSQL
- Prod: Managed PostgreSQL (Supabase/Neon/RDS)`,
      clientPriority: 1,
    },
    {
      beadsId: 'customer-support-bxx',
      title: 'AWS Access & Auto Deploy Setup with Karti',
      description: `Work with Karti to:
- Get AWS access credentials/IAM setup
- Configure auto-deploy pipeline for Tasklets
- CI/CD setup (GitHub Actions → AWS)
- Environment configuration (staging/prod)`,
      clientPriority: 2,
    },
    {
      beadsId: 'customer-support-vn0',
      title: "Deploy Tasklets on Venkatesh's Machine",
      description: `Local deployment of Tasklets app on Venkatesh's machine:
- Environment setup (Node, pnpm, dependencies)
- Database initialization
- App configuration
- Verify all features working`,
      clientPriority: 2,
    },
    // Production Hardening Epic & Features
    {
      beadsId: 'customer-support-khv',
      title: 'Tasklets Production Hardening',
      description: `Prepare Tasklets for production deployment with 2 clients.

Phases:
1. Security Hardening (helmet, CORS, rate limiting)
2. PostgreSQL Migration (SQLite → PG)
3. S3 File Storage
4. Deployment Infrastructure (Docker, CI/CD)
5. Observability (logging, Sentry)
6. API Keys for External Integration`,
      clientPriority: 1,
    },
    {
      beadsId: 'customer-support-78k',
      title: 'Phase 1: Security Hardening',
      description: `Add security middleware to Express API.

Tasks:
- helmet.js security headers
- CORS restrictions
- Rate limiting
- Remove hardcoded JWT secret
- Input validation (Zod)
- Request logging`,
      clientPriority: 1,
    },
    {
      beadsId: 'customer-support-aon',
      title: 'Phase 2: PostgreSQL Migration',
      description: `Migrate from SQLite to PostgreSQL.

Tasks:
- SQLite data backup script
- Switch Drizzle to PostgreSQL
- Convert schema
- Data migration script`,
      clientPriority: 1,
    },
    {
      beadsId: 'customer-support-7k4',
      title: 'Phase 3: S3 File Storage',
      description: `Move file uploads from local disk to S3/MinIO.`,
      clientPriority: 2,
    },
    {
      beadsId: 'customer-support-485',
      title: 'Phase 4: Deployment Infrastructure',
      description: `Production deployment setup: Docker, CI/CD, health checks.`,
      clientPriority: 2,
    },
    {
      beadsId: 'customer-support-1h7',
      title: 'Add helmet.js security headers',
      description: `Install and configure helmet.js middleware.
File: apps/api/src/index.ts`,
      clientPriority: 1,
    },
    {
      beadsId: 'customer-support-tgd',
      title: 'Configure CORS restrictions',
      description: `Restrict CORS to specific frontend domains.
File: apps/api/src/index.ts`,
      clientPriority: 1,
    },
    {
      beadsId: 'customer-support-wpb',
      title: 'Add rate limiting middleware',
      description: `Protect against brute force attacks.
File: apps/api/src/middleware/rateLimit.ts`,
      clientPriority: 1,
    },
    {
      beadsId: 'customer-support-996',
      title: 'Remove hardcoded JWT secret fallback',
      description: `Remove dev-secret-change-in-prod fallback from auth.`,
      clientPriority: 1,
    },
    {
      beadsId: 'customer-support-64s',
      title: 'Convert schema to PostgreSQL',
      description: `Change Drizzle schema from SQLite to PostgreSQL (sqliteTable → pgTable).`,
      clientPriority: 1,
    },
    {
      beadsId: 'customer-support-fas',
      title: 'Add health check endpoints',
      description: `Add /health and /ready endpoints for container orchestration.`,
      clientPriority: 2,
    },
  ]

  for (const ticket of beadsTickets) {
    // Check if already exists (by title match)
    const [existing] = await db.select().from(schema.tickets)
      .where(eq(schema.tickets.title, ticket.title)).limit(1)

    if (existing) {
      console.log(`Ticket already exists: ${ticket.title}`)
      continue
    }

    await db.insert(schema.tickets).values({
      tenantId: tenant.id,
      clientId,
      productId: product.id,
      title: ticket.title,
      description: ticket.description,
      clientPriority: ticket.clientPriority,
      status: 'open',
    })
    console.log(`Created ticket: ${ticket.title}`)
  }

  console.log('Done!')
}

syncBeadsTickets().catch(console.error)
