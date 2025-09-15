import React from 'react';
import { motion } from 'framer-motion';
import {
  MousePointer2,
  Pen,
  Minus,
  Square,
  Circle,
  Type,
  StickyNote,
  Eraser,
  Hand,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DrawingTool } from '@/types/whiteboard';
import { useWhiteboard } from '@/contexts/WhiteboardContext';
import { cn } from '@/lib/utils';

const tools: Array<{
  id: DrawingTool;
  icon: React.ElementType;
  label: string;
  shortcut: string;
}> = [
  { id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { id: 'hand', icon: Hand, label: 'Hand', shortcut: 'H' },
  { id: 'pen', icon: Pen, label: 'Pen', shortcut: 'P' },
  { id: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
  { id: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { id: 'circle', icon: Circle, label: 'Circle', shortcut: 'O' },
  { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  { id: 'sticky-note', icon: StickyNote, label: 'Sticky Note', shortcut: 'S' },
  { id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
];

interface LeftToolbarProps {
  isCollapsed?: boolean;
}

export function LeftToolbar({ isCollapsed = false }: LeftToolbarProps) {
  const { state, setTool } = useWhiteboard();
  const { tool: activeTool } = state;

  return (
    <TooltipProvider>
      <motion.div
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={cn(
          "flex flex-col gap-1 p-3 bg-surface border-r border-border-subtle h-full",
          isCollapsed ? "items-center" : "w-64"
        )}
      >
        {/* Tools Section */}
        <div className="space-y-1">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            
            return (
              <Tooltip key={tool.id} delayDuration={500}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size={isCollapsed ? "icon" : "sm"}
                      onClick={() => setTool(tool.id)}
                      className={cn(
                        "justify-start gap-3 w-full transition-all duration-200",
                        isActive && "bg-primary text-primary-foreground shadow-sm",
                        !isCollapsed && "px-3"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left">{tool.label}</span>
                          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground opacity-100">
                            {tool.shortcut}
                          </kbd>
                        </>
                      )}
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="flex items-center gap-2">
                    {tool.label}
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground opacity-100">
                      {tool.shortcut}
                    </kbd>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>

        {!isCollapsed && (
          <>
            <Separator className="my-2" />
            
            {/* Tool Properties */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Stroke Width
                </label>
                <div className="flex gap-1">
                  {[1, 2, 4, 8].map((width) => (
                    <Button
                      key={width}
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 text-xs"
                    >
                      {width}px
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Colors
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    'hsl(var(--accent-blue))',
                    'hsl(var(--accent-purple))',
                    'hsl(var(--accent-green))',
                    'hsl(var(--accent-orange))',
                    'hsl(var(--accent-red))',
                    'hsl(var(--accent-yellow))',
                    'hsl(var(--foreground))',
                    'hsl(var(--muted-foreground))',
                  ].map((color, index) => (
                    <button
                      key={index}
                      className="w-6 h-6 rounded border border-border-subtle hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </TooltipProvider>
  );
}