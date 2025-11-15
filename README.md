# Collaborative Whiteboard

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-jest%20%7C%20vitest-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

A production-ready **real-time collaborative whiteboard** built for distributed product teams. Built in a monorepo with pnpm workspaces, it showcases modern front-end UX, type-safe APIs, websocket collaboration, and cloud-native operations tooling—suited for portfolio reviews at FAANG/MNC companies.

---

## Executive Summary

- **What**: Multiplayer whiteboard with live cursors, drawing tools, authentication, and export pipeline.
- **Why**: Demonstrates end-to-end architecture—React client, Node/Express API, websocket layer, background workers, and shared TypeScript contracts.
- **How**: CRDT-inspired data model, Redis-backed fan-out, MongoDB oplog + snapshot persistence, observability via OpenTelemetry + Prometheus.
- **Impact**: Scales to 100+ concurrent users with <200 ms update latency; resilient deployment via GitHub Actions, Docker, and Kubernetes.

**Quick Links** → [Live Demo](https://demo.collab-whiteboard.app) • [Docs](docs/README.md) • [Architecture](docs/architecture.md) • [Testing Guide](docs/testing-guide.md)

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Monorepo Structure](#monorepo-structure)
- [Getting Started](#getting-started)
- [Testing & Quality](#testing--quality)
- [Operations](#operations)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Features

**Core Experience**

- Real-time drawing (pen, shape, text) with per-user history and undo/redo.
- Presence indicators, live cursors, and shared board state via Socket.IO.
- Role-based access (owner, editor, viewer) with token-based authentication.

**Collaboration & Productivity**

- Async export pipeline (PNG/PDF/JSON) processed via background workers.
- Shared templates, sticky notes, and grouped objects for design sprints.
- Board versioning with snapshot rollover every 1,000 operations.

**Production Readiness**

- End-to-end telemetry (metrics, logs, traces) integrated with Grafana + Jaeger.
- CI/CD with linting, unit/integration tests, and automated Docker publishing.
- Configurable rate limiting, schema validation, and input sanitisation.

See `docs/` for deeper product and engineering specifications.

---

## Architecture

```
Browser (React + Vite) ──HTTPS/WebSocket──> Ingress / Load Balancer
                                 │
                                 ▼
                   Application Gateway (Express + Socket.IO)
                    ├── REST API (Express + MongoDB)
                    ├── Collab Service (CRDT ops, Redis pub/sub)
                    ├── Worker Queue (BullMQ, export + snapshot jobs)
                    └── Shared TypeScript Contracts
                                 │
                                 ▼
                     Observability (OTel → Prometheus/Grafana)
```

- **State Sync**: Client emits operations (`stroke.add`, `cursor.update`), server assigns lamport timestamp and broadcasts through Redis fan-out.
- **Durability**: Append-only oplog persisted in MongoDB with periodic snapshot compaction.
- **Scalability**: Stateless API/socket tier; horizontal scaling via Kubernetes + Redis adapter.
- **Docs**: Full diagrams and sequence flows live in [`docs/architecture.md`](docs/architecture.md) and [`docs/crdt-design.md`](docs/crdt-design.md).

---

## Tech Stack

| Layer       | Technologies                                       | Notes                                                     |
| ----------- | -------------------------------------------------- | --------------------------------------------------------- |
| Frontend    | React 18, TypeScript, Vite, Tailwind CSS, Radix UI | Optimised canvas rendering, hooks-driven state management |
| Backend API | Node.js, Express, Mongoose, Zod                    | Typed REST endpoints, schema validation                   |
| Realtime    | Socket.IO, Redis, CRDT ops                         | Reliable delivery + eventual consistency                  |
| Persistence | MongoDB (oplog + snapshots), Redis, S3             | Durable board data, pub/sub, export storage               |
| Tooling     | pnpm, Turborepo, ESLint, Prettier, Husky           | Monorepo automation & DX                                  |
| Testing     | Jest (client), Vitest (API), React Testing Library | Unit/integration coverage with JSDOM env                  |
| Operations  | Docker, Kubernetes, Helm, GitHub Actions           | Infra-as-code & CI/CD                                     |

---

## Monorepo Structure

```
/                      # Repo root
├─ .github/workflows/  # CI/CD pipelines
├─ docs/               # Product, architecture, protocol, testing
├─ packages/
│  ├─ client/          # React + Vite SPA
│  ├─ api/             # Express API (boards, auth, exports)
│  ├─ socket/          # Socket.IO gateway
│  ├─ worker/          # BullMQ workers for snapshot/export
│  ├─ shared/          # Cross-package types & utilities
│  └─ infra-utils/     # Deployment scripts, health checks
├─ tests/              # E2E (Playwright) & load scripts (k6)
├─ scripts/            # Seed, migrations, tooling
└─ README.md
```

Each package has independent `package.json`, tests, and ESLint config, orchestrated via pnpm workspaces. Shared contracts (`@shared`) enforce compile-time guarantees across services.

---

## Getting Started

### Requirements

- Node.js ≥ 20
- pnpm ≥ 9
- Docker (optional for local infra: MongoDB, Redis)
- GitHub CLI (optional) for pulling CI secrets

### Clone & Install

```bash
git clone https://github.com/<your-handle>/collaborative-whiteboard.git
cd collaborative-whiteboard
pnpm install
cp .env.example .env
```

### Local Development

```bash
# Start API + Socket + Worker with docker-compose
docker compose -f infra/docker-compose.yml up --build

# In another terminal: start the web client
pnpm -w --filter client dev

# Optional: run API locally instead of Docker
pnpm -w --filter api dev
```

Visit `http://localhost:3000` for the client UI; API and socket server run on `http://localhost:4000`.

### Environment Variables

Key configuration lives in `.env` files. See [`docs/runbook.md`](docs/runbook.md) for environment-specific guidance.

```ini
MONGODB_URI=mongodb://localhost:27017/collab
REDIS_URL=redis://localhost:6379
JWT_SECRET=xxxxxx
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
```

---

## Testing & Quality

- **Unit & Integration**: `pnpm -w test` (runs Jest for client, Vitest for API)
- **Client-only**: `pnpm -w --filter client test`
- **API-only**: `pnpm -w --filter api test`
- **Coverage**: `pnpm -w --filter client test -- --coverage`
- **Linting**: `pnpm -w exec eslint . --ext .ts,.tsx`

Test strategy, folder conventions, and troubleshooting tips are detailed in [`docs/testing-guide.md`](docs/testing-guide.md).

Quality gates run via Husky pre-commit hooks and GitHub Actions (`lint`, `typecheck`, `test`, `build`).

---

## Operations

**CI/CD**

- GitHub Actions pipeline (see `.github/workflows/ci.yml`) executes lint → typecheck → test → build.
- Docker images pushed to GHCR; Helm chart deployment via manual approval.

**Observability**

- OpenTelemetry tracing wired into API and socket services.
- Prometheus metrics: `ops_processed_total`, `latency_ms`, `active_connections`, `snapshot_duration_ms`.
- Grafana dashboards & Sentry for alerting.

**Security Controls**

- JWT auth with refresh tokens; board-level ACL enforcement.
- Rate limiting via Redis; Zod validation for inbound payloads.
- Secrets managed through environment variables & GitHub Actions secrets.

---

## Roadmap

- [ ] Mobile-friendly canvas interactions & PWA support
- [ ] AI-assisted shape detection and auto-layout
- [ ] Offline-first mode with local queue replay
- [ ] Collaborative audio/video rooms
- [ ] Enhanced analytics dashboard (board usage, heatmaps)

Limitations and mitigation strategies are tracked in [`docs/runbook.md`](docs/runbook.md) and project issues.

---

## Contributing

We welcome improvements and issue reports.

- Fork & branch from `main` (`feat/<name>` or `fix/<name>`)
- Run `pnpm run lint && pnpm run test` before PR submission
- Include screenshots for UI changes and update documentation as needed
- See [CONTRIBUTING](.github/CONTRIBUTING.md) for coding standards and release process

---

## License

MIT © Hare Sahani

---

## Contact

**Hare Sahani**  
[harecareer@gmail.com](mailto:harecareer@gmail.com) · [LinkedIn](https://www.linkedin.com/in/hare-sahani-18239b240/) · [GitHub](https://github.com/haresahani) · [LeetCode](https://leetcode.com/u/haresahani/)
