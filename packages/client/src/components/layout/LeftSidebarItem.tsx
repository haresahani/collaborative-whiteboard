// src/components/layout/LeftSidebarItem.tsx
import React, { useRef, useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";

export type SidebarItemData = {
  id: string;
  title: string;
  subtitle?: string;
  avatarColor?: string;
  unread?: number;
  pinned?: boolean;
  timestamp?: string; // iso or human
};

type Props = {
  item: SidebarItemData;
  isSelected: boolean;
  collapsed: boolean;
  onSelect: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onContextMenu?: (e: React.MouseEvent, id: string) => void;
};

export default function LeftSidebarItem({
  item,
  isSelected,
  collapsed,
  onSelect,
  onRename,
  onContextMenu,
}: Props) {
  // sortable hooks (dnd-kit)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "manipulation" as const,
  };

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={clsx(
        "flex items-center gap-3 p-2 rounded-md select-none",
        isSelected ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted/50",
        isDragging && "opacity-70",
      )}
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={() => onSelect(item.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e, item.id);
      }}
      onKeyDown={(e) => {
        // Space toggles selection; Enter opens (handled by onSelect)
        if (e.key === "Enter") onSelect(item.id);
        if (e.key === "F2") setEditing(true);
      }}
    >
      {/* drag handle - small area */}
      <div {...listeners} className="pr-1 pl-1 cursor-grab" aria-hidden>
        <svg
          className="w-4 h-4 opacity-60"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="5" cy="6" r="1" />
          <circle cx="12" cy="6" r="1" />
          <circle cx="19" cy="6" r="1" />
          <circle cx="5" cy="12" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
        </svg>
      </div>

      {/* avatar / icon */}
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center text-sm font-medium shrink-0"
        style={{ background: item.avatarColor || "rgba(0,0,0,0.06)" }}
        aria-hidden
      >
        {item.title?.[0]?.toUpperCase() || "B"}
      </div>

      {/* text */}
      <div className={clsx("min-w-0 flex-1", collapsed && "hidden")}>
        {!editing ? (
          <>
            <div className="text-sm font-medium truncate">{item.title}</div>
            <div className="text-xs text-muted-foreground truncate">
              {item.subtitle ?? item.timestamp}
            </div>
          </>
        ) : (
          <input
            ref={inputRef}
            className="w-full bg-transparent border rounded px-2 py-1 text-sm focus:outline-none focus:ring"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              setEditing(false);
              if (title.trim() && title !== item.title)
                onRename?.(item.id, title.trim());
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (e.target as HTMLInputElement).blur();
              } else if (e.key === "Escape") {
                setTitle(item.title);
                setEditing(false);
              }
            }}
          />
        )}
      </div>

      {/* unread / pin / actions (hidden when collapsed) */}
      {!collapsed && (
        <div className="flex items-center gap-2">
          {item.unread ? (
            <span className="inline-flex items-center justify-center text-[11px] font-semibold bg-rose-500 text-white rounded-full w-6 h-6">
              {item.unread}
            </span>
          ) : null}
          {item.pinned ? (
            <svg
              className="w-4 h-4 opacity-70"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7l3-7z" />
            </svg>
          ) : null}
        </div>
      )}
    </div>
  );
}
