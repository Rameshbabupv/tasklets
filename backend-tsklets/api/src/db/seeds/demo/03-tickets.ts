/**
 * Demo Seed: Tickets, Comments, and Links
 * Run: npm run db:seed:demo
 *
 * NOTE: For standard ticket labels used by the internal triage system,
 * see the documentation in src/db/seeds/01-lookups.ts
 */

import { db } from '../../index.js'
import { tickets, ticketComments, ticketLinks } from '../../schema.js'

export const ticketsData = [
  // ACME CORP - CRM Sales
  { id: 'demo_acme_001', issueKey: 'CRMS-S-001', productId: 6, clientId: 1, type: 'support', status: 'open',
    title: 'CRM Dashboard Loading Slowly',
    description: 'The main dashboard takes over 10 seconds to load. Users are complaining about productivity loss.',
    clientPriority: 3, clientSeverity: 3, internalPriority: 2, internalSeverity: 2,
    reporterId: 6, assignedTo: 2, createdBy: 6,
    labels: ['escalated'] },
  { id: 'demo_acme_002', issueKey: 'CRMS-B-001', productId: 6, clientId: 1, type: 'bug', status: 'in_progress',
    title: 'Contact Search Returns Wrong Results',
    description: 'When searching for contacts with special characters in names, wrong results are returned.',
    clientPriority: 2, clientSeverity: 2, internalPriority: 1, internalSeverity: 2,
    reporterId: 7, assignedTo: 4, createdBy: 7 },
  { id: 'demo_acme_003', issueKey: 'CRMS-R-001', productId: 6, clientId: 1, type: 'feature_request', status: 'review',
    title: 'Add Bulk Import for Contacts',
    description: 'Need ability to import contacts from CSV file with field mapping.',
    clientPriority: 4, clientSeverity: 1, internalPriority: 3, internalSeverity: 1,
    reporterId: 9, assignedTo: 5, createdBy: 9 },

  // ACME CORP - CRM Service
  { id: 'demo_acme_004', issueKey: 'CRMSV-S-001', productId: 7, clientId: 1, type: 'support', status: 'resolved',
    title: 'Ticket Assignment Not Working',
    description: 'Auto-assignment rules are not triggering for new support tickets.',
    clientPriority: 2, clientSeverity: 3, internalPriority: 2, internalSeverity: 3,
    reporterId: 6, assignedTo: 2, createdBy: 6,
    labels: ['resolved_internally'] },
  { id: 'demo_acme_005', issueKey: 'CRMSV-B-001', productId: 7, clientId: 1, type: 'bug', status: 'blocked',
    title: 'Email Notifications Delayed',
    description: 'Email notifications are delayed by 2-3 hours. Customers not receiving timely updates.',
    clientPriority: 1, clientSeverity: 1, internalPriority: 1, internalSeverity: 1,
    reporterId: 10, assignedTo: 3, createdBy: 10,
    labels: ['escalated', 'internal_assignment'] },

  // TECHCORP - HRM
  { id: 'demo_tech_001', issueKey: 'HRM-S-003', productId: 11, clientId: 2, type: 'support', status: 'open',
    title: 'Leave Balance Showing Incorrect',
    description: 'Several employees reporting wrong leave balance after year-end rollover.',
    clientPriority: 2, clientSeverity: 2, internalPriority: 2, internalSeverity: 2,
    reporterId: 11, assignedTo: 2, createdBy: 11 },
  { id: 'demo_tech_002', issueKey: 'HRM-B-001', productId: 11, clientId: 2, type: 'bug', status: 'in_progress',
    title: 'Payslip PDF Generation Fails',
    description: 'PDF generation fails for employees with more than 10 deductions.',
    clientPriority: 1, clientSeverity: 1, internalPriority: 1, internalSeverity: 1,
    reporterId: 12, assignedTo: 4, createdBy: 12 },
  { id: 'demo_tech_003', issueKey: 'HRM-T-001', productId: 11, clientId: 2, type: 'task', status: 'open',
    title: 'Update Tax Calculation for FY2025',
    description: 'Need to update tax slabs and calculation logic for new financial year.',
    clientPriority: 3, clientSeverity: 2, internalPriority: 2, internalSeverity: 2,
    reporterId: 13, assignedTo: 5, createdBy: 13 },

  // TECHCORP - Finance
  { id: 'demo_tech_004', issueKey: 'FIN-S-001', productId: 12, clientId: 2, type: 'support', status: 'closed',
    title: 'Invoice Print Layout Issue',
    description: 'Company logo not appearing correctly on printed invoices.',
    clientPriority: 4, clientSeverity: 3, internalPriority: 4, internalSeverity: 3,
    reporterId: 11, assignedTo: 2, createdBy: 11,
    labels: ['auto_closed_no_response'] },
  { id: 'demo_tech_005', issueKey: 'FIN-R-001', productId: 12, clientId: 2, type: 'feature_request', status: 'open',
    title: 'Multi-Currency Support',
    description: 'Request to add support for multiple currencies in invoicing module.',
    clientPriority: 3, clientSeverity: 1, internalPriority: 3, internalSeverity: 1,
    reporterId: 13, assignedTo: null, createdBy: 13 },

  // SYSTECH Internal - Tasklets
  { id: 'demo_sys_001', issueKey: 'TSKLTS-E-001', productId: 14, clientId: 5, type: 'epic', status: 'in_progress',
    title: 'Q1 2025 Performance Optimization',
    description: 'Improve system performance across all modules by 40%.',
    clientPriority: 2, clientSeverity: 2, internalPriority: 1, internalSeverity: 1,
    reporterId: 1, assignedTo: 1, createdBy: 1,
    labels: ['created_by_systech'] },
  { id: 'demo_sys_002', issueKey: 'TSKLTS-T-001', productId: 14, clientId: 5, type: 'task', status: 'in_progress',
    title: 'Implement Redis Caching',
    description: 'Add Redis caching layer for frequently accessed data.',
    clientPriority: 2, clientSeverity: 2, internalPriority: 2, internalSeverity: 2,
    reporterId: 1, assignedTo: 4, createdBy: 1 },
  { id: 'demo_sys_003', issueKey: 'TSKLTS-T-002', productId: 14, clientId: 5, type: 'task', status: 'review',
    title: 'Database Query Optimization',
    description: 'Optimize slow queries identified in performance audit.',
    clientPriority: 2, clientSeverity: 2, internalPriority: 2, internalSeverity: 2,
    reporterId: 1, assignedTo: 5, createdBy: 1 },
  { id: 'demo_sys_004', issueKey: 'TSKLTS-SP-001', productId: 14, clientId: 5, type: 'spike', status: 'resolved',
    title: 'Evaluate GraphQL Migration',
    description: 'Research effort to evaluate moving from REST to GraphQL.',
    clientPriority: 4, clientSeverity: 1, internalPriority: 3, internalSeverity: 1,
    reporterId: 3, assignedTo: 4, createdBy: 3 },
  { id: 'demo_sys_005', issueKey: 'TSKLTS-N-001', productId: 14, clientId: 5, type: 'note', status: 'closed',
    title: 'Architecture Decision: Event Sourcing',
    description: 'Document decision to implement event sourcing for audit trail.',
    clientPriority: 5, clientSeverity: 1, internalPriority: 5, internalSeverity: 1,
    reporterId: 1, assignedTo: null, createdBy: 1 },

  // Mixed products
  { id: 'demo_mix_001', issueKey: 'MMS-S-001', productId: 9, clientId: 1, type: 'support', status: 'open',
    title: 'Inventory Count Mismatch',
    description: 'Physical count does not match system inventory for warehouse A.',
    clientPriority: 2, clientSeverity: 2, internalPriority: 2, internalSeverity: 2,
    reporterId: 8, assignedTo: 2, createdBy: 8 },
  { id: 'demo_mix_002', issueKey: 'TMS-B-001', productId: 10, clientId: 2, type: 'bug', status: 'cancelled',
    title: 'Route Optimization Failing',
    description: 'Issue was due to incorrect GPS coordinates - user error.',
    clientPriority: 2, clientSeverity: 2, internalPriority: 3, internalSeverity: 3,
    reporterId: 12, assignedTo: 4, createdBy: 12,
    labels: ['reassigned_to_internal'] },
  { id: 'demo_mix_003', issueKey: 'SDMS-F-001', productId: 8, clientId: 5, type: 'feature', status: 'in_progress',
    title: 'Document Version Comparison',
    description: 'Add side-by-side comparison view for document versions.',
    clientPriority: 3, clientSeverity: 2, internalPriority: 2, internalSeverity: 2,
    reporterId: 3, assignedTo: 5, createdBy: 3 },
  { id: 'demo_mix_004', issueKey: 'EXIM-S-001', productId: 13, clientId: 1, type: 'support', status: 'blocked',
    title: 'Customs Declaration Error',
    description: 'HS Code validation failing for electronics category.',
    clientPriority: 1, clientSeverity: 1, internalPriority: 1, internalSeverity: 1,
    reporterId: 9, assignedTo: 3, createdBy: 9 },
  { id: 'demo_mix_005', issueKey: 'CRMS-T-001', productId: 6, clientId: 2, type: 'task', status: 'resolved',
    title: 'Update Email Templates',
    description: 'Refresh all email templates with new branding.',
    clientPriority: 4, clientSeverity: 3, internalPriority: 4, internalSeverity: 3,
    reporterId: 13, assignedTo: 4, createdBy: 13 },
]

