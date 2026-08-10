import jwt, { type SignOptions } from "jsonwebtoken";

const USER_TOKEN_AUDIENCE = "user-session";
const BOARD_JOIN_AUDIENCE = "board-join";

export interface UserTokenPayload {
  sub: string; // userId
  email: string;
}

export interface BoardJoinTokenPayload {
  userId: string;
  boardId: string;
  displayName: string;
}

export function issueUserToken(
  payload: UserTokenPayload,
  secret: string,
  expiresIn: SignOptions["expiresIn"] = "24h",
): string {
  return jwt.sign(payload, secret, {
    audience: USER_TOKEN_AUDIENCE,
    expiresIn,
  });
}

export function verifyUserToken(
  token: string,
  secret: string,
): UserTokenPayload {
  const decoded = jwt.verify(token, secret, {
    audience: USER_TOKEN_AUDIENCE,
  }) as jwt.JwtPayload & UserTokenPayload;
  return { sub: decoded.sub, email: decoded.email };
}

export function issueBoardJoinToken(
  payload: BoardJoinTokenPayload,
  secret: string,
  expiresIn: SignOptions["expiresIn"] = "2h",
): string {
  return jwt.sign(payload, secret, {
    audience: BOARD_JOIN_AUDIENCE,
    expiresIn,
  });
}

export function verifyBoardJoinToken(
  token: string,
  secret: string,
): BoardJoinTokenPayload {
  const decoded = jwt.verify(token, secret, {
    audience: BOARD_JOIN_AUDIENCE,
  }) as jwt.JwtPayload & BoardJoinTokenPayload;
  return {
    userId: decoded.userId,
    boardId: decoded.boardId,
    displayName: decoded.displayName,
  };
}
