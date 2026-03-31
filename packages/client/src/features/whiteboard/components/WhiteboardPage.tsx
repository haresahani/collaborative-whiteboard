import { CheckCircle2, Info, TriangleAlert } from "lucide-react";
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

function sanitizeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type NoticeTone = "success" | "info" | "warning";

type WhiteboardNotice = {
  id: number;
  tone: NoticeTone;
  message: string;
};

type ActivePanel = "info" | "settings" | null;

export default function WhiteboardPage() {
  const { id } = useParams<{ id: string }>();

  const boardId = id ?? "local-board";

  const [boardName, setBoardName] = useState("Sprint Planning - Q3");
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isLefttoolSurfaceOpen, setIsLefttoolSurfaceOpen] = useState(false);
  const [notice, setNotice] = useState<WhiteboardNotice | null>(null);

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
    const canvas = document.querySelector<HTMLCanvasElement>(
      ".whiteboard-canvas-element",
    );

    if (!canvas) {
      pushNotice(
        "Export failed because the canvas is not available.",
        "warning",
      );
      return;
    }

    const downloadLink = document.createElement("a");
    const fileName = sanitizeFileName(boardName) || "whiteboard";

    downloadLink.href = canvas.toDataURL("image/png");
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

      <TopNavigation
        boardId={boardId}
        boardName={boardName}
        activePanel={activePanel}
        onBoardNameChange={setBoardName}
        onExport={handleExport}
        onShare={handleShareClick}
        onToggleSettings={() =>
          setActivePanel((current) =>
            current === "settings" ? null : "settings",
          )
        }
        onToggleTools={() => setIsToolsOpen((current) => !current)}
      />

      {activePanel !== "info" ? (
        <button
          type="button"
          className="wb-board-info-trigger"
          onClick={() => setActivePanel("info")}
          aria-controls="board-info-panel"
          aria-expanded="false"
          aria-label="Open board info"
          title="Board info"
        >
          <Info size={16} />
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

      <BoardSettingsPanel
        isOpen={activePanel === "settings"}
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
