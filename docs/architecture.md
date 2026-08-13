# Architecture Overview & Specifications

> [!TIP]
> The primary, detailed architecture specification with Mermaid sequence diagrams (Join, Op Commit, Snapshot Persist) and component layout is located in [ARCHITECTURE.md](../ARCHITECTURE.md).

## System Architecture Summary

The Collaborative Whiteboard architecture follows an **authoritative server with monotonic sequence ordering** pattern:

```text
React Client (Zustand) <---> Socket.IO Gateway Server <---> MongoDB (Oplog & Snapshots)
      |                              |                              ^
      | REST                         | BullMQ Queue                 |
      v                              v                              |
Express API Server -------------> Redis <------------------- BullMQ Worker (Compaction)
```

### Core Architecture Components

1. **[`packages/client`](../packages/client)**: React + Zustand whiteboard editor featuring optimistic UI updates, local undo/redo history stack, and real-time presence cursor rendering.
2. **[`packages/socket`](../packages/socket)**: Authoritative Socket.IO room gateway for board operation ordering (`seq`), payload validation, real-time broadcasting, and room presence management.
3. **[`packages/api`](../packages/api)**: Express REST API managing authentication (JWT), board metadata CRUD, and direct snapshot/oplog queries.
4. **[`packages/worker`](../packages/worker)**: BullMQ background job worker handling async snapshot compaction, oplog pruning, and background export tasks.
5. **[`packages/shared`](../packages/shared)**: Shared domain contracts, element shapes, operation types, and Zod schemas.
6. **[`packages/infra-utils`](../packages/infra-utils)**: Observability infrastructure providing Prometheus metrics (`/metrics`), Pino structured logging, and OpenTelemetry instrumentation.

### Key Architectural Documents

- [Main Architecture & Sequence Diagrams](../ARCHITECTURE.md)
- [System Design Doc & Tradeoffs (CRDT vs Authoritative Server)](../DESIGN_DOC.md)
- [Realtime Protocol & Synchronization Specs](protocol.md)
- [Monorepo Package Responsibilities](package-responsibilities.md)
