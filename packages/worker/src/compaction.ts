import {
  Oplog,
  Snapshot,
  type IOp,
  applyOperation,
  type ISharedElement,
} from "shared";
import { redisConnection } from "./config/redis";
import mongoose from "mongoose";

const DEFAULT_THRESHOLD_OPS = 10;
const DEFAULT_THRESHOLD_TIME_MS = 60 * 1000;

export async function tryCompact(boardId: string): Promise<void> {
  const lockKey = `compact:${boardId}`;

  // 1. Acquire Redis lock with a 5-second TTL
  const lockAcquired = await redisConnection.set(
    lockKey,
    "1",
    "PX",
    5000,
    "NX",
  );
  if (!lockAcquired) {
    // Lock already held by another worker thread compaction run
    return;
  }

  try {
    const thresholdOps = process.env.COMPACTION_THRESHOLD_OPS
      ? parseInt(process.env.COMPACTION_THRESHOLD_OPS, 10)
      : DEFAULT_THRESHOLD_OPS;
    const thresholdTimeMs = process.env.COMPACTION_THRESHOLD_TIME_MS
      ? parseInt(process.env.COMPACTION_THRESHOLD_TIME_MS, 10)
      : DEFAULT_THRESHOLD_TIME_MS;

    // 2. Fetch the latest snapshot
    const latestSnapshot = await Snapshot.findOne({ boardId })
      .sort({ opIndex: -1 })
      .exec();

    const lastOpIndex = latestSnapshot ? latestSnapshot.opIndex : 0;

    // 3. Fetch persisted oplogs from MongoDB after lastOpIndex sorted by (lamport, opId)
    const oplogs = await Oplog.find({
      boardId,
      lamport: { $gt: lastOpIndex },
    })
      .sort({ lamport: 1, opId: 1 })
      .exec();

    if (oplogs.length === 0) {
      return;
    }

    // 4. Contiguous run check
    const contiguousOps: IOp[] = [];
    let nextExpectedLamport = lastOpIndex + 1;

    for (const op of oplogs) {
      if (op.lamport === nextExpectedLamport) {
        contiguousOps.push(op);
        nextExpectedLamport++;
      } else if (op.lamport === nextExpectedLamport - 1) {
        // Concurrent op at the same level
        contiguousOps.push(op);
      } else if (op.lamport > nextExpectedLamport) {
        // Gap detected!
        break;
      }
    }

    if (contiguousOps.length === 0) {
      return;
    }

    // 5. Check thresholds against the contiguous run
    const timeElapsed = latestSnapshot
      ? Date.now() - new Date(latestSnapshot.createdAt).getTime()
      : Infinity;

    const shouldCompact =
      contiguousOps.length >= thresholdOps || timeElapsed >= thresholdTimeMs;

    if (!shouldCompact) {
      return;
    }

    // 6. Compact state
    let elements: ISharedElement[] = [];
    if (latestSnapshot && latestSnapshot.snapshotJson) {
      const sJson = latestSnapshot.snapshotJson;
      const strokes = sJson.strokes || [];
      const shapes = sJson.shapes || [];
      const notes = sJson.notes || []; // Maps notes to text on client
      elements = [...strokes, ...shapes, ...notes] as ISharedElement[];
    }

    // Sequentially apply contiguous ops
    for (const op of contiguousOps) {
      elements = applyOperation(elements, op);
    }

    // Regroup elements for snapshot storage
    const strokes: ISharedElement[] = [];
    const shapes: ISharedElement[] = [];
    const notes: ISharedElement[] = [];

    for (const el of elements) {
      if (el.type === "stroke") {
        strokes.push(el);
      } else if (el.type === "rectangle" || el.type === "arrow") {
        shapes.push(el);
      } else if (el.type === "text") {
        notes.push(el);
      }
    }

    const newOpIndex = contiguousOps[contiguousOps.length - 1].lamport;

    // 7. Upsert snapshot idempotently using atomic compound unique check
    const newSnapshot = await Snapshot.findOneAndUpdate(
      { boardId, opIndex: newOpIndex },
      {
        $setOnInsert: {
          boardId: new mongoose.Types.ObjectId(boardId),
          opIndex: newOpIndex,
          snapshotJson: { strokes, shapes, notes },
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    console.log(
      `[worker] Compacted ${contiguousOps.length} ops for board ${boardId} into snapshot at version ${newOpIndex}`,
    );

    // 8. Update board record's lastSnapshotId reference
    await mongoose.connection
      .collection("boards")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(boardId) },
        { $set: { lastSnapshotId: newSnapshot._id } },
      );
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      console.log(
        `[worker] Snapshot for board ${boardId} already exists (concurrent write check).`,
      );
    } else {
      console.error(`[worker] Compaction failed for board ${boardId}:`, err);
    }
  } finally {
    // Release lock
    await redisConnection.del(lockKey);
  }
}
