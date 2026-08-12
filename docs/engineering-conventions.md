# Engineering Conventions

These conventions are the baseline for future work in this repo.

## Folder Conventions

### Client

- route-level app wiring stays in `packages/client/src/app`
- feature code stays in `packages/client/src/features/<feature>`
- shared client utilities stay in `packages/client/src/lib`
- only keep files that are active or clearly planned

### API

- domain code stays in `packages/api/src/modules/<domain>`
- config in `packages/api/src/config`
- middleware in `packages/api/src/middleware`
- types in `packages/api/src/types`

## API Response Convention

Going forward, use:

### Success

```json
{
  "success": true,
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "SOME_CODE",
    "message": "Human-readable message"
  }
}
```

Note: some existing auth routes do not fully follow this yet. New code should follow the convention, and older routes can be normalized during API cleanup.

## Error Handling

- validate input at the boundary
- return clear 4xx errors for client mistakes
- reserve 5xx errors for server failures
- do not hide known error states behind generic success responses

## Environment Variables

Rules:

- keep local secrets out of Git
- document required variables in `env/.env.example`
- use uppercase snake case names
- keep variable names consistent across packages
- validate environment configuration at startup using `envSchema` from `shared` (enforced in the `socket` and `worker` packages)
- `JWT_SECRET` must be a secure string of at least 32 characters in development and production (automatically mocked with a fallback key during testing)

Current required local variables:

- `PORT`
- `MONGO_URL`
- `JWT_SECRET`
- `REDIS_URL` (used by socket/worker packages, defaults to `redis://127.0.0.1:6379`)

## Logging

Current code still uses `console.log` in places. For now:

- keep logs short and structured
- prefix service logs with `[api]`, `[socket]`, or `[worker]` when useful
- never log secrets or tokens

If a dedicated logger is added later, adopt it consistently instead of mixing patterns.

## Naming

- React components: `PascalCase`
- hooks: `useSomething`
- utility functions: `camelCase`
- docs: `kebab-case.md`
- route and package names: lowercase

## Shared Code Rule

Only move code into `shared` when two packages actively use it. Do not create "future shared" abstractions.

## Testing Conventions

### Test File Placement

- **Unit tests** for a file live adjacent to the source, inside a `__tests__/` subdirectory or named `*.test.ts` alongside the file.
- **Integration tests** for a package live in `packages/<name>/tests/`.
- **E2E tests** live in `tests/e2e/playwright/specs/`.
- **Chaos/resilience tests** live in `tests/chaos/specs/`.
- **Performance tests** live in `tests/performance/k6/`.

### Test Naming

- Describe what the unit does, not how it is implemented.
- Use `it('should ...')` for behaviour assertions.
- Group related cases with `describe('<ContextName>')`.

### Mocking Rules

- Mock only at the boundary (database, Redis, external HTTP). Do not mock internal functions.
- Prefer `vi.mock` (Vitest) over manual stubs unless the module is complex.
- Always restore mocks after each test (`afterEach(() => vi.restoreAllMocks())`).

### Coverage Targets

| Layer    | Tool       | Target              |
| -------- | ---------- | ------------------- |
| `shared` | Vitest     | 90%+                |
| `api`    | Vitest     | 80%+                |
| `socket` | Vitest     | 75%+                |
| `worker` | Vitest     | 80%+                |
| `client` | Vitest     | 70%+                |
| E2E      | Playwright | critical paths only |

### CI

- All packages run `pnpm test` in CI before merge.
- E2E tests run against a fully composed Docker stack in a separate job.
- Performance tests are run manually or on a schedule, not on every PR.
