/** @typedef {import('../../types/models').Block} Block */

import { describe, expect, it } from "vitest";
import {
  applyChangeToState,
  getBlockFromState,
  getDayRootsFromState,
} from "./cache/blockCacheState";
import { buildRescheduleToDayUpdates } from "../../utils/blockTree";
import { sortKeyBetween } from "../../utils/sortKey";
import {
  buildMoveSnapshot,
  buildTreeChange,
} from "./changes/buildBlockChanges";
import { stateFromBlocks } from "./test/dragDropHelpers";
import { DATE, makeBlock } from "./test/fixtures";

/** @param {import('./cache/blockCacheState.js').BlockCacheState} state @param {string} id @param {Record<string, unknown>} partial */
function expectBlock(state, id, partial) {
  const block = state.blocks.get(id);
  expect(block).toBeDefined();
  expect(block).toMatchObject(partial);
}

describe("buildRescheduleToDayUpdates", () => {
  const SOURCE_DAY = "2025-06-10";
  const TARGET_DAY = "2025-06-15";

  it("moves a root block to the end of the target day", () => {
    const blockA = makeBlock({
      id: "a",
      day: SOURCE_DAY,
      createdAt: `${SOURCE_DAY}T10:00:00.000Z`,
      sortKey: sortKeyBetween(null, null),
      properties: { title: "A", checked: false, language: "" },
    });
    const blockB = makeBlock({
      id: "b",
      day: TARGET_DAY,
      createdAt: `${TARGET_DAY}T10:00:00.000Z`,
      sortKey: sortKeyBetween(null, null),
      properties: { title: "B", checked: false, language: "" },
    });

    const sourceBlocks = [blockA];
    const targetBlocks = [blockB];
    const updates = buildRescheduleToDayUpdates(
      "a",
      sourceBlocks,
      TARGET_DAY,
      targetBlocks,
    );

    expect(updates).toEqual([
      expect.objectContaining({
        id: "a",
        day: TARGET_DAY,
        parentId: null,
      }),
    ]);

    const initial = stateFromBlocks([blockA, blockB]);
    const change = buildTreeChange(
      buildMoveSnapshot(blockA, null, null),
      /** @type {Block[]} */ updates,
    );
    const state = applyChangeToState(initial, change);

    expect(getDayRootsFromState(state, SOURCE_DAY)).toEqual([]);
    expect(
      getDayRootsFromState(state, TARGET_DAY).map((block) => block.id),
    ).toEqual(["b", "a"]);
    expectBlock(state, "a", { day: TARGET_DAY, parentId: null });
  });

  it("moves a nested block and its subtree to the target day as root", () => {
    const parent = makeBlock({
      id: "parent",
      day: SOURCE_DAY,
      createdAt: `${SOURCE_DAY}T10:00:00.000Z`,
      sortKey: sortKeyBetween(null, null),
      properties: { title: "Parent", checked: false, language: "" },
    });
    const child = makeBlock({
      id: "child",
      day: SOURCE_DAY,
      parentId: "parent",
      createdAt: `${SOURCE_DAY}T10:30:00.000Z`,
      sortKey: sortKeyBetween(null, null),
      properties: { title: "Child", checked: false, language: "" },
    });
    const grandchild = makeBlock({
      id: "grandchild",
      day: SOURCE_DAY,
      parentId: "child",
      createdAt: `${SOURCE_DAY}T10:45:00.000Z`,
      sortKey: sortKeyBetween(null, null),
      properties: { title: "Grandchild", checked: false, language: "" },
    });

    const sourceBlocks = [parent, child, grandchild];
    const updates = buildRescheduleToDayUpdates(
      "child",
      sourceBlocks,
      TARGET_DAY,
      [],
    );

    expect(updates).toEqual([
      expect.objectContaining({
        id: "child",
        day: TARGET_DAY,
        parentId: null,
      }),
      expect.objectContaining({
        id: "grandchild",
        day: TARGET_DAY,
        parentId: "child",
      }),
    ]);

    const initial = stateFromBlocks(sourceBlocks);
    const change = buildTreeChange(
      buildMoveSnapshot(child, parent, null),
      /** @type {Block[]} */ updates,
    );
    const state = applyChangeToState(initial, change);

    expect(getBlockFromState(state, "parent")).toBeDefined();
    expectBlock(state, "child", { day: TARGET_DAY, parentId: null });
    expectBlock(state, "grandchild", { day: TARGET_DAY, parentId: "child" });
  });

  it("returns null when target day equals source day", () => {
    const block = makeBlock({
      id: "a",
      day: DATE,
      createdAt: `${DATE}T10:00:00.000Z`,
      sortKey: sortKeyBetween(null, null),
      properties: { title: "A", checked: false, language: "" },
    });

    expect(buildRescheduleToDayUpdates("a", [block], DATE, [block])).toBeNull();
  });
});
