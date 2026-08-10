import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { auditService } from "./audit.service";

export const getAuditLogs = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const userId = req.query.userId as string | undefined;
    const action = req.query.action as string | undefined;
    const resourceId = req.query.resourceId as string | undefined;

    const result = await auditService.queryLogs({
      page,
      limit,
      userId,
      action,
      resourceId,
    });

    ApiResponse.success(res, result);
  },
);
