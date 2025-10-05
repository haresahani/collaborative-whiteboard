# Protocol Specification — Collab Whiteboard

This document defines the **real-time event protocol** for the Collab Whiteboard, a multi-user collaborative whiteboard built with Socket.IO for low-latency synchronization. The protocol governs client-server and server-client communication, ensuring reliable operation ordering, conflict resolution, and scalability. It is designed for clarity in technical discussions, production implementation, and interview scenarios.

## 📡 Overview

The protocol uses **Socket.IO** over WebSockets (with HTTP fallback) for real-time bidirectional communication. Events are JSON-encoded, with unique operation identifiers (`opId`) and server-assigned sequence numbers (`serverSeq`) to ensure deterministic ordering and conflict-free state updates. The protocol supports core whiteboard features: drawing strokes, shapes, sticky notes, live cursors, and presence indicators.

- **Transport**: Socket.IO (WebSocket with fallback to long polling).
- **Namespace**: All events occur within a board-specific room (e.g., `/board/:boardId`).
- **Operation Model**: Append-only operations with CRDT-based conflict resolution.
- **Versioning**: Protocol version `1.0.0` (increment for breaking changes).

## 🗂️ Event Categories

Events are categorized into **Client-to-Server** and **Server-to-Client** messages, with clear schemas for each.

### Client-to-Server Events

These events are emitted by clients to initiate actions or updates.

1. **Join Board** (`join`)
   - **Purpose**: Client joins a board to receive snapshot and real-time updates.
   - **Schema**:
     ```json
     {
       "type": "join",
       "boardId": string, // Unique board identifier (e.g., "board_abc")
       "userId": string  // Unique user identifier (e.g., "user_123")
     }
     ```
   - **Behavior**: Server adds client to the board’s Socket.IO room, sends the latest snapshot, and broadcasts a `presence.update`.

2. **Operation** (`op`)
   - **Purpose**: Sends a whiteboard operation (e.g., stroke, shape, note update).
   - **Schema**:
     ```json
     {
       "type": "op",
       "boardId": string,
       "opId": string,    // Unique operation ID: "<userId>:<localCounter>" (e.g., "user_123:162")
       "payload": {
         "type": string,  // Operation type: "stroke.add", "stroke.delete", "note.add", "note.update", "shape.add", "shape.transform"
         "data": object   // Operation-specific data (see below)
       }
     }
     ```
   - **Payload Examples**:
     - **Stroke Add**:
       ```json
       {
         "type": "stroke.add",
         "data": {
           "points": [[number, number]], // Array of [x, y] coordinates
           "color": string,             // Hex color (e.g., "#000000")
           "width": number              // Stroke width (e.g., 2)
         }
       }
       ```
     - **Note Update**:
       ```json
       {
         "type": "note.update",
         "data": {
           "noteId": string, // Unique note ID
           "text": string,   // Updated text content
           "position": { "x": number, "y": number } // Optional position update
         }
       }
       ```
   - **Behavior**: Server validates the op, assigns a `serverSeq`, stores it in the MongoDB oplog, and broadcasts to other clients.

3. **Cursor Update** (`cursor.update`)
   - **Purpose**: Updates the client’s cursor position for real-time presence.
   - **Schema**:
     ```json
     {
       "type": "cursor.update",
       "boardId": string,
       "userId": string,
       "x": number, // Cursor x-coordinate
       "y": number  // Cursor y-coordinate
     }
     ```
   - **Behavior**: Server broadcasts the update to other clients in the board.

### Server-to-Client Events

These events are emitted by the server to update clients or confirm actions.

1. **Operation Broadcast** (`op.broadcast`)
   - **Purpose**: Broadcasts a validated operation to all clients in the board.
   - **Schema**:
     ```json
     {
       "type": "op.broadcast",
       "boardId": string,
       "opId": string,    // Original client opId
       "serverSeq": number, // Server-assigned sequence number
       "payload": {
         "type": string,  // Same as client op payload
         "data": object
       }
     }
     ```
   - **Behavior**: Clients apply the operation to their local state (e.g., render stroke, update note).

2. **Acknowledgment** (`ack`)
   - **Purpose**: Confirms receipt and processing of a client operation.
   - **Schema**:
     ```json
     {
       "type": "ack",
       "opId": string,    // Client-provided opId
       "serverSeq": number // Server-assigned sequence number
     }
     ```
   - **Behavior**: Client updates its local operation queue and undo/redo stack.

