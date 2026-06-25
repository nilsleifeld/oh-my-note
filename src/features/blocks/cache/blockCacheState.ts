import type { Block, BlockChange } from "../../../types/models";
import { rootBlockIds, sortRootBlocks } from "../../../utils/blockTree";

export type BlockCacheState = {
  blocks: Map<string, Block>;
  dayBlocks: Map<string, Block[]>;
};

export function cloneBlock(block: Block): Block {
  return {
    id: block.id,
    type: block.type,
    parentId: block.parentId,
    day: block.day,
    createdAt: block.createdAt,
    sortKey: block.sortKey,
    properties: { ...block.properties },
    comments: (block.comments ?? []).map((comment) => ({ ...comment })),
  };
}

export function createEmptyCacheState(): BlockCacheState {
  return {
    blocks: new Map(),
    dayBlocks: new Map(),
  };
}

export function getBlockFromState(
  state: BlockCacheState,
  id: string,
): Block | undefined {
  return state.blocks.get(id);
}

export function getDayBlocksFromState(
  state: BlockCacheState,
  date: string,
): Block[] {
  return state.dayBlocks.get(date) ?? [];
}

export function getDayRootsFromState(
  state: BlockCacheState,
  date: string,
): Block[] {
  return sortRootBlocks(getDayBlocksFromState(state, date), date);
}

export function affectsDayQuery(prev: Block | undefined, next: Block): boolean {
  if (!prev) return true;
  if (prev.day !== next.day) return true;
  if (prev.parentId !== next.parentId) return true;
  if (prev.sortKey !== next.sortKey) return true;
  return false;
}

export function patchDayBlocksList(
  currentBlocks: Block[],
  block: Block,
): Block[] {
  const index = currentBlocks.findIndex((entry) => entry.id === block.id);
  const cloned = cloneBlock(block);

  if (index >= 0) {
    const next = [...currentBlocks];
    next[index] = cloned;
    return next;
  }

  return [...currentBlocks, cloned];
}

/** @deprecated Use patchDayBlocksList — kept for tests during transition */
export function patchDayRootsList(
  currentRoots: Block[],
  block: Block,
): Block[] {
  if (block.parentId !== null) {
    return currentRoots.filter((entry) => entry.id !== block.id);
  }

  const index = currentRoots.findIndex((entry) => entry.id === block.id);
  const cloned = cloneBlock(block);

  if (index >= 0) {
    const next = [...currentRoots];
    next[index] = cloned;
    return sortRootBlocks(next, block.day);
  }

  return sortRootBlocks([...currentRoots, cloned], block.day);
}

export function setBlockInState(
  state: BlockCacheState,
  block: Block,
): BlockCacheState {
  const prev = state.blocks.get(block.id);
  const blocks = new Map(state.blocks);
  blocks.set(block.id, cloneBlock(block));

  const dayBlocks = new Map(state.dayBlocks);
  dayBlocks.set(
    block.day,
    patchDayBlocksList(getDayBlocksFromState(state, block.day), block),
  );

  if (prev && prev.day !== block.day) {
    dayBlocks.set(
      prev.day,
      getDayBlocksFromState(state, prev.day).filter(
        (entry) => entry.id !== block.id,
      ),
    );
  }

  return { blocks, dayBlocks };
}

export function removeBlocksFromState(
  state: BlockCacheState,
  ids: string[],
): BlockCacheState {
  let next = state;

  for (const id of ids) {
    const block = next.blocks.get(id);
    if (!block) continue;

    const blocks = new Map(next.blocks);
    blocks.delete(id);
    const dayBlocks = new Map(next.dayBlocks);
    dayBlocks.set(
      block.day,
      getDayBlocksFromState(next, block.day).filter((entry) => entry.id !== id),
    );

    next = { blocks, dayBlocks };
  }

  return next;
}

export function setBlocksInState(
  state: BlockCacheState,
  blocks: Block[],
): BlockCacheState {
  let next = state;
  for (const block of blocks) {
    next = setBlockInState(next, block);
  }
  return next;
}

export function applyChangeToState(
  state: BlockCacheState,
  change: BlockChange,
): BlockCacheState {
  let next = state;

  if (change.deletedIds?.length) {
    next = removeBlocksFromState(next, change.deletedIds);
  }

  return setBlocksInState(next, change.updates);
}

export function rollbackChangeInState(
  state: BlockCacheState,
  change: BlockChange,
): BlockCacheState {
  let next = state;

  if (change.createdIds?.length) {
    next = removeBlocksFromState(next, change.createdIds);
  }

  return setBlocksInState(next, change.snapshot);
}

export function getAllBlocksFromState(state: BlockCacheState): Block[] {
  return [...state.blocks.values()];
}

export function rootIdsFromState(
  state: BlockCacheState,
  day: string,
): string[] {
  return rootBlockIds(getAllBlocksFromState(state), day);
}
