/** @typedef {import('../../types/models').Block} Block */

import { describe, expect, it } from "vitest";
import { rollbackChangeInState } from "./cache/blockCacheState";
import { isDescendant, moveBlockInTree } from "../../utils/blockTree";
import {
  applyDragDrop,
  childIds,
  getBlockSync,
  rootIds,
  stateFromBlocks,
} from "./test/dragDropHelpers";
import {
  applyChangeToState,
  getBlockFromState,
  getDayRootsFromState,
} from "./cache/blockCacheState";
import {
  buildMoveSnapshot,
  buildTreeChange,
} from "./changes/buildBlockChanges";
import {
  DATE,
  deepRootIds,
  deepTreeBlocks,
  makeBlock,
  sampleTreeBlocks,
} from "./test/fixtures";

/** @param {import('./cache/blockCacheState.js').BlockCacheState} state @param {string} id @param {Record<string, unknown>} partial */
function expectBlock(state, id, partial) {
  const block = state.blocks.get(id);
  expect(block).toBeDefined();
  expect(block).toMatchObject(partial);
}

describe("moveBlockInTree guards", () => {
  const state = () => stateFromBlocks(deepTreeBlocks());

  it("rejects dropping a block onto itself", async () => {
    const result = await moveBlockInTree(
      "d",
      "d",
      deepRootIds(),
      DATE,
      getBlockSync(state()),
    );
    expect(result).toBeNull();
  });

  it("rejects dropping an ancestor onto its descendant", async () => {
    const get = getBlockSync(state());
    expect(await isDescendant("a", "f", get)).toBe(true);
    expect(await isDescendant("b", "d", get)).toBe(true);
    expect(await isDescendant("c", "f", get)).toBe(true);

    expect(
      await moveBlockInTree("a", "f", deepRootIds(), DATE, get),
    ).toBeNull();
    expect(
      await moveBlockInTree("b", "d", deepRootIds(), DATE, get),
    ).toBeNull();
    expect(
      await moveBlockInTree("a", "c", deepRootIds(), DATE, get),
    ).toBeNull();
  });

  it("swaps siblings when dropping onto each other", async () => {
    const blocks = deepTreeBlocks();
    const custom = blocks.map((block) =>
      block.id === "a" ? { ...block, content: ["e", "c"] } : block,
    );
    const customState = stateFromBlocks(custom);

    const result = await moveBlockInTree(
      "e",
      "c",
      deepRootIds(),
      DATE,
      getBlockSync(customState),
    );
    expect(result).toEqual([
      expect.objectContaining({ id: "a", content: ["c", "e"] }),
    ]);
  });
});

describe("drag and drop — root level", () => {
  it("reorders roots when dropping onto another root", async () => {
    const initial = stateFromBlocks(sampleTreeBlocks());
    const { state } = await applyDragDrop(initial, "b", "a", ["a", "b"]);

    expect(rootIds(state)).toEqual(["b", "a"]);
    expectBlock(state, "b", { parentId: null });
    expectBlock(state, "a", { parentId: null });
  });

  it("rolls back root reordering", async () => {
    const initial = stateFromBlocks(sampleTreeBlocks());
    const { state, change } = await applyDragDrop(initial, "b", "a", [
      "a",
      "b",
    ]);
    expect(change).not.toBeNull();

    const rolledBack = rollbackChangeInState(
      state,
      /** @type {NonNullable<typeof change>} */ change,
    );
    expect(rootIds(rolledBack)).toEqual(["a", "b"]);
  });

  it("reorders roots without nesting into the target's children", async () => {
    const initial = stateFromBlocks(deepTreeBlocks());
    const before = rootIds(initial);
    const { state, updates } = await applyDragDrop(
      initial,
      "g",
      "a",
      deepRootIds(),
    );

    expect(updates).toHaveLength(1);
    expect(rootIds(state)).not.toEqual(before);
    expectBlock(state, "g", { parentId: null });
    expect(childIds(state, "a")).toEqual(["c", "e"]);
  });
  it("inserts before the target child, not after it", async () => {
    const initial = stateFromBlocks(deepTreeBlocks());
    const { state } = await applyDragDrop(initial, "g", "e", deepRootIds());

    expectBlock(state, "g", { parentId: "a" });
    expect(childIds(state, "a")).toEqual(["c", "g", "e"]);
  });
});

