import { pgTable, text, integer, serial, boolean, timestamp, unique, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ========================================
// MULTI-TENANT SAAS ARCHITECTURE
// ========================================
// Tenant = Owner company (SaaS customer who pays)
// Client = Customer OF the tenant (tenant's customer)
// Internal User = Tenant's team (client_id = NULL)
// Client User = End user belonging to a client

// ========================================
// CORE: TENANTS (SaaS Customers / Owners)
// ========================================

export const tenants = pgTable('tenants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  plan: text('plan', { enum: ['free', 'starter', 'business', 'enterprise'] }).default('starter'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

// ========================================
// CLIENTS (Tenant's Customers)
// ========================================

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  name: text('name').notNull(),
  tier: text('tier', { enum: ['enterprise', 'business', 'starter'] }).default('starter'),
  gatekeeperEnabled: boolean('gatekeeper_enabled').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

// ========================================
// USERS
// ========================================
// client_id = NULL → Internal user (tenant's team)
// client_id = X → Client user

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  clientId: integer('client_id').references(() => clients.id), // NULL = internal user
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role', {
    enum: ['user', 'gatekeeper', 'company_admin', 'approver', 'integrator', 'support', 'ceo', 'admin', 'developer']
  }).default('user'),
  isActive: boolean('is_active').default(true),
  requirePasswordChange: boolean('require_password_change').default(true), // Force password change on first login or after reset
  createdAt: timestamp('created_at').defaultNow(),
})

// ========================================
// PRODUCTS (Owned by Tenant)
// ========================================

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  name: text('name').notNull(),
  code: text('code').notNull(), // e.g., 'TSKLTS', 'CSUP' - used for issue keys
  description: text('description'),
  nextIssueNum: integer('next_issue_num').default(1), // Legacy: shared sequence (deprecated)
  createdAt: timestamp('created_at').defaultNow(),
})

// Per-type sequence counters for issue keys (E001, F001, T001, B001, R001)
export const productSequences = pgTable('product_sequences', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id).notNull(),
  issueType: text('issue_type', {
    enum: ['E', 'F', 'T', 'B', 'S', 'N', 'R'] // Epic, Feature, Task, Bug, Spike, Note, Requirement
  }).notNull(),
  nextNum: integer('next_num').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  uniqueProductType: unique().on(table.productId, table.issueType),
}))

// Client-Product assignment (what products client purchased)
export const clientProducts = pgTable('client_products', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// User-Product assignment (which products user can access)
export const userProducts = pgTable('user_products', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// ========================================
// TICKETS (Client Support)
// ========================================

export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type', {
    enum: ['support', 'feature_request']
  }).default('support'), // Support ticket or feature request
  status: text('status', {
    enum: ['open', 'in_progress', 'resolved', 'closed']
  }).default('open'),
  clientPriority: integer('client_priority').default(3),
  clientSeverity: integer('client_severity').default(3),
  internalPriority: integer('internal_priority'),
  internalSeverity: integer('internal_severity'),
  productId: integer('product_id').references(() => products.id),
  createdBy: integer('created_by').references(() => users.id), // Who entered in system
  reporterId: integer('reporter_id').references(() => users.id), // Who reported the issue
  assignedTo: integer('assigned_to').references(() => users.id), // Internal assignee
  integratorId: integer('integrator_id').references(() => users.id),
  sourceIdeaId: integer('source_idea_id'), // Will reference ideas.id
  largeFileLink: text('large_file_link'), // Dropbox/OneDrive/Google Drive link for large files
  metadata: jsonb('metadata'), // Dynamic fields: { customField1, customField2, ... }
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Attachment
export const attachments = pgTable('attachments', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  ticketId: integer('ticket_id').references(() => tickets.id),
  fileUrl: text('file_url').notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size'),
  createdAt: timestamp('created_at').defaultNow(),
})

