# Database Lifecycle Management

Complete guide for managing your database throughout its lifecycle: backup, reset, seed, and restore.

## Overview

```
Development Cycle:
  Fresh → Lookups → Sample Data → Test → Backup → Reset → Repeat

Production:
  Setup → Seed Lookups → Import Data → Backup → Monitor → Restore (if needed)
```

## Available Commands

### 🔄 Core Lifecycle Commands

| Command | Purpose |
|---------|---------|
| `npm run db:push` | Apply schema migrations (Drizzle) |
| `npm run db:backup` | Export all data to JSON backup file |
| `npm run db:reset` | Delete ALL data (truncate tables) ⚠️ |
| `npm run db:restore` | Restore from backup file |

### 🌱 Seeding Commands

| Command | Purpose |
|---------|---------|
| `npm run db:seed:lookups` | Populate reference/lookup tables |
| `npm run db:seed:sample` | Add sample/demo data |
| `npm run db:seed:demo` | Legacy seed command |
| `npm run db:seed` | Legacy seed command |

### 📊 Import Commands

| Command | Purpose |
|---------|---------|
| `npm run db:import:beads` | Direct DB import from beads |
| `npm run db:import:beads:api` | API-based import from beads |

---

## Common Workflows

### Workflow 1: Fresh Development Setup

Start with a clean slate for development:

```bash
# 1. Create schema
npm run db:push

# 2. Add reference data (lookups)
npm run db:seed:lookups

# 3. Add sample data for testing
npm run db:seed:sample

# 4. Start developing
npm run dev
```

### Workflow 2: Reset & Start Over

When you want to clear everything and start fresh:

```bash
# 1. Backup current state (optional, for safety)
npm run db:backup

# 2. Delete all data
npm run db:reset -- --confirm

# 3. Recreate schema
npm run db:push

# 4. Add lookups & sample data
npm run db:seed:lookups
npm run db:seed:sample

# 5. Verify
npm run dev
```

### Workflow 3: Import Beads Work Items

After initial setup, import all work items from beads:

```bash
# Setup done already
# Now import beads items
npm run db:import:beads:api

# Or direct DB import (faster, no API needed)
npm run db:import:beads
```

### Workflow 4: Backup Before Changes

Before making risky changes, back up your data:

```bash
# 1. Create backup
npm run db:backup
# Output: Backup created at: backups/backup-2024-01-08T14-30-45-123Z.json

# 2. Make your changes
# ... work on something risky ...

# 3. If something goes wrong, restore
npm run db:restore backup-2024-01-08T14-30-45-123Z.json

# Or restore latest backup (default)
npm run db:restore
```

### Workflow 5: Production Setup

Setting up production environment:

```bash
# 1. Create schema
npm run db:push

# 2. Add lookups (reference data)
npm run db:seed:lookups

# 3. Import real data from beads or backup
npm run db:import:beads:api
# OR
npm run db:restore production-backup.json

# 4. Verify data
npm run db:studio  # Open Drizzle Studio to inspect

# 5. Start application
npm run start
```

---

## Database Commands in Detail

### `npm run db:backup`

**What it does:**
- Exports all database tables to a JSON file
- Creates timestamped backup file in `backups/` directory
- Stores: tenants, clients, users, products, epics, features, tasks, tickets, ideas, tags, etc.

**Output:**
```
🔄 Starting database backup...

  ✅ tenants: 1 rows
  ✅ clients: 3 rows
  ✅ users: 8 rows
  ✅ products: 14 rows
  ...

✅ Backup completed successfully!
📁 Backup file: backups/backup-2024-01-08T14-30-45-123Z.json
📊 Total tables backed up: 16
💾 File size: 245.32 KB
```

**Backup file location:**
```
backups/
  ├── backup-2024-01-08T14-30-45-123Z.json
  ├── backup-2024-01-07T10-15-22-456Z.json
  └── backup-2024-01-06T09-20-11-789Z.json
```

