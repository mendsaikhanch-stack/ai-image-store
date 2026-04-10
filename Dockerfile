# syntax=docker/dockerfile:1.6

# Multi-stage build for Next.js 15 + Prisma + sharp + adm-zip.
#
# Uses debian-slim (not alpine) because sharp's prebuilt binaries and
# Prisma's query engine both prefer glibc. Staging demo — image size
# is not critical.

FROM node:20-bookworm-slim AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ── deps stage ────────────────────────────────────────────────
# Install all deps (including dev) so the builder can run prisma
# generate and next build.
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ── builder stage ─────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client (no DB connection needed, just schema).
RUN npx prisma generate
# Build Next. NEXT_PHASE=phase-production-build tells lib/env.ts to
# skip validation so the build works without runtime secrets.
RUN npm run build

# ── runner stage ──────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

# Non-root runtime user.
RUN groupadd --gid 1001 nodejs \
    && useradd --uid 1001 --gid nodejs --create-home --shell /bin/bash nextjs

# Copy the whole app (deps + build + public). Simpler than the
# standalone output and avoids Prisma engine path gymnastics.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Bootstrap storage dirs so the import pipeline can write on first run.
# On Railway, mount a persistent volume at /app/storage to keep source
# files across deploys. Previews under /app/public/previews are
# ephemeral (regenerated on next import) and that's fine for staging.
RUN mkdir -p /app/storage/source /app/public/previews \
    && chown -R nextjs:nodejs /app/storage /app/public/previews

# Entrypoint runs migrations then starts Next.
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["/app/docker-entrypoint.sh"]
