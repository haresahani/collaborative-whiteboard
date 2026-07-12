import { beforeEach, describe, expect, it } from "vitest";
import type { Element, StrokeElement } from "../../models/element";
import { COALESCE_WINDOW_MS, useHistoryStore } from "../historyStore";

function stroke(id: string): StrokeElement {
  return {
    id,
    type: "stroke",
    x: 0,
    y: 0,
    zIndex: 0,
    createdAt: 0,
    updatedAt: 0,
    points: [{ x: 0, y: 0 }],
    style: { strokeColor: "#000", strokeWidth: 2 },
  };
}

const stateA: Element[] = [stroke("a")];
const stateB: Element[] = [stroke("a"), stroke("b")];
const stateC: Element[] = [stroke("c")];

beforeEach(() => {
  useHistoryStore.setState({
    past: [],
    future: [],
    lastCoalesceKey: null,
    lastPushAt: 0,
  });
});

describe("historyStore push coalescing", () => {
  it("pushes normally without a coalesce key", () => {
    const { push } = useHistoryStore.getState();

    push(stateA, undefined, 1000);
    push(stateB, undefined, 1001);

    expect(useHistoryStore.getState().past).toEqual([stateA, stateB]);
  });

  it("coalesces rapid pushes with the same key, keeping the first snapshot", () => {
    const { push } = useHistoryStore.getState();

    push(stateA, "style:color", 1000);
    push(stateB, "style:color", 1100);
    push(stateC, "style:color", 1200);

    expect(useHistoryStore.getState().past).toEqual([stateA]);
  });

  it("does not coalesce same-key pushes outside the time window", () => {
    const { push } = useHistoryStore.getState();

    push(stateA, "style:color", 1000);
    push(stateB, "style:color", 1000 + COALESCE_WINDOW_MS + 1);

    expect(useHistoryStore.getState().past).toEqual([stateA, stateB]);
  });

  it("a continuing gesture keeps extending the window", () => {
    const { push } = useHistoryStore.getState();

    push(stateA, "style:color", 1000);
    push(stateB, "style:color", 1900);
    push(stateC, "style:color", 2800);

    expect(useHistoryStore.getState().past).toEqual([stateA]);
  });

  it("does not coalesce pushes with different keys", () => {
    const { push } = useHistoryStore.getState();

    push(stateA, "style:color", 1000);
    push(stateB, "style:width", 1001);

    expect(useHistoryStore.getState().past).toEqual([stateA, stateB]);
  });

  it("undo resets coalescing so the next same-key push is recorded", () => {
    const { push, undo } = useHistoryStore.getState();

    push(stateA, "style:color", 1000);
    undo(stateB);
    push(stateA, "style:color", 1001);

    expect(useHistoryStore.getState().past).toEqual([stateA]);
    expect(useHistoryStore.getState().lastCoalesceKey).toBe("style:color");
  });

  it("coalesced pushes still clear the redo branch", () => {
    const { push, undo, redo } = useHistoryStore.getState();

    push(stateA, undefined, 1000);
    undo(stateB);
    expect(useHistoryStore.getState().future).toEqual([stateB]);

    push(stateC, "style:color", 1001);
    push(stateC, "style:color", 1002);

    expect(useHistoryStore.getState().future).toEqual([]);
    expect(redo(stateC)).toBeNull();
  });
});
