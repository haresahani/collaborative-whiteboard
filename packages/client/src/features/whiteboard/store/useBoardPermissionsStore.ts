import { create } from "zustand";
import { useAuthStore } from "../../../store/authStore";

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
  setPermissions: (permissions: Partial<BoardPermissionsState>) => void;
}

export const useBoardPermissionsStore = create<BoardPermissionsState>((set) => ({
  accessLevel: "edit",
  allowGuestEdit: true,
  userRole: "editor",
  isLocked: false,

  setAccessLevel: (accessLevel) => set({ accessLevel }),
  setAllowGuestEdit: (allowGuestEdit) => set({ allowGuestEdit }),
  setUserRole: (userRole) => set({ userRole }),
  setIsLocked: (isLocked) => set({ isLocked }),
  setPermissions: (permissions) => set((state) => ({ ...state, ...permissions })),
}));

/**
 * Evaluates whether the current user is allowed to draw, edit, or delete elements on the board.
 */
export function canUserEditBoard(): boolean {
  const { isLocked, accessLevel, allowGuestEdit, userRole } = useBoardPermissionsStore.getState();

  // 1. Explicitly locked canvas -> Freeze all drawing & element changes
  if (isLocked) return false;

  // 2. View Only mode -> Non-owner users cannot edit
  if (accessLevel === "view" && userRole !== "owner") return false;

  // 3. Private mode -> Non-owner users cannot edit
  if (accessLevel === "private" && userRole !== "owner") return false;

  // 4. Guest editing disabled -> Guests without login cannot edit
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  if (!allowGuestEdit && !isAuthenticated) return false;

  return true;
}
