import type { Block, BlockType } from "../types/models";
import { normalizeBlock } from "./blockQueryUtils";

export const BLOCKS_FILE_NAME = "blocks.json";
export const BLOCKS_FILE_VERSION = 1;

export type BlocksFile = {
  version: typeof BLOCKS_FILE_VERSION;
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
    typeof block.day === "string" &&
    typeof block.createdAt === "string" &&
    typeof block.sortKey === "string" &&
    typeof block.properties === "object" &&
    block.properties !== null &&
    Array.isArray(block.comments)
  );
}

export function createBlocksFilePayload(blocks: Block[]): BlocksFile {
  return {
    version: BLOCKS_FILE_VERSION,
    blocks: structuredClone(blocks),
  };
}

export function parseBlocksFile(raw: string): Block[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON in blocks.json.");
  }

  let blocks: unknown[];

  if (Array.isArray(parsed)) {
    blocks = parsed;
  } else if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as BlocksFile).blocks)
  ) {
    blocks = (parsed as BlocksFile).blocks;
  } else {
    throw new Error("Unrecognized format in blocks.json.");
  }

  if (!blocks.every(isBlockLike)) {
    throw new Error("Invalid block data in blocks.json.");
  }

  return blocks.map((block) => normalizeBlock(block));
}
