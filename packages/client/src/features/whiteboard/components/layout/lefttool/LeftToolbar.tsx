import { ChevronDown, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState, type KeyboardEvent } from "react";
import { cn } from "../../../../../lib/utils";
import { getBounds, getSelectionBounds } from "../../../engine/geometry/bounds";
import type { Element, LineStyle } from "../../../models/element";
import { useBoardStore } from "../../../store/boardStore";
import { useHistoryStore } from "../../../store/historyStore";
import { useSelectionStore } from "../../../store/selectionStore";
import { useToolStore } from "../../../store/toolStore";
import {
  ALIGNMENT_ACTIONS,
  COLOR_SWATCHES,
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
  FUTURE_TOOL_HINTS,
  LINE_STYLE_OPTIONS,
  TOOL_RAIL_ITEMS,
  TOOL_RAIL_SECTIONS,
  WIDTH_OPTIONS,
  getToolDefinition,
} from "./lefttoolData";

interface LeftToolbarProps {
  isOpen: boolean;
  isSurfaceOpen: boolean;
  onClose: () => void;
  onSurfaceOpenChange: (isOpen: boolean) => void;
}

interface PositionFieldsProps {
  initialX: number;
  initialY: number;
  onCommit: (axis: "x" | "y", value: string) => void;
}

