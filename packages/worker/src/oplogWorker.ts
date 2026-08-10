import { Worker, Job } from "bullmq";
import { type IOp } from "shared";
import { Oplog, YjsUpdate } from "shared/models";
import { redisConnection } from "./config/redis";
import { tryCompact, tryCompactYjs } from "./compaction";
import {
  persistenceLatencyHistogram,
  compactionLatencyHistogram,
  jobsCompletedCounter,
  jobsFailedCounter,
  jobDurationHistogram,
  logger,
  getTracer,
} from "infra-utils";

const tracer = getTracer("oplog-worker");

export const oplogWorker = new Worker<IOp>(
  "oplog-queue",
  async (job: Job<IOp>) => {
    const span = tracer.startSpan("oplogWorker.processJob");
    const op = job.data;
    const { opId, boardId } = op;
    const startJob = Date.now();

    try {
      if (op.type === "sticky.textUpdate") {
        const rawUpdate = op.payload.update;
        const buffer =
          typeof rawUpdate === "string"
            ? Buffer.from(rawUpdate, "base64")
            : Buffer.from(rawUpdate as number[]);

        const startPersist = Date.now();
        await YjsUpdate.updateOne(
          { boardId, opId },
          {
            $setOnInsert: {
              boardId,
              opId,
              update: buffer,
              lamport: op.lamport,
              createdAt: new Date(op.createdAt),
            },
          },
          { upsert: true },
        );
        const persistDuration = (Date.now() - startPersist) / 1000;
        persistenceLatencyHistogram.observe({ branch: "yjs" }, persistDuration);

        const startCompact = Date.now();
        await tryCompactYjs(boardId);
        const compactDuration = (Date.now() - startCompact) / 1000;
        compactionLatencyHistogram.observe({ branch: "yjs" }, compactDuration);

        jobsCompletedCounter.inc({ queue: "oplog-queue" });
        jobDurationHistogram.observe(
          { queue: "oplog-queue" },
          (Date.now() - startJob) / 1000,
        );
        return;
      }

      // Idempotent upsert using compound uniqueness on (boardId, opId)
      const startPersist = Date.now();
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
      const persistDuration = (Date.now() - startPersist) / 1000;
      persistenceLatencyHistogram.observe({ branch: "oplog" }, persistDuration);

      // Run compaction check asynchronously
      const startCompact = Date.now();
      await tryCompact(boardId);
      const compactDuration = (Date.now() - startCompact) / 1000;
      compactionLatencyHistogram.observe({ branch: "oplog" }, compactDuration);

      jobsCompletedCounter.inc({ queue: "oplog-queue" });
      jobDurationHistogram.observe(
        { queue: "oplog-queue" },
        (Date.now() - startJob) / 1000,
      );
    } catch (err) {
      jobsFailedCounter.inc({
        queue: "oplog-queue",
        reason: err instanceof Error ? err.name : "unknown",
      });
      logger.error(
        { err, jobId: job.id, opId, boardId },
        "[worker] Job execution error",
      );
      throw err;
    } finally {
      span.end();
    }
  },
  {
    connection: redisConnection,
    concurrency: 10,
  },
);

oplogWorker.on("active", (job) => {
  logger.info({ jobId: job.id }, "[worker] Job started processing.");
});

oplogWorker.on("completed", (job) => {
  logger.info(
    { jobId: job.id },
    "[worker] Job successfully persisted to Mongo.",
  );
});

oplogWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "[worker] Job failed with error");
});

oplogWorker.on("error", (err) => {
  logger.error({ err }, "[worker] Worker error occurred");
});
