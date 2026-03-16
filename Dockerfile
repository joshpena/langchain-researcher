# ---- Stage 1: deps ----
# Purpose: Install all npm dependencies in an isolated layer.
# Why a separate stage? Docker caches layers. If your package.json hasn't
# changed, Docker reuses this layer instead of re-running npm ci — saving
# minutes on rebuilds when you only changed source code.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Stage 2: builder ----
# Purpose: Copy source code + installed deps, then run `next build`.
# The build output lands in .next/ — specifically .next/standalone/ because
# we set output: "standalone" in next.config.mjs.
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Stage 3: runner ----
# Purpose: The final, minimal image that actually runs in production.
# We ONLY copy the standalone server, static assets, and public files.
# Everything else (source code, node_modules, devDependencies) is left behind
# in the builder stage — they never make it into the final image.
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Security: don't run as root inside the container.
# If the container were compromised, the attacker would only have
# the permissions of this unprivileged user, not root.
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone server (includes a minimal node_modules with only
# the production dependencies that Next.js traced as actually needed)
COPY --from=builder /app/.next/standalone ./

# Copy static assets — standalone doesn't include these automatically
# because they're typically served by a CDN, but we need them here.
COPY --from=builder /app/.next/static ./.next/static

# Copy public directory (favicon, images, etc.)
COPY --from=builder /app/public ./public

USER nextjs
EXPOSE 3000

# The standalone output produces a server.js that boots your Next.js app.
# This replaces `npm start` — no npm, no node_modules lookup, just node.
CMD ["node", "server.js"]
