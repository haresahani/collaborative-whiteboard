import { Schema, model, Types, type Document } from "mongoose";

export const ASSET_KIND_VALUES = ["image", "file"] as const;
export type AssetKind = (typeof ASSET_KIND_VALUES)[number];

export const ASSET_STATUS_VALUES = [
  "pending",
  "uploading",
  "ready",
  "failed",
  "deleted",
] as const;
export type AssetStatus = (typeof ASSET_STATUS_VALUES)[number];

export const STORAGE_PROVIDER_VALUES = ["s3"] as const;
export type StorageProvider = (typeof STORAGE_PROVIDER_VALUES)[number];

/**
 * Asset metadata is stored in MongoDB while the actual bytes live in object
 * storage. Board elements reference assets by `assetId`.
 */
export interface IAsset extends Document {
  boardId: Types.ObjectId;
  createdBy: Types.ObjectId;
  kind: AssetKind;
  status: AssetStatus;
  storageProvider: StorageProvider;
  storageBucket: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256?: string;
  width?: number | null;
  height?: number | null;
  pageCount?: number | null;
  uploadSessionId: string;
  failureCode?: string | null;
  failureMessage?: string | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const assetSchema = new Schema<IAsset>(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    kind: {
      type: String,
      enum: ASSET_KIND_VALUES,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ASSET_STATUS_VALUES,
      default: "pending",
      required: true,
      index: true,
    },

    storageProvider: {
      type: String,
      enum: STORAGE_PROVIDER_VALUES,
      default: "s3",
      required: true,
    },

    storageBucket: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    storageKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1024,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    mimeType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
      lowercase: true,
    },

    sizeBytes: {
      type: Number,
      required: true,
      min: 0,
    },

    checksumSha256: {
      type: String,
      trim: true,
      minlength: 32,
      maxlength: 128,
    },

    width: {
      type: Number,
      min: 1,
      default: null,
    },

    height: {
      type: Number,
      min: 1,
      default: null,
    },

    pageCount: {
      type: Number,
      min: 1,
      default: null,
    },

    uploadSessionId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
    },

    failureCode: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null,
    },

    failureMessage: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

assetSchema.index({ boardId: 1, createdAt: -1 });
assetSchema.index({ boardId: 1, status: 1, createdAt: -1 });
assetSchema.index({ storageKey: 1 }, { unique: true });
assetSchema.index({ boardId: 1, uploadSessionId: 1 }, { unique: true });
assetSchema.index({ boardId: 1, kind: 1, createdAt: -1 });

export const Asset = model<IAsset>("Asset", assetSchema);
