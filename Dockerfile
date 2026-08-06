FROM node:22-alpine AS base

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy root manifest files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/
COPY packages/socket/package.json ./packages/socket/
COPY packages/worker/package.json ./packages/worker/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/shared ./packages/shared
COPY packages/api ./packages/api
COPY packages/socket ./packages/socket
COPY packages/worker ./packages/worker
COPY tsconfig.base.json tsconfig.json ./
COPY env ./env

# Build shared library first
RUN pnpm --filter shared build

# API Target
FROM base AS api
EXPOSE 1234
CMD ["pnpm", "--filter", "api", "start:dev"]

# Socket Target
FROM base AS socket
EXPOSE 3001
CMD ["pnpm", "--filter", "socket", "start:dev"]

# Worker Target
FROM base AS worker
CMD ["pnpm", "--filter", "worker", "start:dev"]
