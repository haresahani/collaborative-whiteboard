import React, { useRef, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useWhiteboard } from '@/contexts/WhiteboardContext';
import { DrawingElement, Point } from '@/types/whiteboard';
import { PresenceCursors } from './PresenceCursors';
import { cn } from '@/lib/utils';

interface WhiteboardCanvasProps {
  className?: string;
  onCursorMove?: (point: Point) => void;
}

export function WhiteboardCanvas({ className, onCursorMove }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { state, addElement, updateElement } = useWhiteboard();
  const { elements, tool, viewport, selectedElements } = state;
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [tempElement, setTempElement] = useState<DrawingElement | null>(null);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number): Point => {
    if (!containerRef.current) return { x: screenX, y: screenY };
    
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (screenX - rect.left - viewport.x) / viewport.zoom,
      y: (screenY - rect.top - viewport.y) / viewport.zoom,
    };
  }, [viewport]);

  // Handle mouse/touch events
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const point = screenToCanvas(e.clientX, e.clientY);
    setStartPoint(point);
    setIsDrawing(true);

    if (tool === 'pen') {
      setCurrentPath([point]);
    }
  }, [tool, screenToCanvas]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const point = screenToCanvas(e.clientX, e.clientY);
    
    // Send cursor position for collaboration
    onCursorMove?.(point);

    if (!isDrawing || !startPoint) return;

    if (tool === 'pen') {
      setCurrentPath(prev => [...prev, point]);
    } else if (['rectangle', 'circle', 'line'].includes(tool)) {
      // Create temporary element for preview
      const id = `temp-${Date.now()}`;
      const element: DrawingElement = {
        id,
        type: tool as any,
        position: startPoint,
        size: {
          width: point.x - startPoint.x,
          height: point.y - startPoint.y,
        },
        rotation: 0,
        style: {
          stroke: '#2563eb',
          strokeWidth: 2,
          fill: 'transparent',
          opacity: 1,
        },
        data: {},
        createdBy: state.currentUser?.id || 'anonymous',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setTempElement(element);
    }
  }, [isDrawing, startPoint, tool, screenToCanvas, onCursorMove, state.currentUser?.id]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || !startPoint) return;

    if (tool === 'pen' && currentPath.length > 1) {
      const element: DrawingElement = {
        id: `path-${Date.now()}`,
        type: 'path',
        position: { x: 0, y: 0 },
        size: { width: 0, height: 0 },
        rotation: 0,
        style: {
          stroke: '#2563eb',
          strokeWidth: 2,
          fill: 'transparent',
          opacity: 1,
        },
        data: { points: currentPath, smooth: true },
        createdBy: state.currentUser?.id || 'anonymous',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addElement(element);
    } else if (tempElement) {
      addElement(tempElement);
    }

    // Reset state
    setIsDrawing(false);
    setCurrentPath([]);
    setStartPoint(null);
    setTempElement(null);
  }, [isDrawing, startPoint, tool, currentPath, tempElement, addElement, state.currentUser?.id]);

  // Render elements on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
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
      canvas.height / (viewport.zoom * window.devicePixelRatio)
    );

    // Render all elements
    [...elements, ...(tempElement ? [tempElement] : [])].forEach(element => {
      ctx.save();
      
      // Apply element transform
      if (element.rotation !== 0) {
        ctx.translate(element.position.x + element.size.width / 2, element.position.y + element.size.height / 2);
        ctx.rotate(element.rotation);
        ctx.translate(-(element.position.x + element.size.width / 2), -(element.position.y + element.size.height / 2));
      }

      // Set styles
      ctx.strokeStyle = element.style.stroke;
      ctx.lineWidth = element.style.strokeWidth;
      ctx.fillStyle = element.style.fill;
      ctx.globalAlpha = element.style.opacity;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Render based on type
      switch (element.type) {
        case 'path':
          if (element.data.points && element.data.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(element.data.points[0].x, element.data.points[0].y);
            for (let i = 1; i < element.data.points.length; i++) {
              ctx.lineTo(element.data.points[i].x, element.data.points[i].y);
            }
            ctx.stroke();
          }
          break;

        case 'rectangle':
          ctx.beginPath();
          ctx.rect(element.position.x, element.position.y, element.size.width, element.size.height);
          if (element.style.fill !== 'transparent') ctx.fill();
          ctx.stroke();
          break;

        case 'circle':
          const centerX = element.position.x + element.size.width / 2;
          const centerY = element.position.y + element.size.height / 2;
          const radius = Math.abs(element.size.width) / 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          if (element.style.fill !== 'transparent') ctx.fill();
          ctx.stroke();
          break;

        case 'line':
          ctx.beginPath();
          ctx.moveTo(element.position.x, element.position.y);
          ctx.lineTo(element.position.x + element.size.width, element.position.y + element.size.height);
          ctx.stroke();
          break;
      }

      // Highlight selected elements
      if (selectedElements.includes(element.id)) {
        ctx.save();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          element.position.x - 4,
          element.position.y - 4,
          element.size.width + 8,
          element.size.height + 8
        );
        ctx.restore();
      }

      ctx.restore();
    });

    // Render current drawing path
    if (tool === 'pen' && currentPath.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.8;
      
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }, [elements, tempElement, currentPath, tool, viewport, selectedElements]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full overflow-hidden bg-canvas canvas-grid cursor-crosshair",
        tool === 'hand' && "cursor-grab",
        tool === 'select' && "cursor-default",
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
      />
      
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
              <span className="text-sm text-muted-foreground">Connecting to whiteboard...</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}