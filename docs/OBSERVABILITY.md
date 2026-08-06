# 🚀 Step 13 — Observability & Tracing

> **Goal:** Build a production-grade observability stack for the Collaborative Whiteboard by integrating **Prometheus**, **Grafana**, **Pino**, **OpenTelemetry**, and **Jaeger**. The objective is to monitor system health, diagnose issues quickly, and provide complete request visibility similar to modern cloud-native applications.

---

# 📖 Overview

Observability consists of three core pillars:

```
                    Observability
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
     Metrics             Logging          Tracing
   (Prometheus)          (Pino)      (OpenTelemetry)
        │                  │                  │
        ▼                  ▼                  ▼
    Grafana          Structured Logs       Jaeger
```

Each pillar answers different questions:

| Pillar  | Purpose                           |
| ------- | --------------------------------- |
| Metrics | Is the system healthy?            |
| Logs    | What exactly happened?            |
| Tracing | Where did the request spend time? |

---

# 🎯 Objectives

Implement a centralized observability package shared across all services.

Features include:

- Prometheus metrics
- Grafana dashboards
- Structured JSON logging with Pino
- Distributed tracing using OpenTelemetry
- Jaeger trace visualization
- Health endpoints
- Request correlation via Request IDs
- Service-wide telemetry
- Automated testing

---

# 🏗 Architecture

```
                   ┌────────────────────┐
                   │      Browser       │
                   └─────────┬──────────┘
                             │
                     HTTP / WebSocket
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
       API Service      Socket Service     Worker Service
          │                  │                  │
          ├──────────┬───────┴────────┬─────────┤
          │          │                │
          ▼          ▼                ▼
      Prometheus   Pino         OpenTelemetry
          │          │                │
          ▼          ▼                ▼
      Grafana      Log Store       Jaeger
```

---

# 📦 Implementation Order

1. Shared Environment Configuration
2. Shared Infrastructure Package
3. Docker Build Updates
4. API Integration
5. Socket Integration
6. Worker Integration
7. Observability Infrastructure
8. Documentation
9. Testing & Verification

---

# 1️⃣ Shared Environment Package

## File

```
packages/shared/src/env.ts
```

## Environment Variables

| Variable                    | Default                      |
| --------------------------- | ---------------------------- |
| SERVICE_NAME                | whiteboard-service           |
| OTEL_EXPORTER_OTLP_ENDPOINT | http://jaeger:4318/v1/traces |

Validate all variables using Zod so every service shares a single source of truth.

---

# 2️⃣ Shared Infrastructure Package

```
packages/
└── infra-utils/
    ├── logging/
    ├── monitoring/
    ├── tracing/
    ├── health/
    └── index.ts
```

---

## Dependencies

```
prom-client
pino
pino-http

@opentelemetry/api
@opentelemetry/sdk-node
@opentelemetry/resources
@opentelemetry/semantic-conventions
@opentelemetry/exporter-trace-otlp-http
@opentelemetry/instrumentation-http
@opentelemetry/instrumentation-express
@opentelemetry/instrumentation-mongodb

vitest
```

---

## Metric Registry File

```
packages/infra-utils/src/monitoring/metrics.ts
```

---

# 3️⃣ Metrics

## Default Node Metrics

Always register `collectDefaultMetrics()` to expose:

- CPU Usage
- Memory Usage
- Heap Statistics
- Event Loop Lag
- GC Metrics
- Process Uptime
- Open File Descriptors

---

## Custom Metrics

### HTTP

| Metric                                   | Type      |
| ---------------------------------------- | --------- |
| whiteboard_http_requests_total           | Counter   |
| whiteboard_http_request_duration_seconds | Histogram |
| whiteboard_http_request_size_bytes       | Histogram |
| whiteboard_http_response_size_bytes      | Histogram |
| whiteboard_http_inflight_requests        | Gauge     |

---

### Socket.IO

| Metric                                      | Type      |
| ------------------------------------------- | --------- |
| whiteboard_socket_connections_active        | Gauge     |
| whiteboard_active_rooms                     | Gauge     |
| whiteboard_users_per_room                   | Gauge     |
| whiteboard_socket_messages_total            | Counter   |
| whiteboard_socket_messages_failed_total     | Counter   |
| whiteboard_socket_broadcast_latency_seconds | Histogram |
| whiteboard_socket_reconnect_total           | Counter   |

---

### Whiteboard Operations

| Metric                                 | Type      |
| -------------------------------------- | --------- |
| whiteboard_ops_total                   | Counter   |
| whiteboard_persistence_latency_seconds | Histogram |
| whiteboard_compaction_latency_seconds  | Histogram |

---

### Worker

| Metric                          | Type      |
| ------------------------------- | --------- |
| whiteboard_queue_length         | Gauge     |
| whiteboard_jobs_completed_total | Counter   |
| whiteboard_jobs_failed_total    | Counter   |
| whiteboard_job_duration_seconds | Histogram |
| whiteboard_retry_total          | Counter   |
| whiteboard_dead_letter_total    | Counter   |

