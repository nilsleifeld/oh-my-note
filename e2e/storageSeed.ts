/** Runs in the browser — seeds mock client via init script (Playwright serializes only the export). */
export function seedMockBlocksScript(blocks: unknown[]): void {
  window.__E2E_MOCK_BLOCKS__ = blocks as import("../src/types/models").Block[];
}

/** Runs in the browser — overwrites e2e seed (e.g. drag & drop fixtures, reload). */
export function forceSeedMockBlocksScript(blocks: unknown[]): void {
  window.__E2E_MOCK_BLOCKS__ = blocks as import("../src/types/models").Block[];
}

/** Runs in the browser — reads current mock client state. */
export function readMockBlocksScript(): unknown[] {
  return window.__omnE2e?.getBlocks() ?? [];
}
