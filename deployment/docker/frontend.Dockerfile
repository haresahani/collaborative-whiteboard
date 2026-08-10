# Production Dockerfile for Frontend Client Service
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

# Copy workspace configs and lockfiles
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json tsconfig.json ./
COPY packages/shared ./packages/shared
COPY packages/infra-utils ./packages/infra-utils
COPY packages/client ./packages/client
COPY env ./env

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Build shared and frontend SPA
RUN pnpm --filter shared build
RUN pnpm --filter infra-utils build
RUN pnpm --filter client build

FROM nginx:1.27-alpine AS runner

# Copy built SPA static assets to Nginx web root
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
