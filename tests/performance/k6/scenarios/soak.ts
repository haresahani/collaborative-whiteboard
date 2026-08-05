import { sleep } from "k6";
import { createK6Options } from "../config/options.ts";
import { soakWorkload } from "../workloads/soak.ts";
import { THRESHOLDS } from "../config/thresholds.ts";
import { testAuthLogin } from "../api/auth-login.ts";
import { testWSDraw } from "../websocket/draw.ts";
import { handleSummary as customSummary } from "../utils/helpers.ts";

export const options = createK6Options(soakWorkload, THRESHOLDS.SOAK);
export const handleSummary = customSummary;

export default function () {
  testAuthLogin();
  testWSDraw("k6-soak-board", 2);
  sleep(1);
}