// Ticket Comment
export const ticketComments = pgTable('ticket_comments', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  ticketId: integer('ticket_id').references(() => tickets.id),
  userId: integer('user_id').references(() => users.id),
  content: text('content').notNull(),
  isInternal: boolean('is_internal').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

// ========================================
// DEV ARTIFACTS (Internal to Tenant)
// ========================================

// Epic (Internal development planning)
export const epics = pgTable('epics', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  issueKey: text('issue_key').unique(), // e.g., 'TSKLTS-E001'
  beadsId: text('beads_id'), // Link to beads CLI issue
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', {
    enum: ['backlog', 'planned', 'in_progress', 'completed', 'cancelled']
  }).default('backlog'),
  priority: integer('priority').default(3),
  createdBy: integer('created_by').references(() => users.id), // Who created
  ownerId: integer('owner_id').references(() => users.id), // Product owner/lead
  // Planning fields
  targetDate: timestamp('target_date'), // Target release/completion date
  startDate: timestamp('start_date'), // When work actually started
  labels: text('labels').array(), // Tags for categorization
  color: text('color'), // Visual identifier for boards/roadmaps
  progress: integer('progress').default(0), // % complete (0-100)
  // Dynamic fields
  metadata: jsonb('metadata'), // { roadmapLink, externalLinks, customFields, ... }
  // Resolution
  resolution: text('resolution', {
    enum: ['completed', 'duplicate', 'wont_do', 'moved', 'invalid', 'obsolete']
  }),
  resolutionNote: text('resolution_note'),
  closedAt: timestamp('closed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Feature (Part of an Epic)
export const features = pgTable('features', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  epicId: integer('epic_id').references(() => epics.id).notNull(),
  issueKey: text('issue_key').unique(), // e.g., 'TSKLTS-F001'
  beadsId: text('beads_id'), // Link to beads CLI issue
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', {
    enum: ['backlog', 'planned', 'in_progress', 'completed', 'cancelled']
  }).default('backlog'),
  priority: integer('priority').default(3),
  createdBy: integer('created_by').references(() => users.id), // Who created
  ownerId: integer('owner_id').references(() => users.id), // Feature owner
  // Planning fields
  targetDate: timestamp('target_date'), // Target completion date
  startDate: timestamp('start_date'), // When work started
  acceptanceCriteria: text('acceptance_criteria'), // Definition of done
  labels: text('labels').array(), // Tags for categorization
  estimate: integer('estimate'), // Estimated story points (sum of tasks)
  // Dynamic fields
  metadata: jsonb('metadata'), // { designDoc, figmaLink, customFields, ... }
  // Resolution
  resolution: text('resolution', {
    enum: ['completed', 'duplicate', 'wont_do', 'moved', 'invalid', 'obsolete']
  }),
  resolutionNote: text('resolution_note'),
  closedAt: timestamp('closed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Dev Task (Task or Bug within a Feature)
export const devTasks = pgTable('dev_tasks', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  featureId: integer('feature_id').references(() => features.id).notNull(),
  issueKey: text('issue_key').unique(), // e.g., 'TSKLTS-T001' or 'TSKLTS-B001'
  beadsId: text('beads_id'), // Link to beads CLI issue
  sprintId: integer('sprint_id'), // null = backlog, set = assigned to sprint
  parentTaskId: integer('parent_task_id'), // For subtasks (self-reference)
  title: text('title').notNull(),
  description: text('description'),
  type: text('type', {
    enum: ['task', 'bug']
  }).default('task'),
  status: text('status', {
    enum: ['todo', 'in_progress', 'review', 'blocked', 'done']
  }).default('todo'),
  priority: integer('priority').default(3),
  storyPoints: integer('story_points'), // Fibonacci: 1,2,3,5,8,13
  createdBy: integer('created_by').references(() => users.id), // Who created
  reporterId: integer('reporter_id').references(() => users.id), // Who reported (for bugs)
  // Time tracking
  estimate: integer('estimate'), // Estimated hours
  actualTime: integer('actual_time'), // Actual hours spent
  dueDate: timestamp('due_date'), // Deadline
  // Organization
  labels: text('labels').array(), // Tags (e.g., "frontend", "backend", "urgent")
  blockedReason: text('blocked_reason'), // Why it's blocked (if status=blocked)
  // Bug-specific fields
  severity: text('severity', {
    enum: ['critical', 'major', 'minor', 'trivial']
  }), // Only for bugs
  environment: text('environment', {
    enum: ['production', 'staging', 'development', 'local']
  }), // Where bug was found
  // Dynamic fields - flexible JSONB for any type
  metadata: jsonb('metadata'), // {
    // Code stats: linesAdded, linesDeleted, filesChanged, commits[], pullRequest
    // Bug details: stepsToReproduce, expectedBehavior, actualBehavior, affectedVersion, fixVersion, rootCause
    // Task details: technicalNotes, dependencies, reviewers[]
    // Custom: any additional fields
  // }
  // Resolution
  resolution: text('resolution', {
    enum: ['completed', 'duplicate', 'wont_do', 'moved', 'invalid', 'obsolete', 'cannot_reproduce']
  }),
  resolutionNote: text('resolution_note'),
  closedAt: timestamp('closed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Task Assignment (many-to-many: tasks ↔ developers)
export const taskAssignments = pgTable('task_assignments', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  taskId: integer('task_id').references(() => devTasks.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// Support Ticket to Dev Task link (many-to-many)
export const supportTicketTasks = pgTable('support_ticket_tasks', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  ticketId: integer('ticket_id').references(() => tickets.id).notNull(),
  taskId: integer('task_id').references(() => devTasks.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// ========================================
// SPRINT PLANNING
// ========================================

// Sprint (2-week iteration)
export const sprints = pgTable('sprints', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  name: text('name').notNull(), // e.g., "Jan-I-26", "Feb-II-26"
  goal: text('goal'), // Sprint goal description
  startDate: timestamp('start_date').notNull(), // ISO date string
  endDate: timestamp('end_date').notNull(), // ISO date (2 weeks from start)
  status: text('status', {
    enum: ['planning', 'active', 'completed', 'cancelled']
  }).default('planning'),
  velocity: integer('velocity'), // Auto-calculated on completion
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Sprint Retrospective
export const sprintRetros = pgTable('sprint_retros', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  sprintId: integer('sprint_id').references(() => sprints.id).notNull(),
  wentWell: text('went_well'),
  improvements: text('improvements'),
  actionItems: text('action_items'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Sprint Capacity (per developer per sprint)
export const sprintCapacity = pgTable('sprint_capacity', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  sprintId: integer('sprint_id').references(() => sprints.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  availablePoints: integer('available_points').default(20),
  createdAt: timestamp('created_at').defaultNow(),
})

// ========================================
// SPARK: Idea Management
// ========================================

// Team (for idea visibility)
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  name: text('name').notNull(),
  productId: integer('product_id').references(() => products.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Team Members (many-to-many: users ↔ teams)
export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  teamId: integer('team_id').references(() => teams.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  role: text('role', { enum: ['member', 'lead'] }).default('member'),
  createdAt: timestamp('created_at').defaultNow(),
})

// Idea (SPARK core entity)
export const ideas = pgTable('ideas', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', {
    enum: ['inbox', 'discussing', 'vetted', 'in_progress', 'shipped', 'archived']
  }).default('inbox'),
  visibility: text('visibility', {
    enum: ['private', 'team', 'public']
  }).default('private'),
  teamId: integer('team_id').references(() => teams.id),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  publishedAt: timestamp('published_at'),
  voteCount: integer('vote_count').default(0),
  commentCount: integer('comment_count').default(0),
})

// Idea Comments
export const ideaComments = pgTable('idea_comments', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  ideaId: integer('idea_id').references(() => ideas.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Idea Reactions
export const ideaReactions = pgTable('idea_reactions', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  ideaId: integer('idea_id').references(() => ideas.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  reaction: text('reaction', {
    enum: ['thumbs_up', 'heart', 'fire']
  }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// Idea-Product link
export const ideaProducts = pgTable('idea_products', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  ideaId: integer('idea_id').references(() => ideas.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// Idea-Ticket link (lineage)
export const ideaTickets = pgTable('idea_tickets', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  ideaId: integer('idea_id').references(() => ideas.id).notNull(),
  ticketId: integer('ticket_id').references(() => tickets.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// ========================================
// REQUIREMENTS (Internal planning workflow)
// ========================================

// Requirement (CEO/BA creates, brainstorms with Claude, links to beads epic)
export const requirements = pgTable('requirements', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  issueKey: text('issue_key').unique(), // e.g., 'TSKLTS-R001'
  beadsId: text('beads_id'), // Link to beads CLI issue
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', {
    enum: ['draft', 'brainstorm', 'solidified', 'approved', 'in_development', 'implemented', 'cancelled']
  }).default('draft'),
  priority: integer('priority').default(3),
  // Content preservation
  originalDraft: text('original_draft'), // Preserved first draft
  claudeRewrite: text('claude_rewrite'), // Claude's structured version
  // Implementation tracking
  beadsEpicId: text('beads_epic_id'), // Link to created epic in beads
  // Ownership
  createdBy: integer('created_by').references(() => users.id),
  ownerId: integer('owner_id').references(() => users.id),
  // Collaboration
  brainstormParticipants: text('brainstorm_participants').array(), // User IDs as strings
  approvedBy: text('approved_by').array(), // User IDs as strings
  // Planning
  targetDate: timestamp('target_date'),
  labels: text('labels').array(),
  color: text('color'),
  // Workflow timestamps
  brainstormStartedAt: timestamp('brainstorm_started_at'),
  solidifiedAt: timestamp('solidified_at'),
  implementationStartedAt: timestamp('implementation_started_at'),
  completedAt: timestamp('completed_at'),
  // Dynamic fields
  metadata: jsonb('metadata'),
  // Resolution
  resolution: text('resolution', {
    enum: ['completed', 'duplicate', 'wont_do', 'moved', 'invalid', 'obsolete']
  }),
  resolutionNote: text('resolution_note'),
  closedAt: timestamp('closed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Requirement Amendment (evolving requirements without creating new requirement)
export const requirementAmendments = pgTable('requirement_amendments', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  requirementId: integer('requirement_id').references(() => requirements.id).notNull(),
  amendmentNumber: integer('amendment_number').notNull(), // 1, 2, 3...
  title: text('title').notNull(),
  description: text('description'),
  businessJustification: text('business_justification'),
  urgency: text('urgency', {
    enum: ['critical', 'high', 'medium', 'low']
  }).default('medium'),
  status: text('status', {
    enum: ['amendment_draft', 'amendment_brainstorm', 'amendment_solidified', 'amendment_in_development', 'amendment_completed']
  }).default('amendment_draft'),
  // Implementation tracking
  beadsFeatureId: text('beads_feature_id'), // Link to created feature in beads
  // Approval
  approvedBy: text('approved_by').array(),
  approvedAt: timestamp('approved_at'),
  // Ownership
  requestedBy: integer('requested_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  uniqueAmendmentNumber: unique().on(table.requirementId, table.amendmentNumber),
}))

// ========================================
// RELATIONS
// ========================================

export const tenantsRelations = relations(tenants, ({ many }) => ({
  clients: many(clients),
  users: many(users),
  products: many(products),
  sprints: many(sprints),
}))

export const clientsRelations = relations(clients, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [clients.tenantId],
    references: [tenants.id],
  }),
  users: many(users),
  tickets: many(tickets),
  clientProducts: many(clientProducts),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  client: one(clients, {
    fields: [users.clientId],
    references: [clients.id],
  }),
  userProducts: many(userProducts),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  clientProducts: many(clientProducts),
  userProducts: many(userProducts),
}))

export const clientProductsRelations = relations(clientProducts, ({ one }) => ({
  tenant: one(tenants, {
    fields: [clientProducts.tenantId],
    references: [tenants.id],
  }),
  client: one(clients, {
    fields: [clientProducts.clientId],
    references: [clients.id],
  }),
  product: one(products, {
    fields: [clientProducts.productId],
    references: [products.id],
  }),
}))

export const userProductsRelations = relations(userProducts, ({ one }) => ({
  tenant: one(tenants, {
    fields: [userProducts.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [userProducts.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [userProducts.productId],
    references: [products.id],
  }),
}))

export const ticketsRelations = relations(tickets, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tickets.tenantId],
    references: [tenants.id],
  }),
  client: one(clients, {
    fields: [tickets.clientId],
    references: [clients.id],
  }),
  creator: one(users, {
    fields: [tickets.createdBy],
    references: [users.id],
  }),
  reporter: one(users, {
    fields: [tickets.reporterId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [tickets.productId],
    references: [products.id],
  }),
}))

export const epicsRelations = relations(epics, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [epics.tenantId],
    references: [tenants.id],
  }),
  product: one(products, {
    fields: [epics.productId],
    references: [products.id],
  }),
  creator: one(users, {
    fields: [epics.createdBy],
    references: [users.id],
  }),
  owner: one(users, {
    fields: [epics.ownerId],
    references: [users.id],
  }),
  features: many(features),
}))

export const featuresRelations = relations(features, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [features.tenantId],
    references: [tenants.id],
  }),
  epic: one(epics, {
    fields: [features.epicId],
    references: [epics.id],
  }),
  creator: one(users, {
    fields: [features.createdBy],
    references: [users.id],
  }),
  owner: one(users, {
    fields: [features.ownerId],
    references: [users.id],
  }),
  tasks: many(devTasks),
}))

export const devTasksRelations = relations(devTasks, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [devTasks.tenantId],
    references: [tenants.id],
  }),
  feature: one(features, {
    fields: [devTasks.featureId],
    references: [features.id],
  }),
  sprint: one(sprints, {
    fields: [devTasks.sprintId],
    references: [sprints.id],
  }),
  parentTask: one(devTasks, {
    fields: [devTasks.parentTaskId],
    references: [devTasks.id],
  }),
  creator: one(users, {
    fields: [devTasks.createdBy],
    references: [users.id],
  }),
  reporter: one(users, {
    fields: [devTasks.reporterId],
    references: [users.id],
  }),
  assignments: many(taskAssignments),
  subtasks: many(devTasks),
}))

