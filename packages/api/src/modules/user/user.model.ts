import mongoose from "mongoose";

export interface Iuser extends Document {
  email: string;
  password: string;
  displayName: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
  },
  { timestamps: true },
);

export const User = mongoose.model<Iuser>("User", userSchema);
