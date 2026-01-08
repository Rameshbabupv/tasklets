import { JWTPayload } from '../middleware/auth.js'
import { db } from '../db/index.js'
import { teams, teamMembers } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'

// Systech tenant ID (owner tenant)
const SYSTECH_TENANT_ID = 1

export interface Idea {
  id: number
  tenantId: number
  visibility: 'private' | 'team' | 'public'
  teamId: number | null
  createdBy: number
}

/**
 * Check if user can view an idea based on visibility rules
 */
export async function canViewIdea(idea: Idea, user: JWTPayload): Promise<boolean> {
  // Admin or Systech tenant can see ALL ideas (even private)
  if (user.role === 'admin' || user.tenantId === SYSTECH_TENANT_ID || user.isOwner) {
    return true
  }

  // Different tenant
  if (idea.tenantId !== user.tenantId) {
    return false
  }

  // Public ideas - anyone in same tenant can see
  if (idea.visibility === 'public') {
    return true
  }

  // Private ideas - only creator can see
  if (idea.visibility === 'private') {
    return idea.createdBy === user.userId
  }

  // Team ideas - check team membership
  if (idea.visibility === 'team' && idea.teamId) {
    const membership = await db.select()
      .from(teamMembers)
      .where(and(
        eq(teamMembers.teamId, idea.teamId),
        eq(teamMembers.userId, user.userId)
      ))
      .limit(1)

    return membership.length > 0
  }

  return false
}

/**
 * Check if user can edit an idea (title, description, status)
 */
export function canEditIdea(idea: Idea, user: JWTPayload): boolean {
  // Admin can edit any idea
  if (user.role === 'admin' || user.isOwner) {
    return true
  }

  // Creator can edit their own idea
  return idea.createdBy === user.userId
}

/**
 * Check if user can change idea visibility
 */
export async function canChangeVisibility(idea: Idea, user: JWTPayload): Promise<boolean> {
  // Admin can change any visibility
  if (user.role === 'admin' || user.isOwner) {
    return true
  }

  // Creator can always promote their idea (private -> team -> public)
  if (idea.createdBy === user.userId) {
    return true
  }

  // Team lead can make team ideas public
  if (idea.visibility === 'team' && idea.teamId) {
    const membership = await db.select()
      .from(teamMembers)
      .where(and(
        eq(teamMembers.teamId, idea.teamId),
        eq(teamMembers.userId, user.userId),
        eq(teamMembers.role, 'lead')
      ))
      .limit(1)

    return membership.length > 0
  }

  return false
}

/**
 * Check if user can delete an idea
 */
export function canDeleteIdea(idea: Idea, user: JWTPayload): boolean {
  // Admin can delete any idea
  if (user.role === 'admin' || user.isOwner) {
    return true
  }

  // Creator can delete their own idea
  return idea.createdBy === user.userId
}

/**
 * Check if user is a team lead for a given team
 */
export async function isTeamLead(userId: number, teamId: number): Promise<boolean> {
  const membership = await db.select()
    .from(teamMembers)
    .where(and(
      eq(teamMembers.teamId, teamId),
      eq(teamMembers.userId, userId),
      eq(teamMembers.role, 'lead')
    ))
    .limit(1)

  return membership.length > 0
}

/**
 * Check if user is a member of a team
 */
export async function isTeamMember(userId: number, teamId: number): Promise<boolean> {
  const membership = await db.select()
    .from(teamMembers)
    .where(and(
      eq(teamMembers.teamId, teamId),
      eq(teamMembers.userId, userId)
    ))
    .limit(1)

  return membership.length > 0
}
