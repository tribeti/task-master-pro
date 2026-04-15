# ============================================================
# Stage 1: deps — install production dependencies
# ============================================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY src/package.json src/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# ============================================================
# Stage 2: builder — compile the Next.js app
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy ALL deps (including devDeps) for build
COPY src/package.json src/package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source code
COPY src/ .

# Build-time env vars (public ones only — never leak secrets here)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ============================================================
# Stage 3: runner — minimal production image
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy built assets from builder
COPY --from=builder /app/public          ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use Next.js standalone server
CMD ["node", "server.js"]
