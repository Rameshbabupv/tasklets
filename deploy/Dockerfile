# ============================================
# STAGE 1: Builder (Temporary - Discarded)
# ============================================
FROM node:18-alpine AS builder

WORKDIR /build

# Copy source code (only used for compiling)
COPY package*.json ./
COPY tsconfig.base.json ./
COPY frontend-tsklets ./frontend-tsklets
COPY backend-tsklets ./backend-tsklets

# Install dependencies and build
RUN npm install --legacy-peer-deps
RUN npm run build

# ============================================
# STAGE 2: Production (Final Image)
# No source code - only compiled files!
# ============================================
FROM node:18-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy ONLY compiled files from builder
COPY --from=builder /build/backend-tsklets/api/dist ./backend/dist
COPY --from=builder /build/backend-tsklets/api/package*.json ./backend/
COPY --from=builder /build/frontend-tsklets/client/dist ./frontend/client
COPY --from=builder /build/frontend-tsklets/internal/dist ./frontend/internal

# Install production dependencies only
WORKDIR /app/backend
RUN npm install --production --legacy-peer-deps

WORKDIR /app

# Create directories for uploads and logs
RUN mkdir -p /app/uploads /app/logs

# Expose ports
EXPOSE 4000 4010 4020

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s \
    CMD curl -f http://localhost:4000/api/health || exit 1

# Start the application
CMD ["node", "backend/dist/index.js"]
