export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
  cursor?: Point;
  isOnline: boolean;
}

export interface DrawingElement {
  id: string;
  type: 'path' | 'rectangle' | 'circle' | 'line' | 'text' | 'sticky-note';
  position: Point;
  size: Size;
  rotation: number;
  style: {
    stroke: string;
    strokeWidth: number;
    fill: string;
    opacity: number;
  };
  data: Record<string, any>;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface DrawingPath extends DrawingElement {
  type: 'path';
  data: {
    points: Point[];
    smooth: boolean;
  };
}

export interface StickyNote extends DrawingElement {
  type: 'sticky-note';
  data: {
    text: string;
    color: string;
  };
}

export interface TextElement extends DrawingElement {
  type: 'text';
  data: {
    text: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
  };
}

export type DrawingTool = 
  | 'select' 
  | 'pen' 
  | 'line' 
  | 'rectangle' 
  | 'circle' 
  | 'text' 
  | 'sticky-note' 
  | 'eraser'
  | 'hand';

export interface WhiteboardState {
  elements: DrawingElement[];
  selectedElements: string[];
  tool: DrawingTool;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  history: {
    past: DrawingElement[][];
    present: DrawingElement[];
    future: DrawingElement[][];
  };
  users: Record<string, User>;
  currentUser: User | null;
  isConnected: boolean;
}

export interface WhiteboardEvent {
  type: 'element-created' | 'element-updated' | 'element-deleted' | 'cursor-moved' | 'user-joined' | 'user-left';
  userId: string;
  timestamp: number;
  data: any;
}

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}