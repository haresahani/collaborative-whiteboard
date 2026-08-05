import http from "k6/http";
import { sleep } from "k6";
import { createK6Options } from "../config/options.ts";
import { provisionVUTokens } from "../utils/auth.ts";
import { createBoardVU } from "../utils/boards.ts";
import { testAppendOperation } from "../api/append-operation.ts";
import { testWSDraw } from "../websocket/draw.ts";
import { handleSummary as customSummary } from "../utils/helpers.ts";

try {
  http.setResponseCallback(http.expectedStatuses(200, 201, 204));
} catch (e) {}

const breakpointWorkload = [
  { duration: "30s", target: 50 },
  { duration: "30s", target: 150 },
  { duration: "30s", target: 300 },
  { duration: "30s", target: 500 },
  { duration: "30s", target: 0 },
];

export const options = createK6Options(breakpointWorkload, {
  http_req_duration: ["p(95)<8000"],
  "http_req_failed{expected_response:true}": ["rate<0.05"],
});
export const handleSummary = customSummary;

export function setup() {
  return provisionVUTokens(100);
}

const cachedBoards: Record<string, string> = {};

export default function (tokens: string[]) {
  const vuIndex = typeof __VU !== "undefined" ? __VU - 1 : 0;
  const token = tokens && tokens.length > 0 ? tokens[vuIndex % tokens.length] : undefined;

  const vuId = typeof __VU !== "undefined" ? `vu_${__VU}` : "vu_default";
  let boardId = cachedBoards[vuId];
  if (!boardId) {
    boardId = createBoardVU(token) || "k6-breakpoint-board";
    if (boardId) {
      cachedBoards[vuId] = boardId;
    }
  }

  testAppendOperation(boardId, token);
  testWSDraw(boardId, 5);
  sleep(0.05);
}
