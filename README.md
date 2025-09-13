# Collab Whiteboard 🎨 — Production-Ready & FAANG/MANG-Grade

![Build Status](https://img.shields.io/badge/build-passing-brightgreen) ![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

A **real-time, multi-user collaborative whiteboard** engineered for low-latency drawing, deterministic conflict resolution, and horizontal scaling. Built with a **MERN stack + Socket.IO**, it features an append-only oplog, periodic snapshots, and an async export pipeline. This project showcases production-grade system design, observability, and scalability for technical interviews or enterprise deployment.

[Demo GIF](/docs/demo.gif) | [Live Demo](https://demo.collab-whiteboard.app) *(replace with deployed URL)* | [Docs](/docs)

---

## 🚀 TL;DR (Recruiters & Quick Skim)
- **What**: Collaborative whiteboard with real-time, low-latency (<200ms) drawing (pen, line, rectangle, circle), shapes, sticky notes, presence, undo/redo, and async exports (PNG/PDF/JSON) for 100+ users.  
- **Why**: Demonstrates FAANG-level engineering: WebSocket scaling with Redis pub/sub, CRDT-based conflict resolution, observability, and production-grade infrastructure.  
- **Stack**: React (TypeScript), Node.js/Express, Socket.IO, MongoDB (oplog + snapshots), Redis (pub/sub), Docker, Kubernetes, Prometheus/Grafana.  
- **Resume 1-Liner**: Built a production-ready collaborative whiteboard (MERN + Socket.IO) with oplog persistence, snapshotting every 1,000 ops, and async export pipelines, optimized for <200ms latency and scalability.

---

## 🎯 Features
### MVP
- Real-time multi-user drawing (pen, line, rectangle, circle) with Socket.IO/WebSockets, achieving <200ms op-to-propagation.
- Persistent board state via MongoDB oplog + snapshots (every 1,000 ops or 5 minutes).
- Live cursors and user presence indicators.
- Board creation/joining via shareable URLs.
- Client-side PNG export fallback.

### Advanced
- Per-user and session-level undo/redo with version history.
- Sticky notes with text/image embedding, shapes, and drag-select functionality.
- Async server-side export pipeline (BullMQ + headless rendering → S3, PNG/PDF/JSON).
- JWT-based auth with board-level ACLs (owner/editor/viewer).

### Production Polish
- Horizontal scaling with Redis pub/sub for Socket.IO, supporting 2,000 ops/sec per instance.
- CRDT for text (RGA or Yjs/Automerge) and strokes/shapes for conflict-free merges.
- Observability with OpenTelemetry (tracing), Prometheus (metrics), Grafana (dashboards), and Sentry (errors).
- Kubernetes deployment with Helm charts, autoscaling, and CDN for static assets.

---

## 🏗️ Architecture Overview
```
Browser Clients (React) <--> Load Balancer (HTTPS/WebSocket)
│
└── Stateless Socket/API Layer (Node + Express + Socket.IO)
    ├── MongoDB (oplog, snapshots, metadata)
    ├── Redis (pub/sub, sessions, rate-limiting)
    └── Background Workers (snapshotter, export jobs)
        └── Object Storage (S3 for exports)
```

See [docs/architecture.md](/docs/architecture.md) for detailed diagrams and flow.

---

## 📁 Repository Structure
This project uses a **monorepo** pattern for type safety and simplified refactors, reflecting production practices at scale.

```
/                      # Repo root
├─ .github/workflows/   # CI/CD (lint, test, build, deploy)
├─ docs/               # Architecture, CRDT, API, runbook
├─ infra/              # Docker Compose, Kubernetes, Helm
├─ packages/           # Monorepo packages
│  ├─ client/         # React + TypeScript (Vite/Next.js)
│  ├─ api/            # Express REST + auth + metadata
│  ├─ socket/         # Stateless Socket.IO cluster
│  ├─ worker/         # Background jobs (snapshots, exports)
│  ├─ shared/         # Shared TS types, schemas, utils
│  └─ infra-utils/    # Deployment helpers, health checks
├─ scripts/            # Seed, migrate, load-test scripts
├─ tests/              # E2E (Playwright), load (k6)
├─ .eslintrc.js       # Linting rules
├─ .prettierrc        # Code formatting
├─ package.json        # Monorepo workspaces
└─ README.md          # This file
```

---

## 🛠️ Tech Stack & Rationale
- **TypeScript**: End-to-end type safety for robust code.
- **React (Vite/Next.js)**: Performant UI with optimized canvas rendering.
- **Node.js + Express**: REST API for metadata and auth.
- **Socket.IO**: Simplified real-time sync with rooms and reconnection logic.
- **MongoDB**: Flexible document storage for snapshots and metadata.
- **Redis**: Pub/sub for Socket.IO scaling and ephemeral state (sessions, rate-limiting).
- **Docker + Kubernetes**: Production parity and scalable deployments with CDN support.
- **BullMQ**: Reliable async job queues for exports and snapshotting.

---

## 📊 Data Models
### `boards` Collection
```json
{
  "_id": "board_abc",
  "name": "Team Brainstorm",
  "ownerId": "user_123",
  "privacy": "team",
  "createdAt": "2025-09-12T10:00:00Z",
  "lastSnapshotId": "snap_001",
  "snapshotMeta": { "snapshotId": "snap_001", "opIndex": 4567 }
}
```

### `snapshots` Collection
```json
{
  "_id": "snap_001",
  "boardId": "board_abc",
  "createdAt": "2025-09-12T10:00:00Z",
  "snapshotJson": { /* serialized board state: strokes, shapes, notes */ }
}
```

### `oplog` Collection (Append-Only)
```json
{
  "boardId": "board_abc",
  "seq": 4568,
  "opId": "user_123:162", // clientId:localCounter
  "type": "stroke.add",
  "payload": { "points": [[x1, y1], [x2, y2]], "color": "#000", "width": 2 },
  "createdAt": "2025-09-12T10:00:01Z"
}
```

---

## 📡 Real-Time Protocol
### Sample Events
- **Client → Server**:
  - `join`: `{ type: "join", boardId: "abc", userId: "user_123" }`
  - `stroke.add`: `{ type: "stroke.add", boardId: "abc", opId: "user_123:162", payload: { ... } }`
  - `cursor.update`: `{ type: "cursor.update", boardId: "abc", userId: "user_123", x: 100, y: 200 }`
- **Server → Client**:
  - `op.broadcast`: `{ type: "op.broadcast", boardId: "abc", opId: "user_123:162", serverSeq: 4568, payload: { ... } }`
  - `ack`: `{ type: "ack", opId: "user_123:162", serverSeq: 4568 }`
  - `presence.update`: `{ type: "presence.update", boardId: "abc", users: [{ userId: "user_123", x: 100, y: 200 }, ...] }`

**Design Notes**:
- `opId` (`clientId:counter`) ensures operation uniqueness.
- `serverSeq` or Lamport timestamps ensure deterministic ordering.
- See [docs/protocol.md](/docs/protocol.md) for full schemas.

---

## 🔄 Conflict Resolution
- **Approach**: Operational CRDT for strokes, shapes, and text (RGA or Yjs/Automerge for sticky notes).
- **Why CRDT**: Immutable operations (e.g., `stroke.add`, `stroke.delete`) simplify state convergence without data loss.
- **Tradeoffs**:
  - **CRDT**: Higher memory/message overhead but simpler to reason about.
  - **OT**: Compact but complex to implement correctly.
  - **Last-Writer-Wins**: Avoided due to potential data loss.
- **Interview Tip**: Discuss immutability, `opId` uniqueness, and snapshot compaction.

---

## 🚀 Quick Start
### Prerequisites
- Node.js >= 18 (or latest LTS)
- pnpm (recommended) or npm/yarn with workspace support
- Docker & Docker Compose (for MongoDB/Redis)
- Optional: minikube/kind/k3d for Kubernetes testing

### Clone
```bash
git clone https://github.com/<your-username>/collab-whiteboard.git
cd collab-whiteboard
cp .env.example .env
```

### Development (Fast)
Start all services (MongoDB, Redis, backend, frontend) with Docker Compose:
```bash
docker-compose -f infra/docker-compose.yml up --build
```

Start frontend and backend separately (dev mode):
```bash
# Backend (new terminal)
cd packages/api
pnpm install
pnpm dev

# Socket server (new terminal)
cd packages/socket
pnpm install
pnpm dev

# Frontend (new terminal)
cd packages/client
pnpm install
pnpm dev
```

Open `http://localhost:3000` to view the app.

### Environment Variables
```bash
# .env file
MONGO_URI=mongodb://localhost:27017/collab
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secure-secret
S3_BUCKET=collab-exports
S3_REGION=us-east-1
```

### Run Tests
```bash
# Unit and integration tests
pnpm --filter packages/api test
pnpm --filter packages/socket test
pnpm --filter packages/client test

# E2E tests
pnpm --filter tests e2e
```

---

## 📈 Benchmarks & Performance Targets
> *Note*: Run `scripts/bench/` (k6 or Artillery) to measure performance and update these targets.

- **Latency**: <200ms operation-to-propagation for boards with ≤50 concurrent users.
- **Throughput**: 2,000 ops/sec per server instance (depends on op size and persistence latency).
- **Snapshot Cadence**: Every 1,000 ops or 5 minutes, balancing storage and replay performance.
- **Export Speed**: 10 exports/min per worker with <5s average completion time.

See `docs/BENCHMARKS.md` for detailed results and benchmarking scripts.

---

## 🧪 Testing & Quality
- **Unit Tests**: Jest for server logic, CRDT operations, and shared utilities.
- **E2E Tests**: Playwright for multi-user sync and state convergence verification.
- **Property-Based Tests**: Fast-check for CRDT correctness, ensuring commutative and idempotent operations.
- **Load Tests**: k6 to measure p99 latency (<200ms) and throughput (2,000 ops/sec).
- **Linting/Formatting**: ESLint, Prettier, and Husky pre-commit hooks.
- **CI/CD**: GitHub Actions for lint, test, build, and deploy.

---

## 📊 Observability
- **Metrics**: Prometheus for `ops_processed_total`, `ops_latency_ms`, `active_connections`, `snapshot_duration_ms`, `reconnect_rate`.
- **Tracing**: OpenTelemetry for request, socket, and export job tracing (Jaeger compatible).
- **Logging**: Structured JSON logs with correlation IDs (Winston).
- **Error Tracking**: Sentry for real-time error monitoring.
- **Dashboards**: Grafana for visualizing metrics and health.

---

## 🛡️ Security
- **Authentication**: JWT with 15-minute expiry and refresh tokens; OAuth 2.0 for SSO.
- **Authorization**: Board-level ACLs (owner, editor, viewer).
- **Rate Limiting**: 100 ops/min/user for Socket.IO messages via Redis to prevent DoS.
- **Sanitization**: Sanitize user inputs (notes, chat) to prevent XSS.
- **Transport**: TLS for HTTPS/WSS; signed URLs for S3 exports.
- **Replay Protection**: Validate `opId` uniqueness and timestamps.

---

## ☁️ Deployment & Scaling
- **Docker**: Multi-stage `Dockerfile` for backend, socket, and frontend; `NODE_ENV=production`.
- **Kubernetes**: Helm charts in `infra/k8s/` for deployments, services, and autoscaling; CDN for static assets.
- **Socket.IO Scaling**: Redis adapter for pub/sub; session affinity for sticky sessions.
- **Board Partitioning**: Consistent hashing to colocate hot boards.
- **Multi-Region**: Regional MongoDB/Redis clusters with Kafka for cross-region sync.
- **CI/CD**: GitHub Actions for lint, test, build, and Helm-based deployment.

**Sample CI Workflow**:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm --filter tests e2e
```

---

## 🛠️ Troubleshooting & Runbook
- **Clients Fail to Connect**: Check WSS ingress, TLS certs, and load balancer sticky-session settings.
- **High Reconnect Rates**: Monitor `reconnect_rate` metric; inspect network issues or instance overload.
- **Snapshot Job Failure**: Verify worker logs, S3 credentials, and Redis queue health.
- **Oplog Growth**: Ensure snapshot scheduler and compaction jobs are running.
- **Export Failure**: Check BullMQ job queue for deduplication or retry errors.

See [docs/runbook.md](/docs/runbook.md) for detailed incident response procedures.

---

## 🛣️ Roadmap & Limitations
- **Roadmap**:
  - Per-board sharding for extreme scale.
  - Offline-first mobile experience with local event queue sync.
  - Session recording/playback and AI tools (shape/handwriting recognition).
- **Limitations**:
  - Heavy boards may require snapshot tuning for performance.
  - Export job speed depends on worker size and concurrency.

---

## 👥 Contribution Guidelines
- Branch: `feat/<short-desc>` or `fix/<short-desc>` from `main`.
- PRs: Include clear description, testing plan, and tests; run `pnpm lint && pnpm test`.
- Commits: Use descriptive messages; update `CHANGELOG.md` for releases.
- See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for details.

---

## 📚 Key Docs
- [architecture.md](/docs/architecture.md): System diagrams and flow.
- [protocol.md](/docs/protocol.md): Event schemas and versioning.
- [crdt-design.md](/docs/crdt-design.md): CRDT model and conflict scenarios.
- [runbook.md](/docs/runbook.md): Incident response and recovery guide.
- [RESUME_SNIPPET.md](/docs/RESUME_SNIPPET.md): Resume lines and interview talking points.
- [BENCHMARKS.md](/docs/BENCHMARKS.md): Performance results and scripts.

---

## 💼 Interview Notes (Short)
- **Elevator Pitch**: Built a production-ready collaborative whiteboard (MERN + Socket.IO, CRDTs) with oplog persistence, snapshotting, and async export pipelines, optimized for <200ms latency and scalability.
- **Key Topics**: Oplog compaction, CRDT vs. OT, event ordering (`opId` + `serverSeq`), WebSocket scaling (Redis pub/sub), async workers, observability, multi-region deployment.
- **Practice Qs**: 
  - How do you scale WebSockets for thousands of users?
  - How do you ensure deterministic state across clients?
  - How do you optimize oplog storage and compaction?
  - Why CRDT over OT or Last-Writer-Wins?
  - How do you secure and scale async export workers?

See [RESUME_SNIPPET.md](/docs/RESUME_SNIPPET.md) for detailed FAANG-style Q&A.

---

## 📜 License
MIT © Hare Sahani

---

## 📬 Contact
Created by **Hare Sahani** — [email@example.com](mailto:harecareer@gmail.com) | [LinkedIn](https://www.linkedin.com/in/hare-sahani-18239b240/) | [GitHub](https://github.com/haresahani) | [LeetCode](https://leetcode.com/u/haresahani/)

*This README is a living document—update badges, benchmarks, and demo links as you test and deploy.*