import { useEffect } from "react";
import { useBoardStore } from "../store/boardStore";
import { useToolStore } from "../store/toolStore";
import { useViewportStore } from "../store/viewportStore";
import { copyStroke, pasteStroke } from "../../../lib/clipboard";

export function useKeyboardShortcuts() {
  const undo = useBoardStore((s) => s.undo);
  const redo = useBoardStore((s) => s.redo);
  const elements = useBoardStore((s) => s.elements);
  const addElement = useBoardStore((s) => s.addElement);
  const setTool = useToolStore((s) => s.setTool);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (!modKey && !isTyping) {
        const key = e.key.toLowerCase();

        if (key === "v") {
          e.preventDefault();
          setTool("select");
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
      }

      if (!modKey || isTyping) return;

      if (e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }

      if (e.key === "y") {
        e.preventDefault();
        redo();
      }

      if (e.key === "c") {
        e.preventDefault();

        const lastStroke = [...elements]
          .reverse()
          .find((el) => el.type === "stroke");
        if (lastStroke) {
          copyStroke(lastStroke);
        }
      }

      if (e.key === "v") {
        e.preventDefault();

        const stroke = pasteStroke();
        if (stroke) {
          addElement(stroke);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, elements, addElement, setTool]);
}
