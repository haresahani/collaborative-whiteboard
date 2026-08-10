import { create } from "zustand";

export interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  message: string;
  timestamp: string;
}

export interface RemoteCursorState {
  userId: string;
  displayName: string;
  accent: string;
  x: number;
  y: number;
  previewElement?: unknown;
  erasedIds?: string[];
  tool?: string;
}

export interface ActiveUser {
  userId: string;
  displayName: string;
  accent: string;
}

interface CollaborationState {
  cursors: Map<string, RemoteCursorState>;
  activeUsers: ActiveUser[];
  chatMessages: ChatMessage[];

  updateCursor: (userId: string, data: RemoteCursorState) => void;
  clearCursors: () => void;
  setActiveUsers: (users: ActiveUser[]) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
}

export const useCollaborationStore = create<CollaborationState>((set) => ({
  cursors: new Map(),
  activeUsers: [],
  chatMessages: [],

  updateCursor: (userId, data) =>
    set((state) => {
      const next = new Map(state.cursors);
      next.set(userId, data);
      return { cursors: next };
    }),

  clearCursors: () => set({ cursors: new Map() }),

  setActiveUsers: (users) => set({ activeUsers: users }),

  setChatMessages: (messages) => set({ chatMessages: messages }),

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),
}));
