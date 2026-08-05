import http from "k6/http";
import { ENV } from "../config/environments.ts";
import { getAuthHeaders } from "../utils/headers.ts";
import { randomBoardTitle } from "../utils/random.ts";
import { checkHttpStatus } from "../utils/checks.ts";
import { apiBoardCreateLatency } from "../metrics/latency.ts";

export function testCreateBoard(token?: string): string | null {
  const url = `${ENV.API_BASE_URL}/api/boards`;
  const payload = JSON.stringify({ title: randomBoardTitle() });
  const headers = getAuthHeaders(token);

  const start = Date.now();
  const res = http.post(url, payload, { headers });
  apiBoardCreateLatency.add(Date.now() - start);

  if (checkHttpStatus(res, 201, "create board 201")) {
    try {
      const body = JSON.parse(res.body as string);
      return body.id || null;
    } catch (e) {
      return null;
    }
  }
  return null;
}
