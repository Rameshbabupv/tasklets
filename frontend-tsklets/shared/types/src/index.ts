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
