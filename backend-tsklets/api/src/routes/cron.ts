import { Router } from 'express'
import { db } from '../db/index.js'
import { tickets } from '../db/schema.js'
import { eq, and, or, lt, sql } from 'drizzle-orm'

export const cronRoutes = Router()

// Auto-close tickets endpoint
// Closes tickets that have been in 'resolved' or 'waiting_for_customer' status
// for more than 5 days without any updates.
//
// This endpoint should be called by an external scheduler (e.g., cron job, GitHub Actions)
// Example crontab: 0 2 * * * curl -X POST http://localhost:4030/api/cron/auto-close-tickets
//
// Security: In production, protect this endpoint with an API key or IP whitelist
cronRoutes.post('/auto-close-tickets', async (req, res) => {
  try {
    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)

    // Find tickets that should be auto-closed:
    // - Status is 'resolved' or 'waiting_for_customer'
    // - updatedAt is more than 5 days ago
    const ticketsToClose = await db
      .select({
        id: tickets.id,
        issueKey: tickets.issueKey,
        status: tickets.status,
        labels: tickets.labels,
        updatedAt: tickets.updatedAt,
      })
      .from(tickets)
      .where(
        and(
          or(
            eq(tickets.status, 'resolved'),
            eq(tickets.status, 'waiting_for_customer')
          ),
          lt(tickets.updatedAt, fiveDaysAgo)
        )
      )

    if (ticketsToClose.length === 0) {
      console.log('[Cron] Auto-close: No tickets to close')
      return res.json({
        success: true,
        message: 'No tickets to close',
        closedCount: 0,
        closedTickets: [],
      })
    }

    const now = new Date()
    const closedTicketKeys: string[] = []

    // Update each ticket
    for (const ticket of ticketsToClose) {
      // Prepare labels array with auto_closed_no_response label
      const currentLabels = ticket.labels || []
      const newLabels = currentLabels.includes('auto_closed_no_response')
        ? currentLabels
        : [...currentLabels, 'auto_closed_no_response']

      await db
        .update(tickets)
        .set({
          status: 'closed',
          labels: newLabels,
          closedAt: now,
          updatedAt: now,
        })
        .where(eq(tickets.id, ticket.id))

      closedTicketKeys.push(ticket.issueKey)
      console.log(`[Cron] Auto-closed ticket: ${ticket.issueKey} (was: ${ticket.status})`)
    }

    console.log(`[Cron] Auto-close complete: ${closedTicketKeys.length} tickets closed`)

    res.json({
      success: true,
      message: `Auto-closed ${closedTicketKeys.length} tickets`,
      closedCount: closedTicketKeys.length,
      closedTickets: closedTicketKeys,
    })
  } catch (error) {
    console.error('[Cron] Auto-close tickets error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Health check for cron service
cronRoutes.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'cron' })
})
