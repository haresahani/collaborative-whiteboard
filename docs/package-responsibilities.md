# Package Responsibilities

This document defines what each workspace owns so the repo does not drift into overlapping responsibilities.

## `packages/client`

Owns:

- UI
- canvas rendering
- input handling
- editor state
- API and socket integration from the browser

Does not own:

- persistence rules
- auth validation
- authoritative operation ordering

## `packages/api`

Owns:

- auth endpoints
- board CRUD endpoints
- snapshot and oplog persistence
- request validation
- HTTP error handling

Does not own:

- browser state
- live room fan-out
- background job execution

## `packages/socket`

Owns:

- board room lifecycle
- realtime auth handshake
- operation validation at socket entry
- operation broadcast and presence updates

Does not own:

- long-term board metadata rules
- client rendering logic

## `packages/worker`

Owns:

- future async jobs such as exports or snapshot compaction

Current status:

- stub package, intentionally not part of V1 runtime logic yet

## `packages/shared`

Owns:

- shared types
- validation helpers used by more than one package
- small utilities that truly need cross-package reuse

Does not own:

- feature-specific application logic that belongs in one package only

## `packages/infra-utils`

Owns:

- helper utilities for repo or infra support work

Does not own:

- product runtime behavior

## Boundary Rule

If a file or concept is only used in one package, keep it in that package until there is a real reason to share it.
