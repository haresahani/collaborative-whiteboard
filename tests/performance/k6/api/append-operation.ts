import http from "k6/http";
import { ENV } from "../config/environments.ts";
import { getAuthHeaders } from "../utils/headers.ts";
import { checkHttpStatus } from "../utils/checks.ts";
import { apiOpAppendLatency } from "../metrics/latency.ts";
import { drawOpsCommittedCount } from "../metrics/business.ts";

export function testAppendOperation(boardId: string, token?: string): boolean {
  const url = `${ENV.API_BASE_URL}/api/boards/${boardId}/operations`;
  const payload = JSON.stringify({
    opId: `op-k6-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: "element.create",
    actorId: "k6-actor",
    lamport: Date.now(),
    createdAt: new Date().toISOString(),
    payload: { id: `rect-${Date.now()}`, type: "rectangle", x: 100, y: 100 },
  });
  const headers = getAuthHeaders(token);

  const start = Date.now();
  const res = http.post(url, payload, { headers });
  apiOpAppendLatency.add(Date.now() - start);

  const ok = checkHttpStatus(res, 200, "append op 200 OK") || checkHttpStatus(res, 201, "append op 201 Created");
  if (ok) {
    drawOpsCommittedCount.add(1);
  }
  return ok;
}
