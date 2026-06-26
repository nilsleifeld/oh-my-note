import { describe, expect, it } from "vitest";
import type { Block, BlockType } from "../types/models";
import { orderedListIndex } from "./blockTree";

const DAY = "2024-06-01";

function block(
  id: string,
  type: BlockType,
  opts: { parentId?: string | null; sortKey?: string } = {},
): Block {
  return {
    id,
    type,
    parentId: opts.parentId ?? null,
    day: DAY,
    createdAt: `${DAY}T10:00:00.000Z`,
    sortKey: opts.sortKey ?? id,
    properties: {
      title: "",
      checked: false,
      language: "",
      imageData: "",
      open: true,
    },
    comments: [],
  };
}

describe("orderedListIndex", () => {
  it("returns 1 for a single ordered root block", () => {
    const blocks = [block("a", "ordered")];
    expect(orderedListIndex("a", blocks, DAY)).toBe(1);
  });

  it("returns 1, 2, 3 for consecutive ordered root blocks", () => {
    const blocks = [
      block("a", "ordered", { sortKey: "a" }),
      block("b", "ordered", { sortKey: "b" }),
      block("c", "ordered", { sortKey: "c" }),
    ];
    expect(orderedListIndex("a", blocks, DAY)).toBe(1);
    expect(orderedListIndex("b", blocks, DAY)).toBe(2);
    expect(orderedListIndex("c", blocks, DAY)).toBe(3);
  });

  it("resets numbering after-ordered list is interrupted by text", () => {
    const blocks = [
      block("a", "ordered", { sortKey: "a" }),
      block("b", "text", { sortKey: "b" }),
      block("c", "ordered", { sortKey: "c" }),
    ];
    expect(orderedListIndex("a", blocks, DAY)).toBe(1);
    expect(orderedListIndex("c", blocks, DAY)).toBe(1);
  });

  it("resets numbering when interrupted by bullet or todo", () => {
    const blocks = [
      block("a", "ordered", { sortKey: "a" }),
      block("b", "bullet", { sortKey: "b" }),
      block("c", "ordered", { sortKey: "c" }),
      block("d", "todo", { sortKey: "d" }),
      block("e", "ordered", { sortKey: "e" }),
    ];
    expect(orderedListIndex("a", blocks, DAY)).toBe(1);
    expect(orderedListIndex("c", blocks, DAY)).toBe(1);
    expect(orderedListIndex("e", blocks, DAY)).toBe(1);
  });

  it("numbers only among siblings under the same parent", () => {
    const blocks = [
      block("parent", "text", { sortKey: "p" }),
      block("a", "ordered", { parentId: "parent", sortKey: "a" }),
      block("b", "ordered", { parentId: "parent", sortKey: "b" }),
      block("c", "ordered", { sortKey: "c" }),
    ];
    expect(orderedListIndex("a", blocks, DAY)).toBe(1);
    expect(orderedListIndex("b", blocks, DAY)).toBe(2);
    expect(orderedListIndex("c", blocks, DAY)).toBe(1);
  });
});
