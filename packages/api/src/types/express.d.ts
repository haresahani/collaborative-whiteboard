import { JwtPlayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPlayload;
    }
  }
}
