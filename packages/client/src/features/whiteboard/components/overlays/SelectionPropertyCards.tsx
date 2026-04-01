import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { getBounds, getSelectionBounds } from "../../engine/geometry/bounds";
import type { Element } from "../../models/element";
import { useBoardStore } from "../../store/boardStore";
import { useHistoryStore } from "../../store/historyStore";
import { useSelectionStore } from "../../store/selectionStore";
import { useToolStore } from "../../store/toolStore";
import { useViewportStore } from "../../store/viewportStore";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function translateElement(element: Element, dx: number, dy: number): Element {
  if (element.type === "stroke") {
    return {
      ...element,
      x: element.x + dx,
      y: element.y + dy,
      points: element.points.map((point) => ({
        x: point.x + dx,
        y: point.y + dy,
      })),
      updatedAt: Date.now(),
    };
  }

  if (element.type === "rectangle" || element.type === "text") {
    return {
      ...element,
      x: element.x + dx,
      y: element.y + dy,
      updatedAt: Date.now(),
    };
  }

  return {
    ...element,
    x: element.x + dx,
    y: element.y + dy,
    x1: element.x1 + dx,
    x2: element.x2 + dx,
    y1: element.y1 + dy,
    y2: element.y2 + dy,
    startBinding: undefined,
    endBinding: undefined,
    updatedAt: Date.now(),
  };
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
  const setElements = useBoardStore((state) => state.setElements);
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

  function updateSelectedElements(updater: (element: Element) => Element) {
    if (selectedIds.length === 0) return;

    useHistoryStore.getState().push(elements);
    setElements(
      elements.map((element) =>
        selectedIds.includes(element.id) ? updater(element) : element,
      ),
    );
  }

  function translateSelection(dx: number, dy: number) {
    if (dx === 0 && dy === 0) return;
    updateSelectedElements((element) => translateElement(element, dx, dy));
  }

  function alignSelection(mode: "left" | "center" | "right") {
    updateSelectedElements((element) => {
      const elementBounds = getBounds(element);
      const currentCenter = elementBounds.x + elementBounds.width / 2;
      const targetLeft = bounds.minX;
      const targetCenter = (bounds.minX + bounds.maxX) / 2;
      const targetRight = bounds.maxX;

      let dx = 0;

      if (mode === "left") {
        dx = targetLeft - elementBounds.x;
      } else if (mode === "center") {
        dx = targetCenter - currentCenter;
      } else {
        dx = targetRight - (elementBounds.x + elementBounds.width);
      }

      return translateElement(element, dx, 0);
    });
  }

  function commitPosition(axis: "x" | "y", rawValue: string) {
    const currentValue = axis === "x" ? bounds.minX : bounds.minY;
    const nextValue = Number(rawValue);

    if (Number.isNaN(nextValue)) {
      return;
    }

    translateSelection(
      axis === "x" ? nextValue - currentValue : 0,
      axis === "y" ? nextValue - currentValue : 0,
    );
  }

  function updateStrokeColor(nextColor: string) {
    setColor(nextColor);
    updateSelectedElements((element) => ({
      ...element,
      style: {
        ...element.style,
        strokeColor: nextColor,
      },
      updatedAt: Date.now(),
    }));
  }

  function updateStrokeWidth(nextWidth: number) {
    setWidth(nextWidth);
    updateSelectedElements((element) => ({
      ...element,
      style: {
        ...element.style,
        strokeWidth: nextWidth,
      },
      updatedAt: Date.now(),
    }));
  }

  function deleteSelection() {
    useHistoryStore.getState().push(elements);
    setElements(
      elements.filter((element) => !selectedIds.includes(element.id)),
    );
    clearSelection();
  }

  const viewportWidth =
    typeof window === "undefined" ? 1440 : window.innerWidth;
  const viewportHeight =
    typeof window === "undefined" ? 900 : window.innerHeight;

  const boxTop = bounds.minY * zoom + offsetY;
  const boxLeft = bounds.minX * zoom + offsetX;
  const boxRight = bounds.maxX * zoom + offsetX;

  const alignmentCardStyle = {
    left: clamp(boxLeft - 224, 88, Math.max(88, viewportWidth - 470)),
    top: clamp(boxTop + 14, 88, Math.max(88, viewportHeight - 220)),
  };

  const strokeCardStyle = {
    left: clamp(boxRight + 24, 88, Math.max(88, viewportWidth - 210)),
    top: clamp(boxTop + 24, 88, Math.max(88, viewportHeight - 210)),
  };

  return (
    <>
      <div
        className="wb-property-card wb-property-card--alignment"
        style={alignmentCardStyle}
      >
        <div className="wb-property-card__title">Alignment</div>

        <div className="wb-property-segmented">
          <button
            type="button"
            className="wb-property-icon-button"
            onClick={() => alignSelection("left")}
          >
            <AlignLeft size={15} />
          </button>
          <button
            type="button"
            className="wb-property-icon-button"
            onClick={() => alignSelection("center")}
          >
            <AlignCenter size={15} />
          </button>
          <button
            type="button"
            className="wb-property-icon-button"
            onClick={() => alignSelection("right")}
          >
            <AlignRight size={15} />
          </button>
        </div>

        <div className="wb-property-card__subtitle">Position</div>

        <PositionFields
          key={`${selectedIds.join(",")}:${Math.round(bounds.minX)}:${Math.round(bounds.minY)}`}
          initialX={bounds.minX}
          initialY={bounds.minY}
          onCommit={commitPosition}
        />
      </div>

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
    </>
  );
}
