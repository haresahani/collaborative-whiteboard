import http from "k6/http";
import { ENV } from "../config/environments.js";
import { getAuthHeaders } from "./headers.js";
import { checkHttpStatus } from "./checks.js";
import { apiBoardCreateLatency } from "../metrics/latency.js";
import { randomBoardTitle } from "./random.js";

export function createBoardVU(token?: string): string | null {
  const url = `${ENV.API_BASE_URL}/api/boards`;
  const payload = JSON.stringify({ title: randomBoardTitle() });
  const headers = getAuthHeaders(token);

  const start = Date.now();
  const res = http.post(url, payload, { headers });
  apiBoardCreateLatency.add(Date.now() - start);

  if (checkHttpStatus(res, 201, "create board HTTP 201")) {
    try {
      const body = JSON.parse(res.body as string);
      return body.id || null;
    } catch (e) {
      return null;
    }
  }
  return null;
}
