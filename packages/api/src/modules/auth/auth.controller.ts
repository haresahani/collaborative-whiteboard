import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Request, Response } from "express";
import { User } from "../user/user.model";
import { PendingUser } from "../user/pendingUser.model";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { auditService } from "../audit/audit.service";
import { emailService } from "../email/email.service";

/**
 * Generates a 6-digit numeric verification code.
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Controller for Google OAuth login / signup.
 * Verifies Google ID Token, extracts verified Google account data, and logs in or registers user directly into User DB.
 */
export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { credential } = req.body;

  let googleUser: {
    email: string;
    name: string;
    picture?: string;
    sub: string;
  };

  try {
    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`,
    );

    if (googleRes.ok) {
      const payload = await googleRes.json();
      googleUser = {
        email: payload.email,
        name: payload.name || payload.given_name || "Google User",
        picture: payload.picture,
        sub: payload.sub,
      };
    } else if (
      process.env.NODE_ENV !== "production" &&
      typeof credential === "string" &&
      credential.startsWith("mock_google_")
    ) {
      const mockId = credential.replace("mock_google_", "");
      googleUser = {
        email: `google_user_${mockId}@gmail.com`,
        name: `Google Verified User ${mockId}`,
        picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${mockId}`,
        sub: `google_sub_${mockId}`,
      };
    } else {
      throw ApiError.badRequest(
        "Invalid or expired Google authentication token",
      );
    }
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    throw ApiError.badRequest(
      "Failed to verify Google token with Google accounts service.",
    );
  }

  // Find or create user in User Mongo collection
  let user = await User.findOne({
    $or: [{ email: googleUser.email }, { googleId: googleUser.sub }],
  });

  if (!user) {
    const randomPassword = await bcrypt.hash(crypto.randomUUID(), 10);
    user = await User.create({
      email: googleUser.email,
      displayName: googleUser.name,
      password: randomPassword,
      avatar: googleUser.picture,
      googleId: googleUser.sub,
      isEmailVerified: true,
    });
    // Remove any leftover pending signup for this email
    await PendingUser.deleteOne({ email: googleUser.email });
  } else {
    user.isEmailVerified = true;
    if (!user.googleId) user.googleId = googleUser.sub;
    if (googleUser.picture && !user.avatar) user.avatar = googleUser.picture;
    await user.save();
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  void auditService.logEvent({
    userId: String(user._id),
    action: "USER_LOGIN",
    status: "SUCCESS",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    details: { email: user.email, provider: "GOOGLE" },
  });

  ApiResponse.success(res, {
    message: "Authenticated with Google successfully",
    token,
    user: {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      isEmailVerified: true,
    },
  });
});

/**
 * Controller for user signup request.
 * Does NOT insert into the primary User collection.
 * Stores pending signup data temporarily in PendingUser and emails the OTP code.
 */
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;

  // 1. Ensure user is not already registered and verified in main User database
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    void auditService.logEvent({
      action: "USER_SIGNUP",
      status: "FAILURE",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: { email, reason: "User already registered" },
    });
    throw ApiError.badRequest(
      "An account already exists with this email address",
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const code = generateVerificationCode();

  // 2. Store in PendingUser collection (auto-deleted after 15 mins by Mongo TTL)
  await PendingUser.findOneAndUpdate(
    { email },
    {
      email,
      password: hashedPassword,
      displayName,
      verificationCode: code,
      createdAt: new Date(),
    },
    { upsert: true, new: true },
  );

  // 3. Send OTP email
  await emailService.sendVerificationOtp({
    to: email,
    code,
    displayName,
  });

  void auditService.logEvent({
    action: "USER_SIGNUP",
    status: "SUCCESS",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    details: { email, displayName, stage: "OTP_SENT" },
  });

  ApiResponse.created(res, {
    message: `Verification code sent to ${email}`,
    requiresVerification: true,
    email,
  });
});

/**
 * Controller for email OTP verification.
 * Only after entering the correct OTP is the user created in the permanent User database collection!
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email, code } = req.body;

  // 1. Check if user is already registered in User database
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const token = jwt.sign(
      { userId: existingUser._id },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      },
    );
    return ApiResponse.success(res, {
      message: "Email already verified",
      token,
      user: {
        id: existingUser._id,
        email: existingUser.email,
        displayName: existingUser.displayName,
        avatar: existingUser.avatar,
        isEmailVerified: true,
      },
    });
  }

  // 2. Find pending registration in PendingUser
  const pending = await PendingUser.findOne({ email });
  if (!pending) {
    throw ApiError.badRequest(
      "No pending registration found or verification code has expired. Please sign up again.",
    );
  }

  if (pending.verificationCode !== code) {
    throw ApiError.badRequest(
      "Invalid verification code. Please check your email and try again.",
    );
  }

  // 3. OTP Code is valid! Now create user in permanent User collection
  const user = await User.create({
    email: pending.email,
    password: pending.password,
    displayName: pending.displayName,
    isEmailVerified: true,
  });

  // Delete pending record
  await PendingUser.deleteOne({ email });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  void auditService.logEvent({
    userId: String(user._id),
    action: "EMAIL_VERIFIED",
    status: "SUCCESS",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    details: { email: user.email },
  });

  ApiResponse.success(res, {
    message: "Email verified successfully",
    token,
    user: {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      isEmailVerified: true,
    },
  });
});

/**
 * Controller to resend verification OTP code for pending registrations.
 */
export const resendCode = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.badRequest("This email is already registered and verified.");
  }

  const pending = await PendingUser.findOne({ email });
  if (!pending) {
    throw ApiError.badRequest(
      "No pending signup found. Please register first.",
    );
  }

  const code = generateVerificationCode();
  pending.verificationCode = code;
  pending.createdAt = new Date();
  await pending.save();

  await emailService.sendVerificationOtp({
    to: email,
    code,
    displayName: pending.displayName,
  });

  ApiResponse.success(res, {
    message: `A new verification code has been sent to ${email}`,
  });
});

/**
 * Controller for user login.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Check if user is in PendingUser
    const pending = await PendingUser.findOne({ email });
    if (pending) {
      // Resend code to pending user
      const code = generateVerificationCode();
      pending.verificationCode = code;
      pending.createdAt = new Date();
      await pending.save();

      await emailService.sendVerificationOtp({
        to: email,
        code,
        displayName: pending.displayName,
      });

      return res.status(403).json({
        statusCode: 403,
        success: false,
        message: "Please verify your email address before logging in.",
        data: {
          requiresVerification: true,
          email,
        },
      });
    }

    void auditService.logEvent({
      action: "USER_LOGIN_FAILED",
      status: "FAILURE",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: { email, reason: "User not found" },
    });
    throw ApiError.badRequest("Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    void auditService.logEvent({
      userId: String(user._id),
      action: "USER_LOGIN_FAILED",
      status: "FAILURE",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: { email, reason: "Invalid password" },
    });
    throw ApiError.badRequest("Invalid email or password");
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  void auditService.logEvent({
    userId: String(user._id),
    action: "USER_LOGIN",
    status: "SUCCESS",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    details: { email: user.email },
  });

  ApiResponse.success(res, {
    token,
    user: {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      isEmailVerified: true,
    },
  });
});

/**
 * Protected route to retrieve current logged-in user profile.
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id).select("-password");
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  ApiResponse.success(res, {
    id: String(user._id),
    email: user.email,
    displayName: user.displayName,
    avatar: user.avatar,
    isEmailVerified: user.isEmailVerified,
  });
});