describe("drag and drop — onto a child row", () => {
  it("nests a root before the target child under the child's parent", async () => {
    const initial = stateFromBlocks(sampleTreeBlocks());
    const { state } = await applyDragDrop(initial, "b", "c", ["a", "b"]);

    expect(rootIds(state)).toEqual(["a"]);
    expectBlock(state, "b", { parentId: "a" });
    expect(childIds(state, "a")).toEqual(["b", "c"]);
    expect(childIds(state, "b")).toEqual(["d"]);
  });

  it("nests a root with children into a deeper child row", async () => {
    const initial = stateFromBlocks(deepTreeBlocks());
    const { state } = await applyDragDrop(initial, "b", "f", deepRootIds());

    expect(rootIds(state)).toEqual(["a", "g"]);
    expectBlock(state, "b", { parentId: "c" });
    expect(childIds(state, "c")).toEqual(["b", "f"]);
    expectBlock(state, "d", { parentId: "b" });
  });

  it("inserts before the target child, not as a child of the target block", async () => {
    const initial = stateFromBlocks(deepTreeBlocks());
    const { state } = await applyDragDrop(initial, "g", "f", deepRootIds());

    expectBlock(state, "g", { parentId: "c" });
    expect(childIds(state, "c")).toEqual(["g", "f"]);
    expect(childIds(state, "f")).toEqual([]);
  });

  it("moves a nested block into another branch before the target child", async () => {
    const initial = stateFromBlocks(deepTreeBlocks());
    const { state } = await applyDragDrop(initial, "d", "e", deepRootIds());

    expectBlock(state, "d", { parentId: "a" });
    expect(childIds(state, "a")).toEqual(["c", "d", "e"]);
    expect(childIds(state, "b")).toEqual([]);
    expect(rootIds(state)).toEqual(["a", "b", "g"]);
  });

  it("moves a deeply nested block onto a shallow child row", async () => {
    const initial = stateFromBlocks(deepTreeBlocks());
    const { state } = await applyDragDrop(initial, "d", "f", deepRootIds());

    expectBlock(state, "d", { parentId: "c" });
    expect(childIds(state, "c")).toEqual(["d", "f"]);
    expect(childIds(state, "b")).toEqual([]);
  });
});

describe("drag and drop — outdent via parent row", () => {
  it("promotes a child to a root when dropped onto its parent root", async () => {
    const initial = stateFromBlocks(sampleTreeBlocks());
    const { state } = await applyDragDrop(initial, "c", "a", ["a", "b"]);

    expect(rootIds(state)).toEqual(["a", "c", "b"]);
    expectBlock(state, "c", { parentId: null });
    expect(childIds(state, "a")).toEqual([]);
  });

  it("promotes a nested child to a root and keeps its subtree", async () => {
    const initial = stateFromBlocks(deepTreeBlocks());
    const { state } = await applyDragDrop(initial, "f", "g", deepRootIds());

    expect(rootIds(state)).toEqual(["a", "b", "f", "g"]);
    expectBlock(state, "f", { parentId: null });
    expect(childIds(state, "c")).toEqual([]);
    expect(childIds(state, "a")).toEqual(["c", "e"]);
  });
});

describe("drag and drop — sibling reorder", () => {
  it("reorders siblings within the same parent", async () => {
    const initial = stateFromBlocks(deepTreeBlocks());
    const { state } = await applyDragDrop(initial, "e", "c", deepRootIds());

    expect(childIds(state, "a")).toEqual(["e", "c"]);
    expectBlock(state, "e", { parentId: "a" });
    expectBlock(state, "c", { parentId: "a" });
  });

  it("reorders nested siblings", async () => {
    const h = makeBlock({
      id: "h",
      parentId: "c",
      createdAt: `${DATE}T10:50:00.000Z`,
    });
    const blocks = [
      ...deepTreeBlocks().map((block) =>
        block.id === "c" ? { ...block, content: ["f", "h"] } : block,
      ),
      h,
    ];
    const initial = stateFromBlocks(blocks);
    const { state } = await applyDragDrop(initial, "h", "f", deepRootIds());

    expect(childIds(state, "c")).toEqual(["h", "f"]);
    expectBlock(state, "h", { parentId: "c" });
  });
});

