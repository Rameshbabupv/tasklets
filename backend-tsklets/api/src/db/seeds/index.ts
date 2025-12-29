/**
 * Database Seed Runner
 *
 * Usage:
 *   npm run db:seed       - Seed essential lookups only (for production)
 *   npm run db:seed:demo  - Seed with demo data (for development/demo)
 *   npm run db:reset      - Drop all data and re-seed with demo data
 */

import { db } from '../index.js'
import { products } from '../schema.js'
import { seedTenant } from './02-tenant.js'
import { seedLookups, productsData } from './01-lookups.js'
import { seedClients } from './demo/01-clients.js'
import { seedUsers } from './demo/02-users.js'
import { seedTickets } from './demo/03-tickets.js'

export async function seedEssentials() {
  console.log('\n=== Seeding Essential Data ===\n')

  // 1. Create tenant
  const tenantId = await seedTenant()

  // 2. Seed products
  await seedLookups(tenantId)

  console.log('\n=== Essential Seed Complete ===\n')
  return tenantId
}

export async function seedDemo() {
  console.log('\n=== Seeding Demo Data ===\n')

  // 1. Seed essentials first
  const tenantId = await seedEssentials()

  // 2. Seed demo clients
  await seedClients(tenantId)

  // 3. Seed demo users
  await seedUsers(tenantId)

  // 4. Build product code map for ticket issue keys
  const productCodes = new Map<number, string>()
  for (const p of productsData) {
    productCodes.set(p.id, p.code)
  }

  // 5. Seed demo tickets
  await seedTickets(tenantId, productCodes)

  console.log('\n=== Demo Seed Complete ===\n')
  console.log('Demo Users:')
  console.log('  Internal Portal (systech.com):')
  console.log('    - ramesh@systech.com (admin) - password: systech@123')
  console.log('    - mohan@systech.com (support) - password: systech@123')
  console.log('    - sakthi@systech.com (integrator) - password: systech@123')
  console.log('    - jai@systech.com (developer) - password: systech@123')
  console.log('    - priya@systech.com (developer) - password: systech@123')
  console.log('')
  console.log('  Client Portal (acme.com, techcorp.com):')
  console.log('    - Default password: Systech@123')
  console.log('')
}

// CLI runner
const args = process.argv.slice(2)
const command = args[0] || 'demo'

async function main() {
  try {
    if (command === 'essentials' || command === 'prod') {
      await seedEssentials()
    } else if (command === 'demo' || command === 'dev') {
      await seedDemo()
    } else {
      console.log('Usage: npx tsx src/db/seeds/index.ts [essentials|demo]')
      console.log('  essentials - Seed only essential lookups (for production)')
      console.log('  demo       - Seed with demo data (default)')
      process.exit(1)
    }

    process.exit(0)
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

main()
