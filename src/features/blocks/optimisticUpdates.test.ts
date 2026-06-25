/** @typedef {import('../../types/models').Block} Block */
/** @typedef {import('./cache/blockCacheState.js').BlockCacheState} BlockCacheState */

import { describe, expect, it } from "vitest";
import {
  applyChangeToState,
  createEmptyCacheState,
  getAllBlocksFromState,
  getBlockFromState,
  getDayRootsFromState,
  patchDayBlocksList,
  rollbackChangeInState,
  setBlockInState,
  setBlocksInState,
} from "./cache/blockCacheState";
import {
  buildCreateChildChange,
  buildCreateRootChange,
  buildDeleteChange,
  buildIndentSnapshot,
  buildLanguageChange,
  buildMoveSnapshot,
  buildOutdentSnapshot,
  buildTitleChange,
  buildToggleChange,
  buildTreeChange,
  buildTypeChange,
} from "./changes/buildBlockChanges";
import {
  childBlockIds,
  indentBlock,
  moveBlockInTree,
  outdentBlock,
} from "../../utils/blockTree";
import { sortKeyBetween } from "../../utils/sortKey";
import { DATE, makeBlock, sampleTreeBlocks } from "./test/fixtures";

/** @param {Block[]} blocks */
function stateFromBlocks(blocks) {
  return setBlocksInState(createEmptyCacheState(), blocks);
}

/** @param {BlockCacheState} state @param {string} id @param {Record<string, unknown>} partial */
function expectBlock(state, id, partial) {
  const block = getBlockFromState(state, id);
  expect(block).toBeDefined();
  expect(block).toMatchObject(partial);
}

/** @param {BlockCacheState} state @param {string} parentId */
function childIds(state, parentId) {
  return childBlockIds(getAllBlocksFromState(state), parentId);
}

describe("blockCacheState", () => {
  it("tracks root blocks per day", () => {
    const blocks = sampleTreeBlocks();
    const state = stateFromBlocks(blocks);

    expect(getDayRootsFromState(state, DATE).map((block) => block.id)).toEqual([
      "a",
      "b",
    ]);
    expect(getBlockFromState(state, "c")?.parentId).toBe("a");
  });

  it("patchDayBlocksList inserts, updates, and removes blocks", () => {
    const blocks = [
      makeBlock({ id: "a", sortKey: sortKeyBetween(null, null) }),
    ];

    const inserted = patchDayBlocksList(
      blocks,
      makeBlock({
        id: "b",
        sortKey: sortKeyBetween(blocks[0].sortKey, null),
      }),
    );
    expect(inserted.map((block) => block.id)).toEqual(["a", "b"]);

    const updated = patchDayBlocksList(inserted, {
      ...inserted[1],
      properties: {
        title: "changed",
        checked: false,
        language: "",
        imageData: "",
        open: true,
      },
    });
    expect(updated[1].properties.title).toBe("changed");

    const withoutB = updated.filter((block) => block.id !== "b");
    expect(withoutB.map((block) => block.id)).toEqual(["a"]);
  });
});

