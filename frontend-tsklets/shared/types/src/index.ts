// Tenant (SaaS Owner Company)
export interface Tenant {
  id: number
  name: string
  plan: 'free' | 'starter' | 'business' | 'enterprise'
  isActive: boolean
  createdAt: string
}

// Client (Customer of Tenant)
export interface Client {
  id: number
  tenantId: number
  name: string
  tier: 'enterprise' | 'business' | 'starter'
  gatekeeperEnabled: boolean
  isActive: boolean
  createdAt: string
}

// User
export interface User {
  id: number
  email: string
  name: string
  role: UserRole
  tenantId: number
  clientId: number | null  // null = internal user
  isInternal: boolean      // Convenience: clientId === null
  requirePasswordChange?: boolean  // Force password change on first login
  createdAt?: string
  tenant?: Tenant
}

export type UserRole =
  | 'user'
  | 'gatekeeper'
  | 'company_admin'
  | 'approver'
  | 'integrator'
  | 'support'
  | 'ceo'
  | 'admin'
  | 'developer'

// Ticket
export interface Ticket {
  id: number | string
  title: string
  description?: string
  type?: 'support' | 'feature_request' | 'epic' | 'feature' | 'task' | 'bug' | 'spike' | 'note'
  status: TicketStatus
  clientPriority: number
  clientSeverity: number
  internalPriority?: number
  internalSeverity?: number
  productId?: number
  productName?: string
  userId: number
  createdBy?: number
  createdByName?: string  // Name of the user who created the ticket
  reporterId?: number  // ID of the reporter (same as createdBy)
  reporterName?: string  // Name of the reporter
  assignedTo?: number
  integratorId?: number
  tenantId: number
  clientId?: number  // Which client created the ticket
  // Escalation fields
  escalationReason?: EscalationReason
  escalationNote?: string
  pushedToSystechAt?: string  // When ticket was pushed/escalated to Systech (SLA start)
  pushedToSystechBy?: number  // Who pushed it
  labels?: string[]  // Includes 'escalated', 'reassigned_to_internal', 'created_by_systech'
  // Other fields
  issueKey?: string
  dueDate?: string
  storyPoints?: number
  estimate?: string
  resolution?: string
  resolutionNote?: string
  // Aggregated counts (populated by list APIs)
  commentCount?: number
  attachmentCount?: number
  createdAt: string
  updatedAt: string
}

export type TicketStatus = 'pending_internal_review' | 'open' | 'in_progress' | 'waiting_for_customer' | 'rebuttal' | 'resolved' | 'closed' | 'reopened' | 'cancelled'

export type EscalationReason = 'executive_request' | 'production_down' | 'compliance' | 'customer_impact' | 'other'

// Watcher on a ticket
export interface TicketWatcher {
  id: number
  ticketId: number
  userId: number
  user?: {
    id: number
    name: string
    email: string
  }
  createdAt: string
}

// Attachment
export interface Attachment {
  id: number
  ticketId: number
  fileUrl: string
  fileName: string
  fileSize?: number
  createdAt: string
}

// Comment
export interface TicketComment {
  id: number
  ticketId: number
  userId: number
  content: string
  isInternal: boolean
  createdAt: string
}

// Epic (Development planning)
export interface Epic {
  id: number
  tenantId: number
  productId: number
  issueKey?: string
  title: string
  description?: string | null
  status: 'backlog' | 'planned' | 'in_progress' | 'completed' | 'cancelled'
  priority: number
  // New fields
  createdBy?: number | null
  ownerId?: number | null
  targetDate?: string | null
  startDate?: string | null
  labels?: string[] | null
  color?: string | null
  progress?: number | null
  // Resolution
  resolution?: string | null
  resolutionNote?: string | null
  closedAt?: string | null
  // Flexible metadata
  metadata?: Record<string, any> | null
  createdAt: string
  updatedAt: string
}

// Feature (Part of an Epic)
export interface Feature {
  id: number
  tenantId: number
  epicId: number
  issueKey?: string
  title: string
  description?: string | null
  status: 'backlog' | 'planned' | 'in_progress' | 'completed' | 'cancelled'
  priority: number
  // New fields
  createdBy?: number | null
  ownerId?: number | null
  targetDate?: string | null
  startDate?: string | null
  acceptanceCriteria?: string | null
  labels?: string[] | null
  estimate?: number | null  // story points
  // Resolution
  resolution?: string | null
  resolutionNote?: string | null
  closedAt?: string | null
  // Flexible metadata
  metadata?: Record<string, any> | null
  createdAt: string
  updatedAt: string
}

export type EpicStatus = 'backlog' | 'planned' | 'in_progress' | 'completed' | 'cancelled'
export type FeatureStatus = 'backlog' | 'planned' | 'in_progress' | 'completed' | 'cancelled'

