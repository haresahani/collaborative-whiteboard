import http from "k6/http";
import { sleep } from "k6";
import { createK6Options } from "../config/options.ts";
import { stressWorkload } from "../workloads/stress.ts";
import { THRESHOLDS } from "../config/thresholds.ts";
import { provisionVUTokens } from "../utils/auth.ts";
import { createBoardVU } from "../utils/boards.ts";
import { testAppendOperation } from "../api/append-operation.ts";
import { testWSDraw } from "../websocket/draw.ts";
import { handleSummary as customSummary } from "../utils/helpers.ts";

try {
  http.setResponseCallback(http.expectedStatuses(200, 201, 204));
} catch (e) {}

export const options = createK6Options(stressWorkload, THRESHOLDS.STRESS);
export const handleSummary = customSummary;

export function setup() {
  return provisionVUTokens(250);
}

const cachedBoards: Record<string, string> = {};

export default function (tokens: string[]) {
  const vuIndex = typeof __VU !== "undefined" ? __VU - 1 : 0;
  const token = tokens && tokens.length > 0 ? tokens[vuIndex % tokens.length] : undefined;

  const vuId = typeof __VU !== "undefined" ? `vu_${__VU}` : "vu_default";
  let boardId = cachedBoards[vuId];
  if (!boardId) {
    boardId = createBoardVU(token) || "k6-stress-board";
    if (boardId) {
      cachedBoards[vuId] = boardId;
    }
  }

  testAppendOperation(boardId, token);
  testWSDraw(boardId, 10);
  sleep(0.1);
}