describe("drag and drop — cross-parent moves", () => {
  it("moves a child from one parent to another before the target", async () => {
    const initial = stateFromBlocks(sampleTreeBlocks());
    const { state } = await applyDragDrop(initial, "c", "d", ["a", "b"]);

    expectBlock(state, "c", { parentId: "b" });
    expect(childIds(state, "a")).toEqual([]);
    expect(childIds(state, "b")).toEqual(["c", "d"]);
  });

  it("pulls a nested block up to the grandparent before a cousin", async () => {
    const initial = stateFromBlocks(deepTreeBlocks());
    const { state } = await applyDragDrop(initial, "f", "e", deepRootIds());

    expectBlock(state, "f", { parentId: "a" });
    expect(childIds(state, "a")).toEqual(["c", "f", "e"]);
    expect(childIds(state, "c")).toEqual([]);
  });

  it("moves a cousin into an empty child slot before the target", async () => {
    const initial = stateFromBlocks(deepTreeBlocks());
    const { state } = await applyDragDrop(initial, "f", "c", deepRootIds());

    expectBlock(state, "f", { parentId: "a" });
    expect(childIds(state, "a")).toEqual(["f", "c", "e"]);
    expect(childIds(state, "c")).toEqual([]);
  });

  it("rolls back cross-parent moves", async () => {
    const initial = stateFromBlocks(sampleTreeBlocks());
    const { state, change } = await applyDragDrop(initial, "c", "d", [
      "a",
      "b",
    ]);
    expect(change).not.toBeNull();

    const rolledBack = rollbackChangeInState(
      state,
      /** @type {NonNullable<typeof change>} */ change,
    );
    expectBlock(rolledBack, "c", { parentId: "a" });
    expect(childIds(rolledBack, "a")).toEqual(["c"]);
    expect(childIds(rolledBack, "b")).toEqual(["d"]);
  });
});

describe("drag and drop — cross-day moves", () => {
  const DATE_A = "2025-06-12";

  it("moves a root block from one day to another", async () => {
    const blockA = makeBlock({
      id: "xa",
      day: DATE_A,
      createdAt: `${DATE_A}T10:00:00.000Z`,
      properties: { title: "A", checked: false, language: "" },
    });
    const blockB = makeBlock({
      id: "xb",
      day: DATE,
      createdAt: `${DATE}T11:00:00.000Z`,
      properties: { title: "B", checked: false, language: "" },
    });
    const initial = stateFromBlocks([blockA, blockB]);

    const updates = await moveBlockInTree(
      "xa",
      "xb",
      ["xb"],
      DATE_A,
      getBlockSync(initial),
      {
        targetDate: DATE,
        sourceRootIds: ["xa"],
        targetRootIds: ["xb"],
      },
    );

    expect(updates).not.toBeNull();

    const dragged = /** @type {Block} */ getBlockFromState(initial, "xa");
    const change = buildTreeChange(
      buildMoveSnapshot(dragged, null, null),
      /** @type {Block[]} */ updates,
    );
    const state = applyChangeToState(initial, change);

    expect(
      getDayRootsFromState(state, DATE_A).map((block) => block.id),
    ).toEqual([]);
    expect(getDayRootsFromState(state, DATE).map((block) => block.id)).toEqual([
      "xa",
      "xb",
    ]);
    expectBlock(state, "xa", { day: DATE, parentId: null });
  });
});

describe("drag and drop — preserves subtrees", () => {
  it("keeps descendants attached when a parent is moved", async () => {
    const initial = stateFromBlocks(deepTreeBlocks());
    const { state } = await applyDragDrop(initial, "b", "c", deepRootIds());

    expectBlock(state, "b", { parentId: "a" });
    expectBlock(state, "d", { parentId: "b" });
    expect(childIds(state, "b")).toEqual(["d"]);
  });

  it("keeps nested descendants when promoting a child to root", async () => {
    const initial = stateFromBlocks(deepTreeBlocks());
    const { state } = await applyDragDrop(initial, "c", "a", deepRootIds());

    expectBlock(state, "c", { parentId: null });
    expect(childIds(state, "c")).toEqual(["f"]);
    expectBlock(state, "f", { parentId: "c" });
    expect(childIds(state, "a")).toEqual(["e"]);
  });
});
