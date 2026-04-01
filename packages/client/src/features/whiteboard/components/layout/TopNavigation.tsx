import {
  Blend,
  ChevronDown,
  Download,
  Lock,
  Menu,
  Settings2,
  Share2,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { COLLABORATORS } from "./uiData";

type NavigationPanel = "info" | "settings" | null;

interface TopNavigationProps {
  boardId: string;
  boardName: string;
  activePanel: NavigationPanel;
  onBoardNameChange: (name: string) => void;
  onExport: () => void;
  onShare: () => void;
  onToggleSettings: () => void;
  onToggleTools: () => void;
}

export default function TopNavigation({
  boardId,
  boardName,
  activePanel,
  onBoardNameChange,
  onExport,
  onShare,
  onToggleSettings,
  onToggleTools,
}: TopNavigationProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
  const [draftName, setDraftName] = useState(boardName);
  const collaboratorsPopoverRef = useRef<HTMLDivElement | null>(null);
  const collaboratorsMenuId = useId();

  useEffect(() => {
    setDraftName(boardName);
  }, [boardName]);

  useEffect(() => {
    if (!isCollaboratorsOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        collaboratorsPopoverRef.current &&
        event.target instanceof Node &&
        !collaboratorsPopoverRef.current.contains(event.target)
      ) {
        setIsCollaboratorsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCollaboratorsOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCollaboratorsOpen]);

  function commitBoardName() {
    const trimmed = draftName.trim();
    onBoardNameChange(trimmed || "Sprint Planning - Q3");
    setIsEditingName(false);
  }

  function handleNameKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      commitBoardName();
    }

    if (event.key === "Escape") {
      setDraftName(boardName);
      setIsEditingName(false);
    }
  }

  return (
    <header className="wb-topbar">
      <div className="wb-topbar__section wb-topbar__section--left">
        <button
          type="button"
          className="wb-icon-button wb-mobile-only"
          onClick={onToggleTools}
          aria-label="Toggle tools"
        >
          <Menu size={18} />
        </button>

        <div className="wb-brand-lockup">
          <span className="wb-brand-mark" aria-hidden="true">
            <Blend size={18} />
          </span>
          <span className="wb-brand-name">Collaborative</span>
        </div>

        <div className="wb-divider" />

        <div className="wb-board-heading">
          {isEditingName ? (
            <input
              autoFocus
              value={draftName}
              onBlur={commitBoardName}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={handleNameKeyDown}
              className="wb-board-name-input"
              aria-label="Board name"
            />
          ) : (
            <button
              type="button"
              className="wb-board-name-button"
              onClick={() => setIsEditingName(true)}
            >
              {boardName}
            </button>
          )}

          <span className="wb-board-lock" aria-label="Private board">
            <Lock size={14} />
          </span>

          <span className="wb-board-chip wb-desktop-only">#{boardId}</span>
        </div>
      </div>

      <div className="wb-topbar__section wb-topbar__section--center">
        <div ref={collaboratorsPopoverRef} className="wb-collaborators-popover">
          <button
            type="button"
            className="wb-presence-pill wb-presence-pill--button"
            onClick={() => setIsCollaboratorsOpen((current) => !current)}
            aria-controls={collaboratorsMenuId}
            aria-expanded={isCollaboratorsOpen}
            aria-haspopup="dialog"
          >
            <span className="wb-presence-pill__dot" />
            Active players ({COLLABORATORS.length})
            <ChevronDown size={14} aria-hidden="true" />
          </button>

          {isCollaboratorsOpen ? (
            <div
              id={collaboratorsMenuId}
              className="wb-collaborators-menu"
              role="dialog"
              aria-label="Collaborators"
            >
              <div className="wb-collaborators-menu__header">
                <strong>Collaborators</strong>
                <span>{COLLABORATORS.length} online</span>
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
                      <span>
                        {collaborator.role} - {collaborator.status}
                      </span>
                    </div>

                    <span className="wb-online-pill">
                      <span className="wb-online-pill__dot" />
                      {collaborator.isOnline ? "Online" : "Away"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="wb-topbar__section wb-topbar__section--right">
        <button
          type="button"
          className="wb-action-button wb-action-button--primary"
          onClick={onShare}
          title="Share board"
        >
          <Share2 size={16} />
          <span>Share</span>
        </button>

        <button
          type="button"
          className="wb-action-button wb-desktop-only"
          onClick={onExport}
          title="Export board"
        >
          <Download size={16} />
          <span>Export</span>
        </button>

        <button
          type="button"
          className="wb-icon-button wb-icon-button--round"
          onClick={onToggleSettings}
          aria-controls="board-settings-panel"
          aria-expanded={activePanel === "settings"}
          aria-label="Open board settings"
          title="Board settings"
        >
          <Settings2 size={16} />
        </button>
      </div>
    </header>
  );
}
