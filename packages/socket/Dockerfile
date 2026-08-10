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

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/infra-utils ./packages/infra-utils
COPY --from=builder /app/packages/socket ./packages/socket

RUN corepack enable && corepack prepare pnpm@10.17.0 --activate
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

USER appuser

EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "packages/socket/dist/index.js"]
