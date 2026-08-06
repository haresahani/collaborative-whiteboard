import type { Request, Response } from "express";

export interface HealthCheckOptions {
  serviceName: string;
  checkReady?: () => Promise<boolean> | boolean;
}

export function healthHandler(serviceName: string) {
  return (_req: Request, res: Response): void => {
    res.status(200).json({
      status: "ok",
      service: serviceName,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  };
}

export function liveHandler(serviceName: string) {
  return (_req: Request, res: Response): void => {
    res.status(200).json({
      status: "alive",
      service: serviceName,
      timestamp: new Date().toISOString(),
    });
  };
}

export function readyHandler(options: HealthCheckOptions) {
  return async (_req: Request, res: Response): Promise<void> => {
    try {
      const isReady = options.checkReady ? await options.checkReady() : true;
      if (isReady) {
        res.status(200).json({
          status: "ready",
          service: options.serviceName,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(503).json({
          status: "not_ready",
          service: options.serviceName,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      res.status(503).json({
        status: "not_ready",
        service: options.serviceName,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      });
    }
  };
}
