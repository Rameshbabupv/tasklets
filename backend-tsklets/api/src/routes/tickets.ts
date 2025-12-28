import { Router } from 'express'
import { db } from '../db/index.js'
import { tickets, attachments, ticketComments, ticketLinks, clients, users, products } from '../db/schema.js'
import { eq, and, desc, or } from 'drizzle-orm'
import { authenticate, requireInternal } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import { generateIssueKey } from '../utils/issueKey.js'

export const ticketRoutes = Router()

// All ticket routes require authentication
ticketRoutes.use(authenticate)

// Get all tickets for tenant (internal only) - for internal portal kanban
// Query params: ?clientId=1 to filter by client
ticketRoutes.get('/all', requireInternal, async (req, res) => {
  try {
    const { tenantId } = req.user!
    const { clientId: filterClientId } = req.query

    // Build where clause
    let whereClause = eq(tickets.tenantId, tenantId)
    if (filterClientId) {
      whereClause = and(
        eq(tickets.tenantId, tenantId),
        eq(tickets.clientId, parseInt(filterClientId as string))
      )!
    }

    const results = await db.query.tickets.findMany({
      where: whereClause,
      orderBy: (tickets, { desc }) => [desc(tickets.createdAt)],
      with: {
        client: true,
        product: true,
        creator: {
          columns: { id: true, name: true, email: true },
        },
        reporter: {
          columns: { id: true, name: true, email: true },
        },
        assignee: {
          columns: { id: true, name: true, email: true },
        },
        parent: {
          columns: { id: true, issueKey: true, title: true },
        },
      },
    })

    // Flatten response for easier frontend use
    const formatted = results.map((t: any) => ({
      id: t.id,
      issueKey: t.issueKey,
      title: t.title,
      description: t.description,
      type: t.type || 'support',
      status: t.status,
      clientPriority: t.clientPriority,
      clientSeverity: t.clientSeverity,
      internalPriority: t.internalPriority,
      internalSeverity: t.internalSeverity,
      // Client info
      clientId: t.clientId,
      clientName: t.client?.name || null,
      clientType: t.client?.type || null,
      // Product info
      productId: t.productId,
      productCode: t.product?.code,
      productName: t.product?.name,
      // People
      createdBy: t.createdBy,
      creatorName: t.creator?.name || null,
      creatorEmail: t.creator?.email || null,
      reporterId: t.reporterId,
      reporterName: t.reporter?.name || null,
      reporterEmail: t.reporter?.email || null,
      assignedTo: t.assignedTo,
      assigneeName: t.assignee?.name || null,
      // Hierarchy
      parentId: t.parentId,
      parent: t.parent || null,
      // Meta
      labels: t.labels,
      beadsId: t.beadsId,
      tenantId: t.tenantId,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
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
    const {
      title,
      description,
      type,
      productId,
      clientPriority,
      clientSeverity,
      largeFileLink,
      parentId,
      labels,
      storyPoints,
      estimate,
      dueDate,
      // For internal users creating on behalf of clients
      clientId: requestClientId,
      reporterId: requestReporterId,
    } = req.body
    const { userId, tenantId, clientId: userClientId, isInternal } = req.user!

    // Validate productId is provided
    if (!productId) {
      return res.status(400).json({ error: 'productId is required' })
    }

    // Determine the ticket type (default to 'support' for client users)
    const ticketType = type || 'support'

    // Determine clientId and reporterId based on user type
    let finalClientId: number | null
    let finalReporterId: number

    if (isInternal) {
      // Internal users can specify clientId and reporterId
      finalClientId = requestClientId || null
      finalReporterId = requestReporterId || userId // Default to self if not specified
    } else {
      // Client users: clientId from their login, reporterId is themselves
      finalClientId = userClientId || null
      finalReporterId = userId
    }

    // Generate the issue key and nanoUUID
    const { key: issueKey, id } = await generateIssueKey(productId, ticketType)

    const [ticket] = await db.insert(tickets).values({
      id,
      issueKey,
      title,
      description,
      type: ticketType,
      productId,
      clientPriority,
      clientSeverity,
      largeFileLink: largeFileLink || null,
      parentId: parentId || null,
      labels: labels || null,
      storyPoints: storyPoints || null,
      estimate: estimate || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy: userId, // Always the logged-in user
      reporterId: finalReporterId, // The actual reporter (could be different for internal users)
      tenantId,
      clientId: finalClientId,
      status: 'open',
    }).returning()

    res.status(201).json({ ticket })
  } catch (error: any) {
    console.error('Create ticket error:', error)
    if (error.message?.includes('Product not found') || error.message?.includes('no code defined')) {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// List tickets (visibility based on user type)
ticketRoutes.get('/', async (req, res) => {
  try {
    const { tenantId, clientId, isInternal, userId, role } = req.user!

    let whereClause

    if (isInternal) {
      // Internal users see all tickets in their tenant
      whereClause = eq(tickets.tenantId, tenantId)
    } else if (role === 'company_admin') {
      // Client admin sees all tickets for their client
      whereClause = and(
        eq(tickets.tenantId, tenantId),
        eq(tickets.clientId, clientId!)
      )
    } else {
      // Regular client users only see their own tickets
      whereClause = and(
        eq(tickets.tenantId, tenantId),
        eq(tickets.createdBy, userId)
      )
    }

    // Join with users and products
    const results = await db
      .select({
        id: tickets.id,
        issueKey: tickets.issueKey,
        title: tickets.title,
        description: tickets.description,
        type: tickets.type,
        status: tickets.status,
        clientPriority: tickets.clientPriority,
        clientSeverity: tickets.clientSeverity,
        internalPriority: tickets.internalPriority,
        internalSeverity: tickets.internalSeverity,
        productId: tickets.productId,
        productCode: products.code,
        productName: products.name,
        parentId: tickets.parentId,
        labels: tickets.labels,
        createdBy: tickets.createdBy,
        createdByName: users.name,
        assignedTo: tickets.assignedTo,
        tenantId: tickets.tenantId,
        clientId: tickets.clientId,
        beadsId: tickets.beadsId,
        createdAt: tickets.createdAt,
        updatedAt: tickets.updatedAt,
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.createdBy, users.id))
      .leftJoin(products, eq(tickets.productId, products.id))
      .where(whereClause)
      .orderBy(desc(tickets.createdAt))

    res.json({ tickets: results })
  } catch (error) {
    console.error('List tickets error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single ticket (by id or issueKey)
ticketRoutes.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId, clientId, isInternal, userId, role } = req.user!

    // Try to find by id (nanoUUID) or issueKey
    const [ticket] = await db.select().from(tickets)
      .where(and(
        or(eq(tickets.id, id), eq(tickets.issueKey, id)),
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
        if (ticket.createdBy !== userId) {
          return res.status(403).json({ error: 'Forbidden' })
        }
      }
    }

    // Get client info
    let clientInfo = null
    if (ticket.clientId) {
      const [c] = await db.select().from(clients).where(eq(clients.id, ticket.clientId)).limit(1)
      clientInfo = c || null
    }

    // Get product info
    let productInfo = null
    if (ticket.productId) {
      const [p] = await db.select().from(products).where(eq(products.id, ticket.productId)).limit(1)
      productInfo = p || null
    }

    // Get user info (creator, reporter, assignee)
    const userIds = [ticket.createdBy, ticket.reporterId, ticket.assignedTo].filter(Boolean) as number[]
    const userInfos: Record<number, { id: number; name: string; email: string }> = {}
    if (userIds.length > 0) {
      const usersData = await db.select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(or(...userIds.map(uid => eq(users.id, uid))))
      usersData.forEach(u => { userInfos[u.id] = u })
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

    // Get parent ticket info if exists
    let parent = null
    if (ticket.parentId) {
      const [p] = await db.select({
        id: tickets.id,
        issueKey: tickets.issueKey,
        title: tickets.title,
        type: tickets.type,
        status: tickets.status,
      }).from(tickets).where(eq(tickets.id, ticket.parentId)).limit(1)
      parent = p || null
    }

    // Get children (sub-tickets)
    const children = await db.select({
      id: tickets.id,
      issueKey: tickets.issueKey,
      title: tickets.title,
      type: tickets.type,
      status: tickets.status,
    }).from(tickets).where(eq(tickets.parentId, ticket.id))

    // Get links (blocks, relates_to, etc.)
    const outgoingLinks = await db.select({
      id: ticketLinks.id,
      linkType: ticketLinks.linkType,
      targetId: ticketLinks.targetTicketId,
    }).from(ticketLinks).where(eq(ticketLinks.sourceTicketId, ticket.id))

    const incomingLinks = await db.select({
      id: ticketLinks.id,
      linkType: ticketLinks.linkType,
      sourceId: ticketLinks.sourceTicketId,
    }).from(ticketLinks).where(eq(ticketLinks.targetTicketId, ticket.id))

    // Fetch linked ticket details
    const linkedTicketIds = [
      ...outgoingLinks.map(l => l.targetId),
      ...incomingLinks.map(l => l.sourceId),
    ]

    let linkedTickets: Record<string, any> = {}
    if (linkedTicketIds.length > 0) {
      const linked = await db.select({
        id: tickets.id,
        issueKey: tickets.issueKey,
        title: tickets.title,
        type: tickets.type,
        status: tickets.status,
      }).from(tickets).where(
        or(...linkedTicketIds.map(lid => eq(tickets.id, lid)))
      )
      linked.forEach(t => { linkedTickets[t.id] = t })
    }

    // Format links with ticket details
    const links = [
      ...outgoingLinks.map(l => ({
        id: l.id,
        linkType: l.linkType,
        direction: 'outgoing',
        ticket: linkedTickets[l.targetId] || null,
      })),
      ...incomingLinks.map(l => ({
        id: l.id,
        linkType: l.linkType,
        direction: 'incoming',
        ticket: linkedTickets[l.sourceId] || null,
      })),
    ]

    // Enrich ticket with related info
    const enrichedTicket = {
      ...ticket,
      // Client info
      clientName: clientInfo?.name || null,
      clientType: clientInfo?.type || null,
      // Product info
      productCode: productInfo?.code || null,
      productName: productInfo?.name || null,
      // User info
      creatorName: ticket.createdBy ? userInfos[ticket.createdBy]?.name || null : null,
      creatorEmail: ticket.createdBy ? userInfos[ticket.createdBy]?.email || null : null,
      reporterName: ticket.reporterId ? userInfos[ticket.reporterId]?.name || null : null,
      reporterEmail: ticket.reporterId ? userInfos[ticket.reporterId]?.email || null : null,
      assigneeName: ticket.assignedTo ? userInfos[ticket.assignedTo]?.name || null : null,
      assigneeEmail: ticket.assignedTo ? userInfos[ticket.assignedTo]?.email || null : null,
    }

    res.json({
      ticket: enrichedTicket,
      attachments: ticketAttachments,
      comments,
      parent,
      children,
      links,
    })
  } catch (error) {
    console.error('Get ticket error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update ticket (status, priority, assignment, beadsId, etc.)
ticketRoutes.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      status,
      internalPriority,
      internalSeverity,
      assignedTo,
      beadsId,
      parentId,
      labels,
      storyPoints,
      estimate,
      dueDate,
      resolution,
      resolutionNote,
    } = req.body
    const { tenantId, isInternal } = req.user!

    // Find by id or issueKey
    const [ticket] = await db.select().from(tickets)
      .where(and(
        or(eq(tickets.id, id), eq(tickets.issueKey, id)),
        eq(tickets.tenantId, tenantId)
      ))
      .limit(1)

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Build update data
    const updateData: any = { updatedAt: new Date() }

    // Status changes
    if (status) {
      updateData.status = status
      // If closing, set closedAt
      if (['resolved', 'closed', 'cancelled'].includes(status) && !ticket.closedAt) {
        updateData.closedAt = new Date()
      }
    }

    // Resolution
    if (resolution !== undefined) updateData.resolution = resolution
    if (resolutionNote !== undefined) updateData.resolutionNote = resolutionNote

    // Internal-only fields
    if (isInternal) {
      if (internalPriority !== undefined) updateData.internalPriority = internalPriority
      if (internalSeverity !== undefined) updateData.internalSeverity = internalSeverity
      if (assignedTo !== undefined) updateData.assignedTo = assignedTo
      if (beadsId !== undefined) updateData.beadsId = beadsId
      if (parentId !== undefined) updateData.parentId = parentId
      if (labels !== undefined) updateData.labels = labels
      if (storyPoints !== undefined) updateData.storyPoints = storyPoints
      if (estimate !== undefined) updateData.estimate = estimate
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    }

    const [updated] = await db.update(tickets)
      .set(updateData)
      .where(eq(tickets.id, ticket.id))
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

    // Find by id or issueKey
    const [ticket] = await db.select().from(tickets)
      .where(and(
        or(eq(tickets.id, id), eq(tickets.issueKey, id)),
        eq(tickets.tenantId, tenantId)
      ))
      .limit(1)

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Only internal users can add internal notes
    const [comment] = await db.insert(ticketComments).values({
      tenantId,
      ticketId: ticket.id, // Use the actual ticket id (nanoUUID)
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

    // Find by id or issueKey
    const [ticket] = await db.select().from(tickets)
      .where(and(
        or(eq(tickets.id, id), eq(tickets.issueKey, id)),
        eq(tickets.tenantId, tenantId)
      ))
      .limit(1)

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Access check: internal users, ticket creator, or same client
    if (!isInternal && ticket.createdBy !== userId && ticket.clientId !== clientId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Save attachment metadata to database
    const uploadedAttachments = []
    for (const file of files) {
      const [attachment] = await db.insert(attachments).values({
        tenantId,
        ticketId: ticket.id, // Use the actual ticket id (nanoUUID)
        fileUrl: `/uploads/${file.filename}`,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      }).returning()

      uploadedAttachments.push(attachment)
    }

    res.status(201).json({ attachments: uploadedAttachments })
  } catch (error: any) {
    console.error('Upload attachments error:', error)

    if (error.message?.includes('File too large')) {
      return res.status(400).json({ error: 'File size exceeds 50MB limit' })
    }
    if (error.message?.includes('Invalid file type')) {
      return res.status(400).json({ error: 'Invalid file type. Only images (JPG, PNG, GIF, SVG) and videos (MP4, WebM, MOV, AVI, WMV) are allowed.' })
    }

    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add ticket link (blocks, relates_to, etc.)
ticketRoutes.post('/:id/links', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const { targetTicketId, linkType } = req.body
    const { userId, tenantId } = req.user!

    // Validate link type
    const validLinkTypes = ['blocks', 'blocked_by', 'relates_to', 'duplicates', 'duplicated_by', 'parent_of', 'child_of']
    if (!validLinkTypes.includes(linkType)) {
      return res.status(400).json({ error: `Invalid link type. Valid types: ${validLinkTypes.join(', ')}` })
    }

    // Find source ticket by id or issueKey
    const [sourceTicket] = await db.select().from(tickets)
      .where(and(
        or(eq(tickets.id, id), eq(tickets.issueKey, id)),
        eq(tickets.tenantId, tenantId)
      ))
      .limit(1)

    if (!sourceTicket) {
      return res.status(404).json({ error: 'Source ticket not found' })
    }

    // Find target ticket by id or issueKey
    const [targetTicket] = await db.select().from(tickets)
      .where(and(
        or(eq(tickets.id, targetTicketId), eq(tickets.issueKey, targetTicketId)),
        eq(tickets.tenantId, tenantId)
      ))
      .limit(1)

    if (!targetTicket) {
      return res.status(404).json({ error: 'Target ticket not found' })
    }

    // Don't allow self-linking
    if (sourceTicket.id === targetTicket.id) {
      return res.status(400).json({ error: 'Cannot link a ticket to itself' })
    }

    // Create the link
    const [link] = await db.insert(ticketLinks).values({
      tenantId,
      sourceTicketId: sourceTicket.id,
      targetTicketId: targetTicket.id,
      linkType: linkType as any,
      createdBy: userId,
    }).returning()

    res.status(201).json({
      link,
      sourceTicket: { id: sourceTicket.id, issueKey: sourceTicket.issueKey, title: sourceTicket.title },
      targetTicket: { id: targetTicket.id, issueKey: targetTicket.issueKey, title: targetTicket.title },
    })
  } catch (error: any) {
    console.error('Add ticket link error:', error)
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'This link already exists' })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Remove ticket link
ticketRoutes.delete('/:id/links/:linkId', requireInternal, async (req, res) => {
  try {
    const { linkId } = req.params
    const { tenantId } = req.user!

    const [deleted] = await db.delete(ticketLinks)
      .where(and(
        eq(ticketLinks.id, parseInt(linkId)),
        eq(ticketLinks.tenantId, tenantId)
      ))
      .returning()

    if (!deleted) {
      return res.status(404).json({ error: 'Link not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Delete ticket link error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
