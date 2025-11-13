# 🧪 Testing Guide — Collaborative Whiteboard

This guide explains the testing strategy, frameworks, and practices for the Collaborative Whiteboard project. It covers how to run tests, write tests, and understand the different types of testing used throughout the codebase.

---

## 📋 Overview

### Testing Strategy

The project follows a **test pyramid** approach:

```
        /\
       /  \  E2E Tests (Future)
      /____\
     /      \  Integration Tests
    /________\
   /          \  Unit Tests
  /____________\
```

- **Unit Tests** (70%): Fast, isolated tests for components and utilities
- **Integration Tests** (20%): Tests for API endpoints and component interactions
- **E2E Tests** (10%): Full user flow tests in a real browser (planned)

### Testing Philosophy

- **Fast feedback**: Tests should run quickly during development
- **Reliable**: Tests should be deterministic and not flaky
- **Maintainable**: Tests should be easy to read and update
- **Coverage**: Aim for meaningful coverage, not just high percentages

---

## 🎯 Test Types

### Unit Tests

**What they test**: Individual components, functions, or utilities in isolation.

**Location**: `packages/client/tests/components/`, `packages/client/tests/utils/`

**Example**: Testing a Button component renders correctly

```typescript
// packages/client/tests/components/Button.test.tsx
import { render, screen } from "@testing-library/react";
import React from "react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });
});
```

### Integration Tests

**What they test**: How multiple parts work together (API endpoints, component interactions).

**Location**:

- Client: `packages/client/tests/pages/`
- API: `packages/api/tests/`

**Example**: Testing a page component with context providers

```typescript
// packages/client/tests/pages/Whiteboard.test.tsx
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Whiteboard from '@/pages/Whiteboard';
import { WhiteboardProvider } from '@/contexts/WhiteboardContext';

test('renders Whiteboard', () => {
  render(
    <BrowserRouter>
      <WhiteboardProvider boardId="demo-board">
        <Whiteboard />
      </WhiteboardProvider>
    </BrowserRouter>
  );
});
```

### E2E Tests (Future)

**What they test**: Complete user flows in a real browser environment.

**Location**: `tests/` (root directory)

**Status**: Not yet implemented. Will use Playwright or Cypress when added.

---

## 🛠️ Testing Frameworks

### Jest (Client Package)

**Why Jest?**

- Industry standard for React applications
- Excellent ecosystem and community support
- Great for FAANG/MNC companies (widely used)
- Strong mocking capabilities
- Works well with TypeScript via `ts-jest`

**Configuration**: `packages/client/jest.config.ts`

**Key Features**:

- ESM support via `ts-jest`
- `jsdom` environment for browser APIs
- Module path aliases (`@/` → `src/`)
- CSS module mocking via `identity-obj-proxy`

### Vitest (API Package)

**Why Vitest?**

- Fast, powered by Vite
- Native ESM support
- Compatible with Jest API
- Good for Node.js backend testing

**Configuration**: `packages/api/vitest.config.ts`

**Key Features**:

- Node.js environment
- TypeScript support out of the box
- Fast test execution

---

## 🚀 Running Tests

### Run All Tests

Run tests for all packages in the monorepo:

```bash
pnpm -w test
```

**Expected Output**:

```
Scope: 6 of 7 workspace projects
packages/api test$ vitest run --reporter=dot
│  RUN  v4.0.8 D:/collaborative-whiteboard/packages/api
│ ·
│  Test Files  1 passed (1)
│       Tests  1 passed (1)
│    Duration  1.03s
└─ Done in 2.8s

packages/client test$ jest
│ PASS tests/utils/api.test.ts
│ PASS tests/components/Button.test.tsx
│ PASS tests/pages/Whiteboard.test.tsx
│ Test Suites: 3 passed, 3 total
│ Tests:       3 passed, 3 total
│ Time:        6.157 s
└─ Done in 12.2s
```

### Run Client Tests Only

```bash
pnpm -w --filter client test
```

### Run API Tests Only

```bash
pnpm -w --filter api test
```

### Watch Mode (Auto-rerun on changes)

```bash
pnpm -w --filter client test --watch
```

### Run Specific Test File

```bash
# Client
pnpm -w --filter client test Button.test.tsx

# API
pnpm -w --filter api test health.test.ts
```

