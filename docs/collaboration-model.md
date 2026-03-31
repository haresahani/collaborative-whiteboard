# Collaboration Model Decision

This document freezes the first sync model for the project.

## Decision

V1 will use an authoritative server collaboration model with Socket.IO rooms and append-only operations.

## Model Summary

- each board maps to one socket room
- clients submit operations
- the server validates and orders operations
- the server assigns a monotonic `seq`
- operations are persisted in MongoDB
- clients restore from snapshot plus later operations

## Conflict Strategy

V1 will not use CRDTs.

Conflict handling will be:

- unique IDs for created elements
- server sequence order as the source of truth
- last accepted update wins when two users modify the same element concurrently
- coarse text updates instead of character-level collaborative merges

This is enough for a practical 2-user V1 and keeps the system understandable.

## Why This Choice

- it matches the current repo better than a distributed CRDT design
- it is faster to implement end to end
- it is easier to test
- it makes the interview story stronger because the tradeoff is explicit

## Not Chosen For V1

- CRDTs
- Redis pub/sub
- worker-mediated sync flows
- offline reconciliation
- multi-region collaboration guarantees

## Upgrade Path

If the project later needs more advanced collaboration behavior, the likely path is:

1. stabilize the operation format
2. improve snapshotting and replay
3. separate ephemeral presence from persisted changes
4. revisit CRDTs only if text or highly concurrent element editing truly requires them
