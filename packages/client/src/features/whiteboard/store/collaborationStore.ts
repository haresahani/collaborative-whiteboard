import { create } from "zustand";
import type { Element } from "../models/element";

export interface ActiveUser {
  userId: string;
  displayName: string;
  accent: string;
}

export interface CursorPosition {
  userId: string;
  displayName: string;
  accent: string;
  x: number; // board-relative world X
  y: number; // board-relative world Y
  updatedAt: number;
  previewElement?: Element | null; // board-relative in-progress preview element
  erasedIds?: string[]; // board-relative in-progress erased element IDs
}

export interface ChatMessage {
  _id?: string;
  boardId: string;
  userId: string;
  displayName: string;
  message: string;
  createdAt: string | Date;
}

type CollaborationState = {
  activeUsers: ActiveUser[];
  cursors: Record<string, CursorPosition>; // key: userId
  chatMessages: ChatMessage[];

  setActiveUsers: (users: ActiveUser[]) => void;
  updateCursor: (userId: string, data: Omit<CursorPosition, "updatedAt">) => void;
  removeCursor: (userId: string) => void;
  clearCursors: () => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
};

export const useCollaborationStore = create<CollaborationState>((set) => ({
  activeUsers: [],
  cursors: {},
  chatMessages: [],

  setActiveUsers: (activeUsers) => set({ activeUsers }),

  updateCursor: (userId, data) =>
    set((state) => ({
      cursors: {
        ...state.cursors,
        [userId]: {
          ...data,
          updatedAt: Date.now(),
        },
      },
    })),

  removeCursor: (userId) =>
    set((state) => {
      const nextCursors = { ...state.cursors };
      delete nextCursors[userId];
      return { cursors: nextCursors };
    }),

  clearCursors: () => set({ cursors: {} }),

  setChatMessages: (chatMessages) => set({ chatMessages }),

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),
}));
