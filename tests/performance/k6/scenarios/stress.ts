import { sleep } from "k6";
import { createK6Options } from "../config/options.ts";
import { stressWorkload } from "../workloads/stress.ts";
import { THRESHOLDS } from "../config/thresholds.ts";
import { loginVU } from "../utils/auth.ts";
import { createBoardVU } from "../utils/boards.ts";
import { testAppendOperation } from "../api/append-operation.ts";
import { testWSDraw } from "../websocket/draw.ts";
import { handleSummary as customSummary } from "../utils/helpers.ts";

export const options = createK6Options(stressWorkload, THRESHOLDS.STRESS);
export const handleSummary = customSummary;

export default function () {
  const token = loginVU() || undefined;
  const boardId = createBoardVU(token) || "k6-stress-board";
  testAppendOperation(boardId, token);
  testWSDraw(boardId, 10);
  sleep(0.1);
}
