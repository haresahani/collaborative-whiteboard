import {
  Download,
  Settings2,
  Share2,
  Lock,
} from "lucide-react";
import { useBoardPermissionsStore, canUserEditBoard } from "../../store/useBoardPermissionsStore";
import { useAuthStore } from "../../../../store/authStore";

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
  else if (accessLevel === "private") lockText = "Private Board";
  else if (!allowGuestEdit && !isAuthenticated) lockText = "Guests View Only";

  return (
    <header className="wb-topbar">
      {isReadOnly && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 12px",
            borderRadius: "9999px",
            backgroundColor: "#18181b",
            border: "1.5px solid #ef4444",
            color: "#f87171",
            fontSize: "0.78rem",
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
            zIndex: 10,
            marginRight: "auto",
            marginLeft: "1rem",
          }}
        >
          <Lock size={13} style={{ color: "#ef4444" }} />
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
