import { useEffect, useRef } from "react";
import {
  materializeClipboard,
  serializeSelection,
  type ClipboardPayload,
} from "../engine/clipboard";
import { useBoardStore } from "../store/boardStore";
import { useSelectionStore } from "../store/selectionStore";
import { useToolStore } from "../store/toolStore";
import { useViewportStore } from "../store/viewportStore";

export function useKeyboardShortcuts() {
  const clipboardRef = useRef<ClipboardPayload | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (isTyping) return;

      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      const key = e.key.toLowerCase();

      if (!modKey) {
        const setTool = useToolStore.getState().setTool;

        if (e.key === "Escape") {
          e.preventDefault();
          setTool("select");
        }

        if (key === "v") {
          e.preventDefault();
          setTool("select");
        }

        if (key === "h") {
          e.preventDefault();
          setTool("hand");
        }

        if (key === "p") {
          e.preventDefault();
          setTool("pen");
        }

        if (key === "r") {
          e.preventDefault();
          setTool("rectangle");
        }

        if (key === "a") {
          e.preventDefault();
          setTool("arrow");
        }

        if (key === "t") {
          e.preventDefault();
          setTool("text");
        }

        if (key === "i") {
          e.preventDefault();
          setTool("image");
        }

        if (key === "e") {
          e.preventDefault();
          setTool("eraser");
        }

        if (e.key === "0") {
          e.preventDefault();
          useViewportStore.setState({
            offsetX: 0,
            offsetY: 0,
            zoom: 1,
          });
        }

        return;
      }

      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          useBoardStore.getState().redo();
        } else {
          useBoardStore.getState().undo();
        }
      }

      if (key === "y") {
        e.preventDefault();
        useBoardStore.getState().redo();
      }

      if (key === "c") {
        e.preventDefault();

        const payload = serializeSelection(
          useBoardStore.getState().elements,
          useSelectionStore.getState().selectedIds,
        );

        if (payload) {
          clipboardRef.current = payload;
        }
      }

      if (key === "v") {
        e.preventDefault();

        const payload = clipboardRef.current;
        if (!payload) return;

        const clones = materializeClipboard(payload);
        const elements = useBoardStore.getState().elements;

        useBoardStore.getState().commit([...elements, ...clones]);
        useSelectionStore
          .getState()
          .setSelection(clones.map((clone) => clone.id));
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
