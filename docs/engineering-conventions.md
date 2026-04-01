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

Current required local API variables:

- `PORT`
- `MONGO_URL`
- `JWT_SECRET`

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
