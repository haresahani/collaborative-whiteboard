import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Italic,
  List,
  ListOrdered,
  Plus,
  Search,
  Strikethrough,
  Underline,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "../../../../../lib/utils";
import { useBoardStore } from "../../../store/boardStore";
import { useHistoryStore } from "../../../store/historyStore";
import { useSelectionStore } from "../../../store/selectionStore";
import { useToolStore } from "../../../store/toolStore";
import {
  BOARD_ACTION_ITEMS,
  COLOR_SWATCHES,
  CORE_SECTION_ITEMS,
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
  LINE_STYLE_OPTIONS,
  RAIL_TOOLS,
  SHAPE_MENU_ITEMS,
  TEXT_ASSET_ITEMS,
  WIDTH_OPTIONS,
  type LeftToolTile,
} from "./lefttoolData";

interface LeftToolbarProps {
  isOpen: boolean;
  isSurfaceOpen: boolean;
  onClose: () => void;
  onSurfaceOpenChange: (isOpen: boolean) => void;
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
  const width = useToolStore((state) => state.width);
  const setWidth = useToolStore((state) => state.setWidth);
  const elements = useBoardStore((state) => state.elements);
  const setElements = useBoardStore((state) => state.setElements);
  const undo = useBoardStore((state) => state.undo);
  const redo = useBoardStore((state) => state.redo);
  const clearSelection = useSelectionStore((state) => state.clearSelection);
  const canUndo = useHistoryStore((state) => state.past.length > 0);
  const canRedo = useHistoryStore((state) => state.future.length > 0);
  const pushHistory = useHistoryStore((state) => state.push);

  const shapesMenuRef = useRef<HTMLDivElement | null>(null);
  const [lineStyle, setLineStyle] = useState("Solid");
  const [fillColor, setFillColor] = useState("#f5f0e6");
  const [fontFamily, setFontFamily] = useState("Lato");
  const [fontSize, setFontSize] = useState("16px");
  const [textEffect, setTextEffect] = useState("Shadow");
  const [backgroundColor, setBackgroundColor] = useState("#fff7d8");
  const [isShapesMenuOpen, setIsShapesMenuOpen] = useState(false);

  const widthIndex = Math.max(0, WIDTH_OPTIONS.indexOf(width));
  const currentLineStylePreview = useMemo(() => {
    if (lineStyle === "Dashed") return "wb-lefttool__line-preview is-dashed";
    if (lineStyle === "Dotted") return "wb-lefttool__line-preview is-dotted";
    return "wb-lefttool__line-preview";
  }, [lineStyle]);

