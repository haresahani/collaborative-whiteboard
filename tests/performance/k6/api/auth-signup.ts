import http from "k6/http";
import { ENV } from "../config/environments.ts";
import { HEADERS } from "../utils/constants.ts";
import { randomEmail } from "../utils/random.ts";
import { checkHttpStatus } from "../utils/checks.ts";

export function testAuthSignup(): boolean {
  const url = `${ENV.API_BASE_URL}/api/auth/signup`;
  const payload = JSON.stringify({
    email: randomEmail(),
    password: "Password123!",
    displayName: "k6 Signup VU",
  });

  const res = http.post(url, payload, { headers: HEADERS.JSON });
  return checkHttpStatus(res, 201, "auth signup 201 Created") || checkHttpStatus(res, 200, "auth signup 200 OK");
}
