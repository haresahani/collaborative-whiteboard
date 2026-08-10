import type { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import {
  ASSET_KIND_VALUES,
  type AssetKind,
  type AssetStatus,
} from "./asset.model";
import { assertBoardAccess } from "../board/board.access";
import {
  getAssetStorageConfig,
  createAssetRecord,
  completeAssetUploadRecord,
  resolveAssetsRecord,
} from "./asset.service";

/**
 * Design-first contracts for durable board assets.
 *
 * This module is intentionally scaffolded before storage integration:
 * - byte upload is expected to happen through signed object-storage URLs
 * - board ops insert `image` / `attachment` elements that reference `assetId`
 * - the endpoints below should not be mounted until a storage service is added
 */

const imageMimeTypes = ["image/png", "image/jpeg", "image/webp"] as const;
const fileMimeTypes = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

const createAssetBodySchema = z
  .object({
    uploadSessionId: z.string().min(8).max(128),
    kind: z.enum(ASSET_KIND_VALUES),
    originalName: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(255),
    sizeBytes: z
      .number()
      .int()
      .nonnegative()
      .max(50 * 1024 * 1024),
    checksumSha256: z.string().min(32).max(128).optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    pageCount: z.number().int().positive().optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.kind === "image" &&
      !(imageMimeTypes as readonly string[]).includes(value.mimeType)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mimeType"],
        message: "Unsupported image MIME type.",
      });
    }

    if (
      value.kind === "file" &&
      !(fileMimeTypes as readonly string[]).includes(value.mimeType)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mimeType"],
        message: "Unsupported file MIME type.",
      });
    }

    if (value.kind === "image" && (!value.width || !value.height)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["width"],
        message: "Images require width and height metadata.",
      });
    }
  });

const completeAssetBodySchema = z.object({
  uploadSessionId: z.string().min(8).max(128),
  etag: z.string().min(1).max(255).optional(),
});

const failAssetBodySchema = z.object({
  uploadSessionId: z.string().min(8).max(128),
  failureCode: z.string().min(1).max(120),
  failureMessage: z.string().min(1).max(500),
});

const resolveAssetsBodySchema = z.object({
  assetIds: z.array(z.string().min(1)).min(1).max(100),
});

export interface AssetMetadataContract {
  id: string;
  boardId: string;
  kind: AssetKind;
  status: AssetStatus;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  pageCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SignedUploadContract {
  method: "PUT";
  url: string;
  headers: Record<string, string>;
  expiresAt: string;
}

export interface ResolvedAssetContract {
  assetId: string;
  kind: AssetKind;
  status: AssetStatus;
  previewUrl: string | null;
  downloadUrl: string | null;
  expiresAt: string | null;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  pageCount: number | null;
}

interface BoardElementBaseContract {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Board operation payload shape for:
 * type = "element.insert"
 */
export interface ImageElementContract extends BoardElementBaseContract {
  type: "image";
  assetId: string;
  naturalWidth: number;
  naturalHeight: number;
}

/**
 * Board operation payload shape for:
 * type = "element.insert"
 */
export interface AttachmentElementContract extends BoardElementBaseContract {
  type: "attachment";
  assetId: string;
  displayName: string;
  mimeType: string;
  sizeBytes: number;
}

export const assetApiContract = {
  createAsset: {
    method: "POST",
    path: "/api/boards/:boardId/assets",
    summary:
      "Create an asset record and return a signed upload target for object storage.",
  },
  completeAsset: {
    method: "POST",
    path: "/api/boards/:boardId/assets/:assetId/complete",
    summary:
      "Finalize a previously created asset after the client uploads bytes to storage.",
  },
  failAsset: {
    method: "POST",
    path: "/api/boards/:boardId/assets/:assetId/fail",
    summary:
      "Mark an upload session as failed so the board can recover cleanly.",
  },
  resolveAssets: {
    method: "POST",
    path: "/api/boards/:boardId/assets/resolve",
    summary:
      "Resolve one or more ready assets into short-lived signed read URLs for rendering/export.",
  },
  getAssetMetadata: {
    method: "GET",
    path: "/api/boards/:boardId/assets/:assetId",
    summary:
      "Fetch metadata for an existing asset without exposing storage keys.",
  },
} as const;

function invalidObjectId(id: string) {
  return !mongoose.Types.ObjectId.isValid(id);
}

function unauthorized(res: Response) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized",
  });
}

function boardNotFound(res: Response) {
  return res.status(404).json({
    success: false,
    message: "Board not found",
  });
}

