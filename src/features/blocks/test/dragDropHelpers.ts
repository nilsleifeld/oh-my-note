/** @typedef {import('../../../types/models').Block} Block */
/** @typedef {import('../cache/blockCacheState.js').BlockCacheState} BlockCacheState */

import {
  applyChangeToState,
  createEmptyCacheState,
  getAllBlocksFromState,
  getBlockFromState,
  getDayRootsFromState,
  setBlocksInState,
} from "../cache/blockCacheState";
import {
  buildMoveSnapshot,
  buildTreeChange,
} from "../changes/buildBlockChanges";
import {
  childBlockIds,
  findParentInContext,
  moveBlockInTree,
} from "../../../utils/blockTree";
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
 * @param {string} draggedId
 * @param {string} targetId
 */
export async function applyDragDrop(state, draggedId, targetId) {
  const blocks = getAllBlocksFromState(state);
  const updates = moveBlockInTree(draggedId, targetId, blocks, DATE);

  if (!updates) {
    return { updates: null, change: null, state };
  }

  const dragged = /** @type {Block} */ getBlockFromState(state, draggedId);
  const draggedParent = findParentInContext(draggedId, blocks, DATE);
  const targetParent = findParentInContext(targetId, blocks, DATE);

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
  return childBlockIds(getAllBlocksFromState(state), id);
}

/**
 * @param {BlockCacheState} state
 * @returns {string[]}
 */
export function rootIds(state) {
  return getDayRootsFromState(state, DATE).map((block) => block.id);
}
