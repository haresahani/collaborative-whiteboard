import { Options } from "k6/options";

export function createK6Options(stages: Array<{ duration: string; target: number }>, thresholds: Record<string, string[]>): Options {
  return {
    stages,
    thresholds,
    userAgent: "k6-performance-suite/1.0",
  };
}
