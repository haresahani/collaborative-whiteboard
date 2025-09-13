# Collab Whiteboard 🎨 — Production-Ready & FAANG/MANG-Grade

A **real-time, multi-user collaborative whiteboard** engineered for low-latency drawing, deterministic conflict resolution, and horizontal scaling. Built with a **MERN stack + Socket.IO**, it features an append-only oplog, periodic snapshots, and an async export pipeline. This project showcases production-grade system design, observability, and scalability for technical interviews or enterprise deployment.

[Demo GIF](/docs/demo.gif) | [Live Demo](https://demo.collab-whiteboard.app) *(replace with deployed URL)* | [Docs](/docs)

---

## 🚀 TL;DR (Recruiters & Quick Skim)
- **What**: Collaborative whiteboard with real-time, low-latency (<200ms) drawing, shapes, sticky notes, presence, undo/redo, and async exports for 100+ users.  
- **Why**: Demonstrates FAANG-level engineering: WebSocket scaling with Redis pub/sub, CRDT-based conflict resolution, observability, and production-grade infrastructure.  
- **Stack**: React (TypeScript), Node.js/Express, Socket.IO, MongoDB (oplog + snapshots), Redis (pub/sub), Docker, Kubernetes.  
- **Resume 1-Liner**: Built a production-ready collaborative whiteboard (MERN + Socket.IO) with oplog persistence, snapshotting every 1,000 ops, and async export pipelines, optimized for <200ms latency and scalability.

---

## 🎯 Features
### MVP
- Real-time multi-user drawing with Socket.IO/WebSockets.
- Persistent board state via MongoDB oplog + snapshots.
- Live cursors and user presence indicators.
- Board creation/joining via shareable URLs.
- Client-side PNG export fallback.

### Advanced
- Undo/redo with per-board version history.
- Sticky notes, shapes, and drag-select functionality.
- Async server-side export pipeline (BullMQ + headless rendering → S3).
- JWT-based auth and board-level ACLs (owner/editor/viewer).

### Production Polish
- Horizontal scaling with Redis pub/sub for Socket.IO.
- CRDT for text collaboration (Yjs/Automerge or custom lightweight RGA).
- Observability with OpenTelemetry, Prometheus, Grafana, and Sentry.
- Kubernetes deployment with Helm charts and autoscaling.

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
- **Redis**: Pub/sub for Socket.IO scaling and ephemeral state.
- **Docker + Kubernetes**: Production parity and scalable deployments.
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
- **Approach**: Operational CRDT for strokes, shapes, and text (Yjs/Automerge or custom RGA for sticky notes).
- **Why CRDT**: Immutable operations (e.g., `stroke.add`, `stroke.delete`) simplify state convergence without data loss.
- **Tradeoffs**:
  - **CRDT**: Higher memory/message overhead but simpler to reason about.
  - **OT**: Compact but complex to implement correctly.
  - **Last-Writer-Wins**: Avoided due to potential data loss.
- **Interview Tip**: Discuss immutability, opId uniqueness, and snapshot compaction for efficient storage.

---

## 🚀 Getting Started
### Prerequisites
- Node.js >= 18
- pnpm (recommended) or npm/yarn with workspace support
- Docker & Docker Compose (for MongoDB/Redis)
- Optional: AWS/GCP account for S3 export testing

### Local Development
```bash
# Clone repo
git clone https://github.com/<your-username>/collab-whiteboard.git
cd collab-whiteboard

# Install dependencies
pnpm install

# Start MongoDB + Redis
docker-compose -f infra/docker-compose.yml up -d

# Run services
pnpm --filter packages/api dev &        # REST API
pnpm --filter packages/socket dev &     # Socket.IO server
pnpm --filter packages/client dev       # React frontend
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

---

## 🧪 Testing & Quality
- **Unit Tests**: Jest for server logic and shared utilities.
- **E2E Tests**: Playwright for multi-user simulation and state verification.
- **Load Tests**: k6 to measure p99 latency under concurrent users.
- **Linting/Formatting**: ESLint, Prettier, and Husky pre-commit hooks.
- **CI/CD**: GitHub Actions for lint, test, build, and deploy.

---

## 📈 Observability
- **Metrics**: Prometheus for events/sec, connected users, and latency (p99).
- **Tracing**: OpenTelemetry for request and socket RPC tracing.
- **Logging**: Structured JSON logs with correlation IDs (Winston).
- **Error Tracking**: Sentry for real-time error monitoring.
- **Dashboards**: Grafana for visualizing metrics and health.

---

## 🛡️ Security
- **Authentication**: JWT with refresh tokens; OAuth 2.0 for SSO.
- **Authorization**: Board-level ACLs (owner, editor, viewer).
- **Rate Limiting**: Socket message limits per user to prevent DoS.
- **Sanitization**: Sanitize user inputs (notes, chat) to prevent XSS.
- **Secrets**: Managed via Kubernetes secrets or AWS SSM.

---

## ☁️ Deployment & Scaling
- **Docker Compose**: Local dev environment with MongoDB and Redis.
- **Kubernetes**: Helm charts for production deployment with autoscaling.
- **Socket.IO Scaling**: Redis adapter for pub/sub across socket instances.
- **Board Partitioning**: Consistent hashing to colocate hot boards.
- **Snapshotting**: Periodic snapshots and oplog compaction for performance.

---

## 🛣️ Roadmap
1. **Week 1**: Single-user canvas with oplog persistence.
2. **Week 2**: Real-time sync, presence, and basic auth.
3. **Week 3**: Undo/redo, shapes, sticky notes, and client export.
4. **Week 4**: Async export pipeline, snapshotter, and oplog compaction.
5. **Weeks 5–8**: CRDT for text, k8s deployment, observability, and load testing.

---

## 👥 Contribution Guidelines
- Branch: `feat/<short-desc>` or `fix/<short-desc>` from `main`.
- PRs: Include a clear description, testing plan, and relevant tests.
- Commits: Use descriptive messages; update `CHANGELOG.md` for releases.
- See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for details.

---

## 📚 Key Docs
- [architecture.md](/docs/architecture.md): System diagrams and flow.
- [protocol.md](/docs/protocol.md): Event schemas and versioning.
- [crdt-design.md](/docs/crdt-design.md): CRDT model and conflict scenarios.
- [runbook.md](/docs/runbook.md): Incident response and recovery guide.

---

## 💼 Interview Talking Points
**Resume Line**:
> Engineered a real-time collaborative whiteboard (MERN + Socket.IO) with oplog persistence, snapshotting, and async export pipelines, optimized for scalability and observability.

**Key Topics**:
1. **Oplog + Snapshots**: Enables state replay and efficient storage.
2. **Event Ordering**: `opId` + `serverSeq` vs. Lamport clocks.
3. **WebSocket Scaling**: Redis pub/sub and sticky sessions.
4. **Conflict Resolution**: CRDT vs. OT tradeoffs.
5. **Async Pipelines**: Export jobs, retries, and signed URLs.

**FAANG Questions to Nail**:
- How do you scale WebSockets for thousands of users?
- How do you ensure deterministic state across clients?
- How do you optimize oplog storage and compaction?
- Why choose CRDT over OT or Last-Writer-Wins?
- How do you secure and scale async export workers?

## 📜 License
MIT — Fork, learn, and contribute freely.