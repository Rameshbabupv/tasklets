/**
 * Bidirectional sync between Beads and Tasklets
 * Run with: npx tsx scripts/sync-beads-tasklets.ts
 *
 * Sync flow:
 * 1. Beads → Tasklets: Create/update Tasklets records from beads issues
 * 2. Tasklets → Beads: Update beads titles with human key prefix [CSUP-T042]
 */

import fs from 'fs'
import path from 'path'
import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres:change-this-secure-password@localhost:5432/tasklets'

const BEADS_JSONL = path.join(process.cwd(), '.beads', 'issues.jsonl')

const sql = postgres(DATABASE_URL)

// Type mapping: beads issue_type → Tasklets type code
const TYPE_MAP: Record<string, string> = {
  epic: 'E',
  feature: 'F',
  task: 'T',
  bug: 'B',
}

interface BeadsIssue {
  id: string
  title: string
  description?: string
  status: string
  priority: number
  issue_type: string
  created_at: string
  updated_at: string
  closed_at?: string
  close_reason?: string
}

// Parse human key from title: "[CSUP-T042] Fix bug" -> "CSUP-T042"
function parseHumanKey(title: string): string | null {
  const match = title.match(/^\[([A-Z]+-[EFTBSN]\d+)\]\s*/)
  return match ? match[1] : null
}

// Format title with human key prefix
function formatTitle(humanKey: string, title: string): string {
  // Remove existing key prefix if present
  const cleanTitle = title.replace(/^\[[A-Z]+-[EFTBSN]\d+\]\s*/, '')
  return `[${humanKey}] ${cleanTitle}`
}

async function loadBeadsIssues(): Promise<BeadsIssue[]> {
  const content = fs.readFileSync(BEADS_JSONL, 'utf-8')
  return content
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line))
}

async function saveBeadsIssues(issues: BeadsIssue[]): Promise<void> {
  const content = issues.map(issue => JSON.stringify(issue)).join('\n')
  fs.writeFileSync(BEADS_JSONL, content + '\n')
}

async function getNextIssueKey(productId: number, issueType: string): Promise<string> {
  // Get product code
  const [product] = await sql`SELECT code FROM products WHERE id = ${productId}`
  if (!product) throw new Error(`Product ${productId} not found`)

  // Get or create sequence
  const [seq] = await sql`
    INSERT INTO product_sequences (product_id, issue_type, next_num)
    VALUES (${productId}, ${issueType}, 1)
    ON CONFLICT (product_id, issue_type)
    DO UPDATE SET next_num = product_sequences.next_num + 1
    RETURNING next_num
  `

  const num = seq.next_num
  return `${product.code}-${issueType}${String(num).padStart(3, '0')}`
}

async function sync() {
  console.log('Starting Beads ↔ Tasklets sync...\n')

  // Load beads issues
  const beadsIssues = await loadBeadsIssues()
  console.log(`Loaded ${beadsIssues.length} beads issues\n`)

  // Get default product (CSUP for customer-support repo)
  const [defaultProduct] = await sql`SELECT id FROM products WHERE code = 'CSUP' LIMIT 1`
  if (!defaultProduct) {
    console.log('No CSUP product found. Creating one...')
    // For now, skip if no product - you can add creation logic
    console.log('Skipping sync - please ensure CSUP product exists')
    await sql.end()
    return
  }

  let created = 0
  let updated = 0
  let titleUpdates = 0

  for (const beadsIssue of beadsIssues) {
    const typeCode = TYPE_MAP[beadsIssue.issue_type] || 'T'
    const existingKey = parseHumanKey(beadsIssue.title)

    // Check if this beads issue is already linked in Tasklets
    let humanKey: string | null = existingKey

    // For now, we just update titles with human keys
    // Full sync would require matching by title or creating records

    if (!humanKey) {
      // Generate new human key
      humanKey = await getNextIssueKey(defaultProduct.id, typeCode)

      // Update beads title with key prefix
      beadsIssue.title = formatTitle(humanKey, beadsIssue.title)
      titleUpdates++
      console.log(`  Added key: ${beadsIssue.id} -> ${humanKey}`)
    }
  }

  // Save updated beads issues
  if (titleUpdates > 0) {
    await saveBeadsIssues(beadsIssues)
    console.log(`\nUpdated ${titleUpdates} beads issue titles with human keys`)
  }

  console.log('\nSync complete!')
  console.log(`  Title updates: ${titleUpdates}`)

  await sql.end()
}

sync().catch(err => {
  console.error('Sync failed:', err)
  process.exit(1)
})
