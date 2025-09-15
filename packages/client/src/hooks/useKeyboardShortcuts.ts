import { useEffect } from "react";
import { KeyboardShortcut } from "@/types/whiteboard";

// Hook: binds keyboard events to shortcut actions
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === "true"
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

// Generic version for shortcuts
export type WhiteboardActions<TTool extends string> = {
  undo: () => void;
  redo: () => void;
  copy: () => void;
  paste: () => void;
  delete: () => void;
  selectAll: () => void;
  duplicate: () => void;
  setTool: (tool: TTool) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
};

export function createWhiteboardShortcuts<TTool extends string>(
  actions: WhiteboardActions<TTool>
): KeyboardShortcut[] {
  return [
    // Basic actions
    { key: "z", ctrl: true, action: actions.undo, description: "Undo" },
    { key: "z", ctrl: true, shift: true, action: actions.redo, description: "Redo" },
    { key: "y", ctrl: true, action: actions.redo, description: "Redo" },
    { key: "c", ctrl: true, action: actions.copy, description: "Copy" },
    { key: "v", ctrl: true, action: actions.paste, description: "Paste" },
    { key: "Delete", action: actions.delete, description: "Delete selected" },
    { key: "Backspace", action: actions.delete, description: "Delete selected" },
    { key: "a", ctrl: true, action: actions.selectAll, description: "Select all" },
    { key: "d", ctrl: true, action: actions.duplicate, description: "Duplicate" },

    // Tools
    { key: "v", action: () => actions.setTool("select" as TTool), description: "Select tool" },
    { key: "p", action: () => actions.setTool("pen" as TTool), description: "Pen tool" },
    { key: "l", action: () => actions.setTool("line" as TTool), description: "Line tool" },
    { key: "r", action: () => actions.setTool("rectangle" as TTool), description: "Rectangle tool" },
    { key: "o", action: () => actions.setTool("circle" as TTool), description: "Circle tool" },
    { key: "t", action: () => actions.setTool("text" as TTool), description: "Text tool" },
    { key: "s", action: () => actions.setTool("sticky-note" as TTool), description: "Sticky note tool" },
    { key: "e", action: () => actions.setTool("eraser" as TTool), description: "Eraser tool" },
    { key: "h", action: () => actions.setTool("hand" as TTool), description: "Hand tool" },

    // Zoom
    { key: "=", ctrl: true, action: actions.zoomIn, description: "Zoom in" },
    { key: "-", ctrl: true, action: actions.zoomOut, description: "Zoom out" },
    { key: "0", ctrl: true, action: actions.resetZoom, description: "Reset zoom" },
  ];
}
