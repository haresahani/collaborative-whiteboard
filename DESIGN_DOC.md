# System Design Document: Collaborative Whiteboard

**Author**: Senior System Architect  
**Status**: Implemented (V1 Production Ready)  
**Target Architecture**: Real-time Collaborative Canvas Engine with Authoritative State Synchronization

---

## 1. Executive Summary & Design Goals

The **Collaborative Whiteboard** system provides low-latency, real-time multi-user editing of graphical canvas elements (rectangles, circles, lines, freehand drawing, sticky notes, and text).

### Key Technical Objectives

- **Sub-50ms Edit Latency**: Local optimistic state updates deliver immediate visual feedback.
- **Deterministic State Convergence**: Zero client divergence across concurrent multi-user editing sessions.
- **Fast Room Hydration**: Cold-start board join time under 100ms regardless of board history length.
- **System Simplicity & Operability**: Defensible, clean architecture without premature distributed system complexity.

---

## 2. Key Architecture Choices Made

| Architectural Dimension | Choice Made                            | Rationale                                                                                                          |
| :---------------------- | :------------------------------------- | :----------------------------------------------------------------------------------------------------------------- |
| **Sync Protocol**       | Socket.IO WebSockets                   | Automatic reconnection, transport fallbacks (HTTP long-polling), and built-in room abstractions (`board:boardId`). |
| **Ordering Model**      | Authoritative Monotonic Server (`seq`) | Server assigns a strict sequence number per board. Guarantees deterministic total order for all operations.        |
| **Persistence Layer**   | MongoDB                                | Dynamic document schema ideal for storing heterogeneous element properties (shapes, paths, text formatting).       |
| **Compaction Layer**    | BullMQ + Redis Worker Queue            | Asynchronous, out-of-band snapshot compaction offloads compute work from real-time Socket gateway nodes.           |
| **Client State**        | React + Zustand Store                  | Lightweight, decoupled state management with slice-based subscriptions to prevent unnecessary canvas re-renders.   |

---

## 3. Deep Dive: CRDT vs Operational Transformation (OT) vs Authoritative Monotonic Server

Selecting the synchronization model is the core architectural decision for any collaborative system.

```text
+-----------------------------------------------------------------------------------+
|                            COLLABORATION MODEL SPECTRUM                           |
+-----------------------------------------------------------------------------------+
|  Authoritative Monotonic Server  |   Operational Transformation   |       CRDTs       |
|  (Chosen V1 Model)              |   (e.g., Google Docs)          | (e.g., Yjs/Automerge)|
+---------------------------------+--------------------------------+--------------------+
| • Single seq authority          | • Complex transform matrices   | • Decentralized    |
| • Deterministic LWW             | • High server CPU overhead     | • Tombstone memory |
| • Zero client divergence        | • Intricate edge-case matrix   | • High state vector|
| • Simple & highly debuggable    | • Prone to split-brain bugs    | • Heavy payload    |
+-----------------------------------------------------------------------------------+
```

### 3.1 CRDT (Conflict-free Replicated Data Types)

- **Mechanism**: Data structures (like LWW-Element-Set or RGA) that automatically resolve conflicts across decentralized nodes using vector clocks or unique client IDs without central ordering.
- **Why NOT Chosen for V1 Canvas Elements**:
  - **Memory & Bandwidth Overhead**: CRDTs require retaining deleted item tombstones and metadata for causality tracking. For canvas applications with high-frequency mouse movements or stroke additions, payload sizes grow exponentially.
  - **Overkill for Spatial Canvas Objects**: Graphical canvas shapes are discrete 2D spatial objects (x, y, width, height, color). Attribute-level Last-Write-Wins (LWW) with server sequence numbers achieves identical visual consistency with a fraction of CRDT state overhead.
  - **Complexity**: Integrating CRDTs before basic socket reliability, auth, and persistence exist creates unnecessary architectural risk.

### 3.2 OT (Operational Transformation)

- **Mechanism**: Incoming operations are transformed against concurrent uncommitted operations ($T(a, b)$) on a central server before application.
- **Why NOT Chosen for V1**:
  - Requires maintaining $N^2$ transformation functions for every pair of operation types (`Transform(Move, Resize)`, `Transform(Delete, Style)`, etc.).
  - Highly error-prone for non-textual canvas elements where concurrent transformations can produce unexpected geometry states.

