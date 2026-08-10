import {
  Download,
  MessageSquare,
  Settings2,
  Share2,
} from "lucide-react";

type NavigationPanel = "info" | "settings" | "chat" | null;

interface TopNavigationProps {
  boardId?: string;
  boardName?: string;
  activePanel: NavigationPanel;
  onBoardNameChange?: (name: string) => void;
  onExport: () => void;
  onShare: () => void;
  onToggleChat?: () => void;
  onToggleSettings: () => void;
  onToggleTools?: () => void;
}

export default function TopNavigation({
  activePanel,
  onExport,
  onShare,
  onToggleChat,
  onToggleSettings,
}: TopNavigationProps) {
  return (
    <header className="wb-topbar">
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

        {onToggleChat && (
          <button
            type="button"
            className="wb-icon-button wb-icon-button--round"
            onClick={onToggleChat}
            aria-controls="board-chat-panel"
            aria-expanded={activePanel === "chat"}
            aria-label="Open collaborative chat"
            title="Collaborative Chat"
          >
            <MessageSquare size={16} />
          </button>
        )}

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
