/// <reference types="vite/client" />

declare global {
  interface Window {
    /** Set by Playwright init scripts before the mock client initializes. */
    __E2E_MOCK_BLOCKS__?: import("./types/models").Block[];
    /** Exposed under Playwright (navigator.webdriver) in mock mode. */
    __omnE2e?: {
      getBlocks: () => import("./types/models").Block[];
    };
  }

  interface ImportMetaEnv {
    /** `folder` (default) or `mock` */
    readonly VITE_API_CLIENT?: "folder" | "mock";
    /** `true` — preload sample blocks in mock client */
    readonly VITE_SEED?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
