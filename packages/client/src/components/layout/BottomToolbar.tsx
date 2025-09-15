import React from 'react';
import { motion } from 'framer-motion';
import { 
  Undo, 
  Redo, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Download,
  Copy,
  Trash2,
  Move
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWhiteboard } from '@/contexts/WhiteboardContext';
import { cn } from '@/lib/utils';

interface BottomToolbarProps {
  onExport: () => void;
  onFitToScreen: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function BottomToolbar({ 
  onExport, 
  onFitToScreen, 
  onZoomIn, 
  onZoomOut 
}: BottomToolbarProps) {
  const { state, undo, redo, canUndo, canRedo } = useWhiteboard();
  const { viewport, selectedElements } = state;
  
  const zoomPercentage = Math.round(viewport.zoom * 100);
  const hasSelection = selectedElements.length > 0;

  const handleCopy = () => {
    // In a real app, this would copy selected elements to clipboard
    console.log('Copying selected elements:', selectedElements);
  };

  const handleDelete = () => {
    // In a real app, this would delete selected elements
    console.log('Deleting selected elements:', selectedElements);
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30"
      >
        <div className="floating-panel flex items-center gap-1 px-3 py-2">
          {/* History Actions */}
          <div className="flex items-center gap-1">
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={undo}
                  disabled={!canUndo}
                  className={cn(
                    "h-8 w-8",
                    !canUndo && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Undo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  Undo
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground">
                    ⌘Z
                  </kbd>
                </div>
              </TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={redo}
                  disabled={!canRedo}
                  className={cn(
                    "h-8 w-8",
                    !canRedo && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  Redo
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground">
                    ⌘⇧Z
                  </kbd>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Selection Actions - Only show when elements are selected */}
          {hasSelection && (
            <>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="h-6 text-xs px-2">
                  {selectedElements.length} selected
                </Badge>

                <Tooltip delayDuration={500}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopy}
                      className="h-8 w-8"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      Copy
                      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground">
                        ⌘C
                      </kbd>
                    </div>
                  </TooltipContent>
                </Tooltip>

                <Tooltip delayDuration={500}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDelete}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      Delete
                      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground">
                        Del
                      </kbd>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>

              <Separator orientation="vertical" className="h-6 mx-1" />
            </>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onZoomOut}
                  disabled={zoomPercentage <= 10}
                  className="h-8 w-8"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  Zoom Out
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground">
                    ⌘-
                  </kbd>
                </div>
              </TooltipContent>
            </Tooltip>

            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-3 text-xs font-mono min-w-16"
              onClick={onFitToScreen}
            >
              {zoomPercentage}%
            </Button>

            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onZoomIn}
                  disabled={zoomPercentage >= 500}
                  className="h-8 w-8"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  Zoom In
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground">
                    ⌘+
                  </kbd>
                </div>
              </TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onFitToScreen}
                  className="h-8 w-8"
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  Fit to Screen
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground">
                    ⌘0
                  </kbd>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Export */}
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onExport}
                className="h-8 w-8"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export as PNG/PDF</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}