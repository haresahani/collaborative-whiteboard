import http from "k6/http";
import { ENV } from "../config/environments.js";
import { getAuthHeaders } from "../utils/headers.js";
import { checkHttpStatus } from "../utils/checks.js";

export function testGetBoard(boardId: string, token?: string): boolean {
  const url = `${ENV.API_BASE_URL}/api/boards/${boardId}`;
  const headers = getAuthHeaders(token);
  const res = http.get(url, { headers });

  return checkHttpStatus(res, 200, "get board 200 OK");
}
