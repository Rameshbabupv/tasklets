import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function resetDatabase() {
  console.log('🔄 Starting database reset...\n');
  console.log('⚠️  WARNING: This will DELETE all data!\n');

  // Confirm before proceeding
  if (process.argv[2] !== '--confirm') {
    console.log('To proceed with reset, run:');
    console.log('  npm run db:reset -- --confirm\n');
    process.exit(0);
  }

  try {
    console.log('🗑️  Truncating tables...\n');

    // List of tables in dependency order (reverse of creation)
    const tables = [
      // AI Configs
      'ai_config_usage',
      'ai_config_favorites',
      'ai_config_tags',
      'ai_config_versions',
      'ai_configs',
      'api_keys',
      'tags',

      // Sprint & Tasks
      'sprint_capacity',
      'sprint_retros',
      'sprints',
      'task_assignments',
      'support_ticket_tasks',
      'dev_tasks',

      // Work Items
      'features',
      'epics',

      // Tickets
      'ticket_audit_log',
      'ticket_watchers',
      'ticket_comments',
      'attachments',
      'ticket_links',
      'tickets',

      // Ideas
      'idea_reactions',
      'idea_comments',
      'idea_products',
      'idea_tickets',
      'ideas',

      // Teams
      'team_members',
      'teams',

      // Users & Products
      'user_products',
      'client_products',
      'requirement_amendments',
      'requirements',
      'modules',
      'components',
      'addons',
      'product_sequences',
      'products',
      'users',
      'clients',
      'tenants',
    ];

    // Disable foreign key checks temporarily
    await db.execute(sql`SET session_replication_role = 'replica'`);

    for (const table of tables) {
      try {
        await db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
        console.log(`  ✅ ${table}`);
      } catch (error) {
        console.log(`  ⚠️  ${table}: ${(error as Error).message}`);
      }
    }

    // Re-enable foreign key checks
    await db.execute(sql`SET session_replication_role = 'origin'`);

    console.log('\n✅ Database reset completed!');
    console.log('📊 All tables have been truncated.\n');
    console.log('Next steps:');
    console.log('  1. npm run db:push              (recreate schema)');
    console.log('  2. npm run db:seed:lookups       (add reference data)');
    console.log('  3. npm run db:seed:sample        (add sample data)');
    console.log('  4. npm run db:import:beads:api   (import beads items)\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Reset failed:', (error as Error).message);
    process.exit(1);
  }
}

// Run reset
resetDatabase();
