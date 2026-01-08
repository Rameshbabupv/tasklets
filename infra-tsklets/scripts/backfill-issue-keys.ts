/**
 * Backfill script to set product codes and generate issue keys for existing records
 * Run with: npx tsx scripts/backfill-issue-keys.ts
 */

import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres:change-this-secure-password@localhost:5432/tasklets'

const sql = postgres(DATABASE_URL)

// Smart abbreviation generator: take uppercase consonants, limit to 4-6 chars
function generateCode(name: string): string {
  const cleaned = name.toUpperCase().replace(/[^A-Z]/g, '')
  // Take first letter + consonants, max 6 chars
  const consonants = cleaned.replace(/[AEIOU]/g, '')
  if (consonants.length >= 4) {
    return consonants.slice(0, 6)
  }
  // If not enough consonants, use first 4-6 letters
  return cleaned.slice(0, 6)
}

async function backfill() {
  console.log('Starting backfill...\n')

  // 1. Set product codes for products without code
  console.log('Step 1: Setting product codes...')
  const products = await sql`SELECT id, name, code FROM products WHERE code IS NULL`

  for (const product of products) {
    const code = generateCode(product.name)
    await sql`UPDATE products SET code = ${code} WHERE id = ${product.id}`
    console.log(`  Product ${product.id}: "${product.name}" -> ${code}`)
  }
  console.log(`  Updated ${products.length} products\n`)

  // 2. Get all products with their current nextIssueNum
  const allProducts = await sql`SELECT id, code, next_issue_num FROM products`
  const productMap = new Map(allProducts.map(p => [p.id, { code: p.code, nextNum: p.next_issue_num || 1 }]))

  // 3. Backfill epics
  console.log('Step 2: Backfilling epic issue keys...')
  const epicsToUpdate = await sql`
    SELECT e.id, e.product_id FROM epics e WHERE e.issue_key IS NULL ORDER BY e.created_at
  `
  for (const epic of epicsToUpdate) {
    const product = productMap.get(epic.product_id)
    if (!product) continue
    const issueKey = `${product.code}-${String(product.nextNum).padStart(3, '0')}`
    await sql`UPDATE epics SET issue_key = ${issueKey} WHERE id = ${epic.id}`
    product.nextNum++
    console.log(`  Epic ${epic.id} -> ${issueKey}`)
  }
  console.log(`  Updated ${epicsToUpdate.length} epics\n`)

  // 4. Backfill features
  console.log('Step 3: Backfilling feature issue keys...')
  const featuresToUpdate = await sql`
    SELECT f.id, e.product_id
    FROM features f
    JOIN epics e ON f.epic_id = e.id
    WHERE f.issue_key IS NULL
    ORDER BY f.created_at
  `
  for (const feature of featuresToUpdate) {
    const product = productMap.get(feature.product_id)
    if (!product) continue
    const issueKey = `${product.code}-${String(product.nextNum).padStart(3, '0')}`
    await sql`UPDATE features SET issue_key = ${issueKey} WHERE id = ${feature.id}`
    product.nextNum++
    console.log(`  Feature ${feature.id} -> ${issueKey}`)
  }
  console.log(`  Updated ${featuresToUpdate.length} features\n`)

  // 5. Backfill dev_tasks
  console.log('Step 4: Backfilling task issue keys...')
  const tasksToUpdate = await sql`
    SELECT t.id, e.product_id
    FROM dev_tasks t
    JOIN features f ON t.feature_id = f.id
    JOIN epics e ON f.epic_id = e.id
    WHERE t.issue_key IS NULL
    ORDER BY t.created_at
  `
  for (const task of tasksToUpdate) {
    const product = productMap.get(task.product_id)
    if (!product) continue
    const issueKey = `${product.code}-${String(product.nextNum).padStart(3, '0')}`
    await sql`UPDATE dev_tasks SET issue_key = ${issueKey} WHERE id = ${task.id}`
    product.nextNum++
    console.log(`  Task ${task.id} -> ${issueKey}`)
  }
  console.log(`  Updated ${tasksToUpdate.length} tasks\n`)

  // 6. Update nextIssueNum for all products
  console.log('Step 5: Updating product nextIssueNum...')
  for (const [productId, data] of productMap) {
    await sql`UPDATE products SET next_issue_num = ${data.nextNum} WHERE id = ${productId}`
    console.log(`  Product ${productId}: nextIssueNum = ${data.nextNum}`)
  }

  console.log('\nBackfill complete!')
  await sql.end()
}

backfill().catch(err => {
  console.error('Backfill failed:', err)
  process.exit(1)
})
