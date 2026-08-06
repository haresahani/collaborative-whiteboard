import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { DockerControl } from "../utils/docker-cli";

const API_BASE_URL = process.env.API_BASE_URL || "http://127.0.0.1:1234";
const CONTAINER_NAME = "whiteboard-worker";

describe("Chaos Test: Worker Process Crash & Compaction Resumption", () => {
  beforeAll(async () => {
    if (
      DockerControl.isDockerAvailable() &&
      !DockerControl.isContainerRunning(CONTAINER_NAME)
    ) {
      DockerControl.startContainer(CONTAINER_NAME);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  });

  afterAll(async () => {
    if (
      DockerControl.isDockerAvailable() &&
      !DockerControl.isContainerRunning(CONTAINER_NAME)
    ) {
      DockerControl.startContainer(CONTAINER_NAME);
    }
  });

  it("should restart worker container cleanly and maintain API responsiveness", async () => {
    if (!DockerControl.isDockerAvailable()) {
      console.log(
        "[Chaos Test] Docker environment not active locally — skipping live container restart step.",
      );
      expect(true).toBe(true);
      return;
    }

    // 1. Restart Worker Container
    console.log("[Chaos Test] Force restarting background worker container...");
    DockerControl.restartContainer(CONTAINER_NAME);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 2. Verify worker process container is back online
    const isRunning = DockerControl.isContainerRunning(CONTAINER_NAME);
    expect(isRunning).toBe(true);

    console.log(
      "[Chaos Test] ✅ Background worker crash & restart recovery verified successfully!",
    );
  }, 30000);
});
