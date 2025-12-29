/**
 * Demo Seed: Tickets
 * Run: npm run db:seed:demo
 *
 * Creates sample tickets with variety of types, statuses, and priorities.
 */

import { nanoid } from 'nanoid'
import { db } from '../../index.js'
import { tickets, productSequences } from '../../schema.js'
import { eq, and } from 'drizzle-orm'

interface TicketData {
  productId: number
  clientId: number
  type: string
  status: string
  title: string
  description: string
  clientPriority: number
  clientSeverity: number
  internalPriority: number
  internalSeverity: number
  reporterId: number
  assignedTo: number | null
  createdBy: number
  daysAgo: number
  updatedDaysAgo: number
}

export const ticketsData: TicketData[] = [
  // ACME CORP - CRM Sales issues
  {
    productId: 6, clientId: 1, type: 'support', status: 'open',
    title: 'CRM Dashboard Loading Slowly',
    description: 'The main dashboard takes over 10 seconds to load. Users are complaining about productivity loss.',
    clientPriority: 3, clientSeverity: 3, internalPriority: 2, internalSeverity: 2,
    reporterId: 6, assignedTo: 2, createdBy: 6, daysAgo: 5, updatedDaysAgo: 5,
  },
  {
    productId: 6, clientId: 1, type: 'bug', status: 'in_progress',
    title: 'Contact Search Returns Wrong Results',
    description: 'When searching for contacts with special characters in names, wrong results are returned.',
    clientPriority: 2, clientSeverity: 2, internalPriority: 1, internalSeverity: 2,
    reporterId: 7, assignedTo: 4, createdBy: 7, daysAgo: 3, updatedDaysAgo: 1,
  },
  {
    productId: 6, clientId: 1, type: 'feature_request', status: 'review',
    title: 'Add Bulk Import for Contacts',
    description: 'Need ability to import contacts from CSV file with field mapping.',
    clientPriority: 4, clientSeverity: 1, internalPriority: 3, internalSeverity: 1,
    reporterId: 9, assignedTo: 5, createdBy: 9, daysAgo: 10, updatedDaysAgo: 2,
  },

  // ACME CORP - CRM Service issues
  {
    productId: 7, clientId: 1, type: 'support', status: 'resolved',
    title: 'Ticket Assignment Not Working',
    description: 'Auto-assignment rules are not triggering for new support tickets.',
    clientPriority: 2, clientSeverity: 3, internalPriority: 2, internalSeverity: 3,
    reporterId: 6, assignedTo: 2, createdBy: 6, daysAgo: 7, updatedDaysAgo: 1,
  },
  {
    productId: 7, clientId: 1, type: 'bug', status: 'blocked',
    title: 'Email Notifications Delayed',
    description: 'Email notifications are delayed by 2-3 hours. Customers not receiving timely updates.',
    clientPriority: 1, clientSeverity: 1, internalPriority: 1, internalSeverity: 1,
    reporterId: 10, assignedTo: 3, createdBy: 10, daysAgo: 2, updatedDaysAgo: 0,
  },

  // TECHCORP - HRM issues
  {
    productId: 11, clientId: 2, type: 'support', status: 'open',
    title: 'Leave Balance Showing Incorrect',
    description: 'Several employees reporting wrong leave balance after year-end rollover.',
    clientPriority: 2, clientSeverity: 2, internalPriority: 2, internalSeverity: 2,
    reporterId: 11, assignedTo: 2, createdBy: 11, daysAgo: 4, updatedDaysAgo: 4,
  },
  {
    productId: 11, clientId: 2, type: 'bug', status: 'in_progress',
    title: 'Payslip PDF Generation Fails',
    description: 'PDF generation fails for employees with more than 10 deductions.',
    clientPriority: 1, clientSeverity: 1, internalPriority: 1, internalSeverity: 1,
    reporterId: 12, assignedTo: 4, createdBy: 12, daysAgo: 1, updatedDaysAgo: 0,
  },
  {
    productId: 11, clientId: 2, type: 'task', status: 'open',
    title: 'Update Tax Calculation for FY2025',
    description: 'Need to update tax slabs and calculation logic for new financial year.',
    clientPriority: 3, clientSeverity: 2, internalPriority: 2, internalSeverity: 2,
    reporterId: 13, assignedTo: 5, createdBy: 13, daysAgo: 6, updatedDaysAgo: 6,
  },

  // TECHCORP - Finance issues
  {
    productId: 12, clientId: 2, type: 'support', status: 'closed',
    title: 'Invoice Print Layout Issue',
    description: 'Company logo not appearing correctly on printed invoices.',
    clientPriority: 4, clientSeverity: 3, internalPriority: 4, internalSeverity: 3,
    reporterId: 11, assignedTo: 2, createdBy: 11, daysAgo: 14, updatedDaysAgo: 10,
  },
  {
    productId: 12, clientId: 2, type: 'feature_request', status: 'open',
    title: 'Multi-Currency Support',
    description: 'Request to add support for multiple currencies in invoicing module.',
    clientPriority: 3, clientSeverity: 1, internalPriority: 3, internalSeverity: 1,
    reporterId: 13, assignedTo: null, createdBy: 13, daysAgo: 20, updatedDaysAgo: 20,
  },

  // SYSTECH - Internal Tasklets issues
  {
    productId: 14, clientId: 5, type: 'epic', status: 'in_progress',
    title: 'Q1 2025 Performance Optimization',
    description: 'Improve system performance across all modules by 40%.',
    clientPriority: 2, clientSeverity: 2, internalPriority: 1, internalSeverity: 1,
    reporterId: 1, assignedTo: 1, createdBy: 1, daysAgo: 30, updatedDaysAgo: 0,
  },
  {
    productId: 14, clientId: 5, type: 'task', status: 'in_progress',
    title: 'Implement Redis Caching',
    description: 'Add Redis caching layer for frequently accessed data.',
    clientPriority: 2, clientSeverity: 2, internalPriority: 2, internalSeverity: 2,
    reporterId: 1, assignedTo: 4, createdBy: 1, daysAgo: 15, updatedDaysAgo: 2,
  },
  {
    productId: 14, clientId: 5, type: 'task', status: 'review',
    title: 'Database Query Optimization',
    description: 'Optimize slow queries identified in performance audit.',
    clientPriority: 2, clientSeverity: 2, internalPriority: 2, internalSeverity: 2,
    reporterId: 1, assignedTo: 5, createdBy: 1, daysAgo: 12, updatedDaysAgo: 1,
  },
  {
    productId: 14, clientId: 5, type: 'spike', status: 'resolved',
    title: 'Evaluate GraphQL Migration',
    description: 'Research effort to evaluate moving from REST to GraphQL.',
    clientPriority: 4, clientSeverity: 1, internalPriority: 3, internalSeverity: 1,
    reporterId: 3, assignedTo: 4, createdBy: 3, daysAgo: 25, updatedDaysAgo: 18,
  },
  {
    productId: 14, clientId: 5, type: 'note', status: 'closed',
    title: 'Architecture Decision: Event Sourcing',
    description: 'Document decision to implement event sourcing for audit trail.',
    clientPriority: 5, clientSeverity: 1, internalPriority: 5, internalSeverity: 1,
    reporterId: 1, assignedTo: null, createdBy: 1, daysAgo: 45, updatedDaysAgo: 40,
  },
  {
    productId: 14, clientId: 5, type: 'support', status: 'open',
    title: 'Internal Portal Loading Issues',
    description: 'Dashboard widgets taking too long to load during peak hours.',
    clientPriority: 2, clientSeverity: 2, internalPriority: 2, internalSeverity: 2,
    reporterId: 2, assignedTo: 4, createdBy: 2, daysAgo: 3, updatedDaysAgo: 3,
  },

  // Mixed products - More variety
  {
    productId: 9, clientId: 1, type: 'support', status: 'open',
    title: 'Inventory Count Mismatch',
    description: 'Physical count does not match system inventory for warehouse A.',
    clientPriority: 2, clientSeverity: 2, internalPriority: 2, internalSeverity: 2,
    reporterId: 8, assignedTo: 2, createdBy: 8, daysAgo: 3, updatedDaysAgo: 3,
  },
  {
    productId: 10, clientId: 2, type: 'bug', status: 'cancelled',
    title: 'Route Optimization Failing',
    description: 'Issue was due to incorrect GPS coordinates - user error.',
    clientPriority: 2, clientSeverity: 2, internalPriority: 3, internalSeverity: 3,
    reporterId: 12, assignedTo: 4, createdBy: 12, daysAgo: 8, updatedDaysAgo: 5,
  },
  {
    productId: 8, clientId: 5, type: 'feature', status: 'in_progress',
    title: 'Document Version Comparison',
    description: 'Add side-by-side comparison view for document versions.',
    clientPriority: 3, clientSeverity: 2, internalPriority: 2, internalSeverity: 2,
    reporterId: 3, assignedTo: 5, createdBy: 3, daysAgo: 18, updatedDaysAgo: 3,
  },
  {
    productId: 13, clientId: 1, type: 'support', status: 'blocked',
    title: 'Customs Declaration Error',
    description: 'HS Code validation failing for electronics category.',
    clientPriority: 1, clientSeverity: 1, internalPriority: 1, internalSeverity: 1,
    reporterId: 9, assignedTo: 3, createdBy: 9, daysAgo: 1, updatedDaysAgo: 0,
  },
  {
    productId: 6, clientId: 2, type: 'task', status: 'resolved',
    title: 'Update Email Templates',
    description: 'Refresh all email templates with new branding.',
    clientPriority: 4, clientSeverity: 3, internalPriority: 4, internalSeverity: 3,
    reporterId: 13, assignedTo: 4, createdBy: 13, daysAgo: 22, updatedDaysAgo: 15,
  },
]

