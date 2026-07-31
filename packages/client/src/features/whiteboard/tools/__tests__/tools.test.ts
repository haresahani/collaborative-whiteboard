import { describe, expect, it } from "vitest";
import type {
  Element,
  RectangleElement,
  StrokeElement,
} from "../../models/element";
import { eraserTool } from "../eraserTool";
import { marqueeTool } from "../marqueeTool";
import { moveTool } from "../moveTool";
import { penTool } from "../penTool";
import { resizeTool } from "../resizeTool";
import { rectangleTool, textTool } from "../shapeTool";
import { resolvePointerDown } from "../toolRegistry";
import type { PointerInput, ToolContext, ToolEffect } from "../types";

function rect(
  id: string,
  x = 0,
  y = 0,
  width = 100,
  height = 50,
): RectangleElement {
  return {
    id,
    type: "rectangle",
    x,
    y,
    width,
    height,
    zIndex: 0,
    createdAt: 0,
    updatedAt: 0,
    style: { strokeColor: "#111", strokeWidth: 2, fillColor: "#eee" },
  };
}

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  let counter = 0;

  return {
    elements: [],
    selectedIds: [],
    style: {
      color: "#111",
      fillColor: "#eee",
      width: 2,
      eraserSize: 10,
      lineStyle: "solid",
    },
    newId: () => `id-${++counter}`,
    now: () => 1_000,
    ...overrides,
  };
}

function input(
  x: number,
  y: number,
  opts: Partial<PointerInput> = {},
): PointerInput {
  return { world: { x, y }, shiftKey: false, buttons: 1, ...opts };
}

function effectOfType<T extends ToolEffect["type"]>(
  effects: ToolEffect[] | undefined,
  type: T,
): Extract<ToolEffect, { type: T }> | undefined {
  return effects?.find((e) => e.type === type) as
    | Extract<ToolEffect, { type: T }>
    | undefined;
}

describe("penTool", () => {
  it("builds a stroke across down/move/up and commits it", () => {
    const ctx = makeCtx();

    const down = penTool.onPointerDown(input(1, 1), ctx);
    expect(down.session).not.toBeNull();
    expect(down.preview?.type).toBe("stroke");

    const move = penTool.onPointerMove(down.session!, input(5, 5), ctx);
    expect((move.preview as StrokeElement).points).toHaveLength(2);

    const up = penTool.onPointerUp(move.session!, input(5, 5), ctx);
    expect(up.session).toBeNull();
    expect(up.preview).toBeNull();

    const commit = effectOfType(up.effects, "commit");
    expect(commit?.elements).toHaveLength(1);
    expect((commit?.elements[0] as StrokeElement).points).toHaveLength(2);
  });

  it("ignores moves without the primary button held", () => {
    const ctx = makeCtx();
    const down = penTool.onPointerDown(input(1, 1), ctx);

    const move = penTool.onPointerMove(
      down.session!,
      input(9, 9, { buttons: 0 }),
      ctx,
    );

    expect((move.preview as StrokeElement).points).toHaveLength(1);
  });
});

describe("rectangleTool", () => {
  it("commits, selects, and switches back to select on up", () => {
    const ctx = makeCtx();

    const down = rectangleTool.onPointerDown(input(10, 10), ctx);
    const move = rectangleTool.onPointerMove(down.session!, input(40, 30), ctx);
    const preview = move.preview as RectangleElement;

    expect([preview.width, preview.height]).toEqual([30, 20]);

    const up = rectangleTool.onPointerUp(move.session!, input(40, 30), ctx);

    expect(effectOfType(up.effects, "commit")?.elements).toHaveLength(1);
    expect(effectOfType(up.effects, "setSelection")?.ids).toEqual([preview.id]);
    expect(effectOfType(up.effects, "switchTool")?.tool).toBe("select");
  });
});

describe("textTool", () => {
  it("opens the text editor at the pointer-down point on up", () => {
    const ctx = makeCtx();

    const down = textTool.onPointerDown(input(7, 8), ctx);
    // Pointer drifts before release; editor must open at the DOWN point.
    const up = textTool.onPointerUp(down.session!, input(99, 99), ctx);

    const open = effectOfType(up.effects, "openTextEditor");
    expect([open?.x, open?.y]).toEqual([7, 8]);
    expect(effectOfType(up.effects, "switchTool")?.tool).toBe("select");
  });
});

describe("moveTool", () => {
  it("declines when nothing is hit", () => {
    const result = moveTool.onPointerDown(
      input(500, 500),
      makeCtx({ elements: [rect("r")] }),
    );

    expect(result.session).toBeNull();
  });

  it("selects the hit element, emits live frames, and commits with the pre-drag base", () => {
    const base = [rect("r")];
    const ctx = makeCtx({ elements: base, selectedIds: [] });

    const down = moveTool.onPointerDown(input(50, 25), ctx);
    expect(effectOfType(down.effects, "setSelection")?.ids).toEqual(["r"]);

    const dragCtx = makeCtx({ elements: base, selectedIds: ["r"] });
    const move = moveTool.onPointerMove(down.session!, input(60, 35), dragCtx);
    const frame = effectOfType(move.effects, "setElements");
    expect((frame?.elements[0] as RectangleElement).x).toBe(10);

    const upCtx = makeCtx({ elements: frame!.elements, selectedIds: ["r"] });
    const up = moveTool.onPointerUp(move.session!, input(60, 35), upCtx);
    const commit = effectOfType(up.effects, "commit");

    expect(commit?.base).toBe(base);
    expect(commit?.elements).toBe(frame!.elements);
  });
});

