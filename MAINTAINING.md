# 🛠 Repository Maintenance Guide

Welcome to the **Collaborative Whiteboard** maintainer's guide. This document outlines the standards, architectures, and maintenance procedures for keeping the monorepo clean, green, and highly performant.

---

## 📂 Packages Structure

The workspace is organized into a `pnpm` monorepo:

- **`packages/client`**: React & Vite frontend workspace. Contains the canvas whiteboard editor.
- **`packages/api`**: Express + Mongoose (MongoDB) backend service. Exposes REST endpoints for authentication and board metadata/snapshots.
- **`packages/socket`**: Socket.IO server room gateway for real-time operation broadcasts.
- **`packages/worker`**: BullMQ background jobs worker for async snapshots and export tasks.
- **`packages/shared`**: Shared type definitions and functional utilities reused between client/server.
- **`packages/infra-utils`**: Infrastructure-adjacent helpers.

---

## ⚙️ Development Commands

We use standard monorepo orchestration scripts from the root:

```bash
# Install all dependencies and set up cross-package links
pnpm install

# Start all development servers concurrently
pnpm start:dev

# Run typechecking across the entire workspace
pnpm typecheck

# Run ESLint on all packages
pnpm lint

# Format all files using Prettier
pnpm format

# Run all test suites
pnpm test
```

---

## 📦 Managing Dependencies

### Adding a Dependency

Always specify which workspace package you want to add the dependency to:

- To add a package to a specific workspace (e.g. `shared`):
  ```bash
  pnpm --filter shared add <package-name>
  ```
- To add a devDependency to the root (e.g. general tooling, configs):
  ```bash
  pnpm -w add -D <package-name>
  ```

### Referencing Internal Workspace Packages

We leverage `pnpm` workspaces for local imports. For instance, to reference the `shared` module from `api`:

```json
// packages/api/package.json
{
  "dependencies": {
    "shared": "workspace:*"
  }
}
```

---

## 🔍 Quality Gates (Husky + lint-staged)

To prevent code degradation, we run Husky pre-commit hooks.
Before every git commit:

1. **TypeScript Typecheck** (`pnpm typecheck`): Verifies there are no type-safety violations across packages.
2. **Lint-Staged** (`pnpm lint-staged`): Executes ESLint auto-fixes and Prettier formatting _only_ on files modified in the current stage.

If either check fails, the commit is rejected. You can bypass this during prototyping with `git commit --no-verify`, but CI will block merges with errors.

---

## 🚀 CI/CD Pipeline

The GitHub Actions CI defined in `.github/workflows/ci.yml` triggers on all branches. It validates:

- Clean installation of dependencies
- Typecheck compilation
- Code Linting & formatting audits
- Unit/Integration tests
- Build production checks
