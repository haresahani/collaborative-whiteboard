FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

WORKDIR /app

# Copy workspace config and source files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json tsconfig.json ./
COPY packages/shared ./packages/shared
COPY packages/infra-utils ./packages/infra-utils
COPY packages/api ./packages/api
COPY packages/socket ./packages/socket
COPY packages/worker ./packages/worker
COPY packages/client ./packages/client
COPY env ./env

# Install dependencies with full workspace context
RUN pnpm install --frozen-lockfile

# Build shared libraries
RUN pnpm --filter shared build
RUN pnpm --filter infra-utils build

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
EXPOSE 9090
CMD ["pnpm", "--filter", "worker", "start:dev"]

# Client Builder Stage
FROM base AS client-build
RUN pnpm --filter client build

# Client Target
FROM nginx:1.27-alpine AS client
COPY --from=client-build /app/packages/client/dist /usr/share/nginx/html
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
