/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_NODE_ENV: "development" | "production" | "test";
  // add more env vars here...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
