# 🗄️ Database Lifecycle Quick Start

Your complete database management system is now ready!

## 📊 What You Have

A complete **4-phase database lifecycle** system:

```
Phase 1: INITIALIZE
  └─ npm run db:push
     └─ Apply database schema migrations

Phase 2: LOOKUP DATA
  └─ npm run db:seed:lookups
     └─ Populate reference tables (tenant, tags, etc.)

Phase 3: SAMPLE DATA
  └─ npm run db:seed:sample
     └─ Create realistic demo data for testing

Phase 4: SYNC WORK ITEMS
  └─ npm run db:import:beads:api
     └─ Import 85 work items from Beads
```

## 🚀 Quick Start (5 minutes)

```bash
cd backend-tsklets/api

# 1. Create schema
npm run db:push

# 2. Add reference data
npm run db:seed:lookups

# 3. Add sample data
npm run db:seed:sample

# 4. Start app
npm run dev
```

That's it! You now have:
- ✅ 1 Tenant (SysTech)
- ✅ 3 Sample Clients (Acme, TechCorp, StartupXYZ)
- ✅ 4 Products
- ✅ 8 Internal Users
- ✅ 4 Client Users
- ✅ 4 Teams & 3 Ideas

## 🔄 Available Commands

### Backup & Reset

| Command | Purpose |
|---------|---------|
| `npm run db:backup` | 💾 Export all data to backup file |
| `npm run db:reset -- --confirm` | 🗑️ Delete all data (keep schema) |
| `npm run db:restore` | 📥 Restore from backup |

### Seeding

| Command | Purpose |
|---------|---------|
| `npm run db:seed:lookups` | Add reference data |
| `npm run db:seed:sample` | Add demo data |

### Beads Import

| Command | Purpose |
|---------|---------|
| `npm run db:import:beads:api` | Import via REST API (recommended) |
| `npm run db:import:beads` | Direct DB import |

## 📋 Common Workflows

### Workflow 1: Clean Development Start

```bash
npm run db:push
npm run db:seed:lookups
npm run db:seed:sample
npm run dev
```

### Workflow 2: Add Beads Work Items

```bash
# After basic setup, in another terminal:
npm run db:import:beads:api

# Then view in app at http://localhost:4020
```

### Workflow 3: Reset to Fresh Start

```bash
npm run db:reset -- --confirm
npm run db:push
npm run db:seed:lookups
npm run db:seed:sample
```

### Workflow 4: Safety Backup → Change → Restore

```bash
# Before risky changes
npm run db:backup

# Do something risky...

# Oops! Restore
npm run db:restore
```

## 🔐 Test Users

After `npm run db:seed:sample`, use these credentials:

### Internal Portal (http://localhost:4020)
```
Email:    ramesh@systech.com
Password: Systech@123
Role:     Admin
```

### Client Portal (http://localhost:4010)
```
Email:    john@acme.com
Password: Systech@123
Role:     Customer User
```

## 📁 Backup Files

Backups are saved with timestamps:

```
backups/
├── backup-2024-01-08T14-30-45-123Z.json
├── backup-2024-01-07T10-15-22-456Z.json
└── backup-2024-01-06T09-20-11-789Z.json
```

**To restore specific backup:**
```bash
npm run db:restore backup-2024-01-08T14-30-45-123Z.json
```

**To restore latest backup:**
```bash
npm run db:restore
```

## 📊 Database Schema

Current tables:
- `tenants` - SaaS owners
- `clients` - Tenant's customers
- `users` - Team members (internal + customer)
- `products` - Products/services
- `epics`, `features`, `dev_tasks` - Work items
- `sprints`, `tickets` - Planning & support
- `teams`, `ideas` - Collaboration
- `tags`, `ai_configs`, `api_keys` - Tools & config

## 🎯 What's Included

### Backup System
✅ Timestamped backups in `backups/` directory
✅ All tables exported to JSON
✅ Safe snapshots before changes

### Reset System
✅ Clear all data while keeping schema
✅ Requires `--confirm` flag (safety)
✅ Perfect for development iteration

### Seed System
✅ Lookup tables (reference data)
✅ Sample data (realistic demo data)
✅ Pre-configured test users

### Beads Import
✅ API-based import via REST endpoints
✅ Direct DB import (faster)
✅ 85 work items: 14 epics, 28 features, 43 tasks

### Documentation
✅ `DATABASE_LIFECYCLE.md` - Complete guide
✅ All workflows documented
✅ Troubleshooting & best practices

## ⚠️ Important Notes

1. **Reset requires confirmation:**
   ```bash
   npm run db:reset -- --confirm
   ```
   Without `--confirm`, it just shows instructions.

2. **Backup before reset:**
   ```bash
   npm run db:backup  # Save current state
   npm run db:reset -- --confirm  # Then delete
   ```

3. **Restore is destructive:**
   It clears existing data before restoring, so be sure you want it!

4. **Order matters:**
   Always do: push → seed:lookups → seed:sample → dev

## 📚 Full Documentation

For complete documentation with all workflows, troubleshooting, and best practices:

```bash
cat backend-tsklets/api/src/scripts/DATABASE_LIFECYCLE.md
```

## 🆘 Troubleshooting

### "Table doesn't exist" during seed

**Solution:**
```bash
npm run db:push  # Recreate schema
npm run db:seed:lookups
```

### "Foreign key constraint violation"

**Solution:**
```bash
npm run db:reset -- --confirm
npm run db:push
npm run db:seed:lookups
npm run db:restore
```

### Backup file not found

**List available backups:**
```bash
ls -la backend-tsklets/api/backups/
```

### Restore failed

**Try full reset → reseed:**
```bash
npm run db:reset -- --confirm
npm run db:push
npm run db:seed:lookups
npm run db:seed:sample
npm run db:restore  # Now try restore
```

## 🎊 You're All Set!

Your database lifecycle management is complete. You can now:

✅ Backup before changes
✅ Reset for clean start
✅ Seed reference + sample data
✅ Import 85 work items from Beads
✅ Restore from backups anytime

**Next Steps:**
1. Run: `npm run db:push && npm run db:seed:lookups && npm run db:seed:sample`
2. Start: `npm run dev`
3. Visit: http://localhost:4020 (ramesh@systech.com)
4. Import beads: `npm run db:import:beads:api`

**Happy coding!** 🚀
