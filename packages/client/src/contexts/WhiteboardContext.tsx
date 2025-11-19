import type { ReactNode } from "react";
import React, { createContext, useContext, useReducer } from "react";
import type {
  WhiteboardState,
  DrawingElement,
  DrawingTool,
  User,
  ToolSettings,
} from "@/types/whiteboard";
// import { WhiteboardEvent } from "@/types/whiteboard";

// Initial state
const initialState: WhiteboardState = {
  elements: [],
  selectedElements: [],
  tool: "select",
  viewport: { x: 0, y: 0, zoom: 1 },
  history: {
    past: [],
    present: [],
    future: [],
  },
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
};

// Action types
type WhiteboardAction =
  | { type: "SET_TOOL"; payload: DrawingTool }
  | { type: "SET_TOOL_SETTINGS"; payload: Partial<ToolSettings> }
  | { type: "ADD_ELEMENT"; payload: DrawingElement }
  | {
      type: "UPDATE_ELEMENT";
      payload: { id: string; updates: Partial<DrawingElement> };
    }
  | { type: "DELETE_ELEMENT"; payload: string }
  | { type: "SELECT_ELEMENTS"; payload: string[] }
  | { type: "SET_VIEWPORT"; payload: { x: number; y: number; zoom: number } }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "UPDATE_USER"; payload: User }
  | { type: "REMOVE_USER"; payload: string }
  | { type: "SET_CURRENT_USER"; payload: User }
  | { type: "SET_CONNECTION_STATUS"; payload: boolean }
  | { type: "SYNC_STATE"; payload: Partial<WhiteboardState> };

// Reducer
function whiteboardReducer(
  state: WhiteboardState,
  action: WhiteboardAction,
): WhiteboardState {
  switch (action.type) {
    case "SET_TOOL":
      return { ...state, tool: action.payload };

    case "SET_TOOL_SETTINGS":
      return {
        ...state,
        toolSettings: { ...state.toolSettings, ...action.payload },
      };

    case "ADD_ELEMENT":
      const newElements = [...state.elements, action.payload];
      return {
        ...state,
        elements: newElements,
        history: {
          past: [...state.history.past, state.elements],
          present: newElements,
          future: [],
        },
      };

    case "UPDATE_ELEMENT":
      const updatedElements = state.elements.map((element) =>
        element.id === action.payload.id
          ? { ...element, ...action.payload.updates }
          : element,
      );
      return { ...state, elements: updatedElements };

    case "DELETE_ELEMENT":
      const filteredElements = state.elements.filter(
        (el) => el.id !== action.payload,
      );
      return {
        ...state,
        elements: filteredElements,
        selectedElements: state.selectedElements.filter(
          (id) => id !== action.payload,
        ),
        history: {
          past: [...state.history.past, state.elements],
          present: filteredElements,
          future: [],
        },
      };

    case "SELECT_ELEMENTS":
      return { ...state, selectedElements: action.payload };

    case "SET_VIEWPORT":
      return { ...state, viewport: action.payload };

    case "UNDO":
      if (state.history.past.length === 0) return state;
      const previous = state.history.past[state.history.past.length - 1];
      return {
        ...state,
        elements: previous,
        history: {
          past: state.history.past.slice(0, -1),
          present: previous,
          future: [state.elements, ...state.history.future],
        },
      };

    case "REDO":
      if (state.history.future.length === 0) return state;
      const next = state.history.future[0];
      return {
        ...state,
        elements: next,
        history: {
          past: [...state.history.past, state.elements],
          present: next,
          future: state.history.future.slice(1),
        },
      };

    case "UPDATE_USER":
      return {
        ...state,
        users: { ...state.users, [action.payload.id]: action.payload },
      };

    case "REMOVE_USER":
      const { [action.payload]: _removed, ...remainingUsers } = state.users;
      return { ...state, users: remainingUsers };

    case "SET_CURRENT_USER":
      return { ...state, currentUser: action.payload };

    case "SET_CONNECTION_STATUS":
      return { ...state, isConnected: action.payload };

    case "SYNC_STATE":
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

// Context
interface WhiteboardContextType {
  state: WhiteboardState;
  dispatch: React.Dispatch<WhiteboardAction>;
  // Helper functions
  setTool: (tool: DrawingTool) => void;
  setToolSettings: (settings: Partial<ToolSettings>) => void;
  addElement: (element: DrawingElement) => void;
  updateElement: (id: string, updates: Partial<DrawingElement>) => void;
  deleteElement: (id: string) => void;
  selectElements: (ids: string[]) => void;
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const WhiteboardContext = createContext<WhiteboardContextType | undefined>(
  undefined,
);

// Provider
interface WhiteboardProviderProps {
  boardId: string;
  children: ReactNode;
}

export function WhiteboardProvider({
  boardId: _boardId,
  children,
}: WhiteboardProviderProps) {
  const [state, dispatch] = useReducer(whiteboardReducer, initialState);

  // Helper functions
  const setTool = (tool: DrawingTool) =>
    dispatch({ type: "SET_TOOL", payload: tool });
  const setToolSettings = (settings: Partial<ToolSettings>) =>
    dispatch({ type: "SET_TOOL_SETTINGS", payload: settings });
  const addElement = (element: DrawingElement) =>
    dispatch({ type: "ADD_ELEMENT", payload: element });
  const updateElement = (id: string, updates: Partial<DrawingElement>) =>
    dispatch({ type: "UPDATE_ELEMENT", payload: { id, updates } });
  const deleteElement = (id: string) =>
    dispatch({ type: "DELETE_ELEMENT", payload: id });
  const selectElements = (ids: string[]) =>
    dispatch({ type: "SELECT_ELEMENTS", payload: ids });
  const setViewport = (viewport: { x: number; y: number; zoom: number }) =>
    dispatch({ type: "SET_VIEWPORT", payload: viewport });
  const undo = () => dispatch({ type: "UNDO" });
  const redo = () => dispatch({ type: "REDO" });

  // Computed values
  const canUndo = state.history.past.length > 0;
  const canRedo = state.history.future.length > 0;

  const value = {
    state,
    dispatch,
    setTool,
    setToolSettings,
    addElement,
    updateElement,
    deleteElement,
    selectElements,
    setViewport,
    undo,
    redo,
    canUndo,
    canRedo,
  };

  return (
    <WhiteboardContext.Provider value={value}>
      {children}
    </WhiteboardContext.Provider>
  );
}

// Hook
export function useWhiteboard() {
  const context = useContext(WhiteboardContext);
  if (context === undefined) {
    throw new Error("useWhiteboard must be used within a WhiteboardProvider");
  }
  return context;
}
