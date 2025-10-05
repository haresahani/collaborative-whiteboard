import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import type { WhiteboardEvent, User } from "@/types/whiteboard";

interface UseWebSocketProps {
  url: string;
  boardId: string;
  user: User | null;
  onEvent: (event: WhiteboardEvent) => void;
}

export function useWebSocket({
  url,
  boardId,
  user,
  onEvent,
}: UseWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    // Create socket connection
    const socket = io(url, {
      query: { boardId, userId: user.id },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on("connect", () => {
      console.log("Connected to whiteboard server");
      setIsConnected(true);
      setError(null);

      // Join board room
      socket.emit("join-board", { boardId, user });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from whiteboard server");
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Connection error:", err);
      setError(err.message);
      setIsConnected(false);
    });

    // Whiteboard events
    socket.on("whiteboard-event", onEvent);

    // Cleanup
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [url, boardId, user, onEvent]);

  // Send event to server
  const sendEvent = (event: Omit<WhiteboardEvent, "userId" | "timestamp">) => {
    if (!socketRef.current || !user) return;

    const fullEvent: WhiteboardEvent = {
      ...event,
      userId: user.id,
      timestamp: Date.now(),
    };

    socketRef.current.emit("whiteboard-event", fullEvent);
  };

  // Send cursor position
  const sendCursor = (x: number, y: number) => {
    if (!socketRef.current || !user) return;

    socketRef.current.emit("cursor-move", {
      userId: user.id,
      x,
      y,
      timestamp: Date.now(),
    });
  };

  return {
    isConnected,
    error,
    sendEvent,
    sendCursor,
  };
}

// Mock WebSocket hook for development
export function useMockWebSocket({
  user: _user,
  onEvent: _onEvent,
}: Pick<UseWebSocketProps, "user" | "onEvent">) {
  const [isConnected, setIsConnected] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    // Simulate connection delay
    const timer = setTimeout(() => setIsConnected(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const sendEvent = (event: Omit<WhiteboardEvent, "userId" | "timestamp">) => {
    console.log("Mock WebSocket event:", event);
    // In a real implementation, this would send to server
  };

  const sendCursor = (x: number, y: number) => {
    console.log("Mock cursor position:", { x, y });
    // In a real implementation, this would send cursor position
  };

  return {
    isConnected,
    error,
    sendEvent,
    sendCursor,
  };
}
