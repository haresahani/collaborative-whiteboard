import { describe, it, expect } from "vitest";
import {
  metricsRegistry,
  opsCounter,
  activeSocketConnectionsGauge,
  getMetricsText,
} from "./metrics";
import { createLogger } from "../logging/logger";
import { getTracer } from "../tracing/telemetry";

describe("infra-utils monitoring & telemetry", () => {
  it("registers metrics and produces prometheus formatted output", async () => {
    opsCounter.inc({ type: "op.commit", service: "socket" });
    activeSocketConnectionsGauge.set(5);

    const metricsText = await getMetricsText();
    expect(metricsText).toContain("whiteboard_ops_total");
    expect(metricsText).toContain('type="op.commit"');
    expect(metricsText).toContain("whiteboard_socket_connections_active 5");
  });

  it("creates a pino logger instance with expected properties", () => {
    const logger = createLogger({
      serviceName: "test-service",
      level: "silent",
    });
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
  });

  it("returns an OpenTelemetry tracer", () => {
    const tracer = getTracer("test-tracer");
    expect(tracer).toBeDefined();
    expect(typeof tracer.startSpan).toBe("function");
  });
});
