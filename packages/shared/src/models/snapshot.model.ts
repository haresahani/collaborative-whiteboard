import mongoose, { Schema, model, Document } from "mongoose";

export interface ISnapshotJson {
  strokes: Record<string, unknown>[];
  shapes: Record<string, unknown>[];
  notes: Record<string, unknown>[]; // Maps to 'text' elements on the client
}

export interface ISnapshot extends Document {
  boardId: string;
  opIndex: number;
  snapshotJson: ISnapshotJson;
  createdAt: Date;
}

const snapshotSchema = new Schema<ISnapshot>(
  {
    boardId: {
      type: String,
      required: true,
      index: true,
    },
    opIndex: {
      type: Number,
      required: true,
      index: true,
    },
    snapshotJson: {
      strokes: {
        type: [Schema.Types.Mixed],
        default: [],
      },
      shapes: {
        type: [Schema.Types.Mixed],
        default: [],
      },
      notes: {
        type: [Schema.Types.Mixed],
        default: [],
      },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  },
);

// Enforce database-level uniqueness to make snapshot creation idempotent
snapshotSchema.index({ boardId: 1, opIndex: 1 }, { unique: true });

export const Snapshot =
  mongoose.models?.snapshot || model<ISnapshot>("Snapshot", snapshotSchema);
