import { Schema, model, Types, Document } from "mongoose";

export interface IOplog extends Document {
  boardId: Types.ObjectId;
  seq: number;
  clientId: string;
  opId: string;
  type: string;
  payload: Record<string, unknown>;
  baseSnapshot: number;
  createdAt: Date;
}

const oplogSchema = new Schema<IOplog>(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },

    seq: {
      type: Number,
      required: true,
      index: true,
    },

    clientId: {
      type: String,
      required: true,
    },

    opId: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      required: true,
    },

    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },

    baseSnapshot: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

oplogSchema.index({ boardId: 1, seq: 1 });
oplogSchema.index({ boardId: 1, opId: 1 });

export const Oplog = model<IOplog>("Oplog", oplogSchema);
