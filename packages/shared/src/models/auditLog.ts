import mongoose, { Schema, Document } from "mongoose";

export type AuditAction =
  | "USER_LOGIN"
  | "USER_LOGIN_FAILED"
  | "USER_SIGNUP"
  | "EMAIL_VERIFIED"
  | "BOARD_CREATE"
  | "BOARD_ACCESS"
  | "BOARD_JOIN_TOKEN"
  | "BOARD_DELETE"
  | "ADMIN_ACTION";

export interface IAuditLog extends Document {
  userId?: string;
  action: AuditAction;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  status: "SUCCESS" | "FAILURE";
  details?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: String, index: true },
    action: {
      type: String,
      required: true,
      enum: [
        "USER_LOGIN",
        "USER_LOGIN_FAILED",
        "USER_SIGNUP",
        "EMAIL_VERIFIED",
        "BOARD_CREATE",
        "BOARD_ACCESS",
        "BOARD_JOIN_TOKEN",
        "BOARD_DELETE",
        "ADMIN_ACTION",
      ],
      index: true,
    },
    resourceId: { type: String, index: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    status: {
      type: String,
      required: true,
      enum: ["SUCCESS", "FAILURE"],
      default: "SUCCESS",
    },
    details: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false },
);

export const AuditLog =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
