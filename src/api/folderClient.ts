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
  pageItems,
  sortBlocks,
  upsertBlock,
} from "./blockQueryUtils";
import {
  createDayFilePayload,
  DAY_FILE_PATTERN,
  dayFileName,
  parseDayFile,
} from "./dayFile";

/** File System Access API client — one JSON file per day in a user-chosen folder. */
export class FolderApiClient implements ApiClient {
  #handle: FileSystemDirectoryHandle;
  #blocks: Block[] = [];
  #loadedDays = new Set<string>();
  #knownDates = new Set<string>();
  #ready: Promise<void>;
  #persistChain: Promise<void> = Promise.resolve();

  constructor(handle: FileSystemDirectoryHandle) {
    this.#handle = handle;
    this.#ready = this.#scanDirectory();
  }

  async waitUntilReady(): Promise<void> {
    await this.#ready;
  }

  get folderName(): string {
    return this.#handle.name;
  }

  async #scanDirectory(): Promise<void> {
    for await (const entry of this.#handle.values()) {
      if (entry.kind !== "file") continue;
      const match = entry.name.match(DAY_FILE_PATTERN);
      if (match) {
        this.#knownDates.add(match[1]);
      }
    }
  }

  async #ensureDayLoaded(day: string): Promise<void> {
    if (this.#loadedDays.has(day)) return;

    try {
      const fileHandle = await this.#handle.getFileHandle(dayFileName(day));
      const file = await fileHandle.getFile();
      const dayBlocks = parseDayFile(await file.text(), day);
      for (const block of dayBlocks) {
        upsertBlock(this.#blocks, block);
      }
    } catch {
      // Day file does not exist yet.
    }

    this.#loadedDays.add(day);
    this.#knownDates.add(day);
  }

  async #ensureAllLoaded(): Promise<void> {
    await this.#ready;
    for (const day of this.#knownDates) {
      await this.#ensureDayLoaded(day);
    }
  }

  async #ensureReady(): Promise<void> {
    await this.#ready;
  }

  async #persistDays(days: Iterable<string>): Promise<void> {
    const uniqueDays = [...new Set(days)];
    this.#persistChain = this.#persistChain.then(async () => {
      for (const day of uniqueDays) {
        await this.#writeDayFile(day);
      }
    });
    await this.#persistChain;
  }

  async #writeDayFile(day: string): Promise<void> {
    const dayBlocks = this.#blocks.filter((block) => block.day === day);

    if (dayBlocks.length === 0) {
      try {
        await this.#handle.removeEntry(dayFileName(day));
      } catch {
        // File already absent.
      }
      this.#knownDates.delete(day);
      this.#loadedDays.delete(day);
      return;
    }

    const payload = createDayFilePayload(day, dayBlocks);
    const fileHandle = await this.#handle.getFileHandle(dayFileName(day), {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(payload, null, 2));
    await writable.close();
    this.#knownDates.add(day);
    this.#loadedDays.add(day);
  }

  async getBlock(id: string): Promise<Block | undefined> {
    await this.#ensureReady();

    const cached = this.#blocks.find((block) => block.id === id);
    if (cached) return cached;

    for (const day of this.#knownDates) {
      if (this.#loadedDays.has(day)) continue;
      await this.#ensureDayLoaded(day);
      const block = this.#blocks.find((entry) => entry.id === id);
      if (block) return block;
    }

    return undefined;
  }

  async getBlocks(filter?: BlockFilter): Promise<PagedResult<Block>> {
    await this.#ensureReady();

    if (filter?.day) {
      await this.#ensureDayLoaded(filter.day);
    } else {
      await this.#ensureAllLoaded();
    }

    const matched = this.#blocks.filter((block) =>
      matchesFilter(block, filter),
    );
    const sorted = sortBlocks(matched, filter?.sortBy);
    return pageItems(sorted, filter?.page, filter?.pageSize);
  }

  async getDayDates(filter?: DayDatesFilter): Promise<PagedResult<string>> {
    await this.#ensureReady();
    const sorted = [...this.#knownDates].sort((a, b) => b.localeCompare(a));
    return pageItems(sorted, filter?.page, filter?.pageSize);
  }

  async saveBlocks(blocks: Block[]): Promise<void> {
    await this.#ensureReady();

    const affectedDays = new Set<string>();
    for (const block of blocks) {
      const existing = this.#blocks.find((entry) => entry.id === block.id);
      if (existing && existing.day !== block.day) {
        affectedDays.add(existing.day);
      }
      upsertBlock(this.#blocks, block);
      affectedDays.add(block.day);
      this.#knownDates.add(block.day);
    }

    await this.#persistDays(affectedDays);
  }

  async deleteBlocks(ids: string[]): Promise<void> {
    await this.#ensureAllLoaded();

    const idSet = new Set<string>();
    for (const id of ids) {
      for (const subtreeId of collectSubtreeIds(this.#blocks, id)) {
        idSet.add(subtreeId);
      }
    }

    const affectedDays = new Set<string>();
    for (const block of this.#blocks) {
      if (idSet.has(block.id)) {
        affectedDays.add(block.day);
      }
    }

    this.#blocks = this.#blocks.filter((block) => !idSet.has(block.id));
    await this.#persistDays(affectedDays);
  }
}
