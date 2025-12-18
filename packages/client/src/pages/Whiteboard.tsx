// src/pages/Whiteboard.tsx

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { LeftToolbar } from "@/components/layout/LeftToolbar";
import { RightPanel } from "@/components/layout/RightPanel";
import { BottomToolbar } from "@/components/layout/BottomToolbar";
import { WhiteboardCanvas } from "@/components/canvas/WhiteboardCanvas";
import { AuthDialog } from "@/components/auth/AuthDialog";
import {
  WhiteboardProvider,
  useWhiteboard,
} from "@/contexts/WhiteboardContext";
import { useMockWebSocket } from "@/hooks/useWebSocket";
import {
  useKeyboardShortcuts,
  createWhiteboardShortcuts,
} from "@/hooks/useKeyboardShortcuts";
import type { User, Point } from "@/types/whiteboard";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileToolTray } from "@/components/layout/MobileToolTray";
import { generateUUID } from "@/lib/utils";
import { cloneElements } from "@/lib/clipboard";

// Mock users for demo
const mockUsers: Record<string, User> = {
  "user-1": {
    id: "user-1",
    name: "Hare-Sahani",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hare-Sahani",
    color: "hsl(var(--presence-1))",
    cursor: { x: 150, y: 200 },
    isOnline: true,
  },
  "user-2": {
    id: "user-2",
    name: "Harekrishna",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Harekrishna",
    color: "hsl(var(--presence-2))",
    cursor: { x: 300, y: 150 },
    isOnline: true,
  },
};

