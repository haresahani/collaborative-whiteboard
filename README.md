# Collaborative Whiteboard

Collaborative Whiteboard is a pnpm monorepo for a whiteboard product that is currently in the "solid editor plus partial backend" stage.

Today, the strongest part of the repo is the client-side whiteboard experience in `packages/client`: drawing, selection, resize, text, erase, zoom/pan, undo/redo, and PNG export all work locally. The backend in `packages/api` already has auth, board, snapshot, and oplog models plus basic REST endpoints. The realtime layer is not finished yet: `packages/socket` and `packages/worker` are still scaffolds, and the new client is not wired to persistence or sockets.

This README is intentionally honest about that state. The goal of the project is not to claim a huge system that does not exist yet. The goal is to build one clear, defendable V1 and then grow it.

## Project Story

This project is meant to become an interview-quality collaborative system with a clean product story:

- a modern whiteboard client
- an API for auth and board persistence
- a simple realtime collaboration model
- explicit tradeoffs and limitations

The repo is being shaped for depth, clarity, and credibility rather than inflated architecture claims.

## Current Status

| Area                    | Status          | Notes                                                                        |
| ----------------------- | --------------- | ---------------------------------------------------------------------------- |
| Whiteboard editor UI    | Implemented     | Local whiteboard tools and interactions are the strongest part of the repo.  |
| Client routing          | Partial         | The active route is `/board/:id`. Old auth and landing pages are not active. |
| Auth API                | Implemented     | Signup, login, and `GET /api/auth/me` exist in the API package.              |
| Board API               | Implemented     | Create, list, fetch, delete board, and append operation endpoints exist.     |
| Persistence from client | Not wired       | The new client does not yet call the API.                                    |
| Realtime collaboration  | Not implemented | Socket and worker packages are still stubs.                                  |
| Export pipeline         | Partial         | Client-side PNG export exists. Background export jobs do not.                |
| Automated tests         | Minimal         | API has a smoke test. Client interaction tests are still missing.            |

## V1 Scope

The V1 target is intentionally narrow.

Included in V1:

- signup and login
- create a board
- open a board by URL
- local whiteboard editing with the current toolset
- save and reload board state through API persistence
- 2-user realtime collaboration on a single board
- a small baseline test suite for auth, board CRUD, editor interactions, and one realtime scenario

Explicitly excluded from V1:

- CRDTs
- Redis fan-out
- background workers
- server-side export jobs
- advanced ACLs and org/team features
- mobile-native experiences
- offline sync
- observability and infra claims beyond local development readiness

Detailed scope lives in [docs/v1-scope.md](docs/v1-scope.md).

## Chosen Collaboration Model

The first collaboration model will be:

- one Socket.IO room per board
- authoritative server ordering with a monotonic sequence number
- append-only operations stored in MongoDB
- snapshot plus oplog replay for reload and reconnect
- last accepted operation wins for conflicting updates to the same element

This is a simpler and more defensible V1 than claiming CRDTs before they exist. The full decision is documented in [docs/collaboration-model.md](docs/collaboration-model.md).

## Monorepo Packages

- `packages/client`: React + Vite whiteboard client. This is the most complete package today.
- `packages/api`: Express + MongoDB API for auth, boards, snapshots, and oplog persistence.
- `packages/socket`: reserved for the realtime gateway. Currently a stub.
- `packages/worker`: reserved for async jobs such as export/snapshot work. Currently a stub.
- `packages/shared`: shared package for code used by more than one package.
- `packages/infra-utils`: helper package for repo and infra-adjacent utilities.

Package boundaries are written down in [docs/package-responsibilities.md](docs/package-responsibilities.md).

## Getting Started

### Requirements

- Node.js 20+
- pnpm 9+
- MongoDB access for API work

### Install

```bash
pnpm install
cp env/.env.example env/dev.env
```

Update `env/dev.env` with local values before starting the API.

### Run The Repo

Run all packages that expose a `dev` script:

```bash
pnpm dev
```

Useful focused commands:

```bash
pnpm --filter client dev
pnpm --filter api dev
pnpm --filter client build
pnpm --filter client lint
```

### Expected Local Ports

- client: `http://localhost:5173`
- active board route example: `http://localhost:5173/board/local-demo`
- API: `http://localhost:1234`
- socket stub: logs as port `3001`

### Quality Commands

These commands should stay healthy at the repo root:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

## Repo Standards

The foundation standards for this repo are now documented and should guide all future work:

- engineering conventions: [docs/engineering-conventions.md](docs/engineering-conventions.md)
- local setup and runbook: [docs/runbook.md](docs/runbook.md)
- testing expectations: [docs/testing-guide.md](docs/testing-guide.md)
- architecture baseline: [docs/architecture.md](docs/architecture.md)
- protocol and sync baseline: [docs/protocol.md](docs/protocol.md)

## Current Limitations

This repo is not yet a true collaborative product. Important limitations today:

- the client is mostly local-first and not connected to the backend
- realtime sync is not implemented
- socket and worker packages are placeholders
- API response shapes are partially standardized and need one cleanup pass during V1 work
- the automated test suite is still too light for a finished product

Those gaps are acceptable right now because they are explicitly acknowledged and planned, not hidden.

## Milestone Order

The planned delivery order is:

1. foundation and documentation
2. persistence wiring
3. realtime collaboration
4. polish and test depth
5. advanced features

## Interview Positioning

The best interview story for this repo is:

- "I built a strong whiteboard editor first."
- "I kept the docs honest."
- "I chose a simple collaboration model for V1."
- "I prioritized one clear vertical slice over inflated architecture."

The interview narrative is captured in [docs/INTERVIEW_NOTES.md](docs/INTERVIEW_NOTES.md).