### `npm run db:reset`

**What it does:**
- ⚠️ DELETES ALL DATA from all tables
- Keeps schema intact (tables still exist, just empty)
- Requires `--confirm` flag to proceed

**Usage:**
```bash
npm run db:reset -- --confirm
```

**Output:**
```
🔄 Starting database reset...

⚠️  WARNING: This will DELETE all data!

🗑️  Truncating tables...

  ✅ tenants
  ✅ clients
  ✅ users
  ...

✅ Database reset completed!
📊 All tables have been truncated.

Next steps:
  1. npm run db:push              (recreate schema)
  2. npm run db:seed:lookups      (add reference data)
  3. npm run db:seed:sample       (add sample data)
  4. npm run db:import:beads:api  (import beads items)
```

### `npm run db:seed:lookups`

**What it does:**
- Creates SysTech tenant (if not exists)
- Populates reference/lookup tables:
  - Tags for organizing AI configs
  - (Future: Status enums, roles, priorities, etc.)

**What's seeded:**
```
- 1 Tenant: SysTech (owner)
- 18 Tags: system-prompt, template, workflow, skill, hook, etc.
```

**Output:**
```
📚 Seeding lookup tables...

🏢 Creating SysTech tenant...
  ✅ Created tenant: SysTech (ID: 1)

🏷️  Creating reference tags...
  ✅ system-prompt
  ✅ template
  ✅ workflow
  ... (18 total)

✅ Lookup tables seeded!
📊 Tags created: 18/18
```

### `npm run db:seed:sample`

**What it does:**
- Creates sample/demo data for testing
- Uses existing tenant from lookups
- Populates all core entities

**What's seeded:**
```
- 1 Tenant
- 3 Clients: Acme Corp, TechCorp, StartupXYZ
- 4 Products: Tasklets, CRM Sales, SDMS v2, HRM v2
- 4 Internal Users: ramesh, john, sarah, mike
- 4 Client Users: john@acme, admin@acme, tech@techcorp, founder@startupxyz
- 4 Teams: Development, QA, Sales, HR
- 3 Ideas: dark mode, rate limiting, mobile app
```

**Test users created:**
```
Password: Systech@123

Internal Portal:
  ramesh@systech.com (admin)
  john@systech.com (developer)
  sarah@systech.com (support)
  mike@systech.com (company_admin)

Client Portal (Acme Corp):
  john@acme.com (user)
  admin@acme.com (company_admin)
```

**Output:**
```
🌱 Seeding sample data...

🏢 Getting SysTech tenant...
  ✅ Using existing tenant: SysTech

👥 Creating sample clients...
  ✅ Acme Corp
  ✅ TechCorp Inc
  ✅ StartupXYZ

... (more output)

✅ Sample data seeded successfully!

📊 Summary:
  Tenants: 1
  Clients: 3
  Products: 4
  Internal Users: 4
  Client Users: 4
  Teams: 4
  Ideas: 3
```

### `npm run db:restore`

**What it does:**
- Restores all data from a backup JSON file
- Clears existing data first
- Re-enables foreign keys after restore
- Can restore from specific backup or latest

**Usage:**
```bash
# Restore latest backup
npm run db:restore

# Restore specific backup
npm run db:restore backup-2024-01-08T14-30-45-123Z.json
```

**Output:**
```
🔄 Starting database restore...

📂 Reading backup: backup-2024-01-08T14-30-45-123Z.json
📅 Backup timestamp: 2024-01-08T14:30:45.123Z
📊 Tables to restore: 16

⚙️  Disabling foreign key checks...
🗑️  Clearing existing data...
✅ Cleared existing data

📥 Restoring tables...

  ✅ tenants: 1 rows
  ✅ clients: 3 rows
  ✅ users: 8 rows
  ... (more tables)

⚙️  Re-enabling foreign key checks...

✅ Database restore completed!
📊 Total rows restored: 245
```

