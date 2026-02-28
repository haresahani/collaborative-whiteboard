// src/config/constants.ts
// Support both Vite (import.meta.env) and Jest/Node (process.env)
type EnvRecord = Record<string, string | undefined>;

const _env: EnvRecord = (() => {
  try {
    const importMeta =
      typeof import.meta !== "undefined" ? (import.meta as unknown) : undefined;
    const importMetaEnv = (importMeta as { env?: EnvRecord } | undefined)?.env;

    if (importMetaEnv) {
      return importMetaEnv;
    }

    if (typeof process !== "undefined" && process.env) {
      return process.env as EnvRecord;
    }

    return {};
  } catch {
    if (typeof process !== "undefined" && process.env) {
      return process.env as EnvRecord;
    }
    return {};
  }
})();

export const API_URL =
  _env.VITE_API_URL ?? _env.API_URL ?? "http://localhost:3001";
export const WS_URL = _env.VITE_WS_URL ?? _env.WS_URL ?? "ws://localhost:3001";

/** Socket.IO expects HTTP URL; use same host as API if WS_URL not set */
export const SOCKET_IO_URL =
  (_env.VITE_WS_URL ?? _env.WS_URL)
    ? String(_env.VITE_WS_URL ?? _env.WS_URL).replace(/^ws:\/\//, "http://")
    : API_URL;