describe("optimistic updates", () => {
  const initial = () => stateFromBlocks(sampleTreeBlocks());

  it("title change updates properties and rolls back", () => {
    const block = /** @type {Block} */ getBlockFromState(initial(), "c");
    const change = buildTitleChange(block, "New title", "C");

    const applied = applyChangeToState(initial(), change);
    expectBlock(applied, "c", { properties: { title: "New title" } });

    const rolledBack = rollbackChangeInState(applied, change);
    expectBlock(rolledBack, "c", { properties: { title: "C" } });
  });

  it("toggle todo updates checked and rolls back", () => {
    const block = /** @type {Block} */ getBlockFromState(initial(), "c");
    const change = buildToggleChange(block, false);

    const applied = applyChangeToState(initial(), change);
    expectBlock(applied, "c", { properties: { checked: false } });

    const rolledBack = rollbackChangeInState(applied, change);
    expectBlock(rolledBack, "c", { properties: { checked: true } });
  });

  it("type change updates block type and rolls back", () => {
    const block = /** @type {Block} */ getBlockFromState(initial(), "a");
    const change = buildTypeChange(block, "code");

    const applied = applyChangeToState(initial(), change);
    expectBlock(applied, "a", { type: "code" });

    const rolledBack = rollbackChangeInState(applied, change);
    expectBlock(rolledBack, "a", { type: "text" });
  });

  it("language change updates properties and rolls back", () => {
    const block = /** @type {Block} */ getBlockFromState(initial(), "d");
    const change = buildLanguageChange(block, "typescript", "javascript");

    const applied = applyChangeToState(initial(), change);
    expectBlock(applied, "d", { properties: { language: "typescript" } });

    const rolledBack = rollbackChangeInState(applied, change);
    expectBlock(rolledBack, "d", { properties: { language: "javascript" } });
  });

  it("deleting a root removes it from day roots", () => {
    const state = initial();
    const block = /** @type {Block} */ getBlockFromState(state, "a");
    const change = buildDeleteChange(block, null);

    const applied = applyChangeToState(state, change);
    expect(getBlockFromState(applied, "a")).toBeUndefined();
    expect(
      getDayRootsFromState(applied, DATE).map((entry) => entry.id),
    ).toEqual(["b"]);

    const rolledBack = rollbackChangeInState(applied, change);
    expect(
      getDayRootsFromState(rolledBack, DATE).map((entry) => entry.id),
    ).toEqual(["a", "b"]);
    expectBlock(rolledBack, "a", { id: "a" });
  });

  it("deleting a child removes it from the day blocks", () => {
    const state = initial();
    const child = /** @type {Block} */ getBlockFromState(state, "c");
    const parent = /** @type {Block} */ getBlockFromState(state, "a");
    const change = buildDeleteChange(child, parent);

    const applied = applyChangeToState(state, change);
    expect(getBlockFromState(applied, "c")).toBeUndefined();
    expect(childIds(applied, "a")).toEqual([]);

    const rolledBack = rollbackChangeInState(applied, change);
    expect(childIds(rolledBack, "a")).toEqual(["c"]);
    expectBlock(rolledBack, "c", { id: "c" });
  });

  it("creating a root appends to day roots and rolls back", () => {
    const state = initial();
    const child = makeBlock({
      id: "new-root",
      sortKey: sortKeyBetween(getBlockFromState(state, "b")!.sortKey, null),
    });
    const change = buildCreateRootChange(child);

    const applied = applyChangeToState(state, change);
    expect(
      getDayRootsFromState(applied, DATE).map((entry) => entry.id),
    ).toEqual(["a", "b", "new-root"]);

    const rolledBack = rollbackChangeInState(applied, change);
    expect(getBlockFromState(rolledBack, "new-root")).toBeUndefined();
    expect(
      getDayRootsFromState(rolledBack, DATE).map((entry) => entry.id),
    ).toEqual(["a", "b"]);
  });

  it("creating a child adds it to parent siblings and rolls back", () => {
    const state = initial();
    const child = makeBlock({
      id: "new-child",
      parentId: "a",
      sortKey: sortKeyBetween(getBlockFromState(state, "c")!.sortKey, null),
    });
    const change = buildCreateChildChange(child);

    const applied = applyChangeToState(state, change);
    expect(childIds(applied, "a")).toEqual(["c", "new-child"]);
    expectBlock(applied, "new-child", { parentId: "a" });

    const rolledBack = rollbackChangeInState(applied, change);
    expect(getBlockFromState(rolledBack, "new-child")).toBeUndefined();
    expect(childIds(rolledBack, "a")).toEqual(["c"]);
  });

  it("indent moves a root under the previous sibling", () => {
    const state = initial();
    const blocks = sampleTreeBlocks();
    const updates = indentBlock("b", blocks, DATE);
    expect(updates).not.toBeNull();

    const snapshot = buildIndentSnapshot(
      /** @type {Block} */ getBlockFromState(state, "b"),
      /** @type {Block} */ getBlockFromState(state, "a"),
      null,
    );
    const change = buildTreeChange(snapshot, /** @type {Block[]} */ updates);
    const applied = applyChangeToState(state, change);

    expect(childIds(applied, "a")).toEqual(["c", "b"]);
    expectBlock(applied, "b", { parentId: "a" });
    expect(
      getDayRootsFromState(applied, DATE).map((entry) => entry.id),
    ).toEqual(["a"]);

    const rolledBack = rollbackChangeInState(applied, change);
    expect(
      getDayRootsFromState(rolledBack, DATE).map((entry) => entry.id),
    ).toEqual(["a", "b"]);
    expectBlock(rolledBack, "b", { parentId: null });
  });

  it("outdent promotes a child to a root block", () => {
    const state = initial();
    const blocks = sampleTreeBlocks();
    const updates = outdentBlock("c", blocks, DATE);
    expect(updates).not.toBeNull();

    const parent = /** @type {Block} */ getBlockFromState(state, "a");
    const block = /** @type {Block} */ getBlockFromState(state, "c");
    const change = buildTreeChange(
      buildOutdentSnapshot(block, parent),
      /** @type {Block[]} */ updates,
    );
    const applied = applyChangeToState(state, change);

    expect(childIds(applied, "a")).toEqual([]);
    expectBlock(applied, "c", { parentId: null });
    expect(
      getDayRootsFromState(applied, DATE).map((entry) => entry.id),
    ).toEqual(["a", "c", "b"]);

    const rolledBack = rollbackChangeInState(applied, change);
    expectBlock(rolledBack, "c", { parentId: "a" });
    expect(
      getDayRootsFromState(rolledBack, DATE).map((entry) => entry.id),
    ).toEqual(["a", "b"]);
  });

  it("move reorders root blocks", () => {
    const state = initial();
    const blocks = sampleTreeBlocks();
    const updates = moveBlockInTree("b", "a", blocks, DATE);
    expect(updates).not.toBeNull();

    const dragged = /** @type {Block} */ getBlockFromState(state, "b");
    const change = buildTreeChange(
      buildMoveSnapshot(dragged, null, null),
      /** @type {Block[]} */ updates,
    );
    const applied = applyChangeToState(state, change);

    expect(
      getDayRootsFromState(applied, DATE).map((entry) => entry.id),
    ).toEqual(["b", "a"]);

    const rolledBack = rollbackChangeInState(applied, change);
    expect(
      getDayRootsFromState(rolledBack, DATE).map((entry) => entry.id),
    ).toEqual(["a", "b"]);
  });

  it("move between parents updates sibling order", () => {
    const state = initial();
    const blocks = sampleTreeBlocks();
    const updates = moveBlockInTree("c", "d", blocks, DATE);
    expect(updates).not.toBeNull();

    const dragged = /** @type {Block} */ getBlockFromState(state, "c");
    const sourceParent = /** @type {Block} */ getBlockFromState(state, "a");
    const targetParent = /** @type {Block} */ getBlockFromState(state, "b");
    const change = buildTreeChange(
      buildMoveSnapshot(dragged, sourceParent, targetParent),
      /** @type {Block[]} */ updates,
    );
    const applied = applyChangeToState(state, change);

    expect(childIds(applied, "a")).toEqual([]);
    expect(childIds(applied, "b")).toEqual(["c", "d"]);
    expectBlock(applied, "c", { parentId: "b" });

    const rolledBack = rollbackChangeInState(applied, change);
    expect(childIds(rolledBack, "a")).toEqual(["c"]);
    expect(childIds(rolledBack, "b")).toEqual(["d"]);
    expectBlock(rolledBack, "c", { parentId: "a" });
  });
});

describe("buildBlockChanges", () => {
  it("clones snapshot blocks for rollback safety", () => {
    const block = makeBlock({
      id: "x",
      properties: { title: "old", checked: false, language: "" },
    });
    const change = buildTitleChange(block, "new", "old");

    block.properties.title = "mutated";
    expect(change.snapshot[0].properties.title).toBe("old");
    expect(change.updates[0].properties.title).toBe("new");
  });

  it("setBlockInState does not mutate the previous cache entry", () => {
    const block = makeBlock({
      id: "x",
      properties: { title: "old", checked: false, language: "" },
    });
    const state = setBlockInState(createEmptyCacheState(), block);

    block.properties.title = "mutated";
    expect(getBlockFromState(state, "x")?.properties.title).toBe("old");
  });
});
