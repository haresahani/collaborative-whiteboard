import { AuditLog, type AuditAction } from "shared/models";
import { logger } from "infra-utils";

export interface LogEventParams {
  userId?: string;
  action: AuditAction;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  status?: "SUCCESS" | "FAILURE";
  details?: Record<string, unknown>;
}

export const auditService = {
  async logEvent(params: LogEventParams): Promise<void> {
    try {
      await AuditLog.create({
        userId: params.userId,
        action: params.action,
        resourceId: params.resourceId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        status: params.status || "SUCCESS",
        details: params.details,
      });
    } catch (err) {
      logger.error(
        { err, params },
        "[auditService] Failed to record audit log",
      );
    }
  },

  async queryLogs(query: {
    userId?: string;
    action?: string;
    resourceId?: string;
    page?: number;
    limit?: number;
  }) {
    const filter: Record<string, unknown> = {};
    if (query.userId) filter.userId = query.userId;
    if (query.action) filter.action = query.action;
    if (query.resourceId) filter.resourceId = query.resourceId;

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};