3. **Presence Update** (`presence.update`)
   - **Purpose**: Notifies clients of active users and their cursor positions.
   - **Schema**:
     ```json
     {
       "type": "presence.update",
       "boardId": string,
       "users": [
         {
           "userId": string,
           "x": number,
           "y": number,
           "color": string // Optional user-specific color for cursor
         }
       ]
     }
     ```
   - **Behavior**: Clients render updated cursor positions for all active users.

4. **Export Ready** (`export.ready`)
   - **Purpose**: Notifies clients when an async export (e.g., PNG/PDF) is complete.
   - **Schema**:
     ```json
     {
       "type": "export.ready",
       "boardId": string,
       "exportId": string, // Unique export job ID
       "url": string      // Signed S3 URL for download
     }
     ```
   - **Behavior**: Client displays a download link or triggers automatic download.

5. **Snapshot Sync** (`snapshot.sync`)
   - **Purpose**: Delivers the latest board snapshot and recent ops to a joining client.
   - **Schema**:
     ```json
     {
       "type": "snapshot.sync",
       "boardId": string,
       "snapshot": {
         "snapshotId": string,
         "data": object // Full board state: strokes, shapes, notes
       },
       "ops": [
         {
           "opId": string,
           "serverSeq": number,
           "payload": { "type": string, "data": object }
         }
       ]
     }
     ```
   - **Behavior**: Client initializes its canvas with the snapshot and applies recent ops.

## 🔄 Operation Flow

1. **Client Sends Operation**:
   - Client generates a unique `opId` (`<userId>:<localCounter>`).
   - Sends `{ type: "op", boardId, opId, payload }` via Socket.IO.
2. **Server Processes**:
   - Validates the operation (e.g., schema, permissions).
   - Assigns a `serverSeq` for ordering.
   - Stores in MongoDB oplog.
   - Broadcasts to other clients via Redis pub/sub (`op.broadcast`).
   - Sends `ack` to the original client.
3. **Clients Apply**:
   - Clients receive `op.broadcast` and apply the operation to their local state.
   - CRDT ensures conflict-free merging (e.g., immutable strokes, RGA for text).

### Example: Stroke Add

```
Client A: { type: "op", boardId: "board_abc", opId: "user_123:162", payload: { type: "stroke.add", data: { points: [[100, 100], [150, 150]], color: "#000", width: 2 } } }
→ Server: Validates, assigns serverSeq=4568, stores in oplog
→ Server: Broadcasts { type: "op.broadcast", boardId: "board_abc", opId: "user_123:162", serverSeq: 4568, payload: {...} }
→ Server: Sends { type: "ack", opId: "user_123:162", serverSeq: 4568 } to Client A
→ All Clients: Render stroke on canvas
```

## 🛡️ Design Considerations

1. **Uniqueness & Ordering**:
   - `opId` (`<userId>:<localCounter>`) ensures globally unique operations.
   - `serverSeq` provides strict server-side ordering; Lamport timestamps are optional for additional robustness.
2. **Conflict Resolution**:
   - CRDT-based (Yjs/Automerge or custom RGA for text) ensures deterministic state convergence.
   - Immutable operations (e.g., `stroke.add`, `stroke.delete`) simplify reasoning.
3. **Rate Limiting**:
   - Redis-based rate limits on `op` and `cursor.update` events per user to prevent abuse.
4. **Scalability**:
   - Socket.IO rooms (`/board/:boardId`) isolate board-specific traffic.
   - Redis pub/sub enables horizontal scaling of socket servers.
5. **Error Handling**:
   - Invalid events (e.g., malformed schema, unauthorized) return `{ type: "error", code: string, message: string }`.
   - Clients retry failed operations with exponential backoff.
6. **Versioning**:
   - Protocol version included in `join` handshake (`{ protocolVersion: "1.0.0" }`).
   - Backward-compatible changes increment minor version; breaking changes increment major version.

## 📜 Schema Versioning

- **Current Version**: `1.0.0`
- **Upgrade Process**:
  - Clients specify `protocolVersion` in `join`.
  - Server supports multiple versions during transition (e.g., `1.0.x` and `1.1.x`).
  - Deprecated fields are marked in schemas; breaking changes require new event types.

## 🧪 Testing & Validation

- **Schema Validation**: JSON Schema or TypeScript interfaces validate event payloads on client and server.
- **E2E Tests**: Playwright simulates multi-client scenarios to verify operation ordering and state consistency.
- **Load Tests**: k6 simulates high event throughput to measure latency and reliability.
- **Monitoring**: OpenTelemetry traces track event processing latency and errors.

## 📚 Related Docs

- [architecture.md](/docs/architecture.md): System architecture and data flow.
- [crdt-design.md](/docs/crdt-design.md): CRDT implementation for conflict resolution.
- [runbook.md](/docs/runbook.md): Incident response and recovery procedures.
