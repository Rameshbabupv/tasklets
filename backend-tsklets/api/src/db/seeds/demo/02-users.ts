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

// Default passwords for demo users
const SYSTECH_PASSWORD = 'systech@123' // For internal Systech users
const DEFAULT_PASSWORD = 'Systech@123' // For client users

export const usersData = [
  // Systech internal users (DevUserSwitcher compatible)
  { id: 1, name: 'Ramesh', email: 'ramesh@systech.com', role: 'admin', clientId: 5, password: SYSTECH_PASSWORD },
  { id: 2, name: 'Mohan', email: 'mohan@systech.com', role: 'support', clientId: 5, password: SYSTECH_PASSWORD },
  { id: 3, name: 'Sakthi', email: 'sakthi@systech.com', role: 'integrator', clientId: 5, password: SYSTECH_PASSWORD },
  { id: 4, name: 'Jai', email: 'jai@systech.com', role: 'developer', clientId: 5, password: SYSTECH_PASSWORD },
  { id: 5, name: 'Priya', email: 'priya@systech.com', role: 'developer', clientId: 5, password: SYSTECH_PASSWORD },

  // Acme Corp users
  { id: 6, name: 'John Doe', email: 'john@acme.com', role: 'user', clientId: 1, password: DEFAULT_PASSWORD },
  { id: 7, name: 'Jane Smith', email: 'jane@acme.com', role: 'user', clientId: 1, password: DEFAULT_PASSWORD },
  { id: 8, name: 'Kumar', email: 'kumar@acme.com', role: 'user', clientId: 1, password: DEFAULT_PASSWORD },
  { id: 9, name: 'Latha', email: 'latha@acme.com', role: 'company_admin', clientId: 1, password: DEFAULT_PASSWORD },
  { id: 10, name: 'Deepa', email: 'deepa@acme.com', role: 'company_admin', clientId: 1, password: DEFAULT_PASSWORD },

  // TechCorp users
  { id: 11, name: 'Alex', email: 'alex@techcorp.com', role: 'user', clientId: 2, password: DEFAULT_PASSWORD },
  { id: 12, name: 'Sara', email: 'sara@techcorp.com', role: 'user', clientId: 2, password: DEFAULT_PASSWORD },
  { id: 13, name: 'Mike', email: 'mike@techcorp.com', role: 'company_admin', clientId: 2, password: DEFAULT_PASSWORD },
]

export async function seedUsers(tenantId: number) {
  console.log('Seeding demo users...')

  for (const userData of usersData) {
    const passwordHash = await bcrypt.hash(userData.password, 10)

    await db.insert(users).values({
      id: userData.id,
      tenantId,
      clientId: userData.clientId,
      name: userData.name,
      email: userData.email,
      passwordHash,
      role: userData.role,
      isActive: true,
      requirePasswordChange: false,
    }).onConflictDoNothing()
  }

  console.log(`Seeded ${usersData.length} users`)
}
