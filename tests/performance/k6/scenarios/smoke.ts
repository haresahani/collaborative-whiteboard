import { sleep } from "k6";
import { createK6Options } from "../config/options.js";
import { smokeWorkload } from "../workloads/smoke.js";
import { THRESHOLDS } from "../config/thresholds.js";
import { testAuthLogin } from "../api/auth-login.js";
import { testCreateBoard } from "../api/create-board.js";
import { testAppendOperation } from "../api/append-operation.js";
import { testWSConnect } from "../websocket/connect.js";
import { testWSDraw } from "../websocket/draw.js";
import { testWSCursor } from "../websocket/cursor.js";
import { handleSummary as customSummary } from "../utils/helpers.js";

export const options = createK6Options(smokeWorkload, THRESHOLDS.SMOKE);
export const handleSummary = customSummary;

export default function () {
  testAuthLogin();
  const boardId = testCreateBoard() || "k6-smoke-board";
  testAppendOperation(boardId);

  sleep(0.5);

  testWSConnect();
  testWSDraw(boardId, 2);
  testWSCursor(boardId, 3);

  sleep(0.5);
}
