# Multi-stage Dockerfile for Socket service
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json tsconfig.json ./
COPY packages/shared ./packages/shared
COPY packages/infra-utils ./packages/infra-utils
COPY packages/socket ./packages/socket
COPY env ./env

RUN pnpm install --frozen-lockfile
RUN pnpm --filter shared build
RUN pnpm --filter infra-utils build
RUN pnpm --filter socket build

# Stage 2: Production Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

# Create non-root system user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/infra-utils ./packages/infra-utils
COPY --from=builder /app/packages/socket ./packages/socket
COPY env ./env

RUN chown -R appuser:appgroup /app

USER appuser

CMD ["pnpm", "--filter", "socket", "start"]