function notImplemented(
  res: Response,
  endpoint: keyof typeof assetApiContract,
  details?: Record<string, unknown>,
) {
  const storageConfig = getAssetStorageConfig();

  return res.status(501).json({
    success: false,
    message:
      "Asset storage integration is not implemented yet. This controller currently serves as a concrete API contract scaffold.",
    endpoint: assetApiContract[endpoint],
    storageConfigReady: storageConfig !== null,
    details,
  });
}

export const createAsset = async (req: Request, res: Response) => {
  const { boardId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return unauthorized(res);
  }

  if (!boardId || invalidObjectId(boardId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid board ID",
    });
  }

  const board = await assertBoardAccess(boardId, userId);

  if (!board) {
    return boardNotFound(res);
  }

  const parsed = createAssetBodySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid asset creation payload",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const result = await createAssetRecord({
      boardId,
      createdBy: userId,
      uploadSessionId: parsed.data.uploadSessionId,
      kind: parsed.data.kind,
      originalName: parsed.data.originalName,
      mimeType: parsed.data.mimeType,
      sizeBytes: parsed.data.sizeBytes,
      checksumSha256: parsed.data.checksumSha256,
      width: parsed.data.width,
      height: parsed.data.height,
      pageCount: parsed.data.pageCount,
    });

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("createAsset error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create asset",
    });
  }
};

export const completeAssetUpload = async (req: Request, res: Response) => {
  const { boardId, assetId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return unauthorized(res);
  }

  if (!boardId || invalidObjectId(boardId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid board ID",
    });
  }

  if (!assetId || invalidObjectId(assetId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid asset ID",
    });
  }

  const board = await assertBoardAccess(boardId, userId);

  if (!board) {
    return boardNotFound(res);
  }

  const parsed = completeAssetBodySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid asset completion payload",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const result = await completeAssetUploadRecord({
      assetId,
      boardId,
      uploadSessionId: parsed.data.uploadSessionId,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error("completeAssetUpload error:", error);

    const errorMessage = error instanceof Error ? error.message : "";

    if (errorMessage === "ASSET_NOT_FOUND") {
      return res
        .status(404)
        .json({ success: false, message: "Asset not found" });
    }

    if (errorMessage === "INVALID_UPLOAD_SESSION") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid upload session" });
    }

    if (errorMessage === "ASSET_BOARD_MISMATCH") {
      return res.status(403).json({
        success: false,
        message: "Asset does not belong to this board",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to complete asset upload",
    });
  }
};

export const failAssetUpload = async (req: Request, res: Response) => {
  const { boardId, assetId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return unauthorized(res);
  }

  if (!boardId || invalidObjectId(boardId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid board ID",
    });
  }

  if (!assetId || invalidObjectId(assetId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid asset ID",
    });
  }

  const board = await assertBoardAccess(boardId, userId);

  if (!board) {
    return boardNotFound(res);
  }

  const parsed = failAssetBodySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid asset failure payload",
      errors: parsed.error.flatten(),
    });
  }

  return notImplemented(res, "failAsset", {
    requestShape: parsed.data,
    expectedResponse: {
      asset: {
        id: assetId,
        boardId,
        status: "failed",
        failureCode: parsed.data.failureCode,
      },
    },
  });
};

export const resolveAssets = async (req: Request, res: Response) => {
  const { boardId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return unauthorized(res);
  }

  if (!boardId || invalidObjectId(boardId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid board ID",
    });
  }

  const board = await assertBoardAccess(boardId, userId);

  if (!board) {
    return boardNotFound(res);
  }

  const parsed = resolveAssetsBodySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid asset resolve payload",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const result = await resolveAssetsRecord({
      boardId,
      assetIds: parsed.data.assetIds,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("resolveAssets error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to resolve assets",
    });
  }
};

export const getAssetMetadata = async (req: Request, res: Response) => {
  const { boardId, assetId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return unauthorized(res);
  }

  if (!boardId || invalidObjectId(boardId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid board ID",
    });
  }

  if (!assetId || invalidObjectId(assetId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid asset ID",
    });
  }

  const board = await assertBoardAccess(boardId, userId);

  if (!board) {
    return boardNotFound(res);
  }

  return notImplemented(res, "getAssetMetadata", {
    expectedResponse: {
      id: assetId,
      boardId,
      kind: "image",
      status: "ready",
      originalName: "diagram.png",
      mimeType: "image/png",
      sizeBytes: 245182,
      width: 1200,
      height: 800,
      pageCount: null,
      createdAt: "ISO-8601",
      updatedAt: "ISO-8601",
    } satisfies AssetMetadataContract,
  });
};
