# Local Runbook

This runbook is for local development and demo readiness. It is not a production operations guide.

## Prerequisites

- Node.js 20+
- pnpm 9+
- MongoDB access for the API package

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
- socket and worker packages currently only print stub startup messages

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

### Root `pnpm dev` looks noisy

That is expected for now because it starts client, API, socket, and worker together. Socket and worker are still stubs, so their logs are only scaffolding output.

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
