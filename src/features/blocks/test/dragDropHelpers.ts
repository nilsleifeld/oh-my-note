/** @typedef {import('../../../types/models').Block} Block */
/** @typedef {import('../cache/blockCacheState.js').BlockCacheState} BlockCacheState */

import {
  applyChangeToState,
  createEmptyCacheState,
  getBlockFromState,
  getDayRootsFromState,
  setBlocksInState,
} from "../cache/blockCacheState";
import {
  buildMoveSnapshot,
  buildTreeChange,
} from "../changes/buildBlockChanges";
import { findParentInContext, moveBlockInTree } from "../../../utils/blockTree";
import { DATE } from "./fixtures";

/**
 * @param {Block[]} blocks
 * @returns {BlockCacheState}
 */
export function stateFromBlocks(blocks) {
  return setBlocksInState(createEmptyCacheState(), blocks);
}

/**
 * @param {BlockCacheState} state
 * @returns {(id: string) => Promise<Block | undefined>}
 */
export function getBlockSync(state) {
  return async (/** @type {string} */ id) => getBlockFromState(state, id);
}

/**
 * @param {BlockCacheState} state
 * @param {string} draggedId
 * @param {string} targetId
 * @param {string[]} rootIds
 */
export async function applyDragDrop(state, draggedId, targetId, rootIds) {
  const getBlock = getBlockSync(state);
  const updates = await moveBlockInTree(
    draggedId,
    targetId,
    rootIds,
    DATE,
    getBlock,
  );

  if (!updates) {
    return { updates: null, change: null, state };
  }

  const dragged = /** @type {Block} */ getBlockFromState(state, draggedId);
  const draggedParent = await findParentInContext(
    draggedId,
    rootIds,
    getBlockSync(state),
  );
  const targetParent = await findParentInContext(
    targetId,
    rootIds,
    getBlockSync(state),
  );

  const snapshot = buildMoveSnapshot(
    dragged,
    draggedParent?.parent ?? null,
    targetParent?.parent && targetParent.parent.id !== draggedParent?.parent?.id
      ? targetParent.parent
      : null,
  );
  const change = buildTreeChange(snapshot, updates);
  const next = applyChangeToState(state, change);

  return { updates, change, state: next };
}

/**
 * @param {BlockCacheState} state
 * @param {string} id
 * @returns {string[]}
 */
export function childIds(state, id) {
  return getBlockFromState(state, id)?.content ?? [];
}

/**
 * @param {BlockCacheState} state
 * @returns {string[]}
 */
export function rootIds(state) {
  return getDayRootsFromState(state, DATE).map((block) => block.id);
}
