import {
  ChevronRight,
  Copy,
  FolderPen,
  Hash,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Settings2,
  Shield,
  SlidersHorizontal,
  Sun,
  User,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../../../lib/utils";
import { usePanelFocus } from "../../hooks/usePanelFocus";
import { useThemeStore, type Theme } from "../../store/themeStore";
import { useCollaborationStore } from "../../store/collaborationStore";
import { useAuthStore } from "../../../../store/authStore";

interface BoardSettingsPanelProps {
  isOpen: boolean;
  boardId: string;
  boardName: string;
  onBoardNameChange: (name: string) => void;
  onClose: () => void;
}

const FUTURE_SECTIONS = [
  {
    title: "Permissions",
    description: "Board privacy, edit access, and invite rules live here.",
    Icon: Shield,
  },
  {
    title: "Canvas Defaults",
    description:
      "Future options for grid, export defaults, and template presets.",
    Icon: SlidersHorizontal,
  },
];

const THEME_OPTIONS: {
  value: Theme;
  label: string;
  Icon: React.FC<{ size?: number }>;
}[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

function AccountSection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <section className="wb-inspector__section">
      <div className="wb-inspector__section-title">
        <User size={15} />
        <h4>Account & Session</h4>
      </div>

      {isAuthenticated && user ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "10px", background: "var(--wb-surface-strong)" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--wb-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px" }}>
              {user.displayName.slice(0, 1).toUpperCase()}
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
              <strong style={{ fontSize: "13px", color: "var(--wb-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.displayName}</strong>
              <span style={{ fontSize: "11px", color: "var(--wb-text-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--wb-border)",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <LogOut size={14} />
            Log Out
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
          <p style={{ fontSize: "12px", color: "var(--wb-text-soft)", margin: 0 }}>
            You are currently active as a guest. Sign in to save boards to your personal workspace.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button
              type="button"
              onClick={() => navigate("/login", { state: { from: location.pathname } })}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid var(--wb-border)",
                background: "var(--wb-surface-strong)",
                color: "var(--wb-text)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <LogIn size={14} />
              Log In
            </button>

            <button
              type="button"
              onClick={() => navigate("/signup", { state: { from: location.pathname } })}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "none",
                background: "var(--wb-accent)",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <UserPlus size={14} />
              Sign Up
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function ThemeSection() {
  const { theme, setTheme } = useThemeStore();

  return (
    <section className="wb-inspector__section">
      <div className="wb-inspector__section-title">
        <Palette size={15} />
        <h4>Appearance</h4>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
          marginTop: "10px",
        }}
      >
        {THEME_OPTIONS.map(({ value, label, Icon }) => {
          const active = theme === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                padding: "10px 6px",
                borderRadius: "10px",
                border: active
                  ? "2px solid var(--wb-accent)"
                  : "2px solid var(--wb-border-strong)",
                background: active
                  ? "color-mix(in srgb, var(--wb-accent) 10%, transparent)"
                  : "var(--wb-surface-muted)",
                color: active ? "var(--wb-accent)" : "var(--wb-text-soft)",
                fontSize: "11px",
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function BoardSettingsPanel({
  isOpen,
  boardId,
  boardName,
  onBoardNameChange,
  onClose,
}: BoardSettingsPanelProps) {
  const closeButtonRef = usePanelFocus(isOpen);
  const [draftName, setDraftName] = useState(boardName);
  const [isCopied, setIsCopied] = useState(false);
  const activeUsers = useCollaborationStore((state) => state.activeUsers);

  useEffect(() => {
    setDraftName(boardName);
  }, [boardName]);

  function handleSaveName() {
    const trimmed = draftName.trim();
    if (trimmed) {
      onBoardNameChange(trimmed);
    } else {
      setDraftName(boardName);
    }
  }

  function handleCopyId() {
    navigator.clipboard.writeText(boardId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          "wb-overlay-backdrop",
          isOpen && "wb-overlay-backdrop--open",
        )}
        onClick={onClose}
        aria-label="Close board settings"
      />

      <aside
        id="board-settings-panel"
        className={cn("wb-right-panel", isOpen && "wb-right-panel--open")}
        aria-hidden={!isOpen}
        aria-labelledby="board-settings-panel-title"
        role="dialog"
        tabIndex={-1}
      >
        <div className="wb-right-panel__shell">
          <div className="wb-right-panel__header">
            <div className="wb-right-panel__heading">
              <Settings2 size={16} />
              <h3
                id="board-settings-panel-title"
                className="wb-right-panel__title"
              >
                Board Settings
              </h3>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              className="wb-icon-button wb-icon-button--small"
              onClick={onClose}
              aria-label="Close board settings"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="wb-inspector">
            {/* ── Account & Auth Session ── */}
            <AccountSection />

            {/* ── Appearance / Theme ── */}
            <ThemeSection />

            {/* ── Board Details ── */}
            <section className="wb-inspector__section">
              <div className="wb-inspector__section-title">
                <FolderPen size={15} />
                <h4>Board Details</h4>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--wb-text-soft)" }}>
                  Board Title
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                    }}
                    style={{
                      width: "100%",
                      marginTop: "4px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--wb-border)",
                      background: "var(--wb-surface-strong)",
                      fontSize: "13px",
                      color: "var(--wb-text)",
                      outline: "none",
                    }}
                  />
                </label>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--wb-text-soft)" }}>
                    <Hash size={13} />
                    Board ID: <strong>{boardId}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      border: "none",
                      background: "transparent",
                      color: "var(--wb-accent)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Copy size={12} />
                    {isCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </section>

            {/* ── Collaboration / Active Players ── */}
            <section className="wb-inspector__section">
              <div className="wb-inspector__section-title">
                <UsersRound size={15} />
                <h4>Collaboration ({activeUsers.length} active)</h4>
              </div>

              <div className="wb-collaborator-list" style={{ marginTop: "10px" }}>
                {activeUsers.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "var(--wb-text-soft)", margin: 0 }}>
                    No active players currently on this board.
                  </p>
                ) : (
                  activeUsers.map((collaborator) => (
                    <div
                      key={collaborator.userId}
                      className="wb-collaborator-row"
                      style={{ padding: "8px 10px", borderRadius: "8px", background: "var(--wb-surface-strong)" }}
                    >
                      <span
                        className="wb-collaborator-avatar"
                        style={
                          {
                            "--avatar-accent": collaborator.accent,
                          } as CSSProperties
                        }
                      >
                        {collaborator.displayName.slice(0, 2).toUpperCase()}
                      </span>

                      <div className="wb-collaborator-meta">
                        <strong>{collaborator.displayName}</strong>
                        <span>Collaborator - Active now</span>
                      </div>

                      <span className="wb-online-pill">
                        <span className="wb-online-pill__dot" />
                        Online
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* ── Future Sections ── */}
            {FUTURE_SECTIONS.map(({ title, description, Icon }) => (
              <section key={title} className="wb-inspector__section">
                <div className="wb-inspector__section-title">
                  <Icon size={15} />
                  <h4>{title}</h4>
                </div>

                <div className="wb-settings-placeholder">
                  <p>{description}</p>
                  <span>Coming soon</span>
                </div>
              </section>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
