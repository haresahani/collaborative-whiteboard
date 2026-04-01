import { useRef } from "react";
import { DrawingEngine } from "../engine/drawingEngine";
import { useBoardStore } from "../store/boardStore";
import { useToolStore } from "../store/toolStore";
import { useViewportStore } from "../store/viewportStore";
import { useSelectionStore } from "../store/selectionStore";
import { useHistoryStore } from "../store/historyStore";
import { getSelectionBounds, getBounds } from "../engine/geometry/bounds";
import {
  getHandleUnderPoint,
  type Handle,
} from "../engine/geometry/resizeHandles";
import { snapToGrid } from "../engine/snapping/snapToGrid";

import type {
  StrokeElement,
  RectangleElement,
  Element,
} from "../models/element";
import { hitTestElement } from "../engine/shapes/shapeRegistry";
import { useTextEditorStore } from "../store/textEditorStore";
import { findBindableElement } from "../engine/bindings/findBindableElement";
import { computeBindingAnchor } from "../engine/bindings/arrowBinding";
import { getElementsTouchedByEraser, getEraserRadius } from "../tools/eraser";
import { updateAllArrowBindings } from "../tools/selectTool";

export function usePointerDraw() {
  const engineRef = useRef(new DrawingEngine());

  const addElement = useBoardStore((s) => s.addElement);
  const setElements = useBoardStore((s) => s.setElements);

  const dragRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const resizeHandleRef = useRef<Handle | null>(null);
  const marqueeActiveRef = useRef(false);
  const eraseSnapshotRef = useRef<Element[] | null>(null);
  const eraseCommittedRef = useRef(false);

  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const marquee = useSelectionStore((s) => s.marquee);
  const setMarquee = useSelectionStore((s) => s.setMarquee);

  const tool = useToolStore((s) => s.tool);
  const color = useToolStore((s) => s.color);
  const fillColor = useToolStore((s) => s.fillColor);
  const width = useToolStore((s) => s.width);
  const lineStyle = useToolStore((s) => s.lineStyle);

  function eraseAtPoint(point: { x: number; y: number }) {
    const radius = getEraserRadius(width);
    const currentElements = useBoardStore.getState().elements;
    const touchedElements = getElementsTouchedByEraser(
      currentElements,
      point,
      radius,
    );

    if (touchedElements.length === 0) return;

    if (!eraseCommittedRef.current) {
      useHistoryStore
        .getState()
        .push(eraseSnapshotRef.current ?? currentElements);
      eraseCommittedRef.current = true;
    }

    const touchedIds = new Set(touchedElements.map((element) => element.id));

    setElements(
      currentElements.filter((element) => !touchedIds.has(element.id)),
    );

    const nextSelection = useSelectionStore
      .getState()
      .selectedIds.filter((id) => !touchedIds.has(id));
    useSelectionStore.getState().setSelection(nextSelection);
  }

  /*
  --------------------------------
  Pointer Down
  --------------------------------
  */

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const { offsetX, offsetY, zoom } = useViewportStore.getState();

    const screenX = e.nativeEvent.offsetX;
    const screenY = e.nativeEvent.offsetY;

    const point = {
      x: (screenX - offsetX) / zoom,
      y: (screenY - offsetY) / zoom,
    };

    lastPointRef.current = point;

    const elements = useBoardStore.getState().elements;

    /*
    Selection Tool (hit test + marquee start)
    */

    if (tool === "select") {
      const selectedElements = elements.filter((el) =>
        selectedIds.includes(el.id),
      );

      if (selectedElements.length > 0) {
        const bounds = getSelectionBounds(selectedElements);

        const handle = getHandleUnderPoint(point.x, point.y, bounds);

        if (handle) {
          resizeHandleRef.current = handle;
          return;
        }
      }

      const hit = [...elements]
        .slice()
        .reverse()
        .find((el) => hitTestElement(point.x, point.y, el));

      if (hit) {
        if (e.shiftKey) {
          useSelectionStore.getState().addToSelection(hit.id);
        } else {
          useSelectionStore.getState().setSelection([hit.id]);
        }

        dragRef.current = true;
      } else {
        // start marquee
        marqueeActiveRef.current = true;
        setMarquee({
          x: point.x,
          y: point.y,
          width: 0,
          height: 0,
        });
      }

      return;
    }

    /*
    Pen Tool
    */

    if (tool === "pen") {
      engineRef.current.startStroke(point, {
        strokeColor: color,
        strokeWidth: width,
        lineStyle,
      });
    }

    /*
    Eraser Tool
    */

    if (tool === "eraser") {
      eraseSnapshotRef.current = elements;
      eraseCommittedRef.current = false;
      eraseAtPoint(point);
      return;
    }

    /*
    Rectangle Tool
    */

    if (tool === "rectangle") {
      engineRef.current.startRectangle(point, {
        strokeColor: color,
        strokeWidth: width,
        fillColor,
        lineStyle,
      });
      return;
    }

    //Arrow
    if (tool === "arrow") {
      engineRef.current.startArrow(point, {
        strokeColor: color,
        strokeWidth: width,
        lineStyle,
      });
    }

    // Text tool - now start editing on pointer UP to avoid immediate blur
    if (tool === "text") {
      return;
    }
  }

  function handleDoubleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const tool = useToolStore.getState().tool;
    if (tool !== "select") return;

    const { offsetX, offsetY, zoom } = useViewportStore.getState();

    const screenX = e.nativeEvent.offsetX;
    const screenY = e.nativeEvent.offsetY;

    const point = {
      x: (screenX - offsetX) / zoom,
      y: (screenY - offsetY) / zoom,
    };

    const elements = useBoardStore.getState().elements;

    const hit = [...elements]
      .slice()
      .reverse()
      .find((el) => hitTestElement(point.x, point.y, el));

    if (hit?.type !== "text") return;

    useSelectionStore.getState().setSelection([hit.id]);
    useTextEditorStore.getState().startEditing({
      elementId: hit.id,
      x: hit.x,
      y: hit.y,
      initial: hit.text,
    });
  }

  /*
  --------------------------------
  Pointer Move
  --------------------------------
  */

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const { offsetX, offsetY, zoom } = useViewportStore.getState();

    const screenX = e.nativeEvent.offsetX;
    const screenY = e.nativeEvent.offsetY;

    const point = {
      x: (screenX - offsetX) / zoom,
      y: (screenY - offsetY) / zoom,
    };

    const selectedIds = useSelectionStore.getState().selectedIds;

    /*
    Drag Elements
    */

    if (resizeHandleRef.current && lastPointRef.current) {
      const dx = point.x - lastPointRef.current.x;
      const dy = point.y - lastPointRef.current.y;

      const handle = resizeHandleRef.current;

      useBoardStore.setState((state) => ({
        elements: updateAllArrowBindings(
          state.elements.map((el) => {
            if (!selectedIds.includes(el.id)) return el;

            if (el.type === "rectangle") {
              let { x, y, width, height } = el;

              if (handle.includes("w")) {
                x += dx;
                width -= dx;
              }
              if (handle.includes("e")) {
                width += dx;
              }
              if (handle.includes("n")) {
                y += dy;
                height -= dy;
              }
              if (handle.includes("s")) {
                height += dy;
              }

              if (width < 0) {
                x += width;
                width = Math.abs(width);
              }

              if (height < 0) {
                y += height;
                height = Math.abs(height);
              }

              const updated: RectangleElement = {
                ...el,
                x,
                y,
                width,
                height,
                updatedAt: Date.now(),
              };

              return updated;
            }

            if (el.type === "arrow") {
              // Resizing an arrow edits its endpoints; detach any bindings.
              const x1 = el.x1;
              const y1 = el.y1;
              const x2 = el.x2;
              const y2 = el.y2;

              const x1IsMin = x1 <= x2;
              const y1IsMin = y1 <= y2;

              let nx1 = x1;
              let ny1 = y1;
              let nx2 = x2;
              let ny2 = y2;

              if (handle.includes("w")) {
                if (x1IsMin) nx1 += dx;
                else nx2 += dx;
              }
              if (handle.includes("e")) {
                if (x1IsMin) nx2 += dx;
                else nx1 += dx;
              }
              if (handle.includes("n")) {
                if (y1IsMin) ny1 += dy;
                else ny2 += dy;
              }
              if (handle.includes("s")) {
                if (y1IsMin) ny2 += dy;
                else ny1 += dy;
              }

              const minX = Math.min(nx1, nx2);
              const minY = Math.min(ny1, ny2);

              return {
                ...el,
                x1: nx1,
                y1: ny1,
                x2: nx2,
                y2: ny2,
                x: minX,
                y: minY,
                startBinding: undefined,
                endBinding: undefined,
                updatedAt: Date.now(),
              };
            }

            return el;
          }),
        ),
      }));

      lastPointRef.current = point;
      return;
    }

    if (dragRef.current && lastPointRef.current) {
      const snapped = e.shiftKey ? snapToGrid(point.x, point.y) : point;

      const dx = snapped.x - lastPointRef.current.x;
      const dy = snapped.y - lastPointRef.current.y;

      useBoardStore.setState((state) => ({
        elements: updateAllArrowBindings(
          state.elements.map((el) => {
            if (!selectedIds.includes(el.id)) return el;

            if (el.type === "stroke") {
              return {
                ...el,
                points: el.points.map((p) => ({
                  x: p.x + dx,
                  y: p.y + dy,
                })),
                updatedAt: Date.now(),
              } as StrokeElement;
            }

            if (el.type === "rectangle") {
              return {
                ...el,
                x: el.x + dx,
                y: el.y + dy,
                updatedAt: Date.now(),
              } as RectangleElement;
            }

            if (el.type === "text") {
              return {
                ...el,
                x: el.x + dx,
                y: el.y + dy,
                updatedAt: Date.now(),
              };
            }

            if (el.type === "arrow") {
              return {
                ...el,
                x1: el.x1 + dx,
                y1: el.y1 + dy,
                x2: el.x2 + dx,
                y2: el.y2 + dy,
                x: el.x + dx,
                y: el.y + dy,
                startBinding: undefined,
                endBinding: undefined,
                updatedAt: Date.now(),
              };
            }

            return el;
          }),
        ),
      }));

      lastPointRef.current = point;

      return;
    }

    if (tool === "rectangle") {
      engineRef.current.updateRectangle(point);
      return;
    }

    if (tool === "eraser") {
      if (e.buttons === 1) {
        eraseAtPoint(point);
      }
      return;
    }

    // update marquee while dragging
    if (tool === "select" && marqueeActiveRef.current && marquee) {
      setMarquee({
        ...marquee,
        width: point.x - marquee.x,
        height: point.y - marquee.y,
      });
      return;
    }

    /*
    Continue drawing stroke
    */

    if (e.buttons !== 1) return;

    //Arrow
    if (tool === "arrow") {
      engineRef.current.updateArrow(point);
    }

    engineRef.current.addPoint(point);
  }

  /*
  --------------------------------
  Pointer Up
  --------------------------------
  */

  function handlePointerUp() {
    const tool = useToolStore.getState().tool;

    if (tool === "eraser") {
      dragRef.current = false;
      lastPointRef.current = null;
      resizeHandleRef.current = null;
      eraseSnapshotRef.current = null;
      eraseCommittedRef.current = false;
      return;
    }

    // For text tool, start DOM editing on pointer up at the last point.
    if (tool === "text" && lastPointRef.current) {
      const point = lastPointRef.current;
      useTextEditorStore.getState().startEditing({ x: point.x, y: point.y });
      useToolStore.getState().setTool("select");

      dragRef.current = false;
      lastPointRef.current = null;
      resizeHandleRef.current = null;
      return;
    }

    dragRef.current = false;
    lastPointRef.current = null;
    resizeHandleRef.current = null;

    const element = engineRef.current.endStroke();
    const rect = engineRef.current.endRectangle();
    const arrow = engineRef.current.endArrow();
    const text = engineRef.current.endText();

    if (rect) {
      addElement(rect);
      useSelectionStore.getState().setSelection([rect.id]);
      useToolStore.getState().setTool("select");
      return;
    }

    // finalize marquee selection
    if (marqueeActiveRef.current && marquee) {
      const elements = useBoardStore.getState().elements;

      const box = {
        x: Math.min(marquee.x, marquee.x + marquee.width),
        y: Math.min(marquee.y, marquee.y + marquee.height),
        width: Math.abs(marquee.width),
        height: Math.abs(marquee.height),
      };

      const intersects = (
        a: { x: number; y: number; width: number; height: number },
        b: { x: number; y: number; width: number; height: number },
      ) => {
        return !(
          a.x + a.width < b.x ||
          a.x > b.x + b.width ||
          a.y + a.height < b.y ||
          a.y > b.y + b.height
        );
      };

      const selected = elements.filter((el) => intersects(box, getBounds(el)));

      useSelectionStore.getState().setSelection(selected.map((e) => e.id));

      setMarquee(null);
      marqueeActiveRef.current = false;
    }
    /*
    Commit stroke
    */

    if (element) {
      addElement(element);
    }

    //Arrow
    if (arrow) {
      const elements = useBoardStore.getState().elements;

      //Start binding
      const startTarget = findBindableElement(arrow.x1, arrow.y1, elements);

      if (startTarget) {
        arrow.startBinding = {
          elementId: startTarget.id,
          anchor: computeBindingAnchor(startTarget, arrow.x1, arrow.y1),
        };
      }

      //End binding
      const endTarget = findBindableElement(arrow.x2, arrow.y2, elements);

      if (endTarget) {
        arrow.endBinding = {
          elementId: endTarget.id,
          anchor: computeBindingAnchor(endTarget, arrow.x2, arrow.y2),
        };
      }
      useBoardStore.getState().addElement(arrow);
      useSelectionStore.getState().setSelection([arrow.id]);
      useToolStore.getState().setTool("select");
    }

    //Text
    if (text) {
      addElement(text);
    }
  }

  return {
    engineRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleDoubleClick,
  };
}
