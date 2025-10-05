// import * as React from 'react';
// import { WhiteboardEvent } from '@/types/whiteboard';

// type EventCallback = (event: WhiteboardEvent) => void;

// class WebSocketManager {
//   private ws: WebSocket | null = null;
//   private callbacks: Set<EventCallback> = new Set();
//   private reconnectAttempts = 0;
//   private maxReconnectAttempts = 5;
//   private reconnectDelay = 1000;
//   private isIntentionallyClosed = false;

//   connect(boardId: string, userId: string) {
//     if (this.ws?.readyState === WebSocket.OPEN) {
//       console.log('[DEBUG ws.ts] WebSocket already connected');
//       return;
//     }

//     this.isIntentionallyClosed = false;
//     const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

//     try {
//       console.log('[DEBUG ws.ts] Connecting to WebSocket:', `${wsUrl}/whiteboard/${boardId}?userId=${userId}`);
//       this.ws = new WebSocket(`${wsUrl}/whiteboard/${boardId}?userId=${userId}`);

//       this.ws.onopen = () => {
//         console.log('[DEBUG ws.ts] WebSocket connected');
//         this.reconnectAttempts = 0;
//       };

//       this.ws.onmessage = (event) => {
//         try {
//           const data = JSON.parse(event.data) as WhiteboardEvent;
//           console.log('[DEBUG ws.ts] Received WebSocket message:', data);
//           this.callbacks.forEach(cb => cb(data));
//         } catch (error) {
//           console.error('[DEBUG ws.ts] Failed to parse WebSocket message:', error);
//         }
//       };

//       this.ws.onerror = (error) => {
//         console.error('[DEBUG ws.ts] WebSocket error:', error);
//       };

//       this.ws.onclose = () => {
//         console.log('[DEBUG ws.ts] WebSocket closed');
//         if (!this.isIntentionallyClosed) {
//           this.attemptReconnect(boardId, userId);
//         }
//       };
//     } catch (error) {
//       console.error('[DEBUG ws.ts] Failed to create WebSocket:', error);
//     }
//   }

//   private attemptReconnect(boardId: string, userId: string) {
//     if (this.reconnectAttempts < this.maxReconnectAttempts) {
//       this.reconnectAttempts++;
//       console.log(`[DEBUG ws.ts] Reconnecting... Attempt ${this.reconnectAttempts}`);
//       setTimeout(() => {
//         this.connect(boardId, userId);
//       }, this.reconnectDelay * this.reconnectAttempts);
//     } else {
//       console.error('[DEBUG ws.ts] Max reconnection attempts reached');
//     }
//   }

//   disconnect() {
//     this.isIntentionallyClosed = true;
//     if (this.ws) {
//       console.log('[DEBUG ws.ts] Disconnecting WebSocket');
//       this.ws.close();
//       this.ws = null;
//     }
//   }

//   onEvent(callback: EventCallback) {
//     this.callbacks.add(callback);
//     return () => this.callbacks.delete(callback);
//   }

//   send(event: WhiteboardEvent) {
//     if (this.ws?.readyState === WebSocket.OPEN) {
//       console.log('[DEBUG ws.ts] Sending WebSocket event:', event);
//       this.ws.send(JSON.stringify(event));
//     } else {
//       console.warn('[DEBUG ws.ts] WebSocket not connected, event not sent:', event.type);
//     }
//   }
// }

// // Singleton instance
// export const wsManager = new WebSocketManager();

// // Helper function for the store
// export function emitEvent(event: WhiteboardEvent) {
//   console.log('[DEBUG ws.ts] emitEvent called:', event);
//   wsManager.send(event);
// }

// // Hook for components
// export function useWebSocket(boardId: string, userId: string, onEvent: EventCallback) {
//   React.useEffect(() => {
//     if (!boardId || !userId) {
//       console.log('[DEBUG ws.ts] useWebSocket: Missing boardId or userId');
//       return;
//     }

//     console.log('[DEBUG ws.ts] useWebSocket: Connecting for boardId:', boardId, 'userId:', userId);
//     wsManager.connect(boardId, userId);
//     const unsubscribe = wsManager.onEvent(onEvent);

//     return () => {
//       console.log('[DEBUG ws.ts] useWebSocket: Cleaning up');
//       unsubscribe();
//       wsManager.disconnect();
//     };
//   }, [boardId, userId, onEvent]);

//   return {
//     sendCursor: (x: number, y: number) => {
//       console.log('[DEBUG ws.ts] sendCursor:', { x, y });
//       wsManager.send({
//         type: 'cursor-moved',
//         userId,
//         timestamp: Date.now(),
//         data: { cursor: { x, y } }
//       });
//     }
//   };
// }
