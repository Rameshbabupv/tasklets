import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const jwtSecretEnv = process.env.JWT_SECRET
if (!jwtSecretEnv) {
  throw new Error('JWT_SECRET environment variable is required')
}
const JWT_SECRET: string = jwtSecretEnv

export interface JWTPayload {
  userId: number
  tenantId: number        // Owner company (SaaS customer)
  clientId: number | null // Client company the user belongs to
  isInternal: boolean     // true if user email ends with @systech.com
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Requires internal user (tenant's team, not client user)
export function requireInternal(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.isInternal) {
    return res.status(403).json({ error: 'Forbidden: Internal access required' })
  }
  next()
}

// Backwards compatibility alias - will be removed after route updates
export const requireOwner = requireInternal

export function requireDeveloper(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'developer') {
    return res.status(403).json({ error: 'Forbidden: Developer access required' })
  }
  next()
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' })
    }
    next()
  }
}

// Requires client user (has clientId, not internal)
export function requireClientUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.clientId || req.user.isInternal) {
    return res.status(403).json({ error: 'Forbidden: Client user access required' })
  }
  next()
}

// Requires user to be admin of their client (company_admin role + has clientId)
export function requireClientAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.clientId || req.user.role !== 'company_admin') {
    return res.status(403).json({ error: 'Forbidden: Client admin access required' })
  }
  next()
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}
