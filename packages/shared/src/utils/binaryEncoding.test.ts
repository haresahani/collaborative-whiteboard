import { describe, it, expect } from "vitest";
import {
  encodeBinaryPayload,
  decodeBinaryPayload,
  encodeOpBatch,
  decodeOpBatch,
  encodeCursorBatch,
  decodeCursorBatch,
} from "./binaryEncoding";
import type { IOp } from "../oplog";

describe("binaryEncoding", () => {
  it("encodes and decodes arbitrary payloads using MessagePack", () => {
    const data = {
      hello: "world",
      count: 42,
      points: [
        [10, 20],
        [30, 40],
      ],
    };
    const encoded = encodeBinaryPayload(data);
    expect(encoded).toBeInstanceOf(Uint8Array);
    const decoded = decodeBinaryPayload<typeof data>(encoded);
    expect(decoded).toEqual(data);
  });

  it("encodes and decodes op batches correctly", () => {
    const ops: IOp[] = [
      {
        opId: "11111111-1111-1111-1111-111111111111",
        boardId: "board-1",
        type: "stroke.finalize",
        payload: {
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
          ],
        },
        actorId: "user-1",
        lamport: 1,
        createdAt: "2026-08-02T12:00:00.000Z",
      },
      {
        opId: "22222222-2222-2222-2222-222222222222",
        boardId: "board-1",
        type: "element.update",
        payload: { id: "el-1", updates: { x: 50 } },
        actorId: "user-2",
        lamport: 2,
        createdAt: "2026-08-02T12:00:01.000Z",
      },
    ];

    const encoded = encodeOpBatch(ops);
    const decoded = decodeOpBatch(encoded);
    expect(decoded).toEqual(ops);
  });

  it("encodes and decodes cursor move batches correctly", () => {
    const cursors = [
      { userId: "user-1", displayName: "Alice", x: 100, y: 200, tool: "pen" },
      { userId: "user-2", displayName: "Bob", x: 300, y: 400, tool: "eraser" },
    ];

    const encoded = encodeCursorBatch(cursors);
    const decoded = decodeCursorBatch(encoded);
    expect(decoded).toEqual(cursors);
  });
});