export const sprintsRelations = relations(sprints, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [sprints.tenantId],
    references: [tenants.id],
  }),
  tasks: many(devTasks),
  capacities: many(sprintCapacity),
  retro: one(sprintRetros),
}))

export const sprintRetrosRelations = relations(sprintRetros, ({ one }) => ({
  tenant: one(tenants, {
    fields: [sprintRetros.tenantId],
    references: [tenants.id],
  }),
  sprint: one(sprints, {
    fields: [sprintRetros.sprintId],
    references: [sprints.id],
  }),
}))

export const sprintCapacityRelations = relations(sprintCapacity, ({ one }) => ({
  tenant: one(tenants, {
    fields: [sprintCapacity.tenantId],
    references: [tenants.id],
  }),
  sprint: one(sprints, {
    fields: [sprintCapacity.sprintId],
    references: [sprints.id],
  }),
  user: one(users, {
    fields: [sprintCapacity.userId],
    references: [users.id],
  }),
}))

export const teamsRelations = relations(teams, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [teams.tenantId],
    references: [tenants.id],
  }),
  product: one(products, {
    fields: [teams.productId],
    references: [products.id],
  }),
  members: many(teamMembers),
  ideas: many(ideas),
}))

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [teamMembers.tenantId],
    references: [tenants.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}))

