# Collaborative Whiteboard — FAANG/MANG-ready

A real-time, multi-user whiteboard built with a **MERN-style stack** and **Socket.IO (or WebSocket)**. This project is designed for low-latency drawing, deterministic conflict resolution, and horizontal scaling. The goal is to present a production-quality structure that highlights key engineering tradeoffs and careful design thinking for technical interviews.

## 🚀 Elevator Pitch

This is a real-time, multi-user whiteboard application. It supports drawing, shapes, sticky notes, chat, undo/redo, live cursors, and recoverable board state using an append-only **op-log** with periodic **snapshots**. The architecture is built with testability, observability, and horizontal scaling as primary considerations.

## ⭐ Why this Stands Out in an Interview

This project demonstrates a deep understanding of several critical engineering concepts:

- **Distributed Systems Thinking:** Showcases knowledge of concepts like op-logs, snapshots, and the tradeoffs between different **CRDT** (Conflict-free Replicated Data Type) and **OT** (Operational Transformation) models.
- **Real-Time Engineering:** Implements core real-time functionalities using **WebSockets**, including event ordering, throttling, and robust reconnection strategies.
- **Scaling & Reliability:** Utilizes **Redis pub/sub** for cross-instance communication, and employs state partitioning, snapshotting, and dedicated worker processes to ensure reliability and scalability.
- **DevOps Maturity:** Includes a well-defined infrastructure setup using **Docker**, **k8s/Helm**, and a **CI/CD pipeline**, demonstrating an understanding of production deployment.
- **Code Quality & Structure:** The project is structured as a monorepo, with a focus on typed interfaces (**TypeScript**), shared code, and automated testing.

## 📁 Repo Layout (High-Level)

This repository follows a **monorepo/workspace pattern**, which allows the client, server, and shared code to be typed and versioned together. This structure signals maturity and simplifies cross-stack refactors.

```
/                       # repo root
├─ .github/workflows/    # CI / CD pipelines (lint, test, build, deploy)
├─ docs/                 # design docs: architecture, CRDT design, API contract
├─ infra/                # docker-compose, k8s manifests, helm charts
├─ packages/             # monorepo packages
│  ├─ client/            # React app (Vite or Next) — TypeScript
│  ├─ api/               # Express REST + auth + board metadata
│  ├─ socket/            # Socket.IO cluster server (stateless workers)
│  ├─ worker/            # background jobs (snapshotting, op compaction)
│  ├─ shared/            # TS types, protobufs/JSON schemas, util libs
│  └─ infra-utils/       # deployment helpers, health checks
├─ scripts/              # helper scripts (seed, load-test, migrate)
├─ tests/                # e2e and load tests (playwright / k6)
├─ .eslintrc.js
├─ .prettierrc
├─ package.json          # repo-level workspaces
└─ README.md
```

*Note:* While a simpler two-folder structure (`/client`, `/server`) could be used, the monorepo approach is common in large engineering organizations and showcases production readiness.

## 📌 Folder/File Details (Explanation)

- `packages/client`: A **React + TypeScript** application.
  - `src/components`: Reusable UI components for the Canvas, Toolbar, Cursors, and Sticky Notes.
  - `src/state`: Handles local state, op buffering, and undo/redo stacks.
- `packages/api`: **Express + MongoDB** for managing metadata and snapshots.
  - `src/controllers/board.ts`: CRUD operations for boards and snapshot retrieval.
  - `src/models/board.model.ts`: Mongoose schemas.
- `packages/socket`: The **WebSocket/Socket.IO** server, designed to be stateless.
  - `src/pubsub.ts`: The **Redis pub/sub bridge** for cross-instance communication.
- `packages/worker`: Dedicated worker processes for background tasks.
  - `snapshotter.ts`: Creates snapshots from the op-log and compacts them.
- `packages/shared`: Shared TypeScript types and validation schemas.
  - `protocol.ts`: All socket event interfaces.
  - `crdt.ts`: Shared CRDT helpers and deterministic serializers.
- `infra/`: Deployment and operations files.
  - `docker-compose.yml`: A quick setup for local development.
  - `k8s/`, `helm/`: Manifests and charts for production deployment.
- `docs/`: Written design documents. These are invaluable for interview conversations.
  - `architecture.md`, `crdt-design.md`, `scaling-plan.md`, `runbook.md`.

## 🔧 Tech Choices & Rationale

- **TypeScript** across the entire stack to ensure type safety and reduce bugs.
- **React (Vite/Next.js)** for a performant client, especially for canvas rendering.
- **Node.js + Express** for the REST API and metadata endpoints.
- **Socket.IO** (or raw WebSocket) for real-time synchronization, simplifying features like rooms and reconnections.
- **MongoDB** for storing snapshots and metadata due to its flexible document model.
- **Redis** for real-time pub/sub and ephemeral state management across socket instances.
- **Docker** and **Kubernetes (k8s)** for production parity and demonstrating DevOps knowledge.

## ⚙️ Example Data Models (MongoDB)

Here are simplified examples of the data models used for the core components:

**`boards` collection (snapshot metadata)**

```json
{
  _id: ObjectId("..."),
  name: "Team Retro",
  ownerId: "user_123",
  createdAt: "2025-09-01T...",
  lastSnapshot: "snapshot_2025_09_01",
  snapshotMeta: {
    snapshotId: "s_0001",
    opIndex: 4567
  }
}
```

**`snapshots` collection**

```json
{
  snapshotId: "s_0001",
  boardId: ObjectId("..."),
  createdAt: "2025-09-01T...",
  snapshotJson: { /* vector strokes, notes, shapes */ }
}
```

**`oplog` (append-only)**

