import { Trend, Counter } from "k6/metrics";

export const wsConnectLatency = new Trend("ws_connect_latency");
export const wsDrawBroadcastLatency = new Trend("ws_draw_broadcast_latency");
export const wsCursorBroadcastLatency = new Trend(
  "ws_cursor_broadcast_latency",
);

export const wsMessagesSent = new Counter("ws_messages_sent");
export const wsMessagesReceived = new Counter("ws_messages_received");
export const wsReconnections = new Counter("ws_reconnections");
