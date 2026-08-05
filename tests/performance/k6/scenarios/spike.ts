import { sleep } from "k6";
import { createK6Options } from "../config/options.ts";
import { spikeWorkload } from "../workloads/spike.ts";
import { THRESHOLDS } from "../config/thresholds.ts";
import { testWSDraw } from "../websocket/draw.ts";
import { testWSCursor } from "../websocket/cursor.ts";
import { handleSummary as customSummary } from "../utils/helpers.ts";

export const options = createK6Options(spikeWorkload, THRESHOLDS.SPIKE);
export const handleSummary = customSummary;

export default function () {
  testWSDraw("k6-spike-board", 3);
  testWSCursor("k6-spike-board", 5);
  sleep(0.05);
}
