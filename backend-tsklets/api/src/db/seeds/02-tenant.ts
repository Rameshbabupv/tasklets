/**
 * Seed: Tenant
 * Run: npm run db:seed
 *
 * Creates the default tenant for the system.
 */

import { db } from '../index.js'
import { tenants } from '../schema.js'

export const tenantData = {
  id: 1,
  name: 'Systech-erp.ai',
  slug: 'systech',
}

export async function seedTenant() {
  console.log('Seeding tenant...')

  const [tenant] = await db.insert(tenants).values({
    id: tenantData.id,
    name: tenantData.name,
    slug: tenantData.slug,
  }).onConflictDoNothing().returning()

  if (tenant) {
    console.log(`Created tenant: ${tenant.name}`)
  } else {
    console.log('Tenant already exists')
  }

  return tenantData.id
}
