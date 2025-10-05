# 🛠 Contributor Quickstart — Install, Run & Troubleshooting

This section is designed so that **any contributor (or your future self)** can get the project running quickly, without confusion. It includes environment setup, commands, and common fixes — the kind of polish interviewers and collaborators love.

---

## 🔑 Prerequisites

- **Node.js** `>= 18` (use `nvm` or Volta for version management)
- **pnpm** (preferred) → install globally: `npm i -g pnpm`
  - Alternatives: `yarn` or `npm` (commands below use `pnpm`)
- **Docker & Docker Compose** → for running MongoDB and Redis locally
- **Git** → for version control
- **VS Code** (recommended) with extensions: ESLint, Prettier, EditorConfig, TypeScript

---

## 📂 Clone & Install

```bash
# 1) Fork this repo on GitHub, then clone your fork
 git clone https://github.com/<your-username>/<repo>.git
 cd <repo>

# 2) Install dependencies at workspace root
 pnpm install

# If using npm:
 # npm install
# If using yarn:
 # yarn install
```

---

## ⚙️ Environment Variables

Each package expects its own `.env` file. Start by copying the provided template:

```bash
cp .env.example packages/api/.env
cp .env.example packages/socket/.env
cp .env.example packages/client/.env    # client vars prefixed with VITE_
cp .env.example packages/worker/.env
```

Example keys:

```env
# packages/api/.env
PORT=4000
MONGO_URL=mongodb://127.0.0.1:27017/whiteboard
JWT_SECRET=dev_secret
NODE_ENV=development

# packages/socket/.env
PORT=5000
REDIS_URL=redis://127.0.0.1:6379
MONGO_URL=mongodb://127.0.0.1:27017/whiteboard

# packages/client/.env
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:5000
```

👉 **Pro tip:** never commit `.env` — only `.env.example`. Your `.gitignore` is already configured to skip `.env`.

---

## 🗄️ Start Infra (Mongo + Redis)

```bash
# Modern Docker CLI
docker compose -f infra/docker-compose.yml up -d

# Older command
docker-compose -f infra/docker-compose.yml up -d

# Verify services
docker compose ps
docker compose logs -f mongo
docker compose logs -f redis
```

---

## 🚀 Start the App (Dev Mode)

Open **3 terminals** (or use the provided `dev-commands.sh` script).

**API**

```bash
cd packages/api
pnpm dev
```

**Socket Server**

```bash
cd packages/socket
pnpm dev
```

**Client**

```bash
cd packages/client
pnpm dev
# Runs at http://localhost:3000 (default)
```

**Worker (optional)**

```bash
cd packages/worker
pnpm dev
```

Shortcut (run all in background):

```bash
pnpm --filter "packages/api..." dev & \
 pnpm --filter "packages/socket..." dev & \
 pnpm --filter "packages/client..." dev
```

---

## 🌱 Database Migrations & Seed Data

```bash
# run migrations
pnpm --filter "packages/api" run migrate

# seed example boards & users
pnpm --filter "packages/api" run seed

# fallback script
node packages/api/scripts/seed.js
```

---

## 🧪 Testing, Linting & Formatting

```bash
# run tests (per package)
cd packages/api && pnpm test

# lint + auto-fix
pnpm -w run lint
pnpm -w run format

# e2e tests with Playwright
pnpm --filter "tests" run playwright:install
pnpm --filter "tests" run test:e2e
```

---

## 🛠 Build / Production (Local Docker)

```bash
# build and run services
docker compose -f infra/docker-compose.yml up --build -d

# stop all
docker compose down
```

---

## ⚠️ Common Issues & Fixes

- **`ECONNREFUSED` (Mongo/Redis):**
  - Check `docker compose ps`
  - Validate `.env` URLs
  - Logs: `docker compose logs mongo`

- **Port already in use:**
  - `lsof -i :3000` → `kill -9 <PID>`
  - Or change port in `.env`

- **TypeScript errors:**
  - Run `pnpm -w -r build` for full output
  - Debug with `tsc --noEmit`

- **Husky hook failed:**
  - Run `pnpm prepare`
  - Fix lint issues

- **Playwright CI failures:**
  - Run `npx playwright install`

- **Corrupt deps:**
  ```bash
  rm -rf node_modules pnpm-lock.yaml
  pnpm install
  pnpm store prune
  ```

---

## 🧹 Reset DB & Reseed (Dev Only)

```bash
docker compose exec mongo mongosh --eval 'db.getSiblingDB("whiteboard").dropDatabase()'

pnpm --filter "packages/api" run seed
```

---

## 🔄 PR / Contribution Workflow

1. **Branch:** `feat/<short-desc>`, `fix/<short-desc>`, `docs/<short-desc>`, or `chore/<short-desc>`
2. **Commit:** small, clear messages → `git commit -m "feat: add sticky notes"`
3. **Push:** `git push origin feat/sticky-notes`
4. **PR:** include what changed, how to test, screenshots/logs if relevant
5. **Review:** squash commits before merging → keep `main` clean

---

## 🆘 Still Stuck?

- Provide: OS, Node version (`node -v`), pnpm version, logs, and exact steps.
- Open a GitHub Issue with label `bug` or `infra`.
- For urgent issues: ping maintainers in discussions.

---

## ⚡ Quick Commands Cheat Sheet

```bash
# install deps
pnpm install

# start infra
docker compose -f infra/docker-compose.yml up -d

# dev servers
cd packages/api && pnpm dev
cd packages/socket && pnpm dev
cd packages/client && pnpm dev

# run all
./dev-commands.sh dev

# test + lint
pnpm -w run test
pnpm -w run lint

# clean install
rm -rf node_modules pnpm-lock.yaml && pnpm install
```

---

> This contributor guide ensures anyone can set up, run, and debug the project without friction — a hallmark of production-quality repos.
