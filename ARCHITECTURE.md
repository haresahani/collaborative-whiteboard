# System Architecture & Technical Specifications

This document outlines the system architecture, component interactions, sequence flows, and data model specs for the **Collaborative Whiteboard** application.

---

## 1. System Topology Overview

The system is structured as a modular TypeScript monorepo (`pnpm`) featuring an event-driven, authoritative server architecture with real-time websocket synchronization, distributed job queue compaction, and MongoDB document persistence.

```mermaid
graph TD
    subgraph Clients ["Client Layer"]
        C1["React Client A<br/>(Zustand + HTML5 Canvas)"]
        C2["React Client B<br/>(Zustand + HTML5 Canvas)"]
    end

    subgraph Realtime ["Realtime Gateway Layer"]
        S1["Socket.IO Server Node 1<br/>(:3001)"]
        S2["Socket.IO Server Node 2<br/>(:3001)"]
        RedisPubSub[("Redis Pub/Sub<br/>Socket.IO Adapter")]
        S1 <--> RedisPubSub
        S2 <--> RedisPubSub
    end

    subgraph API ["REST API Layer"]
        API1["Express REST API<br/>(:1234 Auth, Board & Oplog CRUD)"]
    end

    subgraph AsyncWorker ["Background Processing Layer"]
        Worker["BullMQ Worker<br/>(Oplog Compaction & Snapshotting)"]
    end

    subgraph Storage ["Persistence & Data Store Layer"]
        MongoDB[("MongoDB Database<br/>(Boards, Snapshots, Oplogs, Users)")]
        RedisQueue[("Redis Queue / Cache<br/>(BullMQ Jobs & Lock Gateway)")]
    end

    subgraph Telemetry ["Observability & Metrics Layer"]
        Prometheus["Prometheus Metrics<br/>(/metrics)"]
        Grafana["Grafana Dashboards"]
        OTel["OpenTelemetry / Jaeger Tracing"]
    end

    C1 <-->|"WebSocket (Socket.IO)"| S1
    C2 <-->|"WebSocket (Socket.IO)"| S2
    C1 -->|"HTTP REST (JWT Auth)"| API1
    C2 -->|"HTTP REST (JWT Auth)"| API1

    S1 -->|"Save Ops & Read Snapshots"| MongoDB
    S2 -->|"Save Ops & Read Snapshots"| MongoDB
    API1 -->|"Manage Users & Board Metadata"| MongoDB

    S1 -->|"Enqueue Compaction Jobs"| RedisQueue
    Worker <-->|"Fetch/Process Jobs & Locks"| RedisQueue
    Worker <-->|"Compact Oplog to Snapshot"| MongoDB

    S1 -.-> Prometheus
    Worker -.-> Prometheus
    API1 -.-> Prometheus
    Prometheus -.-> Grafana
    S1 -.-> OTel
```

---

## 2. Component Responsibilities

