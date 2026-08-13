# Collaborative Whiteboard Documentation Index

Welcome to the technical documentation for the **Collaborative Whiteboard** system monorepo.

---

## 🏛️ Architecture & System Design

- **[ARCHITECTURE.md](../ARCHITECTURE.md)**: Main architecture document featuring system topology, component responsibilities, data schemas, and Mermaid sequence diagrams for:
  - Join & State Hydration Flow
  - Operation Commit & Realtime Broadcast Flow
  - Snapshot Persist & BullMQ Compaction Flow
- **[DESIGN_DOC.md](../DESIGN_DOC.md)**: System design document detailing choices made, deep-dive comparison (**CRDT vs OT vs Authoritative Monotonic Server**), snapshotting strategy, and scalability roadmap.
- **[docs/collaboration-model.md](collaboration-model.md)**: Real-time synchronization rules, sequence ordering, and conflict resolution strategy.
- **[docs/package-responsibilities.md](package-responsibilities.md)**: Monorepo package boundaries (`client`, `socket`, `api`, `worker`, `shared`, `infra-utils`).
- **[docs/protocol.md](protocol.md)**: WebSocket event contracts (`join.board`, `op:submit`, `op:broadcast`, `presence.update`).

---

## 🚀 Operations, Testing & Interview Preparation

- **[docs/DEMO_SCRIPT.md](DEMO_SCRIPT.md)**: Step-by-step 2–3 minute video presentation script & live interview demo guide.
- **[docs/INTERVIEW_NOTES.md](INTERVIEW_NOTES.md)**: Strategic talking points, tradeoffs explanations, and narrative positioning for senior technical interviews.
- **[docs/runbook.md](runbook.md)**: Local development setup, Docker dependencies, environment configurations, and operational troubleshooting.
- **[docs/testing-guide.md](testing-guide.md)**: Overview of the 70+ automated integration test suite across client, API, socket, worker, and infra packages.
- **[docs/OBSERVABILITY.md](OBSERVABILITY.md)**: Metrics (/metrics), Grafana dashboards, Pino logging setup, and OpenTelemetry / Jaeger distributed tracing integration.
- **[docs/MULTI_REGION_HA.md](MULTI_REGION_HA.md)**: Multi-region high-availability design and disaster recovery specs.
