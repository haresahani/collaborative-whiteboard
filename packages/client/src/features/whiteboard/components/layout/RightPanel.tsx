import { ChevronRight, Info, Layers3, ScanSearch, Users } from "lucide-react";
import { useMemo, type CSSProperties } from "react";
import { cn } from "../../../../lib/utils";
import { getSelectionBounds } from "../../engine/geometry/bounds";
import { usePanelFocus } from "../../hooks/usePanelFocus";
import { useBoardStore } from "../../store/boardStore";
import { useSelectionStore } from "../../store/selectionStore";
import { useViewportStore } from "../../store/viewportStore";
import { ACTIVITY_FEED, COLLABORATORS } from "./uiData";

interface RightPanelProps {
  boardId: string;
  boardName: string;
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(timestamp: number | null) {
  if (!timestamp)
    return new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSelectionType(types: string[]) {
  if (types.length === 0) return "None";
  if (types.length === 1) return types[0][0].toUpperCase() + types[0].slice(1);
  return `${types.length} types`;
}

export default function RightPanel({
  boardId,
  boardName,
  isOpen,
  onClose,
}: RightPanelProps) {
  const closeButtonRef = usePanelFocus(isOpen);
  const elements = useBoardStore((state) => state.elements);
  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const zoom = useViewportStore((state) => state.zoom);

  const selectedElements = useMemo(
    () => elements.filter((element) => selectedIds.includes(element.id)),
    [elements, selectedIds],
  );

  const selectionBounds = useMemo(() => {
    if (selectedElements.length === 0) return null;
    return getSelectionBounds(selectedElements);
  }, [selectedElements]);

  const selectionTypes = useMemo(
    () => Array.from(new Set(selectedElements.map((element) => element.type))),
    [selectedElements],
  );

  const createdAt = useMemo(() => {
    if (elements.length === 0) return null;

    return elements.reduce(
      (earliest, element) => Math.min(earliest, element.createdAt),
      elements[0].createdAt,
    );
  }, [elements]);

  const lastEditedAt = useMemo(() => {
    if (elements.length === 0) return null;

    return elements.reduce(
      (latest, element) => Math.max(latest, element.updatedAt),
      elements[0].updatedAt,
    );
  }, [elements]);

  const dimensions = selectionBounds
    ? `${Math.round(selectionBounds.maxX - selectionBounds.minX)} x ${Math.round(
        selectionBounds.maxY - selectionBounds.minY,
      )} px`
    : "-";

  return (
    <>
      <button
        type="button"
        className={cn(
          "wb-overlay-backdrop",
          isOpen && "wb-overlay-backdrop--open",
        )}
        onClick={onClose}
        aria-label="Close board info"
      />

      <aside
        id="board-info-panel"
        className={cn("wb-right-panel", isOpen && "wb-right-panel--open")}
        aria-hidden={!isOpen}
        aria-labelledby="board-info-panel-title"
        role="dialog"
        tabIndex={-1}
      >
        <div className="wb-right-panel__shell">
          <div className="wb-right-panel__header">
            <div className="wb-right-panel__heading">
              <Info size={16} />
              <h3 id="board-info-panel-title" className="wb-right-panel__title">
                Board Info
              </h3>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              className="wb-icon-button wb-icon-button--small"
              onClick={onClose}
              aria-label="Close board info"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="wb-inspector">
            <section className="wb-inspector__section">
              <h4>Overview</h4>
              <dl className="wb-inspector__meta">
                <div>
                  <dt>Board</dt>
                  <dd>{boardName}</dd>
                </div>
                <div>
                  <dt>ID</dt>
                  <dd>#{boardId}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDate(createdAt)}</dd>
                </div>
                <div>
                  <dt>Modified</dt>
                  <dd>{formatDate(lastEditedAt)}</dd>
                </div>
                <div>
                  <dt>Zoom</dt>
                  <dd>{Math.round(zoom * 100)}%</dd>
                </div>
                <div>
                  <dt>Elements</dt>
                  <dd>
                    {elements.length} element{elements.length === 1 ? "" : "s"}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="wb-inspector__section">
              <div className="wb-inspector__section-title">
                <ScanSearch size={15} />
                <h4>Selection Details</h4>
              </div>
              <dl className="wb-inspector__meta">
                <div>
                  <dt>Type</dt>
                  <dd>{formatSelectionType(selectionTypes)}</dd>
                </div>
                <div>
                  <dt>Dimensions</dt>
                  <dd>{dimensions}</dd>
                </div>
                <div>
                  <dt>Layers</dt>
                  <dd>{selectedElements.length || "-"}</dd>
                </div>
              </dl>

              {selectionBounds ? (
                <div className="wb-inspector__summary">
                  <span>
                    X {Math.round(selectionBounds.minX)} / Y{" "}
                    {Math.round(selectionBounds.minY)}
                  </span>
                  <span>{selectionTypes.join(", ")}</span>
                </div>
              ) : (
                <p className="wb-inspector__empty">
                  Select an element on the canvas to inspect its footprint and
                  quick properties.
                </p>
              )}
            </section>

            <section className="wb-inspector__section">
              <div className="wb-inspector__section-title">
                <Users size={15} />
                <h4>Collaborators</h4>
              </div>

              <div className="wb-collaborator-list">
                {COLLABORATORS.map((collaborator) => (
                  <div key={collaborator.id} className="wb-collaborator-row">
                    <span
                      className="wb-collaborator-avatar"
                      style={
                        {
                          "--avatar-accent": collaborator.accent,
                        } as CSSProperties
                      }
                    >
                      {collaborator.initials}
                    </span>

                    <div className="wb-collaborator-meta">
                      <strong>{collaborator.name}</strong>
                      <span>{collaborator.role}</span>
                    </div>

                    <span className="wb-online-pill">
                      <span className="wb-online-pill__dot" />
                      {collaborator.isOnline ? "Online" : "Away"}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="wb-inspector__section">
              <div className="wb-inspector__section-title">
                <Layers3 size={15} />
                <h4>Activity Feed</h4>
              </div>

              <div className="wb-activity-list">
                {ACTIVITY_FEED.map((item) => (
                  <div key={item.id} className="wb-activity-row">
                    <span
                      className="wb-collaborator-avatar wb-collaborator-avatar--small"
                      style={
                        {
                          "--avatar-accent": item.accent,
                        } as CSSProperties
                      }
                    >
                      {item.initials}
                    </span>

                    <div className="wb-activity-meta">
                      <p>
                        <strong>{item.actor}</strong> {item.message}
                      </p>
                      <span>{item.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </aside>
    </>
  );
}
