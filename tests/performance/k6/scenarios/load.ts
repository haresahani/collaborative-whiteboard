import { sleep } from "k6";
import { createK6Options } from "../config/options.js";
import { loadWorkload } from "../workloads/load.js";
import { THRESHOLDS } from "../config/thresholds.js";
import { testAuthLogin } from "../api/auth-login.js";
import { testCreateBoard } from "../api/create-board.js";
import { testListBoards } from "../api/list-boards.js";
import { testAppendOperation } from "../api/append-operation.js";
import { testSnapshots } from "../api/snapshots.js";
import { testWSDraw } from "../websocket/draw.js";
import { testWSCursor } from "../websocket/cursor.js";
import { handleSummary as customSummary } from "../utils/helpers.js";

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
