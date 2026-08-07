# Production Dockerfile for API Backend Service
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

# Copy workspace configs and lockfiles
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json tsconfig.json ./
COPY packages/shared ./packages/shared
COPY packages/infra-utils ./packages/infra-utils
COPY packages/api ./packages/api
COPY env ./env

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Build dependencies and target package
RUN pnpm --filter shared build
RUN pnpm --filter infra-utils build
RUN pnpm --filter api build

FROM node:22-alpine AS runner

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

ENV NODE_ENV=production
ENV PORT=1234

# Create non-root node user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app ./

USER appuser

EXPOSE 1234

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:1234/api/health || exit 1

CMD ["pnpm", "--filter", "api", "start"]
