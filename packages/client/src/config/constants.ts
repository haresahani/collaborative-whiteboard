// src/config/constants.ts
// Support both Vite (import.meta.env) and Jest/Node (process.env)
const _env: Record<string, string | undefined> = (() => {
  try {
    // @ts-expect-error - import.meta may not exist in Node
    return typeof import.meta !== "undefined" && import.meta?.env
      ? // @ts-expect-error - import.meta.env is not typed in Node environment
        import.meta.env
      : (process.env as Record<string, string | undefined>);
  } catch {
    return process.env as Record<string, string | undefined>;
  }
})();

export const API_URL =
  _env.VITE_API_URL ?? _env.API_URL ?? "http://localhost:3001";
export const WS_URL = _env.VITE_WS_URL ?? _env.WS_URL ?? "ws://localhost:3001";
