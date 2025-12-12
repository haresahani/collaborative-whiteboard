import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import LeftSidebarItem, { SidebarItemData } from "./LeftSidebarItem";
import clsx from "clsx";

import useWhiteboardStore, {
  WhiteboardStoreType,
  Board,
} from "../../store/whiteboardStore";

const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH = 280;
const ITEM_HEIGHT = 64;

export default function LeftSidebar(): JSX.Element {
  const shapes = useWhiteboardStore((s: WhiteboardStoreType) => s.shapes);
  const selectedId = useWhiteboardStore(
    (s: WhiteboardStoreType) => s.selectedShapeId,
  );
  const selectShape = useWhiteboardStore(
    (s: WhiteboardStoreType) => s.selectShape,
  );
  const addShape = useWhiteboardStore((s: WhiteboardStoreType) => s.addShape);
  const updateShape = useWhiteboardStore(
    (s: WhiteboardStoreType) => s.updateShape,
  );
  const deleteShape = useWhiteboardStore(
    (s: WhiteboardStoreType) => s.deleteShape,
  );
  const reorder = useWhiteboardStore((s: WhiteboardStoreType) => s.reorder);

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const searchRef = useRef<HTMLInputElement | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const pinned: Board[] = useMemo(
    () => shapes.filter((s) => s.pinned),
    [shapes],
  );
  const recent: Board[] = useMemo(
    () => shapes.filter((s) => !s.pinned),
    [shapes],
  );

  const allIds = useMemo(
    () => [...pinned.map((b) => b.id), ...recent.map((b) => b.id)],
    [pinned, recent],
  );

  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    const total = allIds.length;
    if (total === 0) {
      setFocusedIndex(null);
      return;
    }
    if (focusedIndex === null) {
      setFocusedIndex(allIds.indexOf(selectedId ?? allIds[0]) ?? 0);
    } else if (focusedIndex >= total) {
      setFocusedIndex(total - 1);
    }
  }, [allIds.length, selectedId, focusedIndex]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = allIds.indexOf(active.id as string);
    const newIndex = allIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    if (typeof reorder === "function") {
      reorder(oldIndex, newIndex);
    } else {
      const nextIds = arrayMove(allIds, oldIndex, newIndex);
      const nextShapes = nextIds
        .map((id) => shapes.find((s) => s.id === id)!)
        .filter(Boolean);
      useWhiteboardStore.setState({ shapes: nextShapes });
    }
  };

  const handleNewBoard = () => {
    addShape({
      id: `b-${Date.now()}`,
      title: `Board ${shapes.length + 1}`,
      pinned: false,
      // Add any other required Board fields here if needed, e.g.:
      // subtitle: undefined,
      // avatarColor: "gray",
      // unread: false,
      // timestamp: Date.now(),
    });
  };

  const filteredPinned = pinned.filter((p) =>
    (p.title ?? "").toLowerCase().includes(query.toLowerCase()),
  );
  const filteredRecent = recent.filter((r) =>
    (r.title ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  const openContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const choice = window.prompt(
      "Action: rename / duplicate / delete",
      "rename",
    );
    if (!choice) return;

    if (choice === "delete") {
      deleteShape(id);
    } else if (choice === "rename") {
      const title = window.prompt("New name");
      if (title) updateShape(id, { title });
    } else if (choice === "duplicate") {
      const src = shapes.find((s) => s.id === id);
      if (src) {
        addShape({
          ...src,
          id: `b-${Date.now()}`,
          title: `${src.title ?? "Untitled"} (copy)`,
          pinned: false, // copies don't start pinned
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      ["ArrowDown", "ArrowUp", "Enter", "Delete", "Backspace", " "].includes(
        e.key,
      )
    ) {
      e.preventDefault();
    }

    if (e.key === "ArrowDown") {
      setFocusedIndex((i) =>
        i === null ? 0 : Math.min(allIds.length - 1, i + 1),
      );
    }
    if (e.key === "ArrowUp") {
      setFocusedIndex((i) => (i === null ? 0 : Math.max(0, i - 1)));
    }
    if (e.key === "Enter" && focusedIndex !== null) {
      selectShape(allIds[focusedIndex]);
    }
    if (
      (e.key === "Delete" || e.key === "Backspace") &&
      focusedIndex !== null
    ) {
      deleteShape(allIds[focusedIndex]);
      setFocusedIndex((i) => (i === null ? null : Math.max(0, i - 1)));
    }
    if ((e.key === "n" || e.key === "N") && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleNewBoard();
    }
  };

  return (
    <aside
      style={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      onKeyDown={handleKeyDown}
      aria-label="Boards sidebar"
      className="h-full border-r bg-surface flex flex-col transition-width duration-200 shadow-sm"
    >
      <div className="p-3 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleNewBoard}
            aria-label="New board"
            title="New board (Ctrl/Cmd+N)"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            {!collapsed && (
              <span className="text-sm font-medium">New board</span>
            )}
          </button>

          <button
            className="ml-auto p-2 rounded hover:bg-muted/50"
            onClick={() => setCollapsed((c) => !c)}
            aria-pressed={collapsed}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d={collapsed ? "M6 9l6 6 6-6" : "M18 15l-6-6-6 6"} />
            </svg>
          </button>
        </div>

        <div className={clsx("relative", collapsed && "hidden")}>
          <input
            ref={searchRef}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm"
            placeholder="Search boards..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search boards"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto" role="listbox">
        <div className="px-3 pb-2">
          <div className="text-xs text-muted-foreground uppercase mb-2 px-1">
            Pinned
          </div>
          <div className="space-y-1">
            {filteredPinned.length === 0 ? (
              <div className="text-xs text-muted-foreground px-1">
                No pinned boards
              </div>
            ) : (
              filteredPinned.map((b) => (
                <LeftSidebarItem
                  key={b.id}
                  item={{
                    id: b.id,
                    title: b.title ?? "Untitled",
                    subtitle: b.subtitle,
                    avatarColor: b.avatarColor,
                    unread: b.unread,
                    pinned: true,
                    timestamp: b.timestamp,
                  }}
                  collapsed={collapsed}
                  isSelected={selectedId === b.id}
                  onSelect={(id) => selectShape(id)}
                  onRename={(id, newTitle) =>
                    updateShape(id, { title: newTitle })
                  }
                  onContextMenu={(e, id) => openContextMenu(e, id)}
                />
              ))
            )}
          </div>
        </div>

        <div className="px-3 pt-1">
          <div className="text-xs text-muted-foreground uppercase mb-2 px-1">
            Recent
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-1 pb-6">
              {filteredRecent.length === 0 ? (
                <div className="text-xs text-muted-foreground px-1">
                  No recent boards
                </div>
              ) : (
                filteredRecent.map((b) => (
                  <LeftSidebarItem
                    key={b.id}
                    item={{
                      id: b.id,
                      title: b.title ?? "Untitled",
                      subtitle: b.subtitle,
                      avatarColor: b.avatarColor,
                      unread: b.unread,
                      pinned: false,
                      timestamp: b.timestamp,
                    }}
                    collapsed={collapsed}
                    isSelected={selectedId === b.id}
                    onSelect={(id) => selectShape(id)}
                    onRename={(id, newTitle) =>
                      updateShape(id, { title: newTitle })
                    }
                    onContextMenu={(e, id) => openContextMenu(e, id)}
                  />
                ))
              )}
            </div>
          </DndContext>
        </div>
      </div>

      <div className="p-3 border-t flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center">
          U
        </div>
        {!collapsed && (
          <div className="flex-1">
            <div className="text-sm font-medium">You</div>
            <div className="text-xs text-muted-foreground">
              Account settings
            </div>
          </div>
        )}
        <button
          className="p-2 rounded hover:bg-muted/50"
          aria-label="Open settings"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06c.39-.52.74-1.12.33-1.82.49-.88.49-1.78 0-2.66-.41-.7-.06-1.3.33-1.82l.06-.06a2 2 0 0 1 2.83-2.83l.06.06c.52.39 1.12.74 1.82.33.88-.49 1.78-.49 2.66 0 .7.41 1.3.06 1.82-.33l.06.06A2 2 0 0 1 17.8 3.21l-.06.06a1.65 1.65 0 0 0-.33 1.82c.25.55.7 1.01 1.27 1.27a1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 0 1 23.62 7l-.06.06c-.39.52-.74 1.12-.33 1.82.49.88.49 1.78 0 2.66-.41.7-.06 1.3.33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06c-.52-.39-1.12-.74-1.82-.33-.88.49-1.78.49-2.66 0z" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
