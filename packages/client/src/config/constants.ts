// src/config/constants.ts
// Support both Vite (import.meta.env) and Jest/Node (process.env)
type EnvRecord = Record<string, string | undefined>;

const _env: EnvRecord = (() => {
  try {
    const importMeta =
      typeof import.meta !== "undefined" ? (import.meta as unknown) : undefined;
    const importMetaEnv = (importMeta as { env?: EnvRecord })?.env;

    if (importMetaEnv) {
      return importMetaEnv;
    }

    return process.env as EnvRecord;
  } catch {
    return process.env as EnvRecord;
  }
})();

export const API_URL =
  _env.VITE_API_URL ?? _env.API_URL ?? "http://localhost:3001";
export const WS_URL = _env.VITE_WS_URL ?? _env.WS_URL ?? "ws://localhost:3001";
