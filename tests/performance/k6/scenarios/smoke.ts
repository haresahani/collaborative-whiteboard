import http from "k6/http";
import { sleep } from "k6";
import { createK6Options } from "../config/options.ts";
import { smokeWorkload } from "../workloads/smoke.ts";
import { THRESHOLDS } from "../config/thresholds.ts";
import { loginVU } from "../utils/auth.ts";
import { createBoardVU } from "../utils/boards.ts";
import { testAppendOperation } from "../api/append-operation.ts";
import { testWSConnect } from "../websocket/connect.ts";
import { testWSDraw } from "../websocket/draw.ts";
import { testWSCursor } from "../websocket/cursor.ts";
import { handleSummary as customSummary } from "../utils/helpers.ts";

try {
  http.setResponseCallback(http.expectedStatuses(200, 201, 204));
} catch (e) {
  // k6 fallback
}

export const options = createK6Options(smokeWorkload, THRESHOLDS.SMOKE);
export const handleSummary = customSummary;

export default function () {
  const token = loginVU() || undefined;
  const boardId = createBoardVU(token) || "k6-smoke-board";
  testAppendOperation(boardId, token);

  sleep(0.5);

  testWSConnect();
  testWSDraw(boardId, 2);
  testWSCursor(boardId, 3);

  sleep(0.5);
}
