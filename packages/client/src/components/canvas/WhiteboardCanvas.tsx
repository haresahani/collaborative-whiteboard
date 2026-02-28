import React, { useRef, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useWhiteboard } from "@/contexts/WhiteboardContext";
import SelectionBox from "@/components/canvas/SelectionBox";
import { degToRad, rotatePoint } from "@/lib/transform";
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

const DASH_PATTERNS: Record<StrokeStyle, number[]> = {
  solid: [],
  dashed: [12, 6],
  dotted: [3, 6],
};

interface WhiteboardCanvasProps {
  className?: string;
  onCursorMove?: (point: Point) => void;
  /** Called when an element is added (for real-time sync) */
  onElementAdded?: (element: DrawingElement) => void;
  /** Called when element(s) are deleted (for real-time sync) */
  onElementDeleted?: (id: string, elementType: DrawingElement["type"]) => void;
  /** Called during pen draw for live stroke preview */
  onStrokeChunk?: (strokeId: string, points: Array<[number, number]>) => void;
  /** Called when element is transformed (move/resize/rotate) */
  onElementUpdated?: (
    id: string,
    elementType: DrawingElement["type"],
    updates: Partial<DrawingElement>,
  ) => void;
}

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MARQUEE_THRESHOLD = 5;

export function WhiteboardCanvas({
  className,
  onCursorMove,
  onElementAdded,
  onElementDeleted,
  onStrokeChunk,
  onElementUpdated,
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

  const {
    elements,
    tool,
    viewport,
    selectedElements,
    toolSettings,
    currentUser,
  } = state;

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [tempElement, setTempElement] = useState<DrawingElement | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePanning, setIsSpacePanning] = useState(false);

  // Eraser-specific state
  const [eraserPath, setEraserPath] = useState<Point[]>([]);
  const [erasedElementIds, setErasedElementIds] = useState<Set<string>>(
    new Set(),
  );

  const panStartRef = useRef<Point | null>(null);
  const panViewportRef = useRef(viewport);

  const dragStateRef = useRef<{
    origin: Point;
    elementIds: string[];
    snapshots: Record<string, { position: Point; pathPoints?: Point[] }>;
  } | null>(null);

  const selectionOriginRef = useRef<Point | null>(null);
  const marqueeModeRef = useRef<"add" | "replace">("replace");
  const currentStrokeIdRef = useRef<string | null>(null);
  const marqueeBaseSelectionRef = useRef<string[]>([]);

  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(
    null,
  );
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);

  useEffect(() => {
    if (!isPanning) {
      panViewportRef.current = viewport;
    }
  }, [viewport, isPanning]);

  // Helpers

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
          return normalizeBounds(element.position, element.size);
        case "path":
          const pathPoints = getPathPoints(element);
          if (pathPoints && pathPoints.length > 0) {
            const xs = pathPoints.map((p) => p.x);
            const ys = pathPoints.map((p) => p.y);
            return {
              x: Math.min(...xs),
              y: Math.min(...ys),
              width: Math.max(...xs) - Math.min(...xs),
              height: Math.max(...ys) - Math.min(...ys),
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
    let xx, yy;
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

  const distanceBetweenSegments = (a: Point, b: Point, c: Point, d: Point) => {
    const d1 = distanceFromSegment(a, c, d);
    const d2 = distanceFromSegment(b, c, d);
    const d3 = distanceFromSegment(c, a, b);
    const d4 = distanceFromSegment(d, a, b);
    return Math.min(d1, d2, d3, d4);
  };

  const isPointInElement = useCallback(
    (element: DrawingElement, point: Point) => {
      const strokeWidth = element.style.strokeWidth || 2;
      const hitPadding = strokeWidth + 4;

      const center = {
        x: element.position.x + element.size.width / 2,
        y: element.position.y + element.size.height / 2,
      };
      const rotRad = degToRad(element.rotation || 0);
      const testPoint = element.rotation
        ? rotatePoint(point, center, -rotRad)
        : point;

      if (element.type === "path") {
        const pathPoints = getPathPoints(element);
        if (!pathPoints || pathPoints.length < 2) return false;
        for (let i = 0; i < pathPoints.length - 1; i++) {
          const a = pathPoints[i];
          const b = pathPoints[i + 1];
          if (distanceFromSegment(testPoint, a, b) <= hitPadding) return true;
        }
        return false;
      }

      if (element.type === "line") {
        const localPoint = testPoint;
        const start = rotatePoint(element.position, center, -rotRad);
        const end = rotatePoint(
          {
            x: element.position.x + element.size.width,
            y: element.position.y + element.size.height,
          },
          center,
          -rotRad,
        );
        return distanceFromSegment(localPoint, start, end) <= hitPadding;
      }

      const bounds = getElementBounds(element);
      if (!bounds || bounds.width <= 0 || bounds.height <= 0) return false;

      const isFilled =
        element.style.fill && element.style.fill !== "transparent";
      const withinBounds =
        testPoint.x >= bounds.x &&
        testPoint.x <= bounds.x + bounds.width &&
        testPoint.y >= bounds.y &&
        testPoint.y <= bounds.y + bounds.height;

      if (isFilled) return withinBounds;

      const distToLeft = Math.abs(testPoint.x - bounds.x);
      const distToRight = Math.abs(testPoint.x - (bounds.x + bounds.width));
      const distToTop = Math.abs(testPoint.y - bounds.y);
      const distToBottom = Math.abs(testPoint.y - (bounds.y + bounds.height));

      const minDist = Math.min(
        distToLeft,
        distToRight,
        distToTop,
        distToBottom,
      );
      if (minDist <= hitPadding) return true;

      if (element.type === "circle") {
        const radiusX = bounds.width / 2;
        const radiusY = bounds.height / 2;
        const cx = bounds.x + radiusX;
        const cy = bounds.y + radiusY;
        const dx = testPoint.x - cx;
        const dy = testPoint.y - cy;
        const distanceFromCenter = Math.sqrt(
          (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY),
        );
        const outerRadius = 1;
        const innerRadius = 1 - strokeWidth / Math.max(radiusX, radiusY);

        if (
          distanceFromCenter >= innerRadius &&
          distanceFromCenter <= outerRadius + 0.05
        ) {
          return true;
        }
      }

      return false;
    },
    [getElementBounds, getPathPoints],
  );

  const findElementAtPoint = useCallback(
    (point: Point) => {
      for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        if (isPointInElement(element, point)) return element;
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

  const elementIntersectsLine = useCallback(
    (
      element: DrawingElement,
      lineStart: Point,
      lineEnd: Point,
      padding: number,
    ): boolean => {
      const bounds = getElementBounds(element);
      if (!bounds) return false;

      if (["rectangle", "text"].includes(element.type)) {
        const left = bounds.x;
        const right = bounds.x + bounds.width;
        const top = bounds.y;
        const bottom = bounds.y + bounds.height;

        const sides = [
          [
            { x: left, y: top },
            { x: right, y: top },
          ],
          [
            { x: right, y: top },
            { x: right, y: bottom },
          ],
          [
            { x: right, y: bottom },
            { x: left, y: bottom },
          ],
          [
            { x: left, y: bottom },
            { x: left, y: top },
          ],
        ];

        for (const [a, b] of sides) {
          if (distanceBetweenSegments(lineStart, lineEnd, a, b) <= padding) {
            return true;
          }
        }
        return false;
      }

      if (element.type === "circle") {
        const cx = bounds.x + bounds.width / 2;
        const cy = bounds.y + bounds.height / 2;
        const radius = Math.min(bounds.width, bounds.height) / 2;

        const A = lineEnd.y - lineStart.y;
        const B = lineStart.x - lineEnd.x;
        const C = lineEnd.x * lineStart.y - lineStart.x * lineEnd.y;
        const dist = Math.abs(A * cx + B * cy + C) / Math.hypot(A, B);

        if (dist <= radius + padding) {
          const t =
            ((cx - lineStart.x) * (lineEnd.x - lineStart.x) +
              (cy - lineStart.y) * (lineEnd.y - lineStart.y)) /
            ((lineEnd.x - lineStart.x) ** 2 + (lineEnd.y - lineStart.y) ** 2);

          if (t >= 0 && t <= 1) return true;
        }
        return false;
      }

      if (element.type === "line") {
        const start = element.position;
        const end = {
          x: element.position.x + element.size.width,
          y: element.position.y + element.size.height,
        };
        return (
          distanceBetweenSegments(lineStart, lineEnd, start, end) <= padding
        );
      }

      return false;
    },
    [getElementBounds],
  );

  const isElementIntersectedByEraser = useCallback(
    (
      element: DrawingElement,
      eraserPoints: Point[],
      eraserThickness: number,
    ): boolean => {
      if (element.type === "path") {
        const points = getPathPoints(element);
        if (!points || points.length < 2) return false;

        const hitPadding = eraserThickness + (element.style.strokeWidth || 2);

        for (let i = 0; i < points.length - 1; i++) {
          for (let j = 0; j < eraserPoints.length - 1; j++) {
            if (
              distanceBetweenSegments(
                points[i],
                points[i + 1],
                eraserPoints[j],
                eraserPoints[j + 1],
              ) <= hitPadding
            ) {
              return true;
            }
          }
        }
        return false;
      }

      const hitPadding = eraserThickness + (element.style.strokeWidth || 2);

      const bounds = getElementBounds(element);
      if (!bounds) return false;

      for (let j = 0; j < eraserPoints.length - 1; j++) {
        const start = eraserPoints[j];
        const end = eraserPoints[j + 1];

        const eraserBB = {
          x: Math.min(start.x, end.x) - hitPadding,
          y: Math.min(start.y, end.y) - hitPadding,
          width: Math.abs(start.x - end.x) + hitPadding * 2,
          height: Math.abs(start.y - end.y) + hitPadding * 2,
        };

        if (!rectsIntersect(eraserBB, bounds)) continue;

        if (elementIntersectsLine(element, start, end, hitPadding)) {
          return true;
        }
      }

      return false;
    },
    [getPathPoints, getElementBounds, elementIntersectsLine],
  );

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

  const buildDragSnapshots = useCallback(
    (ids: string[]) =>
      ids.reduce<Record<string, { position: Point; pathPoints?: Point[] }>>(
        (acc, id) => {
          const el = elements.find((item) => item.id === id);
          if (el) {
            acc[id] = {
              position: { ...el.position },
              pathPoints: getPathPoints(el)?.map((p) => ({ ...p })),
            };
          }
          return acc;
        },
        {},
      ),
    [elements, getPathPoints],
  );

  // Pointer handlers

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
          if (e.shiftKey) {
            if (selectedElements.includes(element.id)) {
              selectElements(
                selectedElements.filter((id) => id !== element.id),
              );
            } else {
              selectElements([...selectedElements, element.id]);
            }
            dragStateRef.current = null;
          } else {
            if (!selectedElements.includes(element.id)) {
              selectElements([element.id]);
            }
            dragStateRef.current = {
              origin: point,
              elementIds: selectedElements,
              snapshots: buildDragSnapshots(selectedElements),
            };
          }
        } else {
          if (!e.shiftKey) {
            selectElements([]);
          }
          selectionOriginRef.current = point;
          marqueeModeRef.current = e.shiftKey ? "add" : "replace";
          marqueeBaseSelectionRef.current = e.shiftKey
            ? [...selectedElements]
            : [];
          dragStateRef.current = null;
        }

        setIsMarqueeSelecting(false);
        setSelectionRect(null);
        return;
      }

      if (tool === "eraser") {
        setIsDrawing(true);
        setStartPoint(point);
        setEraserPath([point]);
        setErasedElementIds(new Set());
        return;
      }

      if (tool === "text") {
        setStartPoint(point);
        setIsDrawing(true);
        return;
      }

      setStartPoint(point);
      setIsDrawing(true);
      if (tool === "pen") {
        currentStrokeIdRef.current = `path-${Date.now()}`;
        setCurrentPath([point]);
      }
    },
    [
      screenToCanvas,
      tool,
      isSpacePanning,
      findElementAtPoint,
      selectedElements,
      selectElements,
      buildDragSnapshots,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const point = screenToCanvas(e.clientX, e.clientY);
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
            const el = elements.find((e) => e.id === id);

            if (el?.type === "path" && snapshot.pathPoints) {
              const newPoints = snapshot.pathPoints.map((p) => ({
                x: p.x + deltaX,
                y: p.y + deltaY,
              }));
              const updates = {
                data: { ...el.data, points: newPoints },
              };
              updateElement(id, updates);
              onElementUpdated?.(id, "path", updates);
            } else if (snapshot.position) {
              const updates = {
                position: {
                  x: snapshot.position.x + deltaX,
                  y: snapshot.position.y + deltaY,
                },
              };
              updateElement(id, updates);
              onElementUpdated?.(id, el?.type ?? "rectangle", updates);
            }
          });
        } else if (selectionOriginRef.current) {
          const deltaX = point.x - selectionOriginRef.current.x;
          const deltaY = point.y - selectionOriginRef.current.y;
          const dist = Math.hypot(deltaX, deltaY);

          if (dist > MARQUEE_THRESHOLD) {
            if (!isMarqueeSelecting) setIsMarqueeSelecting(true);

            const rect = {
              x: Math.min(selectionOriginRef.current.x, point.x),
              y: Math.min(selectionOriginRef.current.y, point.y),
              width: Math.abs(deltaX),
              height: Math.abs(deltaY),
            };
            setSelectionRect(rect);

            const ids = elements
              .filter((element) => {
                const bounds = getElementBounds(element);
                if (!bounds) return false;
                return rectsIntersect(rect, bounds);
              })
              .map((el) => el.id);

            let newSelected;
            if (marqueeModeRef.current === "add") {
              newSelected = Array.from(
                new Set([...marqueeBaseSelectionRef.current, ...ids]),
              );
            } else {
              newSelected = ids;
            }
            selectElements(newSelected);
          }
        }
        return;
      }

      if (tool === "eraser" && isDrawing && startPoint) {
        const point = screenToCanvas(e.clientX, e.clientY);

        setEraserPath((prev) => {
          if (prev.length === 0) return [point];

          const last = prev[prev.length - 1];
          const dist = Math.hypot(point.x - last.x, point.y - last.y);

          if (dist > 3) {
            return [...prev, point];
          }
          return prev;
        });

        const newErased = new Set(erasedElementIds);

        elements.forEach((element) => {
          if (newErased.has(element.id)) return;

          if (
            isElementIntersectedByEraser(
              element,
              eraserPath,
              toolSettings.strokeWidth * 2,
            )
          ) {
            newErased.add(element.id);
          }
        });

        setErasedElementIds(newErased);
        return;
      }

      if (!isDrawing || !startPoint) return;

      if (tool === "pen") {
        setCurrentPath((prev) => {
          const next = [...prev, point];
          if (currentStrokeIdRef.current && next.length >= 2) {
            const coords = next.map((p) => [p.x, p.y] as [number, number]);
            onStrokeChunk?.(currentStrokeIdRef.current, coords);
          }
          return next;
        });
      } else if (["rectangle", "circle", "line"].includes(tool)) {
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
          createdBy: currentUser?.id || "anonymous",
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
      screenToCanvas,
      onCursorMove,
      tool,
      isSpacePanning,
      isPanning,
      panStartRef,
      panViewportRef,
      setViewport,
      dragStateRef,
      elements,
      updateElement,
      selectionOriginRef,
      isMarqueeSelecting,
      getElementBounds,
      rectsIntersect,
      marqueeModeRef,
      marqueeBaseSelectionRef,
      selectElements,
      isDrawing,
      startPoint,
      getCurrentStrokeStyle,
      getNormalizedShape,
      currentUser?.id,
      eraserPath,
      erasedElementIds,
      isElementIntersectedByEraser,
      toolSettings.strokeWidth,
      onStrokeChunk,
      onElementUpdated,
    ],
  );

  const handlePointerUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      return;
    }

    if (tool === "select") {
      dragStateRef.current = null;
      if (isMarqueeSelecting) {
        setIsMarqueeSelecting(false);
        setSelectionRect(null);
        selectionOriginRef.current = null;
      } else if (selectionOriginRef.current) {
        selectionOriginRef.current = null;
      }
      return;
    }

    if (tool === "eraser" && isDrawing) {
      erasedElementIds.forEach((id) => {
        const el = elements.find((e) => e.id === id);
        if (el) onElementDeleted?.(id, el.type);
        deleteElement(id);
      });

      setIsDrawing(false);
      setStartPoint(null);
      setEraserPath([]);
      setErasedElementIds(new Set());
      return;
    }

    if (!startPoint) return;

    if (tool === "pen" && currentPath.length > 1) {
      const strokeId = currentStrokeIdRef.current ?? `path-${Date.now()}`;
      currentStrokeIdRef.current = null;
      const element: DrawingElement = {
        id: strokeId,
        type: "path",
        position: { x: 0, y: 0 },
        size: { width: 0, height: 0 },
        rotation: 0,
        style: getCurrentStrokeStyle(),
        data: { points: currentPath, smooth: true },
        createdBy: currentUser?.id || "anonymous",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addElement(element);
      onElementAdded?.(element);
    } else if (tool === "text") {
      const element: DrawingElement = {
        position: startPoint,
        rotation: 0,
        id: `text-${Date.now()}`,
        type: "text",
        size: {
          width: DEFAULT_TEXT_STYLE.width,
          height: DEFAULT_TEXT_STYLE.height,
        },
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
        createdBy: currentUser?.id || "anonymous",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addElement(element);
      onElementAdded?.(element);
    } else if (tempElement) {
      addElement(tempElement);
      onElementAdded?.(tempElement);
    }

    setIsDrawing(false);
    setCurrentPath([]);
    setStartPoint(null);
    setTempElement(null);
  }, [
    isPanning,
    tool,
    isMarqueeSelecting,
    startPoint,
    currentPath,
    tempElement,
    getCurrentStrokeStyle,
    addElement,
    currentUser?.id,
    isDrawing,
    erasedElementIds,
    deleteElement,
    elements,
    onElementAdded,
    onElementDeleted,
  ]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = containerRef.current;
    if (container) {
      canvas.width = container.clientWidth * window.devicePixelRatio;
      canvas.height = container.clientHeight * window.devicePixelRatio;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    ctx.clearRect(
      -viewport.x / viewport.zoom,
      -viewport.y / viewport.zoom,
      canvas.width / (viewport.zoom * window.devicePixelRatio),
      canvas.height / (viewport.zoom * window.devicePixelRatio),
    );

    [...elements, ...(tempElement ? [tempElement] : [])].forEach((element) => {
      ctx.save();

      if (element.rotation !== 0) {
        ctx.translate(
          element.position.x + element.size.width / 2,
          element.position.y + element.size.height / 2,
        );
        ctx.rotate(degToRad(element.rotation));
        ctx.translate(
          -(element.position.x + element.size.width / 2),
          -(element.position.y + element.size.height / 2),
        );
      }

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
          ctx.font = `${element.data.fontWeight || DEFAULT_TEXT_STYLE.fontWeight} ${
            element.data.fontSize || DEFAULT_TEXT_STYLE.fontSize
          }px ${element.data.fontFamily || DEFAULT_TEXT_STYLE.fontFamily}`;
          ctx.textBaseline = "top";
          ctx.fillText(
            (element.data.text as string) || "New text",
            element.position.x,
            element.position.y,
          );
          break;
      }

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

    if (tool === "eraser" && eraserPath.length > 1) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
      ctx.lineWidth = toolSettings.strokeWidth * 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = 0.8;
      ctx.setLineDash([5, 5]);

      ctx.beginPath();
      ctx.moveTo(eraserPath[0].x, eraserPath[0].y);
      for (let i = 1; i < eraserPath.length; i++) {
        ctx.lineTo(eraserPath[i].x, eraserPath[i].y);
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
    getPathPoints,
    getCurrentStrokeStyle,
    eraserPath,
    toolSettings.strokeWidth,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full overflow-hidden bg-canvas canvas-grid cursor-crosshair",
        (tool === "hand" || isSpacePanning) && "cursor-grab",
        tool === "select" && "cursor-default",
        tool === "eraser" && "cursor-eraser",
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

      {selectedElements.map((id) => {
        const el = elements.find((e) => e.id === id);
        if (!el) return null;
        return (
          <SelectionBox
            key={"sel-" + el.id}
            element={el}
            viewport={viewport}
            screenToCanvas={screenToCanvas}
            onTransform={(updates) => {
              updateElement(el.id, updates);
              onElementUpdated?.(el.id, el.type, updates);
            }}
          />
        );
      })}

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

      <PresenceCursors />

      {!state.isConnected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-2 left-2 px-3 py-1.5 rounded-lg bg-muted/90 text-muted-foreground text-xs font-medium"
        >
          Offline · Changes saved locally
        </motion.div>
      )}
    </div>
  );
}
