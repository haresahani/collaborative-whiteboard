import React, { useRef, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useWhiteboard } from "@/contexts/WhiteboardContext";
import type {
  DrawingElement,
  Point,
  Size,
  StrokeStyle,
} from "@/types/whiteboard";
import { PresenceCursors } from "./PresenceCursors";
import { cn } from "@/lib/utils";

const DEFAULT_TEXT_STYLE = {
  color: "#0f172a",
  fontSize: 24,
  fontFamily: "Inter",
  fontWeight: "600",
  width: 200,
  height: 40,
};

const DEFAULT_STICKY_OPTIONS = {
  width: 180,
  height: 140,
  color: "#fde68a",
  textColor: "#1f2937",
};

const DASH_PATTERNS: Record<StrokeStyle, number[]> = {
  solid: [],
  dashed: [12, 6],
  dotted: [3, 6],
};

interface WhiteboardCanvasProps {
  className?: string;
  onCursorMove?: (point: Point) => void;
}

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function WhiteboardCanvas({
  className,
  onCursorMove,
}: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    state,
    addElement,
    selectElements,
    deleteElement,
    setViewport,
    updateElement,
  } = useWhiteboard();
  const { elements, tool, viewport, selectedElements, toolSettings } = state;

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [tempElement, setTempElement] = useState<DrawingElement | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<Point | null>(null);
  const panViewportRef = useRef(viewport);
  const dragStateRef = useRef<{
    origin: Point;
    elementIds: string[];
    snapshots: Record<
      string,
      {
        position: Point;
        pathPoints?: Point[];
      }
    >;
  } | null>(null);
  const selectionOriginRef = useRef<Point | null>(null);
  const marqueeModeRef = useRef<"add" | "replace">("replace");
  const marqueeBaseSelectionRef = useRef<string[]>([]);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(
    null,
  );
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [isSpacePanning, setIsSpacePanning] = useState(false);

  useEffect(() => {
    if (!isPanning) {
      panViewportRef.current = viewport;
    }
  }, [viewport, isPanning]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.code === "Space" &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement) &&
        !(event.target instanceof HTMLButtonElement)
      ) {
        event.preventDefault();
        setIsSpacePanning(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        setIsSpacePanning(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const normalizeBounds = useCallback((position: Point, size: Size) => {
    const width = size.width;
    const height = size.height;
    const normX = width >= 0 ? position.x : position.x + width;
    const normY = height >= 0 ? position.y : position.y + height;
    return {
      x: normX,
      y: normY,
      width: Math.abs(width),
      height: Math.abs(height),
    };
  }, []);

  const getPathPoints = useCallback((element: DrawingElement) => {
    if (element.type !== "path") return undefined;
    const data = element.data as { points?: unknown };
    if (Array.isArray(data.points)) {
      return data.points as Point[];
    }
    return undefined;
  }, []);

  const getNormalizedShape = useCallback((start: Point, current: Point) => {
    const width = current.x - start.x;
    const height = current.y - start.y;
    return {
      position: {
        x: width >= 0 ? start.x : current.x,
        y: height >= 0 ? start.y : current.y,
      },
      size: {
        width: Math.abs(width),
        height: Math.abs(height),
      },
    };
  }, []);

  const getCurrentStrokeStyle = useCallback(() => {
    return {
      stroke: toolSettings.strokeColor,
      strokeWidth: toolSettings.strokeWidth,
      fill: "transparent",
      opacity: toolSettings.opacity,
      strokeStyle: toolSettings.strokeStyle,
    };
  }, [
    toolSettings.opacity,
    toolSettings.strokeColor,
    toolSettings.strokeStyle,
    toolSettings.strokeWidth,
  ]);

  const getElementBounds = useCallback(
    (element: DrawingElement) => {
      switch (element.type) {
        case "rectangle":
        case "circle":
        case "line":
        case "text":
        case "sticky-note":
          return normalizeBounds(element.position, element.size);
        case "path":
          const pathPoints = getPathPoints(element);
          if (pathPoints && pathPoints.length > 0) {
            const xs = pathPoints.map((p: Point) => p.x);
            const ys = pathPoints.map((p: Point) => p.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            return {
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY,
            };
          }
          return normalizeBounds(element.position, element.size);
        default:
          return null;
      }
    },
    [normalizeBounds, getPathPoints],
  );

  const distanceFromSegment = (p: Point, a: Point, b: Point) => {
    const A = p.x - a.x;
    const B = p.y - a.y;
    const C = b.x - a.x;
    const D = b.y - a.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx;
    let yy;

    if (param < 0) {
      xx = a.x;
      yy = a.y;
    } else if (param > 1) {
      xx = b.x;
      yy = b.y;
    } else {
      xx = a.x + param * C;
      yy = a.y + param * D;
    }

    const dx = p.x - xx;
    const dy = p.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const isPointInElement = useCallback(
    (element: DrawingElement, point: Point) => {
      if (element.type === "line") {
        const start = element.position;
        const end = {
          x: element.position.x + element.size.width,
          y: element.position.y + element.size.height,
        };
        return (
          distanceFromSegment(point, start, end) <=
          (element.style.strokeWidth || 2) + 4
        );
      }

      const bounds = getElementBounds(element);
      if (!bounds) return false;

      const withinBounds =
        point.x >= bounds.x &&
        point.x <= bounds.x + bounds.width &&
        point.y >= bounds.y &&
        point.y <= bounds.y + bounds.height;

      if (!withinBounds) return false;

      if (element.type === "circle") {
        const radiusX = bounds.width / 2 || 0.0001;
        const radiusY = bounds.height / 2 || 0.0001;
        const center = {
          x: bounds.x + radiusX,
          y: bounds.y + radiusY,
        };
        const normalizedX = (point.x - center.x) / radiusX;
        const normalizedY = (point.y - center.y) / radiusY;
        return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
      }

      return true;
    },
    [getElementBounds],
  );

  const findElementAtPoint = useCallback(
    (point: Point) => {
      for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        if (isPointInElement(element, point)) {
          return element;
        }
      }
      return null;
    },
    [elements, isPointInElement],
  );

  const rectsIntersect = (a: SelectionRect, b: SelectionRect) =>
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): Point => {
      if (!containerRef.current) return { x: screenX, y: screenY };

      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: (screenX - rect.left - viewport.x) / viewport.zoom,
        y: (screenY - rect.top - viewport.y) / viewport.zoom,
      };
    },
    [viewport],
  );

  // Handle mouse/touch events
  const buildDragSnapshots = useCallback(
    (ids: string[]) =>
      ids.reduce<
        Record<
          string,
          {
            position: Point;
            pathPoints?: Point[];
          }
        >
      >((acc, id) => {
        const el = elements.find((item) => item.id === id);
        if (el) {
          acc[id] = {
            position: { ...el.position },
            pathPoints: getPathPoints(el)?.map((p: Point) => ({ ...p })),
          };
        }
        return acc;
      }, {}),
    [elements, getPathPoints],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const point = screenToCanvas(e.clientX, e.clientY);

      const shouldPan = tool === "hand" || isSpacePanning || e.button === 1;
      if (shouldPan) {
        setIsPanning(true);
        panStartRef.current = { x: e.clientX, y: e.clientY };
        panViewportRef.current = viewport;
        return;
      }

      if (tool === "select") {
        const element = findElementAtPoint(point);
        if (element) {
          setIsMarqueeSelecting(false);
          setSelectionRect(null);
          selectionOriginRef.current = null;
          if (e.shiftKey) {
            if (selectedElements.includes(element.id)) {
              const updated = selectedElements.filter(
                (id) => id !== element.id,
              );
              selectElements(updated);
              dragStateRef.current = null;
              return;
            } else {
              const updated = [...selectedElements, element.id];
              selectElements(updated);
              dragStateRef.current = {
                origin: point,
                elementIds: updated,
                snapshots: buildDragSnapshots(updated),
              };
              return;
            }
          }

          const baseSelection = selectedElements.includes(element.id)
            ? selectedElements
            : [element.id];
          selectElements(baseSelection);

          dragStateRef.current = {
            origin: point,
            elementIds: baseSelection,
            snapshots: buildDragSnapshots(baseSelection),
          };
          return;
        }

        marqueeModeRef.current = e.shiftKey ? "add" : "replace";
        marqueeBaseSelectionRef.current = selectedElements;
        selectionOriginRef.current = point;
        setIsMarqueeSelecting(true);
        setSelectionRect({
          x: point.x,
          y: point.y,
          width: 0,
          height: 0,
        });
        if (!e.shiftKey) {
          selectElements([]);
        }
        return;
      }

      if (tool === "eraser") {
        const element = findElementAtPoint(point);
        if (element) {
          deleteElement(element.id);
        }
        return;
      }

      setStartPoint(point);
      setIsDrawing(true);

      if (tool === "pen") {
        setCurrentPath([point]);
      }
    },
    [
      buildDragSnapshots,
      deleteElement,
      elements,
      findElementAtPoint,
      screenToCanvas,
      selectElements,
      selectedElements,
      tool,
      viewport,
      isSpacePanning,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const point = screenToCanvas(e.clientX, e.clientY);

      // Send cursor position for collaboration
      onCursorMove?.(point);

      if (
        (tool === "hand" || isSpacePanning) &&
        isPanning &&
        panStartRef.current
      ) {
        const deltaX = e.clientX - panStartRef.current.x;
        const deltaY = e.clientY - panStartRef.current.y;
        const baseViewport = panViewportRef.current;
        setViewport({
          ...baseViewport,
          x: baseViewport.x + deltaX,
          y: baseViewport.y + deltaY,
        });
        return;
      }

      if (tool === "select") {
        if (dragStateRef.current) {
          const deltaX = point.x - dragStateRef.current.origin.x;
          const deltaY = point.y - dragStateRef.current.origin.y;
          dragStateRef.current.elementIds.forEach((id) => {
            const snapshot = dragStateRef.current?.snapshots[id];
            if (!snapshot) return;

            if (
              elements.find((el) => el.id === id)?.type === "path" &&
              snapshot.pathPoints
            ) {
              updateElement(id, {
                data: {
                  ...(elements.find((el) => el.id === id)?.data ?? {
                    points: [],
                  }),
                  points: snapshot.pathPoints.map((p) => ({
                    x: p.x + deltaX,
                    y: p.y + deltaY,
                  })),
                },
              });
            } else {
              updateElement(id, {
                position: {
                  x: snapshot.position.x + deltaX,
                  y: snapshot.position.y + deltaY,
                },
              });
            }
          });
        } else if (isMarqueeSelecting && selectionOriginRef.current) {
          const rect = normalizeBounds(selectionOriginRef.current, {
            width: point.x - selectionOriginRef.current.x,
            height: point.y - selectionOriginRef.current.y,
          });
          setSelectionRect(rect);
          const ids = elements
            .filter((element) => {
              const bounds = getElementBounds(element);
              if (!bounds) return false;
              return rectsIntersect(rect, bounds);
            })
            .map((element) => element.id);

          if (marqueeModeRef.current === "add") {
            const base = marqueeBaseSelectionRef.current;
            const merged = Array.from(new Set([...base, ...ids]));
            selectElements(merged);
          } else {
            selectElements(ids);
          }
        }
        return;
      }

      if (!isDrawing || !startPoint) return;

      if (tool === "pen") {
        setCurrentPath((prev) => [...prev, point]);
      } else if (["rectangle", "circle", "line"].includes(tool)) {
        // Create temporary element for preview
        const id = `temp-${Date.now()}`;
        const baseElement: Omit<DrawingElement, "type"> = {
          id,
          position: startPoint,
          size: {
            width: point.x - startPoint.x,
            height: point.y - startPoint.y,
          },
          rotation: 0,
          style: getCurrentStrokeStyle(),
          data: {},
          createdBy: state.currentUser?.id || "anonymous",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        if (tool === "line") {
          setTempElement({ ...baseElement, type: "line" });
        } else {
          const { position, size } = getNormalizedShape(startPoint, point);
          setTempElement({
            ...baseElement,
            type: tool as "rectangle" | "circle",
            position,
            size,
          });
        }
      }
    },
    [
      elements,
      getElementBounds,
      isDrawing,
      isMarqueeSelecting,
      isPanning,
      getNormalizedShape,
      getCurrentStrokeStyle,
      isSpacePanning,
      normalizeBounds,
      onCursorMove,
      screenToCanvas,
      selectElements,
      setViewport,
      startPoint,
      state.currentUser?.id,
      tool,
      updateElement,
    ],
  );

  const handlePointerUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      return;
    }

    if (tool === "select") {
      if (dragStateRef.current) {
        dragStateRef.current = null;
      }
      if (isMarqueeSelecting) {
        setIsMarqueeSelecting(false);
        setSelectionRect(null);
        selectionOriginRef.current = null;
      }
      return;
    }

    if (!startPoint) return;

    if (tool === "pen" && currentPath.length > 1) {
      const element: DrawingElement = {
        id: `path-${Date.now()}`,
        type: "path",
        position: { x: 0, y: 0 },
        size: { width: 0, height: 0 },
        rotation: 0,
        style: getCurrentStrokeStyle(),
        data: { points: currentPath, smooth: true },
        createdBy: state.currentUser?.id || "anonymous",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addElement(element);
    } else if (["text", "sticky-note"].includes(tool)) {
      if (tool === "text") {
        const element: DrawingElement = {
          id: `text-${Date.now()}`,
          type: "text",
          position: startPoint,
          size: {
            width: DEFAULT_TEXT_STYLE.width,
            height: DEFAULT_TEXT_STYLE.height,
          },
          rotation: 0,
          style: {
            stroke: DEFAULT_TEXT_STYLE.color,
            strokeWidth: 1,
            fill: DEFAULT_TEXT_STYLE.color,
            opacity: 1,
          },
          data: {
            text: "New text",
            fontSize: DEFAULT_TEXT_STYLE.fontSize,
            fontFamily: DEFAULT_TEXT_STYLE.fontFamily,
            fontWeight: DEFAULT_TEXT_STYLE.fontWeight,
          },
          createdBy: state.currentUser?.id || "anonymous",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        addElement(element);
      } else {
        const element: DrawingElement = {
          id: `sticky-${Date.now()}`,
          type: "sticky-note",
          position: startPoint,
          size: {
            width: DEFAULT_STICKY_OPTIONS.width,
            height: DEFAULT_STICKY_OPTIONS.height,
          },
          rotation: 0,
          style: {
            stroke: DEFAULT_STICKY_OPTIONS.color,
            strokeWidth: 2,
            fill: DEFAULT_STICKY_OPTIONS.color,
            opacity: 1,
          },
          data: {
            text: "Sticky note",
            color: DEFAULT_STICKY_OPTIONS.color,
            textColor: DEFAULT_STICKY_OPTIONS.textColor,
          },
          createdBy: state.currentUser?.id || "anonymous",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        addElement(element);
      }
    } else if (tempElement) {
      addElement(tempElement);
    }

    // Reset state
    setIsDrawing(false);
    setCurrentPath([]);
    setStartPoint(null);
    setTempElement(null);
  }, [
    addElement,
    currentPath,
    isMarqueeSelecting,
    isPanning,
    startPoint,
    state.currentUser?.id,
    tempElement,
    tool,
    getCurrentStrokeStyle,
  ]);

  // Render elements on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth * window.devicePixelRatio;
      canvas.height = container.clientHeight * window.devicePixelRatio;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // Apply viewport transform
    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    // Clear canvas
    ctx.clearRect(
      -viewport.x / viewport.zoom,
      -viewport.y / viewport.zoom,
      canvas.width / (viewport.zoom * window.devicePixelRatio),
      canvas.height / (viewport.zoom * window.devicePixelRatio),
    );

    // Render all elements
    [...elements, ...(tempElement ? [tempElement] : [])].forEach((element) => {
      ctx.save();

      // Apply element transform
      if (element.rotation !== 0) {
        ctx.translate(
          element.position.x + element.size.width / 2,
          element.position.y + element.size.height / 2,
        );
        ctx.rotate(element.rotation);
        ctx.translate(
          -(element.position.x + element.size.width / 2),
          -(element.position.y + element.size.height / 2),
        );
      }

      // Set styles
      ctx.strokeStyle = element.style.stroke;
      ctx.lineWidth = element.style.strokeWidth;
      ctx.fillStyle = element.style.fill;
      ctx.globalAlpha = element.style.opacity;
      const dashPattern =
        DASH_PATTERNS[element.style.strokeStyle as StrokeStyle] ||
        DASH_PATTERNS.solid;
      ctx.setLineDash(dashPattern);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Render based on type
      switch (element.type) {
        case "path":
          const pathPoints = getPathPoints(element);
          if (pathPoints && pathPoints.length > 1) {
            ctx.beginPath();
            ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
            for (let i = 1; i < pathPoints.length; i++) {
              ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
            }
            ctx.stroke();
          }
          break;

        case "rectangle":
          ctx.beginPath();
          ctx.rect(
            element.position.x,
            element.position.y,
            element.size.width,
            element.size.height,
          );
          if (element.style.fill !== "transparent") ctx.fill();
          ctx.stroke();
          break;

        case "circle":
          const circleBounds = getElementBounds(element);
          if (circleBounds) {
            const radiusX = Math.max(circleBounds.width / 2, 0.5);
            const radiusY = Math.max(circleBounds.height / 2, 0.5);
            ctx.beginPath();
            ctx.ellipse(
              circleBounds.x + radiusX,
              circleBounds.y + radiusY,
              radiusX,
              radiusY,
              0,
              0,
              2 * Math.PI,
            );
            if (element.style.fill !== "transparent") ctx.fill();
            ctx.stroke();
          }
          break;

        case "line":
          ctx.beginPath();
          ctx.moveTo(element.position.x, element.position.y);
          ctx.lineTo(
            element.position.x + element.size.width,
            element.position.y + element.size.height,
          );
          ctx.stroke();
          break;

        case "text":
          ctx.fillStyle = element.style.fill || DEFAULT_TEXT_STYLE.color;
          ctx.font = `${element.data.fontWeight || DEFAULT_TEXT_STYLE.fontWeight} ${element.data.fontSize || DEFAULT_TEXT_STYLE.fontSize}px ${element.data.fontFamily || DEFAULT_TEXT_STYLE.fontFamily}`;
          ctx.textBaseline = "top";
          ctx.fillText(
            (element.data.text as string) || "New text",
            element.position.x,
            element.position.y,
          );
          break;

        case "sticky-note":
          ctx.fillStyle =
            (element.data.color as string) || DEFAULT_STICKY_OPTIONS.color;
          ctx.strokeStyle =
            (element.data.color as string) || DEFAULT_STICKY_OPTIONS.color;
          ctx.beginPath();
          ctx.rect(
            element.position.x,
            element.position.y,
            element.size.width,
            element.size.height,
          );
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle =
            (element.data.textColor as string) ||
            DEFAULT_STICKY_OPTIONS.textColor;
          ctx.font = "600 16px Inter";
          ctx.textBaseline = "top";
          ctx.fillText(
            (element.data.text as string) || "Sticky note",
            element.position.x + 12,
            element.position.y + 12,
          );
          break;
      }

      // Highlight selected elements
      if (selectedElements.includes(element.id)) {
        ctx.save();
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        const bounds = getElementBounds(element);
        if (bounds) {
          ctx.strokeRect(
            bounds.x - 4,
            bounds.y - 4,
            bounds.width + 8,
            bounds.height + 8,
          );
        }
        ctx.restore();
      }

      ctx.restore();
    });

    // Render current drawing path
    if (tool === "pen" && currentPath.length > 1) {
      const previewStyle = getCurrentStrokeStyle();
      ctx.save();
      ctx.strokeStyle = previewStyle.stroke;
      ctx.lineWidth = previewStyle.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = previewStyle.opacity;
      ctx.setLineDash(
        DASH_PATTERNS[previewStyle.strokeStyle ?? "solid"] ||
          DASH_PATTERNS.solid,
      );

      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }, [
    elements,
    tempElement,
    currentPath,
    tool,
    viewport,
    selectedElements,
    getElementBounds,
    getCurrentStrokeStyle,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full overflow-hidden bg-canvas canvas-grid cursor-crosshair",
        (tool === "hand" || isSpacePanning) && "cursor-grab",
        tool === "select" && "cursor-default",
        className,
      )}
      style={{
        backgroundPosition: `${-viewport.x}px ${-viewport.y}px`,
        backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: "none" }}
      />

      {tool === "select" && selectionRect && (
        <div
          className="absolute border border-primary/60 bg-primary/10 pointer-events-none"
          style={{
            left: selectionRect.x * viewport.zoom + viewport.x,
            top: selectionRect.y * viewport.zoom + viewport.y,
            width: Math.max(selectionRect.width * viewport.zoom, 1),
            height: Math.max(selectionRect.height * viewport.zoom, 1),
          }}
        />
      )}

      {/* Presence cursors for collaboration */}
      <PresenceCursors />

      {/* Loading state overlay */}
      {!state.isConnected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-canvas/80 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="floating-panel p-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">
                Connecting to whiteboard...
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
