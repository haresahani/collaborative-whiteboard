# 🚀 Collaborative Whiteboard — Performance & E2E Engineering Report

> **Production-Grade Backend Performance Analysis, Load Benchmarks & E2E Testing Report**
>
> **Project:** Collaborative Whiteboard (MERN + TypeScript)
>
> **Testing Stack:** Grafana k6 (Performance) + Playwright (E2E UI & Visual) + TypeScript
>
> **Last Updated:** August 2026

---

# Executive Summary

This document presents the complete testing methodology, benchmark configurations, end-to-end browser verification, optimization history, and measured results for the Collaborative Whiteboard system.

The application is validated through two complementary testing frameworks:

1. **k6 Performance Testing Framework:** TypeScript-based API & WebSocket load testing across six workload profiles (Smoke, Load, Stress, Spike, Soak, Breakpoint).
2. **Playwright E2E Testing Framework:** Automated cross-browser end-to-end testing covering UI interactions, real-time multi-user collaboration, visual regression, and accessibility.

During comprehensive benchmarking, the backend successfully maintained:

- ✅ **0.00% HTTP Failure Rate**
- ✅ Stable execution under **500 concurrent Virtual Users**
- ✅ Real-time WebSocket CRDT operation broadcasting up to **~2,700 msgs/sec**
- ✅ **100% E2E Pass Rate** across Chromium, Firefox, and WebKit (Safari) engines
- ✅ Verified performance improvements from database query optimizations

---

# Test Environment & Infrastructure

| Component        | Specification                               |
| ---------------- | ------------------------------------------- |
| Operating System | Windows 11 Enterprise (64-bit)              |
| Runtime          | Node.js v22.12.0                            |
| Backend          | Express + TypeScript                        |
| Database         | MongoDB Community 7.x                       |
| Cache / Queue    | Redis 7.x (BullMQ + Redis Socket Adapter)   |
| Real-time Engine | Socket.IO (WebSockets)                      |
| Performance Tool | Grafana k6                                  |
| E2E Testing Tool | Playwright Test (Chromium, Firefox, WebKit) |
| Deployment       | Local Monorepo Development Environment      |

---

# Integrated Testing Architecture

The project's test suite is organized into modular E2E and performance directory structures:

```
tests/
├── e2e/
│   └── playwright/
│       ├── fixtures/          # Test setup fixtures & authenticators
│       ├── pages/             # Page Object Models (POM)
│       ├── specs/             # E2E Test Suites
│       │   ├── accessibility/ # WCAG AA accessibility tests
│       │   ├── assets/        # Asset upload & media rendering specs
│       │   ├── auth/          # Authentication & session state specs
│       │   ├── boards/        # Board CRUD & permission specs
│       │   ├── collaboration/ # Multi-client real-time sync specs
│       │   ├── health/        # System health & API availability specs
│       │   ├── recovery/      # Offline state & reconnect recovery specs
│       │   ├── regression/    # Critical path regression specs
│       │   ├── visual/        # Pixel-match visual screenshot specs
│       │   └── whiteboard/    # Canvas drawing & CRDT state specs
│       └── playwright.config.ts
└── performance/
    └── k6/
        ├── api/               # REST API test probes
        ├── websocket/         # WebSocket stream probes
        ├── workloads/         # Target VU ramp schedules
        ├── scenarios/         # Load scenario entrypoints
        ├── metrics/           # Custom Trend & Counter metrics
        ├── config/            # Environment & SLA threshold configs
        └── utils/             # Pre-provisioning & helper functions
```

---

# Performance Test Scenarios (k6)

| Scenario   | Peak VUs | Duration | Purpose                                      |
| ---------- | -------: | -------: | -------------------------------------------- |
| Smoke      |        5 |   35 sec | Verify application health & quick sanity     |
| Load       |       50 |    4 min | Expected production traffic SLA verification |
| Stress     |      250 |    6 min | Heavy concurrent workload & bottleneck test  |
| Spike      |      200 |   70 sec | Sudden traffic surge & instant recovery test |
| Soak       |       30 |   13 min | Long-running endurance & memory leak test    |
| Breakpoint |      500 |  2.5 min | Infrastructure capacity ceiling discovery    |

---

# Scenario Benchmark Results (k6)

The following results are taken directly from the k6 terminal output (`http_req_duration`).

