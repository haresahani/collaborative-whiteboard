# Protocol Baseline

This document defines two things:

- the REST surface that exists today
- the realtime protocol planned for V1

The realtime protocol below is a target design, not a fully implemented contract yet.

## Current REST Surface

The API package currently exposes:

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Boards

- `POST /api/boards`
- `GET /api/boards`
- `GET /api/boards/:id`
- `DELETE /api/boards/:id`
- `POST /api/boards/:id/operations`

## Current Response Reality

The backend already mixes two response styles:

- some endpoints return `{ success, data }`
- auth endpoints mostly return raw `{ token, user }` or `{ message }`

Going forward, V1 should standardize on one consistent response format. The convention is documented in `engineering-conventions.md`.

## Chosen V1 Realtime Protocol

V1 will use Socket.IO with board-scoped rooms and server-assigned sequence numbers.

### Core Rules

- every client joins a single board room
- every mutation is represented as an operation
- the server assigns a monotonic `seq`
- clients apply remote operations in `seq` order
- if two users update the same element at the same time, the last accepted server operation wins

## Suggested Event Set

### Client -> Server

#### `board:join`

Sent after auth and board page load.

```json
{
  "boardId": "board_123",
  "token": "jwt-token"
}
```

#### `op:submit`

Sent whenever the local editor creates a persisted change.

```json
{
  "boardId": "board_123",
  "clientOpId": "client-7:42",
  "baseSeq": 18,
  "operation": {
    "type": "element.upsert",
    "elementId": "el_123",
    "payload": {}
  }
}
```

#### `presence:update`

Sent for cursor or lightweight presence changes. These are ephemeral and do not go to the oplog.

```json
{
  "boardId": "board_123",
  "cursor": { "x": 480, "y": 220 }
}
```

### Server -> Client

#### `board:sync`

Initial sync sent after joining a board room.

```json
{
  "boardId": "board_123",
  "snapshotSeq": 18,
  "snapshot": {},
  "operations": []
}
```

#### `op:ack`

Acknowledges the sender's operation and returns the authoritative `seq`.

```json
{
  "boardId": "board_123",
  "clientOpId": "client-7:42",
  "seq": 19
}
```

#### `op:broadcast`

Broadcasts the accepted operation to all clients in the room.

```json
{
  "boardId": "board_123",
  "seq": 19,
  "clientOpId": "client-7:42",
  "operation": {
    "type": "element.upsert",
    "elementId": "el_123",
    "payload": {}
  }
}
```

#### `presence:broadcast`

Broadcasts cursor and lightweight presence updates to connected peers.

```json
{
  "boardId": "board_123",
  "userId": "user_123",
  "cursor": { "x": 480, "y": 220 }
}
```

#### `protocol:error`

Returned for auth failures, invalid payloads, or missing boards.

```json
{
  "code": "BOARD_NOT_FOUND",
  "message": "Board does not exist"
}
```

## Operation Shape

V1 should keep the operation model coarse and practical.

Recommended operation types:

- `element.create`
- `element.update`
- `element.delete`
- `elements.reorder`
- `board.rename`

Text editing should stay coarse in V1. A text box can be updated as a whole element payload rather than introducing character-level collaborative text merges.

## Ordering And Conflict Rules

- `clientOpId` must be unique per client session
- `seq` is assigned only by the server
- clients may optimistically render local changes
- server ordering is the source of truth
- conflicting updates to the same element resolve by accepted server order

This is intentionally simpler than CRDTs and is enough for a 2-user V1.

## Persistence Rules

- persisted operations are stored in MongoDB
- snapshots are periodic materializations of board state
- join and reload use latest snapshot plus later operations
- presence events are not persisted

## Out Of Scope For V1

These are explicitly excluded from the protocol for now:

- CRDT merges
- Redis-backed cross-instance pub/sub
- offline replay queues
- export job events
- protocol version negotiation across multiple active clients

## Why This Protocol

This protocol fits the current repo and keeps implementation risk under control:

- it matches the existing board/oplog model in the API
- it is straightforward to test
- it provides a clean story for interviews
- it avoids claiming complexity the codebase does not yet support