export const commentsData = [
  // CRM Dashboard issue discussion
  { ticketId: 'demo_acme_001', userId: 6, content: 'This has been affecting our sales team for the past week. Please prioritize.', isInternal: false },
  { ticketId: 'demo_acme_001', userId: 2, content: 'Looking into this. Can you confirm how many users are affected?', isInternal: false },
  { ticketId: 'demo_acme_001', userId: 6, content: 'About 15 users in our sales department are affected.', isInternal: false },
  { ticketId: 'demo_acme_001', userId: 2, content: 'Internal note: Checked logs, seems to be N+1 query issue.', isInternal: true },

  // Contact search bug
  { ticketId: 'demo_acme_002', userId: 7, content: "Reproduced the issue with contact name \"O'Brien & Associates\"", isInternal: false },
  { ticketId: 'demo_acme_002', userId: 4, content: 'Found the root cause - SQL escaping issue. Working on fix.', isInternal: false },

  // Leave balance issue
  { ticketId: 'demo_tech_001', userId: 11, content: 'Multiple employees have reported this. Urgent fix needed before payroll.', isInternal: false },
  { ticketId: 'demo_tech_001', userId: 2, content: 'Investigating the year-end rollover logic.', isInternal: false },

  // Payslip PDF issue
  { ticketId: 'demo_tech_002', userId: 12, content: 'Example employee ID: EMP-2024-0156', isInternal: false },
  { ticketId: 'demo_tech_002', userId: 4, content: 'Internal: This is a memory issue when processing large deduction arrays.', isInternal: true },

  // Performance epic
  { ticketId: 'demo_sys_001', userId: 1, content: 'Kicking off the performance optimization initiative for Q1.', isInternal: false },
  { ticketId: 'demo_sys_001', userId: 3, content: 'Initial benchmarks completed. Database queries are the main bottleneck.', isInternal: false },
  { ticketId: 'demo_sys_001', userId: 4, content: 'Redis caching implementation started. See TSKLTS-T-001.', isInternal: false },

  // Redis caching task
  { ticketId: 'demo_sys_002', userId: 4, content: 'Redis cluster set up in staging environment.', isInternal: false },
  { ticketId: 'demo_sys_002', userId: 5, content: 'Code review completed. Minor changes suggested.', isInternal: false },

  // Customs issue
  { ticketId: 'demo_mix_004', userId: 9, content: 'This is blocking our shipment to Germany. Need resolution ASAP!', isInternal: false },
  { ticketId: 'demo_mix_004', userId: 3, content: 'Internal: Need to update HS code mapping table from latest customs database.', isInternal: true },
]