export const ideasRelations = relations(ideas, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [ideas.tenantId],
    references: [tenants.id],
  }),
  team: one(teams, {
    fields: [ideas.teamId],
    references: [teams.id],
  }),
  creator: one(users, {
    fields: [ideas.createdBy],
    references: [users.id],
  }),
  comments: many(ideaComments),
  reactions: many(ideaReactions),
  products: many(ideaProducts),
  tickets: many(ideaTickets),
}))

export const ideaCommentsRelations = relations(ideaComments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [ideaComments.tenantId],
    references: [tenants.id],
  }),
  idea: one(ideas, {
    fields: [ideaComments.ideaId],
    references: [ideas.id],
  }),
  user: one(users, {
    fields: [ideaComments.userId],
    references: [users.id],
  }),
}))

export const ideaReactionsRelations = relations(ideaReactions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [ideaReactions.tenantId],
    references: [tenants.id],
  }),
  idea: one(ideas, {
    fields: [ideaReactions.ideaId],
    references: [ideas.id],
  }),
  user: one(users, {
    fields: [ideaReactions.userId],
    references: [users.id],
  }),
}))

export const ideaProductsRelations = relations(ideaProducts, ({ one }) => ({
  tenant: one(tenants, {
    fields: [ideaProducts.tenantId],
    references: [tenants.id],
  }),
  idea: one(ideas, {
    fields: [ideaProducts.ideaId],
    references: [ideas.id],
  }),
  product: one(products, {
    fields: [ideaProducts.productId],
    references: [products.id],
  }),
}))