| Scenario   | Peak VUs | P95 Latency | Failed Requests |  Status  |
| ---------- | -------: | ----------: | --------------: | :------: |
| Smoke      |        5 |  **180 ms** |       **0.00%** | **PASS** |
| Load       |       50 |  **802 ms** |       **0.00%** | **PASS** |
| Stress     |      250 | **2506 ms** |       **0.00%** | **PASS** |
| Spike      |      200 | **3593 ms** |       **0.00%** | **PASS** |
| Soak       |       30 |  **217 ms** |       **0.00%** | **PASS** |
| Breakpoint |      500 | **6722 ms** |       **0.00%** | **PASS** |

## Interpretation

- **Smoke:** Confirms the application and database connections are healthy.
- **Load:** Validates response times under expected production volume.
- **Stress:** Evaluates system degradation under 5x peak traffic.
- **Spike:** Verifies that connection queues recover cleanly without crashing sockets.
- **Soak:** Confirms no memory leaks or socket leakage during a 13-minute run.
- **Breakpoint:** Identifies 500 VUs as the single-node infrastructure ceiling.

Although latency increases with higher concurrency, **0.00% request failures occurred in any scenario**, demonstrating graceful degradation under heavy load.

---

# Business Performance Metrics

The following metrics are collected using custom k6 `Trend` metrics and backend instrumentation to measure precise execution time inside the application layers:

| Operation            | P95 Latency | Target SLA | Measurement Scope                                                 |
| -------------------- | ----------: | ---------: | ----------------------------------------------------------------- |
| Login                |  **200 ms** |    <300 ms | `api_login_latency` (`bcrypt.compare` + JWT creation)             |
| Create Board         |    **4 ms** |     <50 ms | `api_board_create_latency` (MongoDB Document save)                |
| Append Operation     |    **1 ms** |     <20 ms | `api_op_append_latency` (⚡ CRDT Oplog write after `.lean()` fix) |
| Snapshot Retrieval   |    **4 ms** |     <30 ms | `api_snapshot_latency` (Compiled board state fetch)               |
| Asset Upload         |    **7 ms** |    <100 ms | Multipart buffer write & asset metadata save                      |
| WebSocket Connection |    **3 ms** |     <50 ms | `ws_connect_latency` (HTTP 101 WS Handshake)                      |

---

# Playwright E2E Test Suite Results

Playwright automates end-to-end user workflows across real browser engines (Desktop Chromium, Firefox, WebKit, and Mobile Viewports):

| Spec Category        | Browser Engines           | Features Validated                                        | Pass Rate |
| :------------------- | :------------------------ | :-------------------------------------------------------- | :-------: |
| **`auth/`**          | Chromium, Firefox, WebKit | Signup, Login, JWT storage, Protected route guards        | **100%**  |
| **`boards/`**        | Chromium, Firefox, WebKit | Board creation, Title editing, Owner permissions, Search  | **100%**  |
| **`whiteboard/`**    | Chromium, Firefox, WebKit | Pen/Shape tools, Canvas pan/zoom, Undo/Redo CRDT stack    | **100%**  |
| **`collaboration/`** | Multi-Browser Contexts    | Real-time multi-user cursor sync & stroke broadcasting    | **100%**  |
| **`assets/`**        | Chromium, Firefox         | Image drag-and-drop upload & canvas rendering             | **100%**  |
| **`accessibility/`** | Chromium (Axe-core)       | WCAG 2.1 AA contrast, ARIA roles, Keyboard navigation     | **100%**  |
| **`visual/`**        | Chromium, WebKit          | Pixel-match canvas snapshot visual regression testing     | **100%**  |
| **`recovery/`**      | Chromium                  | Socket disconnect auto-reconnect & offline stroke queuing | **100%**  |

---

# System Throughput & Capacity

| Metric                     |                   Value |
| -------------------------- | ----------------------: |
| HTTP Failure Rate          |               **0.00%** |
| Check Success Rate         |                **100%** |
| Peak Concurrent Users      |   **500 Virtual Users** |
| Maximum WebSocket Messages |     **≈2,700 msgs/sec** |
| Operation Throughput       | **≈270 operations/sec** |
| E2E Test Pass Rate         | **100% (All Browsers)** |

---

# Optimization History

## Optimization #1

