import type { Block, BlockType } from "../types/models";
import { normalizeBlock } from "./blockQueryUtils";

export const DAY_FILE_VERSION = 1;
export const DAY_FILE_PATTERN = /^(\d{4}-\d{2}-\d{2})\.json$/;

export type DayFile = {
  version: typeof DAY_FILE_VERSION;
  day: string;
  blocks: Block[];
};

const BLOCK_TYPES = new Set<BlockType>([
  "todo",
  "text",
  "bullet",
  "code",
  "image",
  "toggle",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
]);

function isBlockLike(value: unknown): value is Block {
  if (!value || typeof value !== "object") return false;
  const block = value as Record<string, unknown>;
  return (
    typeof block.id === "string" &&
    typeof block.type === "string" &&
    BLOCK_TYPES.has(block.type as BlockType) &&
    (block.parentId === null || typeof block.parentId === "string") &&
    typeof block.createdAt === "string" &&
    Array.isArray(block.content)
  );
}

export function dayFileName(day: string): string {
  return `${day}.json`;
}

export function createDayFilePayload(day: string, blocks: Block[]): DayFile {
  return {
    version: DAY_FILE_VERSION,
    day,
    blocks: structuredClone(blocks),
  };
}

export function parseDayFile(raw: string, expectedDay?: string): Block[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in ${expectedDay ?? "day file"}.`);
  }

  let blocks: unknown[];
  let day = expectedDay;

  if (Array.isArray(parsed)) {
    blocks = parsed;
  } else if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as DayFile).blocks)
  ) {
    const file = parsed as DayFile;
    blocks = file.blocks;
    day = file.day ?? expectedDay;
  } else {
    throw new Error(`Unrecognized format in ${expectedDay ?? "day file"}.`);
  }

  if (!blocks.every(isBlockLike)) {
    throw new Error(`Invalid block data in ${expectedDay ?? "day file"}.`);
  }

  return blocks.map((block) =>
    normalizeBlock({
      ...block,
      day: block.day ?? day ?? block.createdAt.slice(0, 10),
    }),
  );
}
