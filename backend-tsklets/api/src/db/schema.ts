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
  // Email domain for matching users (e.g., 'systech.com', 'acme.com')
  domain: text('domain'),
  // Client type: owner = tenant's own company, customer = paying client, partner = integration partner
  type: text('type', { enum: ['owner', 'customer', 'partner'] }).default('customer'),
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
  // Default team for dev tasks (optional)
  defaultImplementorId: integer('default_implementor_id').references(() => users.id),
  defaultDeveloperId: integer('default_developer_id').references(() => users.id),
  defaultTesterId: integer('default_tester_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
})

// Per-type sequence counters for issue keys (E001, F001, T001, B001, S001, etc.)
// Sequence is auto-created on first use for each product+type combination
export const productSequences = pgTable('product_sequences', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id).notNull(),
  // Type codes: E=Epic, F=Feature, T=Task, B=Bug, S=Support, R=Request(feature_request), N=Note, K=Spike
  issueType: text('issue_type', {
    enum: ['E', 'F', 'T', 'B', 'S', 'R', 'N', 'K']
  }).notNull(),
  nextNum: integer('next_num').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  uniqueProductType: unique().on(table.productId, table.issueType),
}))

// Global ticket counters for client portal (SUP-S###, SUP-F###)
export const globalTicketCounters = pgTable('global_ticket_counters', {
  id: serial('id').primaryKey(),
  // Type: S=Support, F=Feature_request
  type: text('type', { enum: ['S', 'F'] }).notNull(),
  nextNum: integer('next_num').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  uniqueType: unique().on(table.type),
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
// PRODUCT STRUCTURE: Modules, Components, Addons
// ========================================

// Modules (Product → Modules)
export const modules = pgTable('modules', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
})

// Components (Module → Components)
export const components = pgTable('components', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  moduleId: integer('module_id').references(() => modules.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
})

// Addons (Product → Addons)
export const addons = pgTable('addons', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
})

// ========================================
// TICKETS (Client Support & Internal Issues)
// ========================================
// Unified issue tracking with human-readable keys like TKL-S-001, HRMS-F-023

