import { Eraser } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBoardStore } from "../../store/boardStore";
import { useCollaborationStore } from "../../store/collaborationStore";
import { useToolSession } from "../../hooks/useToolSession";
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
import { screenToWorld } from "../../engine/viewport";
import { useEraserTrail } from "../../tools/eraser";
import TextEditor from "../overlays/TextEditor";
import { socketService } from "../../../../api/ws";
import type { Element } from "../../models/element";
import { isValidImageFile, processImageFile } from "../../utils/imageLoader";
import {
  getImageCacheVersion,
  subscribeImageCache,
} from "../../engine/shapes/imageShape";
import { cn } from "../../../../lib/utils";

import { useOffscreenCanvas } from "../../hooks/useOffscreenCanvas";

interface WhiteboardCanvasProps {
  onCanvasInteract?: () => void;
}

export default function WhiteboardCanvas({
  onCanvasInteract,
}: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { render: renderCanvas } = useOffscreenCanvas(canvasRef);

  useKeyboardShortcuts();

  const elements = useBoardStore((s) => s.elements);
  const tool = useToolStore((s) => s.tool);

  const offsetX = useViewportStore((s) => s.offsetX);
  const offsetY = useViewportStore((s) => s.offsetY);
  const zoom = useViewportStore((s) => s.zoom);
  const pan = useViewportStore((s) => s.pan);
  const zoomAt = useViewportStore((s) => s.zoomAt);

  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const eraserSize = useToolStore((s) => s.eraserSize);

  const [hoverHandle, setHoverHandle] = useState<Handle | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const canvas = canvasRef.current;
    const bounds = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
    const dropScreenPoint = {
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    };

    const viewport = useViewportStore.getState();
    const dropWorldPoint = screenToWorld(dropScreenPoint, viewport);

    let imageCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (isValidImageFile(file)) {
        imageCount++;
        const targetWorld = {
          x: dropWorldPoint.x + i * 24,
          y: dropWorldPoint.y + i * 24,
        };

        const currentElements = useBoardStore.getState().elements;
        processImageFile(
          file,
          targetWorld,
          currentElements.length,
          (newImageElement) => {
            const nextElements = useBoardStore.getState().elements;
            useBoardStore.getState().commit([...nextElements, newImageElement]);
            useSelectionStore.getState().setSelection([newImageElement.id]);
          },
        );
      }
    }

    if (imageCount > 0) {
      useToolStore.getState().setTool("select");
    }
  }, [canvasRef]);

  const [eraserCursorPoint, setEraserCursorPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const {
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
    getPreview,
    getErasedIds,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleDoubleClick,
  } = useToolSession();

function getElementGeometryHash(el: Element | null): string {
  if (!el) return "";
  if ("points" in el && Array.isArray((el as unknown as Record<string, unknown>).points)) {
    const pts = (el as unknown as { points: { x: number; y: number }[] }).points;
    const last = pts[pts.length - 1];
    return `${el.id}:${pts.length}:${last ? `${last.x.toFixed(1)},${last.y.toFixed(1)}` : ""}`;
  }
  if ("width" in el && "height" in el) {
    const box = el as unknown as {
      x: number;
      y: number;
      width: number;
      height: number;
      rotation?: number;
      opacity?: number;
      flipX?: boolean;
      flipY?: boolean;
    };
    return `${el.id}:${box.x.toFixed(1)},${box.y.toFixed(1)},${box.width.toFixed(1)},${box.height.toFixed(1)}:${box.rotation ?? 0}:${box.opacity ?? 1}:${box.flipX ? 1 : 0}:${box.flipY ? 1 : 0}`;
  }
  if ("x2" in el && "y2" in el) {
    const line = el as unknown as { x1: number; y1: number; x2: number; y2: number };
    return `${el.id}:${line.x1.toFixed(1)},${line.y1.toFixed(1)},${line.x2.toFixed(1)},${line.y2.toFixed(1)}`;
  }
  return `${el.id}:${el.x.toFixed(1)},${el.y.toFixed(1)}`;
}

  /*
  ----------------------------------
  Demand-Driven Render Loop with State Hash Math
  ----------------------------------
  */
  useEffect(() => {
    let animationFrameId: number;
    let lastStateHash: string | null = null;

    const renderLoop = () => {
      const cursorsMap = useCollaborationStore.getState().cursors;
      const cursorList = Array.from(cursorsMap.values());
      const otherPreviews = cursorList
        .map((c) => c.previewElement)
        .filter(Boolean) as Element[];

      const localErasedIds = getErasedIds();
      const allErasedIds = new Set([
        ...localErasedIds,
        ...cursorList.flatMap((c) => c.erasedIds || []),
      ]);

      const preview = getPreview();
      const marquee = useSelectionStore.getState().marquee;

      // Mathematical State Signature for Live Drawing & Dirty Checking
      const previewHash = getElementGeometryHash(preview);
      const remotePreviewsHash = otherPreviews.map(getElementGeometryHash).join(";");
      const stateHash = `${elements.length}:${elements[elements.length - 1]?.id ?? ""}:${previewHash}:${remotePreviewsHash}:${offsetX}:${offsetY}:${zoom}:${selectedIds.join(",")}:${marquee ? `${marquee.x},${marquee.y},${marquee.width},${marquee.height}` : ""}:${eraserTrailPoints.length}:${getImageCacheVersion()}`;

      if (stateHash !== lastStateHash) {
        lastStateHash = stateHash;

        const visibleElements =
          allErasedIds.size > 0
            ? elements.filter((el) => !allErasedIds.has(el.id))
            : elements;

        renderCanvas({
          elements: visibleElements,
          tempElement: preview,
          offsetX,
          offsetY,
          zoom,
          selectedIds,
          marquee,
          otherTempElements: otherPreviews,
        });
      }


      animationFrameId = requestAnimationFrame(renderLoop);
    };

    const unsubscribeImageCache = subscribeImageCache(() => {
      lastStateHash = null;
    });

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      unsubscribeImageCache();
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    elements,
    getPreview,
    getErasedIds,
    offsetX,
    offsetY,
    zoom,
    selectedIds,
    renderCanvas,
    eraserTrailPoints,
  ]);


  /*
  ----------------------------------
  Zoom with mouse wheel
  ----------------------------------
  */
  // Manually attach a non-passive wheel event listener on the canvas element
  // to avoid the browser's "Unable to preventDefault inside passive event listener" warning.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelRaw = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      zoomAt(e.clientX, e.clientY, delta);
    };

    canvas.addEventListener("wheel", handleWheelRaw, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleWheelRaw);
    };
  }, [zoomAt]);

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
    const screenPt = getCanvasPoint(e);
    const { x: worldX, y: worldY } = screenToWorld(
      screenPt,
      useViewportStore.getState(),
    );

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
  const [isPanningWithHand, setIsPanningWithHand] = useState(false);

  const touchStateRef = useRef<{
    dist: number;
    center: { x: number; y: number };
  } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const center = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
      touchStateRef.current = { dist, center };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2 && touchStateRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const newCenter = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };

      const { dist: prevDist, center: prevCenter } = touchStateRef.current;

      const dx = newCenter.x - prevCenter.x;
      const dy = newCenter.y - prevCenter.y;
      if (dx !== 0 || dy !== 0) {
        useViewportStore.getState().pan(dx, dy);
      }

      if (prevDist > 0 && Math.abs(newDist - prevDist) > 2) {
        const zoomFactor = (newDist - prevDist) / 300;
        useViewportStore.getState().zoomAt(newCenter.x, newCenter.y, zoomFactor);
      }

      touchStateRef.current = { dist: newDist, center: newCenter };
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length < 2) {
      touchStateRef.current = null;
    }
  }, []);

  const cursor = hoverHandle
    ? getCursorForHandle(hoverHandle)
    : tool === "hand"
      ? isPanningWithHand
        ? "grabbing"
        : "grab"
      : tool === "eraser"
        ? "none"
        : tool === "select"
          ? "default"
          : "crosshair";

  return (
    <div
      className={cn("whiteboard-canvas-root", isDragOver && "wb-canvas--drag-over")}
      style={{ touchAction: "none" }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragOver) setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragOver(false);
      }}
      onDrop={handleFileDrop}
    >
      {isDragOver ? (
        <div
          className="wb-drag-over-overlay"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 40,
            background: "rgba(59, 130, 246, 0.12)",
            backdropFilter: "blur(4px)",
            border: "2px dashed #3b82f6",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            color: "#3b82f6",
            fontWeight: 600,
          }}
        >
          <div style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>
            Drop image onto board
          </div>
          <span style={{ fontSize: "0.85rem", opacity: 0.8, fontWeight: 400 }}>
            Supports .jpg, .jpeg, .png, .gif, .ico
          </span>
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        className="whiteboard-canvas-element"
        style={{ cursor, touchAction: "none" }}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={(event) => {
          if (tool === "hand" && event.button === 0) {
            setIsPanningWithHand(true);
          }
          if (tool === "eraser" && event.button === 0) {
            const point = getCanvasPoint(event);
            setEraserCursorPoint(point);
            startEraserTrail(point);
          }
          onCanvasInteract?.();
          handlePointerDown(event);
        }}
        onPointerMove={(e) => {
          if (tool === "hand" && e.buttons === 1) {
            pan(e.movementX, e.movementY);
          }

          if (tool === "eraser") {
            const point = getCanvasPoint(e);
            setEraserCursorPoint(point);

            if (e.buttons === 1) {
              moveEraserTrail(point);
            }
          }
          handleHover(e);

          // Process coalesced pointer events for high-frequency input tracking (120Hz/1000Hz gaming mice & stylus)
          const coalescedEvents = e.nativeEvent.getCoalescedEvents
            ? e.nativeEvent.getCoalescedEvents()
            : [];

          if (coalescedEvents.length > 1) {
            for (const cEvt of coalescedEvents) {
              const syntheticEvt = {
                ...e,
                nativeEvent: cEvt,
              } as React.PointerEvent<HTMLCanvasElement>;
              handlePointerMove(syntheticEvt);
            }
          } else {
            handlePointerMove(e);
          }

          handlePan(e);

          // Emit world coordinates of cursor to other board users
          const screenPt = getCanvasPoint(e);
          const { x: worldX, y: worldY } = screenToWorld(
            screenPt,
            useViewportStore.getState(),
          );
          socketService.sendCursorMove(
            worldX,
            worldY,
            getPreview(),
            getErasedIds(),
            tool,
          );
        }}
        onPointerUp={(e) => {
          setIsPanningWithHand(false);
          stopEraserTrail();
          handlePointerUp(e);
        }}
        onPointerLeave={(e) => {
          setIsPanningWithHand(false);
          setEraserCursorPoint(null);
          stopEraserTrail();
          handlePointerUp(e);
        }}
      />

      {tool === "eraser" ? (
        <div
          className="wb-eraser-trail-layer"
          aria-hidden="true"
          style={{ pointerEvents: "none", position: "absolute", inset: 0 }}
        >
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            {eraserTrailPoints.length >= 2 ? (
              <path
                d={eraserTrailPoints.reduce(
                  (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`,
                  "",
                )}
                fill="none"
                stroke="rgba(239, 68, 68, 0.35)"
                strokeWidth={eraserSize * zoom}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </svg>

          {eraserCursorPoint ? (
            <div
              style={{
                position: "absolute",
                left: eraserCursorPoint.x,
                top: eraserCursorPoint.y,
                transform: "translate(-50%, -50%)",
                color: "#ef4444",
                filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4))",
                pointerEvents: "none",
              }}
            >
              <Eraser
                size={Math.max(20, Math.min(36, eraserSize * zoom * 0.8))}
                strokeWidth={2.2}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <TextEditor />
    </div>
  );
}
