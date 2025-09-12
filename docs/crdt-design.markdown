# CRDT Design — Collab Whiteboard

This document outlines the **Conflict-Free Replicated Data Type (CRDT)** implementation for the Collab Whiteboard, a real-time, multi-user collaborative whiteboard. CRDTs ensure deterministic state convergence across clients without complex coordination, enabling robust handling of concurrent operations like drawing strokes, adding shapes, and editing sticky notes. This design is optimized for low-latency synchronization, scalability, and interview-ready clarity.

## 📜 Overview

The whiteboard supports concurrent operations (e.g., strokes, shapes, sticky note updates) across multiple clients, synchronized via Socket.IO and persisted in a MongoDB oplog with periodic snapshots. CRDTs are used to resolve conflicts deterministically, ensuring all clients converge to the same state despite network delays or concurrent edits. The design prioritizes simplicity, leveraging immutable operations for most primitives and a sequence-based CRDT for text in sticky notes.

- **CRDT Choice**: Operational CRDT for strokes and shapes; Replicated Growable Array (RGA) for sticky note text (or Yjs/Automerge for advanced features).
- **Goals**: Deterministic convergence, minimal message overhead, efficient storage, and ease of implementation.
- **Scope**: Covers strokes, shapes, sticky notes, and their interactions.

## 🖌️ CRDT Design by Component

### 1. Strokes
- **Description**: A stroke is a sequence of points drawn on the canvas (e.g., `[[x1, y1], [x2, y2]]`, color, width).
- **CRDT Approach**: **Operational CRDT with immutable operations**.
  - Each stroke is assigned a unique `opId` (`<userId>:<localCounter>`, e.g., `user_123:162`).
  - Operations: `stroke.add`, `stroke.delete`, `stroke.transform` (e.g., move, resize).
  - Strokes are immutable; edits create new operations (e.g., delete + add for modifications).
- **Conflict Resolution**:
  - Concurrent `stroke.add` operations are commutative (order-independent).
  - Concurrent `stroke.delete` and `stroke.add` are resolved by timestamp or `opId` lexicographical ordering.
  - Example: If User A adds `stroke_1` and User B deletes it concurrently, the server uses `serverSeq` or Lamport timestamps to determine the final state.
- **Schema Example** (from `protocol.md`):
  ```json
  {
    "type": "op",
    "boardId": "board_abc",
    "opId": "user_123:162",
    "payload": {
      "type": "stroke.add",
      "data": {
        "strokeId": "stroke_001",
        "points": [[100, 100], [150, 150]],
        "color": "#000000",
        "width": 2
      }
    }
  }
  ```
- **Storage**: Stored in MongoDB oplog as immutable operations; snapshots materialize the current set of strokes.

### 2. Shapes
- **Description**: Geometric shapes (e.g., rectangles, circles) with properties like position, size, and color.
- **CRDT Approach**: **Operational CRDT with immutable operations**.
  - Similar to strokes, shapes use `shape.add`, `shape.delete`, `shape.transform`.
  - Each shape has a unique `shapeId` tied to its `opId`.
  - Transformations (e.g., move, resize) generate new operations rather than mutating existing shapes.
- **Conflict Resolution**:
  - Concurrent `shape.add` operations are commutative.
  - Concurrent `shape.transform` and `shape.delete` are resolved by prioritizing the latest `serverSeq` or timestamp.
  - Example: If User A moves a rectangle and User B deletes it, the server ensures deterministic ordering (e.g., delete wins if it has a higher `serverSeq`).
- **Schema Example**:
  ```json
  {
    "type": "op",
    "boardId": "board_abc",
    "opId": "user_123:163",
    "payload": {
      "type": "shape.add",
      "data": {
        "shapeId": "shape_001",
        "type": "rectangle",
        "x": 200,
        "y": 300,
        "width": 100,
        "height": 50,
        "color": "#FF0000"
      }
    }
  }
  ```
- **Storage**: Stored in oplog; snapshots include the current set of shapes.

### 3. Sticky Notes (Text)
- **Description**: Text-based sticky notes with position and content, editable by multiple users.
- **CRDT Approach**: **Replicated Growable Array (RGA)** or **Yjs/Automerge** for text.
  - Text is modeled as a sequence of characters with unique identifiers.
  - Operations: `note.add`, `note.delete`, `note.update` (for text or position).
  - RGA assigns each character a unique ID and position, allowing concurrent inserts/deletes to merge deterministically.
  - Yjs/Automerge is an alternative for richer text features (e.g., formatting) but adds complexity.
