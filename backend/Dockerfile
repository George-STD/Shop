# ==============================================================================
# Dockerfile for Hadaya Node.js/Express Backend (Production Multi-Stage)
# Optimized for 100M MAU: Lean Alpine, dumb-init PID 1, Non-Root User, Healthcheck
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Production Dependencies Builder
# ------------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

# Install build tools if any dependency requires native compilation
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ------------------------------------------------------------------------------
# Stage 2: Lean Production Runtime
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Install dumb-init for PID 1 signal forwarding and curl for container health check
RUN apk add --no-cache dumb-init curl

ENV NODE_ENV=production
ENV PORT=5000

# Copy production node_modules from deps stage
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .

# Run as built-in non-root user 'node' (UID/GID 1000) for security hardening
USER node

EXPOSE 5000

# Healthcheck for container orchestrators (Kubernetes liveness, Docker Compose)
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# dumb-init acts as PID 1, properly reaping zombie processes and handling SIGTERM/SIGINT
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

CMD ["node", "server.js"]