describe("resizeTool", () => {
  it("declines without a handle under the pointer", () => {
    const ctx = makeCtx({ elements: [rect("r")], selectedIds: ["r"] });

    expect(resizeTool.onPointerDown(input(50, 25), ctx).session).toBeNull();
  });

  it("starts on a handle and resizes via live frames", () => {
    const base = [rect("r")];
    const ctx = makeCtx({ elements: base, selectedIds: ["r"] });

    // South-east corner handle of bounds (100, 50).
    const down = resizeTool.onPointerDown(input(100, 50), ctx);
    expect(down.session).not.toBeNull();

    const move = resizeTool.onPointerMove(down.session!, input(120, 60), ctx);
    const frame = effectOfType(move.effects, "setElements");
    const resized = frame?.elements[0] as RectangleElement;

    expect([resized.width, resized.height]).toEqual([120, 60]);
  });
});

describe("marqueeTool", () => {
  it("selects intersecting elements using shared geometry and clears the marquee", () => {
    const inside = rect("in", 10, 10, 20, 20);
    const outside = rect("out", 500, 500, 20, 20);
    const ctx = makeCtx({ elements: [inside, outside] });

    const down = marqueeTool.onPointerDown(input(0, 0), ctx);
    const move = marqueeTool.onPointerMove(down.session!, input(100, 100), ctx);

    expect(effectOfType(move.effects, "setMarquee")?.box).toMatchObject({
      width: 100,
      height: 100,
    });

    const up = marqueeTool.onPointerUp(move.session!, input(100, 100), ctx);

    expect(effectOfType(up.effects, "setSelection")?.ids).toEqual(["in"]);
    expect(effectOfType(up.effects, "setMarquee")?.box).toBeNull();
  });

  it("selects with a marquee dragged up-left (negative size)", () => {
    const inside = rect("in", 10, 10, 20, 20);
    const ctx = makeCtx({ elements: [inside] });

    const down = marqueeTool.onPointerDown(input(100, 100), ctx);
    const move = marqueeTool.onPointerMove(down.session!, input(0, 0), ctx);
    const up = marqueeTool.onPointerUp(move.session!, input(0, 0), ctx);

    expect(effectOfType(up.effects, "setSelection")?.ids).toEqual(["in"]);
  });
});

describe("eraserTool", () => {
  it("uses a session and commits history on pointerUp", () => {
    const a = rect("a", 0, 0, 10, 10);
    const b = rect("b", 100, 0, 10, 10);

    const downCtx = makeCtx({ elements: [a, b], selectedIds: ["a"] });
    const down = eraserTool.onPointerDown(input(5, 5), downCtx);

    expect(down.effects).toEqual([]);
    expect(down.session?.baseElements).toEqual([a, b]);
    expect(down.session?.currentElements.map((el: Element) => el.id)).toEqual(["b"]);

    const moveCtx = makeCtx({ elements: [a, b], selectedIds: ["a"] });
    const move = eraserTool.onPointerMove(
      down.session!,
      input(105, 5),
      moveCtx,
    );

    expect(move.effects).toEqual([]);
    expect(move.session?.currentElements).toEqual([]);

    const up = eraserTool.onPointerUp(move.session!, input(105, 5), moveCtx);
    const commitEffect = effectOfType(up.effects, "commit");
    expect(commitEffect).toBeDefined();
    expect(commitEffect?.elements).toEqual([]);
    expect(commitEffect?.base).toEqual([a, b]);

    const selectionEffect = effectOfType(up.effects, "setSelection");
    expect(selectionEffect?.ids).toEqual([]);
  });

  it("keeps the session alive over empty space without effects", () => {
    const a = rect("a", 500, 500);
    const ctx = makeCtx({ elements: [a] });

    const down = eraserTool.onPointerDown(input(5, 5), ctx);

    expect(down.session?.baseElements).toEqual([a]);
    expect(down.session?.currentElements).toEqual([a]);
    expect(down.effects).toEqual([]);
  });
});

describe("toolRegistry.resolvePointerDown", () => {
  it("resolves select-tool gestures: resize over move over marquee", () => {
    const base = [rect("r")];

    // On a handle -> resize wins.
    const onHandle = resolvePointerDown(
      "select",
      input(100, 50),
      makeCtx({ elements: base, selectedIds: ["r"] }),
    );
    expect(onHandle?.handler).toBe(resizeTool);

    // On the element body -> move.
    const onBody = resolvePointerDown(
      "select",
      input(50, 25),
      makeCtx({ elements: base, selectedIds: [] }),
    );
    expect(onBody?.handler).toBe(moveTool);

    // On empty space -> marquee.
    const onEmpty = resolvePointerDown(
      "select",
      input(900, 900),
      makeCtx({ elements: base, selectedIds: [] }),
    );
    expect(onEmpty?.handler).toBe(marqueeTool);
  });
});
