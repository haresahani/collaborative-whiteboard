import { sleep } from "k6";
import { createK6Options } from "../config/options.ts";
import { loginVU } from "../utils/auth.ts";
import { testWSDraw } from "../websocket/draw.ts";

const breakpointWorkload = [
  { duration: "30s", target: 50 },
  { duration: "30s", target: 150 },
  { duration: "30s", target: 300 },
  { duration: "30s", target: 500 },
  { duration: "30s", target: 0 },
];

export const options = createK6Options(breakpointWorkload, {
  http_req_duration: ["p(95)<3000"],
});

export default function () {
  loginVU();
  testWSDraw("k6-breakpoint-board", 5);
  sleep(0.05);
}
