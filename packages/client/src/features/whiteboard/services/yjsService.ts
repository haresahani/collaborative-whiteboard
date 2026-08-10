import * as Y from "yjs";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
} from "y-protocols/awareness";
import { socketService } from "../../../api/ws";



class YjsService {
  private doc: Y.Doc | null = null;
  private awareness: Awareness | null = null;
  private currentBoardId: string | null = null;

  initBoard(boardId: string, initialYjsState?: Uint8Array) {
    if (this.doc && this.currentBoardId === boardId) return;

    this.destroy();

    this.currentBoardId = boardId;
    this.doc = new Y.Doc();
    this.awareness = new Awareness(this.doc);

    if (initialYjsState && initialYjsState.length > 0) {
      Y.applyUpdate(this.doc, initialYjsState, "init");
    }

    this.doc.on("update", (update: Uint8Array, origin: unknown) => {
      if (origin !== "remote" && origin !== "init" && this.currentBoardId) {
        socketService.emitYjsUpdate(this.currentBoardId, update);
      }
    });

    this.awareness.on(
      "update",
      (
        {
          added,
          updated,
          removed,
        }: { added: number[]; updated: number[]; removed: number[] },
        origin: unknown,
      ) => {
        if (origin !== "remote" && this.currentBoardId && this.awareness) {
          const changedClients = added.concat(updated, removed);
          if (changedClients.length > 0) {
            const awarenessUpdate = encodeAwarenessUpdate(
              this.awareness,
              changedClients,
            );
            socketService.emitYjsAwareness(
              this.currentBoardId,
              awarenessUpdate,
            );
          }
        }
      },
    );
  }

  applyRemoteUpdate(update: Uint8Array) {
    if (this.doc && update && update.length > 0) {
      Y.applyUpdate(this.doc, update, "remote");
    }
  }

  applyRemoteAwareness(update: Uint8Array) {
    if (this.awareness && update && update.length > 0) {
      applyAwarenessUpdate(this.awareness, update, "remote");
    }
  }

  onAwarenessChange(callback: () => void): () => void {
    if (!this.awareness) return () => {};
    const listener = () => callback();
    this.awareness.on("change", listener);
    return () => {
      this.awareness?.off("change", listener);
    };
  }

  destroy() {
    if (this.awareness) {
      this.awareness.destroy();
      this.awareness = null;
    }
    if (this.doc) {
      this.doc.destroy();
      this.doc = null;
    }
    this.currentBoardId = null;
  }
}

export const yjsService = new YjsService();
