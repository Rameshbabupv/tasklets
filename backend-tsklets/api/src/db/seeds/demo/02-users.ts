/**
 * Demo Seed: Users
 * Run: npm run db:seed:demo
 *
 * Creates sample users for demo purposes.
 * IMPORTANT: These users are referenced by DevUserSwitcher - do not change emails/passwords.
 */

import bcrypt from 'bcryptjs'
import { db } from '../../index.js'
import { users, userProducts } from '../../schema.js'

// Default password for all demo users (stored as bcrypt hash)
const DEFAULT_PASSWORD = 'Systech@123'

export const usersData = [
  // Systech internal users (DevUserSwitcher compatible)
  { id: 1, name: 'Ramesh', email: 'ramesh@systech.com', role: 'admin', clientId: 5 },
  { id: 2, name: 'Mohan', email: 'mohan@systech.com', role: 'support', clientId: 5 },
  { id: 3, name: 'Sakthi', email: 'sakthi@systech.com', role: 'integrator', clientId: 5 },
  { id: 4, name: 'Jai', email: 'jai@systech.com', role: 'developer', clientId: 5 },
  { id: 5, name: 'Priya', email: 'priya@systech.com', role: 'developer', clientId: 5 },

  // Acme Corp users
  { id: 6, name: 'John Doe', email: 'john@acme.com', role: 'user', clientId: 1 },
  { id: 7, name: 'Jane Smith', email: 'jane@acme.com', role: 'user', clientId: 1 },
  { id: 8, name: 'Kumar', email: 'kumar@acme.com', role: 'user', clientId: 1 },
  { id: 9, name: 'Latha', email: 'latha@acme.com', role: 'company_admin', clientId: 1 },
  { id: 10, name: 'Deepa', email: 'deepa@acme.com', role: 'company_admin', clientId: 1 },

  // TechCorp users
  { id: 11, name: 'Alex', email: 'alex@techcorp.com', role: 'user', clientId: 2 },
  { id: 12, name: 'Sara', email: 'sara@techcorp.com', role: 'user', clientId: 2 },
  { id: 13, name: 'Mike', email: 'mike@techcorp.com', role: 'company_admin', clientId: 2 },
]

export async function seedUsers(tenantId: number) {
  console.log('Seeding demo users...')

  // Hash password once for all users (same password: Systech@123)
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  for (const userData of usersData) {

    await db.insert(users).values({
      tenantId,
      clientId: userData.clientId,
      name: userData.name,
      email: userData.email,
      passwordHash,
      role: userData.role as 'user' | 'gatekeeper' | 'company_admin' | 'approver' | 'integrator' | 'support' | 'ceo' | 'admin' | 'developer',
      isActive: true,
      requirePasswordChange: false,
    }).onConflictDoNothing()
  }

  console.log(`Seeded ${usersData.length} users`)
}
