import {
  Plus,
  Trash2,
  X,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Download,
  ChevronsUp,
  ChevronsDown,
} from "lucide-react";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "../../../../../lib/utils";
import { getSelectionBounds } from "../../../engine/geometry/bounds";
import {
  alignElements,
  deleteElements,
  reorderElements,
  setElementStyle,
  translateElements,
  type AlignMode,
  type ElementStylePatch,
  type ReorderMode,
} from "../../../engine/mutations";
import type { ImageElement, LineStyle } from "../../../models/element";
import { useViewportStore } from "../../../store/viewportStore";
import { screenToWorld } from "../../../engine/viewport";
import { processImageFile } from "../../../utils/imageLoader";
import { useBoardStore } from "../../../store/boardStore";
import { useSelectionStore } from "../../../store/selectionStore";
import { useToolStore } from "../../../store/toolStore";
import {
  ALIGNMENT_ACTIONS,
  COLOR_SWATCHES,
  ERASER_SIZE_OPTIONS,
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
  onClose?: () => void;
  onSurfaceOpenChange: (isOpen: boolean) => void;
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
  const eraserSize = useToolStore((state) => state.eraserSize);
  const setEraserSize = useToolStore((state) => state.setEraserSize);
  const lineStyle = useToolStore((state) => state.lineStyle);
  const setLineStyle = useToolStore((state) => state.setLineStyle);
  const fontFamily = useToolStore((state) => state.fontFamily);
  const setFontFamily = useToolStore((state) => state.setFontFamily);
  const fontSize = useToolStore((state) => state.fontSize);
  const setFontSize = useToolStore((state) => state.setFontSize);

  const elements = useBoardStore((state) => state.elements);
  const commit = useBoardStore((state) => state.commit);

  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const clearSelection = useSelectionStore((state) => state.clearSelection);
  const setSelection = useSelectionStore((state) => state.setSelection);

  const activeTool = getToolDefinition(tool);

  const selectedElements = useMemo(
    () =>
      elements.filter(
        (element) =>
          !(element as unknown as Record<string, unknown>).tombstoned &&
          selectedIds.includes(element.id),
      ),
    [elements, selectedIds],
  );

  const selectionBounds = useMemo(() => {
    if (selectedElements.length === 0) return null;
    return getSelectionBounds(selectedElements);
  }, [selectedElements]);

  const selectionTypes = useMemo(
    () =>
      Array.from(
        new Set(selectedElements.map((element) => element.type)),
      ).sort(),
    [selectedElements],
  );

  const isSelectionInspector =
    tool === "select" &&
    selectedElements.length > 0 &&
    selectionBounds !== null;

  const selectionColor = selectedElements[0]?.style.strokeColor ?? color;
  const selectionFillColor =
    selectedElements.find((element) => element.type === "rectangle")?.style
      .fillColor ?? fillColor;
  const selectionWidth = selectedElements[0]?.style.strokeWidth ?? width;
  const selectionLineStyle = selectedElements[0]?.style.lineStyle ?? lineStyle;
  const selectionFontFamily =
    selectedElements[0]?.type === "text"
      ? (selectedElements[0].fontFamily ?? fontFamily)
      : fontFamily;
  const selectionFontSize =
    selectedElements[0]?.type === "text"
      ? selectedElements[0].fontSize
      : fontSize;

  const selectionSupportsStrokeControls =
    selectedElements.length > 0 &&
    selectedElements.every((element) => element.type !== "text" && element.type !== "image");
  const selectionSupportsTextControls =
    selectedElements.length > 0 &&
    selectedElements.every((element) => element.type === "text");

  const currentWidthIndex = Math.max(
    0,
    WIDTH_OPTIONS.indexOf(isSelectionInspector ? selectionWidth : width),
  );

  function focusToolButton(index: number) {
    const button = document.querySelector<HTMLButtonElement>(
      `[data-lefttool-index="${index}"]`,
    );
    button?.focus();
  }

  function handleRailKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = Number(
      (event.target as HTMLElement | null)?.getAttribute(
        "data-lefttool-index",
      ) ?? TOOL_RAIL_ITEMS.findIndex((item) => item.tool === tool),
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

  function applyStyleToSelection(patch: ElementStylePatch, coalesce = false) {
    if (!isSelectionInspector) return;

    commit(
      setElementStyle(elements, selectedIds, patch),
      coalesce
        ? `style:${Object.keys(patch).join("+")}:${selectedIds.join(",")}`
        : undefined,
    );
  }

  function alignSelection(mode: AlignMode) {
    commit(alignElements(elements, selectedIds, mode));
  }

  function commitPosition(axis: "x" | "y", rawValue: string) {
    if (!selectionBounds) return;

    const nextValue = Number(rawValue);

    if (Number.isNaN(nextValue)) return;

    const currentValue =
      axis === "x" ? selectionBounds.minX : selectionBounds.minY;

    commit(
      translateElements(
        elements,
        selectedIds,
        axis === "x" ? nextValue - currentValue : 0,
        axis === "y" ? nextValue - currentValue : 0,
      ),
    );
  }

  function handleDeleteSelection() {
    commit(deleteElements(elements, selectedIds));
    clearSelection();
  }

  function handleStrokeColorChange(nextColor: string) {
    setColor(nextColor);
    applyStyleToSelection({ strokeColor: nextColor }, true);
  }

  function handleFillColorChange(nextColor: string) {
    setFillColor(nextColor);
    applyStyleToSelection({ fillColor: nextColor }, true);
  }

  function handleWidthChange(nextWidth: number) {
    setWidth(nextWidth);
    applyStyleToSelection({ strokeWidth: nextWidth }, true);
  }

  function handleLineStyleChange(nextLineStyle: LineStyle) {
    setLineStyle(nextLineStyle);
    applyStyleToSelection({ lineStyle: nextLineStyle });
  }

  function handleFontFamilyChange(nextFontFamily: string) {
    setFontFamily(nextFontFamily);
    applyStyleToSelection({ fontFamily: nextFontFamily });
  }

  function handleFontSizeChange(nextFontSize: number) {
    setFontSize(nextFontSize);
    applyStyleToSelection({ fontSize: nextFontSize });
  }

  function handleWidthSliderChange(index: number) {
    const nextWidth = WIDTH_OPTIONS[index];

    if (nextWidth) {
      handleWidthChange(nextWidth);
    }
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleImageFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const { offsetX, offsetY, zoom } = useViewportStore.getState();
    const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1440;
    const screenHeight = typeof window !== "undefined" ? window.innerHeight : 900;
    const centerWorld = screenToWorld(
      { x: screenWidth / 2, y: screenHeight / 2 },
      { offsetX, offsetY, zoom },
    );

    processImageFile(
      file,
      centerWorld,
      elements.length,
      (imageElement) => {
        commit([...elements, imageElement]);
        setSelection([imageElement.id]);
        setTool("select");
      },
    );

    if (e.target) e.target.value = "";
  }

  function setBoardTool(nextTool: typeof tool) {
    if (nextTool === "image") {
      fileInputRef.current?.click();
      return;
    }

    if (nextTool === tool) {
      onSurfaceOpenChange(!isSurfaceOpen);
    } else {
      setTool(nextTool);
      if (nextTool !== "select") {
        clearSelection();
      }
      onSurfaceOpenChange(true);
    }
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
          {renderColorField(
            "Stroke Color",
            options.colorValue,
            handleStrokeColorChange,
          )}

          {options.showFill
            ? renderColorField(
                "Fill Color",
                options.fillValue,
                handleFillColorChange,
              )
            : null}

          {options.showWidth !== false ? (
            <label className="wb-lefttool__field">
              <span>Stroke Width</span>
              <div className="wb-lefttool__thickness">
                <select
                  className="wb-lefttool__select"
                  value={String(options.widthValue)}
                  onChange={(event) =>
                    handleWidthChange(Number(event.target.value))
                  }
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

                <span
                  className={linePreviewClassName(options.lineStyleValue)}
                />
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
              onChange={(event) =>
                handleFontSizeChange(Number(event.target.value))
              }
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

  function renderImageControls() {
    const selectedImage = selectedElements.find((el) => el.type === "image") as ImageElement | undefined;
    if (!selectedImage) return null;

    return (
      <section className="wb-lefttool__section">
        <div className="wb-lefttool__section-head">
          <div>
            <h3>Image Options</h3>
            <span>Transform, flip, rotate, or download selected image.</span>
          </div>
        </div>

        <div className="wb-lefttool__inspector-group">
          <span>Transform</span>
          <div className="wb-lefttool__mini-actions">
            <button
              type="button"
              className={cn("wb-lefttool__mini-button", selectedImage.flipX && "is-active")}
              onClick={toggleFlipX}
              title="Flip Horizontal"
            >
              <FlipHorizontal size={14} />
              Flip H
            </button>
            <button
              type="button"
              className={cn("wb-lefttool__mini-button", selectedImage.flipY && "is-active")}
              onClick={toggleFlipY}
              title="Flip Vertical"
            >
              <FlipVertical size={14} />
              Flip V
            </button>
            <button
              type="button"
              className="wb-lefttool__mini-button"
              onClick={rotateSelectedImage}
              title="Rotate 90° Clockwise"
            >
              <RotateCw size={14} />
              Rotate
            </button>
            <button
              type="button"
              className="wb-lefttool__mini-button"
              onClick={downloadSelectedImage}
              title="Download Image"
            >
              <Download size={14} />
            </button>
          </div>
        </div>

        <div className="wb-lefttool__field" style={{ marginTop: "8px" }}>
          <span>Opacity ({Math.round((selectedImage.opacity ?? 1) * 100)}%)</span>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            className="wb-lefttool__slider"
            value={selectedImage.opacity ?? 1}
            onChange={(e) => updateImageOpacity(Number(e.target.value))}
          />
        </div>
      </section>
    );
  }

  function reorderSelection(mode: ReorderMode) {
    commit(reorderElements(elements, selectedIds, mode));
  }

  function renderSelectionInspector() {
    if (!selectionBounds) return null;

    const count = selectedElements.length;
    const isSingle = count === 1;

    const isImageOnly = selectedElements.every((el) => el.type === "image");
    const isPathOnly = selectedElements.every((el) => el.type === "path");
    const isTextOnly = selectedElements.every((el) => el.type === "text");
    const isShapeOnly = selectedElements.every((el) =>
      ["rectangle", "ellipse"].includes(el.type),
    );

    return (
      <>
        <section className="wb-lefttool__section">
          <div className="wb-lefttool__inspector-group">
            <span>Positioning</span>
            <PositionFields
              key={`${selectedIds.join(",")}:${Math.round(selectionBounds.minX)}:${Math.round(selectionBounds.minY)}`}
              initialX={selectionBounds.minX}
              initialY={selectionBounds.minY}
              onCommit={commitPosition}
            />
          </div>

          {!isSingle ? (
            <div className="wb-lefttool__inspector-group" style={{ marginTop: "12px" }}>
              <span>Alignment & Distribution</span>
              <div className="wb-lefttool__mini-actions">
                {ALIGNMENT_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    className="wb-lefttool__mini-button"
                    onClick={() => alignSelection(action.mode)}
                    aria-label={action.label}
                    title={action.label}
                  >
                    <action.Icon size={14} />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="wb-lefttool__inspector-group" style={{ marginTop: "12px" }}>
            <span>Layer Depth</span>
            <div className="wb-lefttool__mini-actions">
              <button
                type="button"
                className="wb-lefttool__mini-button"
                onClick={() => reorderSelection("bringToFront")}
                title="Bring to Front"
              >
                <ChevronsUp size={14} />
                Bring to Front
              </button>
              <button
                type="button"
                className="wb-lefttool__mini-button"
                onClick={() => reorderSelection("sendToBack")}
                title="Send to Back"
              >
                <ChevronsDown size={14} />
                Send to Back
              </button>
            </div>
          </div>
        </section>

        {selectedElements.some((el) => el.type === "image") ? renderImageControls() : null}

        {isPathOnly || isShapeOnly
          ? renderStrokeControls({
              showWidth: true,
              showFill: false,
              showLineStyle: true,
              colorValue: selectionColor,
              fillValue: selectionFillColor,
              widthValue: selectionWidth,
              lineStyleValue: selectionLineStyle,
            })
          : null}

        {isTextOnly
          ? renderTextControls(selectionFontFamily, selectionFontSize)
          : null}

        {!selectionSupportsStrokeControls &&
        !selectionSupportsTextControls &&
        !isImageOnly &&
        !isPathOnly &&
        !isShapeOnly ? (
          <section className="wb-lefttool__section">
            <p className="wb-lefttool__section-note">
              Mixed selections keep the inspector focused on actions that are
              safe across different element types.
            </p>
          </section>
        ) : null}

        {isPathOnly || isShapeOnly || isTextOnly ? renderPalette() : null}

        <section className="wb-lefttool__section" style={{ marginTop: "8px" }}>
          <div className="wb-lefttool__mini-actions">
            <button
              type="button"
              className="wb-lefttool__mini-button"
              onClick={() => setSelection([])}
              style={{ flex: 1 }}
            >
              Clear Selection
            </button>
            <button
              type="button"
              className="wb-lefttool__mini-button wb-lefttool__mini-button--danger"
              onClick={handleDeleteSelection}
              style={{ flex: 1 }}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </section>
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
              <li>
                Once selected, position and appearance controls appear here.
              </li>
            </ul>
          </section>

          <section className="wb-lefttool__section">
            <div className="wb-lefttool__section-head">
              <div>
                <h3>Roadmap Notes</h3>
                <span>
                  Secondary utilities stay out of the core drawing rail.
                </span>
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
          {renderTextControls(fontFamily, fontSize)}
          {renderStrokeControls({
            showWidth: false,
            showFill: false,
            showLineStyle: false,
            colorValue: color,
            fillValue: fillColor,
            widthValue: width,
            lineStyleValue: lineStyle,
          })}
          {renderPalette()}
        </>
      );
    }

    const currentEraserIndex = Math.max(
      0,
      ERASER_SIZE_OPTIONS.indexOf(eraserSize),
    );

    return (
      <section className="wb-lefttool__section">
        <div className="wb-lefttool__section-head">
          <div>
            <h3>Eraser Size</h3>
            <span>
              The eraser remains active so you can scrub multiple elements.
            </span>
          </div>
        </div>

        <div className="wb-lefttool__field-grid wb-lefttool__field-grid--two">
          <label className="wb-lefttool__field">
            <span>Radius</span>
            <div className="wb-lefttool__thickness">
              <select
                className="wb-lefttool__select"
                value={String(eraserSize)}
                onChange={(event) => setEraserSize(Number(event.target.value))}
              >
                {ERASER_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}px
                  </option>
                ))}
              </select>

              <input
                className="wb-lefttool__range"
                type="range"
                min={0}
                max={ERASER_SIZE_OPTIONS.length - 1}
                step={1}
                value={currentEraserIndex}
                onChange={(event) => {
                  const next = ERASER_SIZE_OPTIONS[Number(event.target.value)];
                  if (next) setEraserSize(next);
                }}
                aria-label="Eraser size"
              />
            </div>
          </label>
        </div>
      </section>
    );
  }

  const heroTitle = isSelectionInspector
    ? "Selection Properties"
    : activeTool.label;
  const heroDescription = isSelectionInspector
    ? `${selectedElements.length} ${selectedElements.length === 1 ? "element" : "elements"} selected (${formatSelectionTypes(selectionTypes).toLowerCase()}).`
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

        {TOOL_RAIL_SECTIONS.map((section, sectionIndex) => {
          const startingIndex = TOOL_RAIL_SECTIONS.slice(
            0,
            sectionIndex,
          ).reduce(
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

      {isSurfaceOpen && (isSelectionInspector || (tool !== "select" && tool !== "hand")) ? (
        <div className="wb-lefttool__surface-wrap">
          <div className="wb-lefttool__surface">
            <section className="wb-lefttool__section wb-lefttool__section--hero">
              <div className="wb-lefttool__surface-head">
                <div className="wb-lefttool__surface-copy">
                  <span>
                    {isSelectionInspector ? "CONTEXT INSPECTOR" : "ACTIVE TOOL"}
                  </span>
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

            {isSelectionInspector
              ? renderSelectionInspector()
              : renderActiveToolInspector()}
          </div>
        </div>
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.gif,.ico,image/*"
        onChange={handleImageFileSelect}
        style={{ display: "none" }}
      />
    </aside>
  );
}