### `npm run db:import:beads:api`

**What it does:**
- Reads `.beads/issues.jsonl`
- Authenticates as ramesh@systech.com
- Creates epics, features, tasks via REST API
- Maps beads data to tasklets schema

**Output:**
```
🚀 Starting Beads Import via API...

🔐 Authenticating as ramesh@systech.com...
✅ Authenticated successfully (User ID: 1)

📦 Finding "Tasklets" product...
✅ Found product: Tasklets (ID: 14)

... (epic/feature/task creation)

✅ Beads import complete!
```

---

## Backup File Format

Backup files are stored as JSON with this structure:

```json
{
  "timestamp": "2024-01-08T14:30:45.123Z",
  "version": "1.0",
  "tables": {
    "tenants": [
      { "id": 1, "name": "SysTech", "plan": "enterprise", ... },
      ...
    ],
    "clients": [
      { "id": 1, "tenantId": 1, "name": "Acme Corp", ... },
      ...
    ],
    ...
  }
}
```

**Backup file location:**
```
/path/to/tsklets/backend-tsklets/api/backups/
  └── backup-YYYY-MM-DDTHH-mm-ss-SSSZ.json
```

---

## Troubleshooting

### Error: "Database reset completed" but tables not empty

**Cause:** Reset only truncates data, not schema

**Solution:**
```bash
npm run db:reset -- --confirm  # Truncate
npm run db:push                 # Recreate schema
```

### Error: "Backup file not found"

**Cause:** Looking in wrong directory or file doesn't exist

**Solution:**
```bash
# Check backups directory
ls -la backups/

# List available backups
npm run db:restore
# (Will show error with available files)
```

### Error: "Foreign key constraint violation" during restore

**Cause:** Data insert order violates constraints

**Solution:**
```bash
# The script should handle this automatically
# If it fails, try restoring with DB reset first:
npm run db:reset -- --confirm
npm run db:restore
```

### Error: "Table truncate failed"

**Cause:** Table doesn't exist in database

**Solution:**
```bash
# Recreate schema first
npm run db:push

# Then try reset again
npm run db:reset -- --confirm
```

---

## Best Practices

### ✅ DO:
- **Backup before risky changes** → `npm run db:backup`
- **Use reset for clean slate** → `npm run db:reset -- --confirm`
- **Add lookups first** → `npm run db:seed:lookups`
- **Test with sample data** → `npm run db:seed:sample`
- **Keep multiple backups** → They auto-timestamp
- **Document your workflow** → What you reset/restored

### ❌ DON'T:
- **Reset without backup** → You'll lose data
- **Run reset on production** → Use with caution
- **Delete backup files manually** → Keep them for safety
- **Skip seed:lookups step** → Reference data is required
- **Import without confirmation** → Verify backup exists first

---

## Advanced: Custom Seeding

To add custom seed data, create a new script:

```typescript
// src/scripts/db-seed-custom.ts
import { db } from '../db/index.js';
import { yourTable } from '../db/schema.js';

async function seedCustom() {
  console.log('🌱 Seeding custom data...');

  // Your seeding logic
  const [item] = await db.insert(yourTable).values({
    // ...
  }).returning();

  console.log('✅ Done');
  process.exit(0);
}

seedCustom();
```

Then add to `package.json`:
```json
"db:seed:custom": "tsx src/scripts/db-seed-custom.ts"
```

Run: `npm run db:seed:custom`

---

## Database Schema Migrations

For schema changes, use Drizzle migrations:

```bash
# Generate new migration
npm run db:generate

# Apply migrations
npm run db:push

# Inspect database
npm run db:studio
```

---

## Support

For issues or questions:
- Check database logs: `npm run db:studio`
- Review backup files: `ls -la backups/`
- Check script output for error messages
- Ensure PostgreSQL is running and accessible
