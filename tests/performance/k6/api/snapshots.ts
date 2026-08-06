import http from "k6/http";
import { ENV } from "../config/environments.ts";
import { getAuthHeaders } from "../utils/headers.ts";
import { checkHttpStatus } from "../utils/checks.ts";
import { apiSnapshotLatency } from "../metrics/latency.ts";

export function testSnapshots(boardId: string, token?: string): boolean {
  const url = `${ENV.API_BASE_URL}/api/boards/${boardId}/snapshot`;
  const headers = getAuthHeaders(token);

  const start = Date.now();
  const res = http.get(url, { headers });
  apiSnapshotLatency.add(Date.now() - start);

  return checkHttpStatus(res, 200, "snapshot 200 OK");
}
