import { Router } from 'express'
import { db } from '../db/index.js'
import { tickets, attachments, ticketComments, ticketLinks, clients, users, products, ticketWatchers, supportTicketTasks, devTasks, ticketAuditLog } from '../db/schema.js'
import { eq, and, desc, or, count, sql, inArray } from 'drizzle-orm'
import { authenticate, requireInternal, requireClientAdmin, requireClientUser } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import { generateIssueKey, generateGlobalIssueKey } from '../utils/issueKey.js'

export const ticketRoutes = Router()

// Helper to log ticket changes to audit log
async function logTicketChange(
  tenantId: number,
  ticketId: string,
  changeType: string,
  userId: number,
  oldValue?: string | null,
  newValue?: string | null,
  metadata?: Record<string, any>
) {
  try {
    await db.insert(ticketAuditLog).values({
      tenantId,
      ticketId,
      changeType: changeType as any,
      userId,
      oldValue,
      newValue,
      metadata: metadata || null,
    })
  } catch (error) {
    console.error('Failed to log ticket change:', error)
    // Don't throw - audit logging should not break the main operation
  }
}

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
    // Use global counter for client portal (support/feature_request), product-based for internal
    let issueKey: string
    let id: string

    if (!isInternal && (ticketType === 'support' || ticketType === 'feature_request')) {
      // Client portal tickets get global keys (SUP-S###, SUP-F###)
      const generated = await generateGlobalIssueKey(ticketType)
      issueKey = generated.key
      id = generated.id
    } else {
      // Internal tickets use product-based keys
      const generated = await generateIssueKey(productId, ticketType)
      issueKey = generated.key
      id = generated.id
    }

    // Determine initial status based on user type
    // Client portal tickets start at 'pending_internal_review' for triage
    // Internal tickets start at 'open'
    const initialStatus = isInternal ? 'open' : 'pending_internal_review'

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
      status: initialStatus,
    }).returning()

    // Log ticket creation
    await logTicketChange(tenantId, ticket.id, 'created', userId)

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
    const { status: statusFilter } = req.query

    let whereConditions = []

    // Base tenant filtering
    if (isInternal) {
      // Internal users see all tickets in their tenant
      whereConditions.push(eq(tickets.tenantId, tenantId))
    } else if (role === 'company_admin') {
      // Client admin sees all tickets for their client
      whereConditions.push(eq(tickets.tenantId, tenantId))
      whereConditions.push(eq(tickets.clientId, clientId!))
    } else {
      // All client users see all tickets for their company (company-wide visibility)
      whereConditions.push(eq(tickets.tenantId, tenantId))
      whereConditions.push(eq(tickets.clientId, clientId!))
    }

    // Add status filter if provided
    if (statusFilter && typeof statusFilter === 'string') {
      whereConditions.push(eq(tickets.status, statusFilter as 'pending_internal_review' | 'open' | 'in_progress' | 'waiting_for_customer' | 'rebuttal' | 'resolved' | 'closed' | 'reopened' | 'cancelled'))
    }

    const whereClause = whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0]

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
        reporterId: tickets.reporterId,
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

    // Get comment and attachment counts for all tickets
    const ticketIds = results.map(t => t.id)

    // Build counts map
    const counts: Record<string, { commentCount: number; attachmentCount: number }> = {}

    if (ticketIds.length > 0) {
      // Get comment counts (exclude internal comments for client users)
      const commentCounts = await db
        .select({
          ticketId: ticketComments.ticketId,
          count: count(ticketComments.id),
        })
        .from(ticketComments)
        .where(
          and(
            inArray(ticketComments.ticketId, ticketIds),
            isInternal ? undefined : eq(ticketComments.isInternal, false)
          )
        )
        .groupBy(ticketComments.ticketId)

      // Get attachment counts
      const attachmentCounts = await db
        .select({
          ticketId: attachments.ticketId,
          count: count(attachments.id),
        })
        .from(attachments)
        .where(inArray(attachments.ticketId, ticketIds))
        .groupBy(attachments.ticketId)

      // Build counts map
      commentCounts.forEach(c => {
        if (c.ticketId) {
          counts[c.ticketId] = { commentCount: Number(c.count), attachmentCount: 0 }
        }
      })
      attachmentCounts.forEach(a => {
        if (a.ticketId) {
          if (!counts[a.ticketId]) {
            counts[a.ticketId] = { commentCount: 0, attachmentCount: 0 }
          }
          counts[a.ticketId].attachmentCount = Number(a.count)
        }
      })
    }

    // Get reporter names for tickets where reporterId differs from createdBy
    const reporterIds = [...new Set(results.filter(t => t.reporterId && t.reporterId !== t.createdBy).map(t => t.reporterId!))]
    const reporterNames: Record<number, string> = {}

    if (reporterIds.length > 0) {
      const reporters = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, reporterIds))

      reporters.forEach(r => {
        reporterNames[r.id] = r.name
      })
    }

    // Merge counts and reporter names into results
    const ticketsWithCounts = results.map(t => ({
      ...t,
      commentCount: counts[t.id]?.commentCount || 0,
      attachmentCount: counts[t.id]?.attachmentCount || 0,
      reporterName: t.reporterId === t.createdBy ? t.createdByName : (reporterNames[t.reporterId!] || t.createdByName),
    }))

    res.json({ tickets: ticketsWithCounts })
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

    // Access check - all company users can view their company's tickets
    if (!isInternal) {
      if (ticket.clientId !== clientId) {
        return res.status(403).json({ error: 'Forbidden' })
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

    // Get linked dev tasks (via supportTicketTasks join table)
    const linkedTaskRecords = await db.select({
      taskId: supportTicketTasks.taskId,
    }).from(supportTicketTasks).where(eq(supportTicketTasks.ticketId, ticket.id))

    const linkedDevTasks: any[] = []
    if (linkedTaskRecords.length > 0) {
      for (const record of linkedTaskRecords) {
        const [task] = await db.select({
          id: devTasks.id,
          issueKey: devTasks.issueKey,
          title: devTasks.title,
          type: devTasks.type,
          status: devTasks.status,
        }).from(devTasks).where(eq(devTasks.id, record.taskId)).limit(1)
        if (task) {
          linkedDevTasks.push(task)
        }
      }
    }

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
      devTasks: linkedDevTasks,
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
    const { tenantId, isInternal, userId } = req.user!

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

    // Log changes to audit log
    if (status && status !== ticket.status) {
      const changeType = status === 'resolved' ? 'resolved' :
                        (ticket.status === 'resolved' && status !== 'resolved') ? 'reopened' :
                        'status_changed'
      await logTicketChange(tenantId, ticket.id, changeType, userId, ticket.status, status)
    }
    if (internalPriority !== undefined && internalPriority !== ticket.internalPriority) {
      await logTicketChange(tenantId, ticket.id, 'priority_changed', userId,
        ticket.internalPriority?.toString(), internalPriority?.toString())
    }
    if (internalSeverity !== undefined && internalSeverity !== ticket.internalSeverity) {
      await logTicketChange(tenantId, ticket.id, 'severity_changed', userId,
        ticket.internalSeverity?.toString(), internalSeverity?.toString())
    }
    if (assignedTo !== undefined && assignedTo !== ticket.assignedTo) {
      await logTicketChange(tenantId, ticket.id, 'assigned', userId, null, assignedTo?.toString())
    }

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

    // Log comment added (only for non-internal comments)
    if (!isInternalNote) {
      await logTicketChange(tenantId, ticket.id, 'comment_added', userId, null, null, {
        preview: content.slice(0, 100),
      })
    }

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

      // Log attachment added
      await logTicketChange(tenantId, ticket.id, 'attachment_added', userId, null, null, {
        fileName: file.originalname,
        fileSize: file.size,
      })
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

// ========================================
// CLIENT INTERNAL TRIAGE ENDPOINTS
// ========================================

// Push ticket to Systech (company_admin only)
// Changes status from 'pending_internal_review' to 'open' and starts SLA
ticketRoutes.post('/:id/push-to-systech', requireClientAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { userId, tenantId, clientId } = req.user!

    // Find ticket by id or issueKey
    const [ticket] = await db.select().from(tickets)
      .where(and(
        or(eq(tickets.id, id), eq(tickets.issueKey, id)),
        eq(tickets.tenantId, tenantId)
      ))
      .limit(1)

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Verify ticket belongs to the user's client
    if (ticket.clientId !== clientId) {
      return res.status(403).json({ error: 'Forbidden: Can only push tickets from your own company' })
    }

    // Verify ticket is in pending_internal_review status
    if (ticket.status !== 'pending_internal_review') {
      return res.status(400).json({ error: 'Ticket must be in pending_internal_review status to push to Systech' })
    }

    // Update ticket
    const [updated] = await db.update(tickets)
      .set({
        status: 'open',
        pushedToSystechAt: new Date(),
        pushedToSystechBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticket.id))
      .returning()

    res.json({ ticket: updated })
  } catch (error) {
    console.error('Push to Systech error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Escalate ticket to Systech (company_admin only)
// Changes status to 'open', adds 'escalated' label, and starts SLA
ticketRoutes.post('/:id/escalate', requireClientAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { escalationReason, escalationNote } = req.body
    const { userId, tenantId, clientId } = req.user!

    // Validate escalation reason
    const validReasons = ['executive_request', 'production_down', 'compliance', 'customer_impact', 'other']
    if (!escalationReason || !validReasons.includes(escalationReason)) {
      return res.status(400).json({
        error: `escalationReason is required. Valid values: ${validReasons.join(', ')}`
      })
    }

    // If reason is 'other', escalationNote is required
    if (escalationReason === 'other' && !escalationNote) {
      return res.status(400).json({ error: 'escalationNote is required when escalationReason is "other"' })
    }

    // Find ticket by id or issueKey
    const [ticket] = await db.select().from(tickets)
      .where(and(
        or(eq(tickets.id, id), eq(tickets.issueKey, id)),
        eq(tickets.tenantId, tenantId)
      ))
      .limit(1)

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Verify ticket belongs to the user's client
    if (ticket.clientId !== clientId) {
      return res.status(403).json({ error: 'Forbidden: Can only escalate tickets from your own company' })
    }

    // Add 'escalated' label to existing labels
    const currentLabels = ticket.labels || []
    const newLabels = currentLabels.includes('escalated')
      ? currentLabels
      : [...currentLabels, 'escalated']

    // Update ticket
    const [updated] = await db.update(tickets)
      .set({
        status: 'open',
        escalationReason: escalationReason as any,
        escalationNote: escalationNote || null,
        labels: newLabels,
        pushedToSystechAt: new Date(),
        pushedToSystechBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticket.id))
      .returning()

    res.json({ ticket: updated })
  } catch (error) {
    console.error('Escalate ticket error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Assign ticket to internal company employee for clarification (company_admin only)
ticketRoutes.post('/:id/assign-internal', requireClientAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { internalAssignedTo } = req.body
    const { tenantId, clientId } = req.user!

    if (!internalAssignedTo) {
      return res.status(400).json({ error: 'internalAssignedTo (userId) is required' })
    }

    // Find ticket by id or issueKey
    const [ticket] = await db.select().from(tickets)
      .where(and(
        or(eq(tickets.id, id), eq(tickets.issueKey, id)),
        eq(tickets.tenantId, tenantId)
      ))
      .limit(1)

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Verify ticket belongs to the user's client
    if (ticket.clientId !== clientId) {
      return res.status(403).json({ error: 'Forbidden: Can only assign tickets from your own company' })
    }

    // Verify the assignee exists and belongs to the same client
    const [assignee] = await db.select().from(users)
      .where(and(
        eq(users.id, internalAssignedTo),
        eq(users.tenantId, tenantId),
        eq(users.clientId, clientId!)
      ))
      .limit(1)

    if (!assignee) {
      return res.status(400).json({ error: 'Assignee not found or does not belong to your company' })
    }

    // Add 'internal_assignment' label to existing labels
    const currentLabels = ticket.labels || []
    const newLabels = currentLabels.includes('internal_assignment')
      ? currentLabels
      : [...currentLabels, 'internal_assignment']

    // Update ticket
    const [updated] = await db.update(tickets)
      .set({
        internalAssignedTo,
        labels: newLabels,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticket.id))
      .returning()

    res.json({ ticket: updated })
  } catch (error) {
    console.error('Assign internal error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Reassign ticket back to client's internal team (Systech internal users only)
// Changes status to 'pending_internal_review', clears SLA, adds label
ticketRoutes.post('/:id/reassign-to-internal', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const { comment } = req.body
    const { userId, tenantId } = req.user!

    // Comment is required to explain why the ticket is being reassigned
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'A comment explaining the reassignment reason is required' })
    }

    // Find ticket by id or issueKey
    const [ticket] = await db.select().from(tickets)
      .where(and(
        or(eq(tickets.id, id), eq(tickets.issueKey, id)),
        eq(tickets.tenantId, tenantId)
      ))
      .limit(1)

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Ticket must have a client (cannot reassign internal-only tickets)
    if (!ticket.clientId) {
      return res.status(400).json({ error: 'Cannot reassign internal-only tickets' })
    }

    // Add 'reassigned_to_internal' label to existing labels
    const currentLabels = ticket.labels || []
    const newLabels = currentLabels.includes('reassigned_to_internal')
      ? currentLabels
      : [...currentLabels, 'reassigned_to_internal']

    // Update ticket: change status, clear SLA timestamp, add label
    const [updated] = await db.update(tickets)
      .set({
        status: 'pending_internal_review',
        pushedToSystechAt: null,
        labels: newLabels,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticket.id))
      .returning()

    // Add the comment explaining why the ticket was reassigned
    await db.insert(ticketComments).values({
      tenantId,
      ticketId: ticket.id,
      userId,
      content: comment,
      isInternal: false, // Visible to client
    })

    res.json({ ticket: updated })
  } catch (error) {
    console.error('Reassign to internal error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ========================================
// TICKET CHANGELOG
// ========================================

// Get changelog/audit log for a ticket
ticketRoutes.get('/:id/changelog', async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId, clientId, isInternal } = req.user!

    // Find ticket by id or issueKey
    const [ticket] = await db.select().from(tickets)
      .where(and(
        or(eq(tickets.id, id), eq(tickets.issueKey, id)),
        eq(tickets.tenantId, tenantId)
      ))
      .limit(1)

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Access check - all company users can view their company's tickets
    if (!isInternal && ticket.clientId !== clientId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Get changelog entries with user info
    const entries = await db.select({
      id: ticketAuditLog.id,
      ticketId: ticketAuditLog.ticketId,
      changeType: ticketAuditLog.changeType,
      userId: ticketAuditLog.userId,
      userName: users.name,
      userEmail: users.email,
      oldValue: ticketAuditLog.oldValue,
      newValue: ticketAuditLog.newValue,
      metadata: ticketAuditLog.metadata,
      createdAt: ticketAuditLog.createdAt,
    })
      .from(ticketAuditLog)
      .leftJoin(users, eq(ticketAuditLog.userId, users.id))
      .where(eq(ticketAuditLog.ticketId, ticket.id))
      .orderBy(desc(ticketAuditLog.createdAt))

    res.json({ changelog: entries })
  } catch (error) {
    console.error('Get ticket changelog error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ========================================
// TICKET ACTIONS (CLIENT PORTAL)
// ========================================

// Cancel ticket
ticketRoutes.post('/:id/cancel', requireClientUser, async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body
    const { userId, tenantId, clientId, role } = req.user!

    // Validate reason is provided
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'reason is required' })
    }

    // Find ticket by id or issueKey
    const [ticket] = await db.select().from(tickets)
      .where(and(
        or(eq(tickets.id, id), eq(tickets.issueKey, id)),
        eq(tickets.tenantId, tenantId)
      ))
      .limit(1)

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Verify ticket belongs to the user's client
    if (ticket.clientId !== clientId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Permission check: ticket creator OR company_admin
    const isCreator = ticket.createdBy === userId
    const isAdmin = role === 'company_admin'

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Update ticket status to 'cancelled'
    const [updated] = await db.update(tickets)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticket.id))
      .returning()

    // Log to audit log
    await logTicketChange(tenantId, ticket.id, 'cancelled', userId, ticket.status, 'cancelled', {
      reason,
    })

    res.json({ ticket: updated })
  } catch (error) {
    console.error('Cancel ticket error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Reopen closed ticket
ticketRoutes.post('/:id/reopen', requireClientUser, async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body
    const { userId, tenantId, clientId } = req.user!

    // Find ticket by id or issueKey
    const [ticket] = await db.select().from(tickets)
      .where(and(
        or(eq(tickets.id, id), eq(tickets.issueKey, id)),
        eq(tickets.tenantId, tenantId)
      ))
      .limit(1)

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Verify ticket belongs to the user's client
    if (ticket.clientId !== clientId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Validate current status is 'closed'
    if (ticket.status !== 'closed') {
      return res.status(400).json({ error: 'Ticket must be in closed status to reopen' })
    }

    // Update ticket status to 'reopened'
    const [updated] = await db.update(tickets)
      .set({
        status: 'reopened',
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticket.id))
      .returning()

    // Log to audit log
    await logTicketChange(tenantId, ticket.id, 'reopened', userId, ticket.status, 'reopened', {
      reason: reason || null,
    })

    res.json({ ticket: updated })
  } catch (error) {
    console.error('Reopen ticket error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Close resolved ticket
ticketRoutes.post('/:id/close', requireClientUser, async (req, res) => {
  try {
    const { id } = req.params
    const { userId, tenantId, clientId, role } = req.user!

    // Find ticket by id or issueKey
    const [ticket] = await db.select().from(tickets)
      .where(and(
        or(eq(tickets.id, id), eq(tickets.issueKey, id)),
        eq(tickets.tenantId, tenantId)
      ))
      .limit(1)

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Verify ticket belongs to the user's client
    if (ticket.clientId !== clientId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Permission check: ticket reporter OR company_admin
    const isReporter = ticket.reporterId === userId
    const isAdmin = role === 'company_admin'

    if (!isReporter && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Validate current status is 'resolved' or 'reopened'
    if (ticket.status !== 'resolved' && ticket.status !== 'reopened') {
      return res.status(400).json({ error: 'Ticket must be in resolved or reopened status to close' })
    }

    // Update ticket status to 'closed' and set closedAt timestamp
    const [updated] = await db.update(tickets)
      .set({
        status: 'closed',
        closedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticket.id))
      .returning()

    // Log to audit log
    await logTicketChange(tenantId, ticket.id, 'closed', userId, ticket.status, 'closed')

    res.json({ ticket: updated })
  } catch (error) {
    console.error('Close ticket error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ========================================
// TICKET WATCHERS
// ========================================

// Get watchers for a ticket
ticketRoutes.get('/:id/watchers', async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId, clientId, isInternal, userId, role } = req.user!

    // Find ticket by id or issueKey
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
        if (ticket.clientId !== clientId) {
          return res.status(403).json({ error: 'Forbidden' })
        }
      } else {
        if (ticket.createdBy !== userId) {
          return res.status(403).json({ error: 'Forbidden' })
        }
      }
    }

    // Get watchers
    const watchers = await db.select({
      id: ticketWatchers.id,
      userId: ticketWatchers.userId,
      email: ticketWatchers.email,
      addedBy: ticketWatchers.addedBy,
      createdAt: ticketWatchers.createdAt,
    }).from(ticketWatchers)
      .where(eq(ticketWatchers.ticketId, ticket.id))

    // Get user info for user watchers
    const watcherUserIds = watchers.filter(w => w.userId !== null).map(w => w.userId!)
    let userInfos: Record<number, { id: number; name: string; email: string }> = {}
    if (watcherUserIds.length > 0) {
      const usersData = await db.select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(or(...watcherUserIds.map(uid => eq(users.id, uid))))
      usersData.forEach(u => { userInfos[u.id] = u })
    }

    // Format watchers with user info
    const formattedWatchers = watchers.map(w => ({
      id: w.id,
      userId: w.userId,
      email: w.userId ? userInfos[w.userId]?.email || w.email : w.email,
      userName: w.userId ? userInfos[w.userId]?.name || null : null,
      addedBy: w.addedBy,
      createdAt: w.createdAt,
    }))

    res.json({ watchers: formattedWatchers })
  } catch (error) {
    console.error('Get ticket watchers error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add watcher to a ticket
ticketRoutes.post('/:id/watchers', async (req, res) => {
  try {
    const { id } = req.params
    const { userId: watcherUserId, email: watcherEmail } = req.body
    const { userId, tenantId, clientId, isInternal, role } = req.user!

    // Validate: either userId or email must be provided, not both
    if (!watcherUserId && !watcherEmail) {
      return res.status(400).json({ error: 'Either userId or email must be provided' })
    }
    if (watcherUserId && watcherEmail) {
      return res.status(400).json({ error: 'Cannot provide both userId and email' })
    }

    // Find ticket by id or issueKey
    const [ticket] = await db.select().from(tickets)
      .where(and(
        or(eq(tickets.id, id), eq(tickets.issueKey, id)),
        eq(tickets.tenantId, tenantId)
      ))
      .limit(1)

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Access check for viewing the ticket
    if (!isInternal) {
      if (role === 'company_admin') {
        if (ticket.clientId !== clientId) {
          return res.status(403).json({ error: 'Forbidden' })
        }
      } else {
        if (ticket.createdBy !== userId) {
          return res.status(403).json({ error: 'Forbidden' })
        }
      }
    }

    // Permission check for adding watchers
    if (watcherUserId) {
      // Adding a user watcher
      const isSelf = watcherUserId === userId

      if (isSelf) {
        // Any user can add themselves as a watcher
        // (internal users and client users who have access to the ticket)
      } else {
        // Adding someone else - need to be company_admin or internal
        if (!isInternal && role !== 'company_admin') {
          return res.status(403).json({ error: 'Only company admins can add other users as watchers' })
        }

        // Validate the user exists and belongs to the same company/tenant
        const [targetUser] = await db.select().from(users)
          .where(and(
            eq(users.id, watcherUserId),
            eq(users.tenantId, tenantId)
          ))
          .limit(1)

        if (!targetUser) {
          return res.status(404).json({ error: 'User not found' })
        }

        // For company_admin, ensure the target user belongs to their company
        if (!isInternal && role === 'company_admin') {
          if (targetUser.clientId !== clientId) {
            return res.status(403).json({ error: 'Cannot add users from other companies' })
          }
        }
      }
    } else {
      // Adding an external email watcher - only company_admin or internal can do this
      if (!isInternal && role !== 'company_admin') {
        return res.status(403).json({ error: 'Only company admins can add external email watchers' })
      }
    }

    // Check if watcher already exists
    let existingWatcher
    if (watcherUserId) {
      [existingWatcher] = await db.select().from(ticketWatchers)
        .where(and(
          eq(ticketWatchers.ticketId, ticket.id),
          eq(ticketWatchers.userId, watcherUserId)
        ))
        .limit(1)
    } else {
      [existingWatcher] = await db.select().from(ticketWatchers)
        .where(and(
          eq(ticketWatchers.ticketId, ticket.id),
          eq(ticketWatchers.email, watcherEmail)
        ))
        .limit(1)
    }

    if (existingWatcher) {
      return res.status(400).json({ error: 'This watcher already exists for this ticket' })
    }

    // Create the watcher
    const [watcher] = await db.insert(ticketWatchers).values({
      tenantId,
      ticketId: ticket.id,
      userId: watcherUserId || null,
      email: watcherEmail || null,
      addedBy: userId,
    }).returning()

    // Get user info if this is a user watcher
    let watcherUserInfo = null
    if (watcher.userId) {
      const [userInfo] = await db.select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, watcher.userId))
        .limit(1)
      watcherUserInfo = userInfo
    }

    res.status(201).json({
      watcher: {
        id: watcher.id,
        userId: watcher.userId,
        email: watcherUserInfo?.email || watcher.email,
        userName: watcherUserInfo?.name || null,
        addedBy: watcher.addedBy,
        createdAt: watcher.createdAt,
      }
    })
  } catch (error) {
    console.error('Add ticket watcher error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Remove watcher from a ticket
ticketRoutes.delete('/:id/watchers/:watcherId', async (req, res) => {
  try {
    const { id, watcherId } = req.params
    const { userId, tenantId, clientId, isInternal, role } = req.user!

    // Find ticket by id or issueKey
    const [ticket] = await db.select().from(tickets)
      .where(and(
        or(eq(tickets.id, id), eq(tickets.issueKey, id)),
        eq(tickets.tenantId, tenantId)
      ))
      .limit(1)

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Find the watcher
    const [watcher] = await db.select().from(ticketWatchers)
      .where(and(
        eq(ticketWatchers.id, parseInt(watcherId)),
        eq(ticketWatchers.ticketId, ticket.id),
        eq(ticketWatchers.tenantId, tenantId)
      ))
      .limit(1)

    if (!watcher) {
      return res.status(404).json({ error: 'Watcher not found' })
    }

    // Permission check for removing watchers
    const isSelf = watcher.userId === userId

    if (isSelf) {
      // Users can always remove themselves
    } else if (isInternal) {
      // Internal users can remove any watcher
    } else if (role === 'company_admin') {
      // Company admin can remove watchers from their company
      if (watcher.userId) {
        // Check if the watcher user belongs to the admin's company
        const [watcherUser] = await db.select().from(users)
          .where(eq(users.id, watcher.userId))
          .limit(1)

        if (watcherUser && watcherUser.clientId !== clientId) {
          return res.status(403).json({ error: 'Cannot remove watchers from other companies' })
        }
      }
      // External email watchers can be removed by company_admin if they added them
      // or if they're admin of the ticket's client
      if (!watcher.userId && ticket.clientId !== clientId) {
        return res.status(403).json({ error: 'Forbidden' })
      }
    } else {
      // Regular users can only remove themselves
      return res.status(403).json({ error: 'You can only remove yourself as a watcher' })
    }

    // Delete the watcher
    await db.delete(ticketWatchers)
      .where(eq(ticketWatchers.id, parseInt(watcherId)))

    res.json({ success: true })
  } catch (error) {
    console.error('Remove ticket watcher error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
