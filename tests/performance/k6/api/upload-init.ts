import http from "k6/http";
import { ENV } from "../config/environments.ts";
import { getAuthHeaders } from "../utils/headers.ts";
import { checkHttpStatus } from "../utils/checks.ts";

export function testUploadInit(boardId: string, token?: string): boolean {
  const url = `${ENV.API_BASE_URL}/api/boards/${boardId}/assets/upload-init`;
  const payload = JSON.stringify({ filename: "sample.png", contentType: "image/png", sizeBytes: 2048 });
  const headers = getAuthHeaders(token);

  const res = http.post(url, payload, { headers });
  return checkHttpStatus(res, 200, "upload init 200 OK") || checkHttpStatus(res, 201, "upload init 201 Created");
}
