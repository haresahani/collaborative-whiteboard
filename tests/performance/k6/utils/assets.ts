import http from "k6/http";
import { ENV } from "../config/environments.ts";
import { getAuthHeaders } from "./headers.ts";

export function initAssetUploadVU(boardId: string, filename = "test.png", token?: string) {
  const url = `${ENV.API_BASE_URL}/api/boards/${boardId}/assets/upload`;
  const payload = JSON.stringify({ filename, contentType: "image/png", sizeBytes: 1024 });
  const headers = getAuthHeaders(token);

  return http.post(url, payload, { headers });
}
