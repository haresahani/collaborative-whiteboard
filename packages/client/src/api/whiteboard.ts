import type { WhiteboardState } from "@/types/whiteboard";

// Mock API functions for whiteboard operations
export async function fetchBoard(boardId: string): Promise<WhiteboardState> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return mock whiteboard state
  return {
    elements: [],
    selectedElements: [],
    tool: "pen",
    viewport: { x: 0, y: 0, zoom: 1 },
    history: { past: [], present: [], future: [] },
    users: {},
    currentUser: null,
    isConnected: false,
  };
}

export async function updateBoard(data: { id: string; state: WhiteboardState }): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // In a real app, this would save to backend
  console.log("Board updated:", data.id);
}