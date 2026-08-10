import http from "k6/http";
import { ENV } from "../config/environments.ts";
import { HEADERS } from "./constants.ts";
import { checkHttpStatus } from "./checks.ts";
import { apiLoginLatency } from "../metrics/latency.ts";

const cachedTokens: Record<string, string> = {};

export function loginVU(): string | null {
  const vuId = typeof __VU !== "undefined" ? `vu_${__VU}` : "vu_default";

  // Reuse cached token for this Virtual User to eliminate repetitive bcrypt CPU overhead
  if (cachedTokens[vuId]) {
    return cachedTokens[vuId];
  }

  const signupUrl = `${ENV.API_BASE_URL}/api/auth/signup`;
  const loginUrl = `${ENV.API_BASE_URL}/api/auth/login`;
  const email = `k6_${vuId}_${Date.now()}@example.com`;
  const password = "Password123!";

  // 1. Signup user
  http.post(
    signupUrl,
    JSON.stringify({ email, password, displayName: `VU ${vuId}` }),
    { headers: HEADERS.JSON },
  );

  // 2. Login user
  const startTime = Date.now();
  const res = http.post(loginUrl, JSON.stringify({ email, password }), {
    headers: HEADERS.JSON,
  });
  apiLoginLatency.add(Date.now() - startTime);

  if (checkHttpStatus(res, 200, "auth login 200 OK")) {
    try {
      const body = JSON.parse(res.body as string);
      const token = (body.data && body.data.token) || body.token || null;
      if (token) {
        cachedTokens[vuId] = token;
      }
      return token;
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function provisionVUTokens(count: number = 50): string[] {
  const tokens: string[] = [];
  const signupUrl = `${ENV.API_BASE_URL}/api/auth/signup`;
  const loginUrl = `${ENV.API_BASE_URL}/api/auth/login`;

  for (let i = 1; i <= count; i++) {
    const email = `k6_preseed_${i}_${Date.now()}@example.com`;
    const password = "Password123!";

    http.post(
      signupUrl,
      JSON.stringify({ email, password, displayName: `VU Preseed ${i}` }),
      { headers: HEADERS.JSON },
    );
    const res = http.post(loginUrl, JSON.stringify({ email, password }), {
      headers: HEADERS.JSON,
    });
    if (res.status === 200) {
      try {
        const body = JSON.parse(res.body as string);
        const token = (body.data && body.data.token) || body.token;
        if (token) tokens.push(token);
      } catch (e) {}
    }
  }
  return tokens;
}
