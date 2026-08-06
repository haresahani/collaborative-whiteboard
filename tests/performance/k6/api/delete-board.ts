import http from "k6/http";
import { ENV } from "../config/environments.ts";
import { getAuthHeaders } from "../utils/headers.ts";
import { checkHttpStatus } from "../utils/checks.ts";

export function testDeleteBoard(boardId: string, token?: string): boolean {
  const url = `${ENV.API_BASE_URL}/api/boards/${boardId}`;
  const headers = getAuthHeaders(token);
  const res = http.del(url, null, { headers });

  return (
    checkHttpStatus(res, 200, "delete board 200 OK") ||
    checkHttpStatus(res, 204, "delete board 204 No Content")
  );
}