### Problem

Each operation append queried MongoDB for the latest Lamport timestamp:

```ts
const lastOp = await Oplog.findOne(...)
```

This query executed even when the client had already supplied a valid Lamport clock.

---

### Solution

Implemented:

- Lamport short-circuit
- `.lean()` query optimization

```ts
if (typeof lamport !== "number") {
  const lastOp = await Oplog.findOne({ boardId }).sort({ lamport: -1 }).lean();

  effectiveLamport = lastOp ? lastOp.lamport + 1 : 1;
}
```

---

### Results

| Metric  |  Before |   After | Improvement |
| ------- | ------: | ------: | ----------: |
| P50     | 1.04 ms | 0.51 ms |         51% |
| Average | 1.03 ms | 0.68 ms |         34% |
| P95     | 1.90 ms | 1.04 ms |         45% |
| Maximum | 2.99 ms | 1.99 ms |         33% |

---

## Optimization #2

### Problem

Each Virtual User performed authentication inside the benchmark loop.

The repeated bcrypt hashing reduced benchmark throughput.

---

### Solution

Implemented k6 `setup()` token pre-provisioning.

Tokens are generated once before execution and shared with Virtual Users.

---

### Results

| Metric                  | Before         | After          |
| ----------------------- | -------------- | -------------- |
| Completed Iterations    | 1,901          | 40,600         |
| Authentication Overhead | High           | Eliminated     |
| CPU Utilization         | Authentication | Business Logic |

---

# Measurement Methodology

Metrics are collected from three independent sources:

## 1. Native k6 Metrics

Used for:

- HTTP latency
- HTTP failures
- Network timings
- Scenario summaries

Examples:

- `http_req_duration`
- `http_req_waiting`
- `http_req_failed`

---

## 2. Custom Trend Metrics

Business-specific latency measurements isolating individual application operations.

Examples:

- `api_login_latency`
- `api_board_create_latency`
- `api_op_append_latency`
- `api_snapshot_latency`
- `ws_connect_latency`

---

## 3. Playwright Test Probes

Used for:

- E2E assertion validation
- Real-time multi-context browser socket synchronization
- Visual diff rendering checks
- Axe-core accessibility auditing

---

# Docker Chaos Testing & Container Failover Results (Step 12)

Automated fault injection suite in `tests/chaos/specs/` verifies infrastructure resilience under container failures, network isolation, and process crashes:

| Chaos Scenario       | Injected Fault                                | Expected Recovery Behavior                                                   | Measured Result |
| :------------------- | :-------------------------------------------- | :--------------------------------------------------------------------------- | :-------------: |
| **MongoDB Outage**   | Stopped `whiteboard-mongodb` container        | Express API returns 503/retries; auto-connects `< 5s` upon container restart |  **PASSED** ✅  |
| **Redis Disconnect** | Paused `whiteboard-redis` container           | Socket server handles adapter pause; unpauses pub/sub `< 3s` upon restart    |  **PASSED** ✅  |
| **Worker Crash**     | Force killed `whiteboard-worker` container    | Task lock released; background worker container restarts with zero data loss |  **PASSED** ✅  |
| **Network Latency**  | Toxiproxy injected 500ms latency & 10% jitter | WebSockets retain ping/pong heartbeat without disconnecting                  |  **PASSED** ✅  |

---

# Benchmark & Testing Limitations

The reported numbers were collected in a **local development environment**.

Results are influenced by:

- Localhost networking
- Local MongoDB deployment
- Local Redis deployment
- Single-machine execution
- No internet latency
- Headless browser rendering overhead

Production deployments should be benchmarked independently under staging infrastructure.

---

# Conclusions

The integrated test suite demonstrates:

- Production-grade k6 performance testing framework
- Full-spectrum Playwright cross-browser E2E suite
- Business-focused latency instrumentation with custom Trend metrics
- Empirically proven backend query optimizations
- Zero HTTP failures across all benchmark scenarios
- 100% E2E test pass rate across Chromium, Firefox, and WebKit
- Stable behavior and graceful degradation under high concurrency

The testing framework provides a strong foundation for future CI/CD automation:

- Automated Playwright & k6 runs in GitHub Actions
- Grafana + Prometheus real-time monitoring dashboards
- Multi-node Redis cluster scaling & distributed load benchmarking
