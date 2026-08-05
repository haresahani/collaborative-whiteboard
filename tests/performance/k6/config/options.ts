import { Options } from "k6/options";
import http from "k6/http";

// Register global expected status codes (200 OK, 201 Created, 204 No Content) for HTTP metrics
try {
  http.setResponseCallback(http.expectedStatuses(200, 201, 204));
} catch (e) {
  // k6 execution fallback
}

export function createK6Options(stages: Array<{ duration: string; target: number }>, thresholds: Record<string, string[]>): Options {
  return {
    stages,
    thresholds,
    userAgent: "k6-performance-suite/1.0",
  };
}
