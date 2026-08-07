/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("shared/models", () => ({
  AuditLog: {
    create: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

import { auditService } from "../src/modules/audit/audit.service";
import { AuditLog } from "shared/models";

describe("Audit Logging Service Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should record audit log events in database", async () => {
    vi.mocked(AuditLog.create).mockResolvedValueOnce({
      _id: "audit-1",
      userId: "user-123",
      action: "BOARD_CREATE",
      resourceId: "board-456",
      status: "SUCCESS",
    } as never);

    await auditService.logEvent({
      userId: "user-123",
      action: "BOARD_CREATE",
      resourceId: "board-456",
      ipAddress: "127.0.0.1",
      userAgent: "VitestTest",
      status: "SUCCESS",
      details: { title: "Test Board" },
    });

    expect(AuditLog.create).toHaveBeenCalledWith({
      userId: "user-123",
      action: "BOARD_CREATE",
      resourceId: "board-456",
      ipAddress: "127.0.0.1",
      userAgent: "VitestTest",
      status: "SUCCESS",
      details: { title: "Test Board" },
    });
  });

  it("should query logs with pagination and filters", async () => {
    const mockLogs = [
      {
        _id: "audit-2",
        userId: "user-123",
        action: "BOARD_DELETE",
        resourceId: "board-789",
      },
    ];

    const mockQuery = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(mockLogs),
    };

    vi.mocked(AuditLog.find).mockReturnValueOnce(mockQuery as never);
    vi.mocked(AuditLog.countDocuments).mockResolvedValueOnce(1);

    const result = await auditService.queryLogs({
      userId: "user-123",
      action: "BOARD_DELETE",
      page: 1,
      limit: 10,
    });

    expect(result.total).toBe(1);
    expect(result.logs[0].action).toBe("BOARD_DELETE");
    expect(result.logs[0].resourceId).toBe("board-789");
  });
});
