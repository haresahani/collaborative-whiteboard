# Collaboration Model & Sync Strategy

> [!TIP]
> A comprehensive system design deep dive comparing **CRDT vs OT vs Authoritative Monotonic Server** and detailing snapshot compaction algorithms is available in [DESIGN_DOC.md](../DESIGN_DOC.md).

## Collaboration Model Summary

V1 uses an **Authoritative Monotonic Server** model with Socket.IO rooms, incremental operation logs (`seq`), and background snapshot compaction:

```text
Client A (Draw) ---> Socket Gateway (Assign seq: 104) ---> MongoDB Oplog
                         |
                         +---> Broadcast (seq: 104) ---> Client B (Render)
```

### Core Collaboration Rules

1. **Room Scoping**: Each canvas board maps to a dedicated Socket.IO room (`board:boardId`).
2. **Server Sequence Authority**: The Socket server acts as the single source of truth for operation sequence numbers (`seq`).
3. **Attribute-Level Last-Accepted-Wins (LAW)**: Conflicting concurrent updates to the same element attribute are ordered strictly by server sequence assignment.
4. **Optimistic Local UI**: Clients apply drawing actions locally immediately and adjust state upon receiving server sequence acknowledgments.
5. **Snapshot Compaction**: Historical operation logs are periodically consolidated into unified snapshots by an asynchronous BullMQ background worker.

### Deep Dive References

- [System Design Doc & CRDT Analysis](../DESIGN_DOC.md)
- [System Architecture & Sequence Flows](../ARCHITECTURE.md)
- [Realtime Socket Protocol](protocol.md)
