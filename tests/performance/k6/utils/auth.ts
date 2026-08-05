import http from "k6/http";
import { ENV } from "../config/environments.ts";
import { HEADERS } from "./constants.ts";
import { checkHttpStatus } from "./checks.ts";
import { apiLoginLatency } from "../metrics/latency.ts";

export function loginVU(email = "user@example.com", password = "password123"): string | null {
  const url = `${ENV.API_BASE_URL}/api/auth/login`;
  const payload = JSON.stringify({ email, password });

  const startTime = Date.now();
  const res = http.post(url, payload, { headers: HEADERS.JSON });
  apiLoginLatency.add(Date.now() - startTime);

  if (checkHttpStatus(res, 200, "login HTTP 200")) {
    try {
      const body = JSON.parse(res.body as string);
      return body.token || null;
    } catch (e) {
      return null;
    }
  }
  return null;
}
