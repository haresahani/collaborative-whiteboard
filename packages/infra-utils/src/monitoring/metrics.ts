import client from "prom-client";

// Global Prometheus Registry
export const metricsRegistry = new client.Registry();

// Default metrics (CPU, Memory, Event Loop delay, Heap, GC, Open File Descriptors)
client.collectDefaultMetrics({
  register: metricsRegistry,
  prefix: "whiteboard_",
});

export const STANDARD_BUCKETS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
];

// --- 1. HTTP Metrics ---
export const httpRequestsCounter = new client.Counter({
  name: "whiteboard_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status", "service"],
  registers: [metricsRegistry],
});

export const httpRequestDurationHistogram = new client.Histogram({
  name: "whiteboard_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status", "service"],
  buckets: STANDARD_BUCKETS,
  registers: [metricsRegistry],
});

export const httpRequestSizeBytesHistogram = new client.Histogram({
  name: "whiteboard_http_request_size_bytes",
  help: "HTTP request payload size in bytes",
  labelNames: ["method", "route"],
  buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  registers: [metricsRegistry],
});

export const httpResponseSizeBytesHistogram = new client.Histogram({
  name: "whiteboard_http_response_size_bytes",
  help: "HTTP response payload size in bytes",
  labelNames: ["method", "route"],
  buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  registers: [metricsRegistry],
});

export const httpInflightRequestsGauge = new client.Gauge({
  name: "whiteboard_http_inflight_requests",
  help: "Number of active in-flight HTTP requests",
  labelNames: ["service"],
  registers: [metricsRegistry],
});

// --- 2. Socket.IO Metrics ---
export const activeSocketConnectionsGauge = new client.Gauge({
  name: "whiteboard_socket_connections_active",
  help: "Number of active Socket.IO connections",
  registers: [metricsRegistry],
});

export const activeRoomsGauge = new client.Gauge({
  name: "whiteboard_active_rooms",
  help: "Number of active Socket.IO rooms",
  registers: [metricsRegistry],
});

export const usersPerRoomGauge = new client.Gauge({
  name: "whiteboard_users_per_room",
  help: "Number of connected users in a room",
  labelNames: ["room"],
  registers: [metricsRegistry],
});

export const socketMessagesCounter = new client.Counter({
  name: "whiteboard_socket_messages_total",
  help: "Total number of Socket.IO messages received/sent",
  labelNames: ["event", "status"],
  registers: [metricsRegistry],
});

export const socketMessagesFailedCounter = new client.Counter({
  name: "whiteboard_socket_messages_failed_total",
  help: "Total number of failed Socket.IO message processing attempts",
  labelNames: ["event", "reason"],
  registers: [metricsRegistry],
});

export const socketBroadcastLatencyHistogram = new client.Histogram({
  name: "whiteboard_socket_broadcast_latency_seconds",
  help: "Socket broadcast latency in seconds",
  labelNames: ["event"],
  buckets: STANDARD_BUCKETS,
  registers: [metricsRegistry],
});

export const socketReconnectCounter = new client.Counter({
  name: "whiteboard_socket_reconnect_total",
  help: "Total socket reconnect events",
  registers: [metricsRegistry],
});

// --- 3. Whiteboard Operation Metrics ---
export const opsCounter = new client.Counter({
  name: "whiteboard_ops_total",
  help: "Total number of operations processed across services",
  labelNames: ["type", "service"],
  registers: [metricsRegistry],
});

export const persistenceLatencyHistogram = new client.Histogram({
  name: "whiteboard_persistence_latency_seconds",
  help: "Latency of database persistence operations in seconds",
  labelNames: ["branch"],
  buckets: STANDARD_BUCKETS,
  registers: [metricsRegistry],
});

export const compactionLatencyHistogram = new client.Histogram({
  name: "whiteboard_compaction_latency_seconds",
  help: "Latency of state compaction operations in seconds",
  labelNames: ["branch"],
  buckets: STANDARD_BUCKETS,
  registers: [metricsRegistry],
});

// --- 4. Worker Metrics ---
export const queueLengthGauge = new client.Gauge({
  name: "whiteboard_queue_length",
  help: "Current length of job queues",
  labelNames: ["queue", "state"],
  registers: [metricsRegistry],
});

export const jobsCompletedCounter = new client.Counter({
  name: "whiteboard_jobs_completed_total",
  help: "Total background jobs completed",
  labelNames: ["queue"],
  registers: [metricsRegistry],
});

export const jobsFailedCounter = new client.Counter({
  name: "whiteboard_jobs_failed_total",
  help: "Total background jobs failed",
  labelNames: ["queue", "reason"],
  registers: [metricsRegistry],
});

export const jobDurationHistogram = new client.Histogram({
  name: "whiteboard_job_duration_seconds",
  help: "Background job execution duration in seconds",
  labelNames: ["queue"],
  buckets: STANDARD_BUCKETS,
  registers: [metricsRegistry],
});

export const retryCounter = new client.Counter({
  name: "whiteboard_retry_total",
  help: "Total job retries attempted",
  labelNames: ["queue"],
  registers: [metricsRegistry],
});

export const deadLetterCounter = new client.Counter({
  name: "whiteboard_dead_letter_total",
  help: "Total jobs moved to dead letter state",
  labelNames: ["queue"],
  registers: [metricsRegistry],
});

// --- 5. MongoDB Metrics ---
export const mongoQueryDurationHistogram = new client.Histogram({
  name: "mongodb_query_duration_seconds",
  help: "MongoDB query execution duration in seconds",
  labelNames: ["collection", "operation"],
  buckets: STANDARD_BUCKETS,
  registers: [metricsRegistry],
});

export const mongoWriteDurationHistogram = new client.Histogram({
  name: "mongodb_write_duration_seconds",
  help: "MongoDB write operation duration in seconds",
  labelNames: ["collection", "operation"],
  buckets: STANDARD_BUCKETS,
  registers: [metricsRegistry],
});

export const mongoConnectionsGauge = new client.Gauge({
  name: "mongodb_connections",
  help: "Number of active MongoDB pool connections",
  registers: [metricsRegistry],
});

export const mongoErrorsCounter = new client.Counter({
  name: "mongodb_errors_total",
  help: "Total MongoDB operation errors",
  labelNames: ["collection", "operation"],
  registers: [metricsRegistry],
});

// --- 6. Auth & Security Metrics ---
export const authLoginSuccessCounter = new client.Counter({
  name: "auth_login_success_total",
  help: "Total successful user login attempts",
  registers: [metricsRegistry],
});

export const authLoginFailureCounter = new client.Counter({
  name: "auth_login_failure_total",
  help: "Total failed user login attempts",
  labelNames: ["reason"],
  registers: [metricsRegistry],
});

export const jwtValidationFailuresCounter = new client.Counter({
  name: "jwt_validation_failures_total",
  help: "Total JWT validation failures",
  labelNames: ["reason"],
  registers: [metricsRegistry],
});

export const rateLimitHitsCounter = new client.Counter({
  name: "rate_limit_hits_total",
  help: "Total rate limit hits triggered",
  labelNames: ["endpoint"],
  registers: [metricsRegistry],
});

export async function getMetricsText(): Promise<string> {
  return await metricsRegistry.metrics();
}
