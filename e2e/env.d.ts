import type { Block } from "../src/types/models";

declare global {
  interface Window {
    __E2E_MOCK_BLOCKS__?: Block[];
    __omnE2e?: {
      getBlocks: () => Block[];
    };
  }
}

export {};
