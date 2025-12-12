import React, { useRef, useEffect, useState } from "react";
import type { DrawingElement, Point } from "@/types/whiteboard";
import { degToRad, radToDeg, rotatePoint } from "@/lib/transform"; // you can implement tiny helpers if missing

type HandleName = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

const HANDLE_SIZE_PX = 12;
const ROTATE_HANDLE_DIST_PX = 28;

function worldToScreen(
  p: Point,
  viewport: { x: number; y: number; zoom: number },
) {
  return {
    x: p.x * viewport.zoom + viewport.x,
    y: p.y * viewport.zoom + viewport.y,
  };
}

export default function SelectionBox({
  element,
  viewport,
  screenToCanvas,
  onTransform,
  minWidth = 8,
  minHeight = 8,
  snapRotationDeg = 15,
}: {
  element: DrawingElement;
  viewport: { x: number; y: number; zoom: number };
  screenToCanvas: (sx: number, sy: number) => Point;
  onTransform: (updates: {
    position?: Point;
    size?: { width: number; height: number };
    rotation?: number;
  }) => void;
  minWidth?: number;
  minHeight?: number;
  snapRotationDeg?: number | null;
}) {
  // Local visual state so handles move instantly
  const [localPos, setLocalPos] = useState<Point>(element.position);
  const [localSize, setLocalSize] = useState<{ width: number; height: number }>(
    element.size,
  );
  const [localRotation, setLocalRotation] = useState<number>(
    element.rotation || 0,
  );

  // Keep local in sync when external prop changes (e.g., store update from other collaborators)
  useEffect(() => {
    setLocalPos(element.position);
    setLocalSize(element.size);
    setLocalRotation(element.rotation || 0);
  }, [
    element.position.x,
    element.position.y,
    element.size.width,
    element.size.height,
    element.rotation,
    element.id,
  ]);

  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{
    position?: Point;
    size?: { width: number; height: number };
    rotation?: number;
  } | null>(null);

  // throttle commits via RAF
  const commitPending = () => {
    if (pendingRef.current) {
      onTransform(pendingRef.current);
      pendingRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };
  const scheduleCommit = () => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      commitPending();
    });
  };

  // Drag state
  const dragRef = useRef<null | {
    mode: "resize" | "rotate";
    handle?: HandleName;
    startPointerScreen: Point;
    startLocal: {
      position: Point;
      size: { width: number; height: number };
      rotation: number;
    };
  }>(null);

  // helpers for center and handle positions (in world coords)
  const centerWorld = {
    x: localPos.x + localSize.width / 2,
    y: localPos.y + localSize.height / 2,
  };

  const localHandlesWorld: Record<HandleName, Point> = {
    nw: { x: localPos.x, y: localPos.y },
    n: { x: localPos.x + localSize.width / 2, y: localPos.y },
    ne: { x: localPos.x + localSize.width, y: localPos.y },
    e: {
      x: localPos.x + localSize.width,
      y: localPos.y + localSize.height / 2,
    },
    se: { x: localPos.x + localSize.width, y: localPos.y + localSize.height },
    s: {
      x: localPos.x + localSize.width / 2,
      y: localPos.y + localSize.height,
    },
    sw: { x: localPos.x, y: localPos.y + localSize.height },
    w: { x: localPos.x, y: localPos.y + localSize.height / 2 },
  };

  // rotate a point around center by rotation deg (helper)
  const rotateWorld = (pt: Point, rotDeg: number) => {
    return rotatePoint(pt, centerWorld, degToRad(rotDeg));
  };

  // Convert pointer event screen -> world using provided fn
  const screenToWorld = (sx: number, sy: number) => screenToCanvas(sx, sy);

  // Pointer handlers
  const onHandlePointerDown =
    (handle: HandleName) => (ev: React.PointerEvent<HTMLDivElement>) => {
      ev.stopPropagation();
      ev.currentTarget.setPointerCapture(ev.pointerId); // better than (ev.target as Element)

      // Use native DOM event for clientX/Y (React doesn't expose them directly)
      const nativeEvent = ev.nativeEvent;

      dragRef.current = {
        mode: "resize",
        handle,
        startPointerScreen: { x: nativeEvent.clientX, y: nativeEvent.clientY },
        startLocal: {
          position: { ...localPos },
          size: { ...localSize },
          rotation: localRotation || 0,
        },
      };

      window.addEventListener("pointermove", globalPointerMove);
      window.addEventListener("pointerup", globalPointerUp);
    };

  const onRotatePointerDown = (ev: React.PointerEvent<HTMLDivElement>) => {
    ev.stopPropagation();
    ev.currentTarget.setPointerCapture(ev.pointerId);

    const nativeEvent = ev.nativeEvent;

    dragRef.current = {
      mode: "rotate",
      startPointerScreen: { x: nativeEvent.clientX, y: nativeEvent.clientY },
      startLocal: {
        position: { ...localPos },
        size: { ...localSize },
        rotation: localRotation || 0,
      },
    };

    window.addEventListener("pointermove", globalPointerMove);
    window.addEventListener("pointerup", globalPointerUp);
  };

  function globalPointerMove(ev: PointerEvent) {
    const s = dragRef.current;
    if (!s) return;
    const screenPoint = { x: ev.clientX, y: ev.clientY };

    if (s.mode === "rotate") {
      // compute angle by world center
      const worldP = screenToWorld(screenPoint.x, screenPoint.y);
      const vx = worldP.x - centerWorld.x;
      const vy = worldP.y - centerWorld.y;
      const angleDeg = radToDeg(Math.atan2(vy, vx));
      let newRotation = angleDeg + 90; // align top as 0 (tweak if you want different behavior)
      newRotation = ((newRotation % 360) + 360) % 360;
      if (snapRotationDeg)
        newRotation =
          Math.round(newRotation / snapRotationDeg) * snapRotationDeg;
      setLocalRotation(newRotation);
      pendingRef.current = { rotation: newRotation };
      scheduleCommit();
      return;
    }

    // RESIZE: convert pointer start and current to world, rotate into element-local axis, compute new box
    if (s.mode === "resize" && s.handle) {
      const startScreen = s.startPointerScreen;
      const startWorld = screenToWorld(startScreen.x, startScreen.y);
      const curWorld = screenToWorld(screenPoint.x, screenPoint.y);

      const rotRad = degToRad(-s.startLocal.rotation);
      const center = {
        x: s.startLocal.position.x + s.startLocal.size.width / 2,
        y: s.startLocal.position.y + s.startLocal.size.height / 2,
      };

      const startLocalPoint = rotatePoint(startWorld, center, rotRad);
      const curLocalPoint = rotatePoint(curWorld, center, rotRad);
      const topLeftLocal = rotatePoint(s.startLocal.position, center, rotRad);
      const startRight = topLeftLocal.x + s.startLocal.size.width;
      const startBottom = topLeftLocal.y + s.startLocal.size.height;

      const newTopLeftLocal = { ...topLeftLocal };
      let newWidth = s.startLocal.size.width;
      let newHeight = s.startLocal.size.height;

      switch (s.handle) {
        case "se":
          newWidth = Math.max(minWidth, curLocalPoint.x - topLeftLocal.x);
          newHeight = Math.max(minHeight, curLocalPoint.y - topLeftLocal.y);
          break;
        case "e":
          newWidth = Math.max(minWidth, curLocalPoint.x - topLeftLocal.x);
          break;
        case "ne":
          newWidth = Math.max(minWidth, curLocalPoint.x - topLeftLocal.x);
          newTopLeftLocal.y = Math.min(
            curLocalPoint.y,
            startBottom - minHeight,
          );
          newHeight = Math.max(minHeight, startBottom - newTopLeftLocal.y);
          break;
        case "n":
          newTopLeftLocal.y = Math.min(
            curLocalPoint.y,
            startBottom - minHeight,
          );
          newHeight = Math.max(minHeight, startBottom - newTopLeftLocal.y);
          break;
        case "nw":
          newTopLeftLocal.x = Math.min(curLocalPoint.x, startRight - minWidth);
          newTopLeftLocal.y = Math.min(
            curLocalPoint.y,
            startBottom - minHeight,
          );
          newWidth = Math.max(minWidth, startRight - newTopLeftLocal.x);
          newHeight = Math.max(minHeight, startBottom - newTopLeftLocal.y);
          break;
        case "w":
          newTopLeftLocal.x = Math.min(curLocalPoint.x, startRight - minWidth);
          newWidth = Math.max(minWidth, startRight - newTopLeftLocal.x);
          break;
        case "sw":
          newTopLeftLocal.x = Math.min(curLocalPoint.x, startRight - minWidth);
          newWidth = Math.max(minWidth, startRight - newTopLeftLocal.x);
          newHeight = Math.max(minHeight, curLocalPoint.y - topLeftLocal.y);
          break;
        case "s":
          newHeight = Math.max(minHeight, curLocalPoint.y - topLeftLocal.y);
          break;
      }

      // rotate top-left back to world
      const newTopLeftWorld = rotatePoint(
        newTopLeftLocal,
        center,
        degToRad(s.startLocal.rotation),
      );

      // update local visual state instantly
      setLocalPos({ x: newTopLeftWorld.x, y: newTopLeftWorld.y });
      setLocalSize({ width: newWidth, height: newHeight });

      // schedule commit
      pendingRef.current = {
        position: { x: newTopLeftWorld.x, y: newTopLeftWorld.y },
        size: { width: newWidth, height: newHeight },
      };
      scheduleCommit();
    }
  }

  function globalPointerUp(_ev: PointerEvent) {
    // final commit
    commitPending();
    dragRef.current = null;
    window.removeEventListener("pointermove", globalPointerMove);
    window.removeEventListener("pointerup", globalPointerUp);
  }

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("pointermove", globalPointerMove);
      window.removeEventListener("pointerup", globalPointerUp);
    };
  }, []);

  // Render: compute rotated corners in world space then convert to screen for overlay
  const rotatedTopLeft = rotateWorld(localPos, localRotation);
  const rotatedTopRight = rotateWorld(
    { x: localPos.x + localSize.width, y: localPos.y },
    localRotation,
  );
  const rotatedBottomLeft = rotateWorld(
    { x: localPos.x, y: localPos.y + localSize.height },
    localRotation,
  );
  const rotatedBottomRight = rotateWorld(
    { x: localPos.x + localSize.width, y: localPos.y + localSize.height },
    localRotation,
  );

  const screenPts = [
    rotatedTopLeft,
    rotatedTopRight,
    rotatedBottomRight,
    rotatedBottomLeft,
  ].map((p) => worldToScreen(p, viewport));
  const xs = screenPts.map((p) => p.x);
  const ys = screenPts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // build handles: rotate the handle points too
  const handleDivs = (Object.keys(localHandlesWorld) as HandleName[]).map(
    (name) => {
      const worldHandle = rotateWorld(localHandlesWorld[name], localRotation);
      const screenHandle = worldToScreen(worldHandle, viewport);
      const style: React.CSSProperties = {
        position: "absolute",
        left: screenHandle.x - HANDLE_SIZE_PX / 2,
        top: screenHandle.y - HANDLE_SIZE_PX / 2,
        width: HANDLE_SIZE_PX,
        height: HANDLE_SIZE_PX,
        background: "white",
        border: "1px solid rgba(0,0,0,0.7)",
        boxSizing: "border-box",
        touchAction: "none",
        zIndex: 60,
        cursor: cursorForHandle(name),
      };
      return (
        <div
          key={name}
          style={style}
          onPointerDown={onHandlePointerDown(name)}
        />
      );
    },
  );

  // rotate knob pos: use top-center rotated outward
  const topCenter = rotateWorld(
    { x: localPos.x + localSize.width / 2, y: localPos.y },
    localRotation,
  );
  const topCenterScreen = worldToScreen(topCenter, viewport);
  const angleRad = degToRad(localRotation);
  const dirX = Math.cos(angleRad - Math.PI / 2);
  const dirY = Math.sin(angleRad - Math.PI / 2);
  const rotateScreen = {
    x: topCenterScreen.x + dirX * ROTATE_HANDLE_DIST_PX,
    y: topCenterScreen.y + dirY * ROTATE_HANDLE_DIST_PX,
  };

  // const outlineStyle: React.CSSProperties = {
  //   position: "absolute",
  //   left: minX - 4,
  //   top: minY - 4,
  //   width: Math.max(1, maxX - minX) + 8,
  //   height: Math.max(1, maxY - minY) + 8,
  //   border: "1px dashed rgba(37,99,235,0.9)",
  //   pointerEvents: "none",
  //   zIndex: 50,
  //   boxSizing: "border-box",
  // };

  return (
    <>
      {/* <div style={outlineStyle} /> */}
      {handleDivs}
      <div
        style={{
          position: "absolute",
          left: rotateScreen.x - HANDLE_SIZE_PX / 2,
          top: rotateScreen.y - HANDLE_SIZE_PX / 2,
          width: HANDLE_SIZE_PX,
          height: HANDLE_SIZE_PX,
          background: "white",
          borderRadius: 999,
          border: "1px solid rgba(0,0,0,0.7)",
          zIndex: 60,
          touchAction: "none",
          cursor: "crosshair",
        }}
        onPointerDown={onRotatePointerDown}
      />
    </>
  );
}

function cursorForHandle(name: HandleName) {
  switch (name) {
    case "nw":
    case "se":
      return "nwse-resize";
    case "ne":
    case "sw":
      return "nesw-resize";
    case "n":
    case "s":
      return "ns-resize";
    default:
      return "ew-resize";
  }
}
