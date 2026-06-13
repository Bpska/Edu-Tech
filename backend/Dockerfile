# ─────────────────────────────────────────────
# Stage 1: Install dependencies
# ─────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy dependency manifests first (layer cache)
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# ─────────────────────────────────────────────
# Stage 2: Generate Prisma client
# ─────────────────────────────────────────────
FROM node:20-alpine AS prisma-builder

WORKDIR /app

# Copy manifests and install ALL deps (prisma CLI needed to generate client)
COPY package.json package-lock.json ./
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# ─────────────────────────────────────────────
# Stage 3: Production image
# ─────────────────────────────────────────────
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling and openssl for Prisma engines
RUN apk add --no-cache dumb-init openssl

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy generated Prisma client
COPY --from=prisma-builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy application source
COPY src ./src
COPY prisma ./prisma
COPY package.json ./

# Switch to non-root user
USER appuser

EXPOSE 5000

# Use dumb-init as PID 1 to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run Prisma migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
