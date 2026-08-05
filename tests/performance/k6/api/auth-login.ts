import http from "k6/http";
import { ENV } from "../config/environments.ts";
import { HEADERS } from "../utils/constants.ts";
import { checkHttpStatus } from "../utils/checks.ts";
import { apiLoginLatency } from "../metrics/latency.ts";

export function testAuthLogin(): boolean {
  const url = `${ENV.API_BASE_URL}/api/auth/login`;
  const payload = JSON.stringify({
    email: "user@example.com",
    password: "password123",
  });

  const start = Date.now();
  const res = http.post(url, payload, { headers: HEADERS.JSON });
  apiLoginLatency.add(Date.now() - start);

  return checkHttpStatus(res, 200, "auth login 200 OK");
}
