# Collaborative Whiteboard — End-to-End (E2E) Testing Architecture

Production-grade E2E testing framework built with **Playwright**, **TypeScript**, and **Page Object Models (POM)**.

## 📁 Architecture & Directory Layout

```text
tests/
└── e2e/
    └── playwright/
        ├── pages/                 # Page Object Models (POMs)
        │   ├── LoginPage.ts
        │   ├── SignupPage.ts
        │   ├── DashboardPage.ts
        │   ├── BoardPage.ts
        │   ├── Toolbar.ts
        │   ├── Sidebar.ts
        │   └── Canvas.ts
        │
        ├── fixtures/              # Reusable Playwright Fixtures
        │   ├── auth.fixture.ts
        │   ├── board.fixture.ts
        │   └── test.ts            # Custom extended Playwright test object
        │
        ├── specs/                 # Categorized E2E Test Suites (141 tests in 46 files)
        │   ├── health/            # Smoke tests & environment checks
        │   ├── auth/              # Signup, login, logout, session persistence
        │   ├── boards/            # Create, list, rename, delete, permissions
        │   ├── whiteboard/        # Pen, Rectangle, Arrow, Text, Selection, Move, Resize, Undo/Redo, Zoom/Pan
        │   ├── collaboration/     # Multi-browser context live drawing, cursors, join/leave, reconnect, simultaneous edits
        │   ├── assets/            # Upload, render, invalid, and large image files
        │   ├── recovery/          # Refresh, snapshot, restore, and offline buffer sync
        │   ├── accessibility/     # Keyboard navigation, ARIA roles, and focus management
        │   ├── visual/            # Visual regression snapshot baselines
        │   └── regression/        # Complete end-to-end production happy-path user workflows
        │
        ├── utils/                 # Constants, random generators, waits, custom assertions
        ├── api/                   # Playwright APIRequestContext REST wrappers
        ├── test-data/             # Mock user JSONs, board data, and file fixtures
        ├── auth/                  # Storage state output (user.json)
        │
        ├── playwright.config.ts   # Multi-browser matrix (Chromium, Firefox, WebKit), webServer, reporters
        ├── global.setup.ts        # Storage state initialization
        ├── global.teardown.ts     # Resource teardown
        ├── README.md              # Documentation
        └── package.json           # Playwright workspace scripts
```

## 🚀 Commands

Run from project root or `tests/e2e/playwright/`:

````bash
# Run all E2E tests in headless mode
pnpm --filter collaborative-whiteboard-e2e test:e2e

# Run tests in Playwright Interactive UI mode
pnpm --filter collaborative-whiteboard-e2e test:e2e:ui

# Run tests in headed browser mode
pnpm --filter collaborative-whiteboard-e2e test:e2e:headed

# Open HTML test report
pnpm --filter collaborative-whiteboard-e2e test:e2e:report

Here is your complete **Command Cheat Sheet** for the Playwright E2E Framework and project testing suite:

---

# 🚀 Playwright E2E Command Cheat Sheet

### 1. Standard E2E Test Run (Recommended)
Runs all 47 E2E test specs in headless mode (~30s execution time):
```bash
pnpm test:e2e
````

---

### 2. Interactive Playwright UI Mode

Opens Playwright's interactive visual UI runner where you can see test steps live, inspect DOM elements, pause, and run individual tests:

```bash
pnpm test:e2e:ui
```

---

### 3. Headed Mode (Visible Browsers)

Runs tests with a visible browser window so you can watch Playwright perform automatic drawing and interactions live on screen:

```bash
pnpm test:e2e:headed
```

---

### 4. Playwright Debugger Mode

Opens Playwright Inspector to step through test code line-by-line:

```bash
pnpm test:e2e:debug
```

---

### 5. View Test HTML Report

Opens the interactive HTML test report in your browser to inspect test results, screenshots, traces, and execution timelines:

```bash
pnpm test:e2e:report
```

---

### 6. Full Multi-Browser Matrix (Chromium + Firefox + WebKit / Safari)

Runs all 47 test specs across all 3 browsers (141 total test runs):

```bash
pnpm --filter collaborative-whiteboard-e2e test:e2e --project=chromium --project=firefox --project=webkit
```

---

### 7. Run a Specific Test Category or File

Run only whiteboard canvas specs:

```bash
pnpm test:e2e tests/e2e/playwright/specs/whiteboard
```

Run a single spec file (e.g. `draw.spec.ts`):

```bash
pnpm test:e2e tests/e2e/playwright/specs/whiteboard/draw.spec.ts
```

---

### 8. Unit & Integration Test Commands (Vitest)

Run all project unit & integration tests (CRDT merging, Op validation, Socket flows):

```bash
pnpm test
```

Run shared package CRDT unit tests:

```bash
pnpm --filter shared test
```

Run socket server real-time integration tests:

```bash
pnpm --filter socket test
```

```

```