| Package                                                                            | Role                                                                                                               | Key Technologies                                  |
| :--------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------- | :------------------------------------------------ |
| [`packages/client`](file:///d:/collaborative-whiteboard/packages/client)           | Web UI, interactive canvas engine, local optimistic state, undo/redo history, export renderer.                     | React 18, Vite, Zustand, HTML5 Canvas API         |
| [`packages/socket`](file:///d:/collaborative-whiteboard/packages/socket)           | Scoped board room gateway, sequence number (`seq`) assignment, presence cursor tracking, op validation, broadcast. | Socket.IO, `@socket.io/redis-adapter`, Pino, OTel |
| [`packages/api`](file:///d:/collaborative-whiteboard/packages/api)                 | Authentication (JWT), board CRUD endpoints, direct REST oplog appends, snapshot REST endpoints.                    | Express, Mongoose, Zod, JWT                       |
| [`packages/worker`](file:///d:/collaborative-whiteboard/packages/worker)           | Async background worker executing background oplog compaction, snapshot pruning, and export generation.            | BullMQ, Redis, Mongoose                           |
| [`packages/shared`](file:///d:/collaborative-whiteboard/packages/shared)           | Shared TypeScript interfaces, operation schemas, canvas shape definitions, error codes.                            | TypeScript                                        |
| [`packages/infra-utils`](file:///d:/collaborative-whiteboard/packages/infra-utils) | Shared metrics utilities, Pino logging setup, OpenTelemetry exporter configuration.                                | Prometheus client, Pino, OpenTelemetry SDK        |

---

## 3. Sequence Flow Diagrams

### Sequence Flow 1: Board Join & State Hydration

When a client opens `/board/:id`, it authenticates via JWT, establishes a WebSocket connection with the Socket gateway, joins the specified board room, and hydrates its local canvas state.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as React Client (Zustand)
    participant API as Express API Server
    participant Socket as Socket.IO Gateway
    participant DB as MongoDB

    User->>Client: Open /board/:boardId
    Client->>API: GET /api/v1/boards/:boardId (Bearer Token)
    API->>DB: Query Board metadata
    DB-->>API: Return Board info
    API-->>Client: 200 OK (Board Details)

    Client->>Socket: Socket Connect (auth: { token })
    Socket->>Socket: Validate JWT & Extract User Info
    Socket-->>Client: Connection Established

    Client->>Socket: emit("join.board", { boardId })
    Socket->>DB: Fetch Latest Snapshot (boardId)
    DB-->>Socket: Return Snapshot (version N, elements: [...])
    Socket->>DB: Fetch Oplog Entries (version > N) ordered by seq ASC
    DB-->>Socket: Return Ops [N+1, N+2, ...]

    Socket->>Socket: Add Socket to Room ("board:boardId")
    Socket-->>Client: emit("join.board.success", { snapshot, ops, presenceList })

    Socket-->>Client: broadcast("presence.update", { user, status: "joined" }) (to room)

    Client->>Client: Apply Snapshot + Replay Ops to Zustand Store
    Client->>User: Render Live Canvas State
```

---

### Sequence Flow 2: Operation Commit & Realtime Broadcast

When a user draws a shape or edits an element, the client updates locally immediately (optimistic UI) and emits an operation to the Socket gateway. The server validates the operation, assigns a monotonic sequence number `seq`, persists it to MongoDB, and broadcasts it to all other room members.

```mermaid
sequenceDiagram
    autonumber
    actor UserA as User A (Drawer)
    participant ClientA as Client A
    participant Socket as Socket.IO Gateway
    participant DB as MongoDB
    actor UserB as User B (Viewer)
    participant ClientB as Client B

    UserA->>ClientA: Draw Line / Move Shape
    ClientA->>ClientA: Apply local optimistic update in Zustand
    ClientA->>Socket: emit("op:submit", { boardId, op: { type: "DRAW", shape: {...} } })

    Socket->>Socket: Validate Operation Schema & Permissions
    Socket->>DB: Acquire Next Monotonic Sequence (`seq`) for Board
    DB-->>Socket: Assigned seq = 104

    Socket->>DB: Persist Operation Document (seq=104, opId, payload, timestamp)
    DB-->>Socket: Persisted OK

    Socket-->>ClientA: ack("op:ack", { opId, seq: 104, status: "COMMITTED" })

    Socket->>ClientB: broadcast("op:broadcast", { seq: 104, op: {...} }) (to room)
    ClientB->>ClientB: Receive Op (seq 104) -> Apply to Zustand store
    ClientB->>UserB: Render updated element on Canvas
```

---

### Sequence Flow 3: Background Snapshot Persist & Compaction

To keep room join latencies fast ($O(\text{elements})$ instead of replaying thousands of historical ops), a background BullMQ worker periodically compacts accumulated oplog entries into a new unified board snapshot.

```mermaid
sequenceDiagram
    autonumber
    participant Socket as Socket.IO Gateway
    participant Redis as Redis Queue (BullMQ)
    participant Worker as BullMQ Worker
    participant DB as MongoDB

    Note over Socket: Oplog count exceeds threshold (e.g. 50 ops)
    Socket->>Redis: Enqueue Job ("compact-board-oplog", { boardId })

    Worker->>Redis: Pop Compaction Job
    Worker->>Redis: Acquire Distributed Redis Lock ("lock:compaction:boardId")
    Redis-->>Worker: Lock Granted

    Worker->>DB: Fetch Base Snapshot (Version V)
    DB-->>Worker: Return Base Snapshot
    Worker->>DB: Fetch Uncompacted Ops (seq > V.version)
    DB-->>Worker: Return Ops List [Op_V+1 ... Op_V+K]

    Worker->>Worker: Replay & Merge Ops into Consolidated Snapshot State
    Worker->>DB: Upsert New Snapshot Document (Version V+K, elements: [...])
    DB-->>Worker: Snapshot Saved

    Worker->>DB: Delete/Archive Compacted Oplogs (seq <= V+K)
    DB-->>Worker: Oplogs Pruned

    Worker->>Redis: Release Lock
    Worker->>Socket: Emit Telemetry Metric (`snapshots.compacted.inc()`)
```

---

## 4. Data Schemas & Models

### Board Document (`boards`)

```json
{
  "_id": "60b8d5f3f9824c18f0ad562a",
  "title": "Architecture Blueprint",
  "ownerId": "user_123",
  "createdAt": "2026-08-13T10:00:00.000Z",
  "updatedAt": "2026-08-13T10:45:00.000Z"
}
```

### Operation Document (`oplogs`)

```json
{
  "_id": "op_987654321",
  "boardId": "60b8d5f3f9824c18f0ad562a",
  "seq": 104,
  "userId": "user_123",
  "type": "ELEMENT_UPDATE",
  "payload": {
    "elementId": "elem_rectangle_01",
    "changes": { "x": 250, "y": 320, "width": 180, "height": 90 }
  },
  "clientTimestamp": 1723545600000,
  "createdAt": "2026-08-13T10:45:01.120Z"
}
```

### Snapshot Document (`snapshots`)

```json
{
  "_id": "snap_104",
  "boardId": "60b8d5f3f9824c18f0ad562a",
  "version": 104,
  "elements": {
    "elem_rectangle_01": {
      "id": "elem_rectangle_01",
      "type": "rectangle",
      "x": 250,
      "y": 320,
      "width": 180,
      "height": 90,
      "strokeColor": "#3b82f6",
      "fillColor": "#eff6ff",
      "strokeWidth": 2,
      "updatedAt": 1723545600000
    }
  },
  "updatedAt": "2026-08-13T10:45:02.000Z"
}
```

---

## 5. Fault Tolerance & Reconnection Architecture

1. **Optimistic Local Execution**: The client instantly updates local Zustand state when drawing. If the network drops or server rejects the op, the client rolls back to the last confirmed server sequence state (`seq`).
2. **Monotonic Sequence Ordering (`seq`)**: The Socket server uses atomic incremental updates in MongoDB (`$inc`) to assign unique monotonic sequence numbers per board, guaranteeing global linear ordering.
3. **Automatic Reconnection & Gap Replay**: Upon WebSocket reconnection, the client sends its last known sequence number (`lastSeq`). The gateway fetches only missed operations (`seq > lastSeq`) and sends them in batch, preventing full page reloads.
4. **Worker Idempotency & Compaction Locks**: Snapshot compaction jobs use Redis key locks (`lock:compaction:<boardId>`) with TTLs to ensure only one worker node compacts a board at any given time.
