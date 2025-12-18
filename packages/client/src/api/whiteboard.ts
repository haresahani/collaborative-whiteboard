import type { WhiteboardState } from "@/types/whiteboard";

// Mock API functions for whiteboard operations
// client/src/api/whiteboard.ts
export async function fetchBoard(boardId: string): Promise<WhiteboardState> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    elements: [],
    selectedElements: [],
    tool: "pen",
    viewport: { x: 0, y: 0, zoom: 1 },
    history: { past: [], present: [], future: [] },
    users: {},
    currentUser: null,
    isConnected: false,
    toolSettings: {
      strokeWidth: 2,
      strokeColor: "hsl(213 94% 68%)",
      fillColor: "transparent",
      strokeStyle: "solid",
      opacity: 1,
    },
    clipboard: [], // ← Add this line
  };
}

export async function updateBoard(data: {
  id: string;
  state: WhiteboardState;
}): Promise<void> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));
  console.log("Board updated:", data.id);
}