### Run Tests with Coverage

```bash
# Client (if coverage is configured)
pnpm -w --filter client test --coverage

# API
pnpm -w --filter api test --coverage
```

---

## 📁 Test Structure

```
collaborative-whiteboard/
├── packages/
│   ├── client/
│   │   ├── src/                    # Source code
│   │   └── tests/                   # Client tests
│   │       ├── components/          # Component unit tests
│   │       │   └── Button.test.tsx
│   │       ├── utils/              # Utility function tests
│   │       │   └── api.test.ts
│   │       ├── pages/               # Page/route integration tests
│   │       │   └── Whiteboard.test.tsx
│   │       ├── mocks/               # Test mocks
│   │       │   └── constants.ts
│   │       └── setupJest.ts         # Jest setup file
│   │
│   └── api/
│       ├── src/                     # Source code
│       └── tests/                    # API tests
│           └── health.test.ts       # API endpoint tests
│
└── tests/                           # E2E tests (future)
    └── README.md
```

---

## ✍️ Writing Tests

### React Component Test

**File**: `packages/client/tests/components/Button.test.tsx`

```typescript
import { render, screen } from "@testing-library/react";
import React from "react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("handles click events", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByText("Click me");
    button.click();

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Utility Function Test

**File**: `packages/client/tests/utils/api.test.ts`

```typescript
describe("api utils", () => {
  it("smoke", () => {
    expect(true).toBe(true);
  });

  // Add more tests for actual API utility functions
  it("should format API URL correctly", () => {
    // Your test logic here
  });
});
```

### API Endpoint Test

**File**: `packages/api/tests/health.test.ts`

```typescript
import { describe, it, expect } from "vitest";

describe("api health", () => {
  it("smokes", () => {
    expect(true).toBe(true);
  });

  // Example: Test health endpoint
  // it("should return 200 on health check", async () => {
  //   const response = await request(app).get("/health");
  //   expect(response.status).toBe(200);
  // });
});
```

### Page/Route Integration Test

**File**: `packages/client/tests/pages/Whiteboard.test.tsx`

```typescript
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Whiteboard from '@/pages/Whiteboard';
import { WhiteboardProvider } from '@/contexts/WhiteboardContext';

test('renders Whiteboard', () => {
  render(
    <BrowserRouter>
      <WhiteboardProvider boardId="demo-board">
        <Whiteboard />
      </WhiteboardProvider>
    </BrowserRouter>
  );

  // Add assertions here
  // expect(screen.getByText('Whiteboard')).toBeInTheDocument();
});
```

---

## ⚙️ Configuration

### Jest Configuration (Client)

**File**: `packages/client/jest.config.ts`

```typescript
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setupJest.ts"],
  moduleNameMapper: {
    "^@/config/constants$": "<rootDir>/tests/mocks/constants.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@shared/(.*)$": "<rootDir>/../shared/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "<rootDir>/tsconfig.json",
      },
    ],
  },
  testMatch: ["<rootDir>/tests/**/*.test.(ts|tsx)"],
};

export default config;
```

**Key Settings**:

- `testEnvironment: "jsdom"`: Simulates browser environment
- `setupFilesAfterEnv`: Runs setup file before each test
- `moduleNameMapper`: Maps path aliases and mocks CSS modules
- `extensionsToTreatAsEsm`: Enables ESM support

### Vitest Configuration (API)

**File**: `packages/api/vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
```

**Key Settings**:

- `environment: "node"`: Node.js environment for backend tests
- `globals: true`: Makes `describe`, `it`, `expect` available globally

### Jest Setup File

**File**: `packages/client/tests/setupJest.ts`

This file sets up:

- `@testing-library/jest-dom` matchers
- `window.matchMedia` polyfill for jsdom
- Canvas `getContext` mock for whiteboard functionality

---

## 🎨 Best Practices

### Naming Conventions

- **Test files**: `*.test.ts` or `*.test.tsx`
- **Test suites**: Use `describe()` blocks to group related tests
- **Test cases**: Use descriptive `it()` or `test()` names

```typescript
describe("Button Component", () => {
  it("should render with provided text", () => {});
  it("should call onClick when clicked", () => {});
  it("should be disabled when disabled prop is true", () => {});
});
```

### Test Organization

1. **Arrange**: Set up test data and mocks
2. **Act**: Execute the code being tested
3. **Assert**: Verify the expected outcome

```typescript
it("should calculate total correctly", () => {
  // Arrange
  const items = [10, 20, 30];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(60);
});
```

### Mocking Strategies

#### Mock Constants

**File**: `packages/client/tests/mocks/constants.ts`

```typescript
export const API_URL = "http://localhost:3001";
export const WS_URL = "ws://localhost:3001";
```

This mock is used instead of the real `constants.ts` which uses `import.meta.env` (not available in Jest).

#### Mock Functions

```typescript
// Mock a function
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock a module
jest.mock("@/api/whiteboard", () => ({
  fetchBoard: jest.fn(),
}));
```

#### Mock React Components

```typescript
jest.mock("@/components/ComplexComponent", () => ({
  ComplexComponent: () => <div>Mocked Component</div>,
}));
```

### Testing Async Code

```typescript
it("should fetch data", async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});

