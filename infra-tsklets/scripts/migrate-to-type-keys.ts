/**
 * Migration script to convert existing keys (TSKLTS-001) to type-specific keys (TSKLTS-E001)
 * Run with: npx tsx scripts/migrate-to-type-keys.ts
 */

import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres:change-this-secure-password@localhost:5432/tasklets'

const sql = postgres(DATABASE_URL)

interface SequenceCounter {
  [productId: number]: {
    [type: string]: number
  }
}

async function migrate() {
  console.log('Starting migration to type-specific keys...\n')

  // Track sequences per product per type
  const sequences: SequenceCounter = {}

  const getNextNum = (productId: number, type: string): number => {
    if (!sequences[productId]) sequences[productId] = {}
    if (!sequences[productId][type]) sequences[productId][type] = 1
    return sequences[productId][type]++
  }

  // Get product codes
  const products = await sql`SELECT id, code FROM products`
  const productMap = new Map(products.map(p => [p.id, p.code]))

  // 1. Migrate epics (type = E)
  console.log('Step 1: Migrating epics to E-type keys...')
  const epics = await sql`
    SELECT id, product_id, issue_key FROM epics ORDER BY created_at
  `
  for (const epic of epics) {
    const code = productMap.get(epic.product_id)
    if (!code) continue
    const num = getNextNum(epic.product_id, 'E')
    const newKey = `${code}-E${String(num).padStart(3, '0')}`
    await sql`UPDATE epics SET issue_key = ${newKey} WHERE id = ${epic.id}`
    console.log(`  Epic ${epic.id}: ${epic.issue_key} -> ${newKey}`)
  }
  console.log(`  Migrated ${epics.length} epics\n`)

  // 2. Migrate features (type = F)
  console.log('Step 2: Migrating features to F-type keys...')
  const features = await sql`
    SELECT f.id, e.product_id, f.issue_key
    FROM features f
    JOIN epics e ON f.epic_id = e.id
    ORDER BY f.created_at
  `
  for (const feature of features) {
    const code = productMap.get(feature.product_id)
    if (!code) continue
    const num = getNextNum(feature.product_id, 'F')
    const newKey = `${code}-F${String(num).padStart(3, '0')}`
    await sql`UPDATE features SET issue_key = ${newKey} WHERE id = ${feature.id}`
    console.log(`  Feature ${feature.id}: ${feature.issue_key} -> ${newKey}`)
  }
  console.log(`  Migrated ${features.length} features\n`)

  // 3. Migrate tasks (type = T or B based on type field)
  console.log('Step 3: Migrating tasks to T/B-type keys...')
  const tasks = await sql`
    SELECT t.id, e.product_id, t.issue_key, t.type
    FROM dev_tasks t
    JOIN features f ON t.feature_id = f.id
    JOIN epics e ON f.epic_id = e.id
    ORDER BY t.created_at
  `
  for (const task of tasks) {
    const code = productMap.get(task.product_id)
    if (!code) continue
    const typeCode = task.type === 'bug' ? 'B' : 'T'
    const num = getNextNum(task.product_id, typeCode)
    const newKey = `${code}-${typeCode}${String(num).padStart(3, '0')}`
    await sql`UPDATE dev_tasks SET issue_key = ${newKey} WHERE id = ${task.id}`
    console.log(`  Task ${task.id} (${task.type}): ${task.issue_key} -> ${newKey}`)
  }
  console.log(`  Migrated ${tasks.length} tasks\n`)

  // 4. Initialize product_sequences table
  console.log('Step 4: Initializing product_sequences table...')
  for (const [productId, types] of Object.entries(sequences)) {
    for (const [type, nextNum] of Object.entries(types)) {
      // nextNum is already incremented, so it's the next number to use
      await sql`
        INSERT INTO product_sequences (product_id, issue_type, next_num)
        VALUES (${parseInt(productId)}, ${type}, ${nextNum})
        ON CONFLICT (product_id, issue_type)
        DO UPDATE SET next_num = ${nextNum}
      `
      console.log(`  Product ${productId}, Type ${type}: next_num = ${nextNum}`)
    }
  }

  console.log('\nMigration complete!')
  await sql.end()
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
