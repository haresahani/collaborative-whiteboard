import http from "k6/http";
import { check } from "k6";
import { ENV } from "../config/environments.ts";
import { HEADERS } from "../utils/constants.ts";
import { apiLoginLatency } from "../metrics/latency.ts";
import { randomEmail } from "../utils/random.ts";

export function testAuthLogin(): boolean {
  const signupUrl = `${ENV.API_BASE_URL}/api/auth/signup`;
  const loginUrl = `${ENV.API_BASE_URL}/api/auth/login`;

  const email = randomEmail();
  const password = "Password123!";

  // 1. Signup user (HTTP 201 Created)
  const signupRes = http.post(
    signupUrl,
    JSON.stringify({ email, password, displayName: "k6 VU" }),
    { headers: HEADERS.JSON },
  );
  const signupOk = check(signupRes, {
    "signup status is 201/200": (r) => r.status === 201 || r.status === 200,
  });

  // 2. Login user (HTTP 200 OK)
  const start = Date.now();
  const loginRes = http.post(loginUrl, JSON.stringify({ email, password }), {
    headers: HEADERS.JSON,
  });
  apiLoginLatency.add(Date.now() - start);

  const loginOk = check(loginRes, {
    "login status is 200": (r) => r.status === 200,
  });

  return signupOk && loginOk;
}
