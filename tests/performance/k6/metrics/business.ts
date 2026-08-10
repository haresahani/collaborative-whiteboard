import { Counter, Rate } from "k6/metrics";

export const activeBoardsCount = new Counter("active_boards_count");
export const drawOpsCommittedCount = new Counter("draw_ops_committed_count");
export const userSessionSuccessRate = new Rate("user_session_success_rate");
