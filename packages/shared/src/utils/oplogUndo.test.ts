import { describe, it, expect } from "vitest";
import {
  applyOperation,
  replayOperations,
  type ISharedElement,
  type IOp,
} from "../oplog";

describe("Oplog Undo & Redo (Tombstones & Inverse Ops)", () => {
  it("should soft-delete (tombstone) created elements on op.undo and untombstone on op.redo", () => {
    const createOp: IOp = {
      opId: "op-create-1",
      boardId: "board-1",
      type: "element.create",
      actorId: "user-a",
      lamport: 1,
      createdAt: new Date().toISOString(),
      payload: {
        element: {
          id: "rect-1",
          type: "rectangle",
          x: 50,
          y: 50,
        },
      },
    };

    const undoOp: IOp = {
      opId: "op-undo-1",
      boardId: "board-1",
      type: "op.undo",
      actorId: "user-a",
      lamport: 2,
      createdAt: new Date().toISOString(),
      payload: {
        targetOpId: "op-create-1",
        targetOpType: "element.create",
        tombstoneId: "rect-1",
      },
    };

    const redoOp: IOp = {
      opId: "op-redo-1",
      boardId: "board-1",
      type: "op.redo",
      actorId: "user-a",
      lamport: 3,
      createdAt: new Date().toISOString(),
      payload: {
        targetOpId: "op-create-1",
        targetOpType: "element.create",
        tombstoneId: "rect-1",
      },
    };

    let state = applyOperation([], createOp);
    expect(state.length).toBe(1);
    expect(state[0].tombstoned).toBe(false);

    // Apply Undo -> soft-delete
    state = applyOperation(state, undoOp);
    expect(state.length).toBe(1);
    expect(state[0].tombstoned).toBe(true);

    // Apply Redo -> untombstone
    state = applyOperation(state, redoOp);
    expect(state.length).toBe(1);
    expect(state[0].tombstoned).toBe(false);
  });

  it("should restore deleted elements on op.undo and re-tombstone on op.redo", () => {
    const initialElement: ISharedElement = {
      id: "rect-2",
      type: "rectangle",
      x: 100,
      y: 100,
      tombstoned: false,
    };

    const deleteOp: IOp = {
      opId: "op-del-1",
      boardId: "board-1",
      type: "element.delete",
      actorId: "user-a",
      lamport: 2,
      createdAt: new Date().toISOString(),
      payload: { id: "rect-2" },
    };

    const undoDeleteOp: IOp = {
      opId: "op-undo-del-1",
      boardId: "board-1",
      type: "op.undo",
      actorId: "user-a",
      lamport: 3,
      createdAt: new Date().toISOString(),
      payload: {
        targetOpId: "op-del-1",
        targetOpType: "element.delete",
        tombstoneId: "rect-2",
        inversePayload: { restoredElement: initialElement },
      },
    };

    const redoDeleteOp: IOp = {
      opId: "op-redo-del-1",
      boardId: "board-1",
      type: "op.redo",
      actorId: "user-a",
      lamport: 4,
      createdAt: new Date().toISOString(),
      payload: {
        targetOpId: "op-del-1",
        targetOpType: "element.delete",
        tombstoneId: "rect-2",
      },
    };

    let state = applyOperation([initialElement], deleteOp);
    expect(state[0].tombstoned).toBe(true);

    // Undo delete -> restored (tombstoned = false)
    state = applyOperation(state, undoDeleteOp);
    expect(state[0].tombstoned).toBe(false);

    // Redo delete -> tombstoned = true again
    state = applyOperation(state, redoDeleteOp);
    expect(state[0].tombstoned).toBe(true);
  });

  it("should handle op.undo idempotently", () => {
    const createOp: IOp = {
      opId: "op-create-2",
      boardId: "board-1",
      type: "element.create",
      actorId: "user-a",
      lamport: 1,
      createdAt: new Date().toISOString(),
      payload: {
        element: { id: "stroke-1", type: "stroke" },
      },
    };

    const undoOp: IOp = {
      opId: "op-undo-2",
      boardId: "board-1",
      type: "op.undo",
      actorId: "user-a",
      lamport: 2,
      createdAt: new Date().toISOString(),
      payload: {
        targetOpId: "op-create-2",
        tombstoneId: "stroke-1",
      },
    };

    let state = applyOperation([], createOp);
    state = applyOperation(state, undoOp);
    const firstUndoState = state;

    // Apply same undo operation again (duplicate delivery)
    state = applyOperation(state, undoOp);
    expect(state).toEqual(firstUndoState);
  });

  it("should reject op.undo if element has been modified by a higher Lamport clock from another client [FIX 4]", () => {
    const createOp: IOp = {
      opId: "op-create-3",
      boardId: "board-1",
      type: "element.create",
      actorId: "user-a",
      lamport: 1,
      createdAt: new Date().toISOString(),
      payload: {
        element: { id: "el-3", type: "rectangle", x: 0, y: 0 },
      },
    };

    const updateFromB: IOp = {
      opId: "op-update-b",
      boardId: "board-1",
      type: "element.update",
      actorId: "user-b",
      lamport: 10,
      createdAt: new Date().toISOString(),
      payload: {
        id: "el-3",
        updates: { x: 500 },
      },
    };

    const staleUndoFromA: IOp = {
      opId: "op-undo-a",
      boardId: "board-1",
      type: "op.undo",
      actorId: "user-a",
      lamport: 11,
      createdAt: new Date().toISOString(),
      payload: {
        targetOpId: "op-create-3",
        targetOpType: "element.create",
        targetLamport: 1,
        tombstoneId: "el-3",
      },
    };

    let state = applyOperation([], createOp);
    state = applyOperation(state, updateFromB);

    // User A attempts to undo creation from lamport 1 after User B updated at lamport 10
    const stateAfterStaleUndo = applyOperation(state, staleUndoFromA);

    // Undo rejected! Element remains intact with User B's edits
    expect(stateAfterStaleUndo.find((el) => el.id === "el-3")?.tombstoned).toBe(
      false,
    );
    expect(stateAfterStaleUndo.find((el) => el.id === "el-3")?.x).toBe(500);
  });

  it("should produce consistent board state for late joiners replaying oplogs with undo/redo", () => {
    const oplogs: IOp[] = [
      {
        opId: "op-1",
        boardId: "b1",
        type: "element.create",
        actorId: "user-a",
        lamport: 1,
        createdAt: "2026-08-02T10:00:00.000Z",
        payload: { element: { id: "el-x", type: "rectangle", x: 10 } },
      },
      {
        opId: "op-2",
        boardId: "b1",
        type: "element.update",
        actorId: "user-a",
        lamport: 2,
        createdAt: "2026-08-02T10:01:00.000Z",
        payload: { id: "el-x", updates: { x: 20 } },
      },
      {
        opId: "op-3",
        boardId: "b1",
        type: "op.undo",
        actorId: "user-a",
        lamport: 3,
        createdAt: "2026-08-02T10:02:00.000Z",
        payload: {
          targetOpId: "op-2",
          targetOpType: "element.update",
          tombstoneId: "el-x",
          inversePayload: { inverseUpdates: { x: 10 } },
        },
      },
    ];

    const replayedState = replayOperations([], oplogs);
    const element = replayedState.find((el) => el.id === "el-x");
    expect(element?.x).toBe(10);
  });
});
