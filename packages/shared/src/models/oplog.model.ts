import mongoose, { Schema, model, Document } from "mongoose";

export interface IOplog extends Document {
  opId: string;
  boardId: string;
  type: string;
  payload: Record<string, unknown>;
  actorId: string;
  lamport: number;
  createdAt: Date;
}

const oplogSchema = new Schema<IOplog>(
  {
    opId: {
      type: String,
      required: true,
    },
    boardId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    actorId: {
      type: String,
      required: true,
      index: true,
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

oplogSchema.index({ boardId: 1, opId: 1 }, { unique: true });
oplogSchema.index({ boardId: 1, lamport: 1 });

export const Oplog =
  mongoose.models?.Oplog || model<IOplog>("Oplog", oplogSchema);
