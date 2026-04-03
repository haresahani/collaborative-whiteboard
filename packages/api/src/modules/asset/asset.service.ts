import { Asset, type IAsset, AssetKind } from "./asset.model";
import mongoose from "mongoose";

export interface AssetStorageConfig {
  provider: "s3";
  bucket: string;
  region: string;
  signedUrlTtlSeconds: number;
}

export interface CreateAssetUploadTargetInput {
  boardId: string;
  assetId: string;
  uploadSessionId: string;
  kind: AssetKind;
  mimeType: string;
}

export interface CreateAssetUploadTargetResult {
  storageBucket: string;
  storageKey: string;
  upload: {
    method: "PUT";
    url: string;
    headers: Record<string, string>;
    expiresAt: string;
  };
}

export interface CompleteAssetUploadInput {
  assetId: string;
  storageKey: string;
  uploadSessionId: string;
  etag?: string;
}

export interface ResolveAssetReadUrlInput {
  assetId: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
}

export interface ResolveAssetReadUrlResult {
  previewUrl: string | null;
  downloadUrl: string | null;
  expiresAt: string | null;
}

export interface AssetStorageService {
  createUploadTarget(
    input: CreateAssetUploadTargetInput,
  ): Promise<CreateAssetUploadTargetResult>;
  completeUpload(input: CompleteAssetUploadInput): Promise<void>;
  resolveReadUrl(
    input: ResolveAssetReadUrlInput,
  ): Promise<ResolveAssetReadUrlResult>;
}

export class MissingAssetStorageImplementationError extends Error {
  constructor() {
    super(
      "Asset storage integration is not implemented. Provide an AssetStorageService backed by signed object storage URLs.",
    );
    this.name = "MissingAssetStorageImplementationError";
  }
}

export function getAssetStorageConfig(): AssetStorageConfig | null {
  const bucket = process.env.ASSET_STORAGE_BUCKET?.trim();
  const region = process.env.ASSET_STORAGE_REGION?.trim();

  if (!bucket || !region) {
    return null;
  }

  const ttlSeconds = Number(process.env.ASSET_SIGNED_URL_TTL_SECONDS ?? 900);

  return {
    provider: "s3",
    bucket,
    region,
    signedUrlTtlSeconds:
      Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : 900,
  };
}

export function getAssetStorageService(): AssetStorageService {
  throw new MissingAssetStorageImplementationError();
}

function generateStorageKey(boardId: string, assetId: string) {
  return `boards/${boardId}/assets/${assetId}/original`;
}

interface CreateAssetInput {
  boardId: string;
  createdBy: string;
  uploadSessionId: string;
  kind: "image" | "file";
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256?: string;
  width?: number;
  height?: number;
  pageCount?: number;
}

export async function createAssetRecord(input: CreateAssetInput) {
  const {
    boardId,
    createdBy,
    uploadSessionId,
    kind,
    originalName,
    mimeType,
    sizeBytes,
    checksumSha256,
    width,
    height,
    pageCount,
  } = input;

  // 🔁 1. IDEMPOTENCY CHECK
  const existing = await Asset.findOne({
    boardId,
    uploadSessionId,
  });

  if (existing) {
    return formatAssetResponse(existing);
  }

  // 🆕 2. CREATE NEW ASSET
  const assetId = new mongoose.Types.ObjectId();

  const storageBucket = process.env.ASSET_STORAGE_BUCKET || "local-dev-bucket";

  const storageKey = generateStorageKey(boardId, assetId.toString());

  const asset = await Asset.create({
    _id: assetId,
    boardId,
    createdBy,
    kind,
    status: "pending",
    storageProvider: "s3",
    storageBucket,
    storageKey,
    originalName,
    mimeType,
    sizeBytes,
    checksumSha256,
    width: width ?? null,
    height: height ?? null,
    pageCount: pageCount ?? null,
    uploadSessionId,
  });

  return formatAssetResponse(asset);
}

function formatAssetResponse(asset: IAsset) {
  return {
    asset: {
      id: asset._id.toString(),
      boardId: asset.boardId.toString(),
      kind: asset.kind,
      status: asset.status,
      originalName: asset.originalName,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      width: asset.width ?? null,
      height: asset.height ?? null,
      pageCount: asset.pageCount ?? null,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    },

    // 🚧 FAKE upload target (until S3)
    upload: {
      method: "PUT" as const,
      url: "http://localhost:4000/fake-upload",
      headers: {
        "Content-Type": asset.mimeType,
      },
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    },
  };
}

export async function completeAssetUploadRecord(params: {
  assetId: string;
  boardId: string;
  uploadSessionId: string;
}) {
  const { assetId, boardId, uploadSessionId } = params;

  // Find asset
  const asset = await Asset.findById(assetId);

  if (!asset) {
    throw new Error("ASSET_NOT_FOUND");
  }

  // Check board ownership
  if (asset.boardId.toString() !== boardId) {
    throw new Error("ASSET_BOARD_MISMATCH");
  }

  // Validate upload session
  if (asset.uploadSessionId !== uploadSessionId) {
    throw new Error("INVALID_UPLOAD_SESSION");
  }

  // Prevent double completion
  if (asset.status === "ready") {
    return {
      asset: formatAssetResponse(asset).asset,
    };
  }

  if (asset.status === "failed") {
    throw new Error("ASSET_ALREADY_FAILED");
  }

  // Mark as read
  asset.status = "ready";
  asset.failureCode = null;
  asset.failureMessage = null;

  await asset.save();

  return {
    asset: formatAssetResponse(asset).asset,
  };
}

export async function resolveAssetsRecord(params: {
  boardId: string;
  assetIds: string[];
}) {
  const { boardId, assetIds } = params;

  const assets = await Asset.find({
    _id: { $in: assetIds },
    boardId,
    deletedAt: null,
  });

  const results = assets
    .filter((asset) => asset.status === "ready")
    .map((asset) => {
      const assetId = asset._id.toString();

      return {
        assetId,
        kind: asset.kind,
        status: asset.status,

        // Fake URLs (replace with signed URLs later)
        previewUrl:
          asset.kind === "image"
            ? `http://localhost:4000/fake-preview/${assetId}`
            : null,

        downloadUrl: `http://localhost:4000/fake-download/${assetId}`,

        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),

        originalName: asset.originalName,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        width: asset.width ?? null,
        height: asset.height ?? null,
        pageCount: asset.pageCount ?? null,
      };
    });

  return results;
}
