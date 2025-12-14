# ================================
# Frontend Dockerfile
# ================================

# Stage 1: Dependencies and Build
FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10.17.1

WORKDIR /app

# Copy workspace root files
COPY pnpm-workspace.yaml pnpm-lock.yaml* package.json ./

# Copy frontend package.json
COPY frontend/package.json ./frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy frontend source code
COPY frontend/ ./frontend/

# Build frontend
WORKDIR /app/frontend
RUN pnpm build

# Stage 2: Production Runtime with Vite Preview
FROM node:18-alpine AS runner

# Install curl for health checks
RUN apk add --no-cache curl

# Install pnpm
RUN npm install -g pnpm@10.17.1

# Create app user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

WORKDIR /app

# Copy workspace files
COPY --chown=nodejs:nodejs pnpm-workspace.yaml pnpm-lock.yaml* package.json ./
COPY --chown=nodejs:nodejs frontend/package.json ./frontend/

# Install dependencies (need vite for preview)
RUN pnpm install --frozen-lockfile || pnpm install

# Copy built files from builder
COPY --chown=nodejs:nodejs --from=builder /app/frontend/dist ./frontend/dist
COPY --chown=nodejs:nodejs --from=builder /app/frontend/vite.config.ts ./frontend/
COPY --chown=nodejs:nodejs --from=builder /app/frontend/index.html ./frontend/

# Switch to app user
USER nodejs

WORKDIR /app/frontend

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5173 || exit 1

# Start Vite preview server
CMD ["pnpm", "preview", "--host", "0.0.0.0", "--port", "5173"]
