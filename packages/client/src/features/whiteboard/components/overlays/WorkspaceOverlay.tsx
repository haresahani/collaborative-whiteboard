import { useMemo } from "react";
import { getSelectionBounds } from "../../engine/geometry/bounds";
import { useBoardStore } from "../../store/boardStore";
import { useSelectionStore } from "../../store/selectionStore";

export default function WorkspaceOverlay() {
  const elements = useBoardStore((state) => state.elements);
  const selectedIds = useSelectionStore((state) => state.selectedIds);

  const selectedElements = useMemo(
    () => elements.filter((element) => selectedIds.includes(element.id)),
    [elements, selectedIds],
  );

  const selectionBounds = useMemo(() => {
    if (selectedElements.length === 0) return null;
    return getSelectionBounds(selectedElements);
  }, [selectedElements]);

  const selectionWidth = selectionBounds
    ? Math.round(selectionBounds.maxX - selectionBounds.minX)
    : 0;
  const selectionHeight = selectionBounds
    ? Math.round(selectionBounds.maxY - selectionBounds.minY)
    : 0;

  const activeElements = useMemo(
    () => elements.filter((element) => !(element as Record<string, unknown>).tombstoned),
    [elements],
  );

  return (
    <>
      {activeElements.length === 0 ? (
        <div className="wb-empty-state">
          <h2>Welcome to Collaboard.</h2>
          <p>Start sketching, brainstorming, or import files.</p>
        </div>
      ) : null}

      <div className="wb-canvas-stats">
        {selectionBounds ? (
          <span>{`${selectionWidth} x ${selectionHeight}`}</span>
        ) : null}
        <span>
          {selectedIds.length > 0
            ? `${selectedIds.length} element${selectedIds.length === 1 ? "" : "s"}`
            : `${activeElements.length} element${activeElements.length === 1 ? "" : "s"}`}
        </span>
      </div>
    </>
  );
}
