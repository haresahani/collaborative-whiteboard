# Multi-stage Dockerfile for Client frontend service
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json tsconfig.json ./
COPY packages/shared ./packages/shared
COPY packages/infra-utils ./packages/infra-utils
COPY packages/client ./packages/client
COPY env ./env

RUN pnpm install --frozen-lockfile
RUN pnpm --filter shared build
RUN pnpm --filter client build

# Stage 2: Nginx Web Server Runner
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/packages/client/dist /usr/share/nginx/html
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
