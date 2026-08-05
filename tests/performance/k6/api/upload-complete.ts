import http from "k6/http";
import { ENV } from "../config/environments.js";
import { getAuthHeaders } from "../utils/headers.js";
import { checkHttpStatus } from "../utils/checks.js";

export function testUploadComplete(boardId: string, assetId: string, token?: string): boolean {
  const url = `${ENV.API_BASE_URL}/api/boards/${boardId}/assets/${assetId}/complete`;
  const headers = getAuthHeaders(token);

  const res = http.post(url, null, { headers });
  return checkHttpStatus(res, 200, "upload complete 200 OK");
}
