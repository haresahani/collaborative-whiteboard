import { create } from "zustand";

export type BoardAccessLevel = "edit" | "view" | "private";
export type UserBoardRole = "owner" | "editor" | "viewer";

interface BoardPermissionsState {
  accessLevel: BoardAccessLevel;
  allowGuestEdit: boolean;
  userRole: UserBoardRole;
  isLocked: boolean;

  setAccessLevel: (level: BoardAccessLevel) => void;
  setAllowGuestEdit: (allow: boolean) => void;
  setUserRole: (role: UserBoardRole) => void;
  setIsLocked: (locked: boolean) => void;
}

export const useBoardPermissionsStore = create<BoardPermissionsState>((set) => ({
  accessLevel: "edit",
  allowGuestEdit: true,
  userRole: "owner",
  isLocked: false,

  setAccessLevel: (accessLevel) => set({ accessLevel }),
  setAllowGuestEdit: (allowGuestEdit) => set({ allowGuestEdit }),
  setUserRole: (userRole) => set({ userRole }),
  setIsLocked: (isLocked) => set({ isLocked }),
}));
