import { Worker, Job } from "bullmq";
import { Oplog, type IOp } from "shared";
import { redisConnection } from "./config/redis";

export const oplogWorker = new Worker<IOp>(
  "oplog-queue",
  async (job: Job<IOp>) => {
    const op = job.data;
    const { opId, boardId } = op;

    // Idempotent upsert using compound uniqueness on (boardId, opId)
    await Oplog.updateOne(
      { boardId, opId },
      {
        $setOnInsert: {
          opId: op.opId,
          boardId: op.boardId,
          type: op.type,
          payload: op.payload,
          actorId: op.actorId,
          lamport: op.lamport,
          createdAt: new Date(op.createdAt),
        },
      },
      { upsert: true },
    );
  },
  {
    connection: redisConnection,
    concurrency: 10,
  },
);

oplogWorker.on("active", (job) => {
  console.log(`[worker] Job ${job.id} started processing.`);
});

oplogWorker.on("completed", (job) => {
  console.log(`[worker] Job ${job.id} successfully persisted to Mongo.`);
});

oplogWorker.on("failed", (job, err) => {
  console.error(`[worker] Job ${job?.id} failed with error:`, err);
});

oplogWorker.on("error", (err) => {
  console.error("[worker] Worker error occurred:", err);
});
