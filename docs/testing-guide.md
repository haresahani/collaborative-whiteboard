# Testing Guide

This guide describes the current test situation and the minimum quality bar for future work.

## Current Reality

The repo does not have deep automated coverage yet.

Current state:

- API has a smoke test
- client interaction tests are largely missing
- realtime tests do not exist yet because realtime is not implemented yet

That is acceptable at this stage only because the gap is explicit and part of the V1 plan.

## Root Quality Bar

The root workflow should stay green:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

These commands are the minimum repo health checks.

## Package-Level Expectations

### Client

The client needs tests around:

- draw interaction
- selection and move/resize
- text editing
- erase behavior
- undo and redo

### API

The API needs tests around:

- signup
- login
- `GET /api/auth/me`
- create board
- list boards
- fetch board
- delete board
- append operation

### Realtime

Once socket work begins, add at least one multi-client scenario:

- two clients join the same board
- one client submits an operation
- both clients converge on the same board state

## Minimum V1 Test Bar

Before calling V1 complete, the repo should have these tests:

1. auth flow
2. board CRUD flow
3. editor interaction flow
4. one realtime sync flow

This is intentionally a small but meaningful bar.

## Testing Strategy

Use tests where they provide the highest leverage:

- unit tests for editor utilities and merge helpers
- integration tests for API routes
- one or two focused end-to-end or multi-client tests for realtime behavior

Do not chase coverage numbers before the critical flows are covered.

## Review Standard

For every meaningful feature change:

- run the root quality commands
- add or update tests for affected behavior when practical
- avoid merging behavior changes with zero verification unless the change is purely docs or cleanup
