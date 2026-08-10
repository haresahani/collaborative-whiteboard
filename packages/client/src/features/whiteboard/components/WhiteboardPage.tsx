import { CheckCircle2, Info, MessageSquare, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { cn } from "../../../lib/utils";
import WhiteboardCanvas from "./canvas/WhiteboardCanvas";
import BoardSettingsPanel from "./layout/BoardSettingsPanel";
import BottomToolbar from "./layout/BottomToolbar";
import LeftToolbar from "./layout/lefttool";
import RightPanel from "./layout/RightPanel";
import TopNavigation from "./layout/TopNavigation";
import WorkspaceOverlay from "./overlays/WorkspaceOverlay";
import { useBoardStore } from "../store/boardStore";
import { socketService } from "../../../api/ws";
import LiveCursorsOverlay from "./canvas/LiveCursorsOverlay";
import ChatPanel from "./layout/ChatPanel";
import { exportToPNG } from "../engine/exporter";
import { useAuthStore } from "../../../store/authStore";
import { updateBoardTitleApi } from "../../../api/auth";

function getStorageKey(userId?: string | null): string {
  return userId
    ? `collab_whiteboard_recent_boards_${userId}`
    : "collab_whiteboard_recent_boards_guest";
}

function sanitizeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type NoticeTone = "success" | "warning" | "info" | "error";

type WhiteboardNotice = {
  id: number;
  tone: NoticeTone;
  message: string;
};

type ActivePanel = "info" | "settings" | "chat" | null;

export default function WhiteboardPage() {
  const { id } = useParams<{ id: string }>();
  const currentUser = useAuthStore((state) => state.user);

  const boardId = id ?? "local-board";
  const storageKey = getStorageKey(currentUser?.id);

  const [boardName, setBoardName] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const list = JSON.parse(saved);
        const found = list.find((b: { id: string; name: string }) => b.id === boardId);
        if (found?.name) return found.name;
      }
    } catch {
      // ignore
    }
    if (boardId === "local-board") return "Main Collaborative Canvas";
    return `Untitled Whiteboard (${boardId.slice(0, 8)})`;
  });
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isLefttoolSurfaceOpen, setIsLefttoolSurfaceOpen] = useState(true);
  const [notice, setNotice] = useState<WhiteboardNotice | null>(null);

  useEffect(() => {
    function handleTitleSync(e: Event) {
      const detail = (e as CustomEvent<{ title: string }>).detail;
      if (detail?.title) {
        setBoardName(detail.title);
      }
    }

    window.addEventListener("board:title:sync", handleTitleSync);
    return () => window.removeEventListener("board:title:sync", handleTitleSync);
  }, []);

  // Rename board handler with persistence and socket broadcast
  const handleBoardNameChange = useCallback((newName: string) => {
    setBoardName(newName);
    try {
      const key = getStorageKey(useAuthStore.getState().user?.id);
      const saved = localStorage.getItem(key);
      const list = saved ? JSON.parse(saved) : [];
      const index = list.findIndex((b: { id: string }) => b.id === boardId);
      if (index >= 0) {
        list[index].name = newName;
        list[index].updatedAt = new Date().toISOString();
      } else {
        list.unshift({
          id: boardId,
          name: newName,
          updatedAt: new Date().toISOString(),
          itemCount: 0,
        });
      }
      localStorage.setItem(key, JSON.stringify(list));
    } catch {
      // ignore
    }

    socketService.emitBoardTitleUpdate(boardId, newName);
    void updateBoardTitleApi(boardId, newName);
  }, [boardId]);

  useEffect(() => {
    useBoardStore.getState().setBoardId(boardId);

    void socketService.connect(boardId);

    return () => {
      socketService.disconnect();
    };
  }, [boardId]);

  const pushNotice = useCallback(
    (message: string, tone: NoticeTone = "success") => {
      setNotice({
        id: Date.now(),
        message,
        tone,
      });
    },
    [],
  );

  useEffect(() => {
    if (!notice) return;

    const timeoutId = window.setTimeout(() => {
      setNotice((current) => (current?.id === notice.id ? null : current));
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      setIsToolsOpen(false);
      setActivePanel(null);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      pushNotice("Board link copied to clipboard.", "success");
    } catch {
      pushNotice(
        "Clipboard permission is unavailable in this browser.",
        "warning",
      );
    }
  }, [pushNotice]);

  const handleShareClick = useCallback(() => {
    void handleShare();
  }, [handleShare]);

  const handleExport = useCallback(() => {
    const elements = useBoardStore.getState().elements;
    const fileName = sanitizeFileName(boardName) || "whiteboard";
    const dataUrl = exportToPNG(elements, boardName, {
      backgroundColor: "#ffffff",
      padding: 40,
    });

    if (!dataUrl) {
      pushNotice(
        "Export failed: board is empty.",
        "warning",
      );
      return;
    }

    const downloadLink = document.createElement("a");
    downloadLink.href = dataUrl;
    downloadLink.download = `${fileName}.png`;
    downloadLink.click();
    pushNotice(`Exported ${fileName}.png`, "success");
  }, [boardName, pushNotice]);


  const handleCanvasInteract = useCallback(() => {
    setIsToolsOpen(false);
    setIsLefttoolSurfaceOpen(false);
    setActivePanel((current) => (current === "info" ? null : current));
  }, []);

  return (
    <div className="whiteboard-shell">
      <WhiteboardCanvas onCanvasInteract={handleCanvasInteract} />
      <WorkspaceOverlay />
      <LiveCursorsOverlay />

      <TopNavigation
        boardId={boardId}
        boardName={boardName}
        activePanel={activePanel}
        onBoardNameChange={handleBoardNameChange}
        onExport={handleExport}
        onShare={handleShareClick}
        onToggleSettings={() =>
          setActivePanel((current) =>
            current === "settings" ? null : "settings",
          )
        }
        onToggleTools={() => setIsLefttoolSurfaceOpen((current) => !current)}
      />

      {activePanel !== "info" ? (
        <button
          type="button"
          className={cn(
            "wb-board-info-trigger",
            activePanel !== null && "wb-board-info-trigger--shifted",
          )}
          onClick={() => setActivePanel("info")}
          aria-controls="board-info-panel"
          aria-expanded="false"
          aria-label="Open board info"
          title="Board info"
        >
          <Info size={16} />
        </button>
      ) : null}

      {activePanel !== "chat" ? (
        <button
          type="button"
          className={cn(
            "wb-board-chat-trigger",
            activePanel !== null && "wb-board-chat-trigger--shifted",
          )}
          onClick={() => setActivePanel("chat")}
          aria-controls="board-chat-panel"
          aria-expanded="false"
          aria-label="Open board chat"
          title="Board chat"
        >
          <MessageSquare size={16} />
        </button>
      ) : null}

      <button
        type="button"
        className={cn(
          "wb-overlay-backdrop wb-mobile-only",
          isToolsOpen && "wb-overlay-backdrop--open",
        )}
        onClick={() => setIsToolsOpen(false)}
        aria-label="Close tools"
      />

      <LeftToolbar
        isOpen={isToolsOpen}
        isSurfaceOpen={isLefttoolSurfaceOpen}
        onSurfaceOpenChange={setIsLefttoolSurfaceOpen}
        onClose={() => {
          setIsToolsOpen(false);
          setIsLefttoolSurfaceOpen(false);
        }}
      />

      <RightPanel
        boardId={boardId}
        boardName={boardName}
        isOpen={activePanel === "info"}
        onClose={() => setActivePanel(null)}
      />

      <ChatPanel
        isOpen={activePanel === "chat"}
        onClose={() => setActivePanel(null)}
      />

      <BoardSettingsPanel
        isOpen={activePanel === "settings"}
        boardId={boardId}
        boardName={boardName}
        onBoardNameChange={handleBoardNameChange}
        onClose={() => setActivePanel(null)}
      />

      <BottomToolbar onNotify={pushNotice} />

      {notice ? (
        <div
          className={cn("wb-toast", `wb-toast--${notice.tone}`)}
          role="status"
          aria-live="polite"
        >
          <span className="wb-toast__icon" aria-hidden="true">
            {notice.tone === "success" ? (
              <CheckCircle2 size={18} />
            ) : notice.tone === "warning" ? (
              <TriangleAlert size={18} />
            ) : (
              <Info size={18} />
            )}
          </span>
          <span>{notice.message}</span>
        </div>
      ) : null}
    </div>
  );
}
