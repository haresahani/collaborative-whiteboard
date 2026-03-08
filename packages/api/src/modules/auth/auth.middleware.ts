import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { JwtUserPayload } from "../../types/jwt.types";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET!) as JwtUserPayload;

    req.user = {
      id: decode.userId,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};
