import mongoose, { Schema, type Document } from "mongoose";

export interface IChat extends Document {
  boardId: string;
  userId: string;
  displayName: string;
  message: string;
  createdAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    boardId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

// Compound index for efficient chronological query retrieval per board
chatSchema.index({ boardId: 1, createdAt: 1 });

// Single-field TTL index for 7 days limited retention (604800 seconds)
chatSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

export const Chat =
  mongoose.models?.Chat || mongoose.model<IChat>("Chat", chatSchema);
