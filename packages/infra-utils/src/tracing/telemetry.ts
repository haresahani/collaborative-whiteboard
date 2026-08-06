import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { MongoDBInstrumentation } from "@opentelemetry/instrumentation-mongodb";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { trace, type Tracer } from "@opentelemetry/api";

let sdk: NodeSDK | null = null;

export function initTelemetry(serviceName: string): NodeSDK {
  if (sdk) {
    return sdk;
  }

  const rawEndpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://jaeger:4318";
  const endpoint = rawEndpoint.endsWith("/v1/traces")
    ? rawEndpoint
    : `${rawEndpoint.replace(/\/$/, "")}/v1/traces`;

  const traceExporter = new OTLPTraceExporter({
    url: endpoint,
  });

  sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: serviceName,
    }),
    traceExporter,
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new MongoDBInstrumentation(),
    ],
  });

  try {
    sdk.start();
    console.log(
      `[telemetry] OpenTelemetry initialized for ${serviceName} -> ${endpoint}`,
    );

    const initTracer = trace.getTracer(serviceName);
    const span = initTracer.startSpan(`${serviceName}.startup`);
    span.setAttribute("service.name", serviceName);
    span.setAttribute("event", "service_started");
    span.end();
  } catch (err) {
    console.error(
      `[telemetry] Failed to start OpenTelemetry for ${serviceName}:`,
      err,
    );
  }

  return sdk;
}

export function getTracer(name: string = "whiteboard-tracer"): Tracer {
  return trace.getTracer(name);
}

export async function shutdownTelemetry(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
  }
}