export const tickets = pgTable('tickets', {
  id: text('id').primaryKey(), // nanoUUID (e.g., 'abc123xyz')
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  clientId: integer('client_id').references(() => clients.id), // NULL for internal-only tickets
  productId: integer('product_id').references(() => products.id).notNull(),

  // Human-readable key (e.g., 'TKL-S-001', 'HRMS-F-023')
  issueKey: text('issue_key').unique().notNull(),

  // Beads integration
  beadsId: text('beads_id'), // Link to beads CLI issue for sync

  title: text('title').notNull(),
  description: text('description'),

  // Issue type with single-letter prefix for key generation
  // S=Support, R=Request (feature), E=Epic, F=Feature, T=Task, B=Bug, N=Note, K=Spike
  type: text('type', {
    enum: ['support', 'feature_request', 'epic', 'feature', 'task', 'bug', 'spike', 'note']
  }).default('support').notNull(),

  status: text('status', {
    enum: ['pending_internal_review', 'open', 'in_progress', 'waiting_for_customer', 'rebuttal', 'resolved', 'closed', 'reopened', 'cancelled']
  }).default('pending_internal_review'),

  // Priority & Severity (client-facing and internal)
  clientPriority: integer('client_priority').default(3),
  clientSeverity: integer('client_severity').default(3),
  internalPriority: integer('internal_priority'),
  internalSeverity: integer('internal_severity'),

  // Hierarchy: parent ticket for Epic→Feature→Task structure
  parentId: text('parent_id'), // References tickets.id (self-reference)

  // Ownership
  createdBy: integer('created_by').references(() => users.id), // Who created in system
  reporterId: integer('reporter_id').references(() => users.id), // Who reported the issue
  assignedTo: integer('assigned_to').references(() => users.id), // Primary assignee
  integratorId: integer('integrator_id').references(() => users.id),

  // Planning
  storyPoints: integer('story_points'), // Fibonacci: 1,2,3,5,8,13
  estimate: integer('estimate'), // Estimated hours
  dueDate: timestamp('due_date'),
  labels: text('labels').array(), // Tags for categorization

  // External links
  sourceIdeaId: integer('source_idea_id'), // Link to ideas.id
  largeFileLink: text('large_file_link'), // Dropbox/OneDrive/Google Drive link

  // Internal Triage & Escalation
  internalAssignedTo: integer('internal_assigned_to').references(() => users.id), // Company employee assigned for internal clarification
  escalationReason: text('escalation_reason', {
    enum: ['executive_request', 'production_down', 'compliance', 'customer_impact', 'other']
  }), // Required when escalating
  escalationNote: text('escalation_note'), // Additional context for escalation
  pushedToSystechAt: timestamp('pushed_to_systech_at'), // When ticket was pushed to Systech (SLA start)
  pushedToSystechBy: integer('pushed_to_systech_by').references(() => users.id), // Who pushed it

  // Dynamic fields
  metadata: jsonb('metadata'), // { customFields, stepsToReproduce, acceptanceCriteria, ... }

  // Resolution
  resolution: text('resolution', {
    enum: ['completed', 'duplicate', 'wont_do', 'moved', 'invalid', 'obsolete', 'cannot_reproduce']
  }),
  resolutionNote: text('resolution_note'),
  closedAt: timestamp('closed_at'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Ticket Links (blocks, blocked_by, relates_to, duplicates)
export const ticketLinks = pgTable('ticket_links', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  sourceTicketId: text('source_ticket_id').references(() => tickets.id).notNull(),
  targetTicketId: text('target_ticket_id').references(() => tickets.id).notNull(),
  linkType: text('link_type', {
    enum: ['blocks', 'blocked_by', 'relates_to', 'duplicates', 'duplicated_by', 'parent_of', 'child_of']
  }).notNull(),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  uniqueLink: unique().on(table.sourceTicketId, table.targetTicketId, table.linkType),
}))

// Attachment
export const attachments = pgTable('attachments', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  ticketId: text('ticket_id').references(() => tickets.id), // nanoUUID reference
  fileUrl: text('file_url').notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'), // e.g., 'image/png', 'video/mp4'
  createdAt: timestamp('created_at').defaultNow(),
})

