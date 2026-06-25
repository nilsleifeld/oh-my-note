import type { Block, BlockType } from "../types/models";
import { normalizeBlock } from "./blockQueryUtils";
import {
  assignSortKeysToSiblings,
  sortKeyBetween,
  sortKeysBetween,
} from "../utils/sortKey";

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

type LegacyBlock = Block & { content?: string[] };

function isBlockLike(value: unknown): value is LegacyBlock {
  if (!value || typeof value !== "object") return false;
  const block = value as Record<string, unknown>;
  const hasSortKey = typeof block.sortKey === "string";
  const hasLegacyContent = Array.isArray(block.content);
  return (
    typeof block.id === "string" &&
    typeof block.type === "string" &&
    BLOCK_TYPES.has(block.type as BlockType) &&
    (block.parentId === null || typeof block.parentId === "string") &&
    typeof block.createdAt === "string" &&
    (hasSortKey || hasLegacyContent)
  );
}

function migrateLegacyBlocks(blocks: LegacyBlock[]): Block[] {
  const orderedChildren = new Map<string | null, string[]>();

  for (const block of blocks) {
    if (block.content?.length) {
      orderedChildren.set(block.id, [...block.content]);
    }
  }

  const assignedKeys = assignSortKeysToSiblings(
    blocks.map((block) => ({
      id: block.id,
      parentId: block.parentId ?? null,
      sortKey: block.sortKey,
    })),
    orderedChildren,
  );

  return blocks.map((block) => {
    const legacy = block as LegacyBlock;
    const { content, ...rest } = legacy;
    void content;
    return normalizeBlock({
      ...rest,
      parentId: rest.parentId ?? null,
      sortKey:
        assignedKeys.get(block.id) ??
        rest.sortKey ??
        sortKeyBetween(null, null),
    });
  });
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

  const legacyBlocks = blocks as LegacyBlock[];
  const hasLegacyContent = legacyBlocks.some(
    (block) => block.content && block.content.length > 0,
  );
  const hasMissingSortKey = legacyBlocks.some((block) => !block.sortKey);

  if (hasLegacyContent || hasMissingSortKey) {
    return migrateLegacyBlocks(legacyBlocks).map((block) =>
      normalizeBlock({
        ...block,
        day: block.day ?? day ?? block.createdAt.slice(0, 10),
      }),
    );
  }

  return legacyBlocks.map((block) =>
    normalizeBlock({
      ...block,
      day: block.day ?? day ?? block.createdAt.slice(0, 10),
    }),
  );
}

/** Assigns sequential sort keys for seed data sibling groups. */
export function assignSortKeysForBlocks(blocks: Block[]): Block[] {
  const byParent = new Map<string | null, Block[]>();

  for (const block of blocks) {
    const parentId = block.parentId ?? null;
    const siblings = byParent.get(parentId) ?? [];
    siblings.push(block);
    byParent.set(parentId, siblings);
  }

  const keyMap = new Map<string, string>();
  for (const siblings of byParent.values()) {
    const keys = sortKeysBetween(null, null, siblings.length);
    siblings.forEach((block, index) => {
      keyMap.set(block.id, keys[index]);
    });
  }

  return blocks.map((block) => ({
    ...block,
    sortKey: keyMap.get(block.id) ?? block.sortKey,
  }));
}
