import { sanitizeText } from "shared";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { StickyElement } from "../../models/element";
import {
  yjsService,
  type StickyAwarenessState,
} from "../../services/yjsService";
import { useBoardStore } from "../../store/boardStore";
import { useCollaborationStore } from "../../store/collaborationStore";

interface StickyTextEditorProps {
  sticky: StickyElement;
  zoom: number;
  pan: { x: number; y: number };
  onClose: () => void;
}

export default function StickyTextEditor({
  sticky,
  zoom,
  pan,
  onClose,
}: StickyTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textValue, setTextValue] = useState(() =>
    sanitizeText(yjsService.getStickyText(sticky.id).toString()),
  );
  const [remotePresence, setRemotePresence] = useState<StickyAwarenessState[]>(
    [],
  );

  const activeUsers = useCollaborationStore((state) => state.activeUsers);

  useEffect(() => {
    const ytext = yjsService.getStickyText(sticky.id);

    // Update board store's static text field so preview canvas renders current text
    const updateStaticText = () => {
      const rawVal = ytext.toString();
      const currentVal = sanitizeText(rawVal);
      setTextValue(currentVal);

      const latestElements = useBoardStore.getState().elements;
      const target = latestElements.find((el) => el.id === sticky.id) as
        | StickyElement
        | undefined;
      if (target && target.text !== currentVal) {
        useBoardStore
          .getState()
          .setElements(
            latestElements.map((el) =>
              el.id === sticky.id ? { ...el, text: currentVal } : el,
            ),
          );
      }
    };

    const observer = () => {
      updateStaticText();
    };
    ytext.observe(observer);

    // Awareness setup
    const myUser = activeUsers[0];
    const userBadge = {
      name: myUser?.displayName || "You",
      color: myUser?.accent || "#3b82f6",
    };

    yjsService.setLocalStickyAwareness(sticky.id, userBadge);

    const unsubscribeAwareness = yjsService.onAwarenessChange(() => {
      setRemotePresence(yjsService.getAwarenessStatesForSticky(sticky.id));
    });

    // Auto-focus textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }, 50);

    return () => {
      ytext.unobserve(observer);
      unsubscribeAwareness();
      yjsService.setLocalStickyAwareness(null);

      // On finish, commit updated sanitized text to board store for history / snapshot
      const finalVal = sanitizeText(ytext.toString());
      const currentBoard = useBoardStore.getState().elements;
      const updated = currentBoard.map((el) =>
        el.id === sticky.id
          ? { ...el, text: finalVal, updatedAt: Date.now() }
          : el,
      );
      useBoardStore.getState().commit(updated);
    };
  }, [sticky.id, activeUsers]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    const ytext = yjsService.getStickyText(sticky.id);

    // Delta update to Y.Text
    const currentVal = ytext.toString();
    if (nextVal !== currentVal) {
      ytext.doc?.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, nextVal);
      });
    }

    setTextValue(nextVal);

    if (textareaRef.current) {
      const selStart = textareaRef.current.selectionStart;
      const myUser = activeUsers[0];
      yjsService.setLocalStickyAwareness(
        sticky.id,
        {
          name: myUser?.displayName || "You",
          color: myUser?.accent || "#3b82f6",
        },
        { index: selStart, length: 0 },
      );
    }
  };

  const left = sticky.x * zoom + pan.x;
  const top = sticky.y * zoom + pan.y;
  const width = sticky.width * zoom;
  const height = sticky.height * zoom;

  return (
    <div
      style={{
        position: "absolute",
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: 100,
        pointerEvents: "auto",
      }}
    >
      {/* Remote presence badges */}
      {remotePresence.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "-24px",
            left: 0,
            display: "flex",
            gap: "4px",
            alignItems: "center",
          }}
        >
          {remotePresence.map((p, idx) => (
            <span
              key={idx}
              style={{
                backgroundColor: p.user.color,
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: "4px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            >
              {p.user.name} is editing…
            </span>
          ))}
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={textValue}
        onChange={handleChange}
        onBlur={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClose();
          }
        }}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: sticky.color || sticky.style?.fillColor || "#fff4c2",
          border: "2px solid #3b82f6",
          borderRadius: "6px",
          padding: `${12 * zoom}px`,
          fontSize: `${14 * zoom}px`,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: "#1e293b",
          resize: "none",
          outline: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
        placeholder="Type sticky note text…"
      />
    </div>
  );
}