it("should handle errors", async () => {
  await expect(failingFunction()).rejects.toThrow();
});
```

### Testing Hooks

```typescript
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "@/hooks/useCounter";

it("should increment counter", () => {
  const { result } = renderHook(() => useCounter());

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

### Coverage Goals

- **Aim for**: 70-80% code coverage
- **Focus on**: Critical business logic and user-facing features
- **Don't obsess**: 100% coverage doesn't mean bug-free code

---

## 🔧 Troubleshooting

### Common Issues

#### 1. `import.meta` is not defined

**Error**: `SyntaxError: Cannot use 'import.meta' outside a module`

**Solution**: Mock the constants file in Jest config:

```typescript
// jest.config.ts
moduleNameMapper: {
  "^@/config/constants$": "<rootDir>/tests/mocks/constants.ts",
}
```

#### 2. `window.matchMedia is not a function`

**Error**: `TypeError: window.matchMedia is not a function`

**Solution**: Already handled in `setupJest.ts`. If you see this, ensure the setup file is loaded:

```typescript
// jest.config.ts
setupFilesAfterEnv: ["<rootDir>/tests/setupJest.ts"],
```

#### 3. Canvas `getContext()` not implemented

**Error**: `Not implemented: HTMLCanvasElement's getContext() method`

**Solution**: Already handled in `setupJest.ts` with a mock implementation.

#### 4. Module not found errors

**Error**: `Cannot find module '@/components/...'`

**Solution**: Check `moduleNameMapper` in `jest.config.ts` includes:

```typescript
"^@/(.*)$": "<rootDir>/src/$1",
```

#### 5. React Router warnings in tests

**Warning**: `React Router Future Flag Warning`

**Solution**: These are deprecation warnings, not errors. Tests will still pass. To silence them, configure React Router with future flags in your test setup.

### Debug Tips

1. **Run a single test file**:

   ```bash
   pnpm -w --filter client test Button.test.tsx
   ```

2. **Run tests in verbose mode**:

   ```bash
   pnpm -w --filter client test --verbose
   ```

3. **Run tests with no coverage**:

   ```bash
   pnpm -w --filter client test --no-coverage
   ```

4. **Debug in VS Code**: Add breakpoints and use the Jest debugger configuration

---

## 📚 Additional Resources

### Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Internal Documentation

- `docs/architecture.md` - System architecture
- `docs/runbook.md` - Operations and deployment guide

---

## ✅ Quick Reference

### Test Commands

```bash
# All tests
pnpm -w test

# Client only
pnpm -w --filter client test

# API only
pnpm -w --filter api test

# Watch mode
pnpm -w --filter client test --watch

# Specific file
pnpm -w --filter client test Button.test.tsx
```

### Test File Locations

- Client unit tests: `packages/client/tests/components/`
- Client utils tests: `packages/client/tests/utils/`
- Client integration tests: `packages/client/tests/pages/`
- API tests: `packages/api/tests/`
- E2E tests: `tests/` (future)

### Test Frameworks

- **Client**: Jest + React Testing Library
- **API**: Vitest
- **E2E**: TBD (Playwright/Cypress)

---

**Last Updated**: 2024
**Maintained By**: Development Team
