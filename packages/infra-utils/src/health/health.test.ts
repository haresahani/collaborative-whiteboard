import { describe, it, expect, vi } from "vitest";
import { healthHandler, liveHandler, readyHandler } from "./health";
import { requestIdMiddleware } from "../logging/requestId";
import type { Request, Response, NextFunction } from "express";

describe("health & requestId middleware", () => {
  it("healthHandler returns ok status", () => {
    const handler = healthHandler("test-api");
    const req = {} as Request;
    const statusSpy = vi.fn().mockReturnThis();
    const jsonSpy = vi.fn();
    const res = { status: statusSpy, json: jsonSpy } as unknown as Response;

    handler(req, res);
    expect(statusSpy).toHaveBeenCalledWith(200);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ok", service: "test-api" }),
    );
  });

  it("liveHandler returns alive status", () => {
    const handler = liveHandler("test-api");
    const req = {} as Request;
    const statusSpy = vi.fn().mockReturnThis();
    const jsonSpy = vi.fn();
    const res = { status: statusSpy, json: jsonSpy } as unknown as Response;

    handler(req, res);
    expect(statusSpy).toHaveBeenCalledWith(200);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: "alive", service: "test-api" }),
    );
  });

  it("readyHandler checks readiness callback", async () => {
    const handler = readyHandler({
      serviceName: "test-api",
      checkReady: () => true,
    });
    const req = {} as Request;
    const statusSpy = vi.fn().mockReturnThis();
    const jsonSpy = vi.fn();
    const res = { status: statusSpy, json: jsonSpy } as unknown as Response;

    await handler(req, res);
    expect(statusSpy).toHaveBeenCalledWith(200);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ready" }),
    );
  });

  it("requestIdMiddleware sets X-Request-ID header", () => {
    const req = { headers: {} } as Request;
    const setHeaderSpy = vi.fn();
    const res = { setHeader: setHeaderSpy } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requestIdMiddleware(req, res, next);
    expect(setHeaderSpy).toHaveBeenCalledWith(
      "X-Request-ID",
      expect.any(String),
    );
    expect(next).toHaveBeenCalled();
  });
});
