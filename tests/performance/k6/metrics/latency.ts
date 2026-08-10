import { Trend } from "k6/metrics";

export const apiLoginLatency = new Trend("api_login_latency");
export const apiBoardCreateLatency = new Trend("api_board_create_latency");
export const apiOpAppendLatency = new Trend("api_op_append_latency");
export const apiSnapshotLatency = new Trend("api_snapshot_latency");
