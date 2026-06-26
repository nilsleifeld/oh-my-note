import type {
  ApiClient,
  Block,
  BlockFilter,
  BlockSearchFilter,
  BlockSearchPage,
  DayDatesFilter,
  PagedResult,
} from "../types/models";
import {
  collectSubtreeIds,
  matchesFilter,
  pageItems,
  sortBlocks,
  upsertBlock,
} from "./blockQueryUtils";
import { searchBlocksInCorpus } from "./blockSearch";
import {
  BLOCKS_FILE_NAME,
  createBlocksFilePayload,
  parseBlocksFile,
} from "./blocksFile";

/** File System Access API client — all blocks in blocks.json within a user-chosen folder. */
export class FolderApiClient implements ApiClient {
  #handle: FileSystemDirectoryHandle;
  #blocks: Block[] = [];
  #loaded = false;
  #ready: Promise<void>;
  #persistChain: Promise<void> = Promise.resolve();

  constructor(handle: FileSystemDirectoryHandle) {
    this.#handle = handle;
    this.#ready = Promise.resolve();
  }

  async waitUntilReady(): Promise<void> {
    await this.#ready;
  }

  get folderName(): string {
    return this.#handle.name;
  }

  async #ensureLoaded(): Promise<void> {
    if (this.#loaded) return;

    try {
      const fileHandle = await this.#handle.getFileHandle(BLOCKS_FILE_NAME);
      const file = await fileHandle.getFile();
      this.#blocks = parseBlocksFile(await file.text());
    } catch {
      this.#blocks = [];
    }

    this.#loaded = true;
  }

  async #ensureReady(): Promise<void> {
    await this.#ready;
    await this.#ensureLoaded();
  }

  async #persist(): Promise<void> {
    this.#persistChain = this.#persistChain.then(async () => {
      await this.#writeBlocksFile();
    });
    await this.#persistChain;
  }

  async #writeBlocksFile(): Promise<void> {
    if (this.#blocks.length === 0) {
      try {
        await this.#handle.removeEntry(BLOCKS_FILE_NAME);
      } catch {
        // File already absent.
      }
      return;
    }

    const payload = createBlocksFilePayload(this.#blocks);
    const fileHandle = await this.#handle.getFileHandle(BLOCKS_FILE_NAME, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(payload, null, 2));
    await writable.close();
  }

  async getBlock(id: string): Promise<Block | undefined> {
    await this.#ensureReady();
    return this.#blocks.find((block) => block.id === id);
  }

  async getBlocks(filter?: BlockFilter): Promise<PagedResult<Block>> {
    await this.#ensureReady();

    const matched = this.#blocks.filter((block) =>
      matchesFilter(block, filter),
    );
    const sorted = sortBlocks(matched, filter?.sortBy);
    return pageItems(sorted, filter?.page, filter?.pageSize);
  }

  async getDayDates(filter?: DayDatesFilter): Promise<PagedResult<string>> {
    await this.#ensureReady();

    const dates = new Set<string>();
    for (const block of this.#blocks) {
      dates.add(block.day);
    }

    const sorted = [...dates].sort((a, b) => b.localeCompare(a));
    return pageItems(sorted, filter?.page, filter?.pageSize);
  }

  async searchBlocks(filter?: BlockSearchFilter): Promise<BlockSearchPage> {
    await this.#ensureReady();
    return searchBlocksInCorpus(this.#blocks, filter);
  }

  async saveBlocks(blocks: Block[]): Promise<void> {
    await this.#ensureReady();

    for (const block of blocks) {
      upsertBlock(this.#blocks, block);
    }

    await this.#persist();
  }

  async deleteBlocks(ids: string[]): Promise<void> {
    await this.#ensureReady();

    const idSet = new Set<string>();
    for (const id of ids) {
      for (const subtreeId of collectSubtreeIds(this.#blocks, id)) {
        idSet.add(subtreeId);
      }
    }

    this.#blocks = this.#blocks.filter((block) => !idSet.has(block.id));
    await this.#persist();
  }
}
