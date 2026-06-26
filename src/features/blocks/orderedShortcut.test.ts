import { describe, expect, it } from "vitest";
import { parseOrderedShortcut } from "./useBlockTitleShortcuts";

describe("parseOrderedShortcut", () => {
  it("parses empty title from digit prefix", () => {
    expect(parseOrderedShortcut("1. ")).toEqual({ title: "" });
    expect(parseOrderedShortcut("2. ")).toEqual({ title: "" });
    expect(parseOrderedShortcut("99. ")).toEqual({ title: "" });
  });

  it("parses title after prefix", () => {
    expect(parseOrderedShortcut("2. Punkt")).toEqual({ title: "Punkt" });
    expect(parseOrderedShortcut("1. Erster Punkt")).toEqual({
      title: "Erster Punkt",
    });
  });

  it("returns null without trailing space", () => {
    expect(parseOrderedShortcut("1.")).toBeNull();
  });

  it("returns null when prefix is not at line start", () => {
    expect(parseOrderedShortcut("abc1. foo")).toBeNull();
  });

  it("does not match heading shortcuts", () => {
    expect(parseOrderedShortcut("# Überschrift")).toBeNull();
  });
});