export const ideaTicketsRelations = relations(ideaTickets, ({ one }) => ({
  tenant: one(tenants, {
    fields: [ideaTickets.tenantId],
    references: [tenants.id],
  }),
  idea: one(ideas, {
    fields: [ideaTickets.ideaId],
    references: [ideas.id],
  }),
  ticket: one(tickets, {
    fields: [ideaTickets.ticketId],
    references: [tickets.id],
  }),
}))

export const taskAssignmentsRelations = relations(taskAssignments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [taskAssignments.tenantId],
    references: [tenants.id],
  }),
  task: one(devTasks, {
    fields: [taskAssignments.taskId],
    references: [devTasks.id],
  }),
  user: one(users, {
    fields: [taskAssignments.userId],
    references: [users.id],
  }),
}))

export const supportTicketTasksRelations = relations(supportTicketTasks, ({ one }) => ({
  tenant: one(tenants, {
    fields: [supportTicketTasks.tenantId],
    references: [tenants.id],
  }),
  ticket: one(tickets, {
    fields: [supportTicketTasks.ticketId],
    references: [tickets.id],
  }),
  task: one(devTasks, {
    fields: [supportTicketTasks.taskId],
    references: [devTasks.id],
  }),
}))

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [attachments.tenantId],
    references: [tenants.id],
  }),
  ticket: one(tickets, {
    fields: [attachments.ticketId],
    references: [tickets.id],
  }),
}))

export const ticketCommentsRelations = relations(ticketComments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [ticketComments.tenantId],
    references: [tenants.id],
  }),
  ticket: one(tickets, {
    fields: [ticketComments.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [ticketComments.userId],
    references: [users.id],
  }),
}))

export const requirementsRelations = relations(requirements, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [requirements.tenantId],
    references: [tenants.id],
  }),
  product: one(products, {
    fields: [requirements.productId],
    references: [products.id],
  }),
  creator: one(users, {
    fields: [requirements.createdBy],
    references: [users.id],
  }),
  owner: one(users, {
    fields: [requirements.ownerId],
    references: [users.id],
  }),
  amendments: many(requirementAmendments),
}))

export const requirementAmendmentsRelations = relations(requirementAmendments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [requirementAmendments.tenantId],
    references: [tenants.id],
  }),
  requirement: one(requirements, {
    fields: [requirementAmendments.requirementId],
    references: [requirements.id],
  }),
  requester: one(users, {
    fields: [requirementAmendments.requestedBy],
    references: [users.id],
  }),
}))
