import * as fs from 'fs';
import * as path from 'path';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';
import {
  tenants, clients, users, products, clientProducts, userProducts,
  epics, features, devTasks, sprints, tickets, teams, ideas,
  tags, aiConfigs, apiKeys
} from '../db/schema.js';

interface DatabaseBackup {
  timestamp: string;
  version: string;
  tables: Record<string, unknown[]>;
}

const tableSchemaMap: Record<string, any> = {
  tenants, clients, users, products, clientProducts, userProducts,
  epics, features, devTasks, sprints, tickets, teams, ideas,
  tags, aiConfigs, apiKeys,
};

async function restoreDatabase() {
  console.log('🔄 Starting database restore...\n');

  try {
    // Find backup file
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      throw new Error(`Backup directory not found: ${backupDir}`);
    }

    // Get latest backup file or specified file
    let backupFile = process.argv[2];

    if (!backupFile) {
      // Find latest backup
      const files = fs.readdirSync(backupDir)
        .filter((f) => f.startsWith('backup-') && f.endsWith('.json'))
        .sort()
        .reverse();

      if (files.length === 0) {
        throw new Error('No backup files found');
      }

      backupFile = path.join(backupDir, files[0]);
    } else {
      backupFile = path.join(backupDir, backupFile);
    }

    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    console.log(`📂 Reading backup: ${path.basename(backupFile)}`);

    // Read backup file
    const backupContent = fs.readFileSync(backupFile, 'utf-8');
    const backup: DatabaseBackup = JSON.parse(backupContent);

    console.log(`📅 Backup timestamp: ${backup.timestamp}`);
    console.log(`📊 Tables to restore: ${Object.keys(backup.tables).length}\n`);

    // Disable foreign key checks
    console.log('⚙️  Disabling foreign key checks...');
    await db.execute(sql`SET session_replication_role = 'replica'`);

    // Clear existing data
    console.log('🗑️  Clearing existing data...\n');

    const tablesToClear = [
      'ai_config_usage', 'ai_config_favorites', 'ai_config_tags', 'ai_config_versions', 'ai_configs', 'api_keys', 'tags',
      'sprint_capacity', 'sprint_retros', 'sprints',
      'task_assignments', 'support_ticket_tasks', 'dev_tasks',
      'features', 'epics',
      'ticket_audit_log', 'ticket_watchers', 'ticket_comments', 'attachments', 'ticket_links', 'tickets',
      'idea_reactions', 'idea_comments', 'idea_products', 'idea_tickets', 'ideas',
      'team_members', 'teams',
      'user_products', 'client_products',
      'requirement_amendments', 'requirements',
      'modules', 'components', 'addons', 'product_sequences',
      'products', 'users', 'clients', 'tenants',
    ];

    for (const table of tablesToClear) {
      try {
        await db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
      } catch (error) {
        // Table might not exist, continue
      }
    }

    console.log('✅ Cleared existing data\n');

    // Restore data table by table
    console.log('📥 Restoring tables...\n');

    let totalRows = 0;
    for (const [tableName, rows] of Object.entries(backup.tables)) {
      if (rows.length === 0) {
        console.log(`  ⏭️  ${tableName}: 0 rows (skipped)`);
        continue;
      }

      try {
        const tableSchema = tableSchemaMap[tableName];
        if (!tableSchema) {
          console.log(`  ⚠️  ${tableName}: Unknown table (skipped)`);
          continue;
        }

        // Insert rows in batches
        const batchSize = 100;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          await db.insert(tableSchema).values(batch as any);
        }

        totalRows += rows.length;
        console.log(`  ✅ ${tableName}: ${rows.length} rows`);
      } catch (error) {
        console.error(`  ❌ ${tableName}: ${(error as Error).message}`);
      }
    }

    // Re-enable foreign key checks
    console.log('\n⚙️  Re-enabling foreign key checks...');
    await db.execute(sql`SET session_replication_role = 'origin'`);

    console.log(`\n✅ Database restore completed!`);
    console.log(`📊 Total rows restored: ${totalRows}`);
    console.log(`📁 Backup file: ${backupFile}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Restore failed:', (error as Error).message);
    console.log('\n📝 Usage: npm run db:restore [backup-filename]');
    console.log('   Example: npm run db:restore backup-2024-01-08T14-30-45-123Z.json\n');
    process.exit(1);
  }
}

// Run restore
restoreDatabase();
