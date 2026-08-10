import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Trash2,
  Minimize2,
  ArrowUpToLine,
  ArrowDownToLine,
  Columns,
  Rows,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Download,
} from "lucide-react";
import { useMemo, useState } from "react";
import { getSelectionBounds } from "../../engine/geometry/bounds";
import {
  alignElements,
  deleteElements,
  reorderElements,
  setElementStyle,
  translateElements,
  type AlignMode,
  type ReorderMode,
} from "../../engine/mutations";
import type { ImageElement } from "../../models/element";
import { useBoardStore } from "../../store/boardStore";
import { useSelectionStore } from "../../store/selectionStore";
import { useToolStore } from "../../store/toolStore";
import { useViewportStore } from "../../store/viewportStore";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

interface PositionFieldsProps {
  initialX: number;
  initialY: number;
  onCommit: (axis: "x" | "y", value: string) => void;
}

function PositionFields({ initialX, initialY, onCommit }: PositionFieldsProps) {
  const [draftX, setDraftX] = useState(() => String(Math.round(initialX)));
  const [draftY, setDraftY] = useState(() => String(Math.round(initialY)));

  return (
    <div className="wb-property-position">
      <label>
        <span>X</span>
        <input
          type="number"
          value={draftX}
          onChange={(event) => setDraftX(event.target.value)}
          onBlur={() => onCommit("x", draftX)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onCommit("x", draftX);
            }
          }}
        />
      </label>

      <label>
        <span>Y</span>
        <input
          type="number"
          value={draftY}
          onChange={(event) => setDraftY(event.target.value)}
          onBlur={() => onCommit("y", draftY)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onCommit("y", draftY);
            }
          }}
        />
      </label>
    </div>
  );
}

