import { Eraser } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useBoardStore } from "../../store/boardStore";
import { renderElements } from "../../engine/renderer";
import { usePointerDraw } from "../../hooks/usePointerDraw";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { useToolStore } from "../../store/toolStore";
import { useViewportStore } from "../../store/viewportStore";
import { useSelectionStore } from "../../store/selectionStore";
import {
  getHandleUnderPoint,
  getCursorForHandle,
  type Handle,
} from "../../engine/geometry/resizeHandles";
import { getSelectionBounds } from "../../engine/geometry/bounds";
import { ERASER_TRAIL_LIFETIME_MS, useEraserTrail } from "../../tools/eraser";
import TextEditor from "../overlays/TextEditor";

interface WhiteboardCanvasProps {
  onCanvasInteract?: () => void;
}

export default function WhiteboardCanvas({
  onCanvasInteract,
}: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useKeyboardShortcuts();

  const elements = useBoardStore((s) => s.elements);
  const tool = useToolStore((s) => s.tool);

  const offsetX = useViewportStore((s) => s.offsetX);
  const offsetY = useViewportStore((s) => s.offsetY);
  const zoom = useViewportStore((s) => s.zoom);
  const pan = useViewportStore((s) => s.pan);
  const zoomAt = useViewportStore((s) => s.zoomAt);

  const selectedIds = useSelectionStore((s) => s.selectedIds);

  const [hoverHandle, setHoverHandle] = useState<Handle | null>(null);
  const [eraserCursorPoint, setEraserCursorPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const {
    clock: eraserTrailClock,
    head: eraserTrailHead,
    trail: eraserTrailPoints,
    start: startEraserTrail,
    move: moveEraserTrail,
    stop: stopEraserTrail,
    reset: resetEraserTrail,
  } = useEraserTrail(tool === "eraser");

  useEffect(() => {
    if (tool !== "eraser") {
      resetEraserTrail();
    }
  }, [resetEraserTrail, tool]);

  const {
    engineRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleDoubleClick,
  } = usePointerDraw();

  /*
  ----------------------------------
  Resize canvas to full screen
  ----------------------------------
  */
  useEffect(() => {
    function resizeCanvas() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  /*
  ----------------------------------
  Render Loop
  ----------------------------------
  */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const tempElement =
        engineRef.current.getCurrentStroke() ||
        engineRef.current.getCurrentRectangle() ||
        engineRef.current.getCurrentArrow() ||
        engineRef.current.getCurrentText();

      renderElements(
        ctx,
        elements,
        tempElement,
        offsetX,
        offsetY,
        zoom,
        selectedIds,
      );

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationFrameId);
  }, [elements, engineRef, offsetX, offsetY, zoom, selectedIds]);

  /*
  ----------------------------------
  Zoom with mouse wheel
  ----------------------------------
  */
  function handleWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault();

    const delta = -e.deltaY * 0.001;

    zoomAt(e.clientX, e.clientY, delta);
  }

  /*
  ----------------------------------
  Pan with middle mouse
  ----------------------------------
  */
  function handlePan(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.buttons === 4) {
      pan(e.movementX, e.movementY);
    }
  }

  function getCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return {
        x: event.nativeEvent.offsetX,
        y: event.nativeEvent.offsetY,
      };
    }

    const bounds = canvas.getBoundingClientRect();

    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  }

  /*
  ----------------------------------
  Hover resize handles
  ----------------------------------
  */
  function handleHover(e: React.PointerEvent<HTMLCanvasElement>) {
    const { offsetX, offsetY, zoom } = useViewportStore.getState();

    const screenX = e.nativeEvent.offsetX;
    const screenY = e.nativeEvent.offsetY;

    const worldX = (screenX - offsetX) / zoom;
    const worldY = (screenY - offsetY) / zoom;

    const elements = useBoardStore.getState().elements;
    const selectedIds = useSelectionStore.getState().selectedIds;

    if (selectedIds.length === 0) {
      setHoverHandle(null);
      return;
    }

    const selectedElements = elements.filter((el) =>
      selectedIds.includes(el.id),
    );

    if (selectedElements.length === 0) {
      setHoverHandle(null);
      return;
    }

    const bounds = getSelectionBounds(selectedElements);

    const handle = getHandleUnderPoint(worldX, worldY, bounds);

    setHoverHandle(handle);
  }

  /*
  ----------------------------------
  Cursor logic
  ----------------------------------
  */
  const cursor = hoverHandle
    ? getCursorForHandle(hoverHandle)
    : tool === "eraser"
      ? "none"
      : tool === "select"
        ? "default"
        : "crosshair";

  return (
    <div className="whiteboard-canvas-root">
      <canvas
        ref={canvasRef}
        className="whiteboard-canvas-element"
        style={{ cursor }}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onPointerDown={(event) => {
          if (tool === "eraser" && event.button === 0) {
            const point = getCanvasPoint(event);
            setEraserCursorPoint(point);
            startEraserTrail(point);
          }
          onCanvasInteract?.();
          handlePointerDown(event);
        }}
        onPointerMove={(e) => {
          if (tool === "eraser") {
            const point = getCanvasPoint(e);
            setEraserCursorPoint(point);

            if (e.buttons === 1) {
              moveEraserTrail(point);
            }
          }
          handleHover(e);
          handlePointerMove(e);
          handlePan(e);
        }}
        onPointerUp={() => {
          stopEraserTrail();
          handlePointerUp();
        }}
        onPointerLeave={() => {
          setEraserCursorPoint(null);
          stopEraserTrail();
          handlePointerUp();
        }}
      />

      {tool === "eraser" ? (
        <div className="wb-eraser-trail-layer" aria-hidden="true">
          {eraserTrailPoints.map((point, index) => {
            const age = eraserTrailClock - point.createdAt;
            const fade = Math.max(
              0,
              Math.min(1, 1 - age / ERASER_TRAIL_LIFETIME_MS),
            );
            const scale = 0.72 + fade * 0.28;
            const trailWeight = Math.max(eraserTrailPoints.length, 1);

            return (
              <span
                key={point.id}
                className="wb-eraser-trail-item"
                style={{
                  left: point.x,
                  top: point.y,
                  opacity: fade * (0.24 + index / (trailWeight * 1.4)),
                  transform: `translate(-50%, -50%) scale(${scale})`,
                }}
              >
                <Eraser size={16} strokeWidth={2.1} />
              </span>
            );
          })}

          {eraserCursorPoint ? (
            <span
              className="wb-eraser-trail-item wb-eraser-trail-item--head"
              style={{
                left: eraserTrailHead?.x ?? eraserCursorPoint.x,
                top: eraserTrailHead?.y ?? eraserCursorPoint.y,
                transform: "translate(-50%, -50%) scale(1)",
              }}
            >
              <Eraser size={18} strokeWidth={2.1} />
            </span>
          ) : null}
        </div>
      ) : null}

      <TextEditor />
    </div>
  );
}
