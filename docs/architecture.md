# Architecture Overview — Collab Whiteboard

This document outlines the system architecture for the **Collab Whiteboard**, a real-time, multi-user collaborative whiteboard built with a MERN stack (MongoDB, Express, React, Node.js) and Socket.IO. The design prioritizes low-latency synchronization, deterministic conflict resolution, horizontal scalability, and production-grade observability. It is engineered to handle thousands of concurrent users while maintaining performance and reliability.

## 📐 High-Level Architecture

The system follows a distributed, event-driven architecture with stateless application layers and persistent storage for board state. Below is an ASCII diagram of the core components and their interactions:

```
┌──────────────────────┐       ┌──────────────────────┐
│   Browser Clients    │◄─────►│   Load Balancer      │
│   (React + TS)       │ HTTPS │   (NGINX / AWS ALB)  │
└──────────────────────┘ WS    └──────────────────────┘
                                 │
┌──────────────────────┐         │
│ Stateless App Layer  │◄────────┘
│ - API (Express)      │
│ - Socket (Socket.IO) │
└──────────────────────┘
    │         │         │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│MongoDB │ │ Redis │ │Workers │
│(oplog, │ │(pub/ │ │(BullMQ)│
│snapshots)│ sub)  │ │exports │
└────────┘ └───────┘ └───────┘
                       │
                   ┌───▼───┐
                   │  S3   │
                   │(exports)│
                   └───────┘
```

### Component Breakdown

1. **Client (React + TypeScript)**:
   - Renders the whiteboard canvas, toolbar, sticky notes, and live cursors.
   - Manages local state, operation buffering, and undo/redo stacks.
   - Communicates with the server via REST (board metadata) and Socket.IO (real-time ops).

2. **Load Balancer (e.g., NGINX, AWS ALB)**:
   - Routes HTTPS requests to the REST API and WebSocket connections to Socket.IO servers.
   - Supports sticky sessions for WebSocket connections to reduce Redis overhead.

3. **API Layer (Node.js + Express)**:
   - Handles board metadata (creation, permissions) and snapshot retrieval.
   - Secured with JWT-based authentication and board-level ACLs.
   - Connects to MongoDB for persistent storage.

4. **Socket Layer (Socket.IO)**:
   - Manages real-time synchronization of drawing operations, cursors, and presence.
   - Stateless workers use Redis pub/sub for cross-instance communication.
   - Implements rate-limiting to prevent abuse.

5. **MongoDB**:
   - Stores board metadata, snapshots, and append-only oplog.
   - Oplog ensures recoverable board state; snapshots optimize performance.

6. **Redis**:
   - Powers pub/sub for Socket.IO scaling across instances.
   - Caches ephemeral state (e.g., active users, sessions).
   - Supports rate-limiting for socket messages.

7. **Background Workers (BullMQ)**:
   - Handles async tasks: snapshot creation, oplog compaction, and export rendering.
   - Exports use headless rendering (Puppeteer/node-canvas) and upload to S3.

8. **Object Storage (S3)**:
   - Stores exported board images (PNG/PDF) with signed URLs for secure access.

---

## 📡 Real-Time Synchronization

The system uses an **event-driven protocol** over Socket.IO for low-latency collaboration. Key events include:

- **Join**: Clients join a board (`boardId`) and receive the latest snapshot + recent ops.
- **Operation (op)**: Clients send operations (e.g., `stroke.add`, `note.update`) with unique `opId` (`clientId:counter`).
- **Broadcast**: Servers broadcast ops to all connected clients in the same board.
- **Acknowledgment (ack)**: Servers confirm ops with a `serverSeq` for ordering.

### Conflict Resolution

- **CRDT (Conflict-Free Replicated Data Type)**:
  - Used for strokes, shapes, and sticky note text (Yjs/Automerge or custom RGA).
  - Operations are immutable (e.g., `stroke.add`, `stroke.delete`).
  - Unique `opId` and `serverSeq` ensure deterministic convergence.