// Type code mapping for issue keys
const typeCodeMap: Record<string, string> = {
  support: 'S',
  bug: 'B',
  task: 'T',
  feature: 'F',
  feature_request: 'R',
  epic: 'E',
  spike: 'SP',
  note: 'N',
}

async function getNextSequence(productId: number, type: string): Promise<number> {
  const typeCode = typeCodeMap[type] || 'S'

  // Get current sequence
  const [seq] = await db.select()
    .from(productSequences)
    .where(and(eq(productSequences.productId, productId), eq(productSequences.type, typeCode)))

  const nextNum = (seq?.lastNumber || 0) + 1

  // Update sequence
  if (seq) {
    await db.update(productSequences)
      .set({ lastNumber: nextNum })
      .where(and(eq(productSequences.productId, productId), eq(productSequences.type, typeCode)))
  } else {
    await db.insert(productSequences).values({
      productId,
      type: typeCode,
      lastNumber: nextNum,
    })
  }

  return nextNum
}

export async function seedTickets(tenantId: number, productCodes: Map<number, string>) {
  console.log('Seeding demo tickets...')

  for (const ticketData of ticketsData) {
    const id = nanoid(12)
    const productCode = productCodes.get(ticketData.productId) || 'UNK'
    const typeCode = typeCodeMap[ticketData.type] || 'S'
    const seqNum = await getNextSequence(ticketData.productId, ticketData.type)
    const issueKey = `${productCode}-${typeCode}-${String(seqNum).padStart(3, '0')}`

    const now = new Date()
    const createdAt = new Date(now.getTime() - ticketData.daysAgo * 24 * 60 * 60 * 1000)
    const updatedAt = new Date(now.getTime() - ticketData.updatedDaysAgo * 24 * 60 * 60 * 1000)

    await db.insert(tickets).values({
      id,
      tenantId,
      productId: ticketData.productId,
      clientId: ticketData.clientId,
      issueKey,
      type: ticketData.type,
      status: ticketData.status,
      title: ticketData.title,
      description: ticketData.description,
      clientPriority: ticketData.clientPriority,
      clientSeverity: ticketData.clientSeverity,
      internalPriority: ticketData.internalPriority,
      internalSeverity: ticketData.internalSeverity,
      reporterId: ticketData.reporterId,
      assignedTo: ticketData.assignedTo,
      createdBy: ticketData.createdBy,
      createdAt,
      updatedAt,
    }).onConflictDoNothing()
  }

  console.log(`Seeded ${ticketsData.length} tickets`)
}
