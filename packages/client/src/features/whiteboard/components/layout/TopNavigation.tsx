import {
  Download,
  Settings2,
  Share2,
  Lock,
} from "lucide-react";
import { useBoardPermissionsStore, canUserEditBoard } from "../store/useBoardPermissionsStore";
import { useAuthStore } from "../../../store/authStore";

type NavigationPanel = "info" | "settings" | "chat" | null;

interface TopNavigationProps {
  boardId?: string;
  boardName?: string;
  activePanel: NavigationPanel;
  onBoardNameChange?: (name: string) => void;
  onExport: () => void;
  onShare: () => void;
  onToggleSettings: () => void;
  onToggleTools?: () => void;
}

export default function TopNavigation({
  activePanel,
  onExport,
  onShare,
  onToggleSettings,
}: TopNavigationProps) {
  const { isLocked, accessLevel, allowGuestEdit } = useBoardPermissionsStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isReadOnly = !canUserEditBoard();

  let lockText = "";
  if (isLocked) lockText = "Canvas Frozen";
  else if (accessLevel === "view") lockText = "View Only";
  else if (!allowGuestEdit && !isAuthenticated) lockText = "Guests View Only";

  return (
    <header className="wb-topbar">
      {isReadOnly && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            borderRadius: "9999px",
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#fca5a5",
            fontSize: "0.78rem",
            fontWeight: 700,
            marginRight: "auto",
            marginLeft: "1rem",
          }}
        >
          <Lock size={13} />
          <span>{lockText}</span>
        </div>
      )}
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
