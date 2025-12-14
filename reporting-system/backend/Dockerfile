# ================================
# Backend Dockerfile
# ================================

# Stage 1: Dependencies and Build
FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10.17.1

WORKDIR /app

# Copy workspace root files
COPY pnpm-workspace.yaml pnpm-lock.yaml* package.json ./

# Copy backend package.json
COPY backend/package.json ./backend/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy backend source code
COPY backend/ ./backend/

# Build backend (compile TypeScript)
WORKDIR /app/backend
RUN pnpm build

# Stage 2: Production Runtime
FROM node:18-alpine AS runner

# Install curl for health checks
RUN apk add --no-cache curl

# Install Python3 and pip for model execution
RUN apk add --no-cache python3 py3-pip

# Install Chromium and dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install pnpm
RUN npm install -g pnpm@10.17.1

# Create app user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

WORKDIR /app

# Copy workspace files
COPY --chown=nodejs:nodejs pnpm-workspace.yaml pnpm-lock.yaml* package.json ./
COPY --chown=nodejs:nodejs backend/package.json ./backend/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile || pnpm install --prod

# Copy built files from builder
COPY --chown=nodejs:nodejs --from=builder /app/backend/dist ./backend/dist
COPY --chown=nodejs:nodejs --from=builder /app/backend/code ./backend/code
COPY --chown=nodejs:nodejs --from=builder /app/backend/src ./backend/src
COPY --chown=nodejs:nodejs --from=builder /app/backend/tsconfig.json ./backend/

# Copy models and data if needed
COPY --chown=nodejs:nodejs backend/models ./backend/models
COPY --chown=nodejs:nodejs backend/data ./backend/data

# Switch to app user
USER nodejs

WORKDIR /app/backend

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start application
CMD ["pnpm", "start"]
