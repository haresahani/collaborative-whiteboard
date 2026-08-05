import http from "k6/http";
import { ENV } from "../config/environments.ts";
import { getAuthHeaders } from "../utils/headers.ts";
import { checkHttpStatus } from "../utils/checks.ts";

export function testGetAsset(boardId: string, assetId: string, token?: string): boolean {
  const url = `${ENV.API_BASE_URL}/api/boards/${boardId}/assets/${assetId}`;
  const headers = getAuthHeaders(token);

  const res = http.get(url, { headers });
  return checkHttpStatus(res, 200, "get asset 200 OK");
}
