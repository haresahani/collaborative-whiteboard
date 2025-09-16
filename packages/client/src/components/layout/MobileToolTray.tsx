import * as React from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useWhiteboard } from '@/contexts/WhiteboardContext';
import { DrawingTool } from '@/types/whiteboard';
import { 
  MousePointer2, Pen, Minus, Square, Circle, Type, StickyNote, Eraser, Hand
} from 'lucide-react';

interface MobileToolTrayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tools: Array<{ id: DrawingTool; icon: React.ElementType; label: string }> = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'hand', icon: Hand, label: 'Hand' },
  { id: 'pen', icon: Pen, label: 'Pen' },
  { id: 'line', icon: Minus, label: 'Line' },
  { id: 'rectangle', icon: Square, label: 'Rect' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'sticky-note', icon: StickyNote, label: 'Note' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
];

export function MobileToolTray({ open, onOpenChange }: MobileToolTrayProps) {
  const { state, setTool } = useWhiteboard();
  const { tool: activeTool } = state;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-surface border-t border-border-subtle pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        <DrawerHeader className="py-3">
          <DrawerTitle className="text-sm text-muted-foreground">Tools</DrawerTitle>
        </DrawerHeader>

        <TooltipProvider>
          <div className="px-3 pb-3">
            <div className="grid grid-cols-5 gap-2">
              {tools.map(({ id, icon: Icon, label }) => (
                <Button
                  key={id}
                  variant={activeTool === id ? 'default' : 'secondary'}
                  size="sm"
                  className="flex flex-col items-center gap-1 h-16"
                  onClick={() => {
                    setTool(id);
                    onOpenChange(false);
                  }}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[11px]">{label}</span>
                </Button>
              ))}
            </div>
          </div>
        </TooltipProvider>
      </DrawerContent>
    </Drawer>
  );
}