---

### MongoDB

| Metric                         | Type      |
| ------------------------------ | --------- |
| mongodb_query_duration_seconds | Histogram |
| mongodb_write_duration_seconds | Histogram |
| mongodb_connections            | Gauge     |
| mongodb_errors_total           | Counter   |

---

### Authentication

| Metric                        | Type    |
| ----------------------------- | ------- |
| auth_login_success_total      | Counter |
| auth_login_failure_total      | Counter |
| jwt_validation_failures_total | Counter |
| rate_limit_hits_total         | Counter |

---

## Histogram Buckets

Use explicit buckets:

```
0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10
```

---

## Metric Labels

Prefer:

```
service, environment, instance, storage_engine, method, route, status
```

---

# 4️⃣ Structured Logging

Use **Pino**.

Every log contains:

```
timestamp, level, service, environment, requestId, traceId, spanId, userId, boardId, socketId
```

Development: Pretty logs  
Production: JSON logs

---

# 5️⃣ Request Correlation

Generate a Request ID for every incoming request.

The same ID propagates through:

```
HTTP Request ──► Logger ──► OpenTelemetry ──► Database ──► Response
```

This allows logs and traces to be correlated across service boundaries.

---

# 6️⃣ Distributed Tracing

Use **OpenTelemetry Node SDK**.

Instrument:

- HTTP
- Express
- MongoDB
- Worker Jobs
- Socket Operations

Each request creates a trace with hierarchical spans.

Example:

```
HTTP Request
│
├── JWT Validation
├── Load Board
├── Mongo Query
├── Persist Snapshot
└── Response
```

---

# 7️⃣ Health Endpoints

Expose on every service:

```
GET /health
GET /ready
GET /live
GET /metrics
```

---

# 8️⃣ API Integration

Integrate:

- OpenTelemetry initialization
- Pino HTTP middleware
- Request IDs
- Metrics middleware
- Health endpoints
- `/metrics`

---

# 9️⃣ Socket Service

Track:

- Active connections
- Active rooms
- Broadcast latency
- Drawing operations
- Disconnect reasons
- Reconnection count

Wrap operation commits inside tracing spans and log using Pino.

---

# 🔟 Worker Service

Expose `/metrics` on port `9090`.

Measure:

- Queue depth
- Job duration
- Persistence latency
- Compaction latency
- Job failures
- Retries

Wrap worker execution inside OpenTelemetry spans.

---

# 1️⃣1️⃣ Docker Infrastructure

```
infra/
└── observability/
    ├── prometheus/
    ├── grafana/
    │   ├── dashboards/
    │   └── provisioning/
    └── jaeger/
```

Docker Compose services:

- API (`1234`)
- Socket (`3001`)
- Worker (`9090`)
- Prometheus (`9091:9090`)
- Grafana (`3000:3000`)
- Jaeger (`16686:16686` UI, `4318:4318` OTLP)

---

# 1️⃣2️⃣ Grafana Dashboards

Dashboards provisioned for:

- HTTP Requests/sec
- HTTP Latency
- Active Socket Connections
- Queue Backlog
- Persistence Latency
- Compaction Latency
- MongoDB Performance
- Authentication Metrics
- Memory & CPU Usage

---

# 1️⃣3️⃣ Jaeger Trace Collector

Expose: `http://localhost:16686`

Verify:

- Request traces
- Span hierarchy
- MongoDB timings
- Worker spans
- Socket spans

---

# 1️⃣4️⃣ Docker Build

Docker build order:

```
infra-utils ──► api ──► socket ──► worker
```

---

# 1️⃣5️⃣ Documentation

Docs updated/created:

- `README.md`
- `PROJECT_STRUCTURE.md`
- `docs/OBSERVABILITY.md`

---

# 1️⃣6️⃣ Testing

Run:

```bash
pnpm --filter infra-utils build
pnpm --filter infra-utils test
pnpm test
```

---

# 1️⃣7️⃣ Verification

Endpoints:

- Prometheus API Metrics: `http://localhost:1234/metrics`
- Prometheus Socket Metrics: `http://localhost:3001/metrics`
- Prometheus Worker Metrics: `http://localhost:9090/metrics`
- Grafana UI: `http://localhost:3000`
- Jaeger Trace UI: `http://localhost:16686`

---

# ✅ Expected Outcome

After completing this step, the Collaborative Whiteboard has:

- Production-grade Prometheus metrics
- Grafana dashboards
- Structured logging with Pino
- Distributed tracing with OpenTelemetry
- Jaeger trace visualization
- Request ID correlation
- Health, readiness, and liveness endpoints
- Comprehensive worker and Socket.IO telemetry
- Automated observability tests
- Centralized infrastructure package
- Documentation aligned with modern cloud-native best practices
