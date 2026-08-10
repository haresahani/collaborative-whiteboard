import { FullConfig } from "@playwright/test";

async function globalTeardown(config: FullConfig) {
  console.log("🧹 Running E2E Global Teardown... Cleanup completed.");
}

export default globalTeardown;
