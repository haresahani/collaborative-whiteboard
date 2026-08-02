import { describe, it, expect } from "vitest";
import { encodeOpBatch } from "../binaryEncoding";
import type { IOp } from "../../oplog";

describe("Bandwidth Compression Benchmark", () => {
  it("should demonstrate significant byte size reduction with MessagePack and batching", () => {
    // Generate 50 synthetic high-frequency cursor moves and ops
    const rawOps: IOp[] = Array.from({ length: 50 }, (_, i) => ({
      opId: `10000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
      boardId: "board-bench-123",
      type: i % 2 === 0 ? "stroke.point" : "element.update",
      payload: { x: i * 5, y: i * 5 + 10, strokeColor: "#3b82f6" },
      actorId: "user-bench-456",
      lamport: i + 1,
      createdAt: "2026-08-02T12:00:00.000Z",
    }));

    // 1. Unbatched JSON stringified total size over network
    const jsonUnbatchedSize = rawOps.reduce(
      (acc, op) => acc + JSON.stringify(op).length,
      0,
    );

    // 2. Batched + MessagePack serialized total size
    const msgpackBatchedBytes = encodeOpBatch(rawOps);
    const msgpackBatchedSize = msgpackBatchedBytes.byteLength;

    const reductionPercent = (
      ((jsonUnbatchedSize - msgpackBatchedSize) / jsonUnbatchedSize) *
      100
    ).toFixed(1);

    console.log(
      `[Benchmark Results] Unbatched JSON size: ${jsonUnbatchedSize} bytes | Batched + MessagePack size: ${msgpackBatchedSize} bytes | Reduction: ${reductionPercent}%`,
    );

    expect(msgpackBatchedSize).toBeLessThan(jsonUnbatchedSize);
  });
});
