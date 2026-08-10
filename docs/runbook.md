# Local Runbook

This runbook is for local development and demo readiness. It is not a production operations guide.

## Prerequisites

- Node.js 20+
- pnpm 9+
- MongoDB instance (either local MongoDB running on port 27017 or a MongoDB Atlas connection string configured via `MONGO_URL` in `env/dev.env`)
- Redis instance (running locally on port 6379, or configured via `REDIS_URL` in `env/dev.env`) for realtime sync and BullMQ background worker queues

## Install

```bash
pnpm install
cp env/.env.example env/dev.env
```

Update `env/dev.env` before starting the API.

## Start Commands

### Whole repo

```bash
pnpm dev
```

This starts every package that has a `dev` script.

### Package-by-package

```bash
pnpm --filter client dev
pnpm --filter api dev
pnpm --filter socket dev
pnpm --filter worker dev
```

## Expected Behavior

- client starts on `http://localhost:5173`
- the active whiteboard route is `/board/:id`
- API starts on the port in `env/dev.env`, currently `1234` by default
- socket gateway starts on port `3001` and connects to Redis and MongoDB
- worker process starts, connects to Redis and MongoDB, and listens for snapshot compaction jobs

## Verification Commands

Use these before calling the repo healthy:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

## Common Issues

### API fails to start

Check:

- `env/dev.env` exists
- `MONGO_URL` is valid
- MongoDB is reachable
- `JWT_SECRET` is set

### Client shows a blank page

Check:

- you opened a valid board route such as `/board/local-demo`
- the client dev server is actually running on port `5173`

### Redis connection refused (`ECONNREFUSED 127.0.0.1:6379`)

The `socket` and `worker` packages require a running Redis server. If you see connection refused logs:

- Ensure Redis is installed and running locally (e.g. via Docker, WSL, or native service).
- If using a remote or custom Redis instance, define `REDIS_URL=redis://your-redis-host:port` in `env/dev.env`.
- If you do not have Redis set up yet, you can still develop and test the whiteboard client and REST API locally by running only those packages:
  ```bash
  pnpm --filter client dev
  pnpm --filter api dev
  ```

### `pnpm build` recreates generated output

That is expected locally. Generated `dist` and `tsbuildinfo` files should stay out of Git.

## Demo Checklist

Before showing the project:

1. run `pnpm lint`
2. run `pnpm typecheck`
3. run `pnpm build`
4. run `pnpm test`
5. start the client and verify the board route loads
6. if demoing backend work, verify the API starts against a working MongoDB instance
