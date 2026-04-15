# ============================================================
# Stage 1: base — base image with essential libraries
# ============================================================
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Application version (passed at build time)
ARG NEXT_PUBLIC_APP_VERSION
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION

# ============================================================
# Stage 2: development — prep for dev environment
# ============================================================
FROM base AS development

WORKDIR /app

# Copy ALL deps (including devDeps)
COPY src/package.json src/package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source code
COPY src/ .

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# ============================================================
# Stage 3: builder — compile the Next.js app
# ============================================================
FROM development AS builder

# Build-time env vars (public ones only — never leak secrets here)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

RUN npm run build

# ============================================================
# Stage 3: runner — minimal production image
# ============================================================
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy built assets from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use Next.js standalone server
CMD ["node", "server.js"]
