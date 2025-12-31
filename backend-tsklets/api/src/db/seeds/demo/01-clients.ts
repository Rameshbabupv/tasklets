/**
 * Demo Seed: Clients
 * Run: npm run db:seed:demo
 *
 * Creates sample client companies for demo purposes.
 */

import { db } from '../../index.js'
import { clients, clientProducts } from '../../schema.js'

export const clientsData = [
  {
    id: 1,
    name: 'Acme Corp',
    domain: 'acme.com',
    type: 'customer' as const,
    tier: 'enterprise' as const,
    gatekeeperEnabled: true,
    isActive: true,
    products: [6, 7, 11, 12, 13], // CRM Sales, CRM Service, HRM v2, Finance v2, EXIM
  },
  {
    id: 2,
    name: 'TechCorp',
    domain: 'techcorp.com',
    type: 'customer' as const,
    tier: 'business' as const,
    gatekeeperEnabled: false,
    isActive: true,
    products: [9, 10, 11], // MMS v2, TMS, HRM v2
  },
  {
    id: 5,
    name: 'Systech',
    domain: 'systech.com',
    type: 'owner' as const,
    tier: 'enterprise' as const,
    gatekeeperEnabled: false,
    isActive: true,
    products: [14, 6, 7, 8, 9, 10, 11, 12, 13], // All products including Tasklets
  },
]

export async function seedClients(tenantId: number) {
  console.log('Seeding demo clients...')

  for (const client of clientsData) {
    const { products: productIds, ...clientData } = client

    await db.insert(clients).values({
      ...clientData,
      tenantId,
    }).onConflictDoNothing()

    // Assign products to client
    for (const productId of productIds) {
      await db.insert(clientProducts).values({
        tenantId,
        clientId: client.id,
        productId,
      }).onConflictDoNothing()
    }
  }

  console.log(`Seeded ${clientsData.length} clients`)
}