### 3.3 Authoritative Monotonic Server Ordering (Chosen Model)

- **Mechanism**: The Socket Gateway acts as the single source of truth for operation sequence numbers (`seq`). Operations emitted by clients are assigned a strict, monotonic integer `seq` ($1, 2, 3, \dots, N$) upon arrival.
- **Conflict Resolution Strategy**:
  - **Unique Element IDs**: All created elements receive client-generated UUIDs (`elem_<timestamp>_<rand>`), preventing creation collisons.
  - **Attribute-Level Last-Accepted-Wins (LAW)**: Conflicting updates to the same element attribute (e.g., User A moves a box to $(100, 200)$ while User B moves it to $(150, 250)$) are ordered strictly by server sequence number `seq`. The operation assigned the higher `seq` wins.
- **Why Chosen**:
  1. **Zero Client Divergence**: All clients execute operations in exact `seq` order.
  2. **Predictable & Debuggable**: Oplogs can be deterministically replayed step-by-step for testing and auditing.
  3. **Low Latency & High Throughput**: Server validation is $O(1)$ without transformation matrix overhead.

---

## 4. Snapshotting & Oplog Compaction Strategy

### The Problem: Oplog Bloat & Slow Room Join

If a room accumulates 20,000 operation logs over time, a new client joining the room would have to download and execute all 20,000 ops sequentially ($O(N)$ network payload & client CPU execution time).

### The Solution: Hybrid Snapshot + Incremental Oplog Replay

State hydration uses a **Base Snapshot + Tail Oplog Replay** pattern:
$$\text{Current Board State} = \text{Snapshot}(V_{\text{snap}}) + \sum_{k=V_{\text{snap}}+1}^{V_{\text{current}}} \text{Op}_k$$

```text
               Oplog Sequence Stream
[Op 1] [Op 2] ... [Op 50] | [Op 51] [Op 52] ... [Op 55] (Latest)
\_______________________/ | \_________________________/
   Compacted Snapshot     |      Uncompacted Tail
     (Version 50)         |    (Replayed on Join)
```

### Compaction Execution Flow

1. **Trigger Condition**: When uncompacted oplog count for a board exceeds 50 ops (or on background schedule), the Socket gateway enqueues a `compact-board-oplog` job to BullMQ.
2. **Distributed Lock**: The BullMQ worker acquires a Redis lock (`lock:compaction:<boardId>`) to ensure single-worker execution.
3. **Consolidation**: The worker fetches the previous Snapshot (Version $V$) and uncompacted ops ($seq > V$). It applies the ops to consolidate element states into a single new Snapshot (Version $V+K$).
4. **Atomic Update & Pruning**: The worker writes the new Snapshot document and prunes/archives historical oplogs with $seq \le V+K$.

---

## 5. Alternatives Considered & Evaluation

| Alternative             | Evaluated Option                            | Tradeoff & Decision                                                                                                                |
| :---------------------- | :------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------- |
| **Transport**           | Plain WebSockets vs Socket.IO               | Socket.IO chosen for native room namespaces, heartbeat ping/pong, auto-reconnect buffers, and Redis adapter scalability.           |
| **Database**            | PostgreSQL vs MongoDB                       | MongoDB chosen because canvas shapes have dynamic, heterogeneous attributes (paths, stroke arrays, sticky note text).              |
| **Worker Architecture** | In-Process Compaction vs Async BullMQ Queue | BullMQ chosen to prevent snapshot consolidation CPU spikes from blocking Socket gateway event loops.                               |
| **Client Engine**       | HTML5 Canvas vs Fabric.js vs SVG            | HTML5 Canvas + custom lightweight rendering engine chosen for full control over zoom/pan geometry and frame rendering performance. |

---

## 6. Future Scalability & Upgrade Roadmap

1. **Horizontal Socket Scaling**: Add `@socket.io/redis-adapter` to distribute Socket gateway nodes behind an ALB while keeping room broadcasts synchronized via Redis Pub/Sub.
2. **Hybrid Rich-Text CRDT Integration**: Integrate Yjs specifically for collaborative text editing inside canvas sticky notes while keeping element positioning on the Authoritative Monotonic Server model.
3. **Multi-Region Persistence**: Deploy regional read-replicas for MongoDB with geo-routed WebSocket connections to minimize round-trip latencies for global users.
