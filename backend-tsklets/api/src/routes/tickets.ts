import { Router } from 'express'
import { db } from '../db/index.js'
import { tickets, attachments, ticketComments, clients } from '../db/schema.js'
import { eq, and, desc } from 'drizzle-orm'
import { authenticate, requireInternal } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

export const ticketRoutes = Router()

// All ticket routes require authentication
ticketRoutes.use(authenticate)

// Get all tickets for tenant (internal only) - for internal portal kanban
ticketRoutes.get('/all', requireInternal, async (req, res) => {
  try {
    const { tenantId } = req.user!

    const results = await db.query.tickets.findMany({
      where: eq(tickets.tenantId, tenantId),
      orderBy: (tickets, { desc }) => [desc(tickets.createdAt)],
      with: {
        client: true,
      },
    })

    // Flatten response for easier frontend use
    const formatted = results.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      clientPriority: t.clientPriority,
      clientSeverity: t.clientSeverity,
      internalPriority: t.internalPriority,
      internalSeverity: t.internalSeverity,
      clientId: t.clientId,
      clientName: t.client?.name || 'Unknown',
      tenantId: t.tenantId,
      createdAt: t.createdAt,
    }))

    res.json(formatted)
  } catch (error) {
    console.error('Get all tickets error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create ticket
ticketRoutes.post('/', async (req, res) => {
  try {
    const { title, description, productId, clientPriority, clientSeverity } = req.body
    const { userId, tenantId, clientId } = req.user!

    const [ticket] = await db.insert(tickets).values({
      title,
      description,
      productId,
      clientPriority,
      clientSeverity,
      userId,
      tenantId,
      clientId, // Will be null for internal users
      status: 'open',
    }).returning()

    res.status(201).json({ ticket })
  } catch (error) {
    console.error('Create ticket error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// List tickets (visibility based on user type)
ticketRoutes.get('/', async (req, res) => {
  try {
    const { tenantId, clientId, isInternal, userId, role } = req.user!

    let results

    if (isInternal) {
      // Internal users see all tickets in their tenant
      results = await db.select().from(tickets)
        .where(eq(tickets.tenantId, tenantId))
        .orderBy(desc(tickets.createdAt))
    } else if (role === 'company_admin') {
      // Client admin sees all tickets for their client
      results = await db.select().from(tickets)
        .where(and(
          eq(tickets.tenantId, tenantId),
          eq(tickets.clientId, clientId!)
        ))
        .orderBy(desc(tickets.createdAt))
    } else {
      // Regular client users only see their own tickets
      results = await db.select().from(tickets)
        .where(and(
          eq(tickets.tenantId, tenantId),
          eq(tickets.userId, userId)
        ))
        .orderBy(desc(tickets.createdAt))
    }

    res.json({ tickets: results })
  } catch (error) {
    console.error('List tickets error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single ticket
ticketRoutes.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId, clientId, isInternal, userId, role } = req.user!

    const [ticket] = await db.select().from(tickets)
      .where(and(
        eq(tickets.id, parseInt(id)),
        eq(tickets.tenantId, tenantId)
      ))
      .limit(1)

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Access check
    if (!isInternal) {
      if (role === 'company_admin') {
        // Client admin can see their client's tickets
        if (ticket.clientId !== clientId) {
          return res.status(403).json({ error: 'Forbidden' })
        }
      } else {
        // Regular users can only see their own tickets
        if (ticket.userId !== userId) {
          return res.status(403).json({ error: 'Forbidden' })
        }
      }
    }

    // Get attachments
    const ticketAttachments = await db.select().from(attachments)
      .where(eq(attachments.ticketId, ticket.id))

    // Get comments (filter internal notes for client users)
    let comments = await db.select().from(ticketComments)
      .where(eq(ticketComments.ticketId, ticket.id))
      .orderBy(ticketComments.createdAt)

    if (!isInternal) {
      comments = comments.filter((c: any) => !c.isInternal)
    }

    res.json({ ticket, attachments: ticketAttachments, comments })
  } catch (error) {
    console.error('Get ticket error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update ticket (status, priority, assignment)
ticketRoutes.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status, internalPriority, internalSeverity, assignedTo } = req.body
    const { tenantId, isInternal, role } = req.user!

    const [ticket] = await db.select().from(tickets)
      .where(and(
        eq(tickets.id, parseInt(id)),
        eq(tickets.tenantId, tenantId)
      ))
      .limit(1)

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Only internal users can set internal fields
    const canSetInternal = isInternal

    const updateData: any = { updatedAt: new Date().toISOString() }
    if (status) updateData.status = status
    if (canSetInternal && internalPriority) updateData.internalPriority = internalPriority
    if (canSetInternal && internalSeverity) updateData.internalSeverity = internalSeverity
    if (canSetInternal && assignedTo) updateData.assignedTo = assignedTo

    const [updated] = await db.update(tickets)
      .set(updateData)
      .where(eq(tickets.id, parseInt(id)))
      .returning()

    res.json({ ticket: updated })
  } catch (error) {
    console.error('Update ticket error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add comment
ticketRoutes.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params
    const { content, isInternal: isInternalNote } = req.body
    const { userId, isInternal, tenantId } = req.user!

    // Verify ticket belongs to tenant
    const [ticket] = await db.select().from(tickets)
      .where(and(
        eq(tickets.id, parseInt(id)),
        eq(tickets.tenantId, tenantId)
      ))
      .limit(1)

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Only internal users can add internal notes
    const [comment] = await db.insert(ticketComments).values({
      ticketId: parseInt(id),
      userId,
      content,
      isInternal: isInternal ? isInternalNote : false,
    }).returning()

    res.status(201).json({ comment })
  } catch (error) {
    console.error('Add comment error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Upload attachments
ticketRoutes.post('/:id/attachments', upload.array('files', 5), async (req, res) => {
  try {
    const { id } = req.params
    const { userId, tenantId, isInternal, clientId } = req.user!
    const files = req.files as Express.Multer.File[]

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

    // Check ticket exists and user has access
    const [ticket] = await db.select().from(tickets)
      .where(and(
        eq(tickets.id, parseInt(id)),
        eq(tickets.tenantId, tenantId)
      ))
      .limit(1)

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Access check: internal users, ticket creator, or same client
    if (!isInternal && ticket.userId !== userId && ticket.clientId !== clientId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Save attachment metadata to database
    const uploadedAttachments = []
    for (const file of files) {
      const [attachment] = await db.insert(attachments).values({
        ticketId: parseInt(id),
        fileUrl: `/uploads/${file.filename}`,
        fileName: file.originalname,
        fileSize: file.size,
      }).returning()

      uploadedAttachments.push(attachment)
    }

    res.status(201).json({ attachments: uploadedAttachments })
  } catch (error: any) {
    console.error('Upload attachments error:', error)

    if (error.message?.includes('File too large')) {
      return res.status(400).json({ error: 'File size exceeds 5MB limit' })
    }
    if (error.message?.includes('Invalid file type')) {
      return res.status(400).json({ error: 'Invalid file type. Only JPG, PNG, GIF, and SVG are allowed.' })
    }

    res.status(500).json({ error: 'Internal server error' })
  }
})