function WhiteboardContent() {
  const [boardName, setBoardName] = useState("Untitled Board");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isLeftToolbarCollapsed, setIsLeftToolbarCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);

  const {
    state,
    dispatch,
    setTool,
    undo,
    redo,
    setViewport,
    addElement,
    selectElements,
    deleteElement,
  } = useWhiteboard();

  const { toast } = useToast();

  const lastMousePosition = useRef<Point | null>(null);

  // Mock WebSocket connection
  const { sendCursor } = useMockWebSocket({
    user: state.currentUser,
    onEvent: (event) => {
      console.log("Received WebSocket event:", event);
    },
  });

  // Set guest user if no current user
  useEffect(() => {
    if (!state.currentUser) {
      const guestUser: User = {
        id: `guest-${generateUUID()}`,
        name: "Guest",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest",
        color: "hsl(var(--presence-guest))",
        cursor: { x: 0, y: 0 },
        isOnline: true,
      };
      dispatch({ type: "SET_CURRENT_USER", payload: guestUser });
    }
  }, [state.currentUser, dispatch]);

  // Initialize mock users when user is set
  useEffect(() => {
    if (state.currentUser) {
      Object.values(mockUsers).forEach((user) => {
        dispatch({ type: "UPDATE_USER", payload: user });
      });
      dispatch({ type: "SET_CONNECTION_STATUS", payload: true });
    }
  }, [state.currentUser, dispatch]);

  // Track mouse position for accurate paste location
  const handleCursorMove = (point: Point) => {
    lastMousePosition.current = point;
    sendCursor(point.x, point.y);
  };

  // Fallback center if no mouse position
  const getFallbackCenter = (): Point => ({
    x: (window.innerWidth / 2 - state.viewport.x) / state.viewport.zoom,
    y: (window.innerHeight / 2 - state.viewport.y) / state.viewport.zoom,
  });

  const getPastePosition = (): Point => {
    return lastMousePosition.current || getFallbackCenter();
  };

  // Keyboard shortcut actions with toast feedback
  const actions = {
    undo,
    redo,
    copy: () => {
      if (state.selectedElements.length === 0) return;
      const toCopy = state.elements.filter((el) =>
        state.selectedElements.includes(el.id),
      );
      dispatch({ type: "SET_CLIPBOARD", payload: toCopy });
      toast({
        title: "Copied",
        description: `${toCopy.length} element${toCopy.length > 1 ? "s" : ""} copied`,
      });
    },
    paste: () => {
      if (state.clipboard.length === 0) return;

      const cursorPos = lastMousePosition.current || { x: 0, y: 0 };

      // Calculate bounding box of the copied group
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      state.clipboard.forEach((el) => {
        if (el.type === "path" && Array.isArray(el.data.points)) {
          el.data.points.forEach((p: Point) => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
          });
        } else {
          minX = Math.min(minX, el.position.x);
          minY = Math.min(minY, el.position.y);
          maxX = Math.max(maxX, el.position.x + el.size.width);
          maxY = Math.max(maxY, el.position.y + el.size.height);
        }
      });

      // Fallback if empty
      if (minX === Infinity) {
        minX = maxX = cursorPos.x;
        minY = maxY = cursorPos.y;
      }

      // Center of the group
      const groupCenterX = (minX + maxX) / 2;
      const groupCenterY = (minY + maxY) / 2;

      // Offset so group center lands at cursor
      const offset = {
        x: cursorPos.x - groupCenterX,
        y: cursorPos.y - groupCenterY,
      };

      const newEls = cloneElements(
        state.clipboard,
        offset,
        state.currentUser?.id || "anonymous",
      );

      newEls.forEach(addElement);
      selectElements(newEls.map((el) => el.id));

      toast({
        title: "Pasted",
        description: `${newEls.length} element${newEls.length > 1 ? "s" : ""} pasted`,
      });
    },
    delete: () => {
      const count = state.selectedElements.length;
      if (count === 0) return;
      state.selectedElements.forEach((id) => deleteElement(id));
      toast({
        title: "Deleted",
        description: `${count} element${count > 1 ? "s" : ""} deleted`,
      });
    },
    selectAll: () => selectElements(state.elements.map((el) => el.id)),
    duplicate: () => {
      if (state.selectedElements.length === 0) return;

      // First copy current selection to clipboard
      const toDuplicate = state.elements.filter((el) =>
        state.selectedElements.includes(el.id),
      );
      dispatch({ type: "SET_CLIPBOARD", payload: toDuplicate });

      // Then paste with offset
      const pos = getPastePosition();
      const offset = { x: pos.x + 50, y: pos.y + 50 };

      const newEls = cloneElements(
        toDuplicate,
        offset,
        state.currentUser?.id || "anonymous",
      );
      newEls.forEach(addElement);
      selectElements(newEls.map((el) => el.id));

      toast({
        title: "Duplicated",
        description: `${newEls.length} element${newEls.length > 1 ? "s" : ""} duplicated`,
      });
    },
    setTool,
    zoomIn: () => handleZoom(0.1),
    zoomOut: () => handleZoom(-0.1),
    resetZoom: () => setViewport({ x: 0, y: 0, zoom: 1 }),
  };

  const shortcuts = createWhiteboardShortcuts(actions);

  useKeyboardShortcuts(shortcuts);

  const handleAuthenticated = (user: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  }) => {
    const userWithColor: User = {
      ...user,
      color: "hsl(var(--presence-3))",
      isOnline: true,
    };
    dispatch({ type: "SET_CURRENT_USER", payload: userWithColor });
    setIsAuthOpen(false);
  };

  const handleZoom = (delta: number) => {
    const newZoom = Math.max(0.1, Math.min(5, state.viewport.zoom + delta));
    setViewport({ ...state.viewport, zoom: newZoom });
  };

  const handleFitToScreen = () => {
    setViewport({ x: 0, y: 0, zoom: 1 });
    toast({
      title: "Zoom reset",
      description: "Canvas has been fitted to screen.",
    });
  };

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Your whiteboard is being exported as PNG.",
    });
  };

  const handleShare = () => {
    const url = window.location.href;
    void navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Share this link with others to collaborate.",
    });
  };

  const handleSettings = () => {
    toast({
      title: "Settings",
      description: "Settings panel coming soon!",
    });
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* Top Navigation */}
      <TopNavigation
        boardName={boardName}
        onBoardNameChange={setBoardName}
        onShare={handleShare}
        onExport={handleExport}
        onSettings={handleSettings}
        onToggleSidebar={() => {
          if (isMobile) setIsMobileToolsOpen(true);
          else setIsLeftToolbarCollapsed(!isLeftToolbarCollapsed);
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <motion.div
          initial={false}
          animate={{
            width: isLeftToolbarCollapsed ? 60 : "auto",
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="hidden md:block"
        >
          <LeftToolbar isCollapsed={isLeftToolbarCollapsed} />
        </motion.div>

        {/* Canvas Area */}
        <div className="flex-1 relative">
          <WhiteboardCanvas
            onCursorMove={handleCursorMove}
            className="w-full h-full"
          />
        </div>

        {/* Right Panel */}
        <RightPanel
          isOpen={isRightPanelOpen}
          onClose={() => setIsRightPanelOpen(false)}
        />
      </div>

      {/* Bottom Toolbar */}
      <BottomToolbar
        onExport={handleExport}
        onFitToScreen={handleFitToScreen}
        onZoomIn={() => handleZoom(0.1)}
        onZoomOut={() => handleZoom(-0.1)}
      />

      {/* Floating Actions */}
      <div className="fixed top-20 right-4 z-40 flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          className="tool-button-active w-12 h-12 rounded-xl shadow-lg"
        >
          <span className="text-sm font-bold">
            {Object.values(state.users).filter((u) => u.isOnline).length}
          </span>
        </motion.button>
      </div>

      {/* Mobile Tools Drawer */}
      <MobileToolTray
        open={isMobileToolsOpen}
        onOpenChange={setIsMobileToolsOpen}
      />

      {/* Auth Dialog (optional, shown on demand) */}
      <AuthDialog
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthenticated={handleAuthenticated}
      />
    </div>
  );
}

export default function Whiteboard() {
  return (
    <WhiteboardProvider boardId="demo-board">
      <WhiteboardContent />
    </WhiteboardProvider>
  );
}