export const ticketLinksData = [
  // Epic to tasks
  { sourceTicketId: 'demo_sys_001', targetTicketId: 'demo_sys_002', linkType: 'parent_of' },
  { sourceTicketId: 'demo_sys_001', targetTicketId: 'demo_sys_003', linkType: 'parent_of' },

  // Blocking relationships
  { sourceTicketId: 'demo_acme_005', targetTicketId: 'demo_acme_004', linkType: 'blocks' },
  { sourceTicketId: 'demo_mix_004', targetTicketId: 'demo_mix_001', linkType: 'blocks' },

  // Related tickets
  { sourceTicketId: 'demo_acme_001', targetTicketId: 'demo_acme_002', linkType: 'relates_to' },
  { sourceTicketId: 'demo_tech_001', targetTicketId: 'demo_tech_002', linkType: 'relates_to' },
  { sourceTicketId: 'demo_sys_002', targetTicketId: 'demo_sys_003', linkType: 'relates_to' },
]

export async function seedTickets(tenantId: number) {
  console.log('Seeding demo tickets...')

  const now = new Date()

  for (const t of ticketsData) {
    const createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    const updatedAt = new Date(createdAt.getTime() + Math.random() * (now.getTime() - createdAt.getTime()))

    await db.insert(tickets).values({
      id: t.id,
      tenantId,
      productId: t.productId,
      clientId: t.clientId,
      issueKey: t.issueKey,
      type: t.type,
      status: t.status,
      title: t.title,
      description: t.description,
      clientPriority: t.clientPriority,
      clientSeverity: t.clientSeverity,
      internalPriority: t.internalPriority,
      internalSeverity: t.internalSeverity,
      reporterId: t.reporterId,
      assignedTo: t.assignedTo,
      createdBy: t.createdBy,
      labels: (t as any).labels,
      createdAt,
      updatedAt,
    }).onConflictDoNothing()
  }

  console.log(`Seeded ${ticketsData.length} tickets`)

  // Seed comments
  console.log('Seeding demo comments...')
  for (const c of commentsData) {
    await db.insert(ticketComments).values({
      tenantId,
      ticketId: c.ticketId,
      userId: c.userId,
      content: c.content,
      isInternal: c.isInternal,
    }).onConflictDoNothing()
  }
  console.log(`Seeded ${commentsData.length} comments`)

  // Seed ticket links
  console.log('Seeding demo ticket links...')
  for (const l of ticketLinksData) {
    await db.insert(ticketLinks).values({
      tenantId,
      sourceTicketId: l.sourceTicketId,
      targetTicketId: l.targetTicketId,
      linkType: l.linkType,
    }).onConflictDoNothing()
  }
  console.log(`Seeded ${ticketLinksData.length} ticket links`)
}