// Ticket Comment
export const ticketComments = pgTable('ticket_comments', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  ticketId: text('ticket_id').references(() => tickets.id), // nanoUUID reference
  userId: integer('user_id').references(() => users.id),
  content: text('content').notNull(),
  isInternal: boolean('is_internal').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

// Ticket Watchers (for notifications - users or external emails)
export const ticketWatchers = pgTable('ticket_watchers', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  ticketId: text('ticket_id').references(() => tickets.id).notNull(), // nanoUUID reference
  userId: integer('user_id').references(() => users.id), // NULL if external email
  email: text('email'), // For non-users (external email watchers)
  addedBy: integer('added_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// Ticket Audit Log (changelog/history)
export const ticketAuditLog = pgTable('ticket_audit_log', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  ticketId: text('ticket_id').references(() => tickets.id).notNull(),
  changeType: text('change_type', {
    enum: ['created', 'status_changed', 'priority_changed', 'severity_changed',
           'comment_added', 'attachment_added', 'watcher_added', 'watcher_removed',
           'escalated', 'assigned', 'pushed_to_systech', 'resolved', 'reopened']
  }).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  metadata: jsonb('metadata'), // Extra info: fileName, escalationReason, etc.
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
  productId: integer('product_id').references(() => products.id).notNull(), // For issue key generation
  featureId: integer('feature_id').references(() => features.id), // Optional - can be linked later
  issueKey: text('issue_key').unique(), // e.g., 'CRM-T001' or 'CRM-B001'
  beadsId: text('beads_id'), // Link to beads CLI issue
  sprintId: integer('sprint_id'), // null = backlog, set = assigned to sprint
  parentTaskId: integer('parent_task_id'), // For subtasks (self-reference)
  title: text('title').notNull(),
  description: text('description'),
  type: text('type', {
    enum: ['task', 'bug']
  }).default('task'),
  status: text('status', {
    enum: ['todo', 'in_progress', 'review', 'testing', 'blocked', 'done']
  }).default('todo'),
  priority: integer('priority').default(3),
  storyPoints: integer('story_points'), // Fibonacci: 1,2,3,5,8,13
  createdBy: integer('created_by').references(() => users.id), // Who created
  reporterId: integer('reporter_id').references(() => users.id), // Who reported (for bugs)
  // Role assignments for dev task workflow
  implementorId: integer('implementor_id').references(() => users.id), // Overall responsible
  developerId: integer('developer_id').references(() => users.id), // Codes the fix
  testerId: integer('tester_id').references(() => users.id), // Tests the fix
  // Product structure links
  moduleId: integer('module_id').references(() => modules.id), // Optional module
  componentId: integer('component_id').references(() => components.id), // Optional component
  addonId: integer('addon_id').references(() => addons.id), // Optional addon
  // Direct link to support ticket (in addition to support_ticket_tasks join table)
  supportTicketId: text('support_ticket_id').references(() => tickets.id), // Source support ticket
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
  ticketId: text('ticket_id').references(() => tickets.id).notNull(), // nanoUUID reference
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
  ticketId: text('ticket_id').references(() => tickets.id).notNull(), // nanoUUID reference
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
// AI CONFIGS (Prompt Registry)
// ========================================
// Store and manage Claude Code configurations:
// - Prompts (system, templates, chains)
// - Skills (slash commands)
// - Hooks (pre/post triggers)
// - Status lines, MCP configs, etc.

// Main AI Config entity
export const aiConfigs = pgTable('ai_configs', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),

  // Identification
  name: text('name').notNull(),
  slug: text('slug').notNull(), // URL-friendly unique identifier within tenant
  description: text('description'),

  // Content
  content: text('content').notNull(), // The actual config content
  contentType: text('content_type', {
    enum: ['json', 'yaml', 'markdown', 'text']
  }).default('text'),

  // Variables extracted from content (auto-detected {{variable}} patterns)
  variables: jsonb('variables'), // Array of { name: string, description?: string, defaultValue?: string }

  // Visibility
  visibility: text('visibility', {
    enum: ['private', 'team', 'public']
  }).default('private'),
  teamId: integer('team_id').references(() => teams.id), // Required when visibility = 'team'

  // Ownership
  createdBy: integer('created_by').references(() => users.id).notNull(),

  // Version tracking
  activeVersionId: integer('active_version_id'), // Points to ai_config_versions.id

  // Stats
  forkCount: integer('fork_count').default(0),
  usageCount: integer('usage_count').default(0),
  favoriteCount: integer('favorite_count').default(0),

  // Fork lineage
  forkedFromId: integer('forked_from_id'), // Self-reference to aiConfigs.id

  // Metadata for flexible fields
  metadata: jsonb('metadata'), // { icon?, color?, category?, etc. }

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  uniqueSlug: unique().on(table.tenantId, table.slug),
}))

// Version history for AI configs
export const aiConfigVersions = pgTable('ai_config_versions', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  configId: integer('config_id').references(() => aiConfigs.id).notNull(),

  version: integer('version').notNull(), // Incremental: 1, 2, 3...
  content: text('content').notNull(),
  contentType: text('content_type', {
    enum: ['json', 'yaml', 'markdown', 'text']
  }).default('text'),
  variables: jsonb('variables'),

  // Change tracking
  changeNote: text('change_note'), // "Updated system prompt", "Fixed variable syntax"
  createdBy: integer('created_by').references(() => users.id).notNull(),

  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  uniqueVersion: unique().on(table.configId, table.version),
}))

// Reusable tags for organizing configs
export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  color: text('color'), // Hex color for UI display
  description: text('description'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  uniqueTagSlug: unique().on(table.tenantId, table.slug),
}))

// Join table: AI configs ↔ tags
export const aiConfigTags = pgTable('ai_config_tags', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  configId: integer('config_id').references(() => aiConfigs.id).notNull(),
  tagId: integer('tag_id').references(() => tags.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  uniqueConfigTag: unique().on(table.configId, table.tagId),
}))

// User favorites for quick access
export const aiConfigFavorites = pgTable('ai_config_favorites', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  configId: integer('config_id').references(() => aiConfigs.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  uniqueFavorite: unique().on(table.configId, table.userId),
}))

