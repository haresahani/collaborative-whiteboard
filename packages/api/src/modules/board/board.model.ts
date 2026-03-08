import { Schema, model, Types, Document } from "mongoose";

export interface IBoard extends Document {
  ownerId: Types.ObjectId;
  title: string;
  visibility: "private" | "public";
  lastSnapshotId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const boardSchema = new Schema<IBoard>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      trim: true,
      default: "Untitled Board",
      maxlength: 100,
    },

    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },

    lastSnapshotId: {
      type: Schema.Types.ObjectId,
      ref: "Snapshot",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

boardSchema.index({ ownerId: 1, createdAt: -1 });

export const Board = model<IBoard>("Board", boardSchema);