- **Tradeoffs**:
  - CRDTs simplify reasoning but increase message size.
  - Operational Transformation (OT) was considered but avoided due to implementation complexity.
  - Last-Writer-Wins is unsuitable due to potential data loss.

---

## 💾 Data Flow & Persistence

1. **Client Operation**:
   - User draws a stroke → client generates `opId` → sends `{ type: "stroke.add", payload }` via Socket.IO.
2. **Server Processing**:
   - Socket server validates the op, assigns a `serverSeq`, and stores it in the MongoDB oplog.
   - Broadcasts the op to other clients via Redis pub/sub.
3. **Snapshotting**:
   - A background worker periodically creates snapshots of the board state.
   - Snapshots are stored in MongoDB; older oplog entries are compacted.
4. **State Recovery**:
   - New clients load the latest snapshot and replay recent ops to rebuild the board.

### Example Data Flow

```
User A draws stroke → Client A: { type: "stroke.add", opId: "userA:123", payload: {...} }
→ Socket Server: validate, assign serverSeq=4568, store in oplog
→ Redis Pub/Sub: broadcast to all socket instances
→ All Clients: receive op, update canvas
→ Server: send { type: "ack", opId: "userA:123", serverSeq: 4568 }
```

---

## 📈 Scalability

- **Socket.IO Scaling**:
  - Stateless socket servers scale horizontally with Redis pub/sub for cross-instance sync.
  - Consistent hashing routes boards to specific socket pools for locality.
- **Database**:
  - MongoDB shards the oplog and snapshots by `boardId` for large-scale deployments.
  - Snapshots reduce oplog replay time for new clients.
- **Workers**:
  - BullMQ workers autoscale based on queue length.
  - Export jobs are idempotent with retry logic.
- **Load Balancer**:
  - Sticky sessions minimize Redis queries for WebSocket connections.
  - Health checks ensure only healthy socket instances receive traffic.

---

## 🛡️ Security

- **Authentication**: JWT with refresh tokens; OAuth 2.0 for SSO.
- **Authorization**: Board-level ACLs (owner, editor, viewer) stored in MongoDB.
- **Rate Limiting**: Redis-based limits on socket messages per user.
- **Sanitization**: User inputs (notes, chat) sanitized to prevent XSS.
- **Network**: HTTPS/WSS for all client-server communication; CORS restricted to trusted origins.

---

## 📊 Observability

- **Metrics** (Prometheus):
  - Events per second, connected users, p99 latency, snapshot duration.
  - Worker queue depth and export job success rate.
- **Tracing** (OpenTelemetry):
  - End-to-end tracing for REST requests, socket ops, and worker jobs.
- **Logging** (Winston):
  - Structured JSON logs with correlation IDs for debugging.
- **Error Tracking** (Sentry):
  - Real-time alerts for client and server errors.
- **Dashboards** (Grafana):
  - Visualizes metrics and health for operational insights.

---

## ☁️ Deployment

- **Local**: Docker Compose for MongoDB, Redis, and app services.
- **Production**: Kubernetes with Helm charts for API, socket, and worker pods.
- **CI/CD**: GitHub Actions for linting, testing, building, and deploying.
- **Secrets**: Managed via Kubernetes secrets or AWS SSM.
- **Infra as Code**: Terraform for provisioning cloud resources (optional).

---

## 🛠️ Key Design Decisions

1. **Oplog + Snapshots**:
   - Append-only oplog ensures auditability and recoverability.
   - Snapshots reduce replay time and storage costs.
2. **Socket.IO over Raw WebSockets**:
   - Simplifies room management, reconnection, and fallback transports.
3. **CRDT for Conflict Resolution**:
   - Prioritizes simplicity and correctness over OT’s complexity.
4. **Redis Pub/Sub**:
   - Enables stateless socket servers and horizontal scaling.
5. **Async Exports**:
   - Offloads rendering to workers for scalability and reliability.

---

## 📚 Further Reading

- [protocol.md](/docs/protocol.md): Detailed event schemas and versioning.
- [crdt-design.md](/docs/crdt-design.md): CRDT implementation and conflict scenarios.
- [runbook.md](/docs/runbook.md): Incident response and recovery procedures.
