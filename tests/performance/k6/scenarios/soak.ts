import { sleep } from "k6";
import { createK6Options } from "../config/options.js";
import { soakWorkload } from "../workloads/soak.js";
import { THRESHOLDS } from "../config/thresholds.js";
import { testAuthLogin } from "../api/auth-login.js";
import { testWSDraw } from "../websocket/draw.js";
import { handleSummary as customSummary } from "../utils/helpers.js";

export const options = createK6Options(soakWorkload, THRESHOLDS.SOAK);
export const handleSummary = customSummary;

export default function () {
  testAuthLogin();
  testWSDraw("k6-soak-board", 2);
  sleep(1);
}
