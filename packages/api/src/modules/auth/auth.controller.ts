import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { User } from "../user/user.model";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";

/**
 * Controller for user signup.
 * Creates a new user, hashes the password, and returns a JWT auth token.
 */
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
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
    throw ApiError.badRequest("Invalid credentials");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw ApiError.badRequest("Invalid credentials");
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
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
