// src/features/whiteboard/components/overlays/TextEditor.tsx
import { useEffect, useRef } from "react";
import { useTextEditorStore } from "../../store/textEditorStore";
import { useBoardStore } from "../../store/boardStore";
import { useSelectionStore } from "../../store/selectionStore";
import { useViewportStore } from "../../store/viewportStore";
import { useToolStore } from "../../store/toolStore";
import { generateUUID } from "../../../../lib/utils";
import type { TextElement } from "../../models/element";

export default function TextEditor() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { isEditing, elementId, x, y, value, setValue, stopEditing } =
    useTextEditorStore();
  const elements = useBoardStore((s) => s.elements);
  const addElement = useBoardStore((s) => s.addElement);
  const updateElement = useBoardStore((s) => s.updateElement);
  const { offsetX, offsetY, zoom } = useViewportStore();
  const color = useToolStore((s) => s.color);
  const fontFamily = useToolStore((s) => s.fontFamily);
  const fontSize = useToolStore((s) => s.fontSize);
  const setSelection = useSelectionStore((s) => s.setSelection);
  const commit = useBoardStore((s) => s.commit);
  const clearSelection = useSelectionStore((s) => s.clearSelection);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      const el = textareaRef.current;
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [isEditing]);

  if (!isEditing) return null;

  const editingCandidate = elementId
    ? elements.find((element) => element.id === elementId)
    : null;
  const editingElement: TextElement | null =
    editingCandidate?.type === "text" ? editingCandidate : null;

  function commitText() {
    if (!value.trim()) {
      if (elementId) {
        commit(elements.filter((el) => el.id !== elementId));
        clearSelection();
      }
      stopEditing();
      return;
    }

    const activeFontSize = editingElement?.fontSize ?? fontSize;
    const activeFontFamily = editingElement?.fontFamily ?? fontFamily;
    const activeColor = editingElement?.style.strokeColor ?? color;

    // measure multiline text for width/height
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = activeFontSize;

    if (ctx) {
      ctx.font = `${activeFontSize}px ${activeFontFamily}`;
      const lines = value.split("\n");
      const lineHeight = activeFontSize * 1.2;

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
          width: Math.max(10, width),
          height: Math.max(10, height),
          fontSize: activeFontSize,
          fontFamily: activeFontFamily,
          updatedAt: Date.now(),
        };
      });
      setSelection([elementId]);
    } else {
      const id = generateUUID();
      addElement({
        id,
        type: "text",
        x,
        y,
        text: value,
        width: Math.max(10, width),
        height: Math.max(10, height),
        fontSize: activeFontSize,
        fontFamily: activeFontFamily,
        style: {
          strokeColor: activeColor,
          strokeWidth: 1,
        },
        zIndex: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      setSelection([id]);
    }

    stopEditing();
  }

  // world → screen
  const screenLeft = x * zoom + offsetX;
  const screenTop = y * zoom + offsetY;

  const currentFontSize = (editingElement?.fontSize ?? fontSize) * zoom;
  const currentFontFamily = editingElement?.fontFamily ?? fontFamily;
  const currentColor = editingElement?.style.strokeColor ?? color;

  // Dynamic measurement for 1:1 auto-expanding textarea directly on board
  const lines = (value || "").split("\n");
  let maxLineWidth = 0;
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = `${currentFontSize}px ${currentFontFamily}`;
      for (const line of lines) {
        maxLineWidth = Math.max(
          maxLineWidth,
          ctx.measureText(line || " ").width,
        );
      }
    }
  }

  const measuredWidth = Math.max(30 * zoom, maxLineWidth + 20 * zoom);
  const measuredHeight = Math.max(
    currentFontSize * 1.2,
    lines.length * currentFontSize * 1.2 + 8 * zoom,
  );

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
        width: measuredWidth,
        height: measuredHeight,
        zIndex: 100,
        fontSize: currentFontSize,
        fontFamily: currentFontFamily,
        lineHeight: 1.2,
        outline: "none",
        border: "none",
        padding: 0,
        margin: 0,
        boxSizing: "border-box",
        background: "transparent",
        resize: "none",
        overflow: "hidden",
        color: currentColor,
        caretColor: currentColor || "#3b82f6",
        whiteSpace: "pre",
      }}
    />
  );
}
