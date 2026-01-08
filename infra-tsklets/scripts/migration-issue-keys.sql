-- Migration: Add issue key support to Tasklets
-- Run with: psql $DATABASE_URL -f scripts/migration-issue-keys.sql

-- 1. Add columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS next_issue_num INTEGER DEFAULT 1;

-- 2. Add columns to epics table
ALTER TABLE epics ADD COLUMN IF NOT EXISTS issue_key TEXT;
ALTER TABLE epics ADD COLUMN IF NOT EXISTS beads_id TEXT;

-- 3. Add columns to features table
ALTER TABLE features ADD COLUMN IF NOT EXISTS issue_key TEXT;
ALTER TABLE features ADD COLUMN IF NOT EXISTS beads_id TEXT;

-- 4. Add columns to dev_tasks table
ALTER TABLE dev_tasks ADD COLUMN IF NOT EXISTS issue_key TEXT;
ALTER TABLE dev_tasks ADD COLUMN IF NOT EXISTS beads_id TEXT;

-- 5. Add unique constraints (after backfill is done, run separately if needed)
-- ALTER TABLE epics ADD CONSTRAINT epics_issue_key_unique UNIQUE (issue_key);
-- ALTER TABLE features ADD CONSTRAINT features_issue_key_unique UNIQUE (issue_key);
-- ALTER TABLE dev_tasks ADD CONSTRAINT dev_tasks_issue_key_unique UNIQUE (issue_key);

SELECT 'Migration complete. Run backfill script next.' as status;
