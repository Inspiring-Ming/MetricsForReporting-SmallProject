# Multi-stage build for ESG Public API (TypeScript/Express)
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Copy shared packages
COPY packages/ packages/

# Copy public API source
COPY apps/api-public/package.json apps/api-public/
COPY apps/api-public/tsconfig.json apps/api-public/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS build

# Copy source code
COPY apps/api-public/src apps/api-public/src/

# Build the application
RUN cd apps/api-public && pnpm build

# Production stage
FROM node:18-alpine AS production

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Create non-root user
RUN addgroup -g 1001 -S esg && \
    adduser -S esg -u 1001 -G esg

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=build --chown=esg:esg /app/apps/api-public/dist ./dist/
COPY --from=build --chown=esg:esg /app/apps/api-public/package.json ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile && \
    pnpm store prune

# Switch to non-root user
USER esg

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the application
CMD ["node", "dist/main.js"]
