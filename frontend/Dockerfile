# ==============================================================================
# Dockerfile for Hadaya Next.js Frontend (Production Multi-Stage Architecture)
# Optimized for 100M MAU: Standalone Output, Sharp Image Optimization, Non-Root
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependency Caching Layer
# ------------------------------------------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Cache package definitions to maximize Docker layer reuse
COPY package.json package-lock.json ./
RUN npm ci

# ------------------------------------------------------------------------------
# Stage 2: Source Compilation & Standalone Optimization
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Pass build-time environment arguments (e.g. API URL)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Compile standalone Next.js bundle
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 3: Minimal Production Runtime
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Install curl for container health check & libc6-compat for sharp native bindings
RUN apk add --no-cache curl libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Enforce security best practice: Run as unprivileged non-root user (UID/GID 1001)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and public assets
COPY --from=builder /app/public ./public

# Set correct permissions for Next.js prerender cache directory
RUN mkdir .next && chown nextjs:nodejs .next

# Leverage Next.js Output File Tracing (Standalone) to minimize container size (~90MB total)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Install sharp natively inside production runtime for high-throughput image transforms
RUN npm install sharp@^0.33.5 --no-save

USER nextjs

EXPOSE 3000

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the optimized Next.js Node HTTP server
CMD ["node", "server.js"]
