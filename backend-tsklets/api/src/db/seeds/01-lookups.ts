/**
 * Seed: Lookups (Products)
 * Run: npm run db:seed
 *
 * This seeds essential lookup data required for the system to function.
 */

/**
 * =============================================================================
 * INTERNAL TRIAGE SYSTEM - STANDARD TICKET LABELS
 * =============================================================================
 *
 * Labels are stored as text arrays on tickets (not a lookup table).
 * The following are the standard labels used by the internal triage system:
 *
 * WORKFLOW LABELS:
 * - escalated              : Urgent, needs immediate attention from senior staff
 * - resolved_internally    : Closed without Systech involvement (client resolved)
 * - auto_closed_no_response: Cron job closed after 5 days of resolved/waiting_for_customer
 * - internal_assignment    : Assigned to employee for clarification before escalating
 * - created_by_systech     : Systech created ticket on behalf of client
 * - reassigned_to_internal : Systech sent back to client for internal handling
 *
 * These labels help track the lifecycle and routing of tickets in the triage
 * workflow. They are applied automatically by system processes or manually
 * by internal staff during ticket management.
 *
 * Usage in code:
 *   ticket.labels = ['escalated', 'created_by_systech']
 *
 * =============================================================================
 */

import { db } from '../index.js'
import { products, productSequences } from '../schema.js'

export const productsData = [
  { id: 1, code: 'CRML', name: 'CRM (legacy)', description: 'Customer Relationship Management - Marketing, lead generation, deal conversion' },
  { id: 2, code: 'SDMSL', name: 'SDMS (legacy)', description: 'Supply & Distribution Management - Multi-location distributors' },
  { id: 3, code: 'MMSL', name: 'MMS (legacy)', description: 'Manufacturing Management System - Discrete manufacturing' },
  { id: 4, code: 'HRML', name: 'HRM (legacy)', description: 'Human Resource Management - Recruitment to retirement' },
  { id: 5, code: 'FINL', name: 'Finance (legacy)', description: 'Financial Management - Standalone and integrated finance module' },
  { id: 6, code: 'CRMS', name: 'CRM Sales', description: 'Customer Relationship Management v2 - Pre-sale customer engagement' },
  { id: 7, code: 'CRMSV', name: 'CRM Service', description: 'Customer Relationship Management v2 - Post-sale customer support' },
  { id: 8, code: 'SDMS', name: 'SDMS v2', description: 'Supply & Distribution Management System v2' },
  { id: 9, code: 'MMS', name: 'MMS v2', description: 'Manufacturing Management System v2' },
  { id: 10, code: 'TMS', name: 'TMS', description: 'Textile Management System - spinning, processing, weaving, knitting, apparel' },
  { id: 11, code: 'HRM', name: 'HRM v2', description: 'Human Resource Management v2' },
  { id: 12, code: 'FIN', name: 'Finance v2', description: 'Financial Management v2' },
  { id: 13, code: 'EXIM', name: 'EXIM', description: 'Export & Import Management' },
  { id: 14, code: 'TSKLTS', name: 'Tasklets', description: 'Unified platform for client issues, internal requests, and development progress' },
]

export async function seedLookups(tenantId: number) {
  console.log('Seeding products...')

  for (const product of productsData) {
    await db.insert(products).values({
      id: product.id,
      tenantId,
      code: product.code,
      name: product.name,
      description: product.description,
    }).onConflictDoNothing()
  }

  // Initialize product sequences
  console.log('Initializing product sequences...')
  const types = ['S', 'B', 'T', 'F', 'R', 'E', 'K', 'N'] as const // S=Support, B=Bug, T=Task, F=Feature, R=Request, E=Epic, K=Spike, N=Note

  for (const product of productsData) {
    for (const type of types) {
      await db.insert(productSequences).values({
        productId: product.id,
        issueType: type as 'S' | 'B' | 'T' | 'F' | 'R' | 'E' | 'K' | 'N',
        nextNum: 1,
      }).onConflictDoNothing()
    }
  }

  console.log(`Seeded ${productsData.length} products`)
}
