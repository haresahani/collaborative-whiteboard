import { pino } from "pino";
import { pinoHttp } from "pino-http";

export interface LoggerOptions {
  serviceName?: string;
  level?: string;
}

export function createLogger(options?: LoggerOptions) {
  const serviceName =
    options?.serviceName || process.env.SERVICE_NAME || "whiteboard-service";
  const level =
    options?.level ||
    (process.env.NODE_ENV === "test"
      ? "silent"
      : process.env.LOG_LEVEL || "info");

  return pino({
    name: serviceName,
    level,
    base: {
      service: serviceName,
      env: process.env.NODE_ENV || "development",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

export const logger = createLogger();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function httpLoggerMiddleware(options?: LoggerOptions): any {
  const customLogger = options ? createLogger(options) : logger;
  return pinoHttp({ logger: customLogger });
}
