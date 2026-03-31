# Interview Notes

These notes are designed to help present the project honestly and strongly in interviews.

## Honest One-Minute Story

"I built this as a collaborative whiteboard system in a pnpm monorepo. The most complete part today is the client-side editor: drawing, selection, text, resize, erase, zoom/pan, undo/redo, and local PNG export. I also built a partial Express backend with auth, board CRUD, snapshots, and oplog persistence. The next major milestone is wiring the client to persistence and then adding a simple Socket.IO-based collaboration model. I deliberately removed inflated system claims and narrowed the project to a defendable V1."

## Strong Talking Points

- The project already has a real whiteboard editor, not just a landing page or mock canvas.
- I chose to finish one vertical slice instead of claiming CRDTs, Redis fan-out, or workers before they exist.
- The backend already models the right concepts for V1: users, boards, snapshots, and operations.
- The chosen V1 collaboration model is an authoritative server with ordered operations and snapshot replay.
- I treat repo hygiene and documentation as engineering work, not polish work.

## Tradeoffs To Explain Clearly

### Why not CRDT first?

Because CRDTs would increase implementation complexity before the basic collaborative loop exists. A server-ordered operation model is enough for a 2-user V1 and is easier to test and explain.

### Why MongoDB?

The backend already models boards, snapshots, and operations as document-shaped data. MongoDB keeps the persistence model straightforward for early iteration.

### Why a monorepo?

It keeps the client, API, and shared contracts close together and makes refactors easier while the architecture is still settling.

## What Is Finished vs Not Finished

Finished or strong today:

- local whiteboard editor
- route structure for the new client
- API auth and board endpoints
- root pnpm workflow

Not finished yet:

- client-to-API wiring
- realtime sync
- worker-driven exports
- robust automated test coverage

This distinction matters. Interviews go better when the boundary is clear.

## Limitations To State Openly

- the client is still mostly local-first
- realtime packages are stubs
- the docs were previously ahead of the code and had to be corrected
- test coverage is still below the standard expected for a finished V1

## Next Steps Narrative

If asked what comes next, the clean answer is:

1. wire board load/save
2. define operations cleanly
3. implement Socket.IO sync for one board room
4. add focused tests
5. improve polish only after the collaborative loop works
