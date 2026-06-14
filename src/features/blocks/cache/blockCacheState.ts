import type { Block, BlockChange } from "../../../types/models";
import { sortRootBlocks } from "../../../utils/blockTree";

export type BlockCacheState = {
  blocks: Map<string, Block>;
  dayRoots: Map<string, Block[]>;
};

export function cloneBlock(block: Block): Block {
  return {
    id: block.id,
    type: block.type,
    parentId: block.parentId,
    day: block.day,
    createdAt: block.createdAt,
    content: [...block.content],
    properties: { ...block.properties },
  };
}

export function createEmptyCacheState(): BlockCacheState {
  return {
    blocks: new Map(),
    dayRoots: new Map(),
  };
}

export function getBlockFromState(
  state: BlockCacheState,
  id: string,
): Block | undefined {
  return state.blocks.get(id);
}

export function getDayRootsFromState(
  state: BlockCacheState,
  date: string,
): Block[] {
  return state.dayRoots.get(date) ?? [];
}

export function affectsDayRootQuery(
  prev: Block | undefined,
  next: Block,
): boolean {
  if (next.parentId !== null) {
    return prev !== undefined && prev.parentId === null;
  }

  if (!prev) return true;
  if (prev.parentId !== null) return true;
  if (prev.createdAt !== next.createdAt) return true;
  if (prev.day !== next.day) return true;

  return false;
}

export function patchDayRootsList(
  currentRoots: Block[],
  block: Block,
): Block[] {
  const index = currentRoots.findIndex((entry) => entry.id === block.id);

  if (block.parentId !== null) {
    if (index >= 0) {
      return currentRoots.filter((entry) => entry.id !== block.id);
    }
    return currentRoots;
  }

  const cloned = cloneBlock(block);

  if (index >= 0) {
    const next = [...currentRoots];
    next[index] = cloned;
    return sortRootBlocks(next);
  }

  return sortRootBlocks([...currentRoots, cloned]);
}

export function setBlockInState(
  state: BlockCacheState,
  block: Block,
): BlockCacheState {
  const prev = state.blocks.get(block.id);
  const blocks = new Map(state.blocks);
  blocks.set(block.id, cloneBlock(block));

  let dayRoots = state.dayRoots;
  if (affectsDayRootQuery(prev, block)) {
    const date = block.day;
    dayRoots = new Map(state.dayRoots);
    dayRoots.set(
      date,
      patchDayRootsList(getDayRootsFromState(state, date), block),
    );

    if (prev?.parentId === null && prev.day !== block.day) {
      dayRoots.set(
        prev.day,
        getDayRootsFromState(state, prev.day).filter(
          (entry) => entry.id !== block.id,
        ),
      );
    }
  }

  return { blocks, dayRoots };
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
    let dayRoots = next.dayRoots;

    if (block.parentId === null) {
      const date = block.day;
      dayRoots = new Map(next.dayRoots);
      dayRoots.set(
        date,
        getDayRootsFromState(next, date).filter((entry) => entry.id !== id),
      );
    }

    next = { blocks, dayRoots };
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
