import { sleep } from "k6";
import { createK6Options } from "../config/options.js";
import { stressWorkload } from "../workloads/stress.js";
import { THRESHOLDS } from "../config/thresholds.js";
import { testAuthLogin } from "../api/auth-login.js";
import { testCreateBoard } from "../api/create-board.js";
import { testAppendOperation } from "../api/append-operation.js";
import { testWSDraw } from "../websocket/draw.js";
import { handleSummary as customSummary } from "../utils/helpers.js";

export const options = createK6Options(stressWorkload, THRESHOLDS.STRESS);
export const handleSummary = customSummary;

export default function () {
  testAuthLogin();
  const boardId = testCreateBoard() || "k6-stress-board";
  testAppendOperation(boardId);
  testWSDraw(boardId, 10);
  sleep(0.1);
}