export default function SelectionPropertyCards() {
  const elements = useBoardStore((state) => state.elements);
  const commit = useBoardStore((state) => state.commit);
  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const clearSelection = useSelectionStore((state) => state.clearSelection);

  const color = useToolStore((state) => state.color);
  const setColor = useToolStore((state) => state.setColor);
  const width = useToolStore((state) => state.width);
  const setWidth = useToolStore((state) => state.setWidth);

  const offsetX = useViewportStore((state) => state.offsetX);
  const offsetY = useViewportStore((state) => state.offsetY);
  const zoom = useViewportStore((state) => state.zoom);

  const selectedElements = useMemo(
    () => elements.filter((element) => selectedIds.includes(element.id)),
    [elements, selectedIds],
  );

  const selectionBounds = useMemo(() => {
    if (selectedElements.length === 0) return null;
    return getSelectionBounds(selectedElements);
  }, [selectedElements]);

  const activeColor = selectedElements[0]?.style.strokeColor ?? color;
  const activeWidth = selectedElements[0]?.style.strokeWidth ?? width;

  if (!selectionBounds) return null;
  const bounds = selectionBounds;

  function alignSelection(mode: AlignMode) {
    commit(alignElements(elements, selectedIds, mode));
  }

  function commitPosition(axis: "x" | "y", rawValue: string) {
    const currentValue = axis === "x" ? bounds.minX : bounds.minY;
    const nextValue = Number(rawValue);

    if (Number.isNaN(nextValue)) {
      return;
    }

    commit(
      translateElements(
        elements,
        selectedIds,
        axis === "x" ? nextValue - currentValue : 0,
        axis === "y" ? nextValue - currentValue : 0,
      ),
    );
  }

  function updateStrokeColor(nextColor: string) {
    setColor(nextColor);
    commit(
      setElementStyle(elements, selectedIds, { strokeColor: nextColor }),
      `style:strokeColor:${selectedIds.join(",")}`,
    );
  }

  function updateStrokeWidth(nextWidth: number) {
    setWidth(nextWidth);
    commit(
      setElementStyle(elements, selectedIds, { strokeWidth: nextWidth }),
      `style:strokeWidth:${selectedIds.join(",")}`,
    );
  }

  function reorderSelection(mode: ReorderMode) {
    commit(reorderElements(elements, selectedIds, mode));
  }

  function deleteSelection() {
    commit(deleteElements(elements, selectedIds));
    clearSelection();
  }

  function toggleFlipX() {
    const next = elements.map((el) => {
      if (selectedIds.includes(el.id) && el.type === "image") {
        return { ...el, flipX: !el.flipX, updatedAt: Date.now() };
      }
      return el;
    });
    commit(next);
  }

  function toggleFlipY() {
    const next = elements.map((el) => {
      if (selectedIds.includes(el.id) && el.type === "image") {
        return { ...el, flipY: !el.flipY, updatedAt: Date.now() };
      }
      return el;
    });
    commit(next);
  }

  function rotateSelectedImage() {
    const next = elements.map((el) => {
      if (selectedIds.includes(el.id) && el.type === "image") {
        const img = el as ImageElement;
        const oldW = img.width;
        const oldH = img.height;
        const cx = img.x + oldW / 2;
        const cy = img.y + oldH / 2;

        const newW = oldH;
        const newH = oldW;
        const newX = cx - newW / 2;
        const newY = cy - newH / 2;

        return {
          ...img,
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
          rotation: ((img.rotation || 0) + 90) % 360,
          updatedAt: Date.now(),
        };
      }
      return el;
    });
    commit(next);
  }

  function updateImageOpacity(opacity: number) {
    const next = elements.map((el) => {
      if (selectedIds.includes(el.id) && el.type === "image") {
        return { ...el, opacity, updatedAt: Date.now() };
      }
      return el;
    });
    commit(next);
  }

  function downloadSelectedImage() {
    const imageEl = selectedElements.find((el) => el.type === "image") as ImageElement | undefined;
    if (!imageEl || !imageEl.src) return;

    const a = document.createElement("a");
    a.href = imageEl.src;
    a.download = `whiteboard-image-${imageEl.id.slice(0, 8)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const viewportWidth =
    typeof window === "undefined" ? 1440 : window.innerWidth;
  const viewportHeight =
    typeof window === "undefined" ? 900 : window.innerHeight;

  const boxTop = bounds.minY * zoom + offsetY;
  const boxLeft = bounds.minX * zoom + offsetX;
  const boxRight = bounds.maxX * zoom + offsetX;

  const alignmentCardStyle = {
    left: clamp(boxLeft - 238, 88, Math.max(88, viewportWidth - 470)),
    top: clamp(boxTop + 14, 88, Math.max(88, viewportHeight - 220)),
    width: "230px",
    boxSizing: "border-box" as const,
  };

  const strokeCardStyle = {
    left: clamp(boxRight + 24, 88, Math.max(88, viewportWidth - 210)),
    top: clamp(boxTop + 24, 88, Math.max(88, viewportHeight - 210)),
    width: "230px",
    boxSizing: "border-box" as const,
  };

  return (
    <>
      <div
        className="wb-property-card wb-property-card--alignment"
        style={alignmentCardStyle}
      >
        <div className="wb-property-card__title">Alignment & Distribution</div>

        <div className="wb-property-segmented" style={{ marginBottom: "6px" }}>
          <button
            type="button"
            className="wb-property-icon-button"
            onClick={() => alignSelection("left")}
            title="Align Left"
          >
            <AlignLeft size={15} />
          </button>
          <button
            type="button"
            className="wb-property-icon-button"
            onClick={() => alignSelection("center")}
            title="Align Center"
          >
            <AlignCenter size={15} />
          </button>
          <button
            type="button"
            className="wb-property-icon-button"
            onClick={() => alignSelection("right")}
            title="Align Right"
          >
            <AlignRight size={15} />
          </button>
          <button
            type="button"
            className="wb-property-icon-button"
            onClick={() => alignSelection("top")}
            title="Align Top"
          >
            <ArrowUpToLine size={15} />
          </button>
          <button
            type="button"
            className="wb-property-icon-button"
            onClick={() => alignSelection("middle")}
            title="Align Middle"
          >
            <Minimize2 size={15} />
          </button>
          <button
            type="button"
            className="wb-property-icon-button"
            onClick={() => alignSelection("bottom")}
            title="Align Bottom"
          >
            <ArrowDownToLine size={15} />
          </button>
        </div>

        {selectedIds.length >= 3 ? (
          <div className="wb-property-segmented" style={{ marginBottom: "6px" }}>
            <button
              type="button"
              className="wb-property-icon-button"
              onClick={() => alignSelection("distribute-horizontal")}
              title="Distribute Horizontally"
            >
              <Columns size={15} />
            </button>
            <button
              type="button"
              className="wb-property-icon-button"
              onClick={() => alignSelection("distribute-vertical")}
              title="Distribute Vertically"
            >
              <Rows size={15} />
            </button>
          </div>
        ) : null}

        <div className="wb-property-card__subtitle" style={{ marginTop: "4px" }}>Layer Depth</div>
        <div className="wb-property-segmented" style={{ marginBottom: "6px" }}>
          <button
            type="button"
            className="wb-property-icon-button"
            onClick={() => reorderSelection("bringToFront")}
            title="Bring to Front"
          >
            <ChevronsUp size={15} />
          </button>
          <button
            type="button"
            className="wb-property-icon-button"
            onClick={() => reorderSelection("sendToBack")}
            title="Send to Back"
          >
            <ChevronsDown size={15} />
          </button>
        </div>

        {selectedElements.some((el) => el.type === "image") ? (
          <div className="wb-property-card__section" style={{ marginTop: "8px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "8px" }}>
            <div className="wb-property-card__subtitle">Image Options</div>
            <div className="wb-property-segmented" style={{ marginBottom: "6px" }}>
              <button
                type="button"
                className={`wb-property-icon-button ${selectedElements[0]?.type === "image" && (selectedElements[0] as ImageElement).flipX ? "is-active" : ""}`}
                onClick={toggleFlipX}
                title="Flip Horizontal"
              >
                <FlipHorizontal size={15} />
              </button>
              <button
                type="button"
                className={`wb-property-icon-button ${selectedElements[0]?.type === "image" && (selectedElements[0] as ImageElement).flipY ? "is-active" : ""}`}
                onClick={toggleFlipY}
                title="Flip Vertical"
              >
                <FlipVertical size={15} />
              </button>
              <button
                type="button"
                className="wb-property-icon-button"
                onClick={rotateSelectedImage}
                title="Rotate 90° Clockwise"
              >
                <RotateCw size={15} />
              </button>
              <button
                type="button"
                className="wb-property-icon-button"
                onClick={downloadSelectedImage}
                title="Download Image"
              >
                <Download size={15} />
              </button>
            </div>

            <div className="wb-property-stroke-row" style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", width: "100%", boxSizing: "border-box" }}>
              <span style={{ fontSize: "11px", opacity: 0.75, flexShrink: 0 }}>Opacity</span>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={(selectedElements[0] as ImageElement)?.opacity ?? 1}
                onChange={(e) => updateImageOpacity(Number(e.target.value))}
                aria-label="Image opacity"
                style={{ flex: "1 1 auto", minWidth: 0, width: "100%" }}
              />
              <span style={{ fontSize: "11px", minWidth: "28px", textAlign: "right", opacity: 0.85, flexShrink: 0 }}>
                {Math.round(((selectedElements[0] as ImageElement)?.opacity ?? 1) * 100)}%
              </span>
            </div>

            <button
              type="button"
              className="wb-property-delete"
              onClick={deleteSelection}
              style={{ marginTop: "8px", width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", borderRadius: "6px", backgroundColor: "rgba(239, 68, 68, 0.12)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}
            >
              <Trash2 size={14} />
              Delete Image
            </button>
          </div>
        ) : null}


        <div className="wb-property-card__subtitle">Position</div>

        <PositionFields
          key={`${selectedIds.join(",")}:${Math.round(bounds.minX)}:${Math.round(bounds.minY)}`}
          initialX={bounds.minX}
          initialY={bounds.minY}
          onCommit={commitPosition}
        />
      </div>

      {!selectedElements.every((el) => el.type === "image") ? (
        <div
          className="wb-property-card wb-property-card--stroke"
          style={strokeCardStyle}
        >
          <div className="wb-property-card__title">Stroke</div>

          <div className="wb-property-stroke-row">
            <label className="wb-property-color">
              <span
                className="wb-property-color__preview"
                style={{ backgroundColor: activeColor }}
              />
              <ChevronDown size={14} />
              <input
                type="color"
                value={activeColor}
                onChange={(event) => updateStrokeColor(event.target.value)}
                aria-label="Choose stroke color"
              />
            </label>
          </div>

          <div className="wb-property-width-row">
            <span>{activeWidth}px</span>
            <input
              type="range"
              min="1"
              max="10"
              value={activeWidth}
              onChange={(event) => updateStrokeWidth(Number(event.target.value))}
              aria-label="Change stroke width"
            />
            <button
              type="button"
              className="wb-property-delete"
              onClick={deleteSelection}
              aria-label="Delete selected elements"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
