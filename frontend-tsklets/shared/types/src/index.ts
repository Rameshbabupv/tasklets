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
  createdAt?: string
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
  id: number
  title: string
  description?: string
  status: TicketStatus
  clientPriority: number
  clientSeverity: number
  internalPriority?: number
  internalSeverity?: number
  productId?: number
  userId: number
  assignedTo?: number
  integratorId?: number
  tenantId: number
  clientId?: number  // Which client created the ticket
  createdAt: string
  updatedAt: string
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

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
