import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type CanvasPoint = {
  x: number;
  y: number;
};

export type EraserTrailPoint = CanvasPoint & {
  id: number;
  createdAt: number;
};

export const ERASER_TRAIL_LIFETIME_MS = 180;
const ERASER_TRAIL_MAX_POINTS = 18;
const ERASER_TRAIL_MIN_DISTANCE = 5;

export function useEraserTrail(isActive: boolean) {
  const trailIdRef = useRef(0);
  const trailFrameRef = useRef<number | null>(null);
  const trailPointsRef = useRef<EraserTrailPoint[]>([]);
  const lastTrailPointRef = useRef<CanvasPoint | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [head, setHead] = useState<CanvasPoint | null>(null);
  const [trail, setTrail] = useState<EraserTrailPoint[]>([]);
  const [clock, setClock] = useState(0);

  useEffect(() => {
    if (!isActive || (!isDragging && trailPointsRef.current.length === 0)) {
      return undefined;
    }

    const tick = () => {
      const now = performance.now();
      const nextTrail = trailPointsRef.current.filter(
        (point) => now - point.createdAt < ERASER_TRAIL_LIFETIME_MS,
      );

      trailPointsRef.current = nextTrail;
      setClock(now);
      setTrail(nextTrail);

      if (isDragging || nextTrail.length > 0) {
        trailFrameRef.current = requestAnimationFrame(tick);
      } else {
        trailFrameRef.current = null;
      }
    };

    trailFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (trailFrameRef.current !== null) {
        cancelAnimationFrame(trailFrameRef.current);
        trailFrameRef.current = null;
      }
    };
  }, [isActive, isDragging]);

  const appendPoint = useCallback(
    (point: CanvasPoint, force = false) => {
      if (!isActive) return;

      const lastPoint = lastTrailPointRef.current;

      if (!force && lastPoint) {
        const distance = Math.hypot(
          point.x - lastPoint.x,
          point.y - lastPoint.y,
        );
        if (distance < ERASER_TRAIL_MIN_DISTANCE) {
          setHead(point);
          return;
        }
      }

      const nextPoint: EraserTrailPoint = {
        id: trailIdRef.current++,
        x: point.x,
        y: point.y,
        createdAt: performance.now(),
      };

      const nextTrail = [...trailPointsRef.current, nextPoint].slice(
        -ERASER_TRAIL_MAX_POINTS,
      );

      trailPointsRef.current = nextTrail;
      lastTrailPointRef.current = point;
      setClock(nextPoint.createdAt);
      setHead(point);
      setTrail(nextTrail);
    },
    [isActive],
  );

  const start = useCallback(
    (point: CanvasPoint) => {
      if (!isActive) return;
      setIsDragging(true);
      appendPoint(point, true);
    },
    [appendPoint, isActive],
  );

  const move = useCallback(
    (point: CanvasPoint) => {
      if (!isActive) return;
      appendPoint(point);
    },
    [appendPoint, isActive],
  );

  const stop = useCallback(() => {
    setIsDragging(false);
    setHead(null);
    lastTrailPointRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setIsDragging(false);
    setHead(null);
    setClock(0);
    setTrail([]);
    trailPointsRef.current = [];
    lastTrailPointRef.current = null;

    if (trailFrameRef.current !== null) {
      cancelAnimationFrame(trailFrameRef.current);
      trailFrameRef.current = null;
    }
  }, []);

  return useMemo(
    () => ({
      isDragging,
      head,
      trail,
      clock,
      start,
      move,
      stop,
      reset,
    }),
    [clock, head, isDragging, move, reset, start, stop, trail],
  );
}
