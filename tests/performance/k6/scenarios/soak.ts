import http from "k6/http";
import { sleep } from "k6";
import { createK6Options } from "../config/options.ts";
import { soakWorkload } from "../workloads/soak.ts";
import { THRESHOLDS } from "../config/thresholds.ts";
import { provisionVUTokens } from "../utils/auth.ts";
import { createBoardVU } from "../utils/boards.ts";
import { testWSDraw } from "../websocket/draw.ts";
import { handleSummary as customSummary } from "../utils/helpers.ts";

try {
  http.setResponseCallback(http.expectedStatuses(200, 201, 204));
} catch (e) {}

export const options = createK6Options(soakWorkload, THRESHOLDS.SOAK);
export const handleSummary = customSummary;

export function setup() {
  return provisionVUTokens(30);
}

const cachedBoards: Record<string, string> = {};

export default function (tokens: string[]) {
  const vuIndex = typeof __VU !== "undefined" ? __VU - 1 : 0;
  const token = tokens && tokens.length > 0 ? tokens[vuIndex % tokens.length] : undefined;

  const vuId = typeof __VU !== "undefined" ? `vu_${__VU}` : "vu_default";
  let boardId = cachedBoards[vuId];
  if (!boardId) {
    boardId = createBoardVU(token) || "k6-soak-board";
    if (boardId) {
      cachedBoards[vuId] = boardId;
    }
  }

  testWSDraw(boardId, 2);
  sleep(1);
}
