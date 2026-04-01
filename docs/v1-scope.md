# V1 Scope

This document freezes the first real product slice for the repo.

## Product Goal

Deliver one honest end-to-end whiteboard experience:

- a user can authenticate
- create or open a board
- draw and edit on that board
- save the board
- reload and restore the board
- collaborate with one other user in realtime

## In Scope

- signup and login
- board creation and board listing
- board open by route
- local whiteboard editing using the current toolset
- persistence through snapshots and operation storage
- 2-user realtime sync using Socket.IO
- baseline tests for the critical path

## Out Of Scope

- CRDT conflict resolution
- Redis-based scale-out
- background workers
- PDF or server-side exports
- advanced board permissions
- comments, reactions, templates, or AI features
- multi-region or production infrastructure claims

## Feature Status Snapshot

| Capability                 | Status      |
| -------------------------- | ----------- |
| local editor interactions  | implemented |
| auth API                   | implemented |
| board CRUD API             | implemented |
| client persistence wiring  | not started |
| socket sync                | not started |
| snapshots loaded in client | not started |
| critical-path test suite   | partial     |

## Definition Of Done

V1 is done when all of the following are true:

1. a user can sign up and log in
2. a board can be created and reopened
3. board state survives reload
4. two users can join the same board and see each other's changes
5. root lint, typecheck, build, and test all pass

## Milestone Order

1. foundation
2. persistence
3. realtime
4. polish
5. advanced features

This order is intentional. Features that depend on persistence and sync should not be built first.