// Requirement (Internal planning workflow)
export interface Requirement {
  id: number
  tenantId: number
  productId: number
  issueKey?: string
  beadsId?: string | null
  title: string
  description?: string | null
  status: RequirementStatus
  priority: number
  // Content preservation
  originalDraft?: string | null
  claudeRewrite?: string | null
  // Implementation tracking
  beadsEpicId?: string | null
  // Ownership
  createdBy?: number | null
  ownerId?: number | null
  // Collaboration
  brainstormParticipants?: string[] | null
  approvedBy?: string[] | null
  // Planning
  targetDate?: string | null
  labels?: string[] | null
  color?: string | null
  // Workflow timestamps
  brainstormStartedAt?: string | null
  solidifiedAt?: string | null
  implementationStartedAt?: string | null
  completedAt?: string | null
  // Resolution
  resolution?: string | null
  resolutionNote?: string | null
  closedAt?: string | null
  // Flexible metadata
  metadata?: Record<string, any> | null
  createdAt: string
  updatedAt: string
}

export type RequirementStatus =
  | 'draft'
  | 'brainstorm'
  | 'solidified'
  | 'approved'
  | 'in_development'
  | 'implemented'
  | 'cancelled'

// Requirement Amendment
export interface RequirementAmendment {
  id: number
  tenantId: number
  requirementId: number
  amendmentNumber: number
  title: string
  description?: string | null
  businessJustification?: string | null
  urgency: 'critical' | 'high' | 'medium' | 'low'
  status: AmendmentStatus
  // Implementation tracking
  beadsFeatureId?: string | null
  // Approval
  approvedBy?: string[] | null
  approvedAt?: string | null
  // Ownership
  requestedBy?: number | null
  createdAt: string
  updatedAt: string
}

export type AmendmentStatus =
  | 'amendment_draft'
  | 'amendment_brainstorm'
  | 'amendment_solidified'
  | 'amendment_in_development'
  | 'amendment_completed'

// Dev Task
export interface DevTask {
  id: number
  tenantId: number
  featureId: number
  issueKey?: string
  title: string
  description?: string | null
  type: 'task' | 'bug'
  status: 'todo' | 'in_progress' | 'review' | 'blocked' | 'done'
  priority: number
  storyPoints?: number | null
  sprintId?: number | null
  // New fields
  createdBy?: number | null
  reporterId?: number | null
  estimate?: number | null        // hours
  actualTime?: number | null      // hours
  dueDate?: string | null
  labels?: string[] | null
  blockedReason?: string | null
  // Bug-specific
  severity?: 'critical' | 'major' | 'minor' | 'trivial' | null
  environment?: 'production' | 'staging' | 'development' | 'local' | null
  // Resolution
  resolution?: string | null
  resolutionNote?: string | null
  closedAt?: string | null
  // Flexible metadata
  metadata?: Record<string, any> | null
  createdAt: string
  updatedAt: string
}

export type TaskSeverity = 'critical' | 'major' | 'minor' | 'trivial'
export type TaskEnvironment = 'production' | 'staging' | 'development' | 'local'
export type TaskResolution = 'completed' | 'duplicate' | 'wont_do' | 'moved' | 'invalid' | 'obsolete' | 'cannot_reproduce'

// Auth
export interface AuthResponse {
  user: User
  token: string
}

export interface JWTPayload {
  userId: number
  tenantId: number
  clientId: number | null
  isInternal: boolean
  role: string
}

// ========================================
// AI Configs (Prompt Registry)
// ========================================

// Variable extracted from config content
export interface AiConfigVariable {
  name: string
  description?: string
  defaultValue?: string
}

// Main AI Config entity
export interface AiConfig {
  id: number
  tenantId: number
  name: string
  slug: string
  description?: string | null
  content: string
  contentType: AiConfigContentType
  variables?: AiConfigVariable[] | null
  visibility: AiConfigVisibility
  teamId?: number | null
  createdBy: number
  activeVersionId?: number | null
  forkCount: number
  usageCount: number
  favoriteCount: number
  forkedFromId?: number | null
  metadata?: Record<string, any> | null
  createdAt: string
  updatedAt: string
  // Populated fields
  creator?: { id: number; name: string; email: string }
  team?: { id: number; name: string } | null
  tags?: Tag[]
  isFavorited?: boolean
}

export type AiConfigContentType = 'json' | 'yaml' | 'markdown' | 'text'
export type AiConfigVisibility = 'private' | 'team' | 'public'

// Version history for AI configs
export interface AiConfigVersion {
  id: number
  tenantId: number
  configId: number
  version: number
  content: string
  contentType: AiConfigContentType
  variables?: AiConfigVariable[] | null
  changeNote?: string | null
  createdBy: number
  createdAt: string
  // Populated fields
  creator?: { id: number; name: string }
}

// Reusable tags
export interface Tag {
  id: number
  tenantId: number
  name: string
  slug: string
  color?: string | null
  description?: string | null
  createdBy?: number | null
  createdAt: string
}

// API key for external access
export interface ApiKey {
  id: number
  tenantId: number
  name: string
  keyPrefix: string // Only prefix shown, not full key
  scopes?: string[] | null
  rateLimit: number
  isActive: boolean
  lastUsedAt?: string | null
  expiresAt?: string | null
  createdBy: number
  createdAt: string
}

// Usage analytics
export interface AiConfigUsage {
  id: number
  tenantId: number
  configId: number
  versionId?: number | null
  userId?: number | null
  apiKeyId?: number | null
  action: AiConfigUsageAction
  userAgent?: string | null
  ipAddress?: string | null
  createdAt: string
}

export type AiConfigUsageAction = 'view' | 'execute' | 'copy' | 'fork' | 'export'
