import { Maximize2, Redo2, Trash2, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useBoardStore } from "../../store/boardStore";
import { useHistoryStore } from "../../store/historyStore";
import { useSelectionStore } from "../../store/selectionStore";
import { useViewportStore } from "../../store/viewportStore";

interface BottomToolbarProps {
  onNotify: (message: string, tone?: "success" | "info" | "warning") => void;
}

export default function BottomToolbar({ onNotify }: BottomToolbarProps) {
  const elements = useBoardStore((state) => state.elements);
  const setElements = useBoardStore((state) => state.setElements);
  const undo = useBoardStore((state) => state.undo);
  const redo = useBoardStore((state) => state.redo);

  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const clearSelection = useSelectionStore((state) => state.clearSelection);

  const zoom = useViewportStore((state) => state.zoom);
  const zoomAt = useViewportStore((state) => state.zoomAt);

  const canUndo = useHistoryStore((state) => state.past.length > 0);
  const canRedo = useHistoryStore((state) => state.future.length > 0);
  const hasSelection = selectedIds.length > 0;

  const handleDeleteSelection = useCallback(() => {
    if (!hasSelection) return;

    const deletedCount = selectedIds.length;
    useHistoryStore.getState().push(elements);
    setElements(
      elements.filter((element) => !selectedIds.includes(element.id)),
    );
    clearSelection();
    onNotify(
      `${deletedCount} element${deletedCount === 1 ? "" : "s"} removed from the board.`,
      "success",
    );
  }, [
    clearSelection,
    elements,
    hasSelection,
    onNotify,
    selectedIds,
    setElements,
  ]);

  const handleZoomIn = useCallback(() => {
    zoomAt(window.innerWidth / 2, window.innerHeight / 2, 0.15);
  }, [zoomAt]);

  const handleZoomOut = useCallback(() => {
    zoomAt(window.innerWidth / 2, window.innerHeight / 2, -0.15);
  }, [zoomAt]);

  const handleFitToScreen = useCallback(() => {
    useViewportStore.setState({
      offsetX: 0,
      offsetY: 0,
      zoom: 1,
    });
    onNotify("Canvas view reset to fit the current workspace.", "info");
  }, [onNotify]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;

      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        hasSelection
      ) {
        event.preventDefault();
        handleDeleteSelection();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDeleteSelection, hasSelection]);

  return (
    <div className="wb-bottom-dock" role="toolbar" aria-label="Canvas controls">
      <button
        type="button"
        className="wb-icon-button"
        onClick={undo}
        disabled={!canUndo}
        aria-label="Undo"
        title="Undo (Ctrl/Cmd+Z)"
      >
        <Undo2 size={16} />
      </button>

      <button
        type="button"
        className="wb-icon-button"
        onClick={redo}
        disabled={!canRedo}
        aria-label="Redo"
        title="Redo (Ctrl/Cmd+Shift+Z)"
      >
        <Redo2 size={16} />
      </button>

      <div className="wb-divider wb-divider--vertical" />

      <button
        type="button"
        className="wb-icon-button"
        onClick={handleZoomOut}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <ZoomOut size={16} />
      </button>

      <button
        type="button"
        className="wb-zoom-pill"
        onClick={handleFitToScreen}
        aria-label="Reset zoom"
        title="Fit to screen (0)"
      >
        Zoom: {Math.round(zoom * 100)}%
      </button>

      <button
        type="button"
        className="wb-icon-button"
        onClick={handleZoomIn}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <ZoomIn size={16} />
      </button>

      <button
        type="button"
        className="wb-bottom-dock__action wb-desktop-only"
        onClick={handleFitToScreen}
        title="Fit the canvas to screen"
      >
        <Maximize2 size={16} />
        <span>Fit to Screen</span>
      </button>

      {hasSelection ? (
        <>
          <div className="wb-divider wb-divider--vertical wb-desktop-only" />
          <button
            type="button"
            className="wb-bottom-dock__action wb-bottom-dock__action--danger"
            onClick={handleDeleteSelection}
            title="Delete selection"
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </>
      ) : null}
    </div>
  );
}