  useEffect(() => {
    if (!isShapesMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        shapesMenuRef.current &&
        event.target instanceof Node &&
        !shapesMenuRef.current.contains(event.target)
      ) {
        setIsShapesMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isShapesMenuOpen]);

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
      ) ?? RAIL_TOOLS.findIndex((item) => item.tool === tool),
    );

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusToolButton((currentIndex + 1) % RAIL_TOOLS.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusToolButton(
        (currentIndex - 1 + RAIL_TOOLS.length) % RAIL_TOOLS.length,
      );
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusToolButton(0);
    }

    if (event.key === "End") {
      event.preventDefault();
      focusToolButton(RAIL_TOOLS.length - 1);
    }
  }

  function isTileActive(item: LeftToolTile) {
    if (item.id === "shapes") {
      return isShapesMenuOpen || item.matches?.includes(tool) === true;
    }

    if (item.matches) {
      return item.matches.includes(tool);
    }

    if (item.tool) {
      return item.tool === tool;
    }

    return false;
  }

  function setBoardTool(nextTool: typeof tool) {
    setTool(nextTool);
    setIsShapesMenuOpen(false);
  }

  function handleTileClick(item: LeftToolTile) {
    if (item.disabled) return;

    if (item.id === "shapes") {
      setIsShapesMenuOpen((current) => !current);
      return;
    }

    if (item.tool) {
      setBoardTool(item.tool);
      return;
    }

    if (item.id === "undo" && canUndo) {
      undo();
    }

    if (item.id === "redo" && canRedo) {
      redo();
    }

    if (item.id === "clear" && elements.length > 0) {
      pushHistory(elements);
      setElements([]);
      clearSelection();
    }
  }

  function handleWidthSliderChange(index: number) {
    const nextWidth = WIDTH_OPTIONS[index];

    if (nextWidth) {
      setWidth(nextWidth);
    }
  }

  function renderTile(
    item: LeftToolTile,
    variant: "core" | "default" | "compact" = "default",
  ) {
    const isDisabled =
      item.disabled ||
      (item.id === "undo" && !canUndo) ||
      (item.id === "redo" && !canRedo) ||
      (item.id === "clear" && elements.length === 0);
    const isActive = isTileActive(item);

    return (
      <button
        key={item.id}
        type="button"
        className={cn(
          "wb-lefttool__tile",
          variant === "core" && "wb-lefttool__tile--core",
          variant === "compact" && "wb-lefttool__tile--compact",
          isActive && "is-active",
          isDisabled && "is-disabled",
        )}
        onClick={() => handleTileClick(item)}
        disabled={isDisabled}
        aria-pressed={item.tool ? isActive : undefined}
      >
        <span className="wb-lefttool__tile-icon">
          <item.Icon size={variant === "compact" ? 20 : 22} />
        </span>
        <span className="wb-lefttool__tile-copy">
          <strong>{item.label}</strong>
        </span>
      </button>
    );
  }

  function renderShapesMenu() {
    if (!isShapesMenuOpen) return null;

    return (
      <div
        ref={shapesMenuRef}
        className="wb-lefttool__shape-menu"
        role="dialog"
        aria-label="Shape picker"
      >
        <div className="wb-lefttool__shape-grid">
          {SHAPE_MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "wb-lefttool__shape-button",
                item.tool === tool && "is-active",
                item.disabled && "is-disabled",
              )}
              onClick={() => item.tool && setBoardTool(item.tool)}
              disabled={item.disabled}
              aria-label={item.label}
            >
              <item.Icon size={18} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderTextInspector() {
    return (
      <div className="wb-lefttool__popover wb-lefttool__popover--text">
        <div className="wb-lefttool__panel-heading">
          <span>TEXT STYLE</span>
          <strong>Typography controls</strong>
        </div>

        <label className="wb-lefttool__field">
          <span>Font Family</span>
          <select
            className="wb-lefttool__select"
            value={fontFamily}
            onChange={(event) => setFontFamily(event.target.value)}
          >
            {FONT_FAMILY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="wb-lefttool__field">
          <span>Search Fonts</span>
          <div className="wb-lefttool__search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search fonts"
              aria-label="Search fonts"
            />
          </div>
        </label>

        <div className="wb-lefttool__field-grid wb-lefttool__field-grid--two">
          <label className="wb-lefttool__field">
            <span>Font Size</span>
            <select
              className="wb-lefttool__select"
              value={fontSize}
              onChange={(event) => setFontSize(event.target.value)}
            >
              {FONT_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className="wb-lefttool__field">
            <span>Color</span>
            <label className="wb-lefttool__color-field">
              <span
                className="wb-lefttool__color-preview"
                style={{ backgroundColor: color }}
              />
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                aria-label="Text color"
              />
            </label>
          </div>
        </div>

        <div className="wb-lefttool__inspector-group">
          <span>Basic Formatting</span>
          <div className="wb-lefttool__mini-actions">
            <button
              type="button"
              className="wb-lefttool__mini-button is-selected"
            >
              <Bold size={14} />
            </button>
            <button type="button" className="wb-lefttool__mini-button">
              <Italic size={14} />
            </button>
            <button type="button" className="wb-lefttool__mini-button">
              <Underline size={14} />
            </button>
            <button type="button" className="wb-lefttool__mini-button">
              <Strikethrough size={14} />
            </button>
          </div>
        </div>

        <div className="wb-lefttool__inspector-group">
          <span>Alignment</span>
          <div className="wb-lefttool__mini-actions">
            <button
              type="button"
              className="wb-lefttool__mini-button is-selected"
            >
              <AlignLeft size={14} />
            </button>
            <button type="button" className="wb-lefttool__mini-button">
              <AlignCenter size={14} />
            </button>
            <button type="button" className="wb-lefttool__mini-button">
              <AlignRight size={14} />
            </button>
            <button type="button" className="wb-lefttool__mini-button">
              <AlignJustify size={14} />
            </button>
          </div>
        </div>

        <div className="wb-lefttool__inspector-group">
          <span>List</span>
          <div className="wb-lefttool__mini-actions">
            <button type="button" className="wb-lefttool__mini-button">
              <List size={14} />
            </button>
            <button type="button" className="wb-lefttool__mini-button">
              <ListOrdered size={14} />
            </button>
          </div>
        </div>

        <div className="wb-lefttool__field-grid wb-lefttool__field-grid--two">
          <label className="wb-lefttool__field">
            <span>Text Effects</span>
            <select
              className="wb-lefttool__select"
              value={textEffect}
              onChange={(event) => setTextEffect(event.target.value)}
            >
              <option value="Shadow">Text Shadow</option>
              <option value="Outline">Outline</option>
              <option value="None">None</option>
            </select>
          </label>

          <div className="wb-lefttool__field">
            <span>Background</span>
            <label className="wb-lefttool__color-field">
              <span
                className="wb-lefttool__color-preview"
                style={{ backgroundColor: backgroundColor }}
              />
              <input
                type="color"
                value={backgroundColor}
                onChange={(event) => setBackgroundColor(event.target.value)}
                aria-label="Text background color"
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

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

        {RAIL_TOOLS.map((item, index) => {
          const isActive = item.tool === tool;

          return (
            <button
              key={item.id}
              type="button"
              data-lefttool-index={index}
              className={cn(
                "wb-lefttool__rail-button",
                isActive && "is-active",
              )}
              onClick={() => {
                if (item.tool) {
                  setBoardTool(item.tool);
                  onSurfaceOpenChange(true);
                }
              }}
              aria-label={`${item.label} tool`}
              aria-keyshortcuts={item.shortcut?.toLowerCase()}
              aria-pressed={isActive}
            >
              <item.Icon size={18} />
            </button>
          );
        })}
      </div>

      {isSurfaceOpen ? (
        <>
          <div className="wb-lefttool__surface-wrap">
            <div className="wb-lefttool__surface">
              <section className="wb-lefttool__section">
                <div className="wb-lefttool__section-head">
                  <h3>Core Tools</h3>
                </div>
                <div className="wb-lefttool__tile-grid wb-lefttool__tile-grid--core">
                  {CORE_SECTION_ITEMS.map((item) => renderTile(item, "core"))}
                </div>
              </section>

              <section className="wb-lefttool__section">
                <div className="wb-lefttool__section-head">
                  <h3>Shape &amp; Line Styling</h3>
                </div>

                <div className="wb-lefttool__field-grid wb-lefttool__field-grid--style">
                  <div className="wb-lefttool__field">
                    <span>Fill Color</span>
                    <label className="wb-lefttool__color-field">
                      <span
                        className="wb-lefttool__color-preview"
                        style={{ backgroundColor: fillColor }}
                      />
                      <input
                        type="color"
                        value={fillColor}
                        onChange={(event) => setFillColor(event.target.value)}
                        aria-label="Primary fill color"
                      />
                    </label>
                  </div>

                  <div className="wb-lefttool__field">
                    <span>Line Color</span>
                    <label className="wb-lefttool__color-field">
                      <span
                        className="wb-lefttool__color-preview"
                        style={{ backgroundColor: color }}
                      />
                      <input
                        type="color"
                        value={color}
                        onChange={(event) => setColor(event.target.value)}
                        aria-label="Primary line color"
                      />
                    </label>
                  </div>

                  <label className="wb-lefttool__field">
                    <span>Line Thickness</span>
                    <div className="wb-lefttool__thickness">
                      <select
                        className="wb-lefttool__select"
                        value={String(width)}
                        onChange={(event) =>
                          setWidth(Number(event.target.value))
                        }
                      >
                        {WIDTH_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}pt
                          </option>
                        ))}
                      </select>
                      <input
                        className="wb-lefttool__range"
                        type="range"
                        min={0}
                        max={WIDTH_OPTIONS.length - 1}
                        step={1}
                        value={widthIndex}
                        onChange={(event) =>
                          handleWidthSliderChange(Number(event.target.value))
                        }
                        aria-label="Line thickness slider"
                      />
                    </div>
                  </label>

                  <label className="wb-lefttool__field">
                    <span>Line Style</span>
                    <div className="wb-lefttool__style-select">
                      <select
                        className="wb-lefttool__select"
                        value={lineStyle}
                        onChange={(event) => setLineStyle(event.target.value)}
                      >
                        {LINE_STYLE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <span className={currentLineStylePreview} />
                    </div>
                  </label>
                </div>
              </section>

              <section className="wb-lefttool__section">
                <div className="wb-lefttool__section-head">
                  <h3>Text &amp; Assets</h3>
                </div>
                <div className="wb-lefttool__tile-grid wb-lefttool__tile-grid--assets">
                  {TEXT_ASSET_ITEMS.map((item) => renderTile(item, "compact"))}
                </div>
              </section>

              <section className="wb-lefttool__section">
                <div className="wb-lefttool__section-head">
                  <h3>Board Actions</h3>
                </div>
                <div className="wb-lefttool__tile-grid wb-lefttool__tile-grid--actions">
                  {BOARD_ACTION_ITEMS.map((item) =>
                    renderTile(item, "compact"),
                  )}
                </div>
              </section>

              <section className="wb-lefttool__section wb-lefttool__section--footer">
                <div className="wb-lefttool__current-style">
                  <div>
                    <strong>Active Pen Style</strong>
                    <span>Current color, width</span>
                  </div>
                  <button type="button" className="wb-lefttool__mini-button">
                    <ChevronDown size={14} />
                  </button>
                </div>

                <div className="wb-lefttool__swatches">
                  {COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      className={cn(
                        "wb-lefttool__swatch",
                        color === swatch && "is-active",
                      )}
                      style={{ backgroundColor: swatch }}
                      onClick={() => setColor(swatch)}
                      aria-label={`Use ${swatch} as the current color`}
                    />
                  ))}

                  <label className="wb-lefttool__swatch wb-lefttool__swatch--picker">
                    <Plus size={14} />
                    <input
                      type="color"
                      value={color}
                      onChange={(event) => setColor(event.target.value)}
                      aria-label="Choose a custom palette color"
                    />
                  </label>
                </div>

                <div className="wb-lefttool__palette-actions">
                  <label className="wb-lefttool__palette-button">
                    <input
                      type="color"
                      value={fillColor}
                      onChange={(event) => setFillColor(event.target.value)}
                      aria-label="Add fill color"
                    />
                    <span>
                      <Plus size={14} />
                      Add Fill Color
                    </span>
                  </label>

                  <label className="wb-lefttool__palette-button wb-lefttool__palette-button--ghost">
                    <input
                      type="color"
                      value={color}
                      onChange={(event) => setColor(event.target.value)}
                      aria-label="Add line color"
                    />
                    <span>
                      <Plus size={14} />
                      Add Line Color
                    </span>
                  </label>
                </div>
              </section>
            </div>

            {renderShapesMenu()}
          </div>

          {tool === "text" ? renderTextInspector() : null}
        </>
      ) : null}
    </aside>
  );
}
