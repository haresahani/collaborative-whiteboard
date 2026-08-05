import http from "k6/http";
import { sleep } from "k6";
import { createK6Options } from "../config/options.ts";
import { loadWorkload } from "../workloads/load.ts";
import { THRESHOLDS } from "../config/thresholds.ts";
import { provisionVUTokens } from "../utils/auth.ts";
import { createBoardVU } from "../utils/boards.ts";
import { testListBoards } from "../api/list-boards.ts";
import { testAppendOperation } from "../api/append-operation.ts";
import { testSnapshots } from "../api/snapshots.ts";
import { testWSDraw } from "../websocket/draw.ts";
import { testWSCursor } from "../websocket/cursor.ts";
import { handleSummary as customSummary } from "../utils/helpers.ts";

try {
  http.setResponseCallback(http.expectedStatuses(200, 201, 204));
} catch (e) {}

export const options = createK6Options(loadWorkload, THRESHOLDS.LOAD);
export const handleSummary = customSummary;

export function setup() {
  return provisionVUTokens(50);
}

const cachedBoards: Record<string, string> = {};

export default function (tokens: string[]) {
  const vuIndex = typeof __VU !== "undefined" ? __VU - 1 : 0;
  const token = tokens && tokens.length > 0 ? tokens[vuIndex % tokens.length] : undefined;

  testListBoards(token);

  const vuId = typeof __VU !== "undefined" ? `vu_${__VU}` : "vu_default";
  let boardId = cachedBoards[vuId];
  if (!boardId) {
    boardId = createBoardVU(token) || "k6-load-board";
    if (boardId) {
      cachedBoards[vuId] = boardId;
    }
  }

  testAppendOperation(boardId, token);
  testSnapshots(boardId, token);

  sleep(0.2);

  testWSDraw(boardId, 5);
  testWSCursor(boardId, 10);

  sleep(0.5);
}