// API keys for external app access
export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),

  name: text('name').notNull(), // "Claude Code CLI", "My Script"
  keyHash: text('key_hash').notNull(), // SHA-256 hash of the actual key
  keyPrefix: text('key_prefix').notNull(), // First 8 chars for identification: "tk_abc123..."

  // Permissions
  scopes: text('scopes').array(), // ['read:configs', 'read:public', 'execute']

  // Rate limiting
  rateLimit: integer('rate_limit').default(1000), // Requests per hour

  // Status
  isActive: boolean('is_active').default(true),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'), // Optional expiration

  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// Usage analytics and logging
export const aiConfigUsage = pgTable('ai_config_usage', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id).notNull(),
  configId: integer('config_id').references(() => aiConfigs.id).notNull(),
  versionId: integer('version_id').references(() => aiConfigVersions.id),

  // Who used it
  userId: integer('user_id').references(() => users.id), // NULL for API key access
  apiKeyId: integer('api_key_id').references(() => apiKeys.id), // NULL for UI access

  // Context
  action: text('action', {
    enum: ['view', 'execute', 'copy', 'fork', 'export']
  }).notNull(),

  // Request info
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),

  createdAt: timestamp('created_at').defaultNow(),
})

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
  modules: many(modules),
  addons: many(addons),
}))

export const modulesRelations = relations(modules, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [modules.tenantId],
    references: [tenants.id],
  }),
  product: one(products, {
    fields: [modules.productId],
    references: [products.id],
  }),
  components: many(components),
}))

export const componentsRelations = relations(components, ({ one }) => ({
  tenant: one(tenants, {
    fields: [components.tenantId],
    references: [tenants.id],
  }),
  module: one(modules, {
    fields: [components.moduleId],
    references: [modules.id],
  }),
}))

export const addonsRelations = relations(addons, ({ one }) => ({
  tenant: one(tenants, {
    fields: [addons.tenantId],
    references: [tenants.id],
  }),
  product: one(products, {
    fields: [addons.productId],
    references: [products.id],
  }),
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

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
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
  assignee: one(users, {
    fields: [tickets.assignedTo],
    references: [users.id],
  }),
  product: one(products, {
    fields: [tickets.productId],
    references: [products.id],
  }),
  // Hierarchy: parent ticket (Epic→Feature→Task)
  parent: one(tickets, {
    fields: [tickets.parentId],
    references: [tickets.id],
    relationName: 'parentChild',
  }),
  children: many(tickets, { relationName: 'parentChild' }),
  // Links: blocks, relates_to, etc.
  outgoingLinks: many(ticketLinks, { relationName: 'sourceLinks' }),
  incomingLinks: many(ticketLinks, { relationName: 'targetLinks' }),
  // Attachments & comments
  attachments: many(attachments),
  comments: many(ticketComments),
  watchers: many(ticketWatchers),
  // Internal assignment (for company internal triage)
  internalAssignee: one(users, {
    fields: [tickets.internalAssignedTo],
    references: [users.id],
  }),
}))

