# ================================
# Backend Dockerfile - Multi-stage
# ================================

# Stage 1: Dependencies and Build
FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace root files for dependency resolution
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy backend package.json
COPY backend/package.json ./backend/

# Install all workspace dependencies
RUN pnpm fetch
RUN pnpm install --frozen-lockfile

# Copy backend source code
COPY backend/ ./backend/

# Build backend
WORKDIR /app/backend
RUN pnpm build

# Stage 2: Production Runtime
FROM node:18-alpine AS runner

# Install curl for health checks
RUN apk add --no-cache curl

# Install pnpm
RUN npm install -g pnpm

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

WORKDIR /app

# Copy workspace root files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY backend/package.json ./backend/

# Install only production dependencies
RUN pnpm fetch --prod
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/backend/dist ./backend/dist

# Switch to nodejs user
USER nodejs

# Set working directory to backend
WORKDIR /app/backend

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["pnpm", "start"]