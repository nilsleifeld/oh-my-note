import { describe, expect, it } from "vitest";
import { searchBlocksInCorpus } from "./blockSearch";
import type { Block } from "../types/models";

function textBlock(id: string, title: string, day = "2024-06-01"): Block {
  return {
    id,
    type: "text",
    parentId: null,
    day,
    createdAt: `${day}T10:00:00.000Z`,
    sortKey: id,
    properties: {
      title,
      checked: false,
      language: "",
      imageData: "",
      open: true,
    },
    comments: [],
  };
}

describe("searchBlocksInCorpus", () => {
  const blocks = [
    textBlock("a", "Meeting notes today", "2024-06-02"),
    textBlock("b", "Shopping list", "2024-06-02"),
    textBlock("c", "Archive entry", "2024-06-01"),
    {
      ...textBlock("img", "", "2024-06-02"),
      type: "image" as const,
    },
    {
      ...textBlock("ord", "Numbered item", "2024-06-02"),
      type: "ordered" as const,
    },
  ];

  it("returns browse results when query is empty", () => {
    const page = searchBlocksInCorpus(blocks, { query: "" });

    expect(page.searchableTotal).toBe(4);
    expect(page.items).toHaveLength(4);
    expect(page.items[0]?.block.id).toBe("a");
    expect(page.items[0]?.indices).toEqual([]);
  });

  it("fuzzy-matches titles and returns highlight indices", () => {
    const page = searchBlocksInCorpus(blocks, { query: "meetng" });

    expect(page.searchableTotal).toBe(4);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.block.id).toBe("a");
    expect(page.items[0]?.indices.length).toBeGreaterThan(0);
  });

  it("paginates results", () => {
    const page = searchBlocksInCorpus(blocks, {
      query: "",
      page: 0,
      pageSize: 1,
    });

    expect(page.items).toHaveLength(1);
    expect(page.total).toBe(4);
    expect(page.hasMore).toBe(true);
  });

  it("includes ordered blocks in searchable corpus", () => {
    const page = searchBlocksInCorpus(blocks, { query: "Numbered" });

    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.block.type).toBe("ordered");
  });
});
