import { FullConfig } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup(config: FullConfig) {
  console.log("🚀 Initializing E2E Global Setup...");

  const authDir = path.join(__dirname, "auth");
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const mockStorageState = {
    cookies: [],
    origins: [
      {
        origin: "http://localhost:5173",
        localStorage: [
          { name: "token", value: "e2e_mock_storage_state_token" },
          {
            name: "user",
            value: JSON.stringify({
              id: "e2e-user",
              displayName: "E2E Test User",
            }),
          },
        ],
      },
    ],
  };

  fs.writeFileSync(
    path.join(authDir, "user.json"),
    JSON.stringify(mockStorageState, null, 2),
  );
  console.log(
    "✅ Global Setup completed: Initialized auth/user.json storage state.",
  );
}

export default globalSetup;
