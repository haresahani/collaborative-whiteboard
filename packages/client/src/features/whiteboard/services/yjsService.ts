import * as Y from "yjs";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
} from "y-protocols/awareness";
import { socketService } from "../../../api/ws";

export interface StickyAwarenessState {
  stickyId: string;
  user: {
    name: string;
    color: string;
  };
  cursor?: {
    index: number;
    length: number;
  };
}

class YjsService {
  private doc: Y.Doc | null = null;
  private awareness: Awareness | null = null;
  private currentBoardId: string | null = null;
  private stickyMap: Y.Map<Y.Text> | null = null;

  initBoard(boardId: string, initialYjsState?: Uint8Array) {
    if (this.doc && this.currentBoardId === boardId) return;

    this.destroy();

    this.currentBoardId = boardId;
    this.doc = new Y.Doc();
    this.awareness = new Awareness(this.doc);
    this.stickyMap = this.doc.getMap<Y.Text>("sticky-notes");

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

  getStickyText(stickyId: string): Y.Text {
    if (!this.doc || !this.stickyMap) {
      this.initBoard("default");
    }
    let ytext = this.stickyMap!.get(stickyId);
    if (!ytext) {
      ytext = new Y.Text();
      this.stickyMap!.set(stickyId, ytext);
    }
    return ytext;
  }

  deleteStickyText(stickyId: string) {
    if (this.stickyMap) {
      this.stickyMap.delete(stickyId);
    }
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

  setLocalStickyAwareness(
    stickyId: string | null,
    user?: { name: string; color: string },
    cursor?: { index: number; length: number },
  ) {
    if (!this.awareness) return;
    if (!stickyId) {
      this.awareness.setLocalState(null);
    } else {
      this.awareness.setLocalStateField("sticky", {
        stickyId,
        user: user || { name: "User", color: "#3b82f6" },
        cursor,
      });
    }
  }

  getAwarenessStatesForSticky(stickyId: string): StickyAwarenessState[] {
    if (!this.awareness) return [];
    const result: StickyAwarenessState[] = [];
    this.awareness.getStates().forEach((state, clientId) => {
      if (clientId === this.awareness?.clientID) return;
      const stickyState = state.sticky as StickyAwarenessState | undefined;
      if (stickyState && stickyState.stickyId === stickyId) {
        result.push(stickyState);
      }
    });
    return result;
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
    this.stickyMap = null;
    this.currentBoardId = null;
  }
}

export const yjsService = new YjsService();
