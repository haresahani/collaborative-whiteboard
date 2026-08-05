import { sleep } from "k6";
import { createK6Options } from "../config/options.ts";
import { loadWorkload } from "../workloads/load.ts";
import { THRESHOLDS } from "../config/thresholds.ts";
import { testAuthLogin } from "../api/auth-login.ts";
import { testCreateBoard } from "../api/create-board.ts";
import { testListBoards } from "../api/list-boards.ts";
import { testAppendOperation } from "../api/append-operation.ts";
import { testSnapshots } from "../api/snapshots.ts";
import { testWSDraw } from "../websocket/draw.ts";
import { testWSCursor } from "../websocket/cursor.ts";
import { handleSummary as customSummary } from "../utils/helpers.ts";

export const options = createK6Options(loadWorkload, THRESHOLDS.LOAD);
export const handleSummary = customSummary;

export default function () {
  testAuthLogin();
  testListBoards();

  const boardId = testCreateBoard() || "k6-load-board";
  testAppendOperation(boardId);
  testSnapshots(boardId);

  sleep(0.2);

  testWSDraw(boardId, 5);
  testWSCursor(boardId, 10);

  sleep(0.5);
}
