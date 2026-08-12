import {
  ChevronRight,
  Copy,
  Eye,
  FolderPen,
  Grid,
  Hash,
  LayoutGrid,
  Lock,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Settings2,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Square,
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
import {
  useBoardPermissionsStore,
  type BoardAccessLevel,
} from "../../store/useBoardPermissionsStore";
import { useCanvasDefaultsStore } from "../../store/useCanvasDefaultsStore";
import { useToolStore } from "../../store/toolStore";
import type { GridStyle } from "../../engine/grid";

interface BoardSettingsPanelProps {
  isOpen: boolean;
  boardId: string;
  boardName: string;
  onBoardNameChange: (name: string) => void;
  onClose: () => void;
}

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

function PermissionsSection() {
  const {
    accessLevel,
    setAccessLevel,
    isLocked,
    setIsLocked,
    allowGuestEdit,
    setAllowGuestEdit,
  } = useBoardPermissionsStore();

  return (
    <section className="wb-inspector__section">
      <div className="wb-inspector__section-title">
        <Shield size={15} />
        <h4>Permissions & Access</h4>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
        {/* Access Level Selector */}
        <div>
          <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--wb-text-soft)", display: "block", marginBottom: "6px" }}>
            Board Privacy Mode
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
            {[
              { id: "edit", label: "Public Edit", icon: Eye },
              { id: "view", label: "View Only", icon: Lock },
              { id: "private", label: "Private", icon: ShieldCheck },
            ].map(({ id, label, icon: IconComponent }) => {
              const active = accessLevel === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAccessLevel(id as BoardAccessLevel)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    padding: "8px 4px",
                    borderRadius: "8px",
                    border: active ? "2px solid var(--wb-accent)" : "1px solid var(--wb-border)",
                    background: active ? "color-mix(in srgb, var(--wb-accent) 12%, transparent)" : "var(--wb-surface-strong)",
                    color: active ? "var(--wb-accent)" : "var(--wb-text)",
                    fontSize: "11px",
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  <IconComponent size={14} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lock Editing Toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: "8px", background: "var(--wb-surface-strong)" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--wb-text)" }}>Lock Canvas Editing</span>
            <span style={{ fontSize: "10px", color: "var(--wb-text-soft)" }}>Freeze all drawing & element changes</span>
          </div>
          <input
            type="checkbox"
            checked={isLocked}
            onChange={(e) => setIsLocked(e.target.checked)}
            style={{ width: "16px", height: "16px", accentColor: "var(--wb-accent)", cursor: "pointer" }}
          />
        </div>

        {/* Allow Guest Edit Toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: "8px", background: "var(--wb-surface-strong)" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--wb-text)" }}>Allow Guest Editors</span>
            <span style={{ fontSize: "10px", color: "var(--wb-text-soft)" }}>Guests can draw without signing in</span>
          </div>
          <input
            type="checkbox"
            checked={allowGuestEdit}
            onChange={(e) => setAllowGuestEdit(e.target.checked)}
            style={{ width: "16px", height: "16px", accentColor: "var(--wb-accent)", cursor: "pointer" }}
          />
        </div>
      </div>
    </section>
  );
}

function CanvasDefaultsSection() {
  const {
    gridStyle,
    setGridStyle,
    snapToGrid,
    setSnapToGrid,
    defaultStrokeColor,
    setDefaultStrokeColor,
    defaultStrokeWidth,
    setDefaultStrokeWidth,
    exportScale,
    setExportScale,
  } = useCanvasDefaultsStore();

  const setToolStyle = useToolStore((state) => state.setStyle);

  const handleColorChange = (color: string) => {
    setDefaultStrokeColor(color);
    setToolStyle({ color });
  };

  const handleWidthChange = (width: number) => {
    setDefaultStrokeWidth(width);
    setToolStyle({ width });
  };

  return (
    <section className="wb-inspector__section">
      <div className="wb-inspector__section-title">
        <SlidersHorizontal size={15} />
        <h4>Canvas Defaults & Grid</h4>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
        {/* Grid Background Selector */}
        <div>
          <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--wb-text-soft)", display: "block", marginBottom: "6px" }}>
            Grid Pattern Style
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
            {[
              { id: "dots", label: "Dot Grid", icon: Grid },
              { id: "lines", label: "Line Grid", icon: LayoutGrid },
              { id: "none", label: "Blank", icon: Square },
            ].map(({ id, label, icon: IconComponent }) => {
              const active = gridStyle === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setGridStyle(id as GridStyle)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    padding: "8px 4px",
                    borderRadius: "8px",
                    border: active ? "2px solid var(--wb-accent)" : "1px solid var(--wb-border)",
                    background: active ? "color-mix(in srgb, var(--wb-accent) 12%, transparent)" : "var(--wb-surface-strong)",
                    color: active ? "var(--wb-accent)" : "var(--wb-text)",
                    fontSize: "11px",
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  <IconComponent size={14} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Snap to Grid Toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: "8px", background: "var(--wb-surface-strong)" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--wb-text)" }}>Snap to Grid</span>
            <span style={{ fontSize: "10px", color: "var(--wb-text-soft)" }}>Align elements to grid coordinates</span>
          </div>
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={(e) => setSnapToGrid(e.target.checked)}
            style={{ width: "16px", height: "16px", accentColor: "var(--wb-accent)", cursor: "pointer" }}
          />
        </div>

        {/* Default Color Swatches */}
        <div>
          <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--wb-text-soft)", display: "block", marginBottom: "6px" }}>
            Default Drawing Color
          </label>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {["#6366f1", "#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#000000", "#ffffff"].map((color) => {
              const active = defaultStrokeColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorChange(color)}
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: color,
                    border: active ? "2px solid var(--wb-accent)" : "1px solid var(--wb-border)",
                    boxShadow: active ? "0 0 0 2px var(--wb-accent)" : "none",
                    cursor: "pointer",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Default Stroke Width */}
        <div>
          <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--wb-text-soft)", display: "block", marginBottom: "6px" }}>
            Default Stroke Thickness
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
            {[
              { width: 2, label: "Thin (2px)" },
              { width: 4, label: "Medium (4px)" },
              { width: 8, label: "Thick (8px)" },
            ].map(({ width, label }) => {
              const active = defaultStrokeWidth === width;
              return (
                <button
                  key={width}
                  type="button"
                  onClick={() => handleWidthChange(width)}
                  style={{
                    padding: "6px 4px",
                    borderRadius: "6px",
                    border: active ? "2px solid var(--wb-accent)" : "1px solid var(--wb-border)",
                    background: active ? "color-mix(in srgb, var(--wb-accent) 12%, transparent)" : "var(--wb-surface-strong)",
                    color: active ? "var(--wb-accent)" : "var(--wb-text)",
                    fontSize: "11px",
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Export Resolution */}
        <div>
          <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--wb-text-soft)", display: "block", marginBottom: "6px" }}>
            Export Quality Preset
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {[
              { scale: 1, label: "1x Standard" },
              { scale: 2, label: "2x Ultra HD" },
            ].map(({ scale, label }) => {
              const active = exportScale === scale;
              return (
                <button
                  key={scale}
                  type="button"
                  onClick={() => setExportScale(scale)}
                  style={{
                    padding: "6px 4px",
                    borderRadius: "6px",
                    border: active ? "2px solid var(--wb-accent)" : "1px solid var(--wb-border)",
                    background: active ? "color-mix(in srgb, var(--wb-accent) 12%, transparent)" : "var(--wb-surface-strong)",
                    color: active ? "var(--wb-accent)" : "var(--wb-text)",
                    fontSize: "11px",
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
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

            {/* ── Permissions & Access ── */}
            <PermissionsSection />

            {/* ── Canvas Defaults & Grid ── */}
            <CanvasDefaultsSection />
          </div>
        </div>
      </aside>
    </>
  );
}
