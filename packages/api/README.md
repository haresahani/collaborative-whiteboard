# Collaborative Whiteboard API (`packages/api`)

This is the Express-based REST API backend service for the Collaborative Whiteboard. It is responsible for user authentication, board metadata CRUD operations, and persistent snapshots & operation logs (oplogs) in MongoDB.

## Features

- **Authentication**: JWT-based authentication with bcrypt password hashing.
- **Board Management**: REST endpoints for creating, listing, retrieving, and deleting boards.
- **Persistence**: Integration with MongoDB via Mongoose for storing board documents, operational snapshots, and granular edit oplogs.
- **Request Validation**: Schema validation using Zod.
- **Rate Limiting**: IP-based rate limiting on sensitive auth endpoints.
- **Test Suite**: Comprehensive integration tests using Vitest and Supertest.

## Folder Structure

- `src/config/`: Configuration setup, database connections, and environmental logic.
- `src/middleware/`: Global Express middleware (errors, rate limiters, request validation).
- `src/modules/`: Domain module logical isolation:
  - `auth/`: User auth routes, service, and validation logic.
  - `board/`: Whiteboard resource management.
  - `operations/`: Persistent oplog storage for real-time collaboration.
  - `snapshot/`: Snapshot persistence.
  - `user/`: User schema and logic.
- `src/utils/`: Custom helpers (async handlers, standard API responses).
- `tests/`: Integration and routing tests.

## Running in Development

Ensure MongoDB is running (configured in `env/dev.env` via `MONGO_URL`).

To start the API development watch server:

```bash
pnpm dev
```

To run API-specific tests:

```bash
pnpm test
```
