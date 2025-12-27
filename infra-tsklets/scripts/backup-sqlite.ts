/**
 * SQLite Backup Script
 * Exports all tables to JSON for migration to PostgreSQL
 */
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from '../apps/api/src/db/schema.js'
import { writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const dbPath = join(__dirname, '../apps/api/src/db/data.db')

const client = createClient({ url: `file:${dbPath}` })
const db = drizzle(client, { schema })

const BACKUP_DIR = join(__dirname, '../backups')

async function backupAllTables() {
  console.log('Starting SQLite backup...\n')

  // Create backup directory
  mkdirSync(BACKUP_DIR, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = join(BACKUP_DIR, `backup-${timestamp}`)
  mkdirSync(backupPath, { recursive: true })

  // Tables in order of dependencies (parents first)
  const tables = [
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

  const summary: { table: string; count: number }[] = []

  for (const { name, table } of tables) {
    try {
      const data = await db.select().from(table)
      const filePath = join(backupPath, `${name}.json`)
      writeFileSync(filePath, JSON.stringify(data, null, 2))
      summary.push({ table: name, count: data.length })
      console.log(`✓ ${name}: ${data.length} rows`)
    } catch (error) {
      console.error(`✗ ${name}: ${error}`)
      summary.push({ table: name, count: -1 })
    }
  }

  // Write summary
  const summaryPath = join(backupPath, '_summary.json')
  writeFileSync(summaryPath, JSON.stringify({
    timestamp,
    dbPath,
    tables: summary,
    totalRows: summary.reduce((acc, t) => acc + (t.count > 0 ? t.count : 0), 0)
  }, null, 2))

  console.log(`\n✓ Backup complete: ${backupPath}`)
  console.log(`  Total rows: ${summary.reduce((acc, t) => acc + (t.count > 0 ? t.count : 0), 0)}`)
}

backupAllTables().catch(console.error)
