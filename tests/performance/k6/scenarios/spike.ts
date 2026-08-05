import { sleep } from "k6";
import { createK6Options } from "../config/options.js";
import { spikeWorkload } from "../workloads/spike.js";
import { THRESHOLDS } from "../config/thresholds.js";
import { testWSDraw } from "../websocket/draw.js";
import { testWSCursor } from "../websocket/cursor.js";
import { handleSummary as customSummary } from "../utils/helpers.js";

export const options = createK6Options(spikeWorkload, THRESHOLDS.SPIKE);
export const handleSummary = customSummary;

export default function () {
  testWSDraw("k6-spike-board", 3);
  testWSCursor("k6-spike-board", 5);
  sleep(0.05);
}
