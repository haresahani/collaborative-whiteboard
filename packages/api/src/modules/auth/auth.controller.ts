import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { User } from "../user/user.model";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { auditService } from "../audit/audit.service";

/**
 * Controller for user signup.
 * Creates a new user, hashes the password, and returns a JWT auth token.
 */
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    void auditService.logEvent({
      action: "USER_SIGNUP",
      status: "FAILURE",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: { email, reason: "User already exists" },
    });
    throw ApiError.badRequest("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    password: hashedPassword,
    displayName,
  });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  void auditService.logEvent({
    userId: String(user._id),
    action: "USER_SIGNUP",
    status: "SUCCESS",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    details: { email: user.email, displayName: user.displayName },
  });

  ApiResponse.created(res, {
    message: "User created successfully",
    token,
    user: {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
    },
  });
});

/**
 * Controller for user login.
 * Validates credentials and returns a JWT auth token.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    void auditService.logEvent({
      action: "USER_LOGIN_FAILED",
      status: "FAILURE",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: { email, reason: "User not found" },
    });
    throw ApiError.badRequest("Invalid credentials");
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
    throw ApiError.badRequest("Invalid credentials");
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

  ApiResponse.success(res, user);
});