export const ticketLinksRelations = relations(ticketLinks, ({ one }) => ({
  tenant: one(tenants, {
    fields: [ticketLinks.tenantId],
    references: [tenants.id],
  }),
  sourceTicket: one(tickets, {
    fields: [ticketLinks.sourceTicketId],
    references: [tickets.id],
    relationName: 'sourceLinks',
  }),
  targetTicket: one(tickets, {
    fields: [ticketLinks.targetTicketId],
    references: [tickets.id],
    relationName: 'targetLinks',
  }),
  creator: one(users, {
    fields: [ticketLinks.createdBy],
    references: [users.id],
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
  product: one(products, {
    fields: [devTasks.productId],
    references: [products.id],
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
  // Role assignments
  implementor: one(users, {
    fields: [devTasks.implementorId],
    references: [users.id],
  }),
  developer: one(users, {
    fields: [devTasks.developerId],
    references: [users.id],
  }),
  tester: one(users, {
    fields: [devTasks.testerId],
    references: [users.id],
  }),
  // Product structure
  module: one(modules, {
    fields: [devTasks.moduleId],
    references: [modules.id],
  }),
  component: one(components, {
    fields: [devTasks.componentId],
    references: [components.id],
  }),
  addon: one(addons, {
    fields: [devTasks.addonId],
    references: [addons.id],
  }),
  // Source support ticket
  supportTicket: one(tickets, {
    fields: [devTasks.supportTicketId],
    references: [tickets.id],
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

export const ticketWatchersRelations = relations(ticketWatchers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [ticketWatchers.tenantId],
    references: [tenants.id],
  }),
  ticket: one(tickets, {
    fields: [ticketWatchers.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [ticketWatchers.userId],
    references: [users.id],
  }),
  addedByUser: one(users, {
    fields: [ticketWatchers.addedBy],
    references: [users.id],
  }),
}))

export const ticketAuditLogRelations = relations(ticketAuditLog, ({ one }) => ({
  tenant: one(tenants, {
    fields: [ticketAuditLog.tenantId],
    references: [tenants.id],
  }),
  ticket: one(tickets, {
    fields: [ticketAuditLog.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [ticketAuditLog.userId],
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

// AI Configs Relations
export const aiConfigsRelations = relations(aiConfigs, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [aiConfigs.tenantId],
    references: [tenants.id],
  }),
  creator: one(users, {
    fields: [aiConfigs.createdBy],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [aiConfigs.teamId],
    references: [teams.id],
  }),
  forkedFrom: one(aiConfigs, {
    fields: [aiConfigs.forkedFromId],
    references: [aiConfigs.id],
  }),
  versions: many(aiConfigVersions),
  tags: many(aiConfigTags),
  favorites: many(aiConfigFavorites),
  usage: many(aiConfigUsage),
}))

export const aiConfigVersionsRelations = relations(aiConfigVersions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [aiConfigVersions.tenantId],
    references: [tenants.id],
  }),
  config: one(aiConfigs, {
    fields: [aiConfigVersions.configId],
    references: [aiConfigs.id],
  }),
  creator: one(users, {
    fields: [aiConfigVersions.createdBy],
    references: [users.id],
  }),
}))

export const tagsRelations = relations(tags, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [tags.tenantId],
    references: [tenants.id],
  }),
  creator: one(users, {
    fields: [tags.createdBy],
    references: [users.id],
  }),
  configTags: many(aiConfigTags),
}))

export const aiConfigTagsRelations = relations(aiConfigTags, ({ one }) => ({
  tenant: one(tenants, {
    fields: [aiConfigTags.tenantId],
    references: [tenants.id],
  }),
  config: one(aiConfigs, {
    fields: [aiConfigTags.configId],
    references: [aiConfigs.id],
  }),
  tag: one(tags, {
    fields: [aiConfigTags.tagId],
    references: [tags.id],
  }),
}))

export const aiConfigFavoritesRelations = relations(aiConfigFavorites, ({ one }) => ({
  tenant: one(tenants, {
    fields: [aiConfigFavorites.tenantId],
    references: [tenants.id],
  }),
  config: one(aiConfigs, {
    fields: [aiConfigFavorites.configId],
    references: [aiConfigs.id],
  }),
  user: one(users, {
    fields: [aiConfigFavorites.userId],
    references: [users.id],
  }),
}))

export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [apiKeys.tenantId],
    references: [tenants.id],
  }),
  creator: one(users, {
    fields: [apiKeys.createdBy],
    references: [users.id],
  }),
  usage: many(aiConfigUsage),
}))

export const aiConfigUsageRelations = relations(aiConfigUsage, ({ one }) => ({
  tenant: one(tenants, {
    fields: [aiConfigUsage.tenantId],
    references: [tenants.id],
  }),
  config: one(aiConfigs, {
    fields: [aiConfigUsage.configId],
    references: [aiConfigs.id],
  }),
  version: one(aiConfigVersions, {
    fields: [aiConfigUsage.versionId],
    references: [aiConfigVersions.id],
  }),
  user: one(users, {
    fields: [aiConfigUsage.userId],
    references: [users.id],
  }),
  apiKey: one(apiKeys, {
    fields: [aiConfigUsage.apiKeyId],
    references: [apiKeys.id],
  }),
}))
