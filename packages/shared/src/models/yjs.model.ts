import mongoose, { Schema, model, Document } from "mongoose";

export interface IYjsUpdate extends Document {
  boardId: string;
  opId: string;
  update: Buffer;
  lamport: number;
  createdAt: Date;
}

const yjsUpdateSchema = new Schema<IYjsUpdate>(
  {
    boardId: {
      type: String,
      required: true,
      index: true,
    },
    opId: {
      type: String,
      required: true,
    },
    update: {
      type: Buffer,
      required: true,
    },
    lamport: {
      type: Number,
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

yjsUpdateSchema.index({ boardId: 1, opId: 1 }, { unique: true });
yjsUpdateSchema.index({ boardId: 1, lamport: 1 });

export const YjsUpdate =
  mongoose.models?.YjsUpdate || model<IYjsUpdate>("YjsUpdate", yjsUpdateSchema);

export interface IYjsSnapshot extends Document {
  boardId: string;
  snapshot: Buffer;
  updatedAt: Date;
}

const yjsSnapshotSchema = new Schema<IYjsSnapshot>(
  {
    boardId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    snapshot: {
      type: Buffer,
      required: true,
    },
    updatedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

export const YjsSnapshot =
  mongoose.models?.YjsSnapshot ||
  model<IYjsSnapshot>("YjsSnapshot", yjsSnapshotSchema);
