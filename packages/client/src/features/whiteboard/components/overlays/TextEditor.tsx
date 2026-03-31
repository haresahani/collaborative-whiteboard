// src/features/whiteboard/components/overlays/TextEditor.tsx
import { useEffect, useRef } from "react";
import { useTextEditorStore } from "../../store/textEditorStore";
import { useBoardStore } from "../../store/boardStore";
import { useViewportStore } from "../../store/viewportStore";
import { useToolStore } from "../../store/toolStore";
import { generateUUID } from "../../../../lib/utils";

export default function TextEditor() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { isEditing, elementId, x, y, value, setValue, stopEditing } =
    useTextEditorStore();
  const addElement = useBoardStore((s) => s.addElement);
  const updateElement = useBoardStore((s) => s.updateElement);
  const { offsetX, offsetY, zoom } = useViewportStore();
  const color = useToolStore((s) => s.color);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      const el = textareaRef.current;
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [isEditing]);

  if (!isEditing) return null;

  function commitText() {
    if (!value.trim()) {
      stopEditing();
      return;
    }

    const fontSize = 20;
    const fontFamily = "Virgil";

    // measure multiline text for width/height
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = fontSize;

    if (ctx) {
      ctx.font = `${fontSize}px ${fontFamily}`;
      const lines = value.split("\n");
      const lineHeight = fontSize * 1.2;

      for (const line of lines) {
        const metrics = ctx.measureText(line || " ");
        width = Math.max(width, metrics.width);
      }

      height = lines.length * lineHeight;
    }

    if (elementId) {
      updateElement(elementId, (el) => {
        if (el.type !== "text") return el;
        return {
          ...el,
          x,
          y,
          text: value,
          width,
          height,
          fontSize,
          fontFamily,
          // keep existing style unless you want editing to recolor
          updatedAt: Date.now(),
        };
      });
    } else {
      addElement({
        id: generateUUID(),
        type: "text",
        x,
        y,
        text: value,
        width,
        height,
        fontSize,
        fontFamily,
        style: {
          strokeColor: color,
          strokeWidth: 1,
        },
        zIndex: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    stopEditing();
  }

  // world → screen
  const screenLeft = x * zoom + offsetX;
  const screenTop = y * zoom + offsetY;

  return (
    <textarea
      className="whiteboard-text-editor"
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
      }}
      onBlur={() => {
        commitText();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          stopEditing();
        }
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          commitText();
        }
      }}
      style={{
        position: "absolute",
        left: screenLeft,
        top: screenTop,
        zIndex: 10,
        fontSize: 20,
        fontFamily: "Virgil",
        outline: "none",
        resize: "none",
        overflow: "hidden",
        color: color,
        minWidth: 40,
        minHeight: 20,
      }}
    />
  );
}
