import type { ToolHandler } from "./types";

export interface HandSession {
  lastX: number;
  lastY: number;
}

export const handTool: ToolHandler<HandSession> = {
  onPointerDown(input) {
    return {
      session: {
        lastX: input.world.x,
        lastY: input.world.y,
      },
    };
  },

  onPointerMove(session) {
    return { session };
  },

  onPointerUp() {
    return { session: null };
  },
};
