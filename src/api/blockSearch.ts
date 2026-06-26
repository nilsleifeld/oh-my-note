import Fuse from "fuse.js";
import type {
  Block,
  BlockSearchFilter,
  BlockSearchHit,
  BlockSearchPage,
  BlockType,
} from "../types/models";
import { pageItems } from "./blockQueryUtils";

type SearchableBlockDoc = {
  id: string;
  day: string;
  type: BlockType;
  title: string;
};

const SEARCHABLE_TYPES = new Set<BlockType>([
  "text",
  "bullet",
  "ordered",
  "todo",
  "toggle",
  "code",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
]);

export function isSearchableBlock(block: Block): boolean {
  return (
    SEARCHABLE_TYPES.has(block.type) && block.properties.title.trim().length > 0
  );
}

function buildSearchableDocs(blocks: Block[]): SearchableBlockDoc[] {
  return blocks.filter(isSearchableBlock).map((block) => ({
    id: block.id,
    day: block.day,
    type: block.type,
    title: block.properties.title,
  }));
}

function createBlockFuseIndex(
  docs: SearchableBlockDoc[],
): Fuse<SearchableBlockDoc> {
  return new Fuse(docs, {
    keys: ["title"],
    includeMatches: true,
    threshold: 0.4,
    ignoreLocation: true,
  });
}

function sortBlocksForBrowse(blocks: Block[]): Block[] {
  return [...blocks].filter(isSearchableBlock).sort((a, b) => {
    const dayCompare = b.day.localeCompare(a.day);
    if (dayCompare !== 0) return dayCompare;
    return a.sortKey.localeCompare(b.sortKey);
  });
}

function searchHits(blocks: Block[], query: string): BlockSearchHit[] {
  const trimmed = query.trim();
  const blocksById = new Map(blocks.map((block) => [block.id, block]));

  if (!trimmed) {
    return sortBlocksForBrowse(blocks).map((block) => ({
      block,
      indices: [],
    }));
  }

  const fuse = createBlockFuseIndex(buildSearchableDocs(blocks));

  return fuse.search(trimmed).flatMap((result) => {
    const block = blocksById.get(result.item.id);
    if (!block) return [];

    const titleMatch = result.matches?.find((match) => match.key === "title");
    const indices = (titleMatch?.indices ?? []) as readonly [number, number][];

    return [{ block, indices }];
  });
}

/** Server-side search over a block corpus — used by API clients internally. */
export function searchBlocksInCorpus(
  blocks: Block[],
  filter: BlockSearchFilter = {},
): BlockSearchPage {
  const { query = "", page, pageSize } = filter;
  const searchableTotal = buildSearchableDocs(blocks).length;
  const hits = searchHits(blocks, query);
  const paged = pageItems(hits, page, pageSize);

  return { ...paged, searchableTotal };
}
