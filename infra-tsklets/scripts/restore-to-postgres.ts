/**
 * Restore SQLite backup to PostgreSQL
 * Reads JSON backup files and inserts into PostgreSQL
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../apps/api/src/db/schema.js'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { sql } from 'drizzle-orm'

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:change-this-secure-password@localhost:5432/supportdb'

const client = postgres(DATABASE_URL)
const db = drizzle(client, { schema })

// Find latest backup directory
function getLatestBackup(): string {
  const backupsDir = join(process.cwd(), 'backups')
  const backups = readdirSync(backupsDir)
    .filter(f => f.startsWith('backup-'))
    .sort()
    .reverse()

  if (backups.length === 0) {
    throw new Error('No backups found in backups/ directory')
  }

  return join(backupsDir, backups[0])
}

// Tables in order of dependencies (parents first)
const tableOrder = [
  { name: 'tenants', table: schema.tenants },
  { name: 'clients', table: schema.clients },
  { name: 'users', table: schema.users },
  { name: 'products', table: schema.products },
  { name: 'clientProducts', table: schema.clientProducts },
  { name: 'userProducts', table: schema.userProducts },
  { name: 'tickets', table: schema.tickets },
  { name: 'attachments', table: schema.attachments },
  { name: 'ticketComments', table: schema.ticketComments },
  { name: 'epics', table: schema.epics },
  { name: 'features', table: schema.features },
  { name: 'devTasks', table: schema.devTasks },
  { name: 'taskAssignments', table: schema.taskAssignments },
  { name: 'supportTicketTasks', table: schema.supportTicketTasks },
  { name: 'sprints', table: schema.sprints },
  { name: 'sprintRetros', table: schema.sprintRetros },
  { name: 'sprintCapacity', table: schema.sprintCapacity },
  { name: 'teams', table: schema.teams },
  { name: 'teamMembers', table: schema.teamMembers },
  { name: 'ideas', table: schema.ideas },
  { name: 'ideaComments', table: schema.ideaComments },
  { name: 'ideaReactions', table: schema.ideaReactions },
  { name: 'ideaProducts', table: schema.ideaProducts },
  { name: 'ideaTickets', table: schema.ideaTickets },
]

// Map SQLite table names to PostgreSQL table names (snake_case)
const tableNameMap: Record<string, string> = {
  tenants: 'tenants',
  clients: 'clients',
  users: 'users',
  products: 'products',
  clientProducts: 'client_products',
  userProducts: 'user_products',
  tickets: 'tickets',
  attachments: 'attachments',
  ticketComments: 'ticket_comments',
  epics: 'epics',
  features: 'features',
  devTasks: 'dev_tasks',
  taskAssignments: 'task_assignments',
  supportTicketTasks: 'support_ticket_tasks',
  sprints: 'sprints',
  sprintRetros: 'sprint_retros',
  sprintCapacity: 'sprint_capacity',
  teams: 'teams',
  teamMembers: 'team_members',
  ideas: 'ideas',
  ideaComments: 'idea_comments',
  ideaReactions: 'idea_reactions',
  ideaProducts: 'idea_products',
  ideaTickets: 'idea_tickets',
}

async function restoreData() {
  const backupPath = getLatestBackup()
  console.log(`Restoring from: ${backupPath}\n`)

  // Read summary
  const summary = JSON.parse(readFileSync(join(backupPath, '_summary.json'), 'utf-8'))
  console.log(`Backup timestamp: ${summary.timestamp}`)
  console.log(`Total rows to restore: ${summary.totalRows}\n`)

  // First, create tables by pushing schema
  console.log('Pushing schema to PostgreSQL...')

  for (const { name, table } of tableOrder) {
    const filePath = join(backupPath, `${name}.json`)

    try {
      const data = JSON.parse(readFileSync(filePath, 'utf-8'))

      if (data.length === 0) {
        console.log(`⏭️  ${name}: 0 rows (skipped)`)
        continue
      }

      // Convert boolean values (SQLite stores as 0/1)
      const convertedData = data.map((row: any) => {
        const converted = { ...row }
        // Convert SQLite boolean integers to actual booleans
        if ('isActive' in converted) converted.isActive = Boolean(converted.isActive)
        if ('gatekeeperEnabled' in converted) converted.gatekeeperEnabled = Boolean(converted.gatekeeperEnabled)
        if ('isInternal' in converted) converted.isInternal = Boolean(converted.isInternal)
        return converted
      })

      // Insert data
      await db.insert(table).values(convertedData)
      console.log(`✓ ${name}: ${data.length} rows`)
    } catch (error: any) {
      if (error.code === '23505') {
        console.log(`⚠️  ${name}: Already has data (skipped)`)
      } else {
        console.error(`✗ ${name}: ${error.message}`)
      }
    }
  }

  // Reset sequences to max id + 1
  console.log('\nResetting sequences...')
  for (const { name } of tableOrder) {
    const pgTableName = tableNameMap[name]
    try {
      await db.execute(sql.raw(`
        SELECT setval(pg_get_serial_sequence('${pgTableName}', 'id'),
          COALESCE((SELECT MAX(id) FROM ${pgTableName}), 0) + 1, false)
      `))
      console.log(`✓ ${pgTableName}_id_seq reset`)
    } catch (error: any) {
      // Sequence might not exist for some tables
      if (!error.message.includes('null')) {
        console.log(`⚠️  ${pgTableName}: ${error.message}`)
      }
    }
  }

  console.log('\n✓ Restore complete!')

  // Close connection
  await client.end()
}

restoreData().catch(async (err) => {
  console.error('Restore failed:', err)
  await client.end()
  process.exit(1)
})
