# Architecture Overview

This document reflects the codebase as it exists today and the architecture chosen for V1. It is not a production-scale fantasy diagram.

## Current Architecture

Today the repo looks like this:

```text
Browser
  |
  v
packages/client
  - local whiteboard state in Zustand stores
  - canvas rendering and interaction engine
  - route: /board/:id
  - no live API or socket wiring yet

packages/api
  - Express REST server
  - JWT auth endpoints
  - board CRUD endpoints
  - oplog append endpoint
  - MongoDB persistence

packages/socket
  - stub only

packages/worker
  - stub only
```

### What is real today

- the client editor architecture is real and fairly strong
- the API package has real models, middleware, and routes
- MongoDB is the current persistence choice for backend work

### What is not real today

- websocket collaboration
- background export jobs
- Redis fan-out
- CRDT conflict resolution
- infrastructure claims such as Kubernetes, observability, and multi-region behavior

## Active Package Responsibilities

The package boundaries for current and near-term work are:

- `client`: whiteboard UX, canvas interactions, local editor state, API/socket integration
- `api`: auth, board metadata, snapshots, oplog persistence, HTTP validation
- `socket`: board rooms, operation validation, operation broadcast, presence
- `worker`: reserved for future async jobs after V1
- `shared`: types and helpers shared by two or more packages
- `infra-utils`: helper utilities only, not product runtime logic

Detailed ownership is tracked in `package-responsibilities.md`.

## Chosen V1 Architecture

V1 will use a simple, explainable architecture:

```text
React client
  | \
  |  \ REST
  |   \
  |    v
  |   Express API ----> MongoDB
  |
  | WebSocket
  v
Socket.IO board service ----> MongoDB oplog
```

### V1 principles

- one board = one socket room
- server is authoritative for operation ordering
- operations are persisted in MongoDB with a sequence number
- snapshots are used to reload board state efficiently
- client stays optimistic for responsiveness, but server ordering wins

## Why This Architecture

This path matches the repo better than a CRDT-heavy distributed design.

- The client already has a good local editor, so wiring persistence and sync is the next logical step.
- The API already has board, snapshot, and oplog concepts, so Mongo-backed replay is a natural V1.
- A single Socket.IO service with server sequencing is easier to build, test, and explain than Redis plus CRDT plus worker orchestration.
- Interviewers usually respond better to one clean, finished system than to many unimplemented claims.

## V1 Data Flow

The intended V1 flow is:

1. User opens `/board/:id`.
2. Client fetches board metadata and latest snapshot from the API.
3. Client connects to the board socket room.
4. Local editor actions are converted into operations.
5. Socket service validates the operation, assigns the next `seq`, persists it, and broadcasts it.
6. Other clients apply the operation in server sequence order.
7. On reload or reconnect, the client restores from snapshot plus later operations.

## Current Gaps To Close

The architecture work still missing before V1 is done:

- wire the client to auth and board APIs
- define and implement the operation format
- implement socket room join, ack, broadcast, and presence
- add snapshot loading and saving
- standardize API response shapes and error handling
- add tests around auth, board CRUD, editor actions, and one realtime flow

## Non-Goals For V1

The following are intentionally out of scope for the first complete system:

- CRDT-based text merging
- Redis-based horizontal scale
- worker-driven exports
- advanced monitoring stacks
- multi-region or large-cluster deployment stories
