import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { authRoutes } from './routes/auth.js'
import { ticketRoutes } from './routes/tickets.js'
import { clientRoutes } from './routes/clients.js'
import { productRoutes } from './routes/products.js'
import { userRoutes } from './routes/users.js'
import { epicRoutes } from './routes/epics.js'
import { featureRoutes } from './routes/features.js'
import { taskRoutes } from './routes/tasks.js'
import { ideaRoutes } from './routes/ideas.js'
import { teamRoutes } from './routes/teams.js'
import { sprintRoutes } from './routes/sprints.js'
import { executiveRoutes } from './routes/executive.js'
import { requirementRoutes } from './routes/requirements.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = parseInt(process.env.PORT || '4000')
const HOST = process.env.HOST || '0.0.0.0'

// Allowed origins for CORS (comma-separated in env)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:4010',
  'http://localhost:4020',
]

// Rate limiting - general API (100 requests per 15 min)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate limiting - auth routes (stricter: 10 attempts per 15 min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Security Middleware
app.use(helmet())
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}))
app.use(express.json())

// Apply rate limiting
app.use('/api/auth', authLimiter)

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/products', productRoutes)
app.use('/api/users', userRoutes)
app.use('/api/epics', epicRoutes)
app.use('/api/features', featureRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/ideas', ideaRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/sprints', sprintRoutes)
app.use('/api/executive', executiveRoutes)
app.use('/api/requirements', requirementRoutes)

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }))

app.listen(PORT, HOST, () => {
  console.log(`API server listening on ${HOST}:${PORT}`)
  console.log(`  Local:   http://localhost:${PORT}`)
  if (HOST === '0.0.0.0') {
    console.log(`  Network: http://<your-ip>:${PORT}`)
  }
})
