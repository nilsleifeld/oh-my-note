import type {
  ApiClient,
  Block,
  BlockFilter,
  DayDatesFilter,
  PagedResult,
} from "../types/models";
import {
  collectSubtreeIds,
  matchesFilter,
  normalizeBlock,
  pageItems,
  sortBlocks,
  upsertBlock,
} from "./blockQueryUtils";
import { createMockSeedBlocks } from "./mockSeedData";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Simulates typical round-trip latency for local or regional API calls. */
function mockDelay(): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.webdriver) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(resolve, randomInt(120, 350));
  });
}

function initialMockBlocks(): Block[] {
  if (
    typeof window !== "undefined" &&
    Array.isArray(window.__E2E_MOCK_BLOCKS__)
  ) {
    return window.__E2E_MOCK_BLOCKS__.map(normalizeBlock);
  }
  return import.meta.env.VITE_SEED === "true" ? createMockSeedBlocks() : [];
}

/** In-memory API client — set `VITE_API_CLIENT=mock`. */
export class MockApiClient implements ApiClient {
  #blocks: Block[] = initialMockBlocks();

  getBlocksSnapshot(): Block[] {
    return structuredClone(this.#blocks);
  }

  async getBlock(id: string): Promise<Block | undefined> {
    await mockDelay();
    const block = this.#blocks.find((entry) => entry.id === id);
    return block ? normalizeBlock(block) : undefined;
  }

  async getBlocks(filter?: BlockFilter): Promise<PagedResult<Block>> {
    await mockDelay();
    const matched = this.#blocks
      .filter((block) => matchesFilter(block, filter))
      .map(normalizeBlock);
    const sorted = sortBlocks(matched, filter?.sortBy);
    return pageItems(sorted, filter?.page, filter?.pageSize);
  }

  async getDayDates(filter?: DayDatesFilter): Promise<PagedResult<string>> {
    await mockDelay();
    const dates = new Set(
      this.#blocks
        .filter((block) => block.parentId === null)
        .map((block) => block.day),
    );
    const sorted = [...dates].sort((a, b) => b.localeCompare(a));
    return pageItems(sorted, filter?.page, filter?.pageSize);
  }

  async saveBlocks(blocks: Block[]): Promise<void> {
    await mockDelay();
    for (const block of blocks) {
      upsertBlock(this.#blocks, block);
    }
  }

  async deleteBlocks(ids: string[]): Promise<void> {
    await mockDelay();
    const idSet = new Set<string>();
    for (const id of ids) {
      for (const subtreeId of collectSubtreeIds(this.#blocks, id)) {
        idSet.add(subtreeId);
      }
    }
    this.#blocks = this.#blocks.filter((block) => !idSet.has(block.id));
  }
}
