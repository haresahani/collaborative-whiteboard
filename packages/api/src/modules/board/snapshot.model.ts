import { Schema, model, Types, Document } from "mongoose";

interface ISnapshotJson {
  strokes: unknown[];
  shapes: unknown[];
  notes: unknown[];
}

export interface ISnapshot extends Document {
  boardId: Types.ObjectId;
  opIndex: number;
  snapshotJson: ISnapshotJson;
  createdAt: Date;
}

const snapshotSchema = new Schema<ISnapshot>(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
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
  },
);

snapshotSchema.index({ boardId: 1, opIndex: -1 });

export const Snapshot = model<ISnapshot>("Snapshot", snapshotSchema);
