import { getBounds } from "../engine/geometry/bounds";
import { intersects } from "../engine/geometry/intersects";
import type { Point } from "../models/element";
import type { ToolHandler } from "./types";

export interface MarqueeSession {
  start: Point;
  current: Point;
}

function marqueeBox(session: MarqueeSession) {
  return {
    x: session.start.x,
    y: session.start.y,
    width: session.current.x - session.start.x,
    height: session.current.y - session.start.y,
  };
}

function normalizedBox(session: MarqueeSession) {
  const box = marqueeBox(session);

  return {
    x: Math.min(box.x, box.x + box.width),
    y: Math.min(box.y, box.y + box.height),
    width: Math.abs(box.width),
    height: Math.abs(box.height),
  };
}

export const marqueeTool: ToolHandler<MarqueeSession> = {
  onPointerDown(input) {
    const session: MarqueeSession = {
      start: input.world,
      current: input.world,
    };

    return {
      session,
      effects: [{ type: "setMarquee", box: marqueeBox(session) }],
    };
  },

  onPointerMove(session, input) {
    const next: MarqueeSession = { ...session, current: input.world };

    return {
      session: next,
      effects: [{ type: "setMarquee", box: marqueeBox(next) }],
    };
  },

  onPointerUp(session, _input, ctx) {
    const box = normalizedBox(session);

    const ids = ctx.elements
      .filter((el) => intersects(box, getBounds(el)))
      .map((el) => el.id);

    return {
      session: null,
      effects: [
        { type: "setSelection", ids },
        { type: "setMarquee", box: null },
      ],
    };
  },
};