- **Conflict Resolution**:
  - Concurrent text edits (e.g., User A adds "Hello" at position 0, User B adds "Hi" at position 0) are resolved by ordering character IDs lexicographically or by timestamp.
  - Position updates (e.g., moving a note) are handled like shapes, using `serverSeq` for ordering.
  - Example: If User A types "A" and User B types "B" concurrently at the same position, RGA ensures both characters appear (e.g., "AB" or "BA" based on ID ordering).
- **Schema Example**:
  ```json
  {
    "type": "op",
    "boardId": "board_abc",
    "opId": "user_123:164",
    "payload": {
      "type": "note.update",
      "data": {
        "noteId": "note_001",
        "text": [
          { "charId": "user_123:164:1", "value": "H", "position": 0 },
          { "charId": "user_123:164:2", "value": "i", "position": 1 }
        ],
        "position": { "x": 400, "y": 500 }
      }
    }
  }
  ```
- **Storage**: Text operations stored in oplog; snapshots include materialized note content.

## 🔄 CRDT Mechanics

### Operation Structure
- Each operation includes:
  - `opId`: `<userId>:<localCounter>` for uniqueness.
  - `serverSeq`: Server-assigned sequence number for ordering.
  - `payload`: Operation-specific data (e.g., stroke points, shape properties, text characters).
- Operations are immutable to simplify state transformations and ensure commutativity.

### Conflict Resolution
- **Strokes/Shapes**:
  - Immutable operations (`add`, `delete`, `transform`) are commutative or resolved by `serverSeq`/timestamp.
  - Example: Concurrent `stroke.add` and `stroke.delete` resolve by prioritizing the later operation.
- **Sticky Note Text**:
  - RGA assigns unique IDs to characters, ensuring concurrent inserts/deletes merge correctly.
  - Example: Concurrent inserts at the same position are ordered lexicographically by `charId`.
- **Tombstones**: Deleted elements (e.g., strokes, characters) are marked with tombstones to preserve history and allow undo/redo.

### State Synchronization
- **Joining Clients**:
  - Receive a `snapshot.sync` event with the latest snapshot and recent ops (see `protocol.md`).
  - Replay ops in `serverSeq` order to rebuild the board state.
- **Concurrent Operations**:
  - Server broadcasts ops via Redis pub/sub to all clients in the board’s Socket.IO room.
  - Clients apply ops locally, using CRDT rules to merge concurrent changes.

## ⚖️ Design Rationale & Tradeoffs

### Why CRDT?
- **Deterministic Convergence**: Ensures all clients reach the same state without complex coordination.
- **Simplified Implementation**: Immutable operations reduce edge cases compared to Operational Transformation (OT).
- **Scalability**: Operations are lightweight and suitable for oplog storage and Redis pub/sub.

### CRDT vs. Alternatives
- **Operational Transformation (OT)**:
  - **Pros**: More compact message size.
  - **Cons**: Complex to implement correctly, especially for text; prone to edge cases.
  - **Why Not Chosen**: CRDT’s simplicity and robustness outweigh OT’s compactness for this use case.
- **Last-Writer-Wins (LWW)**:
  - **Pros**: Simple to implement.
  - **Cons**: Risks data loss (e.g., overwritten edits).
  - **Why Not Chosen**: LWW is unsuitable for collaborative apps requiring lossless edits.
- **Yjs/Automerge**:
  - **Pros**: Mature libraries with rich text support.
  - **Cons**: Higher memory overhead and dependency complexity.
  - **Decision**: Custom RGA used for sticky note text to minimize dependencies; Yjs/Automerge considered for future rich text features.

### Tradeoffs
- **Message Overhead**: CRDTs increase message size (e.g., character IDs for text), mitigated by snapshotting and oplog compaction.
- **Storage**: Immutable operations grow the oplog, addressed by periodic snapshots and compaction workers.
- **Complexity**: RGA for text adds implementation complexity but ensures robust text editing.

## 📈 Performance Considerations
- **Oplog Growth**: Periodic snapshots and compaction workers reduce oplog size.
- **Message Size**: Stroke and shape ops are lightweight; text ops use compression (e.g., delta encoding) where possible.
- **Client Performance**: Clients buffer operations locally and apply CRDT merges incrementally to minimize rendering lag.

## 🧪 Testing & Validation
- **Unit Tests**: Jest tests for CRDT merge logic (e.g., concurrent stroke adds, text inserts).
- **E2E Tests**: Playwright simulates multi-client scenarios to verify state convergence.
- **Load Tests**: k6 measures CRDT performance under high-concurrency workloads.
- **Invariants**: Tests ensure commutative and idempotent operations (e.g., applying the same op twice has no effect).

## 📚 Related Docs
- [architecture.md](/docs/architecture.md): System architecture and data flow.
- [protocol.md](/docs/protocol.md): Event schemas and communication protocol.
- [runbook.md](/docs/runbook.md): Incident response and recovery procedures.