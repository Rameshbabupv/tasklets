import * as fs from 'fs';
import * as path from 'path';
import { db } from '../db/index.js';
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

async function backupDatabase() {
  console.log('🔄 Starting database backup...\n');

  try {
    const backup: DatabaseBackup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      tables: {}
    };

    // Define all tables to backup
    const tables = [
      { name: 'tenants', schema: tenants },
      { name: 'clients', schema: clients },
      { name: 'users', schema: users },
      { name: 'products', schema: products },
      { name: 'clientProducts', schema: clientProducts },
      { name: 'userProducts', schema: userProducts },
      { name: 'epics', schema: epics },
      { name: 'features', schema: features },
      { name: 'devTasks', schema: devTasks },
      { name: 'sprints', schema: sprints },
      { name: 'tickets', schema: tickets },
      { name: 'teams', schema: teams },
      { name: 'ideas', schema: ideas },
      { name: 'tags', schema: tags },
      { name: 'aiConfigs', schema: aiConfigs },
      { name: 'apiKeys', schema: apiKeys },
    ];

    // Export each table
    for (const table of tables) {
      try {
        const data = await db.select().from(table.schema);
        backup.tables[table.name] = data;
        console.log(`  ✅ ${table.name}: ${data.length} rows`);
      } catch (error) {
        console.log(`  ⚠️  ${table.name}: ${(error as Error).message}`);
      }
    }

    // Write backup file
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📁 Backup file: ${backupFile}`);
    console.log(`📊 Total tables backed up: ${Object.keys(backup.tables).length}`);
    console.log(`💾 File size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Backup failed:', (error as Error).message);
    process.exit(1);
  }
}

// Run backup
backupDatabase();