```json
{
  boardId: ObjectId("..."),
  seq: 4568,
  event: { type: "stroke.add", payload: { /* stroke data + clientCRDTId */ } },
  createdAt: "2025-09-01T..."
}
```

## 🔁 Real-time Protocol (Sample Events)

A crucial part of the system is the event-based real-time protocol.

- **Join Board:** `{ type: 'join', boardId: 'abc', userId: 'u1' }`
- **Stroke Event:** `{ type: 'stroke.add', boardId: 'abc', opId: 'u1:162', payload: { ... } }`
- **Server Acknowledgment:** `{ type: 'ack', opId: 'u1:162', serverSeq: 4568 }`

*Design Tips:*

- Include a unique `opId` (`clientId:localCounter`) to ensure globally unique operations.
- Add optional `lamport` or `serverSeq` numbers for strict event ordering.

## 🔬 Conflict Model (for Interview Discussion)

The recommended approach is to use an **operational CRDT** for independent primitives like strokes and shapes. **Each stroke is immutable**, and edits generate new operations (e.g., `stroke.transform`, `stroke.delete`). For text in sticky notes, you can either use a mature CRDT library like **Yjs** or **Automerge**, or a simplified sequence CRDT (e.g., RGA/Logoot).

**Key Takeaways:**

- Immutability simplifies state transformations.
- Concurrent add/delete operations can be resolved deterministically using timestamps and unique `opId`s.

**Tradeoffs to discuss:**

- **CRDTs** can increase message size and memory overhead.
- **Operational Transformation (OT)** can be more compact but is complex to implement and reason about.
- Explain why **Last-Writer-Wins**, though simple, is generally not a good choice for collaborative apps as it can lead to data loss.

## ✅ Getting Started (Developer Quickstart)

### Prerequisites

- Node.js >= 18
- pnpm, yarn, or npm with workspaces
- Docker & Docker Compose (for local Mongo/Redis)

### Quick Local Dev

```sh
# at repo root
pnpm install

# bring up infra (Mongo + Redis)
docker-compose -f infra/docker-compose.yml up -d

# start server and socket in dev (monorepo script)
pnpm --filter "packages/api..." dev &
pnpm --filter "packages/socket..." dev &
pnpm --filter "packages/client..." dev
```

*Tip:* Keep `NODE_ENV=development` for local testing. Use `pnpm run start:prod` or the provided `Dockerfile` for production builds.

## 🧪 Testing & Quality

- **Unit Tests:** **Jest** for server and shared logic.
- **Integration Tests:** **Playwright** to simulate multi-user interactions and verify the final board state.
- **Load Tests:** **k6** or **Artillery** to measure p99 latency under load.
- **Linting & Formatting:** **ESLint**, **Prettier**, and **Husky** pre-commit hooks.

## 📈 Observability & SLOs

- **Metrics:** Track key performance indicators like events per second, connected users, message latency, snapshot duration, and op-log growth.
- **Tracing:** Use **OpenTelemetry** to trace requests and socket RPCs.
- **Logging:** Use structured JSON logs with correlation IDs for easy debugging.

## 🛡️ Security

- **Authentication:** **JWT + refresh tokens** for clients; **OAuth 2.0** for SSO.
- **Authorization:** Implement **ACL (Access Control Lists)** for board roles (owner/editor/viewer).
- **Rate Limiting:** Protect against DoS attacks by rate-limiting socket messages per user.
- **Content Sanitization:** Prevent script injection by sanitizing all user-generated content (e.g., sticky notes, chat).

## ☁️ Deployment & Scaling Notes

- **Horizontal Scaling:** The **stateless socket servers** can be easily scaled up or down, with **Redis pub/sub** bridging communication between them.
- **Partitioning:** Consider routing boards to specific socket pools using **consistent hashing** to colocate hot boards and optimize performance.
- **Snapshotting:** A crucial part of the scaling strategy is to periodically snapshot large boards and compact the older op-logs to maintain performance and reduce state size.

## 🗣️ Interview Demo Script (2–5 minutes)

Use this script to guide your demo and highlight key features:

1. Open two browser windows and join the same board.
2. Demonstrate real-time drawing and show **live cursors**.
3. Create a sticky note and concurrently edit the text from both windows, explaining how the CRDT resolves conflicts.
4. Simulate a disconnection, continue drawing, then reconnect and show how the **op-log replay** restores the state.
5. Briefly show the admin dashboard (connected users, ops/sec) or load test results.
6. Summarize the architectural tradeoffs and explain how you would scale to 100k users.

## 🛣 Roadmap / Suggested Milestones

- **Week 1:** Minimal single-user canvas with persistence.
- **Week 2:** Real-time socket sync and basic operations.
- **Week 3:** Undo/redo, presence indicators, and reconnection logic.
- **Week 4:** Snapshotter worker and basic scaling infrastructure.
- **Weeks 6-8:** Production hardening (metrics, CI/CD, k8s) and comprehensive end-to-end tests.

## 👥 Contribution & PR Guidelines

- Branch from `main` using `feat/<short-desc>` or `fix/<short-desc>`.
- Each PR must include a clear description and a testing plan.
- Add unit and integration tests for all new logic.
- Use `CHANGELOG.md` for major changes and release notes.

## 📎 Useful Docs to Keep in `docs/`

- `architecture.md`: ASCII/PlantUML diagrams of the system.
- `protocol.md`: Detailed event schemas and versions.
- `crdt-design.md`: A deep dive into the CRDT model, conflict examples, and test cases.
- `runbook.md`: Instructions for restoring a board from snapshots or handling production incidents.

## LICENSE

This project is licensed under the **MIT License**, which is recommended for showcasing public projects.