import type {
  Block,
  BlockFilter,
  BlockProperties,
  BlockSortBy,
  PagedResult,
} from "../types/models";
import { compareSortKeys, sortKeyBetween } from "../utils/sortKey";

export function normalizeBlock(block: Block): Block {
  return {
    ...block,
    day: block.day ?? block.createdAt.slice(0, 10),
    sortKey: block.sortKey ?? sortKeyBetween(null, null),
    properties: {
      title: block.properties?.title ?? "",
      checked: block.properties?.checked ?? false,
      language: block.properties?.language ?? "",
      imageData: block.properties?.imageData ?? "",
      open: block.properties?.open ?? true,
    },
    comments: block.comments ?? [],
  };
}

export function matchesFilter(block: Block, filter?: BlockFilter): boolean {
  if (!filter) return true;
  if (filter.type && block.type !== filter.type) return false;
  if (filter.parentId !== undefined && block.parentId !== filter.parentId)
    return false;
  if (filter.day && block.day !== filter.day) return false;
  if (filter.properties) {
    for (const [key, value] of Object.entries(filter.properties)) {
      if (block.properties[key as keyof BlockProperties] !== value)
        return false;
    }
  }
  return true;
}

export function sortBlocks(blocks: Block[], sortBy?: BlockSortBy): Block[] {
  const field = sortBy?.field ?? "sortKey";
  const order = sortBy?.order ?? "asc";

  if (field !== "sortKey") return blocks;

  return [...blocks].sort((a, b) => {
    const cmp = compareSortKeys(a.sortKey, b.sortKey);
    return order === "desc" ? -cmp : cmp;
  });
}

export function pageItems<T>(
  items: T[],
  page?: number,
  pageSize?: number,
): PagedResult<T> {
  if (page === undefined || pageSize === undefined) {
    return {
      items,
      total: items.length,
      page: 0,
      pageSize: items.length,
      hasMore: false,
    };
  }

  const start = page * pageSize;
  const pagedItems = items.slice(start, start + pageSize);

  return {
    items: pagedItems,
    total: items.length,
    page,
    pageSize,
    hasMore: start + pageSize < items.length,
  };
}

export function upsertBlock(blocks: Block[], block: Block): void {
  const index = blocks.findIndex((b) => b.id === block.id);
  if (index >= 0) {
    blocks[index] = block;
  } else {
    blocks.push(block);
  }
}

export function collectSubtreeIds(
  blocks: Block[],
  rootId: string,
): Set<string> {
  const ids = new Set<string>();

  const walk = (blockId: string): void => {
    if (ids.has(blockId)) return;
    ids.add(blockId);
    for (const child of blocks.filter((entry) => entry.parentId === blockId)) {
      walk(child.id);
    }
  };

  walk(rootId);
  return ids;
}
