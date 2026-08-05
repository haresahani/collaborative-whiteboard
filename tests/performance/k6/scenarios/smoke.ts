import { sleep } from "k6";
import { createK6Options } from "../config/options.ts";
import { smokeWorkload } from "../workloads/smoke.ts";
import { THRESHOLDS } from "../config/thresholds.ts";
import { testAuthLogin } from "../api/auth-login.ts";
import { testCreateBoard } from "../api/create-board.ts";
import { testAppendOperation } from "../api/append-operation.ts";
import { testWSConnect } from "../websocket/connect.ts";
import { testWSDraw } from "../websocket/draw.ts";
import { testWSCursor } from "../websocket/cursor.ts";
import { handleSummary as customSummary } from "../utils/helpers.ts";

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
