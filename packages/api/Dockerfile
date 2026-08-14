# Multi-stage Dockerfile for API service
FROM node:22-alpine AS builder

# Install pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

WORKDIR /app

# Copy root workspace configurations
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json tsconfig.json ./

# Copy required package files
COPY packages/shared ./packages/shared
COPY packages/infra-utils ./packages/infra-utils
COPY packages/api ./packages/api
COPY env ./env

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build workspace dependencies and API package
RUN pnpm --filter shared build
RUN pnpm --filter infra-utils build
RUN pnpm --filter api build

# Stage 2: Minimal Production Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root system user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/infra-utils ./packages/infra-utils
COPY --from=builder /app/packages/api ./packages/api

# Install production dependencies only
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 1234

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:1234/api/health || exit 1

CMD ["pnpm", "--filter", "api", "start"]
