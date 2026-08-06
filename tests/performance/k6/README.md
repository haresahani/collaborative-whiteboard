# Collaborative Whiteboard — Performance Testing Architecture (k6 + TypeScript)

Production-grade performance testing framework built with **Grafana k6**, **TypeScript**, and modular workload profiles to validate system throughput, API latency, and WebSocket real-time collaboration scalability under load.

## 📁 Architecture & Directory Layout

```text
tests/performance/k6/
├── api/          # REST API performance test functions (Auth, Boards, Operations, Snapshots, Assets)
├── websocket/    # Socket.IO & WebSocket real-time performance functions (Connect, Join, Draw, Cursor, Broadcast, Reconnect)
├── scenarios/    # Entry point scripts executed by k6 (Smoke, Load, Stress, Spike, Soak, Breakpoint)
├── workloads/    # Reusable VU profiles, stage durations, and target arrival rates
├── config/       # Shared environments, SLA thresholds, and k6 options builder
├── metrics/      # Custom Trend, Counter, and Rate business metrics
├── utils/        # Reusable auth, headers, checks, random data, and report summary helpers
├── types/        # TypeScript interfaces for request/response payloads
├── data/         # Mock payload JSONs (users, boards, operations, assets)
├── reports/      # Output directory for HTML, JSON, and summary reports
├── scripts/      # Environment setup, cleanup, and database seed scripts
├── tsconfig.json
├── package.json
└── README.md
```

## 🚀 Execution Commands

Run from root or `tests/performance/k6`:

```bash
# 1. Smoke Test (Validates scripts and baseline connectivity with 5 VUs)
pnpm performance:smoke

# 2. Load Test (Simulates normal expected production load up to 50 VUs)
pnpm performance:load

# 3. Stress Test (Pushes system limits up to 250 VUs to measure degradation)
pnpm performance:stress

# 4. Spike Test (Sudden burst traffic from 10 VUs to 200 VUs in 10s)
pnpm performance:spike

# 5. Soak Test (Extended 10-minute 30 VU execution to detect memory/resource leaks)
pnpm performance:soak

# 6. Breakpoint Test (Steadily ramps VUs up to 500 VUs to determine maximum capacity)
pnpm performance:breakpoint
```

## 📊 Measured Performance SLA Thresholds

| Metric                             | Target SLA (P95) | Max Allowed Error Rate |
| :--------------------------------- | :--------------- | :--------------------- |
| **REST API Latency**               | `< 300 ms`       | `< 1%`                 |
| **WebSocket Connection Handshake** | `< 500 ms`       | `< 1%`                 |
| **Drawing Broadcast Latency**      | `< 100 ms`       | `< 0.5%`               |
| **Real-Time Cursor Latency**       | `< 50 ms`        | `< 0.5%`               |
