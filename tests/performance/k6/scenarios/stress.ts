import { sleep } from "k6";
import { createK6Options } from "../config/options.ts";
import { stressWorkload } from "../workloads/stress.ts";
import { THRESHOLDS } from "../config/thresholds.ts";
import { testAuthLogin } from "../api/auth-login.ts";
import { testCreateBoard } from "../api/create-board.ts";
import { testAppendOperation } from "../api/append-operation.ts";
import { testWSDraw } from "../websocket/draw.ts";
import { handleSummary as customSummary } from "../utils/helpers.ts";

export const options = createK6Options(stressWorkload, THRESHOLDS.STRESS);
export const handleSummary = customSummary;

export default function () {
  testAuthLogin();
  const boardId = testCreateBoard() || "k6-stress-board";
  testAppendOperation(boardId);
  testWSDraw(boardId, 10);
  sleep(0.1);
}
