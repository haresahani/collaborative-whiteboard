import mongoose, { Schema, Document } from "mongoose";

export interface IPendingUser extends Document {
  email: string;
  password: string;
  displayName: string;
  verificationCode: string;
  createdAt: Date;
}

const pendingUserSchema = new Schema<IPendingUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    verificationCode: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 900, // MongoDB automatically deletes pending unverified signups after 15 minutes (900s)
    },
  },
  { timestamps: false },
);

export const PendingUser = mongoose.model<IPendingUser>(
  "PendingUser",
  pendingUserSchema,
);
