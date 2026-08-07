import { initTelemetry } from "infra-utils";
initTelemetry("whiteboard-api");

import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import http from "http";
import https from "https";
import { validateEnv } from "shared";

dotenv.config({
  path: path.resolve(process.cwd(), "../../env/dev.env"),
});

const validatedEnv = validateEnv(process.env);
const PORT = process.env.PORT || 1111;

async function startServer(): Promise<void> {
  try {
    const { connectDB } = await import("./config/db");
    const { default: app } = await import("./server");

    await connectDB();

    let server: http.Server | https.Server;
    const tlsEnabled = validatedEnv.TLS_ENABLED;
    const keyPath = validatedEnv.SSL_KEY_PATH;
    const certPath = validatedEnv.SSL_CERT_PATH;

    if (
      tlsEnabled &&
      keyPath &&
      certPath &&
      fs.existsSync(keyPath) &&
      fs.existsSync(certPath)
    ) {
      const options = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
      server = https.createServer(options, app);
      console.log("[api] Starting server with TLS enabled (HTTPS)");
    } else {
      server = http.createServer(app);
      if (tlsEnabled) {
        console.warn(
          "[api] TLS_ENABLED=true but SSL certificate files were not found. Falling back to HTTP.",
        );
      }
    }

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
  }
}

void startServer();