function PositionFields({
  initialX,
  initialY,
  onCommit,
}: PositionFieldsProps) {
  const [draftX, setDraftX] = useState(() => String(Math.round(initialX)));
  const [draftY, setDraftY] = useState(() => String(Math.round(initialY)));

  return (
    <div className="wb-lefttool__position-grid">
      <label className="wb-lefttool__position-field">
        <span>X</span>
        <input
          type="number"
          value={draftX}
          onBlur={() => onCommit("x", draftX)}
          onChange={(event) => setDraftX(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onCommit("x", draftX);
            }
          }}
        />
      </label>

      <label className="wb-lefttool__position-field">
        <span>Y</span>
        <input
          type="number"
          value={draftY}
          onBlur={() => onCommit("y", draftY)}
          onChange={(event) => setDraftY(event.target.value)}
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

function formatSelectionTypes(selectionTypes: string[]) {
  if (selectionTypes.length === 0) return "No selection";
  if (selectionTypes.length === 1) {
    return selectionTypes[0][0]?.toUpperCase() + selectionTypes[0].slice(1);
  }

  return `${selectionTypes.length} types`;
}

function linePreviewClassName(lineStyle: LineStyle) {
  if (lineStyle === "dashed") return "wb-lefttool__line-preview is-dashed";
  if (lineStyle === "dotted") return "wb-lefttool__line-preview is-dotted";
  return "wb-lefttool__line-preview";
}

export default function LeftToolbar({
  isOpen,
  isSurfaceOpen,
  onClose,
  onSurfaceOpenChange,
}: LeftToolbarProps) {
  const tool = useToolStore((state) => state.tool);
  const setTool = useToolStore((state) => state.setTool);
  const color = useToolStore((state) => state.color);
  const setColor = useToolStore((state) => state.setColor);
  const fillColor = useToolStore((state) => state.fillColor);
  const setFillColor = useToolStore((state) => state.setFillColor);
  const width = useToolStore((state) => state.width);
  const setWidth = useToolStore((state) => state.setWidth);
  const lineStyle = useToolStore((state) => state.lineStyle);
  const setLineStyle = useToolStore((state) => state.setLineStyle);
  const fontFamily = useToolStore((state) => state.fontFamily);
  const setFontFamily = useToolStore((state) => state.setFontFamily);
  const fontSize = useToolStore((state) => state.fontSize);
  const setFontSize = useToolStore((state) => state.setFontSize);

  const elements = useBoardStore((state) => state.elements);
  const setElements = useBoardStore((state) => state.setElements);

  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const clearSelection = useSelectionStore((state) => state.clearSelection);
  const setSelection = useSelectionStore((state) => state.setSelection);

  const pushHistory = useHistoryStore((state) => state.push);

  const activeTool = getToolDefinition(tool);

  const selectedElements = useMemo(
    () => elements.filter((element) => selectedIds.includes(element.id)),
    [elements, selectedIds],
  );

  const selectionBounds = useMemo(() => {
    if (selectedElements.length === 0) return null;
    return getSelectionBounds(selectedElements);
  }, [selectedElements]);

  const selectionTypes = useMemo(
    () =>
      Array.from(new Set(selectedElements.map((element) => element.type))).sort(),
    [selectedElements],
  );

  const isSelectionInspector =
    tool === "select" && selectedElements.length > 0 && selectionBounds !== null;

  const selectionColor =
    selectedElements[0]?.style.strokeColor ?? color;
  const selectionFillColor =
    selectedElements.find((element) => element.type === "rectangle")?.style
      .fillColor ?? fillColor;
  const selectionWidth =
    selectedElements[0]?.style.strokeWidth ?? width;
  const selectionLineStyle =
    selectedElements[0]?.style.lineStyle ?? lineStyle;
  const selectionFontFamily =
    selectedElements[0]?.type === "text"
      ? selectedElements[0].fontFamily ?? fontFamily
      : fontFamily;
  const selectionFontSize =
    selectedElements[0]?.type === "text"
      ? selectedElements[0].fontSize
      : fontSize;

  const selectionSupportsFill =
    selectedElements.length > 0 &&
    selectedElements.every((element) => element.type === "rectangle");
  const selectionSupportsStrokeControls =
    selectedElements.length > 0 &&
    selectedElements.every((element) => element.type !== "text");
  const selectionSupportsTextControls =
    selectedElements.length > 0 &&
    selectedElements.every((element) => element.type === "text");

  const currentWidthIndex = Math.max(
    0,
    WIDTH_OPTIONS.indexOf(
      isSelectionInspector ? selectionWidth : width,
    ),
  );

  function focusToolButton(index: number) {
    const button = document.querySelector<HTMLButtonElement>(
      `[data-lefttool-index="${index}"]`,
    );
    button?.focus();
  }

  function handleRailKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = Number(
      (event.target as HTMLElement | null)?.getAttribute("data-lefttool-index") ??
        TOOL_RAIL_ITEMS.findIndex((item) => item.tool === tool),
    );

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusToolButton((currentIndex + 1) % TOOL_RAIL_ITEMS.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusToolButton(
        (currentIndex - 1 + TOOL_RAIL_ITEMS.length) % TOOL_RAIL_ITEMS.length,
      );
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusToolButton(0);
    }

    if (event.key === "End") {
      event.preventDefault();
      focusToolButton(TOOL_RAIL_ITEMS.length - 1);
    }
  }

  function updateSelectedElements(updater: (element: Element) => Element) {
    if (selectedIds.length === 0) return;

    pushHistory(elements);
    setElements(
      elements.map((element) =>
        selectedIds.includes(element.id) ? updater(element) : element,
      ),
    );
  }

  function alignSelection(mode: "left" | "center" | "right") {
    if (!selectionBounds) return;

    updateSelectedElements((element) => {
      const elementBounds = getBounds(element);
      const currentCenter = elementBounds.x + elementBounds.width / 2;
      const targetLeft = selectionBounds.minX;
      const targetCenter =
        (selectionBounds.minX + selectionBounds.maxX) / 2;
      const targetRight = selectionBounds.maxX;

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
    if (!selectionBounds) return;

    const nextValue = Number(rawValue);

    if (Number.isNaN(nextValue)) return;

    const currentValue = axis === "x" ? selectionBounds.minX : selectionBounds.minY;

    updateSelectedElements((element) =>
      translateElement(
        element,
        axis === "x" ? nextValue - currentValue : 0,
        axis === "y" ? nextValue - currentValue : 0,
      ),
    );
  }

  function handleDeleteSelection() {
    if (selectedIds.length === 0) return;

    pushHistory(elements);
    setElements(
      elements.filter((element) => !selectedIds.includes(element.id)),
    );
    clearSelection();
  }

  function handleStrokeColorChange(nextColor: string) {
    setColor(nextColor);

    if (!isSelectionInspector) return;

    updateSelectedElements((element) => ({
      ...element,
      style: {
        ...element.style,
        strokeColor: nextColor,
      },
      updatedAt: Date.now(),
    }));
  }

  function handleFillColorChange(nextColor: string) {
    setFillColor(nextColor);

    if (!isSelectionInspector || !selectionSupportsFill) return;

    updateSelectedElements((element) => {
      if (element.type !== "rectangle") return element;

      return {
        ...element,
        style: {
          ...element.style,
          fillColor: nextColor,
        },
        updatedAt: Date.now(),
      };
    });
  }

  function handleWidthChange(nextWidth: number) {
    setWidth(nextWidth);

    if (!isSelectionInspector || !selectionSupportsStrokeControls) return;

    updateSelectedElements((element) => ({
      ...element,
      style: {
        ...element.style,
        strokeWidth: nextWidth,
      },
      updatedAt: Date.now(),
    }));
  }

  function handleLineStyleChange(nextLineStyle: LineStyle) {
    setLineStyle(nextLineStyle);

    if (!isSelectionInspector || !selectionSupportsStrokeControls) return;

    updateSelectedElements((element) => ({
      ...element,
      style: {
        ...element.style,
        lineStyle: nextLineStyle,
      },
      updatedAt: Date.now(),
    }));
  }

  function handleFontFamilyChange(nextFontFamily: string) {
    setFontFamily(nextFontFamily);

    if (!isSelectionInspector || !selectionSupportsTextControls) return;

    updateSelectedElements((element) => {
      if (element.type !== "text") return element;

      return {
        ...element,
        fontFamily: nextFontFamily,
        updatedAt: Date.now(),
      };
    });
  }

  function handleFontSizeChange(nextFontSize: number) {
    setFontSize(nextFontSize);

    if (!isSelectionInspector || !selectionSupportsTextControls) return;

    updateSelectedElements((element) => {
      if (element.type !== "text") return element;

      return {
        ...element,
        fontSize: nextFontSize,
        updatedAt: Date.now(),
      };
    });
  }

  function handleWidthSliderChange(index: number) {
    const nextWidth = WIDTH_OPTIONS[index];

    if (nextWidth) {
      handleWidthChange(nextWidth);
    }
  }

  function setBoardTool(nextTool: typeof tool) {
    setTool(nextTool);
    if (nextTool !== "select") {
      clearSelection();
    }
    onSurfaceOpenChange(true);
  }

  function renderColorField(
    label: string,
    value: string,
    onChange: (value: string) => void,
  ) {
    return (
      <div className="wb-lefttool__field">
        <span>{label}</span>
        <label className="wb-lefttool__color-field">
          <span
            className="wb-lefttool__color-preview"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-label={label}
          />
        </label>
      </div>
    );
  }

  function renderPalette() {
    const activeColor = isSelectionInspector ? selectionColor : color;

    return (
      <section className="wb-lefttool__section wb-lefttool__section--footer">
        <div className="wb-lefttool__section-head">
          <div>
            <h3>Color Palette</h3>
            <span>Fast presets for the active tool or selection.</span>
          </div>
        </div>

        <div className="wb-lefttool__swatches">
          {COLOR_SWATCHES.map((swatch) => (
            <button
              key={swatch}
              type="button"
              className={cn(
                "wb-lefttool__swatch",
                activeColor === swatch && "is-active",
              )}
              style={{ backgroundColor: swatch }}
              onClick={() => handleStrokeColorChange(swatch)}
              aria-label={`Use ${swatch} as the stroke color`}
            />
          ))}

          <label className="wb-lefttool__swatch wb-lefttool__swatch--picker">
            <Plus size={14} />
            <input
              type="color"
              value={activeColor}
              onChange={(event) => handleStrokeColorChange(event.target.value)}
              aria-label="Choose a custom stroke color"
            />
          </label>
        </div>
      </section>
    );
  }

  function renderStrokeControls(options: {
    showWidth?: boolean;
    showFill?: boolean;
    showLineStyle?: boolean;
    colorValue: string;
    fillValue: string;
    widthValue: number;
    lineStyleValue: LineStyle;
  }) {
    return (
      <section className="wb-lefttool__section">
        <div className="wb-lefttool__section-head">
          <div>
            <h3>Primary Properties</h3>
            <span>Adjust the controls that affect the next canvas action.</span>
          </div>
        </div>

        <div className="wb-lefttool__field-grid wb-lefttool__field-grid--style">
          {renderColorField("Stroke Color", options.colorValue, handleStrokeColorChange)}

          {options.showFill
            ? renderColorField("Fill Color", options.fillValue, handleFillColorChange)
            : null}

          {options.showWidth !== false ? (
            <label className="wb-lefttool__field">
              <span>Stroke Width</span>
              <div className="wb-lefttool__thickness">
                <select
                  className="wb-lefttool__select"
                  value={String(options.widthValue)}
                  onChange={(event) => handleWidthChange(Number(event.target.value))}
                >
                  {WIDTH_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}px
                    </option>
                  ))}
                </select>

                <input
                  className="wb-lefttool__range"
                  type="range"
                  min={0}
                  max={WIDTH_OPTIONS.length - 1}
                  step={1}
                  value={currentWidthIndex}
                  onChange={(event) =>
                    handleWidthSliderChange(Number(event.target.value))
                  }
                  aria-label="Stroke width"
                />
              </div>
            </label>
          ) : null}

          {options.showLineStyle ? (
            <label className="wb-lefttool__field">
              <span>Line Style</span>
              <div className="wb-lefttool__style-select">
                <select
                  className="wb-lefttool__select"
                  value={options.lineStyleValue}
                  onChange={(event) =>
                    handleLineStyleChange(event.target.value as LineStyle)
                  }
                >
                  {LINE_STYLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <span className={linePreviewClassName(options.lineStyleValue)} />
              </div>
            </label>
          ) : null}
        </div>
      </section>
    );
  }

  function renderTextControls(fontFamilyValue: string, fontSizeValue: number) {
    return (
      <section className="wb-lefttool__section">
        <div className="wb-lefttool__section-head">
          <div>
            <h3>Typography</h3>
            <span>Set the defaults for inline editing and text rendering.</span>
          </div>
        </div>

        <div className="wb-lefttool__field-grid wb-lefttool__field-grid--two">
          <label className="wb-lefttool__field">
            <span>Font Family</span>
            <select
              className="wb-lefttool__select"
              value={fontFamilyValue}
              onChange={(event) => handleFontFamilyChange(event.target.value)}
            >
              {FONT_FAMILY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="wb-lefttool__field">
            <span>Font Size</span>
            <select
              className="wb-lefttool__select"
              value={String(fontSizeValue)}
              onChange={(event) => handleFontSizeChange(Number(event.target.value))}
            >
              {FONT_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}px
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
    );
  }

  function renderSelectionInspector() {
    if (!selectionBounds) return null;

    return (
      <>
        <section className="wb-lefttool__section">
          <div className="wb-lefttool__section-head">
            <div>
              <h3>Quick Actions</h3>
              <span>Selection controls only appear while the select tool is active.</span>
            </div>
          </div>

          <div className="wb-lefttool__inspector-group">
            <span>Alignment</span>
            <div className="wb-lefttool__mini-actions">
              {ALIGNMENT_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="wb-lefttool__mini-button"
                  onClick={() => alignSelection(action.mode)}
                  aria-label={action.label}
                >
                  <action.Icon size={14} />
                </button>
              ))}
            </div>
          </div>

          <div className="wb-lefttool__inspector-group">
            <span>Position</span>
            <PositionFields
              key={`${selectedIds.join(",")}:${Math.round(selectionBounds.minX)}:${Math.round(selectionBounds.minY)}`}
              initialX={selectionBounds.minX}
              initialY={selectionBounds.minY}
              onCommit={commitPosition}
            />
          </div>

          <div className="wb-lefttool__mini-actions">
            <button
              type="button"
              className="wb-lefttool__mini-button"
              onClick={() => setSelection([])}
            >
              Clear Selection
            </button>
            <button
              type="button"
              className="wb-lefttool__mini-button wb-lefttool__mini-button--danger"
              onClick={handleDeleteSelection}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </section>

        {renderStrokeControls({
          showWidth: selectionSupportsStrokeControls,
          showFill: selectionSupportsFill,
          showLineStyle: selectionSupportsStrokeControls,
          colorValue: selectionColor,
          fillValue: selectionFillColor,
          widthValue: selectionWidth,
          lineStyleValue: selectionLineStyle,
        })}

        {selectionSupportsTextControls
          ? renderTextControls(selectionFontFamily, selectionFontSize)
          : null}

        {!selectionSupportsStrokeControls && !selectionSupportsTextControls ? (
          <section className="wb-lefttool__section">
            <p className="wb-lefttool__section-note">
              Mixed selections keep the inspector focused on actions that are safe
              across different element types.
            </p>
          </section>
        ) : null}

        {renderPalette()}
      </>
    );
  }

  function renderActiveToolInspector() {
    if (activeTool.inspectorKind === "selection") {
      return (
        <>
          <section className="wb-lefttool__section">
            <div className="wb-lefttool__section-head">
              <div>
                <h3>Selection Mode</h3>
                <span>Click or marquee objects to inspect them here.</span>
              </div>
            </div>

            <ul className="wb-lefttool__supporting-list">
              <li>Single click to select an element.</li>
              <li>Drag on empty space to create a marquee.</li>
              <li>Once selected, position and appearance controls appear here.</li>
            </ul>
          </section>

          <section className="wb-lefttool__section">
            <div className="wb-lefttool__section-head">
              <div>
                <h3>Roadmap Notes</h3>
                <span>Secondary utilities stay out of the core drawing rail.</span>
              </div>
            </div>

            <ul className="wb-lefttool__supporting-list">
              {FUTURE_TOOL_HINTS.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          </section>
        </>
      );
    }

    if (activeTool.inspectorKind === "draw") {
      return (
        <>
          {renderStrokeControls({
            showFill: false,
            showLineStyle: true,
            colorValue: color,
            fillValue: fillColor,
            widthValue: width,
            lineStyleValue: lineStyle,
          })}
          {renderPalette()}
        </>
      );
    }

    if (activeTool.inspectorKind === "shape") {
      return (
        <>
          {renderStrokeControls({
            showFill: true,
            showLineStyle: true,
            colorValue: color,
            fillValue: fillColor,
            widthValue: width,
            lineStyleValue: lineStyle,
          })}
          {renderPalette()}
        </>
      );
    }

    if (activeTool.inspectorKind === "arrow") {
      return (
        <>
          {renderStrokeControls({
            showFill: false,
            showLineStyle: true,
            colorValue: color,
            fillValue: fillColor,
            widthValue: width,
            lineStyleValue: lineStyle,
          })}
          {renderPalette()}
        </>
      );
    }

    if (activeTool.inspectorKind === "text") {
      return (
        <>
          <section className="wb-lefttool__section">
            <div className="wb-lefttool__section-head">
              <div>
                <h3>Primary Properties</h3>
                <span>Text is created once, edited inline, then returned to select.</span>
              </div>
            </div>

            <div className="wb-lefttool__field-grid wb-lefttool__field-grid--two">
              {renderColorField("Text Color", color, handleStrokeColorChange)}
            </div>
          </section>

          {renderTextControls(fontFamily, fontSize)}
          {renderPalette()}
        </>
      );
    }

    return (
      <section className="wb-lefttool__section">
        <div className="wb-lefttool__section-head">
          <div>
            <h3>Eraser Size</h3>
            <span>The eraser remains active so you can scrub multiple elements.</span>
          </div>
        </div>

        <div className="wb-lefttool__field-grid wb-lefttool__field-grid--two">
          <label className="wb-lefttool__field">
            <span>Radius</span>
            <div className="wb-lefttool__thickness">
              <select
                className="wb-lefttool__select"
                value={String(width)}
                onChange={(event) => handleWidthChange(Number(event.target.value))}
              >
                {WIDTH_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}px
                  </option>
                ))}
              </select>

              <input
                className="wb-lefttool__range"
                type="range"
                min={0}
                max={WIDTH_OPTIONS.length - 1}
                step={1}
                value={currentWidthIndex}
                onChange={(event) =>
                  handleWidthSliderChange(Number(event.target.value))
                }
                aria-label="Eraser size"
              />
            </div>
          </label>
        </div>
      </section>
    );
  }

  const heroTitle = isSelectionInspector
    ? `${selectedElements.length} selected`
    : activeTool.label;
  const heroDescription = isSelectionInspector
    ? `Editing ${formatSelectionTypes(selectionTypes).toLowerCase()} with contextual controls.`
    : activeTool.description;

  return (
    <aside
      className={cn("wb-lefttool", isOpen && "wb-lefttool--open")}
      aria-label="Whiteboard tools"
    >
      <div
        className="wb-lefttool__rail"
        role="toolbar"
        aria-orientation="vertical"
        onKeyDown={handleRailKeyDown}
      >
        <button
          type="button"
          className="wb-icon-button wb-mobile-only"
          onClick={onClose}
          aria-label="Close tools"
        >
          <X size={16} />
        </button>

        {TOOL_RAIL_SECTIONS.map((section, sectionIndex) => {
          const startingIndex = TOOL_RAIL_SECTIONS.slice(0, sectionIndex).reduce(
            (count, currentSection) => count + currentSection.items.length,
            0,
          );

          return (
            <div key={section.id} className="wb-lefttool__rail-section">
              {section.items.map((item, itemIndex) => {
                const isActive = item.tool === tool;
                const buttonIndex = startingIndex + itemIndex;

                return (
                  <button
                    key={item.tool}
                    type="button"
                    data-lefttool-index={buttonIndex}
                    className={cn(
                      "wb-lefttool__rail-button",
                      isActive && "is-active",
                    )}
                    onClick={() => setBoardTool(item.tool)}
                    aria-label={`${item.label} tool`}
                    aria-keyshortcuts={item.shortcut.toLowerCase()}
                    aria-pressed={isActive}
                    title={`${item.label} (${item.shortcut})`}
                  >
                    <item.Icon size={18} />
                  </button>
                );
              })}

              {sectionIndex < TOOL_RAIL_SECTIONS.length - 1 ? (
                <div className="wb-lefttool__rail-divider" aria-hidden="true" />
              ) : null}
            </div>
          );
        })}
      </div>

      {isSurfaceOpen ? (
        <div className="wb-lefttool__surface-wrap">
          <div className="wb-lefttool__surface">
            <section className="wb-lefttool__section wb-lefttool__section--hero">
              <div className="wb-lefttool__surface-head">
                <div className="wb-lefttool__surface-copy">
                  <span>{isSelectionInspector ? "CONTEXT INSPECTOR" : "ACTIVE TOOL"}</span>
                  <strong>{heroTitle}</strong>
                  <p>{heroDescription}</p>
                </div>

                <button
                  type="button"
                  className="wb-icon-button wb-icon-button--small"
                  onClick={() => onSurfaceOpenChange(false)}
                  aria-label="Collapse inspector"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="wb-inspector__summary wb-lefttool__surface-summary">
                <span>{activeTool.shortcut}</span>
                <span>
                  {isSelectionInspector
                    ? `${Math.round(selectionBounds.maxX - selectionBounds.minX)} x ${Math.round(selectionBounds.maxY - selectionBounds.minY)}`
                    : activeTool.placement === "persistent"
                      ? "Persistent"
                      : "One-shot"}
                </span>
                {isSelectionInspector ? (
                  <span>{formatSelectionTypes(selectionTypes)}</span>
                ) : null}
              </div>
            </section>

            {isSelectionInspector ? renderSelectionInspector() : renderActiveToolInspector()}

            <section className="wb-lefttool__section">
              <div className="wb-lefttool__current-style">
                <div>
                  <strong>Board Controls</strong>
                  <span>Undo, redo, zoom, and clear stay in the bottom dock.</span>
                </div>
                <span className="wb-lefttool__badge">
                  <ChevronDown size={14} />
                </span>
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